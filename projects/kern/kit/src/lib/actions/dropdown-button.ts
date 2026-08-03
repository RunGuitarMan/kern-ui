import type { CdkConnectedOverlay, ConnectedPosition } from '@angular/cdk/overlay';
import { OverlayModule } from '@angular/cdk/overlay';
import type { ModelSignal, Signal } from '@angular/core';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  model,
  numberAttribute,
  output,
  Renderer2,
  viewChild,
} from '@angular/core';
import {
  KRN_PLATFORM,
  KrnIdService,
  KrnOverlayCoordinator,
  krnIsElement,
  krnIsNode,
  type KrnScheduledHandle,
} from '@kern-ui/angular/cdk';
import { KRN_MORE_ACTIONS_LABEL } from '@kern-ui/angular/i18n';
import type { KrnActionVariant, KrnSize, KrnTone } from './action-types';
import { KrnButton } from './button';
import {
  KRN_MENU_BUTTON_DEFAULT_OPTIONS,
  KRN_MENU_BUTTON_OPTIONS,
  type KrnMenuAlignment,
} from './dropdown-button-options';

const MENU_ITEM_SELECTOR = '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]';
const PROJECTED_ACTION_SELECTOR =
  'button, a[href], [role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]';
const MENU_MUTATION_ATTRIBUTES = [
  'aria-hidden',
  'class',
  'disabled',
  'hidden',
  'href',
  'inert',
  'krnmenu',
  'open',
  'role',
  'style',
];
const TYPEAHEAD_RESET_DELAY = 500;

type KrnRequestedMenuFocus = 'first' | 'last';

interface KrnMenuButtonHost {
  readonly disabled: Signal<boolean>;
  readonly loading: Signal<boolean>;
  readonly open: ModelSignal<boolean>;
  readonly menuAlign: Signal<KrnMenuAlignment>;
  readonly menuOffset: Signal<number>;
  readonly closeOnSelection: Signal<boolean>;
}

