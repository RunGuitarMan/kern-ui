import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  Injector,
  input,
  model,
  viewChild,
} from '@angular/core';
import { KRN_PLATFORM, KrnIdService, krnIsElement, krnIsNode } from '@kern-ui/angular/cdk';
import { KRN_TRANSLATIONS } from '@kern-ui/angular/core';

@Component({
  selector: 'krn-user-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'krn-user-menu',
    '[attr.data-open]': 'open() ? "" : null',
  },
  template: `
    <div class="root" (focusout)="onFocusOut($event)">
      <button
        type="button"
        class="trigger"
        [attr.aria-expanded]="open()"
        [attr.aria-controls]="open() ? menuId : null"
        aria-haspopup="menu"
        (click)="toggleMenu()"
        (keydown)="onTriggerKeydown($event)"
      >
        <ng-content select="[krnUserAvatar]" />
        <span class="identity">
          <strong>{{ resolvedName() }}</strong>
          @if (resolvedDetail()) {
            <small>{{ resolvedDetail() }}</small>
          }
        </span>
        <span class="chevron" aria-hidden="true"></span>
      </button>
      @if (open()) {
        <div
          #menu
          class="menu krn-user-menu__menu"
          [id]="menuId"
          role="menu"
          [attr.aria-label]="resolvedMenuAriaLabel()"
          (click)="onMenuClick($event)"
          (keydown)="onMenuKeydown($event)"
        >
          <ng-content />
        </div>
      }
    </div>
  `,
  styles: `
    :host {
      display: inline-block;
      max-inline-size: 100%;
      color: var(--krn-color-text, #252932);
    }
    :host([hidden]) {
      display: none;
    }
    .root {
      position: relative;
      inline-size: fit-content;
      max-inline-size: 100%;
    }
    .trigger {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      min-block-size: 3.25rem;
      align-items: center;
      gap: 0.75rem;
      min-inline-size: min(17rem, calc(100vw - 2rem));
      max-inline-size: 20rem;
      padding: 0.5rem 0.625rem;
      border: 1px solid var(--krn-color-border, #cdd1d7);
      border-radius: var(--krn-radius-md, 0.5rem);
      color: inherit;
      background: var(--krn-color-surface, #fff);
      font: inherit;
      text-align: start;
      cursor: pointer;
      transition:
        border-color var(--krn-motion-duration-interaction) var(--krn-ease-standard, ease),
        background-color var(--krn-motion-duration-interaction) var(--krn-ease-standard, ease);
    }
    .trigger:hover,
    :host([data-open]) .trigger {
      border-color: var(--krn-color-border-strong, #aeb4bd);
      background: var(--krn-color-surface-hover, #f2f3f5);
    }
    .trigger:focus-visible {
      border-color: var(--krn-color-focus, #4f6feb);
      box-shadow: var(--krn-focus-ring);
      outline: 2px solid transparent;
      outline-offset: 2px;
    }
    .identity {
      display: grid;
      min-inline-size: 0;
    }
    strong,
    small {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    strong {
      font-size: var(--krn-font-size-md, 0.9375rem);
      font-weight: 600;
      line-height: 1.25;
    }
    small {
      color: var(--krn-color-text-muted, #626a76);
      font-size: var(--krn-font-size-sm, 0.8125rem);
      line-height: 1.25;
    }
    .chevron {
      inline-size: 0.5rem;
      block-size: 0.5rem;
      border-inline-end: 1.5px solid currentColor;
      border-block-end: 1.5px solid currentColor;
      rotate: 45deg;
      translate: 0 -0.125rem;
      transition:
        rotate var(--krn-motion-duration-interaction) var(--krn-ease-standard, ease),
        translate var(--krn-motion-duration-interaction) var(--krn-ease-standard, ease);
    }
    :host([data-open]) .chevron {
      rotate: 225deg;
      translate: 0 0.125rem;
    }
    .menu {
      position: absolute;
      z-index: var(--krn-z-dropdown, 500);
      inset-block-start: calc(100% + 0.375rem);
      inset-inline-start: 0;
      display: grid;
      inline-size: max(100%, 15rem);
      max-inline-size: min(20rem, calc(100vw - 2rem));
      padding: 0.25rem;
      border: 1px solid var(--krn-color-border, #cdd1d7);
      border-radius: var(--krn-radius-lg, 0.75rem);
      background: var(--krn-color-surface-overlay, #fff);
      box-shadow: var(--krn-shadow-overlay, 0 12px 32px rgb(20 24 32 / 0.14));
      animation: user-menu-in var(--krn-motion-duration-enter) var(--krn-ease-enter, ease-out);
      transform-origin: top left;
    }
    :host-context([dir='rtl']) .menu {
      transform-origin: top right;
    }
    @keyframes user-menu-in {
      from {
        opacity: 0;
        scale: 0.98;
        translate: 0 -0.25rem;
      }
      to {
        opacity: 1;
        scale: 1;
        translate: 0;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      :host-context(html:not([data-krn-motion='full'])) .menu {
        animation: none;
      }
    }
    @media (forced-colors: active) {
      .trigger,
      .menu {
        border-color: CanvasText;
      }
      .trigger:focus-visible {
        outline: 2px solid Highlight;
        outline-offset: 2px;
        box-shadow: none;
      }
    }
  `,
})
export class KrnUserMenu {
  private readonly platform = inject(KRN_PLATFORM);
  private readonly translations = inject(KRN_TRANSLATIONS);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly menuId = inject(KrnIdService).next('user-menu');
  readonly name = input.required<string>();
  readonly detail = input('');
  readonly menuAriaLabel = input<typeof this.translations.patterns.userActions | undefined>();
  readonly open = model(false);
  private readonly menu = viewChild<ElementRef<HTMLElement>>('menu');
  protected readonly resolvedName = computed(() => {
    const name = this.name();
    const normalized = typeof name === 'string' ? name.trim() : '';
    if (!normalized) throw new Error('KrnUserMenu requires a non-empty name.');
    return normalized;
  });
  protected readonly resolvedDetail = computed(() => {
    const detail = this.detail();
    return typeof detail === 'string' ? detail.trim() : '';
  });
  protected readonly resolvedMenuAriaLabel = computed(() => {
    const inputLabel = this.menuAriaLabel();
    const label = typeof inputLabel === 'string' ? inputLabel.trim() : '';
    return label || this.translations.patterns.userActions.trim() || 'User actions';
  });
  private readonly blockDisabledActivation = effect((onCleanup) => {
    const menu = this.menu()?.nativeElement;
    if (!menu) return;
    this.prepareMenuItems();
    const captureDisabledClick = (event: Event): void => {
      if (!krnIsElement(this.platform, event.target)) return;
      const item = event.target.closest<HTMLElement>(
        '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]',
      );
      if (!item || (!item.matches(':disabled') && item.getAttribute('aria-disabled') !== 'true')) {
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    menu.addEventListener('click', captureDisabledClick, true);
    onCleanup(() => menu.removeEventListener('click', captureDisabledClick, true));
  });

  constructor() {
    if (!this.platform.isBrowser) return;
    const listener = (event: PointerEvent): void => this.closeOnOutsidePointer(event);
    this.platform.document.addEventListener('pointerdown', listener);
    this.destroyRef.onDestroy(() =>
      this.platform.document.removeEventListener('pointerdown', listener),
    );
  }

  protected toggleMenu(): void {
    const next = !this.open();
    this.open.set(next);
    if (next) {
      this.focusMenuItem(0);
    }
  }

  protected onTriggerKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.open()) {
      event.preventDefault();
      this.closeAndFocus();
      return;
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
      return;
    }
    event.preventDefault();
    this.open.set(true);
    this.focusMenuItem(event.key === 'ArrowDown' ? 0 : -1);
  }

