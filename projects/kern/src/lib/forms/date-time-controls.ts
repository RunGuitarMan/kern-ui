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
  type ElementRef,
  viewChild,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import type { KrnDateRangeValue } from './form-types';
import { KrnValueAccessor, useKrnControlA11y } from './value-accessor';

interface KrnCalendarDay {
  readonly date: Date;
  readonly day: number;
  readonly disabled: boolean;
  readonly iso: string;
  readonly outside: boolean;
  readonly today: boolean;
}

interface KrnHslColor {
  readonly hue: number;
  readonly lightness: number;
  readonly saturation: number;
}

const ENGLISH_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const DATE_LABEL_FORMATTER = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});
const FULL_DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'long',
  weekday: 'long',
  year: 'numeric',
});
const MONTH_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric',
});
const DEFAULT_COLOR = '#4666da';

const pad = (value: number): string => `${value}`.padStart(2, '0');

const toIsoDate = (value: Date): string =>
  `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;

const parseIsoDate = (value: unknown): Date | null => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  const [year = 0, month = 0, day = 0] = value.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);
  return parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day
    ? parsed
    : null;
};

const isIsoDate = (value: unknown): value is string => parseIsoDate(value) !== null;

const isTime = (value: unknown): value is string =>
  typeof value === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(value);

const startOfMonth = (value: Date): Date => new Date(value.getFullYear(), value.getMonth(), 1);

const addMonths = (value: Date, amount: number): Date =>
  new Date(value.getFullYear(), value.getMonth() + amount, 1);

const formatDate = (value: string): string => {
  const date = parseIsoDate(value);
  return date ? DATE_LABEL_FORMATTER.format(date) : '';
};

const todayIso = (): string => toIsoDate(new Date());

const dateIsDisabled = (iso: string, min: string, max: string): boolean =>
  Boolean((min && iso < min) || (max && iso > max));

const calendarDays = (month: Date, min: string, max: string): readonly KrnCalendarDay[] => {
  const first = startOfMonth(month);
  const gridStart = new Date(first.getFullYear(), first.getMonth(), 1 - first.getDay());
  const currentMonth = first.getMonth();
  const today = todayIso();

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(
      gridStart.getFullYear(),
      gridStart.getMonth(),
      gridStart.getDate() + index,
    );
    const iso = toIsoDate(date);
    return {
      date,
      day: date.getDate(),
      disabled: dateIsDisabled(iso, min, max),
      iso,
      outside: date.getMonth() !== currentMonth,
      today: iso === today,
    };
  });
};

const initialCalendarMonth = (value = ''): Date => {
  const parsed = parseIsoDate(value) ?? new Date();
  return startOfMonth(parsed);
};

const clampCalendarMonth = (value: Date, min: string, max: string): Date => {
  const month = startOfMonth(value);
  const minDate = parseIsoDate(min);
  const maxDate = parseIsoDate(max);
  if (minDate && addMonths(month, 1) <= startOfMonth(minDate)) {
    return startOfMonth(minDate);
  }
  if (maxDate && month > startOfMonth(maxDate)) {
    return startOfMonth(maxDate);
  }
  return month;
};

const canMoveCalendarMonth = (month: Date, amount: number, min: string, max: string): boolean => {
  const candidate = addMonths(month, amount);
  const candidateEnd = new Date(candidate.getFullYear(), candidate.getMonth() + 1, 0);
  const minDate = parseIsoDate(min);
  const maxDate = parseIsoDate(max);
  return !((minDate && candidateEnd < minDate) || (maxDate && candidate > maxDate));
};

const closeWhenFocusLeaves = (event: FocusEvent, close: () => void): void => {
  const current = event.currentTarget;
  const next = event.relatedTarget;
  if (current instanceof Node && next instanceof Node && current.contains(next)) {
    return;
  }
  close();
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
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => KrnDatePicker),
      multi: true,
    },
  ],
  template: `
    <div class="krn-picker" (focusout)="closeOnFocusOut($event)" (keydown.escape)="close()">
      <span
        class="krn-control-shell"
        [attr.data-disabled]="isDisabled()"
        [attr.data-invalid]="a11y.invalid()"
        [attr.data-readonly]="readOnly()"
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
          [attr.aria-label]="ariaLabel()"
          [attr.aria-required]="required()"
          [disabled]="isDisabled()"
          [id]="a11y.id()"
          (blur)="touch()"
          (click)="toggleOpen()"
        >
          @if (controlValue()) {
            <span class="krn-picker__value">{{ formattedValue() }}</span>
          } @else {
            <span class="krn-picker__placeholder">Select a date</span>
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
          [attr.aria-label]="ariaLabel()"
          [id]="calendarId()"
        >
          <div class="krn-calendar__header">
            <strong aria-live="polite">{{ monthLabel() }}</strong>
            <span class="krn-calendar__navigation">
              <button
                type="button"
                aria-label="Previous month"
                [disabled]="!canMoveMonth(-1)"
                (click)="moveMonth(-1)"
              >
                ‹
              </button>
              <button
                type="button"
                aria-label="Next month"
                [disabled]="!canMoveMonth(1)"
                (click)="moveMonth(1)"
              >
                ›
              </button>
            </span>
          </div>

          <div class="krn-calendar" role="grid" [attr.aria-label]="monthLabel()">
            @for (weekday of weekdays; track weekday) {
              <span class="krn-calendar__weekday" role="columnheader">{{ weekday }}</span>
            }
            @for (day of days(); track day.iso) {
              <button
                class="krn-calendar__day"
                type="button"
                role="gridcell"
                [attr.aria-current]="day.today ? 'date' : null"
                [attr.aria-label]="dayLabel(day)"
                [attr.aria-selected]="controlValue() === day.iso"
                [attr.data-outside]="day.outside"
                [attr.data-selected]="controlValue() === day.iso"
                [attr.data-today]="day.today"
                [disabled]="day.disabled"
                (click)="selectDate(day.iso)"
              >
                {{ day.day }}
              </button>
            }
          </div>

          <div class="krn-picker__footer">
            <button type="button" [disabled]="!controlValue()" (click)="clear()">Clear</button>
            <button type="button" [disabled]="todayDisabled()" (click)="selectDate(today())">
              Today
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './forms.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnDatePicker extends KrnValueAccessor<string> {
  readonly id = input('');
  readonly ariaLabel = input('Choose date');
  readonly min = input('');
  readonly max = input('');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, {
    alias: 'readonly',
    transform: booleanAttribute,
  });
  readonly required = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly valueChange = output<string>();
  readonly open = signal(false);
  readonly visibleMonth = signal(initialCalendarMonth());
  protected readonly weekdays = ENGLISH_WEEKDAYS;
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  protected readonly a11y = useKrnControlA11y(this.id, this.invalid, 'date');
  protected readonly calendarId = computed(() => `${this.a11y.id()}-calendar`);
  protected readonly days = computed(() =>
    calendarDays(this.visibleMonth(), this.min(), this.max()),
  );
  protected readonly monthLabel = computed(() => MONTH_FORMATTER.format(this.visibleMonth()));
  protected readonly formattedValue = computed(() => formatDate(this.controlValue()));
  protected readonly today = computed(todayIso);
  protected readonly todayDisabled = computed(() =>
    dateIsDisabled(this.today(), this.min(), this.max()),
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
      connectPickerPopover(trigger, panel, 336, 392, onCleanup);
    }
  });

  constructor() {
    super('');
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

  protected toggleOpen(): void {
    if (this.isDisabled() || this.readOnly()) {
      return;
    }
    const next = !this.open();
    if (next) {
      this.visibleMonth.set(
        clampCalendarMonth(initialCalendarMonth(this.controlValue()), this.min(), this.max()),
      );
    }
    this.open.set(next);
  }

  protected close(): void {
    this.open.set(false);
  }

  protected closeOnFocusOut(event: FocusEvent): void {
    closeWhenFocusLeaves(event, () => this.close());
  }

  protected moveMonth(amount: number): void {
    if (this.canMoveMonth(amount)) {
      this.visibleMonth.set(addMonths(this.visibleMonth(), amount));
    }
  }

  protected canMoveMonth(amount: number): boolean {
    return canMoveCalendarMonth(this.visibleMonth(), amount, this.min(), this.max());
  }

  protected dayLabel(day: KrnCalendarDay): string {
    return FULL_DATE_FORMATTER.format(day.date);
  }

  protected selectDate(value: string): void {
    if (this.isDisabled() || this.readOnly() || dateIsDisabled(value, this.min(), this.max())) {
      return;
    }
    this.commitValue(value);
    this.valueChange.emit(value);
    this.touch();
    this.close();
  }

  protected clear(): void {
    if (this.readOnly()) {
      return;
    }
    this.commitValue('');
    this.valueChange.emit('');
    this.touch();
    this.close();
  }
}

