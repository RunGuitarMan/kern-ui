import type { ComponentRef } from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  ElementRef,
  HostListener,
  Injector,
  booleanAttribute,
  inject,
  input,
  model,
  numberAttribute,
  output,
  signal,
  viewChild,
} from '@angular/core';
import type { CdkConnectedOverlay, OverlayRef } from '@angular/cdk/overlay';
import { Overlay, OverlayModule } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Subscription } from 'rxjs';
import {
  KRN_PLATFORM,
  KrnIdService,
  KrnOverlayCoordinator,
  type KrnScheduledHandle,
} from '@kern-ui/angular/cdk';
import { KRN_TRANSLATIONS } from '@kern-ui/angular/core';

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
    :host {
      display: block;
      max-inline-size: 18rem;
      padding: var(--krn-space-1) var(--krn-space-2);
      border: var(--krn-border-width-1) solid var(--krn-color-border-strong);
      border-radius: var(--krn-radius-sm);
      box-shadow: var(--krn-shadow-sm);
      background: var(--krn-color-surface-inverse);
      color: var(--krn-color-text-inverse);
      font-size: var(--krn-font-size-xs);
      line-height: var(--krn-line-height-body);
      overflow-wrap: anywhere;
      pointer-events: none;
    }
    @media (prefers-reduced-motion: no-preference) {
      :host {
        animation: krn-tooltip-enter var(--krn-motion-duration-interaction)
          var(--krn-motion-ease-enter);
      }
    }
    :host-context(html[data-krn-motion='full']) {
      animation: krn-tooltip-enter var(--krn-motion-duration-interaction)
        var(--krn-motion-ease-enter);
    }
    @keyframes krn-tooltip-enter {
      from {
        opacity: 0;
        transform: translateY(var(--krn-space-1));
      }
      to {
        opacity: 1;
        transform: none;
      }
    }
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
  private readonly ids = inject(KrnIdService);
  private readonly platform = inject(KRN_PLATFORM);
  private readonly overlayCoordinator = inject(KrnOverlayCoordinator);
  private readonly destroyRef = inject(DestroyRef);
  private readonly tooltipId = this.ids.next('tooltip');
  private overlayRef?: OverlayRef;
  private componentRef?: ComponentRef<KrnTooltipSurface>;
  private subscription = new Subscription();
  private showTimer: KrnScheduledHandle | null = null;
  private hideTimer: KrnScheduledHandle | null = null;
  private hovered = false;
  private focused = false;
  readonly text = input('', { alias: 'krnTooltip' });
  readonly showDelay = input(400, {
    alias: 'krnTooltipShowDelay',
    transform: numberAttribute,
  });
  readonly hideDelay = input(80, {
    alias: 'krnTooltipHideDelay',
    transform: numberAttribute,
  });
  readonly position = input<'above' | 'below' | 'before' | 'after'>('above', {
    alias: 'krnTooltipPosition',
  });

  constructor() {
    const onKeydown = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape' || event.defaultPrevented || !this.overlayRef?.hasAttached()) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      this.onEscape();
    };
    this.host.nativeElement.addEventListener('keydown', onKeydown);
    this.destroyRef.onDestroy(() => {
      this.host.nativeElement.removeEventListener('keydown', onKeydown);
      this.dispose();
    });
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

  protected onEscape(): void {
    this.hide();
  }

  private scheduleShow(): void {
    if (!this.text() || !this.platform.isBrowser) return;
    this.platform.cancelScheduled(this.showTimer);
    this.platform.cancelScheduled(this.hideTimer);
    this.showTimer = null;
    this.hideTimer = null;
    const show = (): void => {
      this.showTimer = null;
      this.show();
    };
    this.showTimer = this.platform.schedule(show, Math.max(0, this.showDelay()));
    if (this.showTimer === null) show();
  }

  private scheduleHide(): void {
    if (this.hovered || this.focused) return;
    this.platform.cancelScheduled(this.showTimer);
    this.platform.cancelScheduled(this.hideTimer);
    this.showTimer = null;
    this.hideTimer = null;
    const hide = (): void => {
      this.hideTimer = null;
      this.hide();
    };
    this.hideTimer = this.platform.schedule(hide, Math.max(0, this.hideDelay()));
    if (this.hideTimer === null) hide();
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
      panelClass: 'krn-overlay-pane',
      positionStrategy: strategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
    });
    this.componentRef = this.overlayRef.attach(
      new ComponentPortal(KrnTooltipSurface, null, this.injector),
    );
    this.overlayCoordinator.registerOverlayOwnership(
      this.host.nativeElement,
      this.overlayRef.overlayElement,
      this.overlayRef.backdropElement,
    );
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
    this.platform.cancelScheduled(this.showTimer);
    this.platform.cancelScheduled(this.hideTimer);
    this.showTimer = null;
    this.hideTimer = null;
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
  imports: [OverlayModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      #trigger
      #origin="cdkOverlayOrigin"
      cdkOverlayOrigin
      type="button"
      class="origin"
      [attr.aria-expanded]="open()"
      [attr.aria-controls]="open() ? panelId : null"
      (click)="toggle()"
      (keydown.escape)="
        $event.defaultPrevented || !open()
          ? undefined
          : [$event.preventDefault(), $event.stopPropagation(), close('escape')]
      "
    >
      <ng-content select="[krnPopoverTrigger]" />
    </button>
    <ng-template
      #connectedOverlay="cdkConnectedOverlay"
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="origin"
      [cdkConnectedOverlayOpen]="open()"
      [cdkConnectedOverlayPositions]="positions"
      cdkConnectedOverlayPanelClass="krn-overlay-pane"
      (attach)="registerOverlay(connectedOverlay, origin.elementRef.nativeElement); focusPanel()"
      (overlayOutsideClick)="close('outside')"
      (detach)="close('api')"
    >
      <section
        #panel
        [id]="panelId"
        class="popover"
        role="region"
        [attr.aria-label]="ariaLabel()"
        tabindex="-1"
        (keydown.escape)="
          $event.defaultPrevented || !open()
            ? undefined
            : [$event.preventDefault(), $event.stopPropagation(), close('escape')]
        "
      >
        <ng-content />
      </section>
    </ng-template>
  `,
  styles: `
    :host {
      display: inline-block;
    }
    .origin {
      display: inline-flex;
      padding: 0;
      border: 0;
      background: transparent;
      color: inherit;
      font: inherit;
      cursor: pointer;
    }
    .origin:focus-visible {
      outline: var(--krn-focus-ring-width) solid var(--krn-color-focus);
      outline-offset: var(--krn-focus-ring-offset);
      border-radius: var(--krn-radius-sm);
    }
    .popover {
      max-inline-size: min(24rem, calc(100vw - var(--krn-space-8)));
      max-block-size: min(30rem, calc(100dvh - var(--krn-space-8)));
      overflow: auto;
      padding: var(--krn-space-4);
      border: var(--krn-border-width-1) solid var(--krn-color-border);
      border-radius: var(--krn-radius-md);
      box-shadow: var(--krn-shadow-overlay);
      background: var(--krn-color-surface-raised);
      color: var(--krn-color-text);
      outline: none;
    }
    .popover:focus-visible {
      box-shadow: var(--krn-focus-ring-shadow), var(--krn-shadow-overlay);
    }
    @media (prefers-reduced-motion: no-preference) {
      .popover {
        animation: krn-popover-enter var(--krn-motion-duration-enter) var(--krn-motion-ease-enter);
      }
    }
    :host-context(html[data-krn-motion='full']) .popover {
      animation: krn-popover-enter var(--krn-motion-duration-enter) var(--krn-motion-ease-enter);
    }
    @keyframes krn-popover-enter {
      from {
        opacity: 0;
        transform: translateY(calc(var(--krn-space-1) * -1));
      }
      to {
        opacity: 1;
        transform: none;
      }
    }
  `,
})
export class KrnPopover {
  private readonly ids = inject(KrnIdService);
  private readonly overlayCoordinator = inject(KrnOverlayCoordinator);
  private readonly platform = inject(KRN_PLATFORM);
  private readonly translations = inject(KRN_TRANSLATIONS);
  private readonly trigger = viewChild<ElementRef<HTMLButtonElement>>('trigger');
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  protected readonly panelId = this.ids.next('popover');
  readonly open = model(false);
  readonly ariaLabel = input(this.translations.feedback.moreInformation);
  readonly autoFocus = input(true, { transform: booleanAttribute });
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

  protected registerOverlay(overlay: CdkConnectedOverlay, origin: HTMLElement): void {
    this.overlayCoordinator.registerOverlayOwnership(
      origin,
      overlay.overlayRef.overlayElement,
      overlay.overlayRef.backdropElement,
    );
  }

  protected focusPanel(): void {
    if (!this.autoFocus()) return;
    this.platform.queueMicrotask(() => this.panel()?.nativeElement.focus());
  }

  protected close(reason: 'api' | 'escape' | 'outside'): void {
    if (!this.open()) return;
    const restoreFocus =
      reason === 'escape' ||
      (reason === 'api' &&
        this.panel()?.nativeElement.contains(this.platform.document.activeElement));
    this.open.set(false);
    this.closed.emit(reason);
    if (restoreFocus) {
      this.platform.queueMicrotask(() => this.trigger()?.nativeElement.focus());
    }
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
      [attr.aria-describedby]="open() ? panelId : null"
      (pointerenter)="scheduleOpen()"
      (pointerleave)="scheduleClose()"
      (focusin)="scheduleOpen()"
      (focusout)="scheduleClose()"
      (keydown.escape)="
        $event.defaultPrevented || !open()
          ? undefined
          : [$event.preventDefault(), $event.stopPropagation(), closeImmediately()]
      "
    >
      <ng-content select="[krnHoverCardTrigger]" />
    </button>
    <ng-template
      #connectedOverlay="cdkConnectedOverlay"
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="origin"
      [cdkConnectedOverlayOpen]="open()"
      [cdkConnectedOverlayPositions]="positions"
      cdkConnectedOverlayPanelClass="krn-overlay-pane"
      (attach)="registerOverlay(connectedOverlay, origin.elementRef.nativeElement)"
      (detach)="closeImmediately()"
    >
      <section
        [id]="panelId"
        class="hover-card"
        role="tooltip"
        (pointerenter)="cancelClose()"
        (pointerleave)="scheduleClose()"
      >
        <span class="visually-hidden">{{ ariaLabel() }}</span>
        <ng-content />
      </section>
    </ng-template>
  `,
  styles: `
    :host {
      display: inline-block;
    }
    .origin {
      display: inline-flex;
      padding: 0;
      border: 0;
      background: transparent;
      color: inherit;
      font: inherit;
      cursor: pointer;
    }
    .origin:focus-visible {
      outline: var(--krn-focus-ring-width) solid var(--krn-color-focus);
      outline-offset: var(--krn-focus-ring-offset);
      border-radius: var(--krn-radius-sm);
    }
    .hover-card {
      max-inline-size: min(22rem, calc(100vw - var(--krn-space-8)));
      padding: var(--krn-space-4);
      border: var(--krn-border-width-1) solid var(--krn-color-border);
      border-radius: var(--krn-radius-md);
      box-shadow: var(--krn-shadow-lg);
      background: var(--krn-color-surface-raised);
      color: var(--krn-color-text);
    }
    .visually-hidden {
      position: absolute;
      inline-size: 1px;
      block-size: 1px;
      margin: -1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }
    @media (prefers-reduced-motion: no-preference) {
      .hover-card {
        animation: krn-hover-enter var(--krn-motion-duration-enter) var(--krn-motion-ease-enter);
      }
    }
    :host-context(html[data-krn-motion='full']) .hover-card {
      animation: krn-hover-enter var(--krn-motion-duration-enter) var(--krn-motion-ease-enter);
    }
    @keyframes krn-hover-enter {
      from {
        opacity: 0;
        transform: translateY(var(--krn-space-1));
      }
      to {
        opacity: 1;
        transform: none;
      }
    }
  `,
})
export class KrnHoverCard {
  private readonly destroyRef = inject(DestroyRef);
  private readonly overlayCoordinator = inject(KrnOverlayCoordinator);
  private readonly platform = inject(KRN_PLATFORM);
  private readonly ids = inject(KrnIdService);
  private readonly translations = inject(KRN_TRANSLATIONS);
  protected readonly open = signal(false);
  protected readonly panelId = this.ids.next('hover-card');
  readonly ariaLabel = input(this.translations.feedback.preview);
  readonly openDelay = input(350, { transform: numberAttribute });
  readonly closeDelay = input(120, { transform: numberAttribute });
  private openTimer: KrnScheduledHandle | null = null;
  private closeTimer: KrnScheduledHandle | null = null;
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
      this.platform.cancelScheduled(this.openTimer);
      this.platform.cancelScheduled(this.closeTimer);
    });
  }

  protected registerOverlay(overlay: CdkConnectedOverlay, origin: HTMLElement): void {
    this.overlayCoordinator.registerOverlayOwnership(
      origin,
      overlay.overlayRef.overlayElement,
      overlay.overlayRef.backdropElement,
    );
  }

  protected scheduleOpen(): void {
    this.cancelClose();
    this.platform.cancelScheduled(this.openTimer);
    this.openTimer = null;
    const open = (): void => {
      this.openTimer = null;
      this.open.set(true);
    };
    this.openTimer = this.platform.schedule(open, Math.max(0, this.openDelay()));
    if (this.openTimer === null) open();
  }

  protected scheduleClose(): void {
    this.platform.cancelScheduled(this.openTimer);
    this.platform.cancelScheduled(this.closeTimer);
    this.openTimer = null;
    this.closeTimer = null;
    const close = (): void => {
      this.closeTimer = null;
      this.open.set(false);
    };
    this.closeTimer = this.platform.schedule(close, Math.max(0, this.closeDelay()));
    if (this.closeTimer === null) close();
  }

  protected cancelClose(): void {
    this.platform.cancelScheduled(this.closeTimer);
    this.closeTimer = null;
  }

  protected closeImmediately(): void {
    this.platform.cancelScheduled(this.openTimer);
    this.platform.cancelScheduled(this.closeTimer);
    this.openTimer = null;
    this.closeTimer = null;
    this.open.set(false);
  }
}
