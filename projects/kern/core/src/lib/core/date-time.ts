import { inject, InjectionToken, makeStateKey, TransferState } from '@angular/core';

import { KRN_PLATFORM } from '@kern-ui/angular/cdk';

/**
 * Immutable date/time seed captured once for an application injector.
 *
 * Server rendering transfers the same reference to the hydrating browser so
 * date-only defaults cannot change with the browser's local time zone during
 * hydration. The seed fields retain server semantics; `todayAt` uses the time
 * zone of the runtime that materialized this token.
 */
export interface KrnDateTimeSnapshot {
  /** Epoch milliseconds returned by the configured Kern platform clock. */
  readonly now: number;
  /** Seed IANA time-zone identifier used to derive the transferred `today`. */
  readonly timeZone: string;
  /** Calendar date at `now` in `timeZone`, formatted as `YYYY-MM-DD`. */
  readonly today: string;
  /** Derives a calendar date for a live epoch in the active runtime time zone. */
  readonly todayAt: (now: number) => string;
}

type KrnDateTimeSeed = Omit<KrnDateTimeSnapshot, 'todayAt'>;

const KRN_DATE_TIME_TRANSFER_KEY = makeStateKey<KrnDateTimeSeed>('kern-date-time-snapshot-v1');

const isDateTimeSeed = (value: unknown): value is KrnDateTimeSeed => {
  if (!value || typeof value !== 'object') return false;
  const snapshot = value as Partial<KrnDateTimeSeed>;
  return (
    typeof snapshot.now === 'number' &&
    Number.isFinite(snapshot.now) &&
    typeof snapshot.timeZone === 'string' &&
    snapshot.timeZone.length > 0 &&
    typeof snapshot.today === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/u.test(snapshot.today)
  );
};

const resolveTimeZone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
};

const createCalendarDateResolver = (timeZone: string): ((now: number) => string) => {
  let formatter: Intl.DateTimeFormat | null = null;
  try {
    formatter = new Intl.DateTimeFormat('en-US-u-ca-iso8601-nu-latn', {
      day: '2-digit',
      month: '2-digit',
      timeZone,
      year: 'numeric',
    });
  } catch {
    // A standards-conforming runtime is expected, but UTC remains deterministic.
  }

  return (now: number): string => {
    if (formatter) {
      try {
        const parts = formatter.formatToParts(new Date(now));
        const part = (type: Intl.DateTimeFormatPartTypes): string =>
          parts.find((candidate) => candidate.type === type)?.value ?? '';
        const year = part('year');
        const month = part('month');
        const day = part('day');
        if (year && month && day) return `${year}-${month}-${day}`;
      } catch {
        // Fall through to the deterministic UTC representation.
      }
    }

    return new Date(now).toISOString().slice(0, 10);
  };
};

const calendarDate = (now: number, timeZone: string): string =>
  createCalendarDateResolver(timeZone)(now);

const materializeDateTimeSnapshot = (
  seed: KrnDateTimeSeed,
  liveTimeZone: string,
): Readonly<KrnDateTimeSnapshot> => {
  const resolveLiveDate = createCalendarDateResolver(liveTimeZone);
  return Object.freeze({
    ...seed,
    todayAt: (now: number): string => {
      if (!Number.isFinite(now)) {
        throw new Error('KRN_PLATFORM.now() must return finite epoch milliseconds.');
      }
      return resolveLiveDate(now);
    },
  });
};

const createDateTimeSnapshot = (): Readonly<KrnDateTimeSnapshot> => {
  const platform = inject(KRN_PLATFORM);
  const transferState = inject(TransferState);

  const transferred = transferState.get<KrnDateTimeSeed | null>(KRN_DATE_TIME_TRANSFER_KEY, null);
  if (isDateTimeSeed(transferred)) {
    return materializeDateTimeSnapshot(
      transferred,
      platform.isBrowser ? resolveTimeZone() : transferred.timeZone,
    );
  }

  const now = platform.now();
  if (!Number.isFinite(now)) {
    throw new Error('KRN_PLATFORM.now() must return finite epoch milliseconds.');
  }

  const timeZone = resolveTimeZone();
  const seed = Object.freeze({
    now,
    timeZone,
    today: calendarDate(now, timeZone),
  });

  // TransferState is deliberately append-only here. A second Angular root or a
  // separately evaluated Kern bundle must observe the same seed instead of
  // falling back to its own clock after the first browser reader.
  transferState.set(KRN_DATE_TIME_TRANSFER_KEY, seed);
  return materializeDateTimeSnapshot(seed, timeZone);
};

/**
 * The deterministic hydration seed used by date-only controls. Controls derive
 * live client dates through `todayAt` after their first hydrated render.
 * Override this token in a child injector for an explicitly scoped clock.
 */
export const KRN_DATE_TIME_SNAPSHOT = new InjectionToken<Readonly<KrnDateTimeSnapshot>>(
  'KRN_DATE_TIME_SNAPSHOT',
  {
    providedIn: 'root',
    factory: createDateTimeSnapshot,
  },
);
