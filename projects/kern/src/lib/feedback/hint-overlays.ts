import type {
  ComponentRef} from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  ElementRef,
  HostListener,
  Injector,
  PLATFORM_ID,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { A11yModule } from '@angular/cdk/a11y';
import type { OverlayRef } from '@angular/cdk/overlay';
import { Overlay, OverlayModule } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Subscription } from 'rxjs';

let nextHintId = 0;

@Component({
  selector: 'krn-tooltip-surface',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'tooltip',
    '[id]': 'id()',
  },
  template: `{{ text() }}`,
  styles: `
    :host{display:block;max-inline-size:18rem;padding:var(--krn-space-1) var(--krn-space-2);border:var(--krn-border-width-1) solid var(--krn-color-border-strong);border-radius:var(--krn-radius-sm);box-shadow:var(--krn-shadow-sm);background:var(--krn-color-surface-inverse);color:var(--krn-color-text-inverse);font-size:var(--krn-font-size-xs);line-height:var(--krn-line-height-body);overflow-wrap:anywhere;pointer-events:none}@media(prefers-reduced-motion:no-preference){:host{animation:krn-tooltip-enter var(--krn-motion-duration-fast) var(--krn-motion-ease-enter)}}@keyframes krn-tooltip-enter{from{opacity:0;transform:translateY(var(--krn-space-1))}to{opacity:1;transform:none}}
  `,
})
class KrnTooltipSurface {
  readonly id = input.required<string>();
  readonly text = input.required<string>();
}

@Directive({
  selector: '[krnTooltip]',
  standalone: true,
})
export class KrnTooltip {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly overlay = inject(Overlay);
  private readonly injector = inject(Injector);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly tooltipId = `krn-tooltip-${++nextHintId}`;
  private overlayRef?: OverlayRef;
  private componentRef?: ComponentRef<KrnTooltipSurface>;
  private subscription = new Subscription();
  private showTimer?: ReturnType<typeof setTimeout>;
  private hideTimer?: ReturnType<typeof setTimeout>;
  private hovered = false;
  private focused = false;
  readonly text = input('', { alias: 'krnTooltip' });
  readonly showDelay = input(400, { alias: 'krnTooltipShowDelay' });
  readonly hideDelay = input(80, { alias: 'krnTooltipHideDelay' });
  readonly position = input<'above' | 'below' | 'before' | 'after'>('above', {
    alias: 'krnTooltipPosition',
  });

  constructor() {
    this.destroyRef.onDestroy(() => this.dispose());
  }

  @HostListener('pointerenter')
  protected onPointerEnter(): void {
    this.hovered = true;
    this.scheduleShow();
  }

  @HostListener('pointerleave')
  protected onPointerLeave(): void {
    this.hovered = false;
    this.scheduleHide();
  }

  @HostListener('focusin')
  protected onFocus(): void {
    this.focused = true;
    this.scheduleShow();
  }

  @HostListener('focusout')
  protected onBlur(): void {
    this.focused = false;
    this.scheduleHide();
  }

  @HostListener('keydown.escape')
  protected onEscape(): void {
    this.hide();
  }

  private scheduleShow(): void {
    if (!this.text() || !isPlatformBrowser(this.platformId)) return;
    if (this.hideTimer) clearTimeout(this.hideTimer);
    this.showTimer = setTimeout(() => this.show(), Math.max(0, this.showDelay()));
  }

  private scheduleHide(): void {
    if (this.hovered || this.focused) return;
    if (this.showTimer) clearTimeout(this.showTimer);
    this.hideTimer = setTimeout(() => this.hide(), Math.max(0, this.hideDelay()));
  }

  private show(): void {
    if (this.overlayRef?.hasAttached()) return;
    const strategy = this.overlay
      .position()
      .flexibleConnectedTo(this.host)
      .withViewportMargin(8)
      .withPush(true)
      .withPositions(this.positions());
    this.overlayRef = this.overlay.create({
      positionStrategy: strategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
    });
    this.componentRef = this.overlayRef.attach(new ComponentPortal(KrnTooltipSurface, null, this.injector));
    this.componentRef.setInput('id', this.tooltipId);
    this.componentRef.setInput('text', this.text());
    const describedBy = new Set(
      (this.host.nativeElement.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean),
    );
    describedBy.add(this.tooltipId);
    this.host.nativeElement.setAttribute('aria-describedby', [...describedBy].join(' '));
    this.subscription.add(this.overlayRef.detachments().subscribe(() => this.removeDescription()));
  }

