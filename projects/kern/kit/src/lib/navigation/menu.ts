import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  HostListener,
  booleanAttribute,
  computed,
  contentChild,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import type { CdkConnectedOverlay } from '@angular/cdk/overlay';
import { OverlayModule } from '@angular/cdk/overlay';
import { KRN_PLATFORM, KrnOverlayCoordinator, krnIsHtmlElement } from '@kern-ui/angular/cdk';
import { KRN_TRANSLATIONS } from '@kern-ui/angular/core';
import type { KrnContextMenuItem, KrnNavigationItem } from './navigation.types';

/** Identifies projected trigger content without a parallel boolean input. */
@Directive({
  selector: '[krnMenuTrigger]',
  standalone: true,
})
export class KrnMenuTrigger {}

@Component({
  selector: 'krn-menu',
  standalone: true,
  imports: [OverlayModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      #trigger
      #origin="cdkOverlayOrigin"
      cdkOverlayOrigin
      type="button"
      class="trigger"
      [attr.aria-label]="resolvedTriggerAriaLabel()"
      aria-haspopup="menu"
      [attr.aria-expanded]="open()"
      [attr.aria-controls]="open() ? panelId() : null"
      (click)="toggle()"
      (keydown)="onTriggerKeydown($event)"
    >
      <ng-content select="[krnMenuTrigger]" />
      @if (showDefaultTrigger()) {
        <span>{{ resolvedTriggerLabel() }}</span>
        <span class="trigger-chevron" aria-hidden="true"></span>
      }
    </button>
    <ng-template
      #connectedOverlay="cdkConnectedOverlay"
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="origin"
      [cdkConnectedOverlayOpen]="open()"
      [cdkConnectedOverlayHasBackdrop]="true"
      [cdkConnectedOverlayBackdropClass]="[
        'cdk-overlay-transparent-backdrop',
        'krn-overlay-backdrop',
      ]"
      cdkConnectedOverlayPanelClass="krn-overlay-pane"
      [cdkConnectedOverlayPositions]="positions"
      [cdkConnectedOverlayPush]="true"
      [cdkConnectedOverlayFlexibleDimensions]="true"
      [cdkConnectedOverlayViewportMargin]="8"
      cdkConnectedOverlayUsePopover="inline"
      cdkConnectedOverlayTransformOriginOn=".menu-panel"
      (attach)="onAttach(connectedOverlay, origin.elementRef.nativeElement)"
      (backdropClick)="close('outside')"
      (detach)="onDetach()"
    >
      <div
        #menuPanel
        class="menu-panel"
        role="menu"
        [id]="panelId()"
        [attr.tabindex]="hasEnabledItems() ? null : -1"
        [attr.aria-label]="resolvedMenuAriaLabel()"
        (keydown)="onMenuKeydown($event)"
      >
        @for (item of items(); track $index; let index = $index) {
          @if (item.href && !item.disabled) {
            <a
              #menuItem
              role="menuitem"
              [href]="item.href"
              [attr.tabindex]="index === activeIndex() ? 0 : -1"
              (click)="activate(item)"
              (pointerenter)="focusIndex(index)"
            >
              <span>{{ item.label }}</span>
              @if (item.shortcut) {
                <kbd>{{ item.shortcut }}</kbd>
              }
            </a>
          } @else {
            <button
              #menuItem
              type="button"
              role="menuitem"
              [disabled]="item.disabled"
              [attr.tabindex]="index === activeIndex() ? 0 : -1"
              (click)="activate(item)"
              (pointerenter)="focusIndex(index)"
            >
              <span>{{ item.label }}</span>
              @if (item.shortcut) {
                <kbd>{{ item.shortcut }}</kbd>
              }
            </button>
          }
        } @empty {
          <p class="empty" role="menuitem" aria-disabled="true">{{ resolvedEmptyLabel() }}</p>
        }
      </div>
    </ng-template>
  `,
  styles: `
    :host {
      display: inline-block;
    }
    :host([hidden]) {
      display: none;
    }
    .trigger {
      display: inline-flex;
      min-block-size: var(--krn-control-height-md);
      align-items: center;
      justify-content: center;
      gap: var(--krn-space-2);
      padding-inline: var(--krn-control-padding-inline);
      border: var(--krn-border-width-1) solid var(--krn-color-border-interactive);
      border-radius: var(--krn-radius-sm);
      color: var(--krn-color-text);
      background: var(--krn-color-surface);
      font: inherit;
      font-weight: var(--krn-font-weight-medium);
      cursor: pointer;
    }
    .trigger:hover {
      border-color: var(--krn-color-border-strong);
      background: var(--krn-color-surface-subtle);
    }
    .trigger-chevron {
      inline-size: 0.4375rem;
      block-size: 0.4375rem;
      margin-block-start: -0.1875rem;
      border-inline-end: 1.5px solid currentColor;
      border-block-end: 1.5px solid currentColor;
      rotate: 45deg;
      transform-origin: 62% 62%;
      transition: rotate var(--krn-motion-duration-interaction) var(--krn-motion-ease-standard);
    }
    .trigger[aria-expanded='true'] .trigger-chevron {
      margin-block-start: 0.1875rem;
      rotate: 225deg;
    }
    .trigger:focus-visible,
    .menu-panel:focus-visible,
    .menu-panel :is(a, button):focus-visible {
      outline: var(--krn-focus-ring-width) solid var(--krn-color-focus);
      outline-offset: var(--krn-focus-ring-offset);
    }
    .menu-panel {
      display: grid;
      min-inline-size: 12rem;
      max-inline-size: min(22rem, calc(100vw - var(--krn-space-8)));
      max-block-size: min(26rem, calc(100dvh - var(--krn-space-8)));
      gap: var(--krn-space-1);
      overflow: auto;
      padding: var(--krn-space-2);
      border: var(--krn-border-width-1) solid var(--krn-color-border);
      border-radius: var(--krn-radius-md);
      color: var(--krn-color-text);
      background: var(--krn-color-surface-raised);
      box-shadow: var(--krn-shadow-overlay);
    }
    .menu-panel :is(a, button) {
      display: flex;
      min-block-size: var(--krn-control-height-sm);
      align-items: center;
      justify-content: space-between;
      gap: var(--krn-space-4);
      padding-inline: var(--krn-space-3);
      border: 0;
      border-radius: var(--krn-radius-sm);
      color: inherit;
      background: transparent;
      font: inherit;
      text-align: start;
      text-decoration: none;
      cursor: pointer;
    }
    .menu-panel :is(a, button):hover {
      background: color-mix(in oklch, var(--krn-color-surface-subtle) 72%, transparent);
    }
    .menu-panel :is(a, button)[tabindex='0'] {
      background: var(--krn-color-surface-subtle);
    }
    .menu-panel button:disabled {
      color: var(--krn-color-text-disabled);
      cursor: not-allowed;
    }
    .menu-panel kbd {
      color: var(--krn-color-text-subtle);
      font: inherit;
      font-size: var(--krn-font-size-xs);
    }
    .empty {
      margin: 0;
      padding: var(--krn-space-3);
      color: var(--krn-color-text-muted);
      font-size: var(--krn-font-size-sm);
    }
    @media (prefers-reduced-motion: reduce) {
      :host-context(html:not([data-krn-motion='full'])) .trigger-chevron {
        transition: none;
      }
    }
    @media (forced-colors: active) {
      .trigger,
      .menu-panel {
        border-color: CanvasText;
      }
      .trigger:focus-visible,
      .menu-panel:focus-visible,
      .menu-panel :is(a, button):focus-visible {
        outline-color: Highlight;
      }
      .menu-panel :is(a, button)[tabindex='0'] {
        outline: var(--krn-border-width-1) solid Highlight;
      }
    }
  `,
})
export class KrnMenu {
  private readonly overlayCoordinator = inject(KrnOverlayCoordinator);
  private readonly platform = inject(KRN_PLATFORM);
  private readonly translations = inject(KRN_TRANSLATIONS);
  private readonly trigger = viewChild<ElementRef<HTMLButtonElement>>('trigger');
  private readonly menuPanel = viewChild<ElementRef<HTMLElement>>('menuPanel');
  private readonly menuItems = viewChildren<ElementRef<HTMLElement>>('menuItem');
  private readonly projectedTrigger = contentChild(KrnMenuTrigger);
  readonly items = input<readonly (KrnNavigationItem & { readonly shortcut?: string })[]>([]);
  readonly open = model(false);
  readonly triggerLabel = input(this.translations.navigation.actions);
  readonly triggerAriaLabel = input(this.translations.navigation.openMenu);
  readonly menuAriaLabel = input(this.translations.navigation.actions);
  readonly emptyLabel = input(this.translations.navigation.menuEmpty);
  /**
   * @deprecated Import and apply `KrnMenuTrigger` to projected trigger content instead.
   */
  readonly hasProjectedTrigger = input(false, { transform: booleanAttribute });
  readonly itemSelected = output<KrnNavigationItem>();
  readonly closed = output<'escape' | 'outside' | 'detach' | 'selection'>();
  protected readonly activeIndex = signal(0);
  protected readonly panelId = signal<string | null>(null);
  protected readonly hasEnabledItems = computed(() => this.items().some((item) => !item.disabled));
  protected readonly showDefaultTrigger = computed(
    () => !this.hasProjectedTrigger() && !this.projectedTrigger(),
  );
  protected readonly resolvedTriggerLabel = computed(
    () => this.triggerLabel()?.trim() || this.translations.navigation.actions.trim(),
  );
  protected readonly resolvedTriggerAriaLabel = computed(
    () => this.triggerAriaLabel()?.trim() || this.translations.navigation.openMenu.trim() || null,
  );
  protected readonly resolvedMenuAriaLabel = computed(
    () => this.menuAriaLabel()?.trim() || this.translations.navigation.actions.trim() || null,
  );
  protected readonly resolvedEmptyLabel = computed(
    () => this.emptyLabel()?.trim() || this.translations.navigation.menuEmpty.trim(),
  );
  protected readonly positions = [
    {
      originX: 'start' as const,
      originY: 'bottom' as const,
      overlayX: 'start' as const,
      overlayY: 'top' as const,
      offsetY: 4,
    },
    {
      originX: 'start' as const,
      originY: 'top' as const,
      overlayX: 'start' as const,
      overlayY: 'bottom' as const,
      offsetY: -4,
    },
  ];

  constructor() {
    effect(() => {
      if (!this.open()) return;
      const active = this.activeIndex();
      if (this.items()[active] && !this.items()[active]?.disabled) {
        this.focusActive();
        return;
      }
      const next = this.findEnabledIndex(0, 1);
      this.activeIndex.set(next);
      this.focusActive();
    });
  }

  protected toggle(): void {
    this.open.update((value) => !value);
    if (this.open()) this.focusFirst();
  }

  protected onAttach(overlay: CdkConnectedOverlay, origin: HTMLElement): void {
    const overlayElement = overlay.overlayRef.overlayElement;
    this.panelId.set(overlayElement.id ? `${overlayElement.id}-menu` : null);
    this.overlayCoordinator.registerOverlayOwnership(
      origin,
      overlayElement,
      overlay.overlayRef.backdropElement,
    );
    this.focusActive();
  }

  protected onDetach(): void {
    this.close('detach');
    this.panelId.set(null);
  }

  protected close(reason: 'escape' | 'outside' | 'detach' | 'selection'): void {
    if (!this.open()) return;
    this.open.set(false);
    this.closed.emit(reason);
    if (reason === 'escape') this.schedule(() => this.trigger()?.nativeElement.focus());
  }

  protected activate(item: KrnNavigationItem): void {
    if (item.disabled) return;
    this.itemSelected.emit(item);
    this.close('selection');
  }

  protected focusIndex(index: number): void {
    if (this.items()[index]?.disabled) return;
    this.activeIndex.set(index);
    this.menuItems()[index]?.nativeElement.focus({ preventScroll: true });
  }

  protected onTriggerKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.open() && !event.defaultPrevented) {
      event.preventDefault();
      event.stopPropagation();
      this.close('escape');
      return;
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    this.open.set(true);
    const direction = event.key === 'ArrowDown' ? 1 : -1;
    const start = direction === 1 ? 0 : this.items().length - 1;
    const next = this.findEnabledIndex(start, direction);
    if (next < 0) return;
    this.activeIndex.set(next);
    this.focusActive();
  }

  protected onMenuKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      if (event.defaultPrevented) return;
      event.preventDefault();
      event.stopPropagation();
      this.close('escape');
      return;
    }
    if (event.key === 'Tab') {
      this.close('selection');
      return;
    }
    const delta = event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0;
    if (delta === 0 && event.key !== 'Home' && event.key !== 'End') return;
    event.preventDefault();
    const items = this.items();
    if (items.length === 0) return;
    const direction = event.key === 'End' ? -1 : delta || 1;
    const start =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? items.length - 1
          : this.activeIndex() + direction;
    const next = this.findEnabledIndex(start, direction);
    if (next < 0) return;
    this.activeIndex.set(next);
    this.focusActive();
  }

  private focusFirst(): void {
    const next = this.findEnabledIndex(0, 1);
    if (next < 0) return;
    this.activeIndex.set(next);
    this.focusActive();
  }

  private findEnabledIndex(start: number, direction: 1 | -1): number {
    const items = this.items();
    if (items.length === 0) return -1;
    let index = ((start % items.length) + items.length) % items.length;
    for (let visited = 0; visited < items.length; visited += 1) {
      if (!items[index]?.disabled) return index;
      index = (index + direction + items.length) % items.length;
    }
    return -1;
  }

  private focusActive(): void {
    this.schedule(() => {
      const item = this.menuItems()[this.activeIndex()]?.nativeElement;
      (item ?? this.menuPanel()?.nativeElement)?.focus();
    });
  }

  private schedule(callback: () => void): void {
    if (this.platform.schedule(callback) === null) {
      callback();
    }
  }
}

@Component({
  selector: 'krn-menubar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="menubar"
      role="menubar"
      [attr.aria-label]="ariaLabel()"
      (keydown)="onKeydown($event)"
    >
      @for (item of items(); track item.id; let index = $index) {
        @if (item.href && !item.disabled) {
          <a
            #barItem
            role="menuitem"
            [href]="item.href"
            [attr.tabindex]="index === activeIndex() ? 0 : -1"
            (click)="itemSelected.emit(item)"
            >{{ item.label }}</a
          >
        } @else {
          <button
            #barItem
            type="button"
            role="menuitem"
            [disabled]="item.disabled"
            [attr.tabindex]="index === activeIndex() ? 0 : -1"
            (click)="!item.disabled && itemSelected.emit(item)"
          >
            {{ item.label }}
          </button>
        }
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
    .menubar {
      display: flex;
      align-items: center;
      gap: var(--krn-space-1);
      min-inline-size: 0;
    }
    .menubar :is(a, button) {
      display: inline-flex;
      align-items: center;
      min-block-size: var(--krn-control-height-sm);
      padding-inline: var(--krn-space-3);
      border: 0;
      border-radius: var(--krn-radius-sm);
      background: transparent;
      color: var(--krn-color-text-muted);
      font: inherit;
      text-decoration: none;
      white-space: nowrap;
      cursor: pointer;
    }
    .menubar :is(a, button):hover,
    .menubar :is(a, button):focus {
      background: var(--krn-color-surface-subtle);
      color: var(--krn-color-text);
    }
    .menubar :is(a, button):focus-visible {
      outline: var(--krn-focus-ring-width) solid var(--krn-color-focus);
      outline-offset: var(--krn-focus-ring-offset);
    }
    .menubar button:disabled {
      color: var(--krn-color-text-disabled);
      cursor: not-allowed;
    }
  `,
})
export class KrnMenubar {
  private readonly elements = viewChildren<ElementRef<HTMLElement>>('barItem');
  private readonly translations = inject(KRN_TRANSLATIONS);
  readonly items = input<readonly KrnNavigationItem[]>([]);
  readonly ariaLabel = input(this.translations.navigation.applicationMenu);
  readonly itemSelected = output<KrnNavigationItem>();
  protected readonly activeIndex = signal(0);

