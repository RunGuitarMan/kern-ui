import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
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
import { A11yModule } from '@angular/cdk/a11y';
import { NgTemplateOutlet } from '@angular/common';
import {
  KRN_PLATFORM,
  KrnIdService,
  KrnOverlayCoordinator,
  krnIsHtmlElement,
  krnPrefersReducedMotion,
  type KrnOverlayInitialFocus,
  type KrnScheduledHandle,
} from '@kern-ui/angular/cdk';
import { KRN_TRANSLATIONS } from '@kern-ui/angular/core';
import type { KrnOverlayCloseReason, KrnOverlayPosition } from './feedback.types';

function nullableBooleanAttribute(value: unknown): boolean | null {
  return value === null || value === undefined ? null : booleanAttribute(value);
}

const overlayExitDuration = 260;

const OVERLAY_TEMPLATE = `
  @if (rendered()) {
    <div
      class="backdrop"
      [attr.data-position]="surfacePosition()"
      [attr.data-state]="closing() ? 'closing' : open() ? 'open' : 'closed'"
      [attr.hidden]="!open() && !closing() ? '' : null"
      [attr.aria-hidden]="!open() ? 'true' : null"
      [attr.inert]="!open() ? '' : null"
      (pointerdown)="onBackdropPointerdown($event)"
      (transitionend)="onBackdropTransitionEnd($event)"
    >
      <section
        #panel
        class="surface"
        [attr.role]="surfaceRole()"
        [attr.aria-modal]="open() ? 'true' : null"
        [attr.aria-labelledby]="title() ? titleId : null"
        [attr.aria-describedby]="description() ? descriptionId : null"
        [attr.aria-label]="title() ? null : ariaLabel()"
        tabindex="-1"
        [cdkTrapFocus]="open() && !closing()"
        [cdkTrapFocusAutoCapture]="false"
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
                <p class="description" [id]="descriptionId">{{ description() }}</p>
              }
            </div>
            @if (showClose()) {
              <button type="button" class="close" [attr.aria-label]="closeLabel()" (click)="close('action')">
                <span aria-hidden="true">×</span>
              </button>
            }
          </header>
        }
        <div class="body">
          @if (contentTemplate(); as content) {
            <ng-container [ngTemplateOutlet]="content" />
          } @else {
            <ng-content />
          }
        </div>
        <footer>
          @if (actionsTemplate(); as actions) {
            <ng-container [ngTemplateOutlet]="actions" />
          } @else {
            <ng-content select="[krnDialogAction]" />
          }
        </footer>
      </section>
    </div>
  }
`;

