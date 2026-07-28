import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  model,
  numberAttribute,
  output,
} from '@angular/core';
import { KRN_LOCALE, KRN_TRANSLATIONS } from '@kern-ui/angular/core';
import type { KrnCalendarTranslations } from '@kern-ui/angular/core';

export interface KrnCalendarDay {
  readonly iso: string;
  readonly day: number;
  readonly inMonth: boolean;
  readonly disabled: boolean;
  readonly today: boolean;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_MONTH = /^\d{4}-\d{2}$/;
const weekStartsOnAttribute = (value: unknown): 0 | 1 => (numberAttribute(value) === 0 ? 0 : 1);

function isoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function utcDate(year: number, month: number, day: number): Date {
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);
  return date;
}

function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const [year = 0, month = 0, day = 0] = value.split('-').map(Number);
  return isoDate(utcDate(year, month, day)) === value;
}

function isValidIsoMonth(value: string): boolean {
  if (!ISO_MONTH.test(value)) return false;
  const month = Number(value.slice(5, 7));
  return month >= 1 && month <= 12;
}

function parseIsoDate(value: string): Date {
  if (!isValidIsoDate(value)) return utcDate(2000, 1, 1);
  const [year = 2000, month = 1, day = 1] = value.split('-').map(Number);
  return utcDate(year, month, day);
}

function addDays(value: string, amount: number): string {
  const date = parseIsoDate(value);
  date.setUTCDate(date.getUTCDate() + amount);
  return isoDate(date);
}

function addMonths(value: string, amount: number): string {
  const [year = 2000, month = 1] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1 + amount, 1));
  return date.toISOString().slice(0, 7);
}

function addDateMonths(value: string, amount: number): string {
  const source = parseIsoDate(value);
  const targetMonth = new Date(Date.UTC(source.getUTCFullYear(), source.getUTCMonth() + amount, 1));
  const lastTargetDay = new Date(
    Date.UTC(targetMonth.getUTCFullYear(), targetMonth.getUTCMonth() + 1, 0),
  ).getUTCDate();
  targetMonth.setUTCDate(Math.min(source.getUTCDate(), lastTargetDay));
  return isoDate(targetMonth);
}