  private hide(): void {
    this.overlayRef?.dispose();
    this.overlayRef = undefined;
    this.componentRef = undefined;
    this.subscription.unsubscribe();
    this.subscription = new Subscription();
    this.removeDescription();
  }

  private dispose(): void {
    if (this.showTimer) clearTimeout(this.showTimer);
    if (this.hideTimer) clearTimeout(this.hideTimer);
    this.subscription.unsubscribe();
    this.overlayRef?.dispose();
    this.removeDescription();
  }

  private removeDescription(): void {
    const describedBy = (this.host.nativeElement.getAttribute('aria-describedby') ?? '')
      .split(/\s+/)
      .filter((id) => id && id !== this.tooltipId);
    if (describedBy.length > 0) {
      this.host.nativeElement.setAttribute('aria-describedby', describedBy.join(' '));
    } else {
      this.host.nativeElement.removeAttribute('aria-describedby');
    }
  }

  private positions() {
    const positions = {
      above: {
        originX: 'center' as const,
        originY: 'top' as const,
        overlayX: 'center' as const,
        overlayY: 'bottom' as const,
        offsetY: -6,
      },
      below: {
        originX: 'center' as const,
        originY: 'bottom' as const,
        overlayX: 'center' as const,
        overlayY: 'top' as const,
        offsetY: 6,
      },
      before: {
        originX: 'start' as const,
        originY: 'center' as const,
        overlayX: 'end' as const,
        overlayY: 'center' as const,
        offsetX: -6,
      },
      after: {
        originX: 'end' as const,
        originY: 'center' as const,
        overlayX: 'start' as const,
        overlayY: 'center' as const,
        offsetX: 6,
      },
    };
    const primary = positions[this.position()];
    const fallback = this.position() === 'above' ? positions.below : positions.above;
    return [primary, fallback];
  }
}

