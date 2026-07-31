import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  model,
  numberAttribute,
  output,
  signal,
  type ElementRef,
  untracked,
  viewChild,
  viewChildren,
} from '@angular/core';
import {
  addMonths,
  calendarDays,
  canMoveCalendarMonth,
  clampCalendarMonth,
  clampDate,
  clampWeekStartsOn,
  dateForCalendarKey,
  dateIsDisabled,
  formatDate,
  formatFullDate,
  formatMonth,
  initialCalendarMonth,
  isIsoDate,
  parseIsoDate,
  startOfMonth,
  toIsoDate,
  weekdayLabels,
  type KrnCalendarDay,
} from './calendar-engine';
import { KRN_PLATFORM } from '@kern-ui/angular/cdk';
import { KRN_LOCALE, KRN_TRANSLATIONS } from '@kern-ui/angular/core';
import type { KrnColorPickerTranslations, KrnTimePickerTranslations } from '@kern-ui/angular/core';
import type { KrnDatePickerLabels, KrnDateRangeValue } from './form-types';
import {
  KrnValueAccessor,
  mergeValidationErrors,
  provideKrnFormControl,
  requiredError,
  useKrnControlA11y,
} from './value-accessor';

interface KrnHslColor {
  readonly hue: number;
  readonly lightness: number;
  readonly saturation: number;
}

const DEFAULT_COLOR = '#4666da';

const pad = (value: number): string => `${value}`.padStart(2, '0');

const groupCalendarRows = (
  days: readonly KrnCalendarDay[],
): readonly (readonly KrnCalendarDay[])[] =>
  Array.from({ length: Math.ceil(days.length / 7) }, (_, index) =>
    days.slice(index * 7, index * 7 + 7),
  );

const isTime = (value: unknown): value is string =>
  typeof value === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(value);

const closeWhenFocusLeaves = (event: FocusEvent, close: () => void): void => {
  const current = event.currentTarget;
  const next = event.relatedTarget;
  const ownerDocument =
    current && 'ownerDocument' in current ? (current as Node).ownerDocument : null;
  const NodeConstructor = ownerDocument?.defaultView?.Node;
  if (
    NodeConstructor &&
    current instanceof NodeConstructor &&
    next instanceof NodeConstructor &&
    current.contains(next)
  ) {
    return;
  }
  close();
};

const consumeOpenEscape = (event: Event, open: boolean, close: () => void): void => {
  if (!open || event.defaultPrevented) return;
  event.preventDefault();
  event.stopPropagation();
  close();
};

const mergeAriaIds = (...values: readonly (string | null | undefined)[]): string | null => {
  const ids = values.flatMap((value) => value?.split(/\s+/).filter(Boolean) ?? []);
  return ids.length > 0 ? [...new Set(ids)].join(' ') : null;
};

const positionPickerPopover = (
  trigger: HTMLButtonElement,
  panel: HTMLElement,
  preferredWidth: number,
  preferredHeight: number,
): void => {
  const view = trigger.ownerDocument.defaultView;
  if (!view) {
    return;
  }

  const viewportMargin = 16;
  const triggerGap = 8;
  const triggerRect = trigger.getBoundingClientRect();
  const panelWidth = Math.min(preferredWidth, Math.max(0, view.innerWidth - viewportMargin * 2));
  const preferredLeft =
    view.getComputedStyle(trigger).direction === 'rtl'
      ? triggerRect.right - panelWidth
      : triggerRect.left;
  const maximumLeft = Math.max(viewportMargin, view.innerWidth - panelWidth - viewportMargin);
  const left = Math.min(Math.max(preferredLeft, viewportMargin), maximumLeft);
  const spaceBelow = Math.max(
    0,
    view.innerHeight - triggerRect.bottom - triggerGap - viewportMargin,
  );
  const spaceAbove = Math.max(0, triggerRect.top - triggerGap - viewportMargin);
  const comfortableHeight = Math.min(preferredHeight, 288);
  const placeBelow = spaceBelow >= comfortableHeight || spaceBelow >= spaceAbove;
  const availableHeight = placeBelow ? spaceBelow : spaceAbove;

  panel.style.inset = 'auto';
  panel.style.left = `${left}px`;
  panel.style.maxHeight = `${availableHeight}px`;
  if (placeBelow) {
    panel.style.top = `${triggerRect.bottom + triggerGap}px`;
    panel.style.bottom = 'auto';
  } else {
    panel.style.top = 'auto';
    panel.style.bottom = `${view.innerHeight - triggerRect.top + triggerGap}px`;
  }
  panel.dataset['placement'] = placeBelow ? 'bottom' : 'top';
};

const connectPickerPopover = (
  trigger: HTMLButtonElement,
  panel: HTMLElement,
  preferredWidth: number,
  preferredHeight: number,
  registerCleanup: (cleanup: () => void) => void,
): void => {
  const view = trigger.ownerDocument.defaultView;
  const reposition = (): void =>
    positionPickerPopover(trigger, panel, preferredWidth, preferredHeight);

  reposition();
  if (typeof panel.showPopover === 'function' && !panel.matches(':popover-open')) {
    panel.showPopover();
  }

  if (!view) {
    return;
  }

  view.addEventListener('resize', reposition, { passive: true });
  view.addEventListener('scroll', reposition, { capture: true, passive: true });
  registerCleanup(() => {
    view.removeEventListener('resize', reposition);
    view.removeEventListener('scroll', reposition, true);
  });
};

