import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  numberAttribute,
  output,
  signal,
} from '@angular/core';
import { KRN_PLATFORM, krnIsHtmlElement } from '@kern-ui/angular/cdk';
import { KRN_TRANSLATIONS } from '@kern-ui/angular/core';
import type { KrnRangeValue } from './form-types';
import {
  KrnValueAccessor,
  maxError,
  mergeValidationErrors,
  minError,
  provideKrnFormControl,
  useKrnControlA11y,
} from './value-accessor';

@Component({
  selector: 'krn-slider',
  host: {
    '[attr.id]': 'null',
  },
  providers: [...provideKrnFormControl(() => KrnSlider)],
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
        [attr.aria-readonly]="a11y.readOnly()"
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnSlider extends KrnValueAccessor<number> {
  private readonly translations = inject(KRN_TRANSLATIONS);
  readonly id = input('');
  readonly label = input('');
  readonly ariaLabel = input(this.translations.forms.value);
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

  protected readonly a11y = useKrnControlA11y(this, this.id, this.invalid, 'slider', {
    disabled: this.disabled,
    readOnly: this.readOnly,
  });
  protected readonly isDisabled = computed(() => this.a11y.disabled() || this.formDisabled());
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
    this.watchValidationInputs(this.min, this.max);
  }

  protected override normalizeIncomingValue(value: unknown): number {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? this.clamp(numeric) : this.min();
  }

  protected override validateValue(value: unknown) {
    return mergeValidationErrors(minError(value, this.min()), maxError(value, this.max()));
  }

  protected updateValue(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (this.a11y.readOnly()) {
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
  providers: [...provideKrnFormControl(() => KrnRangeSlider)],
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
        [attr.data-dragging]="draggingThumb() !== null"
        (pointercancel)="finishPointerInteraction($event)"
        (pointerdown)="beginPointerInteraction($event)"
        (pointermove)="continuePointerInteraction($event)"
        (pointerup)="finishPointerInteraction($event)"
      >
        <div class="krn-dual-range__track" aria-hidden="true">
          <span class="krn-dual-range__selection"></span>
        </div>
        <input
          class="krn-range krn-range--overlay krn-range--start"
          type="range"
          [attr.aria-label]="startLabel()"
          [attr.aria-readonly]="a11y.readOnly()"
          [attr.aria-valuetext]="
            translations.forms.labeledValue(startLabel(), controlValue().start)
          "
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
          [attr.aria-readonly]="a11y.readOnly()"
          [attr.aria-valuetext]="translations.forms.labeledValue(endLabel(), controlValue().end)"
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnRangeSlider extends KrnValueAccessor<KrnRangeValue> {
  private readonly platform = inject(KRN_PLATFORM);
  protected readonly translations = inject(KRN_TRANSLATIONS);
  readonly id = input('');
  readonly label = input(this.translations.forms.range);
  readonly startLabel = input(this.translations.forms.minimumValue);
  readonly endLabel = input(this.translations.forms.maximumValue);
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
  protected readonly activeThumb = signal<'start' | 'end'>('end');
  protected readonly draggingThumb = signal<'start' | 'end' | null>(null);
  private activePointerId: number | null = null;

  protected readonly a11y = useKrnControlA11y(this, this.id, this.invalid, 'range-slider', {
    disabled: this.disabled,
    readOnly: this.readOnly,
  });
  protected readonly isDisabled = computed(() => this.a11y.disabled() || this.formDisabled());
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
    this.watchValidationInputs(this.min, this.max);
  }

  protected override normalizeIncomingValue(value: unknown): KrnRangeValue {
    if (typeof value !== 'object' || value === null || !('start' in value) || !('end' in value)) {
      return { start: this.min(), end: this.max() };
    }
    const start = Number(value.start);
    const end = Number(value.end);
    return this.normalizeRange(start, end);
  }

  protected override validateValue(value: unknown) {
    if (typeof value !== 'object' || value === null || !('start' in value) || !('end' in value)) {
      return { range: true };
    }
    const start = Number(value.start);
    const end = Number(value.end);
    return mergeValidationErrors(
      Number.isFinite(start) ? minError(start, this.min()) : { range: true },
      Number.isFinite(end) ? maxError(end, this.max()) : { range: true },
      Number.isFinite(start) && Number.isFinite(end) && start > end ? { rangeOrder: true } : null,
    );
  }

  protected updateStart(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (this.a11y.readOnly()) {
      input.value = `${this.controlValue().start}`;
      return;
    }
    const current = this.controlValue();
    const start = Math.min(this.clamp(input.valueAsNumber), current.end);
    this.emitRange({ start, end: current.end });
  }

  protected updateEnd(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (this.a11y.readOnly()) {
      input.value = `${this.controlValue().end}`;
      return;
    }
    const current = this.controlValue();
    const end = Math.max(this.clamp(input.valueAsNumber), current.start);
    this.emitRange({ start: current.start, end });
  }

  protected beginPointerInteraction(event: PointerEvent): void {
    const host = event.currentTarget;
    if (!krnIsHtmlElement(this.platform, host) || this.isDisabled() || this.a11y.readOnly()) {
      return;
    }

    event.preventDefault();
    const value = this.valueFromPointer(event, host);
    const current = this.controlValue();
    const explicitThumb = krnIsHtmlElement(this.platform, event.target)
      ? event.target.closest('.krn-range--start')
        ? 'start'
        : event.target.closest('.krn-range--end')
          ? 'end'
          : null
      : null;
    const thumb = explicitThumb ?? this.nearestThumb(value, current);
    const pointerId = Number.isFinite(event.pointerId) ? event.pointerId : 1;

    this.activeThumb.set(thumb);
    this.draggingThumb.set(thumb);
    this.activePointerId = pointerId;
    try {
      host.setPointerCapture?.(pointerId);
    } catch {
      // Synthetic pointer events and older browsers may not expose an active pointer capture.
    }
    this.updateThumbFromPointer(thumb, value);
    host
      .querySelector<HTMLInputElement>(thumb === 'start' ? '.krn-range--start' : '.krn-range--end')
      ?.focus();
  }

  protected continuePointerInteraction(event: PointerEvent): void {
    const host = event.currentTarget;
    const thumb = this.draggingThumb();
    const pointerId = Number.isFinite(event.pointerId) ? event.pointerId : 1;
    if (
      !krnIsHtmlElement(this.platform, host) ||
      thumb === null ||
      this.activePointerId !== pointerId
    ) {
      return;
    }
    event.preventDefault();
    this.updateThumbFromPointer(thumb, this.valueFromPointer(event, host));
  }

  protected finishPointerInteraction(event: PointerEvent): void {
    const host = event.currentTarget;
    const pointerId = Number.isFinite(event.pointerId) ? event.pointerId : 1;
    if (
      !krnIsHtmlElement(this.platform, host) ||
      this.activePointerId === null ||
      this.activePointerId !== pointerId
    ) {
      return;
    }
    try {
      host.releasePointerCapture?.(pointerId);
    } catch {
      // The pointer may already have been released by the browser.
    }
    this.activePointerId = null;
    this.draggingThumb.set(null);
    this.touch();
  }

  private nearestThumb(value: number, current: KrnRangeValue): 'start' | 'end' {
    const startDistance = Math.abs(value - current.start);
    const endDistance = Math.abs(value - current.end);
    return startDistance === endDistance
      ? this.activeThumb()
      : startDistance < endDistance
        ? 'start'
        : 'end';
  }

  private updateThumbFromPointer(thumb: 'start' | 'end', value: number): void {
    const current = this.controlValue();
    if (thumb === 'start') {
      this.emitRange({ start: Math.min(value, current.end), end: current.end });
    } else {
      this.emitRange({ start: current.start, end: Math.max(value, current.start) });
    }
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
