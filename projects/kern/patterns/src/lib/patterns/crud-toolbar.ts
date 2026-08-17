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
  templateUrl: './crud-toolbar.html',
  styleUrl: './crud-toolbar.css',
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