@Component({
  selector: 'krn-date-picker',
  host: {
    class: 'krn-picker-host',
    '[attr.id]': 'null',
  },
  providers: [...provideKrnFormControl(() => KrnDatePicker)],
  template: `
    <div
      class="krn-picker"
      (focusout)="closeOnFocusOut($event)"
      (keydown.escape)="onEscape($event)"
    >
      <span
        class="krn-control-shell"
        [attr.data-disabled]="isDisabled()"
        [attr.data-invalid]="a11y.invalid()"
        [attr.data-readonly]="a11y.readOnly()"
      >
        <button
          #trigger
          class="krn-picker__trigger"
          type="button"
          [attr.aria-controls]="calendarId()"
          [attr.aria-describedby]="effectiveDescribedBy()"
          [attr.aria-expanded]="open()"
          [attr.aria-haspopup]="'dialog'"
          [attr.aria-invalid]="a11y.invalid()"
          [attr.aria-label]="effectiveLabelledBy() ? null : pickerAriaLabel()"
          [attr.aria-labelledby]="effectiveLabelledBy()"
          [attr.aria-required]="a11y.required()"
          [attr.data-krn-form-field-control]="a11y.isFormFieldControl() ? '' : null"
          [disabled]="isDisabled()"
          [id]="a11y.id()"
          [tabIndex]="isDisabled() ? -1 : tabIndex()"
          (click)="toggleOpen()"
        >
          @if (controlValue()) {
            <span class="krn-picker__value">{{ formattedValue() }}</span>
          } @else {
            <span class="krn-picker__placeholder">{{ copy().selectDate }}</span>
          }
          <span class="krn-picker__calendar-icon" aria-hidden="true"></span>
        </button>
      </span>

      @if (open()) {
        <div
          #panel
          class="krn-picker__panel krn-calendar-panel"
          popover="manual"
          role="dialog"
          [attr.aria-label]="pickerAriaLabel()"
          [id]="calendarId()"
        >
          <div class="krn-calendar__header">
            <strong aria-live="polite">{{ monthLabel() }}</strong>
            <span class="krn-calendar__navigation">
              <button
                type="button"
                [attr.aria-label]="copy().previousMonth"
                [disabled]="!canMoveMonth(-1)"
                (click)="moveMonth(-1)"
              >
                ‹
              </button>
              <button
                type="button"
                [attr.aria-label]="copy().nextMonth"
                [disabled]="!canMoveMonth(1)"
                (click)="moveMonth(1)"
              >
                ›
              </button>
            </span>
          </div>

          <div class="krn-calendar" role="grid" [attr.aria-label]="monthLabel()">
            <div class="krn-calendar__weekdays" role="row">
              @for (weekday of weekdays(); track $index) {
                <span class="krn-calendar__weekday" role="columnheader">{{ weekday }}</span>
              }
            </div>
            <div class="krn-calendar__weeks" role="rowgroup">
              @for (week of calendarRows(); track $index) {
                <div class="krn-calendar__week" role="row">
                  @for (day of week; track day.iso) {
                    <button
                      #dayButton
                      class="krn-calendar__day"
                      type="button"
                      role="gridcell"
                      [attr.aria-current]="day.today ? 'date' : null"
                      [attr.aria-label]="dayLabel(day)"
                      [attr.aria-selected]="controlValue() === day.iso"
                      [attr.data-outside]="day.outside"
                      [attr.data-selected]="controlValue() === day.iso"
                      [attr.data-today]="day.today"
                      [attr.data-date]="day.iso"
                      [attr.tabindex]="focusedDate() === day.iso ? 0 : -1"
                      [disabled]="day.disabled"
                      (focus)="focusedDate.set(day.iso)"
                      (keydown)="handleCalendarKeydown($event, day)"
                      (click)="selectDate(day.iso)"
                    >
                      {{ day.day }}
                    </button>
                  }
                </div>
              }
            </div>
          </div>

          <div class="krn-picker__footer">
            <button type="button" [disabled]="!controlValue()" (click)="clear()">
              {{ copy().clear }}
            </button>
            <button type="button" [disabled]="todayDisabled()" (click)="selectDate(today())">
              {{ copy().today }}
            </button>
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnDatePicker extends KrnValueAccessor<string> {
  private readonly platform = inject(KRN_PLATFORM);
  private readonly translations = inject(KRN_TRANSLATIONS);
  readonly id = input('');
  readonly ariaLabel = input('');
  readonly ariaLabelledBy = input('');
  readonly ariaDescribedBy = input('');
  readonly locale = input(inject(KRN_LOCALE));
  readonly today = input(toIsoDate(new Date(this.platform.now())));
  readonly weekStartsOn = input(0, { transform: clampWeekStartsOn });
  readonly labels = input<Partial<KrnDatePickerLabels>>({});
  readonly min = input('');
  readonly max = input('');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, {
    alias: 'readonly',
    transform: booleanAttribute,
  });
  readonly required = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly tabIndex = input(0, { alias: 'tabindex', transform: numberAttribute });
  readonly value = input<string | undefined>(undefined);
  readonly open = model(false);
  readonly valueChange = output<string>();
  protected readonly visibleMonth = signal(initialCalendarMonth('', new Date(this.platform.now())));
  protected readonly focusedDate = signal(this.today());
  protected readonly copy = computed(() => ({
    ...this.translations.datePicker,
    ...this.labels(),
  }));
  protected readonly pickerAriaLabel = computed(() => this.ariaLabel() || this.copy().chooseDate);
  protected readonly weekdays = computed(() => weekdayLabels(this.locale(), this.weekStartsOn()));
  protected readonly a11y = useKrnControlA11y(this, this.id, this.invalid, 'date', {
    disabled: this.disabled,
    readOnly: this.readOnly,
    required: this.required,
  });
  protected readonly isDisabled = computed(() => this.a11y.disabled() || this.formDisabled());
  protected readonly effectiveLabelledBy = computed(() =>
    mergeAriaIds(this.ariaLabelledBy(), this.a11y.labelledBy()),
  );
  protected readonly effectiveDescribedBy = computed(() =>
    mergeAriaIds(this.ariaDescribedBy(), this.a11y.describedBy()),
  );
  protected readonly calendarId = computed(() => `${this.a11y.id()}-calendar`);
  protected readonly days = computed(() =>
    calendarDays(this.visibleMonth(), this.min(), this.max(), this.weekStartsOn(), this.today()),
  );
  protected readonly calendarRows = computed(() => groupCalendarRows(this.days()));
  protected readonly monthLabel = computed(() => formatMonth(this.visibleMonth(), this.locale()));
  protected readonly formattedValue = computed(() =>
    formatDate(this.controlValue(), this.locale()),
  );
  protected readonly todayDisabled = computed(() =>
    dateIsDisabled(this.today(), this.min(), this.max()),
  );
  private readonly trigger = viewChild<ElementRef<HTMLButtonElement>>('trigger');
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  private readonly dayButtons = viewChildren<ElementRef<HTMLButtonElement>>('dayButton');
  private focusGeneration = 0;
  private lastObservedOpen = this.open();
  private readonly initializeControlledOpen = effect(() => {
    const value = this.controlValue();
    const open = this.open();
    this.today();
    this.min();
    this.max();
    if (open !== this.lastObservedOpen) {
      this.lastObservedOpen = open;
      this.focusGeneration += 1;
    }
    if (open) {
      untracked(() => this.prepareOpen(value));
    }
  });
  private readonly syncPanel = effect((onCleanup) => {
    if (!this.open()) {
      return;
    }
    const trigger = this.trigger()?.nativeElement;
    const panel = this.panel()?.nativeElement;
    if (trigger && panel) {
      connectPickerPopover(trigger, panel, 336, 392, onCleanup);
    }
  });
  private readonly syncFocusedDay = effect(() => {
    if (!this.open()) {
      return;
    }
    const iso = this.focusedDate();
    const buttons = this.dayButtons();
    const generation = this.focusGeneration;
    this.platform.queueMicrotask(() => {
      if (this.open() && this.focusGeneration === generation && this.focusedDate() === iso) {
        this.focusDayButton(iso, buttons);
      }
    });
  });
  private readonly closeWhenBlocked = effect(() => {
    const disabled = this.isDisabled();
    const readOnly = this.a11y.readOnly();
    if (!this.open() || (!disabled && !readOnly)) {
      return;
    }
    const generation = this.setOpen(false);
    if (!disabled) {
      this.restoreTriggerFocus(generation);
    }
  });

  constructor() {
    super('');
    this.bindStandaloneValue(this.value);
    this.watchValidationInputs(this.required, this.a11y.required, this.min, this.max);
  }

  override writeValue(value: unknown): void {
    super.writeValue(value);
    const parsed = parseIsoDate(this.controlValue());
    if (parsed) {
      this.visibleMonth.set(startOfMonth(parsed));
    }
  }

  protected override normalizeIncomingValue(value: unknown): string {
    return isIsoDate(value) ? value : '';
  }

  protected override validateValue(value: unknown) {
    const parsed =
      value === '' || value === null || value === undefined ? null : parseIsoDate(value);
    return mergeValidationErrors(
      requiredError(value, this.a11y.required()),
      value && !parsed ? { date: true } : null,
      parsed && this.min() && toIsoDate(parsed) < this.min()
        ? { minDate: { min: this.min(), actual: value } }
        : null,
      parsed && this.max() && toIsoDate(parsed) > this.max()
        ? { maxDate: { max: this.max(), actual: value } }
        : null,
    );
  }

  protected toggleOpen(): void {
    if (this.isDisabled() || this.a11y.readOnly()) {
      return;
    }
    const next = !this.open();
    this.setOpen(next);
  }

  protected close(restoreFocus = true): void {
    const generation = this.setOpen(false);
    if (restoreFocus) {
      this.restoreTriggerFocus(generation);
    }
  }

  protected onEscape(event: Event): void {
    consumeOpenEscape(event, this.open(), () => this.close());
  }

  protected closeOnFocusOut(event: FocusEvent): void {
    closeWhenFocusLeaves(event, () => {
      this.touch();
      this.close(false);
    });
  }

  protected moveMonth(amount: number): void {
    if (!this.isDisabled() && !this.a11y.readOnly() && this.canMoveMonth(amount)) {
      this.visibleMonth.set(addMonths(this.visibleMonth(), amount));
    }
  }

  protected canMoveMonth(amount: number): boolean {
    return canMoveCalendarMonth(this.visibleMonth(), amount, this.min(), this.max());
  }

  protected dayLabel(day: KrnCalendarDay): string {
    return formatFullDate(day.date, this.locale());
  }

  protected selectDate(value: string): void {
    if (
      this.isDisabled() ||
      this.a11y.readOnly() ||
      dateIsDisabled(value, this.min(), this.max())
    ) {
      return;
    }
    if (this.commitUserValue(value)) {
      this.valueChange.emit(value);
    }
    this.close(true);
  }

  protected clear(): void {
    if (this.isDisabled() || this.a11y.readOnly()) {
      return;
    }
    if (this.commitUserValue('')) {
      this.valueChange.emit('');
    }
    this.close(true);
  }

  protected handleCalendarKeydown(event: KeyboardEvent, day: KrnCalendarDay): void {
    if (this.isDisabled() || this.a11y.readOnly()) {
      return;
    }
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.selectDate(day.iso);
      return;
    }
    const next = dateForCalendarKey(day.date, event.key, event.shiftKey, this.weekStartsOn());
    if (!next) {
      return;
    }
    event.preventDefault();
    this.focusDate(clampDate(next, this.min(), this.max()));
  }

  focus(options?: FocusOptions): void {
    this.trigger()?.nativeElement.focus(options);
  }

  blur(): void {
    const trigger = this.trigger()?.nativeElement;
    const panel = this.panel()?.nativeElement;
    const active = trigger?.ownerDocument.activeElement;
    if (active === trigger || (active && panel?.contains(active))) {
      (active as HTMLElement).blur();
    }
  }

  private prepareOpen(value = this.controlValue()): void {
    const referenceDate = parseIsoDate(this.today()) ?? new Date(this.platform.now());
    this.visibleMonth.set(
      clampCalendarMonth(initialCalendarMonth(value, referenceDate), this.min(), this.max()),
    );
    this.focusedDate.set(this.initialFocusDate(value));
  }

  private setOpen(open: boolean): number {
    if (this.open() !== open) {
      this.focusGeneration += 1;
      this.lastObservedOpen = open;
      this.open.set(open);
    }
    return this.focusGeneration;
  }

  private restoreTriggerFocus(generation: number): void {
    this.platform.queueMicrotask(() => {
      if (!this.open() && this.focusGeneration === generation) {
        this.trigger()?.nativeElement.focus();
      }
    });
  }

  private initialFocusDate(value = this.controlValue()): string {
    const preferred = value || this.today();
    if (!dateIsDisabled(preferred, this.min(), this.max())) {
      return preferred;
    }
    return this.days().find((day) => !day.disabled)?.iso ?? preferred;
  }

  private focusDate(date: Date): void {
    const iso = toIsoDate(date);
    this.focusedDate.set(iso);
    this.visibleMonth.set(startOfMonth(date));
  }

  private focusDayButton(iso: string, buttons = this.dayButtons()): void {
    buttons.find((button) => button.nativeElement.dataset['date'] === iso)?.nativeElement.focus();
  }
}

@Component({
  selector: 'krn-date-range-picker',
  host: {
    class: 'krn-picker-host',
    '[attr.id]': 'null',
  },
  providers: [...provideKrnFormControl(() => KrnDateRangePicker)],
  template: `
    <div
      class="krn-picker"
      (focusout)="closeOnFocusOut($event)"
      (keydown.escape)="onEscape($event)"
    >
      <span
        class="krn-control-shell"
        [attr.data-disabled]="isDisabled()"
        [attr.data-invalid]="a11y.invalid()"
        [attr.data-readonly]="a11y.readOnly()"
      >
        <button
          #trigger
          class="krn-picker__trigger"
          type="button"
          [attr.aria-controls]="calendarId()"
          [attr.aria-describedby]="a11y.describedBy()"
          [attr.aria-expanded]="open()"
          [attr.aria-haspopup]="'dialog'"
          [attr.aria-invalid]="a11y.invalid()"
          [attr.aria-label]="a11y.labelledBy() ? null : pickerAriaLabel()"
          [attr.aria-labelledby]="a11y.labelledBy()"
          [attr.aria-required]="a11y.required()"
          [attr.data-krn-form-field-control]="a11y.isFormFieldControl() ? '' : null"
          [disabled]="isDisabled()"
          [id]="a11y.id()"
          (blur)="touch()"
          (click)="toggleOpen()"
        >
          @if (controlValue().start) {
            <span class="krn-date-range__value">
              <span>{{ formattedStart() }}</span>
              <span class="krn-date-range__separator" aria-hidden="true">→</span>
              <span [attr.data-placeholder]="!controlValue().end">
                {{ formattedEnd() || copy().endDate }}
              </span>
            </span>
          } @else {
            <span class="krn-picker__placeholder">{{ copy().selectDateRange }}</span>
          }
          <span class="krn-picker__calendar-icon" aria-hidden="true"></span>
        </button>
      </span>

      @if (open()) {
        <div
          #panel
          class="krn-picker__panel krn-calendar-panel krn-calendar-panel--range"
          popover="manual"
          role="dialog"
          [attr.aria-label]="pickerAriaLabel()"
          [id]="calendarId()"
        >
          <div class="krn-calendar__header">
            <span>
              <strong aria-live="polite">{{ monthLabel() }}</strong>
              <small>{{ selectionPrompt() }}</small>
            </span>
            <span class="krn-calendar__navigation">
              <button
                type="button"
                [attr.aria-label]="copy().previousMonth"
                [disabled]="!canMoveMonth(-1)"
                (click)="moveMonth(-1)"
              >
                ‹
              </button>
              <button
                type="button"
                [attr.aria-label]="copy().nextMonth"
                [disabled]="!canMoveMonth(1)"
                (click)="moveMonth(1)"
              >
                ›
              </button>
            </span>
          </div>

          <div class="krn-calendar" role="grid" [attr.aria-label]="monthLabel()">
            <div class="krn-calendar__weekdays" role="row">
              @for (weekday of weekdays(); track $index) {
                <span class="krn-calendar__weekday" role="columnheader">{{ weekday }}</span>
              }
            </div>
            <div class="krn-calendar__weeks" role="rowgroup">
              @for (week of calendarRows(); track $index) {
                <div class="krn-calendar__week" role="row">
                  @for (day of week; track day.iso) {
                    <button
                      #dayButton
                      class="krn-calendar__day"
                      type="button"
                      role="gridcell"
                      [attr.aria-current]="day.today ? 'date' : null"
                      [attr.aria-label]="dayLabel(day)"
                      [attr.aria-selected]="isEndpoint(day.iso)"
                      [attr.data-in-range]="isInRange(day.iso)"
                      [attr.data-outside]="day.outside"
                      [attr.data-range-end]="controlValue().end === day.iso"
                      [attr.data-range-start]="controlValue().start === day.iso"
                      [attr.data-selected]="isEndpoint(day.iso)"
                      [attr.data-today]="day.today"
                      [attr.data-date]="day.iso"
                      [attr.tabindex]="focusedDate() === day.iso ? 0 : -1"
                      [disabled]="day.disabled"
                      (focus)="focusedDate.set(day.iso)"
                      (keydown)="handleCalendarKeydown($event, day)"
                      (click)="selectDate(day.iso)"
                    >
                      {{ day.day }}
                    </button>
                  }
                </div>
              }
            </div>
          </div>

          <div class="krn-range-summary" aria-live="polite">
            <span>
              <small>{{ startLabel() }}</small>
              <strong>{{ formattedStart() || copy().notSelected }}</strong>
            </span>
            <span aria-hidden="true">→</span>
            <span>
              <small>{{ endLabel() }}</small>
              <strong>{{ formattedEnd() || copy().notSelected }}</strong>
            </span>
          </div>

          <div class="krn-picker__footer">
            <button
              type="button"
              [disabled]="!controlValue().start && !controlValue().end"
              (click)="clear()"
            >
              {{ copy().clear }}
            </button>
            <button type="button" [disabled]="!controlValue().end" (click)="close(true)">
              {{ copy().done }}
            </button>
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnDateRangePicker extends KrnValueAccessor<KrnDateRangeValue> {
  private readonly platform = inject(KRN_PLATFORM);
  private readonly translations = inject(KRN_TRANSLATIONS);
  readonly id = input('');
  readonly ariaLabel = input('');
  readonly locale = input(inject(KRN_LOCALE));
  readonly today = input(toIsoDate(new Date(this.platform.now())));
  readonly weekStartsOn = input(0, { transform: clampWeekStartsOn });
  readonly labels = input<Partial<KrnDatePickerLabels>>({});
  readonly startLabel = input(this.translations.datePicker.startDate);
  readonly endLabel = input(this.translations.datePicker.endDate);
  readonly min = input('');
  readonly max = input('');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, {
    alias: 'readonly',
    transform: booleanAttribute,
  });
  readonly required = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly valueChange = output<KrnDateRangeValue>();
  protected readonly open = signal(false);
  protected readonly visibleMonth = signal(initialCalendarMonth('', new Date(this.platform.now())));
  protected readonly focusedDate = signal(this.today());
  protected readonly copy = computed(() => ({
    ...this.translations.datePicker,
    ...this.labels(),
  }));
  protected readonly pickerAriaLabel = computed(
    () => this.ariaLabel() || this.copy().chooseDateRange,
  );
  protected readonly weekdays = computed(() => weekdayLabels(this.locale(), this.weekStartsOn()));
  protected readonly a11y = useKrnControlA11y(this, this.id, this.invalid, 'date-range', {
    disabled: this.disabled,
    readOnly: this.readOnly,
    required: this.required,
  });
  protected readonly isDisabled = computed(() => this.a11y.disabled() || this.formDisabled());
  protected readonly calendarId = computed(() => `${this.a11y.id()}-calendar`);
  protected readonly days = computed(() =>
    calendarDays(this.visibleMonth(), this.min(), this.max(), this.weekStartsOn(), this.today()),
  );
  protected readonly calendarRows = computed(() => groupCalendarRows(this.days()));
  protected readonly monthLabel = computed(() => formatMonth(this.visibleMonth(), this.locale()));
  protected readonly formattedStart = computed(() =>
    formatDate(this.controlValue().start, this.locale()),
  );
  protected readonly formattedEnd = computed(() =>
    formatDate(this.controlValue().end, this.locale()),
  );
  protected readonly selectionPrompt = computed(() =>
    this.controlValue().start && !this.controlValue().end
      ? this.copy().chooseEndDate
      : this.copy().chooseStartDate,
  );
  private readonly trigger = viewChild<ElementRef<HTMLButtonElement>>('trigger');
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  private readonly dayButtons = viewChildren<ElementRef<HTMLButtonElement>>('dayButton');
  private readonly syncPanel = effect((onCleanup) => {
    if (!this.open()) {
      return;
    }
    const trigger = this.trigger()?.nativeElement;
    const panel = this.panel()?.nativeElement;
    if (trigger && panel) {
      connectPickerPopover(trigger, panel, 368, 456, onCleanup);
    }
  });
  private readonly syncFocusedDay = effect(() => {
    if (!this.open()) {
      return;
    }
    const iso = this.focusedDate();
    const buttons = this.dayButtons();
    this.platform.queueMicrotask(() => this.focusDayButton(iso, buttons));
  });
  private readonly closeWhenBlocked = effect(() => {
    const disabled = this.isDisabled();
    const readOnly = this.a11y.readOnly();
    if (!this.open() || (!disabled && !readOnly)) {
      return;
    }
    this.open.set(false);
    if (!disabled) {
      this.platform.queueMicrotask(() => this.trigger()?.nativeElement.focus());
    }
  });

  constructor() {
    super({ start: '', end: '' });
    this.watchValidationInputs(this.required, this.a11y.required, this.min, this.max);
  }

  override writeValue(value: unknown): void {
    super.writeValue(value);
    const parsed = parseIsoDate(this.controlValue().start || this.controlValue().end);
    if (parsed) {
      this.visibleMonth.set(startOfMonth(parsed));
    }
  }

  protected override normalizeIncomingValue(value: unknown): KrnDateRangeValue {
    if (typeof value !== 'object' || value === null || !('start' in value) || !('end' in value)) {
      return { start: '', end: '' };
    }
    const start = isIsoDate(value.start) ? value.start : '';
    const end = isIsoDate(value.end) ? value.end : '';
    return start && end && end < start ? { start: end, end: start } : { start, end };
  }

  protected override validateValue(value: unknown) {
    if (typeof value !== 'object' || value === null) {
      return requiredError(value, this.a11y.required());
    }
    const start = 'start' in value ? value.start : '';
    const end = 'end' in value ? value.end : '';
    const parsedStart = start ? parseIsoDate(start) : null;
    const parsedEnd = end ? parseIsoDate(end) : null;
    return mergeValidationErrors(
      requiredError(parsedStart && parsedEnd ? [start, end] : [], this.a11y.required()),
      start && !parsedStart ? { startDate: true } : null,
      end && !parsedEnd ? { endDate: true } : null,
      parsedStart && parsedEnd && toIsoDate(parsedEnd) < toIsoDate(parsedStart)
        ? { dateRange: true }
        : null,
      parsedStart && this.min() && toIsoDate(parsedStart) < this.min()
        ? { minDate: { min: this.min(), actual: start } }
        : null,
      parsedEnd && this.max() && toIsoDate(parsedEnd) > this.max()
        ? { maxDate: { max: this.max(), actual: end } }
        : null,
    );
  }

  protected toggleOpen(): void {
    if (this.isDisabled() || this.a11y.readOnly()) {
      return;
    }
    const next = !this.open();
    if (next) {
      const referenceDate = parseIsoDate(this.today()) ?? new Date(this.platform.now());
      this.visibleMonth.set(
        clampCalendarMonth(
          initialCalendarMonth(this.controlValue().start || this.controlValue().end, referenceDate),
          this.min(),
          this.max(),
        ),
      );
      this.focusedDate.set(this.initialFocusDate());
    }
    this.open.set(next);
  }

  protected close(restoreFocus = true): void {
    this.open.set(false);
    this.touch();
    if (restoreFocus) {
      this.platform.queueMicrotask(() => this.trigger()?.nativeElement.focus());
    }
  }

  protected onEscape(event: Event): void {
    consumeOpenEscape(event, this.open(), () => this.close());
  }

  protected closeOnFocusOut(event: FocusEvent): void {
    closeWhenFocusLeaves(event, () => this.close(false));
  }

  protected moveMonth(amount: number): void {
    if (!this.isDisabled() && !this.a11y.readOnly() && this.canMoveMonth(amount)) {
      this.visibleMonth.set(addMonths(this.visibleMonth(), amount));
    }
  }

  protected canMoveMonth(amount: number): boolean {
    return canMoveCalendarMonth(this.visibleMonth(), amount, this.min(), this.max());
  }

  protected dayLabel(day: KrnCalendarDay): string {
    return formatFullDate(day.date, this.locale());
  }

  protected isEndpoint(value: string): boolean {
    return this.controlValue().start === value || this.controlValue().end === value;
  }

  protected isInRange(value: string): boolean {
    const { start, end } = this.controlValue();
    return Boolean(start && end && value > start && value < end);
  }

  protected selectDate(value: string): void {
    if (
      this.isDisabled() ||
      this.a11y.readOnly() ||
      dateIsDisabled(value, this.min(), this.max())
    ) {
      return;
    }
    const current = this.controlValue();
    if (!current.start || current.end || value < current.start) {
      this.emitRange({ start: value, end: '' });
      return;
    }
    this.emitRange({ start: current.start, end: value });
  }

  protected clear(): void {
    if (this.isDisabled() || this.a11y.readOnly()) {
      return;
    }
    this.emitRange({ start: '', end: '' });
  }

  protected handleCalendarKeydown(event: KeyboardEvent, day: KrnCalendarDay): void {
    if (this.isDisabled() || this.a11y.readOnly()) {
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.selectDate(day.iso);
      return;
    }
    const next = dateForCalendarKey(day.date, event.key, event.shiftKey, this.weekStartsOn());
    if (!next) {
      return;
    }
    event.preventDefault();
    this.focusDate(clampDate(next, this.min(), this.max()));
  }

  private initialFocusDate(): string {
    const preferred = this.controlValue().end || this.controlValue().start || this.today();
    if (!dateIsDisabled(preferred, this.min(), this.max())) {
      return preferred;
    }
    return this.days().find((day) => !day.disabled)?.iso ?? preferred;
  }

  private focusDate(date: Date): void {
    const iso = toIsoDate(date);
    this.focusedDate.set(iso);
    this.visibleMonth.set(startOfMonth(date));
  }

  private focusDayButton(iso: string, buttons = this.dayButtons()): void {
    buttons.find((button) => button.nativeElement.dataset['date'] === iso)?.nativeElement.focus();
  }

  private emitRange(value: KrnDateRangeValue): void {
    if (this.isDisabled() || this.a11y.readOnly()) {
      return;
    }
    this.commitValue(value);
    this.valueChange.emit(value);
  }
}

@Component({
  selector: 'krn-time-picker',
  host: {
    class: 'krn-picker-host',
    '[attr.id]': 'null',
  },
  providers: [...provideKrnFormControl(() => KrnTimePicker)],
  template: `
    <div
      class="krn-picker"
      (focusout)="closeOnFocusOut($event)"
      (keydown.escape)="onEscape($event)"
    >
      <span
        class="krn-control-shell"
        [attr.data-disabled]="isDisabled()"
        [attr.data-invalid]="a11y.invalid()"
        [attr.data-readonly]="a11y.readOnly()"
      >
        <button
          #trigger
          class="krn-picker__trigger"
          type="button"
          [attr.aria-controls]="panelId()"
          [attr.aria-describedby]="a11y.describedBy()"
          [attr.aria-expanded]="open()"
          [attr.aria-haspopup]="'dialog'"
          [attr.aria-invalid]="a11y.invalid()"
          [attr.aria-label]="a11y.labelledBy() ? null : copy().chooseTime"
          [attr.aria-labelledby]="a11y.labelledBy()"
          [attr.aria-required]="a11y.required()"
          [attr.data-krn-form-field-control]="a11y.isFormFieldControl() ? '' : null"
          [disabled]="isDisabled()"
          [id]="a11y.id()"
          (blur)="touch()"
          (click)="toggleOpen()"
        >
          @if (controlValue()) {
            <span class="krn-picker__value krn-picker__value--numeric">
              {{ displayTime() }}
            </span>
          } @else {
            <span class="krn-picker__placeholder">{{ copy().selectTime }}</span>
          }
          <span class="krn-picker__clock-icon" aria-hidden="true"></span>
        </button>
      </span>

      @if (open()) {
        <div
          #panel
          class="krn-picker__panel krn-time-panel"
          popover="manual"
          role="dialog"
          [attr.aria-describedby]="panelId() + '-help'"
          [attr.aria-label]="copy().chooseTime"
          [id]="panelId()"
        >
          <div class="krn-time-panel__header">
            <span>
              <small>{{ copy().twentyFourHourTime }}</small>
              <strong aria-live="polite">{{ draftTime() || displayTime() || '—:—' }}</strong>
            </span>
            <span class="krn-time-panel__zone">{{ copy().twentyFourHour }}</span>
          </div>
          <div class="krn-time-entry" role="group" [attr.aria-label]="copy().time">
            <label class="krn-time-part">
              <span>{{ copy().hour }}</span>
              <input
                type="text"
                role="spinbutton"
                autocomplete="off"
                inputmode="numeric"
                maxlength="2"
                pattern="[0-9]*"
                [attr.aria-label]="copy().hour"
                aria-valuemax="23"
                aria-valuemin="0"
                [attr.aria-valuenow]="draftHourNumber()"
                [attr.aria-valuetext]="hourDraft() || copy().notSet"
                [disabled]="isDisabled() || a11y.readOnly()"
                [value]="hourDraft()"
                (blur)="normalizeDraftPart('hour')"
                (focus)="selectPart($event)"
                (input)="updateDraftPart('hour', $event)"
                (keydown)="handlePartKeydown('hour', $event)"
              />
            </label>
            <span class="krn-time-entry__separator" aria-hidden="true">:</span>
            <label class="krn-time-part">
              <span>{{ copy().minute }}</span>
              <input
                type="text"
                role="spinbutton"
                autocomplete="off"
                inputmode="numeric"
                maxlength="2"
                pattern="[0-9]*"
                [attr.aria-label]="copy().minute"
                aria-valuemax="59"
                aria-valuemin="0"
                [attr.aria-valuenow]="draftMinuteNumber()"
                [attr.aria-valuetext]="minuteDraft() || copy().notSet"
                [disabled]="isDisabled() || a11y.readOnly()"
                [value]="minuteDraft()"
                (blur)="normalizeDraftPart('minute')"
                (focus)="selectPart($event)"
                (input)="updateDraftPart('minute', $event)"
                (keydown)="handlePartKeydown('minute', $event)"
              />
            </label>
          </div>
          <p class="krn-time-panel__help" [id]="panelId() + '-help'">
            {{ copy().keyboardHelp }}
          </p>
          <div class="krn-time-presets" [attr.aria-label]="copy().commonTimes">
            <span>{{ copy().commonTimes }}</span>
            <div>
              @for (preset of timePresets(); track preset) {
                <button
                  type="button"
                  [attr.aria-pressed]="draftTime() === preset"
                  [attr.data-selected]="draftTime() === preset"
                  [disabled]="isDisabled() || a11y.readOnly()"
                  (click)="selectPreset(preset)"
                >
                  {{ preset }}
                </button>
              }
            </div>
          </div>
          <div class="krn-picker__footer">
            <button
              type="button"
              [disabled]="isDisabled() || a11y.readOnly() || !controlValue()"
              (click)="clear()"
            >
              {{ copy().clear }}
            </button>
            <button
              type="button"
              [disabled]="isDisabled() || a11y.readOnly() || !draftTime()"
              (click)="applyDraft()"
            >
              {{ copy().apply }}
            </button>
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnTimePicker extends KrnValueAccessor<string> {
  private readonly platform = inject(KRN_PLATFORM);
  private readonly translations = inject(KRN_TRANSLATIONS);
  readonly id = input('');
  readonly labels = input<Partial<KrnTimePickerTranslations>>({});
  readonly ariaLabel = input(this.translations.timePicker.chooseTime);
  readonly min = input('');
  readonly max = input('');
  readonly step = input(60, { transform: numberAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, {
    alias: 'readonly',
    transform: booleanAttribute,
  });
  readonly required = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly valueChange = output<string>();
  protected readonly open = signal(false);
  protected readonly hourDraft = signal('');
  protected readonly minuteDraft = signal('');
  protected readonly copy = computed(() => ({
    ...this.translations.timePicker,
    chooseTime: this.ariaLabel(),
    ...this.labels(),
  }));
  protected readonly a11y = useKrnControlA11y(this, this.id, this.invalid, 'time', {
    disabled: this.disabled,
    readOnly: this.readOnly,
    required: this.required,
  });
  protected readonly isDisabled = computed(() => this.a11y.disabled() || this.formDisabled());
  protected readonly panelId = computed(() => `${this.a11y.id()}-panel`);
  protected readonly displayTime = computed(() => this.controlValue().slice(0, 5));
  protected readonly minutes = computed(() => {
    const increment = Math.min(60, Math.max(1, Math.round(this.step() / 60) || 1));
    const values: number[] = [];
    for (let minute = 0; minute < 60; minute += increment) {
      values.push(minute);
    }
    return values;
  });
  protected readonly availableTimes = computed(() => {
    const values: string[] = [];
    for (let hour = 0; hour < 24; hour += 1) {
      for (const minute of this.minutes()) {
        if (!this.timeDisabled(hour, minute)) {
          values.push(`${pad(hour)}:${pad(minute)}`);
        }
      }
    }
    return values;
  });
  protected readonly draftHourNumber = computed(() => this.parseDraftPart(this.hourDraft(), 23));
  protected readonly draftMinuteNumber = computed(() =>
    this.parseDraftPart(this.minuteDraft(), 59),
  );
  protected readonly draftTime = computed(() => {
    const hour = this.draftHourNumber();
    const minute = this.draftMinuteNumber();
    if (hour === null || minute === null || !this.minutes().includes(minute)) {
      return '';
    }
    const value = `${pad(hour)}:${pad(minute)}`;
    return this.availableTimes().includes(value) ? value : '';
  });
  protected readonly timePresets = computed(() => {
    const available = this.availableTimes();
    if (!available.length) {
      return [];
    }
    const preferred = ['09:00', '12:00', '15:00', '18:00'].filter((value) =>
      available.includes(value),
    );
    if (preferred.length >= 3) {
      return preferred;
    }
    const supplements = [0.25, 0.5, 0.75].map(
      (ratio) =>
        available[Math.min(available.length - 1, Math.round((available.length - 1) * ratio))]!,
    );
    return [...new Set([...preferred, ...supplements])].slice(0, 4);
  });
  private readonly trigger = viewChild<ElementRef<HTMLButtonElement>>('trigger');
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  private readonly syncPanel = effect((onCleanup) => {
    if (!this.open()) {
      return;
    }
    const trigger = this.trigger()?.nativeElement;
    const panel = this.panel()?.nativeElement;
    if (trigger && panel) {
      connectPickerPopover(trigger, panel, 320, 340, onCleanup);
    }
  });
  private readonly closeWhenBlocked = effect(() => {
    const disabled = this.isDisabled();
    const readOnly = this.a11y.readOnly();
    if (!this.open() || (!disabled && !readOnly)) {
      return;
    }
    this.seedDraft();
    this.open.set(false);
    if (!disabled) {
      this.platform.queueMicrotask(() => this.trigger()?.nativeElement.focus());
    }
  });

  constructor() {
    super('');
    this.watchValidationInputs(this.required, this.a11y.required, this.min, this.max);
  }

  protected override normalizeIncomingValue(value: unknown): string {
    return isTime(value) ? value : '';
  }

  protected override validateValue(value: unknown) {
    const valid = value === '' || value === null || value === undefined || isTime(value);
    const normalized = typeof value === 'string' ? value.slice(0, 5) : '';
    const min = isTime(this.min()) ? this.min().slice(0, 5) : '';
    const max = isTime(this.max()) ? this.max().slice(0, 5) : '';
    return mergeValidationErrors(
      requiredError(value, this.a11y.required()),
      !valid ? { time: true } : null,
      valid && normalized && min && normalized < min ? { minTime: { min, actual: value } } : null,
      valid && normalized && max && normalized > max ? { maxTime: { max, actual: value } } : null,
    );
  }

  protected toggleOpen(): void {
    if (!this.isDisabled() && !this.a11y.readOnly()) {
      const shouldOpen = !this.open();
      if (shouldOpen) {
        this.seedDraft();
        this.open.set(true);
      } else {
        this.close();
      }
    }
  }

  protected close(restoreFocus = true): void {
    if (!this.open()) {
      return;
    }
    this.seedDraft();
    this.open.set(false);
    this.touch();
    if (restoreFocus) {
      this.platform.queueMicrotask(() => {
        if (!this.isDisabled()) {
          this.trigger()?.nativeElement.focus();
        }
      });
    }
  }

  protected onEscape(event: Event): void {
    consumeOpenEscape(event, this.open(), () => this.close());
  }

  protected closeOnFocusOut(event: FocusEvent): void {
    closeWhenFocusLeaves(event, () => this.close(false));
  }

  protected updateDraftPart(part: 'hour' | 'minute', event: Event): void {
    if (this.isDisabled() || this.a11y.readOnly()) {
      return;
    }
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '').slice(0, 2);
    if (input.value !== value) {
      input.value = value;
    }
    this.partSignal(part).set(value);
  }

  protected normalizeDraftPart(part: 'hour' | 'minute'): void {
    if (this.isDisabled() || this.a11y.readOnly()) {
      return;
    }
    const signal = this.partSignal(part);
    const maximum = part === 'hour' ? 23 : 59;
    const value = this.parseDraftPart(signal(), maximum);
    if (value === null) {
      this.seedDraft();
      return;
    }
    signal.set(pad(value));
  }

  protected selectPart(event: FocusEvent): void {
    (event.target as HTMLInputElement).select();
  }

  protected handlePartKeydown(part: 'hour' | 'minute', event: KeyboardEvent): void {
    if (this.isDisabled() || this.a11y.readOnly()) {
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      this.applyDraft();
      return;
    }
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') {
      return;
    }
    event.preventDefault();
    this.nudgePart(part, event.key === 'ArrowUp' ? 1 : -1);
  }

  protected timeDisabled(hour: number, minute: number): boolean {
    const value = `${pad(hour)}:${pad(minute)}`;
    const min = isTime(this.min()) ? this.min().slice(0, 5) : '';
    const max = isTime(this.max()) ? this.max().slice(0, 5) : '';
    return Boolean((min && value < min) || (max && value > max));
  }

  protected selectPreset(value: string): void {
    if (this.isDisabled() || this.a11y.readOnly()) {
      return;
    }
    this.setDraft(value);
  }

  protected applyDraft(): void {
    if (this.isDisabled() || this.a11y.readOnly()) {
      return;
    }
    const value = this.draftTime();
    if (!value) {
      return;
    }
    this.emitTime(value);
    this.close();
  }

  protected clear(): void {
    if (this.isDisabled() || this.a11y.readOnly()) {
      return;
    }
    this.emitTime('');
    this.close();
  }

  private emitTime(value: string): void {
    if (this.isDisabled() || this.a11y.readOnly()) {
      return;
    }
    this.commitValue(value);
    this.valueChange.emit(value);
  }

  private seedDraft(): void {
    const fallback =
      this.controlValue().slice(0, 5) ||
      (isTime(this.min()) ? this.min().slice(0, 5) : '') ||
      this.timePresets()[0] ||
      this.availableTimes()[0] ||
      '00:00';
    this.setDraft(fallback);
  }

  private setDraft(value: string): void {
    this.hourDraft.set(value.slice(0, 2));
    this.minuteDraft.set(value.slice(3, 5));
  }

  private partSignal(part: 'hour' | 'minute') {
    return part === 'hour' ? this.hourDraft : this.minuteDraft;
  }

  private parseDraftPart(value: string, maximum: number): number | null {
    if (!/^\d{1,2}$/.test(value)) {
      return null;
    }
    const numeric = Number(value);
    return Number.isInteger(numeric) && numeric >= 0 && numeric <= maximum ? numeric : null;
  }

  private nudgePart(part: 'hour' | 'minute', direction: 1 | -1): void {
    const fallback =
      this.draftTime() || this.controlValue().slice(0, 5) || this.availableTimes()[0];
    if (!fallback) {
      return;
    }
    const currentHour = Number(fallback.slice(0, 2));
    const currentMinute = Number(fallback.slice(3, 5));
    const candidates =
      part === 'hour'
        ? Array.from({ length: 24 }, (_, offset) => {
            const hour = (currentHour + direction * (offset + 1) + 24 * 2) % 24;
            return `${pad(hour)}:${pad(currentMinute)}`;
          })
        : this.minuteCandidates(currentHour, currentMinute, direction);
    const next = candidates.find((value) => this.availableTimes().includes(value));
    if (next) {
      this.setDraft(next);
    }
  }

  private minuteCandidates(hour: number, minute: number, direction: 1 | -1): string[] {
    const minutes = this.minutes();
    const currentIndex = Math.max(0, minutes.indexOf(minute));
    return Array.from({ length: minutes.length }, (_, offset) => {
      const index = (currentIndex + direction * (offset + 1) + minutes.length * 2) % minutes.length;
      return `${pad(hour)}:${pad(minutes[index] ?? 0)}`;
    });
  }
}

const hexToHsl = (value: string): KrnHslColor | null => {
  if (!/^#[\da-f]{6}$/i.test(value)) {
    return null;
  }
  const red = Number.parseInt(value.slice(1, 3), 16) / 255;
  const green = Number.parseInt(value.slice(3, 5), 16) / 255;
  const blue = Number.parseInt(value.slice(5, 7), 16) / 255;
  const maximum = Math.max(red, green, blue);
  const minimum = Math.min(red, green, blue);
  const delta = maximum - minimum;
  const lightness = (maximum + minimum) / 2;
  let hue = 0;
  let saturation = 0;

  if (delta !== 0) {
    saturation = delta / (1 - Math.abs(2 * lightness - 1));
    if (maximum === red) {
      hue = 60 * (((green - blue) / delta) % 6);
    } else if (maximum === green) {
      hue = 60 * ((blue - red) / delta + 2);
    } else {
      hue = 60 * ((red - green) / delta + 4);
    }
  }

  return {
    hue: Math.round((hue + 360) % 360),
    lightness: Math.round(lightness * 100),
    saturation: Math.round(saturation * 100),
  };
};

const hslToHex = (hue: number, saturation: number, lightness: number): string => {
  const normalizedSaturation = saturation / 100;
  const normalizedLightness = lightness / 100;
  const chroma = (1 - Math.abs(2 * normalizedLightness - 1)) * normalizedSaturation;
  const intermediate = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const match = normalizedLightness - chroma / 2;
  const [red, green, blue] =
    hue < 60
      ? [chroma, intermediate, 0]
      : hue < 120
        ? [intermediate, chroma, 0]
        : hue < 180
          ? [0, chroma, intermediate]
          : hue < 240
            ? [0, intermediate, chroma]
            : hue < 300
              ? [intermediate, 0, chroma]
              : [chroma, 0, intermediate];
  return `#${[red, green, blue]
    .map((channel) =>
      Math.round((channel + match) * 255)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
};

@Component({
  selector: 'krn-color-picker',
  host: {
    class: 'krn-picker-host',
    '[attr.id]': 'null',
  },
  providers: [...provideKrnFormControl(() => KrnColorPicker)],
  template: `
    <div
      class="krn-picker"
      (focusout)="closeOnFocusOut($event)"
      (keydown.escape)="onEscape($event)"
    >
      <span
        class="krn-control-shell"
        [attr.data-disabled]="isDisabled()"
        [attr.data-invalid]="a11y.invalid() || !validColor()"
        [attr.data-readonly]="a11y.readOnly()"
      >
        <button
          #trigger
          class="krn-picker__trigger krn-color-trigger"
          type="button"
          [attr.aria-controls]="panelId()"
          [attr.aria-describedby]="a11y.describedBy()"
          [attr.aria-expanded]="open()"
          [attr.aria-haspopup]="'dialog'"
          [attr.aria-invalid]="a11y.invalid() || !validColor()"
          [attr.aria-label]="a11y.labelledBy() ? null : copy().chooseColor"
          [attr.aria-labelledby]="a11y.labelledBy()"
          [attr.data-krn-form-field-control]="a11y.isFormFieldControl() ? '' : null"
          [disabled]="isDisabled()"
          [id]="a11y.id()"
          (blur)="touch()"
          (click)="toggleOpen()"
        >
          <span
            class="krn-color-trigger__swatch"
            aria-hidden="true"
            [style.background]="normalizedColor()"
          ></span>
          <span class="krn-color-trigger__value">{{ controlValue().toUpperCase() }}</span>
          <span class="krn-select-chevron" aria-hidden="true"></span>
        </button>
      </span>

      @if (open()) {
        <div
          #panel
          class="krn-picker__panel krn-color-panel"
          popover="manual"
          role="dialog"
          [attr.aria-label]="copy().chooseColor"
          [id]="panelId()"
        >
          <div
            class="krn-color-preview"
            [style.background]="normalizedColor()"
            [style.color]="previewTextColor()"
          >
            <span>{{ copy().preview }}</span>
            <strong>{{ normalizedColor().toUpperCase() }}</strong>
          </div>

          <div class="krn-color-swatches" [attr.aria-label]="copy().suggestedColors">
            @for (color of presets; track color) {
              <button
                type="button"
                [attr.aria-label]="copy().useColor(color)"
                [attr.aria-pressed]="normalizedColor() === color"
                [attr.data-selected]="normalizedColor() === color"
                [style.--krn-swatch]="color"
                [disabled]="isDisabled() || a11y.readOnly()"
                (click)="selectColor(color)"
              ></button>
            }
          </div>

          <label class="krn-color-field">
            <span
              >{{ copy().hue }} <output>{{ hue() }}°</output></span
            >
            <input
              class="krn-color-range krn-color-range--hue"
              type="range"
              min="0"
              max="359"
              step="1"
              [attr.aria-label]="copy().hue"
              [disabled]="isDisabled() || a11y.readOnly()"
              [value]="hue()"
              (input)="updateHue($event)"
            />
          </label>

          <label class="krn-color-field">
            <span
              >{{ copy().saturation }} <output>{{ saturation() }}%</output></span
            >
            <input
              class="krn-color-range"
              type="range"
              min="0"
              max="100"
              step="1"
              [attr.aria-label]="copy().saturation"
              [disabled]="isDisabled() || a11y.readOnly()"
              [style.background]="saturationBackground()"
              [value]="saturation()"
              (input)="updateSaturation($event)"
            />
          </label>

          <label class="krn-color-field">
            <span>{{ copy().colorValue }}</span>
            <input
              class="krn-color-text"
              type="text"
              autocapitalize="off"
              autocomplete="off"
              spellcheck="false"
              [attr.aria-invalid]="!validColor()"
              [attr.data-invalid]="!validColor()"
              [disabled]="isDisabled()"
              [readOnly]="a11y.readOnly()"
              [value]="controlValue()"
              (input)="updateText($event)"
            />
          </label>

          <div class="krn-picker__footer">
            <span class="krn-color-status" aria-live="polite">
              {{ validColor() ? copy().validColor : copy().invalidColor }}
            </span>
            <button
              type="button"
              [disabled]="isDisabled() || a11y.readOnly() || !validColor()"
              (click)="close()"
            >
              {{ copy().done }}
            </button>
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnColorPicker extends KrnValueAccessor<string> {
  private readonly platform = inject(KRN_PLATFORM);
  private readonly translations = inject(KRN_TRANSLATIONS);
  readonly id = input('');
  readonly labels = input<Partial<KrnColorPickerTranslations>>({});
  readonly pickerLabel = input(this.translations.colorPicker.chooseColor);
  readonly textLabel = input(this.translations.colorPicker.colorValue);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, {
    alias: 'readonly',
    transform: booleanAttribute,
  });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly valueChange = output<string>();
  protected readonly open = signal(false);
  protected readonly hue = signal(226);
  protected readonly saturation = signal(66);
  protected readonly lightness = signal(56);
  protected readonly copy = computed(() => ({
    ...this.translations.colorPicker,
    chooseColor: this.pickerLabel(),
    colorValue: this.textLabel(),
    ...this.labels(),
  }));
  protected readonly presets = [
    '#4666da',
    '#0f8a6a',
    '#ca6b21',
    '#c43d55',
    '#7c52c7',
    '#1684b8',
    '#24262b',
    '#737780',
  ] as const;
  protected readonly a11y = useKrnControlA11y(this, this.id, this.invalid, 'color', {
    disabled: this.disabled,
    readOnly: this.readOnly,
  });
  protected readonly isDisabled = computed(() => this.a11y.disabled() || this.formDisabled());
  protected readonly panelId = computed(() => `${this.a11y.id()}-panel`);
  protected readonly validColor = computed(() => /^#[\da-f]{6}$/i.test(this.controlValue()));
  protected readonly normalizedColor = computed(() =>
    this.validColor() ? this.controlValue().toLowerCase() : DEFAULT_COLOR,
  );
  protected readonly saturationBackground = computed(
    () =>
      `linear-gradient(90deg, hsl(${this.hue()} 0% ${this.lightness()}%), ` +
      `hsl(${this.hue()} 100% ${this.lightness()}%))`,
  );
  protected readonly previewTextColor = computed(() =>
    this.lightness() > 66 ? '#111318' : '#ffffff',
  );
  private readonly trigger = viewChild<ElementRef<HTMLButtonElement>>('trigger');
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  private readonly syncPanel = effect((onCleanup) => {
    if (!this.open()) {
      return;
    }
    const trigger = this.trigger()?.nativeElement;
    const panel = this.panel()?.nativeElement;
    if (trigger && panel) {
      connectPickerPopover(trigger, panel, 320, 472, onCleanup);
    }
  });
  private readonly closeWhenBlocked = effect(() => {
    const disabled = this.isDisabled();
    const readOnly = this.a11y.readOnly();
    if (!this.open() || (!disabled && !readOnly)) {
      return;
    }
    this.open.set(false);
    if (!disabled) {
      this.platform.queueMicrotask(() => this.trigger()?.nativeElement.focus());
    }
  });

  constructor() {
    super(DEFAULT_COLOR);
  }

  override writeValue(value: unknown): void {
    super.writeValue(value);
    this.syncHsl(this.controlValue());
  }

  protected override normalizeIncomingValue(value: unknown): string {
    return typeof value === 'string' ? value : DEFAULT_COLOR;
  }

  protected override validateValue(value: unknown) {
    return typeof value === 'string' && /^#[\da-f]{6}$/i.test(value) ? null : { color: true };
  }

  protected toggleOpen(): void {
    if (!this.isDisabled() && !this.a11y.readOnly()) {
      this.open.update((value) => !value);
    }
  }

  protected close(restoreFocus = true): void {
    if (!this.open()) {
      return;
    }
    this.open.set(false);
    this.touch();
    if (restoreFocus) {
      this.platform.queueMicrotask(() => {
        if (!this.isDisabled()) {
          this.trigger()?.nativeElement.focus();
        }
      });
    }
  }

  protected onEscape(event: Event): void {
    consumeOpenEscape(event, this.open(), () => this.close());
  }

  protected closeOnFocusOut(event: FocusEvent): void {
    closeWhenFocusLeaves(event, () => this.close(false));
  }

  protected updateHue(event: Event): void {
    if (this.isDisabled() || this.a11y.readOnly()) {
      return;
    }
    this.hue.set((event.target as HTMLInputElement).valueAsNumber);
    this.emitHslColor();
  }

  protected updateSaturation(event: Event): void {
    if (this.isDisabled() || this.a11y.readOnly()) {
      return;
    }
    this.saturation.set((event.target as HTMLInputElement).valueAsNumber);
    this.emitHslColor();
  }

  protected selectColor(value: string): void {
    if (this.isDisabled() || this.a11y.readOnly()) {
      return;
    }
    this.syncHsl(value);
    this.emitColor(value);
  }

  protected updateText(event: Event): void {
    if (this.isDisabled() || this.a11y.readOnly()) {
      return;
    }
    const value = (event.target as HTMLInputElement).value.trim();
    this.commitValue(value);
    this.valueChange.emit(value);
    this.syncHsl(value);
  }

  private emitHslColor(): void {
    this.emitColor(hslToHex(this.hue(), this.saturation(), this.lightness()));
  }

  private emitColor(value: string): void {
    if (this.isDisabled() || this.a11y.readOnly()) {
      return;
    }
    this.commitValue(value);
    this.valueChange.emit(value);
  }

  private syncHsl(value: string): void {
    const color = hexToHsl(value);
    if (!color) {
      return;
    }
    this.hue.set(color.hue);
    this.saturation.set(color.saturation);
    this.lightness.set(color.lightness);
  }
}
