import { InteractivityChecker } from '@angular/cdk/a11y';
import { DestroyRef, Injectable, inject } from '@angular/core';
import { deleteKrnDocumentRuntimeChannel, getKrnDocumentRuntimeChannel } from './document-runtime';
import { KRN_PLATFORM, krnIsElement, krnIsHtmlElement } from './platform';
import type { KrnCloseWatcher, KrnPlatformAdapter } from './platform';

export type KrnOverlayInitialFocus = 'first-tabbable' | 'surface' | string;

interface OverlayLease {
  readonly platform: KrnPlatformAdapter;
  released: boolean;
}

interface ActiveOverlay {
  readonly lease: OverlayLease;
  readonly id: string;
  readonly host: HTMLElement | null;
  readonly restoreFocus: HTMLElement | null;
  closeRequest: (() => void) | null;
}

interface OverlayOwnership {
  readonly lease: OverlayLease;
  readonly origin: HTMLElement;
}

interface BackgroundState {
  readonly inert: boolean;
  readonly inertAttribute: boolean;
  readonly ariaHidden: string | null;
  readonly modalBackground: string | null;
}

interface PointerOrigin {
  readonly element: HTMLElement;
  readonly platform: KrnPlatformAdapter;
  readonly at: number;
}

const tabbableSelector = [
  '[data-krn-initial-focus]',
  '[autofocus]',
  'button:not([disabled])',
  'a[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const modalBackgroundAttribute = 'data-krn-modal-background';
const overlayBrokerChannel = Symbol.for('@kern-ui/angular/cdk/overlay-broker/v1');

/** Owns the single modal stack and all global side effects for one browser document. */
class DocumentOverlayBroker {
  readonly #leases = new Set<OverlayLease>();
  readonly #stack: ActiveOverlay[] = [];
  readonly #background = new Map<HTMLElement, BackgroundState>();
  readonly #overlayOrigins = new WeakMap<HTMLElement, OverlayOwnership>();
  #closeBindingEntry: ActiveOverlay | null = null;
  #closeBindingRequest: (() => void) | null = null;
  #closeWatcher: KrnCloseWatcher | null = null;
  #closeWatcherCancelListener: EventListener | null = null;
  #closeWatcherCloseListener: EventListener | null = null;
  #fallbackEscapeListener: ((event: KeyboardEvent) => void) | null = null;
  #observer: MutationObserver | null = null;
  #previousOverflow = '';
  #recentPointerOrigin: PointerOrigin | null = null;

  constructor(readonly document: Document) {}

  acquire(platform: KrnPlatformAdapter): OverlayLease {
    const lease: OverlayLease = { platform, released: false };
    this.#leases.add(lease);
    if (this.#leases.size === 1) {
      this.document.addEventListener('pointerdown', this.#rememberPointerOrigin, true);
      this.document.addEventListener('mousedown', this.#rememberPointerOrigin, true);
    }
    return lease;
  }

  release(lease: OverlayLease): void {
    if (lease.released) return;
    lease.released = true;

    const previousTop = this.#stack.at(-1);
    let removedOverlay = false;
    for (let index = this.#stack.length - 1; index >= 0; index -= 1) {
      if (this.#stack[index]?.lease === lease) {
        this.#stack.splice(index, 1);
        removedOverlay = true;
      }
    }
    this.#leases.delete(lease);

    if (removedOverlay) {
      if (previousTop !== this.#stack.at(-1)) this.#syncCloseRequestBinding();
      if (this.#stack.length > 0) this.#syncBackground();
      else this.#endModalState();
    }

    if (this.#leases.size === 0) {
      this.#clearCloseRequestBinding();
      this.document.removeEventListener('pointerdown', this.#rememberPointerOrigin, true);
      this.document.removeEventListener('mousedown', this.#rememberPointerOrigin, true);
      this.#recentPointerOrigin = null;
      deleteKrnDocumentRuntimeChannel(this.document, overlayBrokerChannel, this);
    }
  }

  activate(
    lease: OverlayLease,
    id: string,
    host: HTMLElement | null,
    restoreFocus: HTMLElement | false | null,
    closeRequest: (() => void) | null,
  ): void {
    if (lease.released) return;

    const existingIndex = this.#find(lease, id);
    const existing = existingIndex >= 0 ? this.#stack.splice(existingIndex, 1)[0] : undefined;
    if (this.#stack.length === 0 && !existing) this.#beginModalState(lease.platform);

    this.#stack.push({
      lease,
      id,
      host,
      restoreFocus: existing
        ? existing.restoreFocus
        : this.#resolveRestoreFocus(lease.platform, restoreFocus),
      closeRequest,
    });
    this.#startObserving(lease.platform);
    this.#syncBackground();
    this.#syncCloseRequestBinding();
  }

  deactivate(
    lease: OverlayLease,
    id: string,
    focusRestoreDelay: number,
    shouldRestoreFocus: boolean,
  ): void {
    if (lease.released) return;

    const index = this.#find(lease, id);
    if (index < 0) return;
    const wasTop = index === this.#stack.length - 1;
    const [entry] = this.#stack.splice(index, 1);
    this.#syncCloseRequestBinding();

    if (this.#stack.length > 0) this.#syncBackground();
    else this.#endModalState();

    if (shouldRestoreFocus && wasTop && entry?.restoreFocus) {
      const restoreFocus = (): void => {
        if (entry.restoreFocus?.isConnected && !this.#isInert(entry.restoreFocus)) {
          entry.restoreFocus.focus({ preventScroll: true });
        }
      };
      if (focusRestoreDelay > 0) {
        if (entry.lease.platform.schedule(restoreFocus, focusRestoreDelay) === null) restoreFocus();
      } else {
        entry.lease.platform.queueMicrotask(restoreFocus);
      }
    }
  }

  updateCloseRequest(lease: OverlayLease, id: string, closeRequest: (() => void) | null): void {
    if (lease.released) return;

    const entry = this.#stack[this.#find(lease, id)];
    if (!entry || entry.closeRequest === closeRequest) return;
    entry.closeRequest = closeRequest;
    this.#syncCloseRequestBinding();
  }

  isTop(lease: OverlayLease, id: string): boolean {
    const top = this.#stack.at(-1);
    return !lease.released && top?.lease === lease && top.id === id;
  }

  registerOverlayOwnership(
    lease: OverlayLease,
    origin: HTMLElement,
    pane: HTMLElement,
    backdrop: HTMLElement | null,
  ): void {
    if (lease.released) return;
    for (const element of [pane, backdrop]) {
      const branch = element ? this.#overlayContainerBranch(element) : null;
      if (branch) this.#overlayOrigins.set(branch, { lease, origin });
    }
    if (this.#stack.length > 0) this.#syncBackground();
  }

  isOwnedBy(owner: HTMLElement, target: EventTarget | null): boolean {
    const platform = this.#currentPlatform();
    if (!platform || !krnIsElement(platform, target)) return false;
    if (owner.contains(target)) return true;

    const element = krnIsHtmlElement(platform, target) ? target : target.parentElement;
    let branch = element ? this.#overlayContainerBranch(element) : null;
    const visited = new Set<HTMLElement>();

    while (branch && !visited.has(branch)) {
      visited.add(branch);
      const ownership = this.#overlayOrigins.get(branch);
      if (ownership?.lease.released || !ownership?.origin.isConnected) return false;
      if (owner.contains(ownership.origin)) return true;
      branch = this.#overlayContainerBranch(ownership.origin);
    }

    return false;
  }

  #find(lease: OverlayLease, id: string): number {
    return this.#stack.findIndex((entry) => entry.lease === lease && entry.id === id);
  }

  #beginModalState(platform: KrnPlatformAdapter): void {
    this.#previousOverflow = this.document.body.style.overflow;
    this.document.body.style.overflow = 'hidden';
    this.#startObserving(platform);
  }

  #endModalState(): void {
    this.#stopObserving();
    this.#restoreBackground();
    this.document.body.style.overflow = this.#previousOverflow;
  }

  #startObserving(platform: KrnPlatformAdapter): void {
    const Observer = platform.window?.MutationObserver;
    if (!Observer || this.#observer) return;

    this.#observer = new Observer((records) => {
      if (
        this.#stack.length > 0 &&
        records.some((record) => record.addedNodes.length > 0 || record.removedNodes.length > 0)
      ) {
        this.#syncBackground();
      }
    });
    this.#observer.observe(this.document.body, { childList: true, subtree: true });
  }

  #stopObserving(): void {
    this.#observer?.disconnect();
    this.#observer = null;
  }

  #resolveRestoreFocus(
    platform: KrnPlatformAdapter,
    activeElement: HTMLElement | false | null,
  ): HTMLElement | null {
    const pointerOrigin = this.#recentPointerOrigin;
    this.#recentPointerOrigin = null;

    if (activeElement === false) return null;
    if (
      activeElement?.isConnected &&
      activeElement !== this.document.body &&
      activeElement !== this.document.documentElement
    ) {
      return activeElement;
    }

    if (
      pointerOrigin &&
      pointerOrigin.platform.now() - pointerOrigin.at <= 1_000 &&
      pointerOrigin.element.isConnected
    ) {
      return pointerOrigin.element;
    }

    const documentActiveElement = this.document.activeElement;
    if (
      krnIsHtmlElement(platform, documentActiveElement) &&
      documentActiveElement.isConnected &&
      documentActiveElement !== this.document.body &&
      documentActiveElement !== this.document.documentElement
    ) {
      return documentActiveElement;
    }
    return null;
  }

  #syncCloseRequestBinding(): void {
    const top = this.#stack.at(-1) ?? null;
    const closeRequest = top?.closeRequest ?? null;
    if (top && this.#closeBindingEntry === top && this.#closeBindingRequest === closeRequest)
      return;

    this.#clearCloseRequestBinding();
    if (!top) return;

    this.#closeBindingEntry = top;
    this.#closeBindingRequest = closeRequest;

    let watcher: KrnCloseWatcher | null = null;
    try {
      watcher = top.lease.platform.createCloseWatcher?.() ?? null;
    } catch {
      watcher = null;
    }

    if (watcher) {
      const cancelListener: EventListener = (event) => {
        if (this.#stack.at(-1) !== top || top.closeRequest !== closeRequest) return;
        if (!closeRequest && event.cancelable) event.preventDefault();
      };
      const closeListener: EventListener = () => {
        if (this.#stack.at(-1) !== top || top.closeRequest !== closeRequest) return;
        try {
          closeRequest?.();
        } finally {
          if (this.#closeWatcher === watcher) {
            this.#clearCloseRequestBinding();
            this.#syncCloseRequestBinding();
          }
        }
      };
      try {
        watcher.addEventListener('cancel', cancelListener);
        watcher.addEventListener('close', closeListener);
        this.#closeWatcher = watcher;
        this.#closeWatcherCancelListener = cancelListener;
        this.#closeWatcherCloseListener = closeListener;
        return;
      } catch {
        try {
          watcher.destroy();
        } catch {
          // A custom adapter must not prevent the keyboard fallback.
        }
      }
    }

    const listener = (event: KeyboardEvent): void => {
      if (
        event.key !== 'Escape' ||
        event.defaultPrevented ||
        this.#stack.at(-1) !== top ||
        top.closeRequest !== closeRequest
      ) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      closeRequest?.();
    };
    this.#fallbackEscapeListener = listener;
    this.document.addEventListener('keydown', listener);
  }

  #clearCloseRequestBinding(): void {
    if (this.#closeWatcher && this.#closeWatcherCancelListener) {
      try {
        this.#closeWatcher.removeEventListener('cancel', this.#closeWatcherCancelListener);
      } catch {
        // Cleanup remains best-effort for application-supplied structural adapters.
      }
    }
    if (this.#closeWatcher && this.#closeWatcherCloseListener) {
      try {
        this.#closeWatcher.removeEventListener('close', this.#closeWatcherCloseListener);
      } catch {
        // Cleanup remains best-effort for application-supplied structural adapters.
      }
    }
    if (this.#closeWatcher) {
      try {
        this.#closeWatcher.destroy();
      } catch {
        // Cleanup remains best-effort for application-supplied structural adapters.
      }
    }
    if (this.#fallbackEscapeListener) {
      this.document.removeEventListener('keydown', this.#fallbackEscapeListener);
    }

    this.#closeBindingEntry = null;
    this.#closeBindingRequest = null;
    this.#closeWatcher = null;
    this.#closeWatcherCancelListener = null;
    this.#closeWatcherCloseListener = null;
    this.#fallbackEscapeListener = null;
  }

  #syncBackground(): void {
    this.#restoreBackground();
    const top = this.#stack.at(-1);
    if (!top?.host) return;

    const hideBackgroundBranch = (element: HTMLElement): void => {
      if (this.#belongsToTopOverlay(element, top)) return;
      if (element.classList.contains('cdk-overlay-container')) {
        for (const child of element.children) {
          if (
            krnIsHtmlElement(top.lease.platform, child) &&
            !this.#belongsToTopOverlay(child, top)
          ) {
            this.#hide(child);
          }
        }
        return;
      }
      if (!element.querySelector('.cdk-overlay-container')) {
        this.#hide(element);
        return;
      }
      for (const child of element.children) {
        if (krnIsHtmlElement(top.lease.platform, child)) hideBackgroundBranch(child);
      }
    };

    let branch: HTMLElement = top.host;
    let parent = branch.parentElement;
    while (parent) {
      for (const sibling of parent.children) {
        if (sibling !== branch && krnIsHtmlElement(top.lease.platform, sibling)) {
          hideBackgroundBranch(sibling);
        }
      }
      if (parent === this.document.body) break;
      branch = parent;
      parent = parent.parentElement;
    }
  }

  #belongsToTopOverlay(branch: HTMLElement, top: ActiveOverlay): boolean {
    if (!top.host) return false;
    return this.#originBelongsToHost(branch, top.host, new Set<HTMLElement>());
  }

  #originBelongsToHost(branch: HTMLElement, host: HTMLElement, visited: Set<HTMLElement>): boolean {
    if (visited.has(branch)) return false;
    visited.add(branch);

    const ownership = this.#overlayOrigins.get(branch);
    if (ownership?.lease.released || !ownership?.origin.isConnected) return false;
    if (host.contains(ownership.origin)) return true;

    const parentBranch = this.#overlayContainerBranch(ownership.origin);
    return parentBranch ? this.#originBelongsToHost(parentBranch, host, visited) : false;
  }

  #overlayContainerBranch(element: HTMLElement): HTMLElement | null {
    let branch = element;
    let parent = branch.parentElement;
    while (parent && !parent.classList.contains('cdk-overlay-container')) {
      branch = parent;
      parent = parent.parentElement;
    }
    return parent?.classList.contains('cdk-overlay-container') ? branch : null;
  }

  #hide(element: HTMLElement): void {
    if (this.#background.has(element)) return;
    this.#background.set(element, {
      inert: element.inert === true,
      inertAttribute: element.hasAttribute('inert'),
      ariaHidden: element.getAttribute('aria-hidden'),
      modalBackground: element.getAttribute(modalBackgroundAttribute),
    });
    element.inert = true;
    element.setAttribute('inert', '');
    element.setAttribute('aria-hidden', 'true');
    element.setAttribute(modalBackgroundAttribute, '');
  }

  #restoreBackground(): void {
    for (const [element, state] of this.#background) {
      element.inert = state.inert;
      if (state.inertAttribute) element.setAttribute('inert', '');
      else element.removeAttribute('inert');
      if (state.ariaHidden === null) element.removeAttribute('aria-hidden');
      else element.setAttribute('aria-hidden', state.ariaHidden);
      if (state.modalBackground === null) element.removeAttribute(modalBackgroundAttribute);
      else element.setAttribute(modalBackgroundAttribute, state.modalBackground);
    }
    this.#background.clear();
  }

  #isInert(element: HTMLElement): boolean {
    let current: HTMLElement | null = element;
    while (current) {
      if (current.inert) return true;
      current = current.parentElement;
    }
    return false;
  }

  #currentPlatform(): KrnPlatformAdapter | null {
    return this.#stack.at(-1)?.lease.platform ?? [...this.#leases].at(-1)?.platform ?? null;
  }

  readonly #rememberPointerOrigin = (event: Event): void => {
    const platform = this.#currentPlatform();
    if (!platform || !krnIsElement(platform, event.target)) return;
    const candidate = event.target.closest<HTMLElement>(tabbableSelector);
    if (!krnIsHtmlElement(platform, candidate) || candidate.tabIndex < 0) return;
    this.#recentPointerOrigin = { element: candidate, platform, at: platform.now() };
  };
}