const OVERLAY_STYLES = `
  :host{--krn-drawer-enter-distance:100%;display:contents}:host-context([dir=rtl]){--krn-drawer-enter-distance:-100%}.backdrop{position:fixed;z-index:var(--krn-z-modal);inset:0;display:grid;align-items:center;justify-items:center;padding:var(--krn-space-4);background:var(--krn-color-backdrop)}.backdrop[hidden]{display:none}.backdrop[data-state=closing]{pointer-events:none}.surface{display:grid;grid-template-rows:auto minmax(0,1fr) auto;inline-size:min(36rem,100%);max-block-size:min(44rem,calc(100dvh - var(--krn-space-8)));overflow:hidden;border:var(--krn-border-width-1) solid var(--krn-color-border);border-radius:var(--krn-radius-lg);box-shadow:var(--krn-shadow-overlay);background:var(--krn-color-surface-raised);color:var(--krn-color-text);outline:none}.surface:focus-visible{box-shadow:var(--krn-focus-ring-shadow),var(--krn-shadow-overlay)}header{display:flex;align-items:flex-start;justify-content:space-between;gap:var(--krn-space-4);padding:var(--krn-space-5);border-block-end:var(--krn-border-width-1) solid var(--krn-color-border)}header>div{display:grid;gap:var(--krn-space-1);min-inline-size:0}h2,.eyebrow,.description{margin:0}h2{font-size:var(--krn-font-size-xl);line-height:var(--krn-line-height-tight)}.eyebrow{color:var(--krn-color-primary);font-size:var(--krn-font-size-xs);font-weight:var(--krn-font-weight-semibold);letter-spacing:var(--krn-letter-spacing-wide);text-transform:uppercase}.description{color:var(--krn-color-text-muted);line-height:var(--krn-line-height-body)}.close{display:grid;flex:0 0 var(--krn-control-height-sm);block-size:var(--krn-control-height-sm);padding:0;border:0;border-radius:var(--krn-radius-sm);place-items:center;background:transparent;color:var(--krn-color-text-muted);font:inherit;font-size:var(--krn-font-size-xl);cursor:pointer}.close:hover{background:var(--krn-color-surface-subtle);color:var(--krn-color-text)}.close:focus-visible{outline:var(--krn-focus-ring-width) solid var(--krn-color-focus);outline-offset:var(--krn-focus-ring-offset)}.body{min-block-size:0;overflow:auto;padding:var(--krn-space-5);line-height:var(--krn-line-height-body)}footer{display:flex;justify-content:flex-end;flex-wrap:wrap;gap:var(--krn-space-2);padding:var(--krn-space-4) var(--krn-space-5);border-block-start:var(--krn-border-width-1) solid var(--krn-color-border)}footer:empty{display:none}.backdrop[data-position=inline-end]{align-items:stretch;justify-items:end;padding:0}.backdrop[data-position=inline-end] .surface{inline-size:min(30rem,100%);max-block-size:none;border-block:0;border-inline-end:0;border-radius:var(--krn-radius-lg) 0 0 var(--krn-radius-lg)}.backdrop[data-position=bottom]{align-items:end;padding:0}.backdrop[data-position=bottom] .surface{inline-size:min(48rem,100%);max-block-size:min(80dvh,42rem);padding-block-end:env(safe-area-inset-bottom);border-block-end:0;border-radius:var(--krn-radius-lg) var(--krn-radius-lg) 0 0}@media(prefers-reduced-motion:no-preference){.backdrop[data-state=open]{animation:krn-backdrop-enter var(--krn-motion-duration-enter) var(--krn-motion-ease-standard) both}.backdrop[data-state=closing]{animation:krn-backdrop-exit var(--krn-motion-duration-exit) var(--krn-motion-ease-exit) both}.backdrop[data-state=open] .surface{animation:krn-dialog-enter var(--krn-motion-duration-enter) var(--krn-motion-ease-enter) both}.backdrop[data-state=closing] .surface{animation:krn-dialog-exit var(--krn-motion-duration-exit) var(--krn-motion-ease-exit) both}.backdrop[data-position=inline-end][data-state=open] .surface{animation-name:krn-drawer-enter}.backdrop[data-position=inline-end][data-state=closing] .surface{animation-name:krn-drawer-exit}.backdrop[data-position=bottom][data-state=open] .surface{animation-name:krn-sheet-enter}.backdrop[data-position=bottom][data-state=closing] .surface{animation-name:krn-sheet-exit}}@keyframes krn-backdrop-enter{from{opacity:0}to{opacity:1}}@keyframes krn-backdrop-exit{from{opacity:1}to{opacity:0}}@keyframes krn-dialog-enter{from{opacity:0;transform:translateY(var(--krn-space-2))}to{opacity:1;transform:none}}@keyframes krn-dialog-exit{from{opacity:1;transform:none}to{opacity:0;transform:translateY(var(--krn-space-2))}}@keyframes krn-drawer-enter{from{transform:translateX(var(--krn-drawer-enter-distance))}to{transform:none}}@keyframes krn-drawer-exit{from{transform:none}to{transform:translateX(var(--krn-drawer-enter-distance))}}@keyframes krn-sheet-enter{from{transform:translateY(100%)}to{transform:none}}@keyframes krn-sheet-exit{from{transform:none}to{transform:translateY(100%)}}@media(max-width:35rem){.backdrop{padding:var(--krn-space-2)}.surface{max-block-size:calc(100dvh - var(--krn-space-4))}header,.body,footer{padding:var(--krn-space-4)}}
  @media(prefers-reduced-motion:no-preference){.backdrop:not([data-position=inline-end]){animation:none}}
  :host{--krn-drawer-motion-offset:var(--krn-space-1-5)}
  :host-context([dir=rtl]){--krn-drawer-motion-offset:calc(var(--krn-space-1-5) * -1)}
  @media(prefers-reduced-motion:no-preference){
    .backdrop[data-position=inline-end]{
      animation:none;
      opacity:1;
      transition:opacity var(--krn-motion-duration-enter) var(--krn-motion-ease-standard)
    }
    .backdrop[data-position=inline-end] .surface{
      animation:none;
      opacity:1;
      translate:0 0;
      transition:
        opacity var(--krn-motion-duration-enter) var(--krn-motion-ease-standard),
        translate var(--krn-motion-duration-enter) var(--krn-motion-ease-enter)
    }
    .backdrop[data-position=inline-end][data-state=closing]{opacity:0}
    .backdrop[data-position=inline-end][data-state=closing] .surface{
      opacity:.96;
      translate:var(--krn-drawer-motion-offset) 0;
      transition-duration:var(--krn-motion-duration-exit);
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
  :host-context(html[data-krn-motion='full']) .backdrop[data-state=open]{
    animation:krn-backdrop-enter var(--krn-motion-duration-enter) var(--krn-motion-ease-standard) both
  }
  :host-context(html[data-krn-motion='full']) .backdrop[data-state=closing]{
    animation:krn-backdrop-exit var(--krn-motion-duration-exit) var(--krn-motion-ease-exit) both
  }
  :host-context(html[data-krn-motion='full']) .backdrop[data-state=open] .surface{
    animation:krn-dialog-enter var(--krn-motion-duration-enter) var(--krn-motion-ease-enter) both
  }
  :host-context(html[data-krn-motion='full']) .backdrop[data-state=closing] .surface{
    animation:krn-dialog-exit var(--krn-motion-duration-exit) var(--krn-motion-ease-exit) both
  }
  :host-context(html[data-krn-motion='full']) .backdrop:not([data-position=inline-end]){
    animation:none
  }
  :host-context(html[data-krn-motion='full']) .backdrop[data-position=bottom][data-state=open] .surface{
    animation-name:krn-sheet-enter
  }
  :host-context(html[data-krn-motion='full']) .backdrop[data-position=bottom][data-state=closing] .surface{
    animation-name:krn-sheet-exit
  }
  :host-context(html[data-krn-motion='full']) .backdrop[data-position=inline-end]{
    animation:none;
    opacity:1;
    transition:opacity var(--krn-motion-duration-enter) var(--krn-motion-ease-standard)
  }
  :host-context(html[data-krn-motion='full']) .backdrop[data-position=inline-end] .surface{
    animation:none;
    opacity:1;
    translate:0 0;
    transition:
      opacity var(--krn-motion-duration-enter) var(--krn-motion-ease-standard),
      translate var(--krn-motion-duration-enter) var(--krn-motion-ease-enter)
  }
  :host-context(html[data-krn-motion='full']) .backdrop[data-position=inline-end][data-state=closing]{
    opacity:0
  }
  :host-context(html[data-krn-motion='full']) .backdrop[data-position=inline-end][data-state=closing] .surface{
    opacity:.96;
    translate:var(--krn-drawer-motion-offset) 0;
    transition-duration:var(--krn-motion-duration-exit);
    transition-timing-function:var(--krn-motion-ease-standard)
  }
  @starting-style{
    :host-context(html[data-krn-motion='full']) .backdrop[data-position=inline-end][data-state=open]{
      opacity:0
    }
    :host-context(html[data-krn-motion='full']) .backdrop[data-position=inline-end][data-state=open] .surface{
      opacity:.96;
      translate:var(--krn-drawer-motion-offset) 0
    }
  }
`;

