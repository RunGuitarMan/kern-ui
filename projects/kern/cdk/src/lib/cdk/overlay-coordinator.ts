import { InteractivityChecker } from '@angular/cdk/a11y';
import { DestroyRef, Injectable, inject } from '@angular/core';
import { KRN_PLATFORM, krnIsElement, krnIsHtmlElement } from './platform';
import type { KrnCloseWatcher, KrnPlatformAdapter } from './platform';

export type KrnOverlayInitialFocus = 'first-tabbable' | 'surface' | string;

interface ActiveOverlay {
  readonly id: string;
  readonly host: HTMLElement | null;
  readonly restoreFocus: HTMLElement | null;
  readonly closeRequest: (() => void) | null;
}

interface BackgroundState {
  readonly inert: boolean;
  readonly inertAttribute: boolean;
  readonly ariaHidden: string | null;
  readonly modalBackground: string | null;
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

const overlayObservers = new WeakMap<object, MutationObserver>();
const modalBackgroundAttribute = 'data-krn-modal-background';

function startObservingOverlayBranches(
  owner: object,
  platform: KrnPlatformAdapter,
  synchronize: () => void,
): void {
  const Observer = platform.window?.MutationObserver;
  if (!Observer || overlayObservers.has(owner)) return;

  const observer = new Observer((records) => {
    if (records.some((record) => record.addedNodes.length > 0 || record.removedNodes.length > 0)) {
      synchronize();
    }
  });
  observer.observe(platform.document.body, {
    childList: true,
    subtree: true,
  });
  overlayObservers.set(owner, observer);
}

function stopObservingOverlayBranches(owner: object): void {
  overlayObservers.get(owner)?.disconnect();
  overlayObservers.delete(owner);
}

/**
 * Coordinates modal surfaces rendered in the application tree.
 *
 * The coordinator deliberately owns global side effects so that nested dialogs
 * share one scroll lock, only the top surface receives Escape, and background
 * content is restored to its exact previous state.
 */
@Injectable({ providedIn: 'root' })
export class KrnOverlayCoordinator {
  private readonly platform = inject(KRN_PLATFORM);
  private readonly interactivity = inject(InteractivityChecker);
  private readonly destroyRef = inject(DestroyRef);
  private readonly stack: ActiveOverlay[] = [];
  private readonly background = new Map<HTMLElement, BackgroundState>();
  private readonly overlayOrigins = new WeakMap<HTMLElement, HTMLElement>();
  private closeBindingId: string | null = null;
  private closeBindingRequest: (() => void) | null = null;
  private closeWatcher: KrnCloseWatcher | null = null;
  private closeWatcherListener: EventListener | null = null;
  private fallbackEscapeListener: ((event: KeyboardEvent) => void) | null = null;
  private previousOverflow = '';
  private recentPointerOrigin: { readonly element: HTMLElement; readonly at: number } | null = null;

  constructor() {
    if (!this.platform.isBrowser) return;

    const rememberPointerOrigin = (event: Event): void => {
      if (!krnIsElement(this.platform, event.target)) return;
      const candidate = event.target.closest<HTMLElement>(tabbableSelector);
      if (!krnIsHtmlElement(this.platform, candidate) || candidate.tabIndex < 0) {
        return;
      }
      this.recentPointerOrigin = {
        element: candidate,
        at: this.platform.now(),
      };
    };

    this.platform.document.addEventListener('pointerdown', rememberPointerOrigin, true);
    this.platform.document.addEventListener('mousedown', rememberPointerOrigin, true);
    this.destroyRef.onDestroy(() => {
      this.platform.document.removeEventListener('pointerdown', rememberPointerOrigin, true);
      this.platform.document.removeEventListener('mousedown', rememberPointerOrigin, true);
      this.clearCloseRequestBinding();
      stopObservingOverlayBranches(this);
      if (this.stack.length > 0) {
        this.stack.length = 0;
        this.restoreBackground();
        this.platform.document.body.style.overflow = this.previousOverflow;
      }
    });
  }

  activate(
    id: string,
    host: HTMLElement | null = null,
    restoreFocus: HTMLElement | false | null = null,
    closeRequest: (() => void) | null = null,
  ): void {
    if (!this.platform.isBrowser) return;
    const document = this.platform.document;

    const existingIndex = this.stack.findIndex((entry) => entry.id === id);
    const existing = existingIndex >= 0 ? this.stack.splice(existingIndex, 1)[0] : undefined;
    if (!this.stack.length && !existing) {
      this.previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      startObservingOverlayBranches(this, this.platform, () => {
        if (this.stack.length > 0) this.syncBackground();
      });
    }

    this.stack.push({
      id,
      host,
      restoreFocus: existing ? existing.restoreFocus : this.resolveRestoreFocus(restoreFocus),
      closeRequest,
    });
    this.syncBackground();
    this.syncCloseRequestBinding();
  }

