import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  Directive,
  ElementRef,
  HostListener,
  inject,
  Injector,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';
import type { CdkConnectedOverlay } from '@angular/cdk/overlay';
import { OverlayModule } from '@angular/cdk/overlay';
import { KRN_PLATFORM, KrnOverlayCoordinator, krnIsElement, krnIsNode } from '@kern-ui/angular/cdk';
import { KRN_TRANSLATIONS } from '@kern-ui/angular/core';
import type { KrnActionVariant, KrnSize, KrnTone } from './action-types';

@Directive()
/**
 * Shared behavior for menu-button variants.
 *
 * @experimental Extension API; prefer `KrnDropdownButton` or `KrnSplitButton`
 * unless a custom menu-button primitive is required.
 */
export abstract class KrnMenuButtonBase {
  private readonly platform = inject(KRN_PLATFORM);
  private readonly overlayCoordinator = inject(KrnOverlayCoordinator);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly menuPanel = viewChild<ElementRef<HTMLElement>>('menuPanel');
  protected readonly translations = inject(KRN_TRANSLATIONS);

  readonly size = input<KrnSize>('md');
  readonly variant = input<KrnActionVariant>('solid');
  readonly tone = input<KrnTone>('brand');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly loading = input(false, { transform: booleanAttribute });
  readonly open = model(false);

  protected readonly isDisabled = computed(() => this.disabled() || this.loading());
  protected readonly menuPositions = [
    {
      originX: 'end' as const,
      originY: 'bottom' as const,
      overlayX: 'end' as const,
      overlayY: 'top' as const,
      offsetY: 8,
    },
    {
      originX: 'end' as const,
      originY: 'top' as const,
      overlayX: 'end' as const,
      overlayY: 'bottom' as const,
      offsetY: -8,
    },
    {
      originX: 'start' as const,
      originY: 'bottom' as const,
      overlayX: 'start' as const,
      overlayY: 'top' as const,
      offsetY: 8,
    },
    {
      originX: 'start' as const,
      originY: 'top' as const,
      overlayX: 'start' as const,
      overlayY: 'bottom' as const,
      offsetY: -8,
    },
  ];

  protected setOpen(open: boolean): void {
    if (open && this.isDisabled()) {
      return;
    }
    this.open.set(open);
  }

  protected toggleMenu(): void {
    const next = !this.open();
    this.setOpen(next);
    if (next) {
      this.focusMenuItem('first');
    }
  }

  protected registerOverlay(overlay: CdkConnectedOverlay, origin: HTMLElement): void {
    this.overlayCoordinator.registerOverlayOwnership(
      origin,
      overlay.overlayRef.overlayElement,
      overlay.overlayRef.backdropElement,
    );
  }

  protected closeFromMenu(event: MouseEvent): void {
    const target = event.target;
    if (krnIsElement(this.platform, target) && target.closest('[data-krn-menu-keep-open]')) {
      return;
    }
    this.setOpen(false);
    this.focusTrigger();
  }

  protected onTriggerKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.setOpen(true);
      this.focusMenuItem(event.key === 'ArrowDown' ? 'first' : 'last');
    }
  }

  protected onMenuKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      if (event.defaultPrevented) return;
      event.preventDefault();
      event.stopPropagation();
      this.setOpen(false);
      this.focusTrigger();
      return;
    }
    if (event.key === 'Tab') {
      if (this.platform.schedule(() => this.setOpen(false)) === null) {
        this.setOpen(false);
      }
      return;
    }

    const items = this.menuItems();
    if (items.length === 0) {
      return;
    }
    const current = items.indexOf(this.platform.document.activeElement as HTMLElement);
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
    if (target < 0) {
      return;
    }
    event.preventDefault();
    items[target]?.focus();
  }

  protected closeOnFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget;
    const current = event.currentTarget;
    if (
      krnIsNode(this.platform, next) &&
      ((krnIsNode(this.platform, current) && current.contains(next)) ||
        this.menuPanel()?.nativeElement.contains(next))
    ) {
      return;
    }
    this.setOpen(false);
  }

  @HostListener('document:pointerdown', ['$event'])
  protected closeOnOutsidePointer(event: PointerEvent): void {
    if (
      this.open() &&
      krnIsNode(this.platform, event.target) &&
      !this.host.nativeElement.contains(event.target) &&
      !this.menuPanel()?.nativeElement.contains(event.target)
    ) {
      this.setOpen(false);
    }
  }

  private menuItems(): HTMLElement[] {
    return Array.from(
      this.menuPanel()?.nativeElement.querySelectorAll<HTMLElement>(
        '[role="menuitem"]:not([disabled])',
      ) ?? [],
    );
  }

  private focusMenuItem(position: 'first' | 'last'): void {
    const focusRequestedItem = (): void => {
      const items = this.menuItems();
      items[position === 'first' ? 0 : items.length - 1]?.focus();
    };

    if (this.menuItems().length) {
      focusRequestedItem();
      return;
    }

    afterNextRender({ write: focusRequestedItem }, { injector: this.injector });
  }

  private focusTrigger(): void {
    const focus = (): void =>
      this.host.nativeElement
        .querySelector<HTMLButtonElement>('.krn-action[aria-haspopup="menu"]')
        ?.focus();
    this.platform.queueMicrotask(focus);
  }
}

