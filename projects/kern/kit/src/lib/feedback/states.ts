import { ChangeDetectionStrategy, Component, inject, input, model, output } from '@angular/core';
import { KRN_TRANSLATIONS } from '@kern-ui/angular/core';
import type { KrnFeedbackTone } from './feedback.types';

const STATE_TEMPLATE = `
  <section
    class="state"
    [attr.data-tone]="tone()"
    [attr.data-kind]="stateKind()"
    [attr.role]="tone() === 'danger' ? 'alert' : 'status'"
  >
    <div class="visual" aria-hidden="true">
      <ng-content select="[krnStateVisual]" />
      @switch (stateKind()) {
        @case ('success') {
          <svg class="default-visual" viewBox="0 0 24 24">
            <path d="m7.5 12.5 3 3 6-7" />
            <circle cx="12" cy="12" r="8.25" />
          </svg>
        }
        @case ('error') {
          <svg class="default-visual" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="8.25" />
            <path d="M12 7.75v5.5M12 16.5h.01" />
          </svg>
        }
        @default {
          <svg class="default-visual" viewBox="0 0 24 24">
            <path d="M4.75 9.5h14.5v8.25a1.5 1.5 0 0 1-1.5 1.5H6.25a1.5 1.5 0 0 1-1.5-1.5V9.5Z" />
            <path d="m7.25 9.5 1.6-4.25h6.3l1.6 4.25M4.75 14h4l1.2 1.75h4.1L15.25 14h4" />
          </svg>
        }
      }
    </div>
    <h2>{{ title() }}</h2>
    @if (description()) {
      <p>{{ description() }}</p>
    }
    <div class="body"><ng-content /></div>
    <div class="actions"><ng-content select="[krnStateAction]" /></div>
  </section>
`;

const STATE_STYLES = `
  :host{display:block}.state{--tone:var(--krn-color-text-muted);--tone-subtle:var(--krn-color-surface-subtle);display:grid;justify-items:center;gap:var(--krn-space-3);max-inline-size:36rem;margin-inline:auto;padding:clamp(var(--krn-space-6),7vw,var(--krn-space-12));color:var(--krn-color-text);text-align:center}.state[data-tone=success]{--tone:var(--krn-color-success);--tone-subtle:var(--krn-color-success-subtle)}.state[data-tone=danger]{--tone:var(--krn-color-danger);--tone-subtle:var(--krn-color-danger-subtle)}.visual{display:grid;inline-size:3.5rem;block-size:3.5rem;border:var(--krn-border-width-1) solid color-mix(in oklch,var(--tone) 32%,var(--krn-color-border));border-radius:var(--krn-radius-lg);place-items:center;background:color-mix(in oklch,var(--krn-color-surface-raised) 84%,var(--tone-subtle));color:var(--tone);box-shadow:var(--krn-shadow-xs)}.visual:has([krnStateVisual]) .default-visual{display:none}.default-visual{inline-size:1.5rem;block-size:1.5rem;fill:none;stroke:currentColor;stroke-linecap:round;stroke-linejoin:round;stroke-width:1.7}h2{margin:var(--krn-space-1) 0 0;font-size:var(--krn-font-size-xl);line-height:var(--krn-line-height-tight);letter-spacing:-.018em}p,.body{max-inline-size:48ch;margin:0;color:var(--krn-color-text-muted);line-height:var(--krn-line-height-body)}.body:empty,.actions:empty{display:none}.actions{display:flex;flex-wrap:wrap;justify-content:center;gap:var(--krn-space-2);padding-block-start:var(--krn-space-2)}
`;

@Component({
  selector: 'krn-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: STATE_TEMPLATE,
  styles: STATE_STYLES,
})
export class KrnEmptyState {
  protected readonly translations = inject(KRN_TRANSLATIONS);
  readonly title = input(this.translations.feedback.emptyStateTitle);
  readonly description = input('');
  readonly tone = input<KrnFeedbackTone>('neutral');

  protected stateKind(): 'empty' | 'error' | 'success' {
    return 'empty';
  }
}

@Component({
  selector: 'krn-error-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: STATE_TEMPLATE,
  styles: STATE_STYLES,
})
export class KrnErrorState extends KrnEmptyState {
  override readonly title = input(this.translations.feedback.errorStateTitle);
  override readonly tone = input<KrnFeedbackTone>('danger');

  protected override stateKind(): 'empty' | 'error' | 'success' {
    return 'error';
  }
}

@Component({
  selector: 'krn-success-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: STATE_TEMPLATE,
  styles: STATE_STYLES,
})
export class KrnSuccessState extends KrnEmptyState {
  override readonly title = input(this.translations.feedback.successStateTitle);
  override readonly tone = input<KrnFeedbackTone>('success');

  protected override stateKind(): 'empty' | 'error' | 'success' {
    return 'success';
  }
}

@Component({
  selector: 'krn-confirmation, krn-confirmation-pattern',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (!confirming()) {
      <button type="button" class="request" (click)="confirming.set(true)">
        {{ requestLabel() }}
      </button>
    } @else {
      <div class="confirmation" role="group" [attr.aria-label]="prompt()">
        <span>{{ prompt() }}</span>
        <button type="button" class="confirm" (click)="confirm()">{{ confirmLabel() }}</button>
        <button type="button" class="cancel" (click)="cancel()">{{ cancelLabel() }}</button>
      </div>
    }
  `,
  styles: `
    :host {
      display: inline-block;
    }
    .request,
    .confirmation button {
      min-block-size: var(--krn-control-height-sm);
      padding-inline: var(--krn-space-3);
      border: var(--krn-border-width-1) solid var(--krn-color-border-interactive);
      border-radius: var(--krn-radius-sm);
      background: var(--krn-color-surface);
      color: var(--krn-color-text);
      font: inherit;
      font-weight: var(--krn-font-weight-medium);
      cursor: pointer;
    }
    .request:hover,
    .cancel:hover {
      background: var(--krn-color-surface-subtle);
    }
    .confirmation {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: var(--krn-space-2);
      padding: var(--krn-space-2);
      border: var(--krn-border-width-1) solid var(--krn-color-danger);
      border-radius: var(--krn-radius-md);
      background: var(--krn-color-danger-subtle);
      color: var(--krn-color-text);
      font-size: var(--krn-font-size-sm);
    }
    .confirm {
      border-color: var(--krn-color-danger) !important;
      background: var(--krn-color-danger) !important;
      color: var(--krn-color-on-danger) !important;
    }
    :is(button):focus-visible {
      outline: var(--krn-focus-ring-width) solid var(--krn-color-focus);
      outline-offset: var(--krn-focus-ring-offset);
    }
  `,
})
export class KrnConfirmation {
  private readonly translations = inject(KRN_TRANSLATIONS);
  readonly confirming = model(false);
  readonly requestLabel = input(this.translations.feedback.delete);
  readonly prompt = input(this.translations.feedback.confirmPrompt);
  readonly confirmLabel = input(this.translations.feedback.confirm);
  readonly cancelLabel = input(this.translations.feedback.cancel);
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
