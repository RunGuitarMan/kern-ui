import type { ElementRef } from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  HostListener,
  Injectable,
  PLATFORM_ID,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { A11yModule } from '@angular/cdk/a11y';
import type { KrnOverlayCloseReason, KrnOverlayPosition } from './feedback.types';

let nextOverlayId = 0;

@Injectable({ providedIn: 'root' })
export class KrnOverlayCoordinator {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private locks = 0;
  private previousOverflow = '';
  private readonly stack: string[] = [];

  activate(id: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const existing = this.stack.indexOf(id);
    if (existing >= 0) this.stack.splice(existing, 1);
    this.stack.push(id);
    if (this.locks === 0) {
      this.previousOverflow = this.document.body.style.overflow;
      this.document.body.style.overflow = 'hidden';
    }
    this.locks += 1;
  }

  deactivate(id: string): void {
    if (!isPlatformBrowser(this.platformId) || this.locks === 0) return;
    const index = this.stack.lastIndexOf(id);
    if (index >= 0) this.stack.splice(index, 1);
    this.locks -= 1;
    if (this.locks === 0) this.document.body.style.overflow = this.previousOverflow;
  }

  isTop(id: string): boolean {
    return this.stack.at(-1) === id;
  }
}

const OVERLAY_TEMPLATE = `
  @if (rendered()) {
    <div
      class="backdrop"
      [attr.data-position]="surfacePosition()"
      [attr.data-state]="closing() ? 'closing' : 'open'"
      [attr.aria-hidden]="closing() ? 'true' : null"
      [attr.inert]="closing() ? '' : null"
      (pointerdown)="onBackdropPointerdown($event)"
      (transitionend)="onBackdropTransitionEnd($event)"
    >
      <section
        #panel
        class="surface"
        [attr.role]="surfaceRole()"
        aria-modal="true"
        [attr.aria-labelledby]="title() ? titleId : null"
        [attr.aria-label]="title() ? null : ariaLabel()"
        tabindex="-1"
        [cdkTrapFocus]="!closing()"
        [cdkTrapFocusAutoCapture]="!closing()"
        (pointerdown)="$event.stopPropagation()"
      >
        @if (eyebrow() || title() || description() || showClose()) {
          <header>
            <div>
              @if (eyebrow()) {
                <p class="eyebrow">{{ eyebrow() }}</p>
              }
              @if (title()) {
                <h2 [id]="titleId">{{ title() }}</h2>
              }
              @if (description()) {
                <p class="description">{{ description() }}</p>
              }
            </div>
            @if (showClose()) {
              <button type="button" class="close" [attr.aria-label]="closeLabel()" (click)="close('action')">
                <span aria-hidden="true">×</span>
              </button>
            }
          </header>
        }
        <div class="body"><ng-content /></div>
        <footer><ng-content select="[krnDialogAction]" /></footer>
      </section>
    </div>
  }
`;