/** Internal signal controller shared by the two public menu-button components. */
class KrnMenuButtonController {
  private readonly platform = inject(KRN_PLATFORM);
  private readonly overlayCoordinator = inject(KrnOverlayCoordinator);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly ids = inject(KrnIdService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly renderer = inject(Renderer2);
  private resolveMenuPanel: () => HTMLElement | undefined = () => undefined;
  private resolveFocusReturnTarget: (() => HTMLButtonElement | null) | undefined;
  private readonly capturedPanelClickItems = new WeakMap<Event, HTMLElement>();
  private requestedFocus: KrnRequestedMenuFocus | null = null;
  private typeaheadBuffer = '';
  private typeaheadTimer: KrnScheduledHandle | undefined;
  private menuObserver: MutationObserver | undefined;
  private menuHadFocus = false;
  private lastFocusedItemIndex = 0;
  private stopPanelActivationGuard: (() => void) | undefined;

  readonly triggerId = this.ids.next('menu-button-trigger');
  readonly menuId = this.ids.next('menu');
  readonly isDisabled: Signal<boolean>;
  readonly effectiveOpen: Signal<boolean>;
  readonly menuPositions: Signal<ConnectedPosition[]>;

  constructor(private readonly menuHost: KrnMenuButtonHost) {
    this.isDisabled = computed(() => this.menuHost.disabled() || this.menuHost.loading());
    this.effectiveOpen = computed(() => this.menuHost.open() && !this.isDisabled());
    this.menuPositions = computed(() => {
      const alignment: KrnMenuAlignment = this.menuHost.menuAlign() === 'start' ? 'start' : 'end';
      const fallbackAlignment: KrnMenuAlignment = alignment === 'start' ? 'end' : 'start';
      const configuredOffset = this.menuHost.menuOffset();
      const offset =
        Number.isFinite(configuredOffset) && configuredOffset >= 0
          ? configuredOffset
          : KRN_MENU_BUTTON_DEFAULT_OPTIONS.menuOffset;

      return [
        {
          originX: alignment,
          originY: 'bottom' as const,
          overlayX: alignment,
          overlayY: 'top' as const,
          offsetY: offset,
        },
        {
          originX: alignment,
          originY: 'top' as const,
          overlayX: alignment,
          overlayY: 'bottom' as const,
          offsetY: -offset,
        },
        {
          originX: fallbackAlignment,
          originY: 'bottom' as const,
          overlayX: fallbackAlignment,
          overlayY: 'top' as const,
          offsetY: offset,
        },
        {
          originX: fallbackAlignment,
          originY: 'top' as const,
          overlayX: fallbackAlignment,
          overlayY: 'bottom' as const,
          offsetY: -offset,
        },
      ];
    });
    effect(() => {
      if (this.menuHost.open() && this.isDisabled()) {
        const restoreFocusableLoadingTrigger =
          this.menuHost.loading() && !this.menuHost.disabled() && this.menuButtonOwnsFocus();
        this.closeMenu(restoreFocusableLoadingTrigger);
      }
    });
    this.destroyRef.onDestroy(() => {
      this.clearTypeahead();
      this.stopObservingMenu();
      this.removePanelActivationGuard();
    });
  }

  connectView(
    resolveMenuPanel: () => HTMLElement | undefined,
    resolveFocusReturnTarget?: () => HTMLButtonElement | null,
  ): void {
    this.resolveMenuPanel = resolveMenuPanel;
    this.resolveFocusReturnTarget = resolveFocusReturnTarget;
  }

  toggleMenu(): void {
    if (this.effectiveOpen()) {
      this.closeMenu(false);
      return;
    }
    this.openMenu('first');
  }

  registerOverlay(overlay: CdkConnectedOverlay, origin: HTMLElement): void {
    this.overlayCoordinator.registerOverlayOwnership(
      origin,
      overlay.overlayRef.overlayElement,
      null,
    );
    const requestedFocus = this.requestedFocus;
    this.platform.queueMicrotask(() => {
      if (!this.effectiveOpen()) {
        return;
      }
      const panel = this.resolveMenuPanel();
      if (panel) {
        this.installPanelActivationGuard(panel);
        this.observeMenu(panel);
      }
      const items = this.synchronizeMenuItems();
      if (requestedFocus) {
        this.focusMenuItem(requestedFocus, items);
      }
      this.requestedFocus = null;
    });
  }

  onOverlayDetached(): void {
    this.requestedFocus = null;
    this.menuHadFocus = false;
    this.clearTypeahead();
    this.stopObservingMenu();
    this.removePanelActivationGuard();
    if (this.menuHost.open()) {
      this.menuHost.open.set(false);
    }
  }

  onOverlayOutsideClick(event: MouseEvent): void {
    const panel = this.resolveMenuPanel();
    if (
      !this.effectiveOpen() ||
      this.hasInertAncestor(panel) ||
      (panel && this.overlayCoordinator.isOwnedBy(panel, event.target)) ||
      this.overlayCoordinator.isOwnedBy(this.host.nativeElement, event.target)
    ) {
      return;
    }
    this.closeMenu(false);
  }

  closeFromMenu(event: MouseEvent): void {
    if (event.defaultPrevented || !this.menuHost.closeOnSelection()) {
      return;
    }
    this.synchronizeMenuItems();
    const item = this.capturedPanelClickItems.get(event) ?? this.closestMenuItem(event.target);
    if (
      !item ||
      this.hasKeepOpenMarker(event.target) ||
      item.getAttribute('aria-disabled') === 'true' ||
      item.hasAttribute('disabled')
    ) {
      return;
    }
    this.closeMenu(true);
  }

  onTriggerKeydown(event: KeyboardEvent): void {
    if (event.defaultPrevented || this.isDisabled()) {
      return;
    }
    if (event.key === 'Escape' && this.effectiveOpen()) {
      event.preventDefault();
      event.stopPropagation();
      this.closeMenu(false);
      return;
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
      return;
    }

    event.preventDefault();
    const position = event.key === 'ArrowDown' ? 'first' : 'last';
    if (this.effectiveOpen()) {
      this.focusMenuItem(position);
      return;
    }
    this.openMenu(position);
  }

  onMenuKeydown(event: KeyboardEvent): void {
    if (event.defaultPrevented) {
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.closeMenu(true);
      return;
    }
    if (event.key === 'Tab') {
      this.closeMenu(false);
      this.focusTriggerImmediately();
      return;
    }

    const items = this.synchronizeMenuItems();
    const activeElement = this.platform.document.activeElement;
    const current = items.findIndex(
      (item) =>
        item === activeElement ||
        (krnIsNode(this.platform, activeElement) && item.contains(activeElement)),
    );
    const activeItem = current >= 0 ? items[current] : this.closestMenuItem(event.target);
    if (this.isActivationKey(event) && activeItem && event.target === activeItem) {
      if (this.isDisabledItem(activeItem)) {
        event.preventDefault();
        return;
      }
      if (!this.usesNativeKeyboardActivation(activeItem, event.key)) {
        event.preventDefault();
        activeItem.click();
      }
      return;
    }
    if (items.length === 0) {
      return;
    }
    const target =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? items.length - 1
          : event.key === 'ArrowDown'
            ? (current + 1) % items.length
            : event.key === 'ArrowUp'
              ? (current - 1 + items.length) % items.length
              : -1;
    if (target >= 0) {
      event.preventDefault();
      this.focusItem(items[target], items);
      return;
    }

    if (this.isTypeaheadKey(event)) {
      event.preventDefault();
      this.focusTypeaheadMatch(event.key, items, current);
    }
  }

  closeOnFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget;
    const current = event.currentTarget;
    const panel = this.resolveMenuPanel();
    if (panel === current && (!krnIsNode(this.platform, next) || !panel.contains(next))) {
      this.menuHadFocus = false;
    }
    if (
      krnIsNode(this.platform, next) &&
      ((krnIsNode(this.platform, current) && current.contains(next)) ||
        this.host.nativeElement.contains(next) ||
        panel?.contains(next) ||
        (panel && this.overlayCoordinator.isOwnedBy(panel, next)))
    ) {
      return;
    }
    this.closeMenu(false);
  }

