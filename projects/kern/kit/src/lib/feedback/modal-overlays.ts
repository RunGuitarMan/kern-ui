import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  type TemplateRef,
  viewChild,
} from '@angular/core';
import type { ModelSignal, OutputEmitterRef, Signal } from '@angular/core';
import { A11yModule } from '@angular/cdk/a11y';
import { NgTemplateOutlet } from '@angular/common';
import {
  KRN_PLATFORM,
  KrnIdService,
  KrnOverlayCoordinator,
  krnPrefersReducedMotion,
  type KrnOverlayInitialFocus,
  type KrnScheduledHandle,
} from '@kern-ui/angular/cdk';
import { KRN_TRANSLATIONS } from '@kern-ui/angular/core';
import { krnInputFallback } from '../reactive-input';
import type { KrnOverlayCloseReason, KrnOverlayPosition } from './feedback.types';

function nullableBooleanAttribute(value: unknown): boolean | null {
  return value === null || value === undefined ? null : booleanAttribute(value);
}

const overlayExitDuration = 260;

interface KrnOverlaySurfaceDefinition {
  readonly position: KrnOverlayPosition;
  readonly role: 'dialog' | 'alertdialog';
  readonly closeOnOutside: boolean;
}

interface KrnOverlaySurfaceHost {
  readonly open: ModelSignal<boolean>;
  readonly closeOnEscape: Signal<boolean>;
  readonly closeOnOutside: Signal<boolean | null>;
  readonly initialFocus: Signal<KrnOverlayInitialFocus>;
  readonly restoreFocus: Signal<HTMLElement | false | null>;
  readonly closed: OutputEmitterRef<KrnOverlayCloseReason>;
  readonly afterExited: OutputEmitterRef<void>;
}

const DIALOG_SURFACE: KrnOverlaySurfaceDefinition = {
  position: 'center',
  role: 'dialog',
  closeOnOutside: true,
};
const ALERT_DIALOG_SURFACE: KrnOverlaySurfaceDefinition = {
  position: 'center',
  role: 'alertdialog',
  closeOnOutside: false,
};
const DRAWER_SURFACE: KrnOverlaySurfaceDefinition = {
  position: 'inline-end',
  role: 'dialog',
  closeOnOutside: true,
};
const BOTTOM_SHEET_SURFACE: KrnOverlaySurfaceDefinition = {
  position: 'bottom',
  role: 'dialog',
  closeOnOutside: true,
};

/** Internal signal controller shared by the public declarative overlay components. */
class KrnOverlaySurfaceController {
  private readonly ids = inject(KrnIdService);
  private readonly platform = inject(KRN_PLATFORM);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly coordinator = inject(KrnOverlayCoordinator);
  private readonly destroyRef = inject(DestroyRef);
  private exitTimer: KrnScheduledHandle | null = null;
  private focusTimer: KrnScheduledHandle | null = null;
  private lifecycle: 'closed' | 'open' | 'exiting' = 'closed';
  private coordinatorActive = false;
  readonly rendered = signal(false);
  readonly closing = signal(false);
  private readonly overlayId = this.ids.next('overlay');
  readonly titleId = `${this.overlayId}-title`;
  readonly descriptionId = `${this.overlayId}-description`;

  constructor(
    private readonly surfaceHost: KrnOverlaySurfaceHost,
    private readonly resolvePanel: () => HTMLElement | undefined,
    private readonly definition: KrnOverlaySurfaceDefinition,
  ) {
    effect(() => {
      const open = this.surfaceHost.open();
      if (open) {
        this.beginOpen(this.surfaceHost.closeOnEscape());
        return;
      }
      if (this.lifecycle === 'open') this.beginExit();
    });

    this.destroyRef.onDestroy(() => {
      this.cancelFocus();
      this.cancelExit();
      if (this.coordinatorActive) {
        this.coordinator.deactivate(this.overlayId, 0, this.surfaceHost.restoreFocus() !== false);
        this.coordinatorActive = false;
      }
    });
  }

  surfacePosition(): KrnOverlayPosition {
    return this.definition.position;
  }

  surfaceRole(): 'dialog' | 'alertdialog' {
    return this.definition.role;
  }

  defaultOutsideClose(): boolean {
    return this.definition.closeOnOutside;
  }

  close(reason: KrnOverlayCloseReason): void {
    if (!this.surfaceHost.open()) return;
    this.surfaceHost.open.set(false);
    this.surfaceHost.closed.emit(reason);
  }

  onBackdropTransitionEnd(event: TransitionEvent): void {
    if (
      this.closing() &&
      event.target === event.currentTarget &&
      event.propertyName === 'opacity'
    ) {
      this.finishExit();
    }
  }

  onBackdropAnimationEnd(event: AnimationEvent): void {
    if (this.closing() && event.target === this.resolvePanel()) {
      this.finishExit();
    }
  }