const OVERLAY_STYLES = `
  :host{--krn-drawer-enter-distance:100%;display:contents}:host-context([dir=rtl]){--krn-drawer-enter-distance:-100%}.backdrop{position:fixed;z-index:var(--krn-z-modal);inset:0;display:grid;align-items:center;justify-items:center;padding:var(--krn-space-4);background:var(--krn-color-backdrop)}.backdrop[data-state=closing]{pointer-events:none}.surface{display:grid;grid-template-rows:auto minmax(0,1fr) auto;inline-size:min(36rem,100%);max-block-size:min(44rem,calc(100dvh - var(--krn-space-8)));overflow:hidden;border:var(--krn-border-width-1) solid var(--krn-color-border);border-radius:var(--krn-radius-lg);box-shadow:var(--krn-shadow-overlay);background:var(--krn-color-surface-raised);color:var(--krn-color-text);outline:none}.surface:focus-visible{box-shadow:var(--krn-focus-ring-shadow),var(--krn-shadow-overlay)}header{display:flex;align-items:flex-start;justify-content:space-between;gap:var(--krn-space-4);padding:var(--krn-space-5);border-block-end:var(--krn-border-width-1) solid var(--krn-color-border)}header>div{display:grid;gap:var(--krn-space-1);min-inline-size:0}h2,.eyebrow,.description{margin:0}h2{font-size:var(--krn-font-size-xl);line-height:var(--krn-line-height-tight)}.eyebrow{color:var(--krn-color-primary);font-size:var(--krn-font-size-xs);font-weight:var(--krn-font-weight-semibold);letter-spacing:var(--krn-letter-spacing-wide);text-transform:uppercase}.description{color:var(--krn-color-text-muted);line-height:var(--krn-line-height-body)}.close{display:grid;flex:0 0 var(--krn-control-height-sm);block-size:var(--krn-control-height-sm);padding:0;border:0;border-radius:var(--krn-radius-sm);place-items:center;background:transparent;color:var(--krn-color-text-muted);font:inherit;font-size:var(--krn-font-size-xl);cursor:pointer}.close:hover{background:var(--krn-color-surface-subtle);color:var(--krn-color-text)}.close:focus-visible{outline:var(--krn-focus-ring-width) solid var(--krn-color-focus);outline-offset:var(--krn-focus-ring-offset)}.body{min-block-size:0;overflow:auto;padding:var(--krn-space-5);line-height:var(--krn-line-height-body)}footer{display:flex;justify-content:flex-end;flex-wrap:wrap;gap:var(--krn-space-2);padding:var(--krn-space-4) var(--krn-space-5);border-block-start:var(--krn-border-width-1) solid var(--krn-color-border)}footer:empty{display:none}.backdrop[data-position=inline-end]{align-items:stretch;justify-items:end;padding:0}.backdrop[data-position=inline-end] .surface{inline-size:min(30rem,100%);max-block-size:none;border-block:0;border-inline-end:0;border-radius:var(--krn-radius-lg) 0 0 var(--krn-radius-lg)}.backdrop[data-position=bottom]{align-items:end;padding:0}.backdrop[data-position=bottom] .surface{inline-size:min(48rem,100%);max-block-size:min(80dvh,42rem);padding-block-end:env(safe-area-inset-bottom);border-block-end:0;border-radius:var(--krn-radius-lg) var(--krn-radius-lg) 0 0}@media(prefers-reduced-motion:no-preference){.backdrop[data-state=open]{animation:krn-backdrop-enter var(--krn-motion-duration-normal) var(--krn-motion-ease-standard) both}.backdrop[data-state=closing]{animation:krn-backdrop-exit var(--krn-motion-duration-normal) var(--krn-motion-ease-exit) both}.backdrop[data-state=open] .surface{animation:krn-dialog-enter var(--krn-motion-duration-slow) var(--krn-motion-ease-enter) both}.backdrop[data-state=closing] .surface{animation:krn-dialog-exit var(--krn-motion-duration-normal) var(--krn-motion-ease-exit) both}.backdrop[data-position=inline-end][data-state=open] .surface{animation-name:krn-drawer-enter}.backdrop[data-position=inline-end][data-state=closing] .surface{animation-name:krn-drawer-exit}.backdrop[data-position=bottom][data-state=open] .surface{animation-name:krn-sheet-enter}.backdrop[data-position=bottom][data-state=closing] .surface{animation-name:krn-sheet-exit}}@keyframes krn-backdrop-enter{from{opacity:0}to{opacity:1}}@keyframes krn-backdrop-exit{from{opacity:1}to{opacity:0}}@keyframes krn-dialog-enter{from{opacity:0;transform:translateY(var(--krn-space-2))}to{opacity:1;transform:none}}@keyframes krn-dialog-exit{from{opacity:1;transform:none}to{opacity:0;transform:translateY(var(--krn-space-2))}}@keyframes krn-drawer-enter{from{transform:translateX(var(--krn-drawer-enter-distance))}to{transform:none}}@keyframes krn-drawer-exit{from{transform:none}to{transform:translateX(var(--krn-drawer-enter-distance))}}@keyframes krn-sheet-enter{from{transform:translateY(100%)}to{transform:none}}@keyframes krn-sheet-exit{from{transform:none}to{transform:translateY(100%)}}@media(max-width:35rem){.backdrop{padding:var(--krn-space-2)}.surface{max-block-size:calc(100dvh - var(--krn-space-4))}header,.body,footer{padding:var(--krn-space-4)}}
  @media(prefers-reduced-motion:no-preference){.backdrop:not([data-position=inline-end]){animation:none}}
  :host{--krn-drawer-motion-offset:var(--krn-space-1-5)}
  :host-context([dir=rtl]){--krn-drawer-motion-offset:calc(var(--krn-space-1-5) * -1)}
  @media(prefers-reduced-motion:no-preference){
    .backdrop[data-position=inline-end]{
      animation:none;
      opacity:1;
      transition:opacity var(--krn-motion-duration-normal) var(--krn-motion-ease-standard)
    }
    .backdrop[data-position=inline-end] .surface{
      animation:none;
      opacity:1;
      translate:0 0;
      transition:
        opacity var(--krn-motion-duration-normal) var(--krn-motion-ease-standard),
        translate var(--krn-motion-duration-slow) var(--krn-motion-ease-enter)
    }
    .backdrop[data-position=inline-end][data-state=closing]{opacity:0}
    .backdrop[data-position=inline-end][data-state=closing] .surface{
      opacity:.96;
      translate:var(--krn-drawer-motion-offset) 0;
      transition-duration:var(--krn-motion-duration-normal);
      transition-timing-function:var(--krn-motion-ease-standard)
    }
    @starting-style{
      .backdrop[data-position=inline-end][data-state=open]{opacity:0}
      .backdrop[data-position=inline-end][data-state=open] .surface{
        opacity:.96;
        translate:var(--krn-drawer-motion-offset) 0
      }
    }
  }
`;