  deactivate(id: string, focusRestoreDelay = 0, shouldRestoreFocus = true): void {
    if (!this.platform.isBrowser) return;

    const index = this.stack.findIndex((entry) => entry.id === id);
    if (index < 0) return;
    const wasTop = index === this.stack.length - 1;
    const [entry] = this.stack.splice(index, 1);
    this.syncCloseRequestBinding();

    if (!this.stack.length) {
      stopObservingOverlayBranches(this);
      this.restoreBackground();
      this.platform.document.body.style.overflow = this.previousOverflow;
    } else {
      this.syncBackground();
    }

    if (shouldRestoreFocus && wasTop && entry?.restoreFocus) {
      const restoreFocus = (): void => {
        if (entry.restoreFocus?.isConnected && !this.isInert(entry.restoreFocus)) {
          entry.restoreFocus.focus({ preventScroll: true });
        }
      };
      if (focusRestoreDelay > 0) {
        if (this.platform.schedule(restoreFocus, focusRestoreDelay) === null) {
          restoreFocus();
        }
      } else {
        this.platform.queueMicrotask(restoreFocus);
      }
    }
  }

  /** Updates close behavior without changing the overlay's position in the active stack. */
  updateCloseRequest(id: string, closeRequest: (() => void) | null): void {
    if (!this.platform.isBrowser) return;

    const index = this.stack.findIndex((entry) => entry.id === id);
    const entry = this.stack[index];
    if (!entry || entry.closeRequest === closeRequest) return;
    this.stack[index] = { ...entry, closeRequest };
    this.syncCloseRequestBinding();
  }

  isTop(id: string): boolean {
    return this.stack.at(-1)?.id === id;
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
    if (!this.platform.isBrowser) return;
    for (const element of [pane, backdrop]) {
      const branch = element ? this.overlayContainerBranch(element) : null;
      if (branch) this.overlayOrigins.set(branch, origin);
    }
    if (this.stack.length > 0) this.syncBackground();
  }

  /**
   * Returns whether an event/focus target belongs to an overlay opened from
   * `owner`, including recursively nested overlay branches.
   *
   * This is the active-zone boundary used by non-modal connected overlays:
   * moving focus or a pointer into a child dropdown must not close its parent.
   */
  isOwnedBy(owner: HTMLElement, target: EventTarget | null): boolean {
    if (!this.platform.isBrowser || !krnIsElement(this.platform, target)) {
      return false;
    }
    if (owner.contains(target)) {
      return true;
    }

    const element = krnIsHtmlElement(this.platform, target) ? target : target.parentElement;
    let branch = element ? this.overlayContainerBranch(element) : null;
    const visited = new Set<HTMLElement>();

    while (branch && !visited.has(branch)) {
      visited.add(branch);
      const origin = this.overlayOrigins.get(branch);
      if (!origin?.isConnected) {
        return false;
      }
      if (owner.contains(origin)) {
        return true;
      }
      branch = this.overlayContainerBranch(origin);
    }

    return false;
  }

  focusInitial(panel: HTMLElement, initialFocus: KrnOverlayInitialFocus): void {
    if (!this.platform.isBrowser) return;

    const target =
      initialFocus === 'surface'
        ? panel
        : initialFocus === 'first-tabbable'
          ? this.firstTabbable(panel)
          : this.queryWithin(panel, initialFocus);
    (target ?? panel).focus({ preventScroll: true });
  }

  private firstTabbable(panel: HTMLElement): HTMLElement | null {
    return (
      [...panel.querySelectorAll<HTMLElement>(tabbableSelector)].find((element) =>
        this.interactivity.isFocusable(element),
      ) ?? null
    );
  }

  private resolveRestoreFocus(activeElement: HTMLElement | false | null): HTMLElement | null {
    const pointerOrigin = this.recentPointerOrigin;
    this.recentPointerOrigin = null;

    if (activeElement === false) {
      return null;
    }

    const document = this.platform.document;
    if (
      activeElement?.isConnected &&
      activeElement !== document.body &&
      activeElement !== document.documentElement
    ) {
      return activeElement;
    }

    if (
      pointerOrigin &&
      this.platform.now() - pointerOrigin.at <= 1_000 &&
      pointerOrigin.element.isConnected
    ) {
      return pointerOrigin.element;
    }

    const documentActiveElement = document.activeElement;
    if (
      krnIsHtmlElement(this.platform, documentActiveElement) &&
      documentActiveElement.isConnected &&
      documentActiveElement !== document.body &&
      documentActiveElement !== document.documentElement
    ) {
      return documentActiveElement;
    }
    return null;
  }

