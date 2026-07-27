import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  forwardRef,
  input,
  numberAttribute,
  output,
  signal,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import type { KrnRangeValue } from './form-types';
import { KrnValueAccessor, useKrnControlA11y } from './value-accessor';

@Component({
  selector: 'krn-slider',
  host: {
    '[attr.id]': 'null',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => KrnSlider),
      multi: true,
    },
  ],
  template: `
    <div class="krn-slider" [style.--krn-slider-progress]="valuePercent() + '%'">
      @if (label() || showValue()) {
        <div class="krn-slider__header">
          <span [id]="labelId()">{{ label() }}</span>
          @if (showValue()) {
            <output [for]="a11y.id()">{{ formattedValue() }}</output>
          }
        </div>
      }
      <input
        class="krn-range"
        type="range"
        [attr.aria-describedby]="a11y.describedBy()"
        [attr.aria-invalid]="a11y.invalid()"
        [attr.aria-label]="label() ? null : ariaLabel()"
        [attr.aria-labelledby]="label() ? labelId() : null"
        [attr.aria-readonly]="readOnly()"
        [attr.aria-valuetext]="formattedValue()"
        [disabled]="isDisabled()"
        [id]="a11y.id()"
        [max]="max()"
        [min]="min()"
        [step]="step()"
        [value]="controlValue()"
        (blur)="touch()"
        (input)="updateValue($event)"
      />
    </div>
  `,
  styleUrl: './forms.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnSlider extends KrnValueAccessor<number> {
  readonly id = input('');
  readonly label = input('');
  readonly ariaLabel = input('Value');
  readonly min = input(0, { transform: numberAttribute });
  readonly max = input(100, { transform: numberAttribute });
  readonly step = input(1, { transform: numberAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, {
    alias: 'readonly',
    transform: booleanAttribute,
  });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly showValue = input(true, { transform: booleanAttribute });
  readonly valueFormatter = input<((value: number) => string) | undefined>(undefined);
  readonly valueChange = output<number>();

  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  protected readonly a11y = useKrnControlA11y(this.id, this.invalid, 'slider');
  protected readonly labelId = computed(() => `${this.a11y.id()}-label`);
  protected readonly formattedValue = computed(
    () => this.valueFormatter()?.(this.controlValue()) ?? `${this.controlValue()}`,
  );
  protected readonly valuePercent = computed(() => {
    const span = this.max() - this.min();
    return span > 0 ? ((this.controlValue() - this.min()) / span) * 100 : 0;
  });

  constructor() {
    super(0);
    effect(() => {
      const current = this.controlValue();
      const normalized = this.clamp(current);
      if (!Object.is(current, normalized)) {
        this.controlValue.set(normalized);
      }
    });
  }

  protected override normalizeIncomingValue(value: unknown): number {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? this.clamp(numeric) : this.min();
  }

  protected updateValue(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (this.readOnly()) {
      input.value = `${this.controlValue()}`;
      return;
    }
    const value = this.clamp(input.valueAsNumber);
    this.commitValue(value);
    this.valueChange.emit(value);
  }

  private clamp(value: number): number {
    return Math.min(this.max(), Math.max(this.min(), value));
  }
}