@Directive()
export abstract class KrnOverlaySurface {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly coordinator = inject(KrnOverlayCoordinator);
  private readonly destroyRef = inject(DestroyRef);
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  private exitTimer: ReturnType<typeof setTimeout> | null = null;
  readonly open = model(false);
  readonly title = input('');
  readonly description = input('');
  readonly eyebrow = input('');
  readonly ariaLabel = input('Dialog');
  readonly showClose = input(true);
  readonly closeLabel = input('Close');
  readonly closeOnEscape = input(true);
  readonly closeOnOutside = input<boolean | null>(null);
  readonly closed = output<KrnOverlayCloseReason>();
  protected readonly rendered = signal(false);
  protected readonly closing = signal(false);
  private readonly overlayId = `krn-overlay-${++nextOverlayId}`;
  protected readonly titleId = `${this.overlayId}-title`;

  constructor() {
    effect(() => {
      const open = this.open();
      if (open) {
        this.cancelExit();
        this.rendered.set(true);
        this.closing.set(false);
        return;
      }
      if (!this.rendered()) return;
      this.closing.set(true);
      if (
        !isPlatformBrowser(this.platformId) ||
        !this.supportsExitAnimation() ||
        this.prefersReducedMotion()
      ) {
        this.finishExit();
        return;
      }
      this.exitTimer = setTimeout(() => this.finishExit(), 260);
    });

    effect((onCleanup) => {
      if (!this.open() || !isPlatformBrowser(this.platformId)) return;
      const previousFocus =
        this.document.activeElement instanceof HTMLElement ? this.document.activeElement : null;
      this.coordinator.activate(this.overlayId);
      const focusTimer = setTimeout(() => {
        const panel = this.panel()?.nativeElement;
        if (panel && !panel.contains(this.document.activeElement)) panel.focus();
      });
      onCleanup(() => {
        clearTimeout(focusTimer);
        this.coordinator.deactivate(this.overlayId);
        if (previousFocus?.isConnected) previousFocus.focus();
      });
    });

    this.destroyRef.onDestroy(() => this.cancelExit());
  }

  protected abstract surfacePosition(): KrnOverlayPosition;

  protected surfaceRole(): 'dialog' | 'alertdialog' {
    return 'dialog';
  }

  protected defaultOutsideClose(): boolean {
    return true;
  }

  protected supportsExitAnimation(): boolean {
    return false;
  }

  protected close(reason: KrnOverlayCloseReason): void {
    if (!this.open()) return;
    this.open.set(false);
    this.closed.emit(reason);
  }

  protected onBackdropTransitionEnd(event: TransitionEvent): void {
    if (
      this.closing() &&
      event.target === event.currentTarget &&
      event.propertyName === 'opacity'
    ) {
      this.finishExit();
    }
  }

  protected onBackdropPointerdown(event: PointerEvent): void {
    if (
      event.target === event.currentTarget &&
      (this.closeOnOutside() ?? this.defaultOutsideClose())
    ) {
      this.close('outside');
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  protected onEscape(event: Event): void {
    if (!this.open() || !this.closeOnEscape() || !this.coordinator.isTop(this.overlayId)) return;
    event.preventDefault();
    event.stopPropagation();
    this.close('escape');
  }

  private prefersReducedMotion(): boolean {
    return (
      this.document.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    );
  }

  private finishExit(): void {
    this.cancelExit();
    if (this.open()) return;
    this.closing.set(false);
    this.rendered.set(false);
  }

  private cancelExit(): void {
    if (this.exitTimer === null) return;
    clearTimeout(this.exitTimer);
    this.exitTimer = null;
  }
}

@Component({
  selector: 'krn-dialog',
  standalone: true,
  imports: [A11yModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: OVERLAY_TEMPLATE,
  styles: OVERLAY_STYLES,
})
export class KrnDialog extends KrnOverlaySurface {
  protected override surfacePosition(): KrnOverlayPosition {
    return 'center';
  }
}

@Component({
  selector: 'krn-alert-dialog',
  standalone: true,
  imports: [A11yModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: OVERLAY_TEMPLATE,
  styles: OVERLAY_STYLES,
})
export class KrnAlertDialog extends KrnOverlaySurface {
  protected override surfacePosition(): KrnOverlayPosition {
    return 'center';
  }

  protected override surfaceRole(): 'alertdialog' {
    return 'alertdialog';
  }

  protected override defaultOutsideClose(): boolean {
    return false;
  }
}

@Component({
  selector: 'krn-drawer',
  standalone: true,
  imports: [A11yModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: OVERLAY_TEMPLATE,
  styles: OVERLAY_STYLES,
})
export class KrnDrawer extends KrnOverlaySurface {
  protected override surfacePosition(): KrnOverlayPosition {
    return 'inline-end';
  }

  protected override supportsExitAnimation(): boolean {
    return true;
  }
}

@Component({
  selector: 'krn-bottom-sheet',
  standalone: true,
  imports: [A11yModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: OVERLAY_TEMPLATE,
  styles: OVERLAY_STYLES,
})
export class KrnBottomSheet extends KrnOverlaySurface {
  protected override surfacePosition(): KrnOverlayPosition {
    return 'bottom';
  }
}
