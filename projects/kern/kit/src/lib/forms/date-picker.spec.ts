import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KRN_DATE_TIME_SNAPSHOT, type KrnDateTimeSnapshot } from '@kern-ui/angular/core';
import { KrnDatePicker } from './date-time-controls';

const SCOPED_DATE_TIME: Readonly<KrnDateTimeSnapshot> = Object.freeze({
  now: Date.UTC(2040, 5, 1, 12),
  timeZone: 'UTC',
  today: '2040-06-01',
  todayAt: () => '2040-06-02',
});

@Component({
  imports: [KrnDatePicker],
  providers: [{ provide: KRN_DATE_TIME_SNAPSHOT, useValue: SCOPED_DATE_TIME }],
  template: `<krn-date-picker [open]="true" />`,
})
class ScopedDatePickerHost {}

@Component({
  imports: [KrnDatePicker],
  template: `
    <span id="date-label">Launch date</span>
    <span id="date-help">Choose an available day.</span>
    <krn-date-picker
      id="launch-date"
      ariaLabel="Fallback date"
      ariaDescribedBy="date-help"
      ariaLabelledBy="date-label"
      tabindex="2"
      today="2026-07-15"
      [disabled]="disabled()"
      [open]="open()"
      [value]="value()"
      (openChange)="open.set($event)"
      (valueChange)="value.set($event)"
    />
  `,
})
class DatePickerHost {
  readonly disabled = signal(false);
  readonly open = signal(true);
  readonly value = signal('2026-07-20');
  readonly picker = viewChild.required(KrnDatePicker);
}