@Component({
  selector: 'krn-calendar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-week-start]': 'weekStartsOn()',
  },
  template: `
    <div class="header">
      <button
        type="button"
        [attr.aria-label]="copy().previousMonth"
        [disabled]="!canMoveMonth(-1)"
        (click)="moveMonth(-1)"
      >
        <span aria-hidden="true">←</span>
      </button>
      <strong aria-live="polite">{{ monthLabel() }}</strong>
      <button
        type="button"
        [attr.aria-label]="copy().nextMonth"
        [disabled]="!canMoveMonth(1)"
        (click)="moveMonth(1)"
      >
        <span aria-hidden="true">→</span>
      </button>
    </div>
    <div class="calendar" role="grid" [attr.aria-label]="monthLabel()">
      <div class="weekdays" role="row">
        @for (weekday of weekdays(); track weekday) {
          <span role="columnheader" [attr.aria-label]="weekday.long">{{ weekday.short }}</span>
        }
      </div>
      <div class="days" role="rowgroup">
        @for (week of weeks(); track $index) {
          <div class="week" role="row">
            @for (day of week; track day.iso) {
              <button
                type="button"
                role="gridcell"
                [attr.data-date]="day.iso"
                [attr.data-outside]="!day.inMonth ? '' : null"
                [attr.data-today]="day.today ? '' : null"
                [attr.aria-current]="day.today ? 'date' : null"
                [attr.aria-disabled]="day.disabled ? 'true' : null"
                [attr.aria-selected]="day.iso === value()"
                [attr.tabindex]="day.iso === focusableDate() ? 0 : -1"
                [disabled]="day.disabled && day.iso !== focusableDate()"
                [attr.aria-label]="dayLabel(day.iso)"
                (click)="select(day)"
                (focus)="focusedDate.set(day.iso)"
                (keydown)="onDayKeydown($event, day.iso)"
              >
                {{ day.day }}
              </button>
            }
          </div>
        }
      </div>
    </div>
    @if (showTodayAction()) {
      <button
        type="button"
        class="today-action"
        [disabled]="todayActionDisabled()"
        (click)="selectToday()"
      >
        {{ copy().today }}
      </button>
    }
  `,
  styles: `
    :host {
      display: grid;
      inline-size: min(100%, 20rem);
      gap: var(--krn-space-2, 0.5rem);
      padding: var(--krn-space-2, 0.5rem);
      border: 1px solid var(--krn-color-border-subtle, #e0e3e7);
      border-radius: var(--krn-radius-lg, 0.75rem);
      color: var(--krn-color-text, #252932);
      background: var(--krn-color-surface, #fff);
      font: var(--krn-font-body-sm, 500 0.8125rem/1.25rem sans-serif);
    }
    .header {
      display: grid;
      grid-template-columns: 2rem minmax(0, 1fr) 2rem;
      align-items: center;
      text-align: center;
    }
    .header button,
    .today-action {
      min-block-size: 2.25rem;
      border: 1px solid transparent;
      border-radius: var(--krn-radius-sm, 0.375rem);
      color: inherit;
      background: transparent;
      font: inherit;
      cursor: pointer;
    }
    .header button:hover,
    .today-action:hover:not(:disabled) {
      background: var(--krn-calendar-day-hover, var(--krn-color-surface-hover, #f2f3f5));
    }
    button:focus-visible {
      outline: var(--krn-focus-ring, 2px solid #4f6feb);
      outline-offset: 2px;
    }
    .calendar {
      display: grid;
      gap: var(--krn-space-1, 0.25rem);
    }
    .weekdays,
    .week {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 0.125rem;
    }
    .days {
      display: grid;
      gap: 0.125rem;
    }
    .weekdays span {
      padding-block: 0.25rem;
      color: var(--krn-color-text-muted, #626a76);
      font-size: 0.6875rem;
      font-weight: 650;
      text-align: center;
      text-transform: uppercase;
    }
    .days button {
      position: relative;
      display: grid;
      aspect-ratio: 1;
      min-block-size: 2.25rem;
      min-inline-size: 0;
      place-items: center;
      padding: 0;
      border: 0;
      border-radius: var(--krn-radius-sm, 0.375rem);
      color: inherit;
      background: transparent;
      font: inherit;
      font-variant-numeric: tabular-nums;
      cursor: pointer;
      transition:
        color var(--krn-motion-duration-interaction) var(--krn-ease-standard, ease),
        background-color var(--krn-motion-duration-interaction) var(--krn-ease-standard, ease);
    }
    .days button:hover:not(:disabled):not([aria-disabled='true']) {
      background: var(--krn-calendar-day-hover, var(--krn-color-surface-hover, #f2f3f5));
    }
    .days button[data-outside] {
      color: var(--krn-color-text-subtle, #8b929c);
    }
    .days button[data-today]::after {
      position: absolute;
      inset-inline: 25%;
      inset-block-end: 0.2rem;
      block-size: 2px;
      background: var(--krn-color-brand-solid, #4f6feb);
      content: '';
    }
    .days button[aria-selected='true'] {
      color: var(--krn-calendar-selected-text, var(--krn-color-on-brand, #fff));
      background: var(--krn-calendar-selected-surface, var(--krn-color-brand-solid, #4f6feb));
      font-weight: 650;
    }
    .days button:disabled,
    .days button[aria-disabled='true'] {
      color: var(--krn-color-text-disabled, #9ea3ab);
      text-decoration: line-through;
      cursor: not-allowed;
    }
    .today-action {
      inline-size: max-content;
      padding-inline: 0.75rem;
      border-color: var(--krn-color-border, #cdd1d7);
      justify-self: end;
    }
    .today-action:disabled {
      color: var(--krn-color-text-disabled, #9ea3ab);
      cursor: not-allowed;
    }
  `,
})
export class KrnCalendar {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly translations = inject(KRN_TRANSLATIONS);