  onBackdropPointerdown(event: PointerEvent): void {
    if (
      event.target === event.currentTarget &&
      (this.surfaceHost.closeOnOutside() ?? this.defaultOutsideClose())
    ) {
      this.close('outside');
    }
  }

  private prefersReducedMotion(): boolean {
    return krnPrefersReducedMotion(this.platform);
  }

  private beginOpen(closeOnEscape: boolean): void {
    const wasClosed = this.lifecycle === 'closed';
    this.cancelExit();
    this.lifecycle = 'open';
    this.rendered.set(true);
    this.closing.set(false);

    if (!this.platform.isBrowser) return;

    const requestClose = closeOnEscape ? () => this.close('escape') : null;
    if (this.coordinatorActive) {
      this.coordinator.updateCloseRequest(this.overlayId, requestClose);
      return;
    }

    this.coordinator.activate(
      this.overlayId,
      this.host.nativeElement,
      this.surfaceHost.restoreFocus(),
      requestClose,
    );
    this.coordinatorActive = true;

    if (!wasClosed) return;
    const focus = (): void => {
      this.focusTimer = null;
      const panel = this.resolvePanel();
      if (panel && this.surfaceHost.open() && this.coordinator.isTop(this.overlayId)) {
        this.coordinator.focusInitial(panel, this.surfaceHost.initialFocus());
      }
    };
    this.focusTimer = this.platform.schedule(focus);
    if (this.focusTimer === null) focus();
  }

  private beginExit(): void {
    this.lifecycle = 'exiting';
    this.cancelFocus();
    if (this.coordinatorActive) {
      this.coordinator.updateCloseRequest(this.overlayId, null);
    }
    this.closing.set(true);
    if (!this.platform.isBrowser || this.prefersReducedMotion() || !this.platform.window) {
      this.finishExit();
      return;
    }
    this.exitTimer = this.platform.schedule(() => this.finishExit(), overlayExitDuration);
    if (this.exitTimer === null) this.finishExit();
  }

  private finishExit(): void {
    if (this.lifecycle !== 'exiting') return;
    this.cancelExit();
    if (this.surfaceHost.open()) return;
    this.lifecycle = 'closed';
    this.closing.set(false);
    if (this.coordinatorActive) {
      this.coordinator.deactivate(this.overlayId, 0, this.surfaceHost.restoreFocus() !== false);
      this.coordinatorActive = false;
    }
    const retainClosedSurface =
      this.surfacePosition() === 'center' && this.surfaceRole() === 'dialog';
    if (!retainClosedSurface) {
      this.rendered.set(false);
    }
    this.surfaceHost.afterExited.emit();
  }

  private cancelExit(): void {
    if (this.exitTimer === null) return;
    this.platform.cancelScheduled(this.exitTimer);
    this.exitTimer = null;
  }

  private cancelFocus(): void {
    if (this.focusTimer === null) return;
    this.platform.cancelScheduled(this.focusTimer);
    this.focusTimer = null;
  }
}

