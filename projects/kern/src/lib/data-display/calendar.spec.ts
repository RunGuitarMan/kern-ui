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
    expect(fixture.componentInstance.days().find((day) => day.iso === '2026-07-14')?.disabled).toBe(true);
    expect(fixture.componentInstance.monthLabel()).toContain('2026');
  });

  it('selects an enabled date through its public model', async () => {
    await TestBed.configureTestingModule({ imports: [KrnCalendar] }).compileComponents();
    const fixture = TestBed.createComponent(KrnCalendar);
    fixture.componentRef.setInput('activeMonth', '2026-07');
    await fixture.whenStable();

    const day = fixture.componentInstance.days().find((candidate) => candidate.iso === '2026-07-20');
    expect(day).toBeTruthy();
    fixture.componentInstance.select(day!);
    expect(fixture.componentInstance.value()).toBe('2026-07-20');
  });
});