@Component({
  selector: 'krn-date-range-picker',
  host: {
    class: 'krn-picker-host',
    '[attr.id]': 'null',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => KrnDateRangePicker),
      multi: true,
    },
  ],
  template: `
    <div class="krn-picker" (focusout)="closeOnFocusOut($event)" (keydown.escape)="close()">
      <span
        class="krn-control-shell"
        [attr.data-disabled]="isDisabled()"
        [attr.data-invalid]="a11y.invalid()"
        [attr.data-readonly]="readOnly()"
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
          [attr.aria-label]="ariaLabel()"
          [attr.aria-required]="required()"
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
                {{ formattedEnd() || 'End date' }}
              </span>
            </span>
          } @else {
            <span class="krn-picker__placeholder">Select a date range</span>
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
          [attr.aria-label]="ariaLabel()"
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
                aria-label="Previous month"
                [disabled]="!canMoveMonth(-1)"
                (click)="moveMonth(-1)"
              >
                ‹
              </button>
              <button
                type="button"
                aria-label="Next month"
                [disabled]="!canMoveMonth(1)"
                (click)="moveMonth(1)"
              >
                ›
              </button>
            </span>
          </div>

          <div class="krn-calendar" role="grid" [attr.aria-label]="monthLabel()">
            @for (weekday of weekdays; track weekday) {
              <span class="krn-calendar__weekday" role="columnheader">{{ weekday }}</span>
            }
            @for (day of days(); track day.iso) {
              <button
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
                [disabled]="day.disabled"
                (click)="selectDate(day.iso)"
              >
                {{ day.day }}
              </button>
            }
          </div>

          <div class="krn-range-summary" aria-live="polite">
            <span>
              <small>{{ startLabel() }}</small>
              <strong>{{ formattedStart() || 'Not selected' }}</strong>
            </span>
            <span aria-hidden="true">→</span>
            <span>
              <small>{{ endLabel() }}</small>
              <strong>{{ formattedEnd() || 'Not selected' }}</strong>
            </span>
          </div>

          <div class="krn-picker__footer">
            <button
              type="button"
              [disabled]="!controlValue().start && !controlValue().end"
              (click)="clear()"
            >
              Clear
            </button>
            <button type="button" [disabled]="!controlValue().end" (click)="close()">Done</button>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './forms.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnDateRangePicker extends KrnValueAccessor<KrnDateRangeValue> {
  readonly id = input('');
  readonly ariaLabel = input('Choose date range');
  readonly startLabel = input('Start date');
  readonly endLabel = input('End date');
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
  readonly open = signal(false);
  readonly visibleMonth = signal(initialCalendarMonth());
  protected readonly weekdays = ENGLISH_WEEKDAYS;
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  protected readonly a11y = useKrnControlA11y(this.id, this.invalid, 'date-range');
  protected readonly calendarId = computed(() => `${this.a11y.id()}-calendar`);
  protected readonly days = computed(() =>
    calendarDays(this.visibleMonth(), this.min(), this.max()),
  );
  protected readonly monthLabel = computed(() => MONTH_FORMATTER.format(this.visibleMonth()));
  protected readonly formattedStart = computed(() => formatDate(this.controlValue().start));
  protected readonly formattedEnd = computed(() => formatDate(this.controlValue().end));
  protected readonly selectionPrompt = computed(() =>
    this.controlValue().start && !this.controlValue().end
      ? 'Now choose an end date'
      : 'Choose a start date',
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
      connectPickerPopover(trigger, panel, 368, 456, onCleanup);
    }
  });

  constructor() {
    super({ start: '', end: '' });
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

  protected toggleOpen(): void {
    if (this.isDisabled() || this.readOnly()) {
      return;
    }
    const next = !this.open();
    if (next) {
      this.visibleMonth.set(
        clampCalendarMonth(
          initialCalendarMonth(this.controlValue().start || this.controlValue().end),
          this.min(),
          this.max(),
        ),
      );
    }
    this.open.set(next);
  }

  protected close(): void {
    this.open.set(false);
    this.touch();
  }

  protected closeOnFocusOut(event: FocusEvent): void {
    closeWhenFocusLeaves(event, () => this.close());
  }

  protected moveMonth(amount: number): void {
    if (this.canMoveMonth(amount)) {
      this.visibleMonth.set(addMonths(this.visibleMonth(), amount));
    }
  }

  protected canMoveMonth(amount: number): boolean {
    return canMoveCalendarMonth(this.visibleMonth(), amount, this.min(), this.max());
  }

  protected dayLabel(day: KrnCalendarDay): string {
    return FULL_DATE_FORMATTER.format(day.date);
  }

  protected isEndpoint(value: string): boolean {
    return this.controlValue().start === value || this.controlValue().end === value;
  }

  protected isInRange(value: string): boolean {
    const { start, end } = this.controlValue();
    return Boolean(start && end && value > start && value < end);
  }

  protected selectDate(value: string): void {
    if (this.isDisabled() || this.readOnly() || dateIsDisabled(value, this.min(), this.max())) {
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
    if (this.readOnly()) {
      return;
    }
    this.emitRange({ start: '', end: '' });
  }

  private emitRange(value: KrnDateRangeValue): void {
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
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => KrnTimePicker),
      multi: true,
    },
  ],
  template: `
    <div class="krn-picker" (focusout)="closeOnFocusOut($event)" (keydown.escape)="close()">
      <span
        class="krn-control-shell"
        [attr.data-disabled]="isDisabled()"
        [attr.data-invalid]="a11y.invalid()"
        [attr.data-readonly]="readOnly()"
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
          [attr.aria-label]="ariaLabel()"
          [attr.aria-required]="required()"
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
            <span class="krn-picker__placeholder">Select a time</span>
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
          [attr.aria-label]="ariaLabel()"
          [id]="panelId()"
        >
          <div class="krn-time-panel__header">
            <span>
              <small>24-hour time</small>
              <strong aria-live="polite">{{ draftTime() || displayTime() || '—:—' }}</strong>
            </span>
            <span class="krn-time-panel__zone">24-hour</span>
          </div>
          <div class="krn-time-entry" role="group" aria-label="Time">
            <label class="krn-time-part">
              <span>Hour</span>
              <input
                type="text"
                role="spinbutton"
                autocomplete="off"
                inputmode="numeric"
                maxlength="2"
                pattern="[0-9]*"
                aria-label="Hour"
                aria-valuemax="23"
                aria-valuemin="0"
                [attr.aria-valuenow]="draftHourNumber()"
                [attr.aria-valuetext]="hourDraft() || 'Not set'"
                [value]="hourDraft()"
                (blur)="normalizeDraftPart('hour')"
                (focus)="selectPart($event)"
                (input)="updateDraftPart('hour', $event)"
                (keydown)="handlePartKeydown('hour', $event)"
              />
            </label>
            <span class="krn-time-entry__separator" aria-hidden="true">:</span>
            <label class="krn-time-part">
              <span>Minute</span>
              <input
                type="text"
                role="spinbutton"
                autocomplete="off"
                inputmode="numeric"
                maxlength="2"
                pattern="[0-9]*"
                aria-label="Minute"
                aria-valuemax="59"
                aria-valuemin="0"
                [attr.aria-valuenow]="draftMinuteNumber()"
                [attr.aria-valuetext]="minuteDraft() || 'Not set'"
                [value]="minuteDraft()"
                (blur)="normalizeDraftPart('minute')"
                (focus)="selectPart($event)"
                (input)="updateDraftPart('minute', $event)"
                (keydown)="handlePartKeydown('minute', $event)"
              />
            </label>
          </div>
          <p class="krn-time-panel__help" [id]="panelId() + '-help'">
            Type HH:mm or use ↑ and ↓ to adjust.
          </p>
          <div class="krn-time-presets" aria-label="Common times">
            <span>Common times</span>
            <div>
              @for (preset of timePresets(); track preset) {
                <button
                  type="button"
                  [attr.aria-pressed]="draftTime() === preset"
                  [attr.data-selected]="draftTime() === preset"
                  (click)="selectPreset(preset)"
                >
                  {{ preset }}
                </button>
              }
            </div>
          </div>
          <div class="krn-picker__footer">
            <button type="button" [disabled]="!controlValue()" (click)="clear()">Clear</button>
            <button type="button" [disabled]="!draftTime()" (click)="applyDraft()">Apply</button>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './forms.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnTimePicker extends KrnValueAccessor<string> {
  readonly id = input('');
  readonly ariaLabel = input('Choose time');
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
  readonly open = signal(false);
  readonly hourDraft = signal('');
  readonly minuteDraft = signal('');
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  protected readonly a11y = useKrnControlA11y(this.id, this.invalid, 'time');
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

  constructor() {
    super('');
  }

  protected override normalizeIncomingValue(value: unknown): string {
    return isTime(value) ? value : '';
  }

  protected toggleOpen(): void {
    if (!this.isDisabled() && !this.readOnly()) {
      const shouldOpen = !this.open();
      if (shouldOpen) {
        this.seedDraft();
        this.open.set(true);
      } else {
        this.close();
      }
    }
  }

  protected close(): void {
    this.seedDraft();
    this.open.set(false);
    this.touch();
  }

  protected closeOnFocusOut(event: FocusEvent): void {
    closeWhenFocusLeaves(event, () => this.close());
  }

  protected updateDraftPart(part: 'hour' | 'minute', event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '').slice(0, 2);
    if (input.value !== value) {
      input.value = value;
    }
    this.partSignal(part).set(value);
  }

  protected normalizeDraftPart(part: 'hour' | 'minute'): void {
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
    this.setDraft(value);
  }

  protected applyDraft(): void {
    const value = this.draftTime();
    if (!value) {
      return;
    }
    this.emitTime(value);
    this.close();
  }

  protected clear(): void {
    if (!this.readOnly()) {
      this.emitTime('');
      this.close();
    }
  }

  private emitTime(value: string): void {
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
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => KrnColorPicker),
      multi: true,
    },
  ],
  template: `
    <div class="krn-picker" (focusout)="closeOnFocusOut($event)" (keydown.escape)="close()">
      <span
        class="krn-control-shell"
        [attr.data-disabled]="isDisabled()"
        [attr.data-invalid]="a11y.invalid() || !validColor()"
        [attr.data-readonly]="readOnly()"
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
          [attr.aria-label]="pickerLabel()"
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
          [attr.aria-label]="pickerLabel()"
          [id]="panelId()"
        >
          <div
            class="krn-color-preview"
            [style.background]="normalizedColor()"
            [style.color]="previewTextColor()"
          >
            <span>Preview</span>
            <strong>{{ normalizedColor().toUpperCase() }}</strong>
          </div>

          <div class="krn-color-swatches" aria-label="Suggested colors">
            @for (color of presets; track color) {
              <button
                type="button"
                [attr.aria-label]="'Use color ' + color"
                [attr.aria-pressed]="normalizedColor() === color"
                [attr.data-selected]="normalizedColor() === color"
                [style.--krn-swatch]="color"
                (click)="selectColor(color)"
              ></button>
            }
          </div>

          <label class="krn-color-field">
            <span
              >Hue <output>{{ hue() }}°</output></span
            >
            <input
              class="krn-color-range krn-color-range--hue"
              type="range"
              min="0"
              max="359"
              step="1"
              [attr.aria-label]="'Hue'"
              [value]="hue()"
              (input)="updateHue($event)"
            />
          </label>

          <label class="krn-color-field">
            <span
              >Saturation <output>{{ saturation() }}%</output></span
            >
            <input
              class="krn-color-range"
              type="range"
              min="0"
              max="100"
              step="1"
              [attr.aria-label]="'Saturation'"
              [style.background]="saturationBackground()"
              [value]="saturation()"
              (input)="updateSaturation($event)"
            />
          </label>

          <label class="krn-color-field">
            <span>{{ textLabel() }}</span>
            <input
              class="krn-color-text"
              type="text"
              autocapitalize="off"
              autocomplete="off"
              spellcheck="false"
              [attr.aria-invalid]="!validColor()"
              [attr.data-invalid]="!validColor()"
              [value]="controlValue()"
              (input)="updateText($event)"
            />
          </label>

          <div class="krn-picker__footer">
            <span class="krn-color-status" aria-live="polite">
              {{ validColor() ? 'Valid hex color' : 'Use a 6-digit hex value' }}
            </span>
            <button type="button" [disabled]="!validColor()" (click)="close()">Done</button>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './forms.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnColorPicker extends KrnValueAccessor<string> {
  readonly id = input('');
  readonly pickerLabel = input('Choose color');
  readonly textLabel = input('Color value');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, {
    alias: 'readonly',
    transform: booleanAttribute,
  });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly valueChange = output<string>();
  readonly open = signal(false);
  readonly hue = signal(226);
  readonly saturation = signal(66);
  readonly lightness = signal(56);
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
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  protected readonly a11y = useKrnControlA11y(this.id, this.invalid, 'color');
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

  protected toggleOpen(): void {
    if (!this.isDisabled() && !this.readOnly()) {
      this.open.update((value) => !value);
    }
  }

  protected close(): void {
    this.open.set(false);
    this.touch();
  }

  protected closeOnFocusOut(event: FocusEvent): void {
    closeWhenFocusLeaves(event, () => this.close());
  }

  protected updateHue(event: Event): void {
    this.hue.set((event.target as HTMLInputElement).valueAsNumber);
    this.emitHslColor();
  }

  protected updateSaturation(event: Event): void {
    this.saturation.set((event.target as HTMLInputElement).valueAsNumber);
    this.emitHslColor();
  }

  protected selectColor(value: string): void {
    this.syncHsl(value);
    this.emitColor(value);
  }

  protected updateText(event: Event): void {
    const value = (event.target as HTMLInputElement).value.trim();
    this.commitValue(value);
    this.valueChange.emit(value);
    this.syncHsl(value);
  }

  private emitHslColor(): void {
    this.emitColor(hslToHex(this.hue(), this.saturation(), this.lightness()));
  }

  private emitColor(value: string): void {
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