describe('KrnDatePicker', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('uses the current day after creation and refreshes a mounted calendar after rollover', async () => {
    const dateNow = vi.spyOn(Date, 'now').mockReturnValue(Date.UTC(2026, 0, 1, 12));
    const snapshot = TestBed.inject(KRN_DATE_TIME_SNAPSHOT);
    const currentNow = Date.UTC(2026, 0, 4, 12);
    dateNow.mockReturnValue(currentNow);

    const fixture = TestBed.createComponent(KrnDatePicker);
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(snapshot.todayAt(currentNow)).not.toBe(snapshot.today);
    expect(
      (fixture.nativeElement.querySelector('[data-today="true"]') as HTMLElement).dataset['date'],
    ).toBe(snapshot.todayAt(currentNow));

    const rolloverNow = Date.UTC(2026, 0, 7, 12);
    dateNow.mockReturnValue(rolloverNow);
    fixture.nativeElement.ownerDocument.defaultView.dispatchEvent(new Event('focus'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(
      (fixture.nativeElement.querySelector('[data-today="true"]') as HTMLElement).dataset['date'],
    ).toBe(snapshot.todayAt(rolloverNow));
  });

  it('keeps a child-injector clock override for the live date after first render', async () => {
    const fixture = TestBed.createComponent(ScopedDatePickerHost);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(
      (fixture.nativeElement.querySelector('[data-today="true"]') as HTMLElement).dataset['date'],
    ).toBe('2040-06-02');
  });

  it('owns a standalone value, supports controlled open, and emits only accepted dates', async () => {
    const fixture = TestBed.createComponent(DatePickerHost);
    await fixture.whenStable();
    const host = fixture.componentInstance;
    const component = host.picker();
    const valueChange = vi.fn();
    component.valueChange.subscribe(valueChange);

    const selected = fixture.nativeElement.querySelector(
      '[data-date="2026-07-20"]',
    ) as HTMLButtonElement;
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).not.toBeNull();
    expect(selected.getAttribute('aria-selected')).toBe('true');
    expect(selected.ownerDocument.activeElement).toBe(selected);

    selected.click();
    await fixture.whenStable();
    expect(valueChange).not.toHaveBeenCalled();
    expect(host.open()).toBe(false);

    host.open.set(true);
    await fixture.whenStable();
    (fixture.nativeElement.querySelector('[data-date="2026-07-21"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(host.value()).toBe('2026-07-21');
    expect(valueChange).toHaveBeenCalledOnce();
    expect(valueChange).toHaveBeenLastCalledWith('2026-07-21');
    expect(host.open()).toBe(false);

    host.value.set('2026-07-22');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(
      (fixture.nativeElement.querySelector('.krn-picker__trigger') as HTMLButtonElement)
        .textContent,
    ).toContain('Jul 22, 2026');
  });

  it('composes external semantics and forwards tab and focus contracts', async () => {
    const fixture = TestBed.createComponent(DatePickerHost);
    fixture.componentInstance.open.set(false);
    await fixture.whenStable();
    const host = fixture.componentInstance;
    const component = host.picker();
    const trigger = fixture.nativeElement.querySelector(
      '.krn-picker__trigger',
    ) as HTMLButtonElement;

    expect(trigger.getAttribute('aria-label')).toBeNull();
    expect(trigger.getAttribute('aria-labelledby')).toBe('date-label');
    expect(trigger.getAttribute('aria-describedby')).toBe('date-help');
    expect(trigger.tabIndex).toBe(2);

    component.focus({ preventScroll: true });
    expect(trigger.ownerDocument.activeElement).toBe(trigger);
    component.blur();
    expect(trigger.ownerDocument.activeElement).not.toBe(trigger);

    host.disabled.set(true);
    await fixture.whenStable();
    expect(trigger.disabled).toBe(true);
    expect(trigger.tabIndex).toBe(-1);
  });

  it('preserves browser and consumer ownership of modified or cancelled calendar keys', async () => {
    const fixture = TestBed.createComponent(DatePickerHost);
    await fixture.whenStable();
    const selected = fixture.nativeElement.querySelector(
      '[data-date="2026-07-20"]',
    ) as HTMLButtonElement;
    const view = selected.ownerDocument.defaultView!;

    const modifiedArrow = new view.KeyboardEvent('keydown', {
      altKey: true,
      bubbles: true,
      cancelable: true,
      key: 'ArrowRight',
    });
    selected.dispatchEvent(modifiedArrow);
    expect(modifiedArrow.defaultPrevented).toBe(false);
    expect(selected.ownerDocument.activeElement).toBe(selected);

    const cancelledArrow = new view.KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'ArrowRight',
    });
    cancelledArrow.preventDefault();
    selected.dispatchEvent(cancelledArrow);
    expect(selected.ownerDocument.activeElement).toBe(selected);

    selected.dispatchEvent(
      new view.KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        key: 'ArrowRight',
      }),
    );
    await fixture.whenStable();
    expect((selected.ownerDocument.activeElement as HTMLElement).dataset['date']).toBe(
      '2026-07-21',
    );
  });

  it('does not let stale focus callbacks escape a rapid controlled reopen', async () => {
    const fixture = TestBed.createComponent(DatePickerHost);
    await fixture.whenStable();
    const host = fixture.componentInstance;
    const selected = fixture.nativeElement.querySelector(
      '[data-date="2026-07-20"]',
    ) as HTMLButtonElement;
    const view = selected.ownerDocument.defaultView!;

    selected.dispatchEvent(
      new view.KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        key: 'Escape',
      }),
    );
    expect(host.open()).toBe(false);
    fixture.detectChanges();
    host.open.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    const reopenedSelected = fixture.nativeElement.querySelector(
      '[data-date="2026-07-20"]',
    ) as HTMLButtonElement;
    expect(host.open()).toBe(true);
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).not.toBeNull();
    expect(reopenedSelected.ownerDocument.activeElement).toBe(reopenedSelected);
  });

  it('touches only after focus leaves the trigger and calendar composite', async () => {
    const fixture = TestBed.createComponent(KrnDatePicker);
    fixture.componentRef.setInput('today', '2026-07-15');
    fixture.componentInstance.writeValue('2026-07-20');
    const touched = vi.fn();
    fixture.componentInstance.registerOnTouched(touched);
    await fixture.whenStable();
    const component = fixture.componentInstance;
    const trigger = fixture.nativeElement.querySelector(
      '.krn-picker__trigger',
    ) as HTMLButtonElement;
    const view = trigger.ownerDocument.defaultView!;

    component.focus();
    trigger.click();
    await fixture.whenStable();
    const selected = fixture.nativeElement.querySelector(
      '[data-date="2026-07-20"]',
    ) as HTMLButtonElement;
    expect(selected.ownerDocument.activeElement).toBe(selected);
    expect(touched).not.toHaveBeenCalled();

    selected.dispatchEvent(
      new view.KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        key: 'Escape',
      }),
    );
    await fixture.whenStable();
    expect(trigger.ownerDocument.activeElement).toBe(trigger);
    expect(touched).not.toHaveBeenCalled();

    component.blur();
    expect(trigger.ownerDocument.activeElement).not.toBe(trigger);
    expect(touched).toHaveBeenCalledOnce();
  });
});