@Component({
  selector: 'krn-dialog',
  standalone: true,
  imports: [A11yModule, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dialog.html',
  styleUrl: './dialog.css',
})
export class KrnDialog {
  private readonly translations = inject(KRN_TRANSLATIONS);
  readonly open = model(false);
  readonly title = input('');
  readonly description = input('');
  readonly eyebrow = input('');
  readonly ariaLabel = input<string | undefined>();
  protected readonly resolvedAriaLabel = krnInputFallback(
    this.ariaLabel,
    () => this.translations.feedback.dialog,
  );
  readonly showClose = input(true, { transform: booleanAttribute });
  readonly closeLabel = input<string | undefined>();
  protected readonly resolvedCloseLabel = krnInputFallback(
    this.closeLabel,
    () => this.translations.feedback.close,
  );
  readonly closeOnEscape = input(true, { transform: booleanAttribute });
  readonly closeOnOutside = input<boolean | null, unknown>(null, {
    transform: nullableBooleanAttribute,
  });
  readonly initialFocus = input<KrnOverlayInitialFocus>('first-tabbable');
  /** Explicit focus return target, or `false` to disable focus restoration. */
  readonly restoreFocus = input<HTMLElement | false | null>(null);
  readonly contentTemplate = input<TemplateRef<unknown> | null>(null);
  readonly actionsTemplate = input<TemplateRef<unknown> | null>(null);
  readonly closed = output<KrnOverlayCloseReason>();
  /** Emits after exit motion and global modal cleanup have completed. */
  readonly afterExited = output<void>();
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  protected readonly surface = new KrnOverlaySurfaceController(
    this,
    () => this.panel()?.nativeElement,
    DIALOG_SURFACE,
  );
}

@Component({
  selector: 'krn-alert-dialog',
  standalone: true,
  imports: [A11yModule, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './alert-dialog.html',
  styleUrl: './alert-dialog.css',
})
export class KrnAlertDialog {
  private readonly translations = inject(KRN_TRANSLATIONS);
  readonly open = model(false);
  readonly title = input('');
  readonly description = input('');
  readonly eyebrow = input('');
  readonly ariaLabel = input<string | undefined>();
  protected readonly resolvedAriaLabel = krnInputFallback(
    this.ariaLabel,
    () => this.translations.feedback.dialog,
  );
  readonly showClose = input(true, { transform: booleanAttribute });
  readonly closeLabel = input<string | undefined>();
  protected readonly resolvedCloseLabel = krnInputFallback(
    this.closeLabel,
    () => this.translations.feedback.close,
  );
  readonly closeOnEscape = input(true, { transform: booleanAttribute });
  readonly closeOnOutside = input<boolean | null, unknown>(null, {
    transform: nullableBooleanAttribute,
  });
  readonly initialFocus = input<KrnOverlayInitialFocus>('first-tabbable');
  /** Explicit focus return target, or `false` to disable focus restoration. */
  readonly restoreFocus = input<HTMLElement | false | null>(null);
  readonly contentTemplate = input<TemplateRef<unknown> | null>(null);
  readonly actionsTemplate = input<TemplateRef<unknown> | null>(null);
  readonly closed = output<KrnOverlayCloseReason>();
  /** Emits after exit motion and global modal cleanup have completed. */
  readonly afterExited = output<void>();
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  protected readonly surface = new KrnOverlaySurfaceController(
    this,
    () => this.panel()?.nativeElement,
    ALERT_DIALOG_SURFACE,
  );
}

@Component({
  selector: 'krn-drawer',
  standalone: true,
  imports: [A11yModule, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './drawer.html',
  styleUrl: './drawer.css',
})
export class KrnDrawer {
  private readonly translations = inject(KRN_TRANSLATIONS);
  readonly open = model(false);
  readonly title = input('');
  readonly description = input('');
  readonly eyebrow = input('');
  readonly ariaLabel = input<string | undefined>();
  protected readonly resolvedAriaLabel = krnInputFallback(
    this.ariaLabel,
    () => this.translations.feedback.dialog,
  );
  readonly showClose = input(true, { transform: booleanAttribute });
  readonly closeLabel = input<string | undefined>();
  protected readonly resolvedCloseLabel = krnInputFallback(
    this.closeLabel,
    () => this.translations.feedback.close,
  );
  readonly closeOnEscape = input(true, { transform: booleanAttribute });
  readonly closeOnOutside = input<boolean | null, unknown>(null, {
    transform: nullableBooleanAttribute,
  });
  readonly initialFocus = input<KrnOverlayInitialFocus>('first-tabbable');
  /** Explicit focus return target, or `false` to disable focus restoration. */
  readonly restoreFocus = input<HTMLElement | false | null>(null);
  readonly contentTemplate = input<TemplateRef<unknown> | null>(null);
  readonly actionsTemplate = input<TemplateRef<unknown> | null>(null);
  readonly closed = output<KrnOverlayCloseReason>();
  /** Emits after exit motion and global modal cleanup have completed. */
  readonly afterExited = output<void>();
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  protected readonly surface = new KrnOverlaySurfaceController(
    this,
    () => this.panel()?.nativeElement,
    DRAWER_SURFACE,
  );
}

@Component({
  selector: 'krn-bottom-sheet',
  standalone: true,
  imports: [A11yModule, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './bottom-sheet.html',
  styleUrl: './bottom-sheet.css',
})
export class KrnBottomSheet {
  private readonly translations = inject(KRN_TRANSLATIONS);
  readonly open = model(false);
  readonly title = input('');
  readonly description = input('');
  readonly eyebrow = input('');
  readonly ariaLabel = input<string | undefined>();
  protected readonly resolvedAriaLabel = krnInputFallback(
    this.ariaLabel,
    () => this.translations.feedback.dialog,
  );
  readonly showClose = input(true, { transform: booleanAttribute });
  readonly closeLabel = input<string | undefined>();
  protected readonly resolvedCloseLabel = krnInputFallback(
    this.closeLabel,
    () => this.translations.feedback.close,
  );
  readonly closeOnEscape = input(true, { transform: booleanAttribute });
  readonly closeOnOutside = input<boolean | null, unknown>(null, {
    transform: nullableBooleanAttribute,
  });
  readonly initialFocus = input<KrnOverlayInitialFocus>('first-tabbable');
  /** Explicit focus return target, or `false` to disable focus restoration. */
  readonly restoreFocus = input<HTMLElement | false | null>(null);
  readonly contentTemplate = input<TemplateRef<unknown> | null>(null);
  readonly actionsTemplate = input<TemplateRef<unknown> | null>(null);
  readonly closed = output<KrnOverlayCloseReason>();
  /** Emits after exit motion and global modal cleanup have completed. */
  readonly afterExited = output<void>();
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  protected readonly surface = new KrnOverlaySurfaceController(
    this,
    () => this.panel()?.nativeElement,
    BOTTOM_SHEET_SURFACE,
  );
}