  protected onKeydown(event: KeyboardEvent): void {
    const delta = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!delta && event.key !== 'Home' && event.key !== 'End') return;
    event.preventDefault();
    const items = this.items();
    let next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? items.length - 1
          : (this.activeIndex() + delta + items.length) % items.length;
    while (items[next]?.disabled && next !== this.activeIndex()) {
      next = (next + (delta || 1) + items.length) % items.length;
    }
    this.activeIndex.set(next);
    this.elements()[next]?.nativeElement.focus();
  }
}

@Component({
  selector: 'krn-context-menu',
  standalone: true,
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(contextmenu)': 'onContextMenu($event)',
  },
  template: `
    <ng-content />
    @if (open()) {
      <ng-container
        [ngTemplateOutlet]="menuBranch"
        [ngTemplateOutletContext]="{
          $implicit: items(),
          root: true,
          label: ariaLabel(),
        }"
      />
    }
    <ng-template #menuBranch let-menuItems let-root="root" let-label="label">
      <div
        class="context-panel"
        [class.context-panel--root]="root"
        [class.submenu]="!root"
        role="menu"
        [attr.aria-label]="label"
        [style.inset-inline-start.px]="root ? x() : null"
        [style.inset-block-start.px]="root ? y() : null"
        (click)="$event.stopPropagation()"
        (keydown)="onKeydown($event)"
      >
        @for (item of menuItems; track item.id) {
          <div class="context-entry" (pointerenter)="onPointerEnter(item)">
            <button
              #contextItem
              type="button"
              role="menuitem"
              [disabled]="item.disabled"
              [attr.data-context-item]="item.id"
              [attr.aria-haspopup]="item.children?.length ? 'menu' : null"
              [attr.aria-expanded]="item.children?.length ? submenuOpen(item.id) : null"
              [attr.tabindex]="activeId() === item.id ? 0 : -1"
              (focus)="activeId.set(item.id)"
              (click)="onItemClick($event, item)"
            >
              <span class="item-icon" aria-hidden="true">{{ item.icon || '' }}</span>
              <span class="item-label">{{ item.label }}</span>
              @if (item.shortcut) {
                <kbd>{{ item.shortcut }}</kbd>
              }
              @if (item.children?.length) {
                <span class="submenu-chevron" aria-hidden="true"></span>
              }
            </button>
            @if (item.children?.length && submenuOpen(item.id)) {
              <ng-container
                [ngTemplateOutlet]="menuBranch"
                [ngTemplateOutletContext]="{
                  $implicit: item.children,
                  root: false,
                  label: item.label,
                }"
              />
            }
          </div>
        }
      </div>
    </ng-template>
  `,
  styles: `
    :host {
      display: contents;
    }
    .context-panel {
      z-index: var(--krn-z-dropdown);
      display: grid;
      min-inline-size: 14rem;
      max-inline-size: min(18rem, calc(100vw - var(--krn-space-6)));
      gap: var(--krn-space-1);
      padding: var(--krn-space-2);
      border: var(--krn-border-width-1) solid var(--krn-color-border);
      border-radius: var(--krn-radius-md);
      color: var(--krn-color-text);
      background: var(--krn-color-surface-raised);
      box-shadow: var(--krn-shadow-overlay);
    }
    .context-panel--root {
      position: fixed;
    }
    .context-entry {
      position: relative;
    }
    .submenu {
      position: absolute;
      inset-block-start: calc(var(--krn-space-2) * -1);
      inset-inline-start: calc(100% + var(--krn-space-1));
    }
    button {
      display: grid;
      inline-size: 100%;
      min-block-size: var(--krn-control-height-sm);
      grid-template-columns: 1.25rem minmax(0, 1fr) auto auto;
      align-items: center;
      gap: var(--krn-space-2);
      padding-inline: var(--krn-space-3);
      border: 0;
      border-radius: var(--krn-radius-sm);
      color: inherit;
      background: transparent;
      font: inherit;
      text-align: start;
      cursor: pointer;
    }
    button:hover,
    button[aria-expanded='true'] {
      background: color-mix(in oklch, var(--krn-color-surface-subtle) 72%, transparent);
    }
    button:focus-visible {
      background: var(--krn-color-surface-subtle);
      outline: var(--krn-focus-ring-width) solid var(--krn-color-focus);
      outline-offset: calc(var(--krn-focus-ring-offset) * -1);
    }
    button:disabled {
      color: var(--krn-color-text-disabled);
      cursor: not-allowed;
    }
    .item-icon {
      display: grid;
      inline-size: 1.25rem;
      color: var(--krn-color-text-muted);
      font-size: var(--krn-font-size-sm);
      place-items: center;
    }
    .item-label {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    kbd {
      color: var(--krn-color-text-subtle);
      font: inherit;
      font-size: var(--krn-font-size-xs);
    }
    .submenu-chevron {
      inline-size: 0.4rem;
      block-size: 0.4rem;
      margin-inline-end: var(--krn-space-1);
      border-inline-end: 1.5px solid currentColor;
      border-block-end: 1.5px solid currentColor;
      rotate: -45deg;
    }
    :host-context([dir='rtl']) .submenu-chevron {
      rotate: 45deg;
    }
  `,
})
export class KrnContextMenu {
  private readonly platform = inject(KRN_PLATFORM);
  private readonly translations = inject(KRN_TRANSLATIONS);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly elements = viewChildren<ElementRef<HTMLButtonElement>>('contextItem');
  readonly items = input<readonly KrnContextMenuItem[]>([]);
  readonly ariaLabel = input(this.translations.navigation.contextActions);
  readonly itemSelected = output<KrnContextMenuItem>();
  protected readonly open = signal(false);
  protected readonly x = signal(0);
  protected readonly y = signal(0);
  protected readonly activeId = signal('');
  protected readonly openPath = signal<readonly string[]>([]);
  private previousFocus: HTMLElement | null = null;

