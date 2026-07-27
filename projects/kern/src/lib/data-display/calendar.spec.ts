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

    expect(fixture.componentInstance.days()).toHaveLength(42);
    expect(fixture.componentInstance.days().find((day) => day.iso === '2026-07-14')?.disabled).toBe(
      true,
    );
    expect(fixture.componentInstance.monthLabel()).toContain('2026');
  });

  it('selects an enabled date through its public model', async () => {
    await TestBed.configureTestingModule({ imports: [KrnCalendar] }).compileComponents();
    const fixture = TestBed.createComponent(KrnCalendar);
    fixture.componentRef.setInput('activeMonth', '2026-07');
    await fixture.whenStable();

    const day = fixture.componentInstance
      .days()
      .find((candidate) => candidate.iso === '2026-07-20');
    expect(day).toBeTruthy();
    fixture.componentInstance.select(day!);
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
});
