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
  template: `
    <div class="labels">
      <span>{{ label() }}</span>
      <strong>{{ displayValue() }}</strong>
    </div>
    <span class="track" aria-hidden="true">
      <span class="fill" [style.inline-size.%]="percentage()"></span>
    </span>
  `,
  styles: `
    :host {
      --_meter-color: var(--krn-color-primary, #4f6feb);
      display: grid;
      gap: 0.5rem;
    }
    :host([data-tone='success']) {
      --_meter-color: var(--krn-color-success, #18724b);
    }
    :host([data-tone='warning']) {
      --_meter-color: var(--krn-color-warning, #946200);
    }
    :host([data-tone='danger']) {
      --_meter-color: var(--krn-color-danger, #b6293d);
    }
    .labels {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      color: var(--krn-color-text-muted, #626a76);
      font-size: 0.8125rem;
    }
    strong {
      color: var(--krn-color-text, #252932);
      font-variant-numeric: tabular-nums;
    }
    .track {
      display: block;
      block-size: 0.625rem;
      overflow: hidden;
      border: 1px solid var(--krn-color-border, #d8dbe0);
      border-radius: var(--krn-radius-full, 999px);
      background: var(--krn-color-surface-sunken, #eef0f2);
    }
    .fill {
      display: block;
      block-size: 100%;
      border-radius: inherit;
      background: linear-gradient(
        90deg,
        color-mix(in oklch, var(--_meter-color) 78%, white),
        var(--_meter-color)
      );
      box-shadow: 0 0 0.65rem color-mix(in oklch, var(--_meter-color) 24%, transparent);
      transition:
        inline-size var(--krn-motion-duration-layout)
          var(--krn-motion-ease-enter, cubic-bezier(0.16, 1, 0.3, 1)),
        background var(--krn-motion-duration-enter) var(--krn-motion-ease-standard, ease);
    }
    @media (prefers-reduced-motion: reduce) {
      :host-context(html:not([data-krn-motion='full'])) .fill {
        transition: none;
      }
    }
  `,
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
  template: `
    @for (item of items(); track item) {
      <button
        #ratingItem
        type="button"
        role="radio"
        [attr.aria-checked]="item === value()"
        [attr.aria-label]="translations.dataDisplay.ratingValue(item, max())"
        [attr.data-rating-item]="item"
        [attr.tabindex]="item === value() || (!value() && item === 1) ? 0 : -1"
        [disabled]="disabled()"
        (click)="setValue(item)"
        (keydown)="onKeydown($event)"
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          [attr.data-filled]="item <= value() ? '' : null"
        >
          <path
            d="m12 3.75 2.45 4.96 5.47.8-3.96 3.85.94 5.45L12 16.23 7.1 18.8l.94-5.45-3.96-3.85 5.47-.8L12 3.75Z"
          />
        </svg>
      </button>
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      gap: 0.125rem;
    }
    button {
      --_rating-color: oklch(66% 0.16 76);
      display: grid;
      inline-size: 2rem;
      block-size: 2rem;
      place-items: center;
      padding: 0;
      border: 0;
      border-radius: var(--krn-radius-control, 0.375rem);
      color: var(--_rating-color);
      background: transparent;
      cursor: pointer;
      transition:
        background var(--krn-motion-duration-interaction),
        transform var(--krn-motion-duration-interaction);
    }
    svg {
      inline-size: 1.25rem;
      block-size: 1.25rem;
      overflow: visible;
    }
    path {
      fill: color-mix(in oklch, var(--krn-color-surface, #fff) 90%, var(--_rating-color));
      stroke: color-mix(in oklch, var(--_rating-color) 64%, var(--krn-color-text-muted, #626a76));
      stroke-linejoin: round;
      stroke-width: 1.45;
      transition:
        fill var(--krn-motion-duration-interaction),
        stroke var(--krn-motion-duration-interaction);
    }
    svg[data-filled] path {
      fill: var(--_rating-color);
      stroke: color-mix(in oklch, var(--_rating-color) 84%, var(--krn-color-text, #252932));
    }
    button:hover {
      background: color-mix(in oklch, var(--_rating-color) 10%, transparent);
      transform: translateY(-1px);
    }
    button:focus-visible {
      outline: var(--krn-focus-ring, 2px solid #4f6feb);
      outline-offset: 1px;
    }
    button:disabled {
      opacity: var(--krn-opacity-disabled, 0.48);
      cursor: not-allowed;
    }
  `,
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