  private openMenu(focus: KrnRequestedMenuFocus): void {
    if (this.isDisabled()) {
      return;
    }
    this.requestedFocus = focus;
    this.menuHost.open.set(true);
    if (this.resolveMenuPanel()) {
      this.focusMenuItem(focus);
      this.requestedFocus = null;
    }
  }

  private closeMenu(restoreFocus: boolean): void {
    this.requestedFocus = null;
    this.menuHadFocus = false;
    this.clearTypeahead();
    if (this.menuHost.open()) {
      this.menuHost.open.set(false);
    }
    if (restoreFocus) {
      this.focusTrigger();
    }
  }

  private synchronizeMenuItems(): HTMLElement[] {
    const panel = this.resolveMenuPanel();
    if (!panel) {
      return [];
    }

    const discovered = new Set<HTMLElement>();
    const add = (element: HTMLElement, inferRole: boolean): void => {
      if (inferRole && !element.hasAttribute('role')) {
        element.setAttribute('role', 'menuitem');
      }
      if (!element.matches(MENU_ITEM_SELECTOR)) {
        return;
      }
      discovered.add(element);
    };

    for (const root of panel.querySelectorAll<HTMLElement>('[krnMenu]')) {
      if (root.matches(PROJECTED_ACTION_SELECTOR)) {
        add(root, true);
        continue;
      }
      for (const action of root.querySelectorAll<HTMLElement>(PROJECTED_ACTION_SELECTOR)) {
        add(action, true);
      }
    }
    for (const explicit of panel.querySelectorAll<HTMLElement>(MENU_ITEM_SELECTOR)) {
      add(explicit, false);
    }

    const allItems = [...discovered];
    const items = allItems.filter((item) => this.isNavigableItem(item));
    const activeElement = this.platform.document.activeElement;
    const rovingItem =
      items.find(
        (item) =>
          item === activeElement ||
          (krnIsNode(this.platform, activeElement) && item.contains(activeElement)),
      ) ??
      items.find((item) => item.tabIndex === 0) ??
      items[0];
    for (const item of allItems) {
      item.tabIndex = item === rovingItem ? 0 : -1;
    }
    return items;
  }