  protected onContextMenu(event: MouseEvent): void {
    event.preventDefault();
    const view = this.platform.window;
    this.previousFocus = krnIsHtmlElement(this.platform, this.platform.document.activeElement)
      ? this.platform.document.activeElement
      : null;
    const panelWidth = this.items().some((item) => item.children?.length) ? 464 : 240;
    this.x.set(
      Math.min(
        event.clientX,
        Math.max(0, (view?.innerWidth ?? event.clientX + panelWidth) - panelWidth),
      ),
    );
    this.y.set(
      Math.min(event.clientY, Math.max(0, (view?.innerHeight ?? event.clientY + 288) - 288)),
    );
    this.activeId.set(this.items().find((item) => !item.disabled)?.id ?? '');
    this.openPath.set([]);
    this.open.set(true);
    this.focusById(this.activeId());
  }

  protected submenuOpen(id: string): boolean {
    return this.openPath().includes(id);
  }

  protected onPointerEnter(item: KrnContextMenuItem): void {
    if (item.disabled) return;
    this.activeId.set(item.id);
    const path = this.pathTo(item.id);
    this.openPath.set(
      path
        .filter((candidate) => candidate.id !== item.id || candidate.children?.length)
        .map((candidate) => candidate.id),
    );
  }

  protected onItemClick(event: MouseEvent, item: KrnContextMenuItem): void {
    event.stopPropagation();
    if (item.children?.length) {
      this.openBranch(item, true);
      return;
    }
    this.activate(item);
  }