@Component({
  selector: 'krn-dropdown-button',
  imports: [OverlayModule],
  template: `
    <span
      #origin="cdkOverlayOrigin"
      cdkOverlayOrigin
      class="krn-dropdown"
      (focusout)="closeOnFocusOut($event)"
    >
      <button
        class="krn-action"
        type="button"
        aria-haspopup="menu"
        [attr.aria-expanded]="open()"
        [attr.data-loading]="loading()"
        [attr.data-size]="size()"
        [attr.data-tone]="tone()"
        [attr.data-variant]="variant()"
        [disabled]="isDisabled()"
        (click)="toggleMenu()"
        (keydown)="onTriggerKeydown($event)"
      >
        <span class="krn-action__label"><ng-content select="[krnLabel]" /></span>
        <span class="krn-chevron" aria-hidden="true"></span>
      </button>
    </span>
    <ng-template
      #connectedOverlay="cdkConnectedOverlay"
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="origin"
      [cdkConnectedOverlayOpen]="open()"
      [cdkConnectedOverlayPositions]="menuPositions"
      [cdkConnectedOverlayPush]="true"
      [cdkConnectedOverlayFlexibleDimensions]="true"
      [cdkConnectedOverlayViewportMargin]="8"
      [cdkConnectedOverlayUsePopover]="null"
      cdkConnectedOverlayTransformOriginOn=".krn-action-menu"
      [cdkConnectedOverlayHasBackdrop]="true"
      [cdkConnectedOverlayBackdropClass]="[
        'cdk-overlay-transparent-backdrop',
        'krn-overlay-backdrop',
      ]"
      cdkConnectedOverlayPanelClass="krn-overlay-pane"
      (attach)="registerOverlay(connectedOverlay, origin.elementRef.nativeElement)"
      (backdropClick)="setOpen(false)"
      (detach)="setOpen(false)"
    >
      @if (open()) {
        <div
          #menuPanel
          class="krn-action-menu"
          role="menu"
          (click)="closeFromMenu($event)"
          (focusout)="closeOnFocusOut($event)"
          (keydown)="onMenuKeydown($event)"
        >
          <ng-content select="[krnMenu]" />
        </div>
      }
    </ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnDropdownButton extends KrnMenuButtonBase {}

@Component({
  selector: 'krn-split-button',
  imports: [OverlayModule],
  template: `
    <span
      #origin="cdkOverlayOrigin"
      cdkOverlayOrigin
      class="krn-split"
      (focusout)="closeOnFocusOut($event)"
    >
      <button
        class="krn-action"
        type="button"
        [attr.data-loading]="loading()"
        [attr.data-size]="size()"
        [attr.data-tone]="tone()"
        [attr.data-variant]="variant()"
        [disabled]="isDisabled()"
        (click)="activatePrimary($event)"
      >
        <span class="krn-action__label"><ng-content select="[krnLabel]" /></span>
      </button>
      <button
        class="krn-action"
        type="button"
        aria-haspopup="menu"
        [attr.aria-expanded]="open()"
        [attr.aria-label]="menuLabel()"
        [attr.data-size]="size()"
        [attr.data-tone]="tone()"
        [attr.data-variant]="variant()"
        [disabled]="isDisabled()"
        (click)="toggleMenu()"
        (keydown)="onTriggerKeydown($event)"
      >
        <span class="krn-chevron" aria-hidden="true"></span>
      </button>
    </span>
    <ng-template
      #connectedOverlay="cdkConnectedOverlay"
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="origin"
      [cdkConnectedOverlayOpen]="open()"
      [cdkConnectedOverlayPositions]="menuPositions"
      [cdkConnectedOverlayPush]="true"
      [cdkConnectedOverlayFlexibleDimensions]="true"
      [cdkConnectedOverlayViewportMargin]="8"
      [cdkConnectedOverlayUsePopover]="null"
      cdkConnectedOverlayTransformOriginOn=".krn-action-menu"
      [cdkConnectedOverlayHasBackdrop]="true"
      [cdkConnectedOverlayBackdropClass]="[
        'cdk-overlay-transparent-backdrop',
        'krn-overlay-backdrop',
      ]"
      cdkConnectedOverlayPanelClass="krn-overlay-pane"
      (attach)="registerOverlay(connectedOverlay, origin.elementRef.nativeElement)"
      (backdropClick)="setOpen(false)"
      (detach)="setOpen(false)"
    >
      @if (open()) {
        <div
          #menuPanel
          class="krn-action-menu"
          role="menu"
          (click)="closeFromMenu($event)"
          (focusout)="closeOnFocusOut($event)"
          (keydown)="onMenuKeydown($event)"
        >
          <ng-content select="[krnMenu]" />
        </div>
      }
    </ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnSplitButton extends KrnMenuButtonBase {
  readonly menuLabel = input(this.translations.actions.moreActions);
  readonly primaryAction = output<MouseEvent>();

  protected activatePrimary(event: MouseEvent): void {
    if (!this.isDisabled()) {
      this.primaryAction.emit(event);
    }
  }
}
