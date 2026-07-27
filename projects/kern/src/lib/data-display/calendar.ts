import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  booleanAttribute,
  computed,
  inject,
  input,
  model,
  output,
} from '@angular/core';

export interface KrnCalendarDay {
  readonly iso: string;
  readonly day: number;
  readonly inMonth: boolean;
  readonly disabled: boolean;
  readonly today: boolean;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_MONTH = /^\d{4}-\d{2}$/;

function parseIsoDate(value: string): Date {
  if (!ISO_DATE.test(value)) return new Date(Date.UTC(2000, 0, 1));
  const [year = 2000, month = 1, day = 1] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function isoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
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
      <button type="button" aria-label="Previous month" (click)="moveMonth(-1)">
        <span aria-hidden="true">←</span>
      </button>
      <strong aria-live="polite">{{ monthLabel() }}</strong>
      <button type="button" aria-label="Next month" (click)="moveMonth(1)">
        <span aria-hidden="true">→</span>
      </button>
    </div>
    <div class="calendar" role="grid" [attr.aria-label]="monthLabel()">
      <div class="weekdays" role="row">
        @for (weekday of weekdays(); track weekday) {
          <span role="columnheader" [attr.aria-label]="weekday.long">{{ weekday.short }}</span>
        }
      </div>
      <div class="days">
        @for (day of days(); track day.iso) {
          <button
            type="button"
            role="gridcell"
            [attr.data-date]="day.iso"
            [attr.data-outside]="!day.inMonth ? '' : null"
            [attr.data-today]="day.today ? '' : null"
            [attr.aria-current]="day.today ? 'date' : null"
            [attr.aria-selected]="day.iso === value()"
            [attr.tabindex]="day.iso === focusableDate() ? 0 : -1"
            [disabled]="day.disabled"
            [attr.aria-label]="dayLabel(day.iso)"
            (click)="select(day)"
            (focus)="focusedDate.set(day.iso)"
            (keydown)="onDayKeydown($event, day.iso)"
          >
            {{ day.day }}
          </button>
        }
      </div>
    </div>
    @if (showTodayAction()) {
      <button type="button" class="today-action" [disabled]="!today()" (click)="selectToday()">
        Today
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
    .today-action:hover {
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
    .days {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
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
        color var(--krn-motion-fast, 90ms) var(--krn-ease-standard, ease),
        background-color var(--krn-motion-fast, 90ms) var(--krn-ease-standard, ease);
    }
    .days button:hover:not(:disabled) {
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
    .days button:disabled {
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
  `,
})
export class KrnCalendar {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  readonly value = model('');
  readonly activeMonth = model('');
  readonly min = input('');
  readonly max = input('');
  readonly disabledDates = input<ReadonlySet<string>>(new Set<string>());
  readonly locale = input('en');
  readonly weekStartsOn = input<0 | 1>(1);
  readonly today = input('');
  readonly showTodayAction = input(true, { transform: booleanAttribute });
  readonly dateSelected = output<string>();
  readonly focusedDate = model('');

  readonly visibleMonth = computed(() => {
    if (ISO_MONTH.test(this.activeMonth())) return this.activeMonth();
    if (ISO_DATE.test(this.value())) return this.value().slice(0, 7);
    if (ISO_DATE.test(this.today())) return this.today().slice(0, 7);
    return '2000-01';
  });
  readonly monthLabel = computed(() => {
    const [year = 2000, month = 1] = this.visibleMonth().split('-').map(Number);
    return new Intl.DateTimeFormat(this.locale(), {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(Date.UTC(year, month - 1, 1)));
  });
  readonly weekdays = computed(() => {
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
  readonly days = computed<readonly KrnCalendarDay[]>(() => {
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
  readonly focusableDate = computed(() => {
    const enabledDays = this.days().filter((day) => !day.disabled);
    const requested = this.focusedDate();
    if (enabledDays.some((day) => day.iso === requested)) return requested;
    const selected = this.value();
    if (enabledDays.some((day) => day.iso === selected)) return selected;
    const today = this.today();
    if (enabledDays.some((day) => day.iso === today)) return today;
    return enabledDays.find((day) => day.inMonth)?.iso ?? enabledDays.at(0)?.iso ?? '';
  });

  moveMonth(amount: number): void {
    this.activeMonth.set(addMonths(this.visibleMonth(), amount));
    const focus = `${this.activeMonth()}-01`;
    this.focusedDate.set(focus);
  }

  select(day: KrnCalendarDay): void {
    if (day.disabled) return;
    this.value.set(day.iso);
    this.focusedDate.set(day.iso);
    this.dateSelected.emit(day.iso);
    if (!day.inMonth) this.activeMonth.set(day.iso.slice(0, 7));
  }

  selectToday(): void {
    const today = this.today();
    if (!ISO_DATE.test(today) || this.isDisabled(today)) return;
    this.select({
      iso: today,
      day: parseIsoDate(today).getUTCDate(),
      inMonth: today.slice(0, 7) === this.visibleMonth(),
      disabled: false,
      today: true,
    });
  }

  dayLabel(value: string): string {
    return new Intl.DateTimeFormat(this.locale(), {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    }).format(parseIsoDate(value));
  }

  onDayKeydown(event: KeyboardEvent, value: string): void {
    let next = value;
    if (event.key === 'ArrowRight') next = addDays(value, 1);
    else if (event.key === 'ArrowLeft') next = addDays(value, -1);
    else if (event.key === 'ArrowDown') next = addDays(value, 7);
    else if (event.key === 'ArrowUp') next = addDays(value, -7);
    else if (event.key === 'Home')
      next = addDays(value, -((parseIsoDate(value).getUTCDay() - this.weekStartsOn() + 7) % 7));
    else if (event.key === 'End')
      next = addDays(value, 6 - ((parseIsoDate(value).getUTCDay() - this.weekStartsOn() + 7) % 7));
    else if (event.key === 'PageUp') {
      next = addDateMonths(value, event.shiftKey ? -12 : -1);
      this.activeMonth.set(next.slice(0, 7));
    } else if (event.key === 'PageDown') {
      next = addDateMonths(value, event.shiftKey ? 12 : 1);
      this.activeMonth.set(next.slice(0, 7));
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const day = this.days().find((candidate) => candidate.iso === value);
      if (day) this.select(day);
      return;
    } else {
      return;
    }
    event.preventDefault();
    if (this.isDisabled(next)) return;
    this.focusedDate.set(next);
    if (next.slice(0, 7) !== this.visibleMonth()) this.activeMonth.set(next.slice(0, 7));
    afterNextRender(
      () => {
        const button = this.host.nativeElement.querySelector<HTMLElement>(`[data-date="${next}"]`);
        button?.focus();
      },
      { injector: this.injector },
    );
  }

  private isDisabled(value: string): boolean {
    return Boolean(
      (this.min() && value < this.min()) ||
      (this.max() && value > this.max()) ||
      this.disabledDates().has(value),
    );
  }
}