  private syncCloseRequestBinding(): void {
    const top = this.stack.at(-1);
    const closeRequest = top?.closeRequest ?? null;
    if (
      top &&
      closeRequest &&
      this.closeBindingId === top.id &&
      this.closeBindingRequest === closeRequest
    ) {
      return;
    }

    this.clearCloseRequestBinding();
    if (!top || !closeRequest) return;

    this.closeBindingId = top.id;
    this.closeBindingRequest = closeRequest;

    let watcher: KrnCloseWatcher | null = null;
    try {
      watcher = this.platform.createCloseWatcher?.() ?? null;
    } catch {
      watcher = null;
    }

    if (watcher) {
      const listener: EventListener = () => {
        const active = this.stack.at(-1);
        if (active?.id !== top.id || active.closeRequest !== closeRequest) return;
        try {
          closeRequest();
        } finally {
          if (this.closeWatcher === watcher) {
            this.clearCloseRequestBinding();
            this.syncCloseRequestBinding();
          }
        }
      };
      try {
        watcher.addEventListener('close', listener);
        this.closeWatcher = watcher;
        this.closeWatcherListener = listener;
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
      const active = this.stack.at(-1);
      if (
        event.key !== 'Escape' ||
        event.defaultPrevented ||
        active?.id !== top.id ||
        active.closeRequest !== closeRequest
      ) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      closeRequest();
    };
    this.fallbackEscapeListener = listener;
    this.platform.document.addEventListener('keydown', listener);
  }

  private clearCloseRequestBinding(): void {
    if (this.closeWatcher && this.closeWatcherListener) {
      try {
        this.closeWatcher.removeEventListener('close', this.closeWatcherListener);
      } catch {
        // Cleanup remains best-effort for application-supplied structural adapters.
      }
    }
    if (this.closeWatcher) {
      try {
        this.closeWatcher.destroy();
      } catch {
        // Cleanup remains best-effort for application-supplied structural adapters.
      }
    }
    if (this.fallbackEscapeListener) {
      this.platform.document.removeEventListener('keydown', this.fallbackEscapeListener);
    }

    this.closeBindingId = null;
    this.closeBindingRequest = null;
    this.closeWatcher = null;
    this.closeWatcherListener = null;
    this.fallbackEscapeListener = null;
  }

  private queryWithin(panel: HTMLElement, selector: string): HTMLElement | null {
    try {
      const element = panel.querySelector<HTMLElement>(selector);
      return element && this.interactivity.isFocusable(element) ? element : null;
    } catch {
      return null;
    }
  }

  private syncBackground(): void {
    this.restoreBackground();
    const top = this.stack.at(-1);
    if (!top?.host) return;

    const hideBackgroundBranch = (element: HTMLElement): void => {
      if (this.belongsToTopOverlay(element, top)) {
        return;
      }
      if (element.classList.contains('cdk-overlay-container')) {
        for (const child of element.children) {
          if (krnIsHtmlElement(this.platform, child) && !this.belongsToTopOverlay(child, top)) {
            this.hide(child);
          }
        }
        return;
      }
      if (!element.querySelector('.cdk-overlay-container')) {
        this.hide(element);
        return;
      }
      for (const child of element.children) {
        if (krnIsHtmlElement(this.platform, child)) {
          hideBackgroundBranch(child);
        }
      }
    };

    let branch: HTMLElement = top.host;
    let parent = branch.parentElement;
    while (parent) {
      for (const sibling of parent.children) {
        if (sibling !== branch && krnIsHtmlElement(this.platform, sibling)) {
          hideBackgroundBranch(sibling);
        }
      }
      if (parent === this.platform.document.body) break;
      branch = parent;
      parent = parent.parentElement;
    }
  }

  private belongsToTopOverlay(branch: HTMLElement, top: ActiveOverlay): boolean {
    if (!top.host) return false;
    return this.originBelongsToHost(branch, top.host, new Set<HTMLElement>());
  }

  private originBelongsToHost(
    branch: HTMLElement,
    host: HTMLElement,
    visited: Set<HTMLElement>,
  ): boolean {
    if (visited.has(branch)) return false;
    visited.add(branch);

    const origin = this.overlayOrigins.get(branch);
    if (!origin?.isConnected) return false;
    if (host.contains(origin)) return true;

    const parentBranch = this.overlayContainerBranch(origin);
    return parentBranch ? this.originBelongsToHost(parentBranch, host, visited) : false;
  }

  private overlayContainerBranch(element: HTMLElement): HTMLElement | null {
    let branch = element;
    let parent = branch.parentElement;
    while (parent && !parent.classList.contains('cdk-overlay-container')) {
      branch = parent;
      parent = parent.parentElement;
    }
    return parent?.classList.contains('cdk-overlay-container') ? branch : null;
  }

  private hide(element: HTMLElement): void {
    if (this.background.has(element)) return;
    this.background.set(element, {
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

  private restoreBackground(): void {
    for (const [element, state] of this.background) {
      element.inert = state.inert;
      if (state.inertAttribute) element.setAttribute('inert', '');
      else element.removeAttribute('inert');
      if (state.ariaHidden === null) element.removeAttribute('aria-hidden');
      else element.setAttribute('aria-hidden', state.ariaHidden);
      if (state.modalBackground === null) element.removeAttribute(modalBackgroundAttribute);
      else element.setAttribute(modalBackgroundAttribute, state.modalBackground);
    }
    this.background.clear();
  }

  private isInert(element: HTMLElement): boolean {
    let current: HTMLElement | null = element;
    while (current) {
      if (current.inert) return true;
      current = current.parentElement;
    }
    return false;
  }
}