@Component({
  selector: 'krn-range-slider',
  host: {
    '[attr.id]': 'null',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => KrnRangeSlider),
      multi: true,
    },
  ],
  template: `
    <div
      class="krn-slider krn-range-pair"
      role="group"
      [attr.aria-describedby]="a11y.describedBy()"
      [attr.aria-invalid]="a11y.invalid()"
      [attr.aria-label]="label()"
      [id]="a11y.id()"
      [style.--krn-range-end]="endPercent() + '%'"
      [style.--krn-range-start]="startPercent() + '%'"
    >
      <div class="krn-slider__header">
        <span>{{ label() }}</span>
        <output>{{ controlValue().start }} – {{ controlValue().end }}</output>
      </div>
      <div
        class="krn-dual-range"
        [attr.data-active-thumb]="activeThumb()"
        [attr.data-disabled]="isDisabled()"
        (pointerdown)="moveNearestThumb($event)"
      >
        <div class="krn-dual-range__track" aria-hidden="true">
          <span class="krn-dual-range__selection"></span>
        </div>
        <input
          class="krn-range krn-range--overlay krn-range--start"
          type="range"
          [attr.aria-label]="startLabel()"
          [attr.aria-readonly]="readOnly()"
          [attr.aria-valuetext]="startLabel() + ': ' + controlValue().start"
          [disabled]="isDisabled()"
          [max]="max()"
          [min]="min()"
          [step]="step()"
          [value]="controlValue().start"
          (blur)="touch()"
          (focus)="activeThumb.set('start')"
          (input)="updateStart($event)"
          (pointerdown)="activeThumb.set('start')"
        />
        <input
          class="krn-range krn-range--overlay krn-range--end"
          type="range"
          [attr.aria-label]="endLabel()"
          [attr.aria-readonly]="readOnly()"
          [attr.aria-valuetext]="endLabel() + ': ' + controlValue().end"
          [disabled]="isDisabled()"
          [max]="max()"
          [min]="min()"
          [step]="step()"
          [value]="controlValue().end"
          (blur)="touch()"
          (focus)="activeThumb.set('end')"
          (input)="updateEnd($event)"
          (pointerdown)="activeThumb.set('end')"
        />
      </div>
    </div>
  `,
  styleUrl: './forms.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnRangeSlider extends KrnValueAccessor<KrnRangeValue> {
  readonly id = input('');
  readonly label = input('Range');
  readonly startLabel = input('Minimum value');
  readonly endLabel = input('Maximum value');
  readonly min = input(0, { transform: numberAttribute });
  readonly max = input(100, { transform: numberAttribute });
  readonly step = input(1, { transform: numberAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, {
    alias: 'readonly',
    transform: booleanAttribute,
  });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly valueChange = output<KrnRangeValue>();
  readonly activeThumb = signal<'start' | 'end'>('end');

  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  protected readonly a11y = useKrnControlA11y(this.id, this.invalid, 'range-slider');
  protected readonly startPercent = computed(() => this.toPercent(this.controlValue().start));
  protected readonly endPercent = computed(() => this.toPercent(this.controlValue().end));

  constructor() {
    super({ start: 0, end: 100 });
    effect(() => {
      const current = this.controlValue();
      const normalized = this.normalizeRange(current.start, current.end);
      if (current.start !== normalized.start || current.end !== normalized.end) {
        this.controlValue.set(normalized);
      }
    });
  }

  protected override normalizeIncomingValue(value: unknown): KrnRangeValue {
    if (typeof value !== 'object' || value === null || !('start' in value) || !('end' in value)) {
      return { start: this.min(), end: this.max() };
    }
    const start = Number(value.start);
    const end = Number(value.end);
    return this.normalizeRange(start, end);
  }

  protected updateStart(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (this.readOnly()) {
      input.value = `${this.controlValue().start}`;
      return;
    }
    const current = this.controlValue();
    const start = Math.min(this.clamp(input.valueAsNumber), current.end);
    this.emitRange({ start, end: current.end });
  }

  protected updateEnd(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (this.readOnly()) {
      input.value = `${this.controlValue().end}`;
      return;
    }
    const current = this.controlValue();
    const end = Math.max(this.clamp(input.valueAsNumber), current.start);
    this.emitRange({ start: current.start, end });
  }

  protected moveNearestThumb(event: PointerEvent): void {
    const host = event.currentTarget;
    if (
      !(host instanceof HTMLElement) ||
      event.target instanceof HTMLInputElement ||
      this.isDisabled() ||
      this.readOnly()
    ) {
      return;
    }

    event.preventDefault();
    const value = this.valueFromPointer(event, host);
    const current = this.controlValue();
    const startDistance = Math.abs(value - current.start);
    const endDistance = Math.abs(value - current.end);
    const thumb =
      startDistance === endDistance
        ? this.activeThumb()
        : startDistance < endDistance
          ? 'start'
          : 'end';

    this.activeThumb.set(thumb);
    if (thumb === 'start') {
      this.emitRange({ start: Math.min(value, current.end), end: current.end });
    } else {
      this.emitRange({ start: current.start, end: Math.max(value, current.start) });
    }
    host
      .querySelector<HTMLInputElement>(thumb === 'start' ? '.krn-range--start' : '.krn-range--end')
      ?.focus();
  }

  private emitRange(value: KrnRangeValue): void {
    this.commitValue(value);
    this.valueChange.emit(value);
  }

  private normalizeRange(start: number, end: number): KrnRangeValue {
    const safeStart = Number.isFinite(start) ? this.clamp(start) : this.min();
    const safeEnd = Number.isFinite(end) ? this.clamp(end) : this.max();
    return safeStart <= safeEnd
      ? { start: safeStart, end: safeEnd }
      : { start: safeEnd, end: safeStart };
  }

  private clamp(value: number): number {
    return Math.min(this.max(), Math.max(this.min(), value));
  }

  private valueFromPointer(event: PointerEvent, host: HTMLElement): number {
    const bounds = host.getBoundingClientRect();
    const rootFontSize =
      Number.parseFloat(getComputedStyle(host.ownerDocument.documentElement).fontSize) || 16;
    const thumbRadius = rootFontSize * 0.5625;
    const travel = Math.max(1, bounds.width - thumbRadius * 2);
    const physicalOffset =
      getComputedStyle(host).direction === 'rtl'
        ? bounds.right - event.clientX
        : event.clientX - bounds.left;
    const ratio = Math.min(1, Math.max(0, (physicalOffset - thumbRadius) / travel));
    const rawValue = this.min() + ratio * (this.max() - this.min());
    const step = Math.abs(this.step());
    if (!Number.isFinite(step) || step === 0) {
      return this.clamp(rawValue);
    }
    const snapped = this.min() + Math.round((rawValue - this.min()) / step) * step;
    const precision = Math.min(
      12,
      Math.max(
        this.fractionDigits(this.min()),
        this.fractionDigits(this.max()),
        this.fractionDigits(step),
      ),
    );
    return this.clamp(Number(snapped.toFixed(precision)));
  }

  private fractionDigits(value: number): number {
    const fraction = `${value}`.split('.')[1];
    return fraction?.length ?? 0;
  }

  private toPercent(value: number): number {
    const span = this.max() - this.min();
    return span > 0 ? ((value - this.min()) / span) * 100 : 0;
  }
}