  protected activate(item: KrnContextMenuItem): void {
    if (item.disabled) return;
    this.itemSelected.emit(item);
    this.open.set(false);
    this.openPath.set([]);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.defaultPrevented) return;
    event.stopPropagation();
    if (event.key === 'Escape') {
      event.preventDefault();
      const parent = this.findParent(this.activeId());
      if (parent) {
        this.openPath.set(
          this.pathTo(parent.id)
            .slice(0, -1)
            .map((item) => item.id),
        );
        this.activeId.set(parent.id);
        this.focusById(parent.id);
        return;
      }
      this.open.set(false);
      this.openPath.set([]);
      this.previousFocus?.focus();
      return;
    }
    const current = this.findItem(this.activeId());
    if (!current) return;
    const rightToLeft =
      this.platform.window?.getComputedStyle(this.host.nativeElement).direction === 'rtl';
    const openKey = rightToLeft ? 'ArrowLeft' : 'ArrowRight';
    const closeKey = rightToLeft ? 'ArrowRight' : 'ArrowLeft';
    if (event.key === openKey && current.children?.length) {
      event.preventDefault();
      this.openBranch(current, true);
      return;
    }
    if (event.key === closeKey) {
      const parent = this.findParent(current.id);
      if (!parent) return;
      event.preventDefault();
      this.openPath.set(
        this.pathTo(parent.id)
          .slice(0, -1)
          .map((item) => item.id),
      );
      this.activeId.set(parent.id);
      this.focusById(parent.id);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (current.children?.length) this.openBranch(current, true);
      else this.activate(current);
      return;
    }
    const delta = event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0;
    if (!delta && event.key !== 'Home' && event.key !== 'End') return;
    event.preventDefault();
    const siblings = this.findSiblings(current.id);
    if (siblings.length === 0) return;
    const currentIndex = siblings.findIndex((item) => item.id === current.id);
    let next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? siblings.length - 1
          : (currentIndex + delta + siblings.length) % siblings.length;
    while (siblings[next]?.disabled && next !== currentIndex) {
      next = (next + (delta || 1) + siblings.length) % siblings.length;
    }
    const nextItem = siblings[next];
    if (!nextItem || nextItem.disabled) return;
    this.activeId.set(nextItem.id);
    this.focusById(nextItem.id);
  }

  private openBranch(item: KrnContextMenuItem, focusChild: boolean): void {
    const path = this.pathTo(item.id).filter((candidate) => candidate.children?.length);
    this.openPath.set(path.map((candidate) => candidate.id));
    if (!focusChild) return;
    const child = item.children?.find((candidate) => !candidate.disabled);
    if (!child) return;
    this.activeId.set(child.id);
    this.focusById(child.id);
  }

  private findItem(id: string): KrnContextMenuItem | null {
    return this.pathTo(id).at(-1) ?? null;
  }

  private findParent(id: string): KrnContextMenuItem | null {
    return this.pathTo(id).at(-2) ?? null;
  }

  private findSiblings(id: string): readonly KrnContextMenuItem[] {
    const parent = this.findParent(id);
    return parent?.children ?? this.items();
  }

  private pathTo(id: string): readonly KrnContextMenuItem[] {
    const visit = (
      items: readonly KrnContextMenuItem[],
      path: readonly KrnContextMenuItem[],
    ): readonly KrnContextMenuItem[] => {
      for (const item of items) {
        const nextPath = [...path, item];
        if (item.id === id) return nextPath;
        const found = visit(item.children ?? [], nextPath);
        if (found.length) return found;
      }
      return [];
    };
    return visit(this.items(), []);
  }

  private focusById(id: string): void {
    if (!id) return;
    const focus = (): void => {
      this.elements()
        .find((element) => element.nativeElement.dataset['contextItem'] === id)
        ?.nativeElement.focus();
    };
    if (this.platform.schedule(focus) === null) {
      focus();
    }
  }

  @HostListener('document:click')
  @HostListener('window:blur')
  protected dismiss(): void {
    this.open.set(false);
    this.openPath.set([]);
  }
}
