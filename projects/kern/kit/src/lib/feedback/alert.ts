import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { KRN_TRANSLATIONS } from '@kern-ui/angular/core';
import { krnInputFallback } from '../reactive-input';
import type { KrnFeedbackTone } from './feedback.types';

const ALERT_TEMPLATE = `
  @if (visible()) {
    <section
      class="alert"
      [attr.data-tone]="tone()"
      [attr.role]="tone() === 'danger' ? 'alert' : 'status'"
      [attr.aria-live]="tone() === 'danger' ? 'assertive' : 'polite'"
    >
      <span class="indicator" aria-hidden="true">{{ icon() || toneIcon() }}</span>
      <div class="content">
        @if (title()) {
          <strong>{{ title() }}</strong>
        }
        <div class="body"><ng-content /></div>
        <div class="actions"><ng-content select="[krnAlertAction]" /></div>
      </div>
      @if (dismissible()) {
        <button type="button" class="dismiss" [attr.aria-label]="resolvedDismissLabel()" (click)="dismiss()">
          <span aria-hidden="true">×</span>
        </button>
      }
    </section>
  }
`;

const ALERT_STYLES = `
  :host{display:block}.alert{--tone:var(--krn-color-info);--tone-ink:var(--krn-color-info-text,var(--tone));--tone-subtle:var(--krn-color-info-subtle);display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:start;gap:var(--krn-space-3);padding:var(--krn-space-4);border:var(--krn-border-width-1) solid color-mix(in oklch,var(--tone) 30%,var(--krn-color-border));border-radius:var(--krn-radius-md);background:color-mix(in oklch,var(--krn-color-surface-raised) 88%,var(--tone-subtle));color:var(--krn-color-text);box-shadow:inset calc(var(--krn-border-width-1) * 2) 0 0 var(--tone)}.alert[data-tone=neutral]{--tone:var(--krn-color-text-muted);--tone-ink:var(--krn-color-text);--tone-subtle:var(--krn-color-surface-subtle)}.alert[data-tone=success]{--tone:var(--krn-color-success);--tone-ink:var(--krn-color-success-text,var(--tone));--tone-subtle:var(--krn-color-success-subtle)}.alert[data-tone=warning]{--tone:var(--krn-color-warning);--tone-ink:var(--krn-color-warning-text,var(--tone));--tone-subtle:var(--krn-color-warning-subtle)}.alert[data-tone=danger]{--tone:var(--krn-color-danger);--tone-ink:var(--krn-color-danger-text,var(--tone));--tone-subtle:var(--krn-color-danger-subtle)}.indicator{display:grid;inline-size:var(--krn-control-height-sm);block-size:var(--krn-control-height-sm);border:var(--krn-border-width-1) solid color-mix(in oklch,var(--tone) 28%,transparent);border-radius:var(--krn-radius-full);place-items:center;background:color-mix(in oklch,var(--tone) 9%,transparent);color:var(--tone-ink);font-size:var(--krn-font-size-xs);font-weight:var(--krn-font-weight-bold)}.content{display:grid;gap:var(--krn-space-1);min-inline-size:0;padding-block:var(--krn-space-1)}strong{font-weight:var(--krn-font-weight-semibold);letter-spacing:-.006em}.body{color:color-mix(in oklch,var(--krn-color-text-muted) 92%,var(--tone-ink));line-height:var(--krn-line-height-body)}.actions:empty{display:none}.actions{display:flex;flex-wrap:wrap;gap:var(--krn-space-2);padding-block-start:var(--krn-space-2)}.dismiss{display:grid;inline-size:var(--krn-control-height-sm);block-size:var(--krn-control-height-sm);padding:0;border:0;border-radius:var(--krn-radius-sm);place-items:center;background:transparent;color:var(--krn-color-text-muted);font:inherit;font-size:var(--krn-font-size-lg);cursor:pointer;transition:background var(--krn-motion-duration-interaction) var(--krn-motion-ease-standard),color var(--krn-motion-duration-interaction) var(--krn-motion-ease-standard)}.dismiss:hover{background:color-mix(in oklch,var(--krn-color-surface-hover) 86%,var(--tone-subtle));color:var(--krn-color-text)}.dismiss:focus-visible{outline:var(--krn-focus-ring-width) solid var(--krn-color-focus);outline-offset:var(--krn-focus-ring-offset)}@media(forced-colors:active){.alert{border-width:calc(var(--krn-border-width-1) * 2);box-shadow:none}.indicator{forced-color-adjust:none}}
`;

@Component({
  selector: 'krn-alert',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ALERT_TEMPLATE,
  styles: ALERT_STYLES,
})
export class KrnAlert {
  private readonly translations = inject(KRN_TRANSLATIONS);
  readonly tone = input<KrnFeedbackTone>('info');
  readonly title = input('');
  readonly icon = input('');
  readonly dismissible = input(false, { transform: booleanAttribute });
  readonly dismissLabel = input<string | undefined>();
  protected readonly resolvedDismissLabel = krnInputFallback(
    this.dismissLabel,
    () => this.translations.feedback.dismissMessage,
  );
  readonly closed = output<void>();
  protected readonly visible = signal(true);

  protected toneIcon(): string {
    return { neutral: '•', info: 'i', success: '✓', warning: '!', danger: '!' }[this.tone()];
  }

  protected dismiss(): void {
    this.visible.set(false);
    this.closed.emit();
  }
}

@Component({
  selector: 'krn-banner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-banner]': 'true' },
  template: ALERT_TEMPLATE,
  styles: [
    ALERT_STYLES,
    `
      :host {
        display: block;
      }
      .alert {
        border-radius: var(--krn-radius-none);
        padding-inline: clamp(var(--krn-space-4), 4vw, var(--krn-space-12));
      }
    `,
  ],
})
export class KrnBanner extends KrnAlert {}