function acquireOverlayBroker(platform: KrnPlatformAdapter): {
  readonly broker: DocumentOverlayBroker;
  readonly lease: OverlayLease;
} {
  const broker = getKrnDocumentRuntimeChannel<DocumentOverlayBroker>(
    platform.document,
    overlayBrokerChannel,
    () => new DocumentOverlayBroker(platform.document),
  );
  return { broker, lease: broker.acquire(platform) };
}

/**
 * Injector-scoped facade over the modal coordinator shared by one `Document`.
 *
 * Multiple Angular roots therefore share one stack, one close watcher, one
 * scroll lock and one background state, while identical local overlay IDs stay
 * isolated by the facade lease.
 */
@Injectable({ providedIn: 'root' })
export class KrnOverlayCoordinator {
  readonly #platform = inject(KRN_PLATFORM);
  readonly #interactivity = inject(InteractivityChecker);
  readonly #destroyRef = inject(DestroyRef);
  readonly #broker: DocumentOverlayBroker | null;
  readonly #lease: OverlayLease | null;

  constructor() {
    if (!this.#platform.isBrowser) {
      this.#broker = null;
      this.#lease = null;
      return;
    }

    const { broker, lease } = acquireOverlayBroker(this.#platform);
    this.#broker = broker;
    this.#lease = lease;
    this.#destroyRef.onDestroy(() => broker.release(lease));
  }

  activate(
    id: string,
    host: HTMLElement | null = null,
    restoreFocus: HTMLElement | false | null = null,
    closeRequest: (() => void) | null = null,
  ): void {
    if (this.#lease) this.#broker?.activate(this.#lease, id, host, restoreFocus, closeRequest);
  }

  deactivate(id: string, focusRestoreDelay = 0, shouldRestoreFocus = true): void {
    if (this.#lease) {
      this.#broker?.deactivate(this.#lease, id, focusRestoreDelay, shouldRestoreFocus);
    }
  }

  /** Updates close behavior without changing the overlay's position in the active stack. */
  updateCloseRequest(id: string, closeRequest: (() => void) | null): void {
    if (this.#lease) this.#broker?.updateCloseRequest(this.#lease, id, closeRequest);
  }

  isTop(id: string): boolean {
    return this.#lease ? (this.#broker?.isTop(this.#lease, id) ?? false) : false;
  }

  /**
   * Associates a CDK overlay branch with the element that opened it.
   *
   * Kern components call this after attachment. Custom overlay primitives that use the
   * `krn-overlay-pane` marker must register too, otherwise a modal treats their branch as
   * unrelated background content.
   */
  registerOverlayOwnership(
    origin: HTMLElement,
    pane: HTMLElement,
    backdrop: HTMLElement | null = null,
  ): void {
    if (this.#lease) {
      this.#broker?.registerOverlayOwnership(this.#lease, origin, pane, backdrop);
    }
  }

  /**
   * Returns whether an event/focus target belongs to an overlay opened from
   * `owner`, including recursively nested overlay branches.
   *
   * This is the active-zone boundary used by non-modal connected overlays:
   * moving focus or a pointer into a child dropdown must not close its parent.
   */
  isOwnedBy(owner: HTMLElement, target: EventTarget | null): boolean {
    return this.#broker?.isOwnedBy(owner, target) ?? false;
  }

  focusInitial(panel: HTMLElement, initialFocus: KrnOverlayInitialFocus): void {
    if (!this.#platform.isBrowser) return;

    const target =
      initialFocus === 'surface'
        ? panel
        : initialFocus === 'first-tabbable'
          ? this.#firstTabbable(panel)
          : this.#queryWithin(panel, initialFocus);
    (target ?? panel).focus({ preventScroll: true });
  }

  #firstTabbable(panel: HTMLElement): HTMLElement | null {
    return (
      [...panel.querySelectorAll<HTMLElement>(tabbableSelector)].find((element) =>
        this.#interactivity.isFocusable(element),
      ) ?? null
    );
  }

  #queryWithin(panel: HTMLElement, selector: string): HTMLElement | null {
    try {
      const element = panel.querySelector<HTMLElement>(selector);
      return element && this.#interactivity.isFocusable(element) ? element : null;
    } catch {
      return null;
    }
  }
}
