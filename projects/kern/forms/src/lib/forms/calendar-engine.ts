export interface KrnCalendarDay {
  readonly date: Date;
  readonly day: number;
  readonly disabled: boolean;
  readonly iso: string;
  readonly outside: boolean;
  readonly today: boolean;
}

const pad = (value: number): string => `${value}`.padStart(2, '0');

export const toIsoDate = (value: Date): string =>
  `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;

export const parseIsoDate = (value: unknown): Date | null => {
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

export const isIsoDate = (value: unknown): value is string => parseIsoDate(value) !== null;

export const startOfMonth = (value: Date): Date =>
  new Date(value.getFullYear(), value.getMonth(), 1);

export const addMonths = (value: Date, amount: number): Date =>
  new Date(value.getFullYear(), value.getMonth() + amount, 1);

export const dateIsDisabled = (iso: string, min: string, max: string): boolean =>
  Boolean((min && iso < min) || (max && iso > max));

export const calendarDays = (
  month: Date,
  min: string,
  max: string,
  weekStartsOn: number,
  today: string,
): readonly KrnCalendarDay[] => {
  const first = startOfMonth(month);
  const leadingDays = (first.getDay() - weekStartsOn + 7) % 7;
  const gridStart = new Date(first.getFullYear(), first.getMonth(), 1 - leadingDays);
  const currentMonth = first.getMonth();
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

export const initialCalendarMonth = (value: string, referenceDate: Date): Date =>
  startOfMonth(parseIsoDate(value) ?? referenceDate);

export const clampCalendarMonth = (value: Date, min: string, max: string): Date => {
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

export const canMoveCalendarMonth = (
  month: Date,
  amount: number,
  min: string,
  max: string,
): boolean => {
  const candidate = addMonths(month, amount);
  const candidateEnd = new Date(candidate.getFullYear(), candidate.getMonth() + 1, 0);
  const minDate = parseIsoDate(min);
  const maxDate = parseIsoDate(max);
  return !((minDate && candidateEnd < minDate) || (maxDate && candidate > maxDate));
};

export const clampWeekStartsOn = (value: unknown): number => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.min(6, Math.max(0, Math.trunc(numeric))) : 0;
};

const formatter = (locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat => {
  try {
    return new Intl.DateTimeFormat(locale, options);
  } catch {
    return new Intl.DateTimeFormat('en-US', options);
  }
};

export const formatDate = (value: string, locale: string): string => {
  const date = parseIsoDate(value);
  return date
    ? formatter(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
    : '';
};

export const formatFullDate = (value: Date, locale: string): string =>
  formatter(locale, {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
    year: 'numeric',
  }).format(value);

export const formatMonth = (value: Date, locale: string): string =>
  formatter(locale, { month: 'long', year: 'numeric' }).format(value);

export const weekdayLabels = (locale: string, weekStartsOn: number): readonly string[] => {
  const weekdayFormatter = formatter(locale, { weekday: 'short' });
  const sunday = new Date(2024, 0, 7);
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(sunday);
    day.setDate(sunday.getDate() + ((weekStartsOn + index) % 7));
    return weekdayFormatter.format(day);
  });
};

const addDays = (value: Date, amount: number): Date =>
  new Date(value.getFullYear(), value.getMonth(), value.getDate() + amount);

const addCalendarMonths = (value: Date, amount: number): Date => {
  const targetMonth = new Date(value.getFullYear(), value.getMonth() + amount, 1);
  const lastDay = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0).getDate();
  return new Date(
    targetMonth.getFullYear(),
    targetMonth.getMonth(),
    Math.min(value.getDate(), lastDay),
  );
};

export const dateForCalendarKey = (
  value: Date,
  key: string,
  shiftKey: boolean,
  weekStartsOn: number,
): Date | null => {
  switch (key) {
    case 'ArrowLeft':
      return addDays(value, -1);
    case 'ArrowRight':
      return addDays(value, 1);
    case 'ArrowUp':
      return addDays(value, -7);
    case 'ArrowDown':
      return addDays(value, 7);
    case 'Home':
      return addDays(value, -((value.getDay() - weekStartsOn + 7) % 7));
    case 'End':
      return addDays(value, 6 - ((value.getDay() - weekStartsOn + 7) % 7));
    case 'PageUp':
      return addCalendarMonths(value, shiftKey ? -12 : -1);
    case 'PageDown':
      return addCalendarMonths(value, shiftKey ? 12 : 1);
    default:
      return null;
  }
};

export const clampDate = (value: Date, min: string, max: string): Date => {
  const iso = toIsoDate(value);
  const minimum = parseIsoDate(min);
  const maximum = parseIsoDate(max);
  if (minimum && iso < min) {
    return minimum;
  }
  if (maximum && iso > max) {
    return maximum;
  }
  return value;
};
