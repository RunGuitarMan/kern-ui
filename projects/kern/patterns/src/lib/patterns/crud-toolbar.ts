import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  numberAttribute,
} from '@angular/core';
import { KRN_TRANSLATIONS } from '@kern-ui/angular/core';

@Component({
  selector: 'krn-crud-toolbar, krn-bulk-actions',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'toolbar',
    'aria-orientation': 'horizontal',
    '[attr.aria-label]': 'resolvedAriaLabel()',
    '[attr.data-bulk]': 'validatedSelectedCount() ? "" : null',
  },
  template: `
    <div class="primary">
      <span class="selection-status" role="status" aria-live="polite" aria-atomic="true">{{
        resolvedSelectedLabel()
      }}</span>
      @if (validatedSelectedCount()) {
        <strong aria-hidden="true">{{ resolvedSelectedLabel() }}</strong>
      } @else {
        <ng-content select="[krnToolbarTitle]" />
      }
    </div>
    <div class="actions"><ng-content /></div>
  `,
  styles: `
    :host {
      display: flex;
      min-block-size: 3.5rem;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding-inline: 0.75rem;
      border-block: 1px solid var(--krn-color-border-subtle, #e0e3e7);
      color: var(--krn-color-text, #252932);
      background: var(--krn-color-surface, #fff);
      flex-wrap: wrap;
    }
    :host([hidden]) {
      display: none;
    }
    :host([data-bulk]) {
      border-color: var(--krn-color-brand-border, #dc7352);
      background: var(--krn-color-brand-surface, #fff0e8);
    }
    .primary,
    .actions {
      display: flex;
      min-inline-size: 0;
      align-items: center;
      gap: 0.5rem;
    }
    .actions {
      flex-wrap: wrap;
      justify-content: end;
      margin-inline-start: auto;
    }
    .primary {
      overflow-wrap: anywhere;
    }
    .selection-status {
      position: absolute;
      inline-size: 1px;
      block-size: 1px;
      overflow: hidden;
      clip-path: inset(50%);
    }
    @media (forced-colors: active) {
      :host,
      :host([data-bulk]) {
        border-color: CanvasText;
      }
      :host([data-bulk]) {
        outline: 2px solid Highlight;
        outline-offset: -2px;
      }
    }
  `,
})
export class KrnCrudToolbar {
  private readonly translations = inject(KRN_TRANSLATIONS);
  readonly ariaLabel = input<typeof this.translations.patterns.actions | undefined>();
  readonly selectedCount = input(0, { transform: numberAttribute });
  readonly selectedLabel = input<typeof this.translations.patterns.selectedCount | undefined>();
  protected readonly resolvedAriaLabel = computed(() =>
    this.requiredLabel(this.ariaLabel(), this.translations.patterns.actions, 'Actions'),
  );
  protected readonly validatedSelectedCount = computed(() => {
    const count = this.selectedCount();
    if (!Number.isSafeInteger(count) || count < 0) {
      throw new RangeError('KrnCrudToolbar selectedCount must be a non-negative safe integer.');
    }
    return count;
  });
  protected readonly resolvedSelectedLabel = computed(() => {
    const count = this.validatedSelectedCount();
    const formatter = this.selectedLabel();
    const translatedFormatter = this.translations.patterns.selectedCount;
    const formatted = typeof formatter === 'function' ? formatter(count) : '';
    const translated = typeof translatedFormatter === 'function' ? translatedFormatter(count) : '';

    return formatted.trim() || translated.trim() || `${count} selected`;
  });

  private requiredLabel(value: string | undefined, fallback: string, hardFallback: string): string {
    const normalized = typeof value === 'string' ? value.trim() : '';
    const normalizedFallback = typeof fallback === 'string' ? fallback.trim() : '';
    return normalized || normalizedFallback || hardFallback;
  }
}
