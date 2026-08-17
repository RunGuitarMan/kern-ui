import type { ElementRef } from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  inject,
  input,
  model,
  numberAttribute,
  viewChildren,
} from '@angular/core';
import { KRN_TRANSLATIONS } from '@kern-ui/angular/core';
import { krnInputFallback } from '../reactive-input';
import { krnResolvedLocale } from '../reactive-locale';

@Component({
  selector: 'krn-meter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'meter',
    '[attr.aria-label]': 'label()',
    '[attr.aria-valuemin]': 'safeMin()',
    '[attr.aria-valuemax]': 'safeMax()',
    '[attr.aria-valuenow]': 'safeValue()',
    '[attr.aria-valuetext]': 'displayValue()',
    '[attr.data-tone]': 'meterTone()',
  },
  templateUrl: './meter.html',
  styleUrl: './meter.css',
})
export class KrnMeter {
  readonly locale = input<string | string[] | undefined>();
  private readonly resolvedLocale = krnResolvedLocale(this.locale);
  readonly label = input.required<string>();
  readonly value = input.required<number>();
  readonly min = input(0, { transform: numberAttribute });
  readonly max = input(100, { transform: numberAttribute });
  readonly low = input(25, { transform: numberAttribute });
  readonly high = input(75, { transform: numberAttribute });
  readonly optimum = input(100, { transform: numberAttribute });
  protected readonly safeMin = computed(() => Math.min(this.min(), this.max()));
  protected readonly safeMax = computed(() => Math.max(this.min() + 1, this.max()));
  protected readonly safeValue = computed(() =>
    Math.min(this.safeMax(), Math.max(this.safeMin(), this.value())),
  );
  protected readonly percentage = computed(
    () => ((this.safeValue() - this.safeMin()) / (this.safeMax() - this.safeMin())) * 100,
  );
  private readonly percentageFormatter = computed(
    () =>
      new Intl.NumberFormat(this.resolvedLocale(), {
        style: 'percent',
        maximumFractionDigits: 0,
      }),
  );
  protected readonly displayValue = computed(() =>
    this.percentageFormatter().format(this.percentage() / 100),
  );
  protected readonly meterTone = computed<'success' | 'warning' | 'danger'>(() => {
    const value = this.safeValue();
    if (this.optimum() <= this.low()) {
      return value <= this.low() ? 'success' : value <= this.high() ? 'warning' : 'danger';
    }
    if (this.optimum() >= this.high()) {
      return value >= this.high() ? 'success' : value >= this.low() ? 'warning' : 'danger';
    }
    return value >= this.low() && value <= this.high() ? 'success' : 'warning';
  });
}

@Component({
  selector: 'krn-rating',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'radiogroup',
    '[attr.aria-label]': 'resolvedAriaLabel()',
    '[attr.aria-readonly]': 'readonly()',
  },
  templateUrl: './rating.html',
  styleUrl: './rating.css',
})
export class KrnRating {
  private readonly ratingItems = viewChildren<ElementRef<HTMLButtonElement>>('ratingItem');
  protected readonly translations = inject(KRN_TRANSLATIONS);
  readonly value = model(0);
  readonly max = input(5, { transform: numberAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly ariaLabel = input<string | undefined>();
  protected readonly resolvedAriaLabel = krnInputFallback(
    this.ariaLabel,
    () => this.translations.dataDisplay.rating,
  );
  protected readonly items = computed(() =>
    Array.from({ length: Math.max(1, this.max()) }, (_, index) => index + 1),
  );

  protected setValue(value: number): void {
    if (!this.disabled() && !this.readonly()) this.value.set(value);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (this.disabled() || this.readonly()) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault();
      const value = Math.min(this.max(), this.value() + 1);
      this.value.set(value);
      this.focusValue(value);
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault();
      const value = Math.max(1, this.value() - 1);
      this.value.set(value);
      this.focusValue(value);
    }
  }

  private focusValue(value: number): void {
    this.ratingItems()[value - 1]?.nativeElement.focus();
  }
}