  private isNavigableItem(item: HTMLElement): boolean {
    if (!item.isConnected || item.hasAttribute('disabled') || item.matches(':disabled')) {
      return false;
    }

    const view = this.platform.window;
    let current: HTMLElement | null = item;
    while (current) {
      if (
        current.hidden ||
        current.inert ||
        current.hasAttribute('inert') ||
        current.getAttribute('aria-hidden') === 'true'
      ) {
        return false;
      }
      if (current.tagName === 'DETAILS' && !current.hasAttribute('open')) {
        const summaryElement: Element | undefined = Array.from(current.children).find(
          (child) => child.tagName === 'SUMMARY',
        );
        if (!summaryElement?.contains(item)) {
          return false;
        }
      }
      if (view) {
        const style = view.getComputedStyle(current);
        if (
          style.display === 'none' ||
          (current === item && style.display === 'contents') ||
          style.visibility === 'hidden' ||
          style.visibility === 'collapse' ||
          style.getPropertyValue('content-visibility') === 'hidden'
        ) {
          return false;
        }
      }
      current = current.parentElement;
    }

    return true;
  }

  private closestMenuItem(target: EventTarget | null): HTMLElement | null {
    if (!krnIsElement(this.platform, target)) {
      return null;
    }
    const panel = this.resolveMenuPanel();
    const item = target.closest<HTMLElement>(MENU_ITEM_SELECTOR);
    return item && panel?.contains(item) ? item : null;
  }

  private hasKeepOpenMarker(target: EventTarget | null): boolean {
    return (
      krnIsElement(this.platform, target) && target.closest('[data-krn-menu-keep-open]') !== null
    );
  }

  private focusMenuItem(
    position: KrnRequestedMenuFocus,
    synchronizedItems = this.synchronizeMenuItems(),
  ): void {
    const item = synchronizedItems[position === 'first' ? 0 : synchronizedItems.length - 1];
    if (item) {
      this.focusItem(item, synchronizedItems);
      return;
    }
    const panel = this.resolveMenuPanel();
    if (panel) {
      this.menuHadFocus = true;
      this.lastFocusedItemIndex = 0;
      panel.focus({ preventScroll: true });
    }
  }

  private focusItem(item: HTMLElement | undefined, items: readonly HTMLElement[]): void {
    if (!item) {
      return;
    }
    for (const candidate of items) {
      candidate.tabIndex = candidate === item ? 0 : -1;
    }
    this.menuHadFocus = true;
    this.lastFocusedItemIndex = Math.max(items.indexOf(item), 0);
    item.focus({ preventScroll: true });
  }

  private isTypeaheadKey(event: KeyboardEvent): boolean {
    if (
      event.key.length !== 1 ||
      event.key === ' ' ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.defaultPrevented
    ) {
      return false;
    }
    return !(
      krnIsElement(this.platform, event.target) &&
      event.target.matches('input, textarea, select, [contenteditable="true"]')
    );
  }

  private isActivationKey(event: KeyboardEvent): boolean {
    return event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar';
  }

  private isDisabledItem(item: HTMLElement): boolean {
    return (
      item.hasAttribute('disabled') ||
      item.matches(':disabled') ||
      item.getAttribute('aria-disabled') === 'true'
    );
  }