  protected onMenuKeydown(event: KeyboardEvent): void {
    if (event.key === 'Tab') {
      this.open.set(false);
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeAndFocus();
      return;
    }
    const items = this.menuItems();
    if (!items.length) return;
    const current = items.indexOf(this.platform.document.activeElement as HTMLElement);
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? items.length - 1
          : event.key === 'ArrowDown'
            ? (current + 1) % items.length
            : event.key === 'ArrowUp'
              ? (current - 1 + items.length) % items.length
              : -1;
    if (next < 0) {
      return;
    }
    event.preventDefault();
    items[next]?.focus();
  }

  protected onMenuClick(event: MouseEvent): void {
    if (!krnIsElement(this.platform, event.target)) return;
    const item = event.target.closest<HTMLElement>(
      '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]',
    );
    if (!item || item.matches(':disabled') || item.getAttribute('aria-disabled') === 'true') return;
    this.closeAndFocus(item);
  }

  protected onFocusOut(event: FocusEvent): void {
    if (
      krnIsNode(this.platform, event.relatedTarget) &&
      krnIsNode(this.platform, event.currentTarget) &&
      event.currentTarget.contains(event.relatedTarget)
    ) {
      return;
    }
    this.open.set(false);
  }

  protected closeOnOutsidePointer(event: PointerEvent): void {
    if (
      this.open() &&
      krnIsNode(this.platform, event.target) &&
      !this.host.nativeElement.contains(event.target)
    ) {
      this.open.set(false);
    }
  }

  private closeAndFocus(source?: HTMLElement): void {
    this.open.set(false);
    const focus = (): void => {
      const active = this.platform.document.activeElement;
      if (source && active !== source && active !== this.platform.document.body) return;
      this.host.nativeElement.querySelector<HTMLButtonElement>('.trigger')?.focus();
    };
    this.platform.queueMicrotask(focus);
  }

  private menuItems(): HTMLElement[] {
    return this.allMenuItems().filter(
      (item) => !item.matches(':disabled') && item.getAttribute('aria-disabled') !== 'true',
    );
  }

  private allMenuItems(): HTMLElement[] {
    return Array.from(
      this.host.nativeElement.querySelectorAll<HTMLElement>(
        '.menu :is([role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"])',
      ),
    );
  }

  private prepareMenuItems(): void {
    for (const item of this.allMenuItems()) item.tabIndex = -1;
  }

  private focusMenuItem(index: number): void {
    const focusRequestedItem = (): void => {
      this.prepareMenuItems();
      const items = this.menuItems();
      items[index < 0 ? items.length - 1 : index]?.focus();
    };

    if (this.menuItems().length) {
      focusRequestedItem();
      return;
    }

    afterNextRender({ write: focusRequestedItem }, { injector: this.injector });
  }
}
