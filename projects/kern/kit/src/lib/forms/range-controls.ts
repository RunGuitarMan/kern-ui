import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  type ElementRef,
  effect,
  inject,
  input,
  numberAttribute,
  output,
  signal,
  viewChild,
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

const sliderInteractionKeys = new Set([
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'End',
  'Home',
  'PageDown',
  'PageUp',
]);

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
        #input
        class="krn-range"
        type="range"
        [attr.aria-describedby]="a11y.describedBy()"
        [attr.aria-invalid]="a11y.invalid()"
        [attr.aria-label]="effectiveLabelledBy() ? null : ariaLabel()"
        [attr.aria-labelledby]="effectiveLabelledBy()"
        [attr.aria-readonly]="a11y.readOnly()"
        [attr.aria-valuetext]="formattedValue()"
        [attr.data-krn-form-field-control]="a11y.isFormFieldControl() ? '' : null"
        [attr.name]="name() || null"
        [disabled]="isDisabled()"
        [id]="a11y.id()"
        [max]="effectiveMax()"
        [min]="effectiveMin()"
        [step]="effectiveStep()"
        [tabIndex]="isDisabled() ? -1 : tabIndex()"
        [value]="controlValue()"
        (blur)="touch()"
        (input)="updateValue($event)"
        (keydown)="protectReadOnlyKeyboard($event)"
        (pointerdown)="protectReadOnlyPointer($event)"
      />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnSlider extends KrnValueAccessor<number> {
  private readonly translations = inject(KRN_TRANSLATIONS);
  private readonly inputElement = viewChild<ElementRef<HTMLInputElement>>('input');
  readonly id = input('');
  readonly name = input('');
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
  readonly tabIndex = input(0, { alias: 'tabindex', transform: numberAttribute });
  readonly value = input<number | undefined>(undefined);
  readonly valueFormatter = input<((value: number) => string) | undefined>(undefined);
  readonly valueChange = output<number>();

  protected readonly a11y = useKrnControlA11y(this, this.id, this.invalid, 'slider', {
    disabled: this.disabled,
    readOnly: this.readOnly,
  });
  protected readonly isDisabled = computed(() => this.a11y.disabled() || this.formDisabled());
  protected readonly effectiveMin = computed(() => (Number.isFinite(this.min()) ? this.min() : 0));
  protected readonly effectiveMax = computed(() => {
    const min = this.effectiveMin();
    const max = this.max();
    return Number.isFinite(max) && max >= min ? max : min;
  });
  protected readonly effectiveStep = computed(() => {
    const step = this.step();
    return Number.isFinite(step) && step > 0 ? step : 1;
  });
  protected readonly labelId = computed(() => `${this.a11y.id()}-label`);
  protected readonly effectiveLabelledBy = computed(() => {
    const ids = [this.a11y.labelledBy(), this.label() ? this.labelId() : null].filter(
      (id): id is string => Boolean(id),
    );
    return ids.length > 0 ? [...new Set(ids)].join(' ') : null;
  });
  protected readonly formattedValue = computed(
    () => this.valueFormatter()?.(this.controlValue()) ?? `${this.controlValue()}`,
  );
  protected readonly valuePercent = computed(() => {
    const span = this.effectiveMax() - this.effectiveMin();
    if (span <= 0) {
      return 0;
    }
    const percent = ((this.controlValue() - this.effectiveMin()) / span) * 100;
    return Math.min(100, Math.max(0, percent));
  });

  constructor() {
    super(0);
    this.bindStandaloneValue(this.value);
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
    return Number.isFinite(numeric) ? this.clamp(numeric) : this.effectiveMin();
  }

  protected override validateValue(value: unknown) {
    return mergeValidationErrors(
      minError(value, this.effectiveMin()),
      maxError(value, this.effectiveMax()),
    );
  }

  protected updateValue(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (this.a11y.readOnly()) {
      input.value = `${this.controlValue()}`;
      return;
    }
    const value = this.clamp(input.valueAsNumber);
    input.value = `${value}`;
    if (this.commitUserValue(value)) {
      this.valueChange.emit(value);
    }
  }

  protected protectReadOnlyKeyboard(event: KeyboardEvent): void {
    if (this.a11y.readOnly() && sliderInteractionKeys.has(event.key)) {
      event.preventDefault();
    }
  }

  protected protectReadOnlyPointer(event: PointerEvent): void {
    if (!this.a11y.readOnly() || event.button !== 0) {
      return;
    }
    event.preventDefault();
    this.inputElement()?.nativeElement.focus({ preventScroll: true });
  }

  focus(options?: FocusOptions): void {
    this.inputElement()?.nativeElement.focus(options);
  }

  blur(): void {
    this.inputElement()?.nativeElement.blur();
  }

  private clamp(value: number): number {
    const finiteValue = Number.isFinite(value) ? value : this.effectiveMin();
    return Math.min(this.effectiveMax(), Math.max(this.effectiveMin(), finiteValue));
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
      [attr.aria-label]="a11y.labelledBy() ? null : label()"
      [attr.aria-labelledby]="a11y.labelledBy()"
      [attr.data-krn-form-field-control]="a11y.isFormFieldControl() ? '' : null"
      [id]="a11y.id()"
      [style.--krn-range-end]="endPercent() + '%'"
      [style.--krn-range-start]="startPercent() + '%'"
      (focusout)="handleFocusOut($event)"
    >
      <div class="krn-slider__header">
        @if (!a11y.labelledBy()) {
          <span>{{ label() }}</span>
        }
        <output>{{ formattedStart() }} – {{ formattedEnd() }}</output>
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
          #startInput
          class="krn-range krn-range--overlay krn-range--start"
          type="range"
          [attr.aria-label]="startLabel()"
          [attr.aria-readonly]="a11y.readOnly()"
          [attr.aria-valuetext]="formattedStart()"
          [disabled]="isDisabled()"
          [max]="effectiveMax()"
          [min]="effectiveMin()"
          [step]="effectiveStep()"
          [tabIndex]="isDisabled() ? -1 : tabIndex()"
          [value]="controlValue().start"
          (focus)="activeThumb.set('start')"
          (input)="updateStart($event)"
          (keydown)="protectReadOnlyKeyboard($event)"
          (pointerdown)="activeThumb.set('start')"
        />
        <input
          #endInput
          class="krn-range krn-range--overlay krn-range--end"
          type="range"
          [attr.aria-label]="endLabel()"
          [attr.aria-readonly]="a11y.readOnly()"
          [attr.aria-valuetext]="formattedEnd()"
          [disabled]="isDisabled()"
          [max]="effectiveMax()"
          [min]="effectiveMin()"
          [step]="effectiveStep()"
          [tabIndex]="isDisabled() ? -1 : tabIndex()"
          [value]="controlValue().end"
          (focus)="activeThumb.set('end')"
          (input)="updateEnd($event)"
          (keydown)="protectReadOnlyKeyboard($event)"
          (pointerdown)="activeThumb.set('end')"
        />
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnRangeSlider extends KrnValueAccessor<KrnRangeValue> {
  private readonly platform = inject(KRN_PLATFORM);
  private readonly startInput = viewChild<ElementRef<HTMLInputElement>>('startInput');
  private readonly endInput = viewChild<ElementRef<HTMLInputElement>>('endInput');
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
  readonly tabIndex = input(0, { alias: 'tabindex', transform: numberAttribute });
  readonly value = input<KrnRangeValue | undefined>(undefined);
  readonly valueFormatter = input<((value: number) => string) | undefined>(undefined);
  readonly valueChange = output<KrnRangeValue>();
  protected readonly activeThumb = signal<'start' | 'end'>('end');
  protected readonly draggingThumb = signal<'start' | 'end' | null>(null);
  private activePointerId: number | null = null;

  protected readonly a11y = useKrnControlA11y(this, this.id, this.invalid, 'range-slider', {
    disabled: this.disabled,
    labelStrategy: 'group',
    readOnly: this.readOnly,
  });
  protected readonly isDisabled = computed(() => this.a11y.disabled() || this.formDisabled());
  protected readonly effectiveMin = computed(() => (Number.isFinite(this.min()) ? this.min() : 0));
  protected readonly effectiveMax = computed(() => {
    const min = this.effectiveMin();
    const max = this.max();
    return Number.isFinite(max) && max >= min ? max : min;
  });
  protected readonly effectiveStep = computed(() => {
    const step = this.step();
    return Number.isFinite(step) && step > 0 ? step : 1;
  });
  protected readonly formattedStart = computed(
    () => this.valueFormatter()?.(this.controlValue().start) ?? `${this.controlValue().start}`,
  );
  protected readonly formattedEnd = computed(
    () => this.valueFormatter()?.(this.controlValue().end) ?? `${this.controlValue().end}`,
  );
  protected readonly startPercent = computed(() => this.toPercent(this.controlValue().start));
  protected readonly endPercent = computed(() => this.toPercent(this.controlValue().end));

  constructor() {
    super({ start: 0, end: 100 });
    this.bindStandaloneValue(this.value);
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
      return { start: this.effectiveMin(), end: this.effectiveMax() };
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
      Number.isFinite(start) ? minError(start, this.effectiveMin()) : { range: true },
      Number.isFinite(end) ? maxError(end, this.effectiveMax()) : { range: true },
      Number.isFinite(start) && Number.isFinite(end) && start > end ? { rangeOrder: true } : null,
    );
  }

  protected override valuesEqual(current: KrnRangeValue, next: KrnRangeValue): boolean {
    return current.start === next.start && current.end === next.end;
  }

  protected updateStart(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (this.a11y.readOnly()) {
      input.value = `${this.controlValue().start}`;
      return;
    }
    const current = this.controlValue();
    const start = Math.min(this.clamp(input.valueAsNumber), current.end);
    input.value = `${start}`;
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
    input.value = `${end}`;
    this.emitRange({ start: current.start, end });
  }

  protected beginPointerInteraction(event: PointerEvent): void {
    const host = event.currentTarget;
    if (!krnIsHtmlElement(this.platform, host) || this.isDisabled() || event.button !== 0) {
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
    host
      .querySelector<HTMLInputElement>(thumb === 'start' ? '.krn-range--start' : '.krn-range--end')
      ?.focus({ preventScroll: true });
    if (this.a11y.readOnly()) {
      return;
    }
    this.draggingThumb.set(thumb);
    this.activePointerId = pointerId;
    try {
      host.setPointerCapture?.(pointerId);
    } catch {
      // Synthetic pointer events and older browsers may not expose an active pointer capture.
    }
    this.updateThumbFromPointer(thumb, value);
  }

  protected continuePointerInteraction(event: PointerEvent): void {
    const host = event.currentTarget;
    const thumb = this.draggingThumb();
    const pointerId = Number.isFinite(event.pointerId) ? event.pointerId : 1;
    if (
      !krnIsHtmlElement(this.platform, host) ||
      thumb === null ||
      this.activePointerId !== pointerId ||
      this.isDisabled() ||
      this.a11y.readOnly()
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
  }

  protected protectReadOnlyKeyboard(event: KeyboardEvent): void {
    if (this.a11y.readOnly() && sliderInteractionKeys.has(event.key)) {
      event.preventDefault();
    }
  }

  protected handleFocusOut(event: FocusEvent): void {
    const group = event.currentTarget;
    if (
      krnIsHtmlElement(this.platform, group) &&
      krnIsHtmlElement(this.platform, event.relatedTarget) &&
      group.contains(event.relatedTarget)
    ) {
      return;
    }
    this.touch();
  }

  focus(options?: FocusOptions): void {
    this.thumbInput(this.activeThumb())?.focus(options);
  }

  blur(): void {
    this.startInput()?.nativeElement.blur();
    this.endInput()?.nativeElement.blur();
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
    if (this.commitUserValue(value)) {
      this.valueChange.emit(value);
    }
  }

  private normalizeRange(start: number, end: number): KrnRangeValue {
    const safeStart = Number.isFinite(start) ? this.clamp(start) : this.effectiveMin();
    const safeEnd = Number.isFinite(end) ? this.clamp(end) : this.effectiveMax();
    return safeStart <= safeEnd
      ? { start: safeStart, end: safeEnd }
      : { start: safeEnd, end: safeStart };
  }

  private clamp(value: number): number {
    const finiteValue = Number.isFinite(value) ? value : this.effectiveMin();
    return Math.min(this.effectiveMax(), Math.max(this.effectiveMin(), finiteValue));
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
    const min = this.effectiveMin();
    const rawValue = min + ratio * (this.effectiveMax() - min);
    const step = this.effectiveStep();
    const snapped = min + Math.round((rawValue - min) / step) * step;
    const precision = Math.min(
      12,
      Math.max(
        this.fractionDigits(min),
        this.fractionDigits(this.effectiveMax()),
        this.fractionDigits(step),
      ),
    );
    return this.clamp(Number(snapped.toFixed(precision)));
  }

  private fractionDigits(value: number): number {
    const [coefficient = '', exponent = '0'] = value.toString().toLowerCase().split('e');
    const fraction = coefficient.split('.')[1];
    return Math.max(0, (fraction?.length ?? 0) - Number(exponent));
  }

  private toPercent(value: number): number {
    const span = this.effectiveMax() - this.effectiveMin();
    if (span <= 0) {
      return 0;
    }
    const percent = ((value - this.effectiveMin()) / span) * 100;
    return Math.min(100, Math.max(0, percent));
  }

  private thumbInput(thumb: 'start' | 'end'): HTMLInputElement | undefined {
    return (thumb === 'start' ? this.startInput() : this.endInput())?.nativeElement;
  }
}