  private usesNativeKeyboardActivation(item: HTMLElement, key: string): boolean {
    if (item.matches('[contenteditable="true"]')) {
      return true;
    }
    if (key === 'Enter') {
      return item.matches('button, a[href], input, select, textarea, summary');
    }
    return item.matches('button, input, select, textarea, summary');
  }

  private focusTypeaheadMatch(
    key: string,
    items: readonly HTMLElement[],
    currentIndex: number,
  ): void {
    this.cancelTypeaheadTimer();
    const normalizedKey = key.toLocaleLowerCase();
    this.typeaheadBuffer += normalizedKey;
    let match = this.findTypeaheadMatch(items, currentIndex, this.typeaheadBuffer);
    if (!match && this.typeaheadBuffer.length > 1) {
      this.typeaheadBuffer = normalizedKey;
      match = this.findTypeaheadMatch(items, currentIndex, this.typeaheadBuffer);
    }
    if (match) {
      this.focusItem(match, items);
    }

    const handle = this.platform.schedule(() => {
      this.typeaheadTimer = undefined;
      this.typeaheadBuffer = '';
    }, TYPEAHEAD_RESET_DELAY);
    if (handle === null) {
      this.typeaheadBuffer = '';
      return;
    }
    this.typeaheadTimer = handle;
  }

