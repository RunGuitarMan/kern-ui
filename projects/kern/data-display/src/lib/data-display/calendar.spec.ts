import { TestBed } from '@angular/core/testing';

import { KrnCalendar } from './calendar';

describe('KrnCalendar', () => {
  it('builds a deterministic six-week grid and respects blocked dates', async () => {
    await TestBed.configureTestingModule({ imports: [KrnCalendar] }).compileComponents();
    const fixture = TestBed.createComponent(KrnCalendar);
    fixture.componentRef.setInput('activeMonth', '2026-07');
    fixture.componentRef.setInput('today', '2026-07-26');
    fixture.componentRef.setInput('disabledDates', new Set(['2026-07-14']));
    await fixture.whenStable();

    const days = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>(
      '[role="gridcell"]',
    );
    expect(days).toHaveLength(42);
    const grid = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('[role="grid"]');
    const rowGroup = grid?.querySelector<HTMLElement>('[role="rowgroup"]');
    expect(grid?.firstElementChild?.getAttribute('role')).toBe('row');
    expect(rowGroup?.querySelectorAll(':scope > [role="row"]')).toHaveLength(6);
    expect([...days].every((day) => day.parentElement?.getAttribute('role') === 'row')).toBe(true);
    expect(
      (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
        '[data-date="2026-07-14"]',
      )?.disabled,
    ).toBe(true);
    expect(
      fixture.nativeElement.querySelector('[role="grid"]')?.getAttribute('aria-label'),
    ).toContain('2026');
  });

  it('selects an enabled date through its public model', async () => {
    await TestBed.configureTestingModule({ imports: [KrnCalendar] }).compileComponents();
    const fixture = TestBed.createComponent(KrnCalendar);
    fixture.componentRef.setInput('activeMonth', '2026-07');
    await fixture.whenStable();

    const day = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '[data-date="2026-07-20"]',
    );
    expect(day).toBeTruthy();
    day!.click();
    expect(fixture.componentInstance.value()).toBe('2026-07-20');
  });

  it('keeps one enabled day in the tab order when no focused date is supplied', async () => {
    await TestBed.configureTestingModule({ imports: [KrnCalendar] }).compileComponents();
    const fixture = TestBed.createComponent(KrnCalendar);
    fixture.componentRef.setInput('activeMonth', '2026-07');
    await fixture.whenStable();

    const tabbableDays = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>(
      '[role="gridcell"][tabindex="0"]',
    );
    expect(tabbableDays).toHaveLength(1);
    expect(tabbableDays[0]?.dataset['date']).toBe('2026-07-01');
  });

  it('moves roving focus by day and month without selecting a value', async () => {
    await TestBed.configureTestingModule({ imports: [KrnCalendar] }).compileComponents();
    const fixture = TestBed.createComponent(KrnCalendar);
    fixture.componentRef.setInput('activeMonth', '2026-07');
    fixture.componentRef.setInput('focusedDate', '2026-07-15');
    await fixture.whenStable();

    const julyFifteenth = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '[data-date="2026-07-15"]',
    );
    julyFifteenth?.focus();
    julyFifteenth?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowRight' }),
    );
    await fixture.whenStable();

    expect(fixture.componentInstance.focusedDate()).toBe('2026-07-16');
    expect(fixture.componentInstance.value()).toBe('');
    expect((document.activeElement as HTMLElement | null)?.dataset['date']).toBe('2026-07-16');

    const julySixteenth = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '[data-date="2026-07-16"]',
    );
    julySixteenth?.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'PageDown' }));
    await fixture.whenStable();

    expect(fixture.componentInstance.activeMonth()).toBe('2026-08');
    expect(fixture.componentInstance.focusedDate()).toBe('2026-08-16');
    expect(fixture.componentInstance.value()).toBe('');
  });

  it('skips disabled dates during keyboard navigation and guards stale selections', async () => {
    await TestBed.configureTestingModule({ imports: [KrnCalendar] }).compileComponents();
    const fixture = TestBed.createComponent(KrnCalendar);
    fixture.componentRef.setInput('activeMonth', '2026-07');
    fixture.componentRef.setInput('focusedDate', '2026-07-13');
    fixture.componentRef.setInput('disabledDates', new Set(['2026-07-14', '2026-07-15']));
    const selected = vi.fn();
    fixture.componentInstance.dateSelected.subscribe(selected);
    await fixture.whenStable();

    const julyThirteenth = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '[data-date="2026-07-13"]',
    );
    julyThirteenth?.focus();
    julyThirteenth?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowRight' }),
    );
    await fixture.whenStable();

    expect(fixture.componentInstance.focusedDate()).toBe('2026-07-16');
    expect((document.activeElement as HTMLElement | null)?.dataset['date']).toBe('2026-07-16');

    const staleJulySeventeenth = (
      fixture.nativeElement as HTMLElement
    ).querySelector<HTMLButtonElement>('[data-date="2026-07-17"]');
    fixture.componentRef.setInput(
      'disabledDates',
      new Set(['2026-07-14', '2026-07-15', '2026-07-17']),
    );
    staleJulySeventeenth?.click();
    await fixture.whenStable();

    expect(fixture.componentInstance.value()).toBe('');
    expect(selected).not.toHaveBeenCalled();
  });

  it('moves the roving tab stop when the focused date becomes disabled dynamically', async () => {
    await TestBed.configureTestingModule({ imports: [KrnCalendar] }).compileComponents();
    const fixture = TestBed.createComponent(KrnCalendar);
    fixture.componentRef.setInput('activeMonth', '2026-07');
    fixture.componentRef.setInput('focusedDate', '2026-07-13');
    await fixture.whenStable();

    fixture.componentRef.setInput('disabledDates', new Set(['2026-07-13']));
    await fixture.whenStable();

    const tabStops = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>(
      '[role="gridcell"][tabindex="0"]',
    );
    expect(tabStops).toHaveLength(1);
    expect(tabStops[0]?.disabled).toBe(false);
    expect(tabStops[0]?.dataset['date']).not.toBe('2026-07-13');
  });

  it('clamps PageDown to the last real day of a shorter month', async () => {
    await TestBed.configureTestingModule({ imports: [KrnCalendar] }).compileComponents();
    const fixture = TestBed.createComponent(KrnCalendar);
    fixture.componentRef.setInput('activeMonth', '2026-01');
    fixture.componentRef.setInput('focusedDate', '2026-01-31');
    await fixture.whenStable();

    const januaryThirtyFirst = (
      fixture.nativeElement as HTMLElement
    ).querySelector<HTMLButtonElement>('[data-date="2026-01-31"]');
    januaryThirtyFirst?.focus();
    januaryThirtyFirst?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'PageDown' }),
    );
    await fixture.whenStable();

    expect(fixture.componentInstance.activeMonth()).toBe('2026-02');
    expect(fixture.componentInstance.focusedDate()).toBe('2026-02-28');
    expect((document.activeElement as HTMLElement | null)?.dataset['date']).toBe('2026-02-28');
  });

  it('localizes navigation copy through a typed labels contract', async () => {
    await TestBed.configureTestingModule({ imports: [KrnCalendar] }).compileComponents();
    const fixture = TestBed.createComponent(KrnCalendar);
    fixture.componentRef.setInput('activeMonth', '2026-07');
    fixture.componentRef.setInput('today', '2026-07-26');
    fixture.componentRef.setInput('labels', {
      previousMonth: 'Предыдущий месяц',
      nextMonth: 'Следующий месяц',
      today: 'Сегодня',
    });
    await fixture.whenStable();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('[aria-label="Предыдущий месяц"]')).toBeTruthy();
    expect(host.querySelector('.today-action')?.textContent?.trim()).toBe('Сегодня');
  });

  it('disables the today action while today is outside the selectable range or blocked', async () => {
    await TestBed.configureTestingModule({ imports: [KrnCalendar] }).compileComponents();
    const fixture = TestBed.createComponent(KrnCalendar);
    const selected = vi.fn();
    fixture.componentInstance.dateSelected.subscribe(selected);
    fixture.componentRef.setInput('activeMonth', '2026-07');
    fixture.componentRef.setInput('today', '2026-07-26');
    fixture.componentRef.setInput('min', '2026-07-27');
    await fixture.whenStable();

    const todayAction = (): HTMLButtonElement => {
      const button = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
        '.today-action',
      );
      if (!button) throw new Error('Expected the today action');
      return button;
    };

    expect(todayAction().disabled).toBe(true);
    todayAction().click();
    expect(fixture.componentInstance.value()).toBe('');
    expect(selected).not.toHaveBeenCalled();

    fixture.componentRef.setInput('min', '');
    fixture.componentRef.setInput('disabledDates', new Set(['2026-07-26']));
    await fixture.whenStable();
    expect(todayAction().disabled).toBe(true);

    fixture.componentRef.setInput('disabledDates', new Set());
    await fixture.whenStable();
    expect(todayAction().disabled).toBe(false);
    todayAction().click();

    expect(fixture.componentInstance.value()).toBe('2026-07-26');
    expect(selected).toHaveBeenCalledTimes(1);
    expect(selected).toHaveBeenCalledWith('2026-07-26');
  });

  it('guards month navigation that has no selectable date and preserves the roving tab stop', async () => {
    await TestBed.configureTestingModule({ imports: [KrnCalendar] }).compileComponents();
    const fixture = TestBed.createComponent(KrnCalendar);
    fixture.componentRef.setInput('activeMonth', '2026-07');
    fixture.componentRef.setInput('min', '2026-07-27');
    await fixture.whenStable();

    const host = fixture.nativeElement as HTMLElement;
    const previous = host.querySelector<HTMLButtonElement>('[aria-label="Previous month"]');
    expect(previous?.disabled).toBe(true);
    previous?.click();
    (
      fixture.componentInstance as unknown as {
        moveMonth(amount: number): void;
      }
    ).moveMonth(-1);
    fixture.detectChanges();

    expect(fixture.componentInstance.activeMonth()).toBe('2026-07');
    expect(host.querySelectorAll('[role="gridcell"][tabindex="0"]')).toHaveLength(1);

    fixture.componentRef.setInput('min', '');
    fixture.componentRef.setInput('max', '2026-07-27');
    await fixture.whenStable();
    const next = host.querySelector<HTMLButtonElement>('[aria-label="Next month"]');
    expect(next?.disabled).toBe(true);
  });

  it('normalizes an out-of-range active month to the first reachable month', async () => {
    await TestBed.configureTestingModule({ imports: [KrnCalendar] }).compileComponents();
    const fixture = TestBed.createComponent(KrnCalendar);
    fixture.componentRef.setInput('activeMonth', '2026-01');
    fixture.componentRef.setInput('min', '2026-07-01');
    await fixture.whenStable();

    const host = fixture.nativeElement as HTMLElement;
    expect(fixture.componentInstance.activeMonth()).toBe('2026-07');
    expect(host.querySelector('.header strong')?.textContent).toContain('2026');
    expect(host.querySelector<HTMLButtonElement>('[data-date="2026-07-01"]')?.tabIndex).toBe(0);
    expect(host.querySelectorAll('[role="gridcell"][tabindex="0"]')).toHaveLength(1);
  });

  it('skips a fully blocked intermediate month without trapping navigation', async () => {
    await TestBed.configureTestingModule({ imports: [KrnCalendar] }).compileComponents();
    const fixture = TestBed.createComponent(KrnCalendar);
    fixture.componentRef.setInput('activeMonth', '2026-01');
    fixture.componentRef.setInput(
      'disabledDates',
      new Set(
        Array.from({ length: 28 }, (_, index) => `2026-02-${`${index + 1}`.padStart(2, '0')}`),
      ),
    );
    await fixture.whenStable();

    const next = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '[aria-label="Next month"]',
    );
    expect(next?.disabled).toBe(false);
    next?.click();
    await fixture.whenStable();

    expect(fixture.componentInstance.activeMonth()).toBe('2026-03');
    expect(fixture.componentInstance.focusedDate()).toBe('2026-03-01');
  });

  it('keeps partial boundary months reachable in both directions', async () => {
    await TestBed.configureTestingModule({ imports: [KrnCalendar] }).compileComponents();
    const fixture = TestBed.createComponent(KrnCalendar);
    fixture.componentRef.setInput('activeMonth', '2026-08');
    fixture.componentRef.setInput('min', '2026-07-27');
    await fixture.whenStable();

    const host = fixture.nativeElement as HTMLElement;
    const previous = host.querySelector<HTMLButtonElement>('[aria-label="Previous month"]');
    expect(previous?.disabled).toBe(false);
    previous?.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.activeMonth()).toBe('2026-07');
    expect(fixture.componentInstance.focusedDate()).toBe('2026-07-27');

    fixture.componentRef.setInput('min', '');
    fixture.componentRef.setInput('activeMonth', '2026-07');
    fixture.componentRef.setInput('max', '2026-08-03');
    await fixture.whenStable();
    const next = host.querySelector<HTMLButtonElement>('[aria-label="Next month"]');
    expect(next?.disabled).toBe(false);
    next?.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.activeMonth()).toBe('2026-08');
    expect(fixture.componentInstance.focusedDate()).toBe('2026-08-01');
  });

  it('restores focus after selecting an outside-month grid cell', async () => {
    await TestBed.configureTestingModule({ imports: [KrnCalendar] }).compileComponents();
    const fixture = TestBed.createComponent(KrnCalendar);
    fixture.componentRef.setInput('activeMonth', '2026-07');
    await fixture.whenStable();

    const outsideDay = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '[data-date="2026-08-08"]',
    );
    outsideDay?.focus();
    outsideDay?.click();
    await fixture.whenStable();

    expect(fixture.componentInstance.activeMonth()).toBe('2026-08');
    expect(fixture.componentInstance.value()).toBe('2026-08-08');
    expect((document.activeElement as HTMLElement | null)?.dataset['date']).toBe('2026-08-08');
  });

  it('keeps an aria-disabled grid cell focusable when the configured range has no enabled date', async () => {
    await TestBed.configureTestingModule({ imports: [KrnCalendar] }).compileComponents();
    const fixture = TestBed.createComponent(KrnCalendar);
    fixture.componentRef.setInput('activeMonth', '2026-07');
    fixture.componentRef.setInput('min', '2026-07-15');
    fixture.componentRef.setInput('max', '2026-07-15');
    fixture.componentRef.setInput('disabledDates', new Set(['2026-07-15']));
    await fixture.whenStable();

    const tabStops = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>(
      '[role="gridcell"][tabindex="0"]',
    );
    expect(tabStops).toHaveLength(1);
    expect(tabStops[0]?.dataset['date']).toBe('2026-07-15');
    expect(tabStops[0]?.getAttribute('aria-disabled')).toBe('true');
    expect(tabStops[0]?.disabled).toBe(false);
  });

  it('rejects an inverted selectable range', async () => {
    await TestBed.configureTestingModule({ imports: [KrnCalendar] }).compileComponents();
    const fixture = TestBed.createComponent(KrnCalendar);
    fixture.componentRef.setInput('activeMonth', '2026-07');
    fixture.componentRef.setInput('min', '2026-07-20');
    fixture.componentRef.setInput('max', '2026-07-10');

    expect(() => fixture.detectChanges()).toThrowError(
      'KrnCalendar requires min (2026-07-20) to be on or before max (2026-07-10).',
    );
  });

  it('rejects a calendar-shaped but impossible today value', async () => {
    await TestBed.configureTestingModule({ imports: [KrnCalendar] }).compileComponents();
    const fixture = TestBed.createComponent(KrnCalendar);
    const selected = vi.fn();
    fixture.componentInstance.dateSelected.subscribe(selected);
    fixture.componentRef.setInput('activeMonth', '2026-02');
    fixture.componentRef.setInput('today', '2026-02-31');
    await fixture.whenStable();

    const action = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '.today-action',
    );
    expect(action?.disabled).toBe(true);
    action?.click();
    expect(fixture.componentInstance.value()).toBe('');
    expect(selected).not.toHaveBeenCalled();
  });
});
