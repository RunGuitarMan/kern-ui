import {
  ChangeDetectionStrategy,
  Component,
  type ElementRef,
  computed,
  inject,
  input,
  model,
  viewChildren,
} from '@angular/core';
import { KRN_TRANSLATIONS } from '@kern-ui/angular/core';
import { KrnBadge } from '@kern-ui/angular/kit';
import type { KrnFilterDefinition } from './product-types';

@Component({
  selector: 'krn-filter-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [KrnBadge],
  templateUrl: './filter-bar.html',
  styleUrl: './filter-bar.css',
})
export class KrnFilterBar {
  private readonly translations = inject(KRN_TRANSLATIONS);
  private readonly filterSelects = viewChildren<ElementRef<HTMLSelectElement>>('filterSelect');
  readonly ariaLabel = input<typeof this.translations.patterns.filters | undefined>();
  readonly allLabel = input<typeof this.translations.patterns.all | undefined>();
  readonly activeLabel = input<typeof this.translations.patterns.activeFilters | undefined>();
  readonly clearAllLabel = input<typeof this.translations.patterns.clearAll | undefined>();
  readonly filters = input<readonly KrnFilterDefinition[]>([]);
  readonly values = model<Readonly<Partial<Record<string, string>>>>({});
  protected readonly resolvedAriaLabel = computed(() =>
    this.requiredLabel(this.ariaLabel(), this.translations.patterns.filters, 'Filters'),
  );
  protected readonly resolvedAllLabel = computed(() =>
    this.requiredLabel(this.allLabel(), this.translations.patterns.all, 'All'),
  );
  protected readonly resolvedClearAllLabel = computed(() =>
    this.requiredLabel(this.clearAllLabel(), this.translations.patterns.clearAll, 'Clear all'),
  );
  protected readonly validatedFilters = computed(() => {
    const filterIds = new Set<string>();
    for (const [filterIndex, filter] of this.filters().entries()) {
      const filterId = typeof filter.id === 'string' ? filter.id.trim() : '';
      if (!filterId || filterIds.has(filterId)) {
        throw new Error(
          `KrnFilterBar requires non-empty unique filter ids; received "${String(filter.id)}" at index ${filterIndex}.`,
        );
      }
      filterIds.add(filterId);
      if (typeof filter.label !== 'string' || !filter.label.trim()) {
        throw new Error(`KrnFilterBar filter "${filter.id}" requires a non-empty label.`);
      }

      const optionValues = new Set<string>();
      for (const [optionIndex, option] of filter.options.entries()) {
        const optionValue = typeof option.value === 'string' ? option.value.trim() : '';
        if (!optionValue || optionValues.has(optionValue)) {
          throw new Error(
            `KrnFilterBar filter "${filter.id}" requires non-empty unique option values; received "${String(option.value)}" at index ${optionIndex}.`,
          );
        }
        optionValues.add(optionValue);
        if (typeof option.label !== 'string' || !option.label.trim()) {
          throw new Error(`KrnFilterBar option "${option.value}" requires a non-empty label.`);
        }
        if (
          option.count !== undefined &&
          (!Number.isSafeInteger(option.count) || option.count < 0)
        ) {
          throw new RangeError(
            `KrnFilterBar option "${option.value}" count must be a non-negative safe integer.`,
          );
        }
      }
    }

    return this.filters();
  });
  protected readonly validatedValues = computed(() => {
    const values = this.values();
    if (!values || typeof values !== 'object' || Array.isArray(values)) {
      throw new TypeError('KrnFilterBar values must be a key-value record.');
    }

    const definitions = new Map(this.validatedFilters().map((filter) => [filter.id, filter]));
    for (const [filterId, value] of Object.entries(values)) {
      const filter = definitions.get(filterId);
      if (!filter) {
        throw new Error(`KrnFilterBar values contain unknown filter id "${filterId}".`);
      }
      if (value !== undefined && typeof value !== 'string') {
        throw new TypeError(`KrnFilterBar value for "${filterId}" must be a string.`);
      }
      if (value && !filter.options.some((option) => option.value === value)) {
        throw new Error(`KrnFilterBar value "${value}" is not an option of filter "${filterId}".`);
      }
    }

    return values;
  });
  protected readonly activeCount = computed(
    () => Object.values(this.validatedValues()).filter(Boolean).length,
  );
  protected readonly resolvedActiveLabel = computed(() => {
    const count = this.activeCount();
    const formatter = this.activeLabel();
    const translatedFormatter = this.translations.patterns.activeFilters;
    const formatted = typeof formatter === 'function' ? formatter(count) : '';
    const translated = typeof translatedFormatter === 'function' ? translatedFormatter(count) : '';

    return (
      formatted.trim() || translated.trim() || `${count} active filter${count === 1 ? '' : 's'}`
    );
  });

  protected setFilter(id: string, event: Event): void {
    const value = (event.currentTarget as HTMLSelectElement).value;
    this.values.update((current) => {
      if (value) {
        return { ...current, [id]: value };
      }

      const { [id]: removedValue, ...next } = current;
      void removedValue;
      return next;
    });
  }

  protected clear(): void {
    this.values.set({});
    this.filterSelects()[0]?.nativeElement.focus({ preventScroll: true });
  }

  private requiredLabel(value: string | undefined, fallback: string, hardFallback: string): string {
    const normalized = typeof value === 'string' ? value.trim() : '';
    const normalizedFallback = typeof fallback === 'string' ? fallback.trim() : '';
    return normalized || normalizedFallback || hardFallback;
  }
}