  private findTypeaheadMatch(
    items: readonly HTMLElement[],
    currentIndex: number,
    query: string,
  ): HTMLElement | undefined {
    for (let offset = 1; offset <= items.length; offset += 1) {
      const index = (Math.max(currentIndex, -1) + offset) % items.length;
      const item = items[index];
      const label = (item?.getAttribute('aria-label') || item?.textContent || '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLocaleLowerCase();
      if (label.startsWith(query)) {
        return item;
      }
    }
    return undefined;
  }

  private clearTypeahead(): void {
    this.cancelTypeaheadTimer();
    this.typeaheadBuffer = '';
  }

  private cancelTypeaheadTimer(): void {
    if (this.typeaheadTimer === undefined) {
      return;
    }
    this.platform.cancelScheduled(this.typeaheadTimer);
    this.typeaheadTimer = undefined;
  }

  private hasInertAncestor(element: HTMLElement | undefined): boolean {
    let current: HTMLElement | null = element ?? null;
    while (current) {
      if (current.inert) {
        return true;
      }
      current = current.parentElement;
    }
    return false;
  }

  private installPanelActivationGuard(panel: HTMLElement): void {
    this.removePanelActivationGuard();
    const stopClickGuard = this.renderer.listen(
      panel,
      'click',
      (event: MouseEvent): void => {
        this.synchronizeMenuItems();
        const item = this.closestMenuItem(event.target);
        if (!item) {
          return;
        }
        this.capturedPanelClickItems.set(event, item);
        if (item.getAttribute('aria-disabled') !== 'true') {
          return;
        }
        event.preventDefault();
        event.stopImmediatePropagation();
      },
      { capture: true },
    );
    const stopFocusTracking = this.renderer.listen(panel, 'focusin', (event: FocusEvent): void =>
      this.recordMenuFocus(event.target),
    );
    this.stopPanelActivationGuard = (): void => {
      stopClickGuard();
      stopFocusTracking();
    };
  }

  private observeMenu(panel: HTMLElement): void {
    this.stopObservingMenu();
    const Observer = this.platform.window?.MutationObserver;
    if (!Observer) {
      return;
    }
    this.menuObserver = new Observer(() => {
      if (this.effectiveOpen() && panel.isConnected) {
        const items = this.synchronizeMenuItems();
        this.recoverMenuFocus(panel, items);
      }
    });
    this.menuObserver.observe(panel, {
      attributeFilter: MENU_MUTATION_ATTRIBUTES,
      attributes: true,
      childList: true,
      subtree: true,
    });
  }

  private stopObservingMenu(): void {
    this.menuObserver?.disconnect();
    this.menuObserver = undefined;
  }

  private recordMenuFocus(target: EventTarget | null): void {
    const items = this.synchronizeMenuItems();
    const item = this.closestMenuItem(target);
    this.menuHadFocus = true;
    this.lastFocusedItemIndex = item ? Math.max(items.indexOf(item), 0) : 0;
  }

  private recoverMenuFocus(panel: HTMLElement, items: readonly HTMLElement[]): void {
    const activeElement = this.platform.document.activeElement;
    const focusRemainsOnItem = items.some(
      (item) =>
        item === activeElement ||
        (krnIsNode(this.platform, activeElement) && item.contains(activeElement)),
    );
    if (!this.menuHadFocus || focusRemainsOnItem) {
      return;
    }

    const target = items[Math.min(this.lastFocusedItemIndex, items.length - 1)];
    if (target) {
      this.focusItem(target, items);
      return;
    }

    this.lastFocusedItemIndex = 0;
    panel.focus({ preventScroll: true });
  }

  private removePanelActivationGuard(): void {
    this.stopPanelActivationGuard?.();
    this.stopPanelActivationGuard = undefined;
  }

  private menuButtonOwnsFocus(): boolean {
    if (this.menuHadFocus) {
      return true;
    }

    const activeElement = this.platform.document.activeElement;
    if (!krnIsNode(this.platform, activeElement)) {
      return false;
    }

    const trigger = this.findMenuTrigger();
    const panel = this.resolveMenuPanel();
    return (
      trigger === activeElement ||
      Boolean(trigger?.contains(activeElement)) ||
      panel === activeElement ||
      Boolean(panel?.contains(activeElement)) ||
      Boolean(panel && this.overlayCoordinator.isOwnedBy(panel, activeElement))
    );
  }

  private focusTriggerImmediately(): void {
    const target = this.resolveFocusReturnTarget?.() ?? this.findMenuTrigger();
    if (target?.isConnected && !target.disabled) {
      target.focus({ preventScroll: true });
    }
  }

  private findMenuTrigger(): HTMLButtonElement | null {
    return this.host.nativeElement.querySelector<HTMLButtonElement>(
      '.krn-action[aria-haspopup="menu"]',
    );
  }

  private focusTrigger(): void {
    this.platform.queueMicrotask(() => this.focusTriggerImmediately());
  }
}

@Component({
  selector: 'krn-dropdown-button',
  imports: [OverlayModule, KrnButton],
  host: {
    '[attr.data-menu-align]': 'menuAlign()',
    '[attr.data-open]': 'menu.effectiveOpen()',
    '[attr.data-size]': 'size()',
    '[attr.data-tone]': 'tone()',
    '[attr.data-variant]': 'variant()',
  },
  template: `
    <span
      #origin="cdkOverlayOrigin"
      cdkOverlayOrigin
      class="krn-dropdown"
      (focusout)="menu.closeOnFocusOut($event)"
    >
      <button
        #menuTrigger
        krnButton
        aria-haspopup="menu"
        type="button"
        [attr.aria-controls]="menu.menuId"
        [attr.aria-expanded]="menu.effectiveOpen()"
        [attr.id]="menu.triggerId"
        [disabled]="disabled()"
        [loading]="loading()"
        [size]="size()"
        [tone]="tone()"
        [variant]="variant()"
        (click)="menu.toggleMenu()"
        (keydown)="menu.onTriggerKeydown($event)"
      >
        <ng-content select="[krnLabel]" />
        <span krnTrailingIcon class="krn-chevron"></span>
      </button>
    </span>
    <ng-template
      #connectedOverlay="cdkConnectedOverlay"
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="origin"
      [cdkConnectedOverlayOpen]="menu.effectiveOpen()"
      [cdkConnectedOverlayPositions]="menu.menuPositions()"
      [cdkConnectedOverlayPush]="true"
      [cdkConnectedOverlayFlexibleDimensions]="true"
      [cdkConnectedOverlayViewportMargin]="8"
      [cdkConnectedOverlayUsePopover]="null"
      [cdkConnectedOverlayMatchWidth]="matchTriggerWidth()"
      [cdkConnectedOverlayDisposeOnNavigation]="true"
      cdkConnectedOverlayTransformOriginOn=".krn-action-menu"
      [cdkConnectedOverlayHasBackdrop]="false"
      cdkConnectedOverlayPanelClass="krn-overlay-pane"
      (attach)="menu.registerOverlay(connectedOverlay, origin.elementRef.nativeElement)"
      (detach)="menu.onOverlayDetached()"
      (overlayOutsideClick)="menu.onOverlayOutsideClick($event)"
    >
      @if (menu.effectiveOpen()) {
        <div
          #menuPanel
          class="krn-action-menu"
          role="menu"
          tabindex="-1"
          [attr.aria-labelledby]="menu.triggerId"
          [attr.data-match-trigger-width]="matchTriggerWidth()"
          [attr.id]="menu.menuId"
          (click)="menu.closeFromMenu($event)"
          (focusout)="menu.closeOnFocusOut($event)"
          (keydown)="menu.onMenuKeydown($event)"
        >
          <ng-content select="[krnMenu]" />
        </div>
      }
    </ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnDropdownButton {
  private readonly options = inject(KRN_MENU_BUTTON_OPTIONS);
  readonly size = input<KrnSize>(this.options.size);
  readonly variant = input<KrnActionVariant>(this.options.variant);
  readonly tone = input<KrnTone>(this.options.tone);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly loading = input(false, { transform: booleanAttribute });
  readonly open = model(false);
  /** Logical horizontal alignment used before the CDK collision fallbacks. */
  readonly menuAlign = input<KrnMenuAlignment>(this.options.menuAlign);
  /** Non-negative logical gap in CSS pixels between the trigger and menu. */
  readonly menuOffset = input(this.options.menuOffset, { transform: numberAttribute });
  /** Makes the connected overlay exactly as wide as the complete trigger origin. */
  readonly matchTriggerWidth = input(this.options.matchTriggerWidth, {
    transform: booleanAttribute,
  });
  /** Closes after an enabled menu item activates; use the keep-open marker for one item. */
  readonly closeOnSelection = input(true, { transform: booleanAttribute });
  private readonly menuPanel = viewChild<ElementRef<HTMLElement>>('menuPanel');
  protected readonly menu = new KrnMenuButtonController(this);

  constructor() {
    this.menu.connectView(() => this.menuPanel()?.nativeElement);
  }
}

@Component({
  selector: 'krn-split-button',
  imports: [OverlayModule, KrnButton],
  host: {
    '[attr.data-menu-align]': 'menuAlign()',
    '[attr.data-loading]': 'loading()',
    '[attr.data-open]': 'menu.effectiveOpen()',
    '[attr.data-size]': 'size()',
    '[attr.data-tone]': 'tone()',
    '[attr.data-variant]': 'variant()',
  },
  template: `
    <span
      #origin="cdkOverlayOrigin"
      cdkOverlayOrigin
      class="krn-split-button"
      (focusout)="menu.closeOnFocusOut($event)"
    >
      <button
        krnButton
        class="krn-split-button__primary"
        type="button"
        [disabled]="disabled()"
        [loading]="loading()"
        [size]="size()"
        [tone]="tone()"
        [variant]="variant()"
        (click)="activatePrimary($event)"
      >
        <ng-content select="[krnLabel]" />
      </button>
      <button
        #menuTrigger
        krnButton
        class="krn-split-button__menu-trigger"
        type="button"
        aria-haspopup="menu"
        [attr.aria-controls]="menu.menuId"
        [attr.aria-expanded]="menu.effectiveOpen()"
        [attr.aria-label]="menuLabel()"
        [attr.id]="menu.triggerId"
        [disabled]="menu.isDisabled()"
        [size]="size()"
        [tone]="tone()"
        [variant]="variant()"
        (click)="menu.toggleMenu()"
        (keydown)="menu.onTriggerKeydown($event)"
      >
        <span krnTrailingIcon class="krn-chevron"></span>
      </button>
    </span>
    <ng-template
      #connectedOverlay="cdkConnectedOverlay"
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="origin"
      [cdkConnectedOverlayOpen]="menu.effectiveOpen()"
      [cdkConnectedOverlayPositions]="menu.menuPositions()"
      [cdkConnectedOverlayPush]="true"
      [cdkConnectedOverlayFlexibleDimensions]="true"
      [cdkConnectedOverlayViewportMargin]="8"
      [cdkConnectedOverlayUsePopover]="null"
      [cdkConnectedOverlayMatchWidth]="matchTriggerWidth()"
      [cdkConnectedOverlayDisposeOnNavigation]="true"
      cdkConnectedOverlayTransformOriginOn=".krn-action-menu"
      [cdkConnectedOverlayHasBackdrop]="false"
      cdkConnectedOverlayPanelClass="krn-overlay-pane"
      (attach)="menu.registerOverlay(connectedOverlay, origin.elementRef.nativeElement)"
      (detach)="menu.onOverlayDetached()"
      (overlayOutsideClick)="menu.onOverlayOutsideClick($event)"
    >
      @if (menu.effectiveOpen()) {
        <div
          #menuPanel
          class="krn-action-menu"
          role="menu"
          tabindex="-1"
          [attr.aria-labelledby]="menu.triggerId"
          [attr.data-match-trigger-width]="matchTriggerWidth()"
          [attr.id]="menu.menuId"
          (click)="menu.closeFromMenu($event)"
          (focusout)="menu.closeOnFocusOut($event)"
          (keydown)="menu.onMenuKeydown($event)"
        >
          <ng-content select="[krnMenu]" />
        </div>
      }
    </ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnSplitButton {
  private readonly options = inject(KRN_MENU_BUTTON_OPTIONS);
  private readonly splitHost = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly size = input<KrnSize>(this.options.size);
  readonly variant = input<KrnActionVariant>(this.options.variant);
  readonly tone = input<KrnTone>(this.options.tone);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly loading = input(false, { transform: booleanAttribute });
  readonly open = model(false);
  /** Logical horizontal alignment used before the CDK collision fallbacks. */
  readonly menuAlign = input<KrnMenuAlignment>(this.options.menuAlign);
  /** Non-negative logical gap in CSS pixels between the trigger and menu. */
  readonly menuOffset = input(this.options.menuOffset, { transform: numberAttribute });
  /** Makes the connected overlay exactly as wide as the complete trigger origin. */
  readonly matchTriggerWidth = input(this.options.matchTriggerWidth, {
    transform: booleanAttribute,
  });
  /** Closes after an enabled menu item activates; use the keep-open marker for one item. */
  readonly closeOnSelection = input(true, { transform: booleanAttribute });
  readonly menuLabel = input(inject(KRN_MORE_ACTIONS_LABEL));
  readonly primaryAction = output<MouseEvent>();
  private readonly menuPanel = viewChild<ElementRef<HTMLElement>>('menuPanel');
  protected readonly menu = new KrnMenuButtonController(this);

  constructor() {
    this.menu.connectView(
      () => this.menuPanel()?.nativeElement,
      () =>
        this.loading()
          ? this.splitHost.nativeElement.querySelector<HTMLButtonElement>(
              '.krn-split-button__primary',
            )
          : null,
    );
  }

  protected activatePrimary(event: MouseEvent): void {
    if (!this.menu.isDisabled()) {
      this.open.set(false);
      this.primaryAction.emit(event);
    }
  }
}
