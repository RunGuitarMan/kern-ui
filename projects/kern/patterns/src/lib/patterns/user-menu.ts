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
  templateUrl: './user-menu.html',
  styleUrl: './user-menu.css',
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