@Directive()
export abstract class KrnOverlaySurface {
  private readonly ids = inject(KrnIdService);
  private readonly platform = inject(KRN_PLATFORM);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly coordinator = inject(KrnOverlayCoordinator);
  private readonly destroyRef = inject(DestroyRef);
  private readonly translations = inject(KRN_TRANSLATIONS);
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  private exitTimer: KrnScheduledHandle | null = null;
  readonly open = model(false);
  readonly title = input('');
  readonly description = input('');
  readonly eyebrow = input('');
  readonly ariaLabel = input(this.translations.feedback.dialog);
  readonly showClose = input(true, { transform: booleanAttribute });
  readonly closeLabel = input(this.translations.feedback.close);
  readonly closeOnEscape = input(true, { transform: booleanAttribute });
  readonly closeOnOutside = input<boolean | null, unknown>(null, {
    transform: nullableBooleanAttribute,
  });
  readonly initialFocus = input<KrnOverlayInitialFocus>('first-tabbable');
  readonly contentTemplate = input<TemplateRef<unknown> | null>(null);
  readonly actionsTemplate = input<TemplateRef<unknown> | null>(null);
  readonly closed = output<KrnOverlayCloseReason>();
  protected readonly rendered = signal(false);
  protected readonly closing = signal(false);
  private readonly overlayId = this.ids.next('overlay');
  protected readonly titleId = `${this.overlayId}-title`;
  protected readonly descriptionId = `${this.overlayId}-description`;

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
        !this.platform.isBrowser ||
        !this.supportsExitAnimation() ||
        this.prefersReducedMotion()
      ) {
        this.finishExit();
        return;
      }
      const view = this.platform.window;
      if (!view) {
        this.finishExit();
        return;
      }
      this.exitTimer = this.platform.schedule(() => this.finishExit(), overlayExitDuration);
    });

    effect((onCleanup) => {
      if (!this.open() || !this.platform.isBrowser) return;
      const document = this.platform.document;
      const previousFocus = krnIsHtmlElement(this.platform, document.activeElement)
        ? document.activeElement
        : null;
      this.coordinator.activate(this.overlayId, this.host.nativeElement, previousFocus);
      const focus = (): void => {
        const panel = this.panel()?.nativeElement;
        if (panel && this.coordinator.isTop(this.overlayId)) {
          this.coordinator.focusInitial(panel, this.initialFocus());
        }
      };
      const focusTimer = this.platform.schedule(focus);
      if (focusTimer === null) focus();
      const onKeydown = (event: KeyboardEvent): void => {
        if (
          event.key !== 'Escape' ||
          event.defaultPrevented ||
          !this.open() ||
          !this.closeOnEscape() ||
          !this.coordinator.isTop(this.overlayId)
        ) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        this.close('escape');
      };
      document.addEventListener('keydown', onKeydown);
      onCleanup(() => {
        this.platform.cancelScheduled(focusTimer);
        document.removeEventListener('keydown', onKeydown);
        this.coordinator.deactivate(
          this.overlayId,
          this.supportsExitAnimation() && !this.prefersReducedMotion()
            ? overlayExitDuration + 20
            : 0,
        );
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

  private prefersReducedMotion(): boolean {
    return krnPrefersReducedMotion(this.platform);
  }

  private finishExit(): void {
    this.cancelExit();
    if (this.open()) return;
    this.closing.set(false);
    const retainClosedSurface =
      this.surfacePosition() === 'center' && this.surfaceRole() === 'dialog';
    if (!retainClosedSurface) {
      this.rendered.set(false);
    }
  }

  private cancelExit(): void {
    if (this.exitTimer === null) return;
    this.platform.cancelScheduled(this.exitTimer);
    this.exitTimer = null;
  }
}

@Component({
  selector: 'krn-dialog',
  standalone: true,
  imports: [A11yModule, NgTemplateOutlet],
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
  imports: [A11yModule, NgTemplateOutlet],
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
  imports: [A11yModule, NgTemplateOutlet],
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
  imports: [A11yModule, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: OVERLAY_TEMPLATE,
  styles: OVERLAY_STYLES,
})
export class KrnBottomSheet extends KrnOverlaySurface {
  protected override surfacePosition(): KrnOverlayPosition {
    return 'bottom';
  }
}