  readonly value = model('');
  readonly activeMonth = model('');
  readonly min = input('');
  readonly max = input('');
  readonly disabledDates = input<ReadonlySet<string>>(new Set<string>());
  readonly locale = input(inject(KRN_LOCALE));
  readonly labels = input<Partial<KrnCalendarTranslations>>({});
  readonly weekStartsOn = input<0 | 1, unknown>(1, {
    transform: weekStartsOnAttribute,
  });
  readonly today = input('');
  readonly showTodayAction = input(true, { transform: booleanAttribute });
  readonly dateSelected = output<string>();
  readonly focusedDate = model('');
  protected readonly copy = computed(() => ({
    ...this.translations.calendar,
    ...this.labels(),
  }));

  protected readonly visibleMonth = computed(() => {
    const requested = isValidIsoMonth(this.activeMonth())
      ? this.activeMonth()
      : isValidIsoDate(this.value())
        ? this.value().slice(0, 7)
        : isValidIsoDate(this.today())
          ? this.today().slice(0, 7)
          : '2000-01';
    return this.normalizedVisibleMonth(requested);
  });
  protected readonly monthLabel = computed(() => {
    const [year = 2000, month = 1] = this.visibleMonth().split('-').map(Number);
    return new Intl.DateTimeFormat(this.locale(), {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(Date.UTC(year, month - 1, 1)));
  });
  protected readonly weekdays = computed(() => {
    const formatter = new Intl.DateTimeFormat(this.locale(), { weekday: 'long', timeZone: 'UTC' });
    const shortFormatter = new Intl.DateTimeFormat(this.locale(), {
      weekday: 'narrow',
      timeZone: 'UTC',
    });
    const sunday = new Date(Date.UTC(2024, 0, 7));
    return Array.from({ length: 7 }, (_, index) => {
      const offset = (index + this.weekStartsOn()) % 7;
      const date = new Date(sunday);
      date.setUTCDate(sunday.getUTCDate() + offset);
      return { long: formatter.format(date), short: shortFormatter.format(date) };
    });
  });
  protected readonly days = computed<readonly KrnCalendarDay[]>(() => {
    const [year = 2000, month = 1] = this.visibleMonth().split('-').map(Number);
    const first = new Date(Date.UTC(year, month - 1, 1));
    const nativeWeekday = first.getUTCDay();
    const leading = (nativeWeekday - this.weekStartsOn() + 7) % 7;
    const start = new Date(first);
    start.setUTCDate(1 - leading);
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setUTCDate(start.getUTCDate() + index);
      const iso = isoDate(date);
      return {
        iso,
        day: date.getUTCDate(),
        inMonth: date.getUTCMonth() === month - 1,
        disabled: this.isDisabled(iso),
        today: iso === this.today(),
      };
    });
  });
  protected readonly weeks = computed(() =>
    Array.from({ length: Math.ceil(this.days().length / 7) }, (_, index) =>
      this.days().slice(index * 7, index * 7 + 7),
    ),
  );
  protected readonly focusableDate = computed(() => {
    const enabledDays = this.days().filter((day) => !day.disabled);
    const requested = this.focusedDate();
    if (enabledDays.some((day) => day.iso === requested)) return requested;
    const selected = this.value();
    if (enabledDays.some((day) => day.iso === selected)) return selected;
    const today = this.today();
    if (enabledDays.some((day) => day.iso === today)) return today;
    const enabledFallback = enabledDays.find((day) => day.inMonth)?.iso ?? enabledDays.at(0)?.iso;
    if (enabledFallback) return enabledFallback;
    for (const candidate of [requested, selected, today, this.min(), this.max()]) {
      if (this.days().some((day) => day.iso === candidate)) return candidate;
    }
    return this.days().find((day) => day.inMonth)?.iso ?? this.days().at(0)?.iso ?? '';
  });
  protected readonly todayActionDisabled = computed(() => {
    const today = this.today();
    return !isValidIsoDate(today) || this.isDisabled(today);
  });

  protected moveMonth(amount: number): void {
    const target = this.navigableMonth(amount);
    if (!target) return;
    this.activeMonth.set(target.month);
    this.focusedDate.set(target.focus);
  }

  protected canMoveMonth(amount: number): boolean {
    return this.navigableMonth(amount) !== null;
  }

  protected select(day: KrnCalendarDay): void {
    if (day.disabled || this.isDisabled(day.iso)) return;
    this.value.set(day.iso);
    this.focusedDate.set(day.iso);
    this.dateSelected.emit(day.iso);
    if (!day.inMonth) {
      this.activeMonth.set(day.iso.slice(0, 7));
      afterNextRender(
        () => {
          this.host.nativeElement.querySelector<HTMLElement>(`[data-date="${day.iso}"]`)?.focus();
        },
        { injector: this.injector },
      );
    }
  }

  protected selectToday(): void {
    const today = this.today();
    if (!isValidIsoDate(today) || this.isDisabled(today)) return;
    this.select({
      iso: today,
      day: parseIsoDate(today).getUTCDate(),
      inMonth: today.slice(0, 7) === this.visibleMonth(),
      disabled: false,
      today: true,
    });
  }

  protected dayLabel(value: string): string {
    return new Intl.DateTimeFormat(this.locale(), {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    }).format(parseIsoDate(value));
  }

  protected onDayKeydown(event: KeyboardEvent, value: string): void {
    let next = value;
    let scanStep = 0;
    let maximumAttempts = Math.max(366, this.disabledDates().size + 2);
    if (event.key === 'ArrowRight') {
      next = addDays(value, 1);
      scanStep = 1;
    } else if (event.key === 'ArrowLeft') {
      next = addDays(value, -1);
      scanStep = -1;
    } else if (event.key === 'ArrowDown') {
      next = addDays(value, 7);
      scanStep = 7;
    } else if (event.key === 'ArrowUp') {
      next = addDays(value, -7);
      scanStep = -7;
    } else if (event.key === 'Home') {
      next = addDays(value, -((parseIsoDate(value).getUTCDay() - this.weekStartsOn() + 7) % 7));
      scanStep = 1;
      maximumAttempts = 7;
    } else if (event.key === 'End') {
      next = addDays(value, 6 - ((parseIsoDate(value).getUTCDay() - this.weekStartsOn() + 7) % 7));
      scanStep = -1;
      maximumAttempts = 7;
    } else if (event.key === 'PageUp') {
      next = addDateMonths(value, event.shiftKey ? -12 : -1);
      scanStep = -1;
    } else if (event.key === 'PageDown') {
      next = addDateMonths(value, event.shiftKey ? 12 : 1);
      scanStep = 1;
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const day = this.days().find((candidate) => candidate.iso === value);
      if (day) this.select(day);
      return;
    } else {
      return;
    }
    event.preventDefault();
    const enabledDate = this.findEnabledDate(next, scanStep, maximumAttempts);
    if (!enabledDate) return;
    this.focusedDate.set(enabledDate);
    if (enabledDate.slice(0, 7) !== this.visibleMonth()) {
      this.activeMonth.set(enabledDate.slice(0, 7));
    }
    afterNextRender(
      () => {
        const button = this.host.nativeElement.querySelector<HTMLElement>(
          `[data-date="${enabledDate}"]`,
        );
        button?.focus();
      },
      { injector: this.injector },
    );
  }

  private findEnabledDate(value: string, step: number, maximumAttempts: number): string | null {
    const { minimum, maximum } = this.validatedBounds();
    let candidate = value;
    for (let attempt = 0; attempt < maximumAttempts; attempt += 1) {
      if (!this.isDisabled(candidate)) {
        return candidate;
      }
      if (
        (step < 0 && minimum && candidate <= minimum) ||
        (step > 0 && maximum && candidate >= maximum)
      ) {
        return null;
      }
      candidate = addDays(candidate, step);
    }
    return null;
  }

  private firstEnabledDateInMonth(monthValue: string): string | null {
    const [year = 2000, month = 1] = monthValue.split('-').map(Number);
    const lastDay = utcDate(year, month + 1, 0).getUTCDate();
    for (let day = 1; day <= lastDay; day += 1) {
      const candidate = isoDate(utcDate(year, month, day));
      if (!this.isDisabled(candidate)) return candidate;
    }
    return null;
  }

  private normalizedVisibleMonth(requested: string): string {
    const { minimum, maximum } = this.validatedBounds();
    let candidate = requested;
    if (minimum && candidate < minimum.slice(0, 7)) candidate = minimum.slice(0, 7);
    if (maximum && candidate > maximum.slice(0, 7)) candidate = maximum.slice(0, 7);
    if (this.firstEnabledDateInMonth(candidate)) return candidate;

    const maximumDistance = Math.ceil(this.disabledDates().size / 28) + 3;
    for (let distance = 1; distance <= maximumDistance; distance += 1) {
      const next = addMonths(candidate, distance);
      if (this.monthWithinBounds(next, minimum, maximum) && this.firstEnabledDateInMonth(next)) {
        return next;
      }
      const previous = addMonths(candidate, -distance);
      if (
        this.monthWithinBounds(previous, minimum, maximum) &&
        this.firstEnabledDateInMonth(previous)
      ) {
        return previous;
      }
    }
    return candidate;
  }

  private navigableMonth(
    amount: number,
  ): { readonly month: string; readonly focus: string } | null {
    if (!Number.isFinite(amount) || amount === 0) return null;
    const direction = amount < 0 ? -1 : 1;
    const { minimum, maximum } = this.validatedBounds();
    let candidate = addMonths(this.visibleMonth(), Math.trunc(amount));
    const maximumDistance = Math.ceil(this.disabledDates().size / 28) + 3;
    for (let distance = 0; distance < maximumDistance; distance += 1) {
      if (!this.monthWithinBounds(candidate, minimum, maximum)) return null;
      const focus = this.firstEnabledDateInMonth(candidate);
      if (focus) return { month: candidate, focus };
      candidate = addMonths(candidate, direction);
    }
    return null;
  }

  private validatedBounds(): { readonly minimum: string; readonly maximum: string } {
    const minimum = isValidIsoDate(this.min()) ? this.min() : '';
    const maximum = isValidIsoDate(this.max()) ? this.max() : '';
    if (minimum && maximum && minimum > maximum) {
      throw new Error(`KrnCalendar requires min (${minimum}) to be on or before max (${maximum}).`);
    }
    return { minimum, maximum };
  }

  private monthWithinBounds(month: string, minimum: string, maximum: string): boolean {
    return Boolean(
      (!minimum || month >= minimum.slice(0, 7)) && (!maximum || month <= maximum.slice(0, 7)),
    );
  }

  private isDisabled(value: string): boolean {
    const { minimum, maximum } = this.validatedBounds();
    return Boolean(
      (minimum && value < minimum) ||
      (maximum && value > maximum) ||
      this.disabledDates().has(value),
    );
  }

  constructor() {
    effect(() => {
      const activeMonth = this.activeMonth();
      if (!activeMonth) return;
      const visibleMonth = this.visibleMonth();
      if (activeMonth !== visibleMonth) this.activeMonth.set(visibleMonth);
    });
  }
}
