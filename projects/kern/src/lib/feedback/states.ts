import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import type { KrnFeedbackTone } from './feedback.types';

const STATE_TEMPLATE = `
  <section class="state" [attr.data-tone]="tone()" [attr.role]="tone() === 'danger' ? 'alert' : 'status'">
    <div class="visual" aria-hidden="true"><ng-content select="[krnStateVisual]" /></div>
    <h2>{{ title() }}</h2>
    @if (description()) {
      <p>{{ description() }}</p>
    }
    <div class="body"><ng-content /></div>
    <div class="actions"><ng-content select="[krnStateAction]" /></div>
  </section>
`;

const STATE_STYLES = `
  :host{display:block}.state{--tone:var(--krn-color-text-muted);display:grid;justify-items:center;gap:var(--krn-space-3);max-inline-size:34rem;margin-inline:auto;padding:clamp(var(--krn-space-6),7vw,var(--krn-space-12));color:var(--krn-color-text);text-align:center}.state[data-tone=success]{--tone:var(--krn-color-success)}.state[data-tone=danger]{--tone:var(--krn-color-danger)}.visual{display:grid;inline-size:var(--krn-space-12);block-size:var(--krn-space-12);border:var(--krn-border-width-1) solid var(--tone);border-radius:var(--krn-radius-full);place-items:center;color:var(--tone);font-size:var(--krn-font-size-2xl)}.visual:empty::before{content:"—"}h2{margin:0;font-size:var(--krn-font-size-xl);line-height:var(--krn-line-height-tight)}p,.body{margin:0;color:var(--krn-color-text-muted);line-height:var(--krn-line-height-body)}.body:empty,.actions:empty{display:none}.actions{display:flex;flex-wrap:wrap;justify-content:center;gap:var(--krn-space-2);padding-block-start:var(--krn-space-2)}
`;

@Component({
  selector: 'krn-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: STATE_TEMPLATE,
  styles: STATE_STYLES,
})
export class KrnEmptyState {
  readonly title = input('Nothing here yet');
  readonly description = input('');
  readonly tone = input<KrnFeedbackTone>('neutral');
}

@Component({
  selector: 'krn-error-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: STATE_TEMPLATE,
  styles: STATE_STYLES,
})
export class KrnErrorState extends KrnEmptyState {
  override readonly title = input('Something went wrong');
  override readonly tone = input<KrnFeedbackTone>('danger');
}

@Component({
  selector: 'krn-success-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: STATE_TEMPLATE,
  styles: STATE_STYLES,
})
export class KrnSuccessState extends KrnEmptyState {
  override readonly title = input('Completed');
  override readonly tone = input<KrnFeedbackTone>('success');
}

@Component({
  selector: 'krn-confirmation, krn-confirmation-pattern',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (!confirming()) {
      <button type="button" class="request" (click)="confirming.set(true)">{{ requestLabel() }}</button>
    } @else {
      <div class="confirmation" role="group" [attr.aria-label]="prompt()">
        <span>{{ prompt() }}</span>
        <button type="button" class="confirm" (click)="confirm()">{{ confirmLabel() }}</button>
        <button type="button" class="cancel" (click)="cancel()">{{ cancelLabel() }}</button>
      </div>
    }
  `,
  styles: `
    :host{display:inline-block}.request,.confirmation button{min-block-size:var(--krn-control-height-sm);padding-inline:var(--krn-space-3);border:var(--krn-border-width-1) solid var(--krn-color-border-interactive);border-radius:var(--krn-radius-sm);background:var(--krn-color-surface);color:var(--krn-color-text);font:inherit;font-weight:var(--krn-font-weight-medium);cursor:pointer}.request:hover,.cancel:hover{background:var(--krn-color-surface-subtle)}.confirmation{display:flex;align-items:center;flex-wrap:wrap;gap:var(--krn-space-2);padding:var(--krn-space-2);border:var(--krn-border-width-1) solid var(--krn-color-danger);border-radius:var(--krn-radius-md);background:var(--krn-color-danger-subtle);color:var(--krn-color-text);font-size:var(--krn-font-size-sm)}.confirm{border-color:var(--krn-color-danger)!important;background:var(--krn-color-danger)!important;color:var(--krn-color-on-danger)!important}:is(button):focus-visible{outline:var(--krn-focus-ring-width) solid var(--krn-color-focus);outline-offset:var(--krn-focus-ring-offset)}
  `,
})
export class KrnConfirmation {
  readonly confirming = model(false);
  readonly requestLabel = input('Delete');
  readonly prompt = input('Are you sure?');
  readonly confirmLabel = input('Confirm');
  readonly cancelLabel = input('Cancel');
  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  protected confirm(): void {
    this.confirming.set(false);
    this.confirmed.emit();
  }

  protected cancel(): void {
    this.confirming.set(false);
    this.cancelled.emit();
  }
}

export { KrnConfirmation as KrnConfirmationPattern };