@Component({
  selector: 'krn-popover',
  standalone: true,
  imports: [OverlayModule, A11yModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      #origin="cdkOverlayOrigin"
      cdkOverlayOrigin
      type="button"
      class="origin"
      aria-haspopup="dialog"
      [attr.aria-expanded]="open()"
      (click)="toggle()"
      (keydown.escape)="close('escape')"
    >
      <ng-content select="[krnPopoverTrigger]" />
    </button>
    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="origin"
      [cdkConnectedOverlayOpen]="open()"
      [cdkConnectedOverlayHasBackdrop]="true"
      cdkConnectedOverlayBackdropClass="cdk-overlay-transparent-backdrop"
      [cdkConnectedOverlayPositions]="positions"
      (backdropClick)="close('outside')"
      (detach)="close('api')"
    >
      <section
        class="popover"
        role="dialog"
        [attr.aria-label]="ariaLabel()"
        cdkTrapFocus
        [cdkTrapFocusAutoCapture]="autoFocus()"
        (keydown.escape)="close('escape')"
      >
        <ng-content />
      </section>
    </ng-template>
  `,
  styles: `
    :host{display:inline-block}.origin{display:inline-flex;padding:0;border:0;background:transparent;color:inherit;font:inherit;cursor:pointer}.origin:focus-visible{outline:var(--krn-focus-ring-width) solid var(--krn-color-focus);outline-offset:var(--krn-focus-ring-offset);border-radius:var(--krn-radius-sm)}.popover{max-inline-size:min(24rem,calc(100vw - var(--krn-space-8)));max-block-size:min(30rem,calc(100dvh - var(--krn-space-8)));overflow:auto;padding:var(--krn-space-4);border:var(--krn-border-width-1) solid var(--krn-color-border);border-radius:var(--krn-radius-md);box-shadow:var(--krn-shadow-overlay);background:var(--krn-color-surface-raised);color:var(--krn-color-text);outline:none}.popover:focus-visible{box-shadow:var(--krn-focus-ring-shadow),var(--krn-shadow-overlay)}@media(prefers-reduced-motion:no-preference){.popover{animation:krn-popover-enter var(--krn-motion-duration-normal) var(--krn-motion-ease-enter)}}@keyframes krn-popover-enter{from{opacity:0;transform:translateY(calc(var(--krn-space-1) * -1))}to{opacity:1;transform:none}}
  `,
})
export class KrnPopover {
  readonly open = model(false);
  readonly ariaLabel = input('More information');
  readonly autoFocus = input(false);
  readonly closed = output<'api' | 'escape' | 'outside'>();
  protected readonly positions = [
    {
      originX: 'start' as const,
      originY: 'bottom' as const,
      overlayX: 'start' as const,
      overlayY: 'top' as const,
      offsetY: 6,
    },
    {
      originX: 'start' as const,
      originY: 'top' as const,
      overlayX: 'start' as const,
      overlayY: 'bottom' as const,
      offsetY: -6,
    },
  ];

  protected toggle(): void {
    this.open.update((value) => !value);
  }

  protected close(reason: 'api' | 'escape' | 'outside'): void {
    if (!this.open()) return;
    this.open.set(false);
    this.closed.emit(reason);
  }
}

@Component({
  selector: 'krn-hover-card',
  standalone: true,
  imports: [OverlayModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      #origin="cdkOverlayOrigin"
      cdkOverlayOrigin
      type="button"
      class="origin"
      aria-haspopup="dialog"
      [attr.aria-expanded]="open()"
      (pointerenter)="scheduleOpen()"
      (pointerleave)="scheduleClose()"
      (focusin)="scheduleOpen()"
      (focusout)="scheduleClose()"
    >
      <ng-content select="[krnHoverCardTrigger]" />
    </button>
    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="origin"
      [cdkConnectedOverlayOpen]="open()"
      [cdkConnectedOverlayPositions]="positions"
      (detach)="open.set(false)"
    >
      <section
        class="hover-card"
        role="dialog"
        [attr.aria-label]="ariaLabel()"
        (pointerenter)="cancelClose()"
        (pointerleave)="scheduleClose()"
        (focusin)="cancelClose()"
        (focusout)="scheduleClose()"
        (keydown.escape)="open.set(false)"
      >
        <ng-content />
      </section>
    </ng-template>
  `,
  styles: `
    :host{display:inline-block}.origin{display:inline-flex;padding:0;border:0;background:transparent;color:inherit;font:inherit;cursor:pointer}.origin:focus-visible{outline:var(--krn-focus-ring-width) solid var(--krn-color-focus);outline-offset:var(--krn-focus-ring-offset);border-radius:var(--krn-radius-sm)}.hover-card{max-inline-size:min(22rem,calc(100vw - var(--krn-space-8)));padding:var(--krn-space-4);border:var(--krn-border-width-1) solid var(--krn-color-border);border-radius:var(--krn-radius-md);box-shadow:var(--krn-shadow-lg);background:var(--krn-color-surface-raised);color:var(--krn-color-text)}@media(prefers-reduced-motion:no-preference){.hover-card{animation:krn-hover-enter var(--krn-motion-duration-normal) var(--krn-motion-ease-enter)}}@keyframes krn-hover-enter{from{opacity:0;transform:translateY(var(--krn-space-1))}to{opacity:1;transform:none}}
  `,
})
export class KrnHoverCard {
  private readonly destroyRef = inject(DestroyRef);
  readonly open = signal(false);
  readonly ariaLabel = input('Preview');
  readonly openDelay = input(350);
  readonly closeDelay = input(120);
  private openTimer?: ReturnType<typeof setTimeout>;
  private closeTimer?: ReturnType<typeof setTimeout>;
  protected readonly positions = [
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

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.openTimer) clearTimeout(this.openTimer);
      if (this.closeTimer) clearTimeout(this.closeTimer);
    });
  }

  protected scheduleOpen(): void {
    this.cancelClose();
    this.openTimer = setTimeout(() => this.open.set(true), Math.max(0, this.openDelay()));
  }

  protected scheduleClose(): void {
    if (this.openTimer) clearTimeout(this.openTimer);
    this.closeTimer = setTimeout(() => this.open.set(false), Math.max(0, this.closeDelay()));
  }

  protected cancelClose(): void {
    if (this.closeTimer) clearTimeout(this.closeTimer);
  }
}
