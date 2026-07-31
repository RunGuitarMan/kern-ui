import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { KrnDateRangePicker } from './date-time-controls';
import type { KrnDateRangeValue } from './form-types';

@Component({
  imports: [KrnDateRangePicker],
  template: `
    <span id="range-label">Travel dates</span>
    <span id="range-help">Choose an available range.</span>
    <krn-date-range-picker
      id="travel-dates"
      ariaLabel="Fallback range"
      ariaDescribedBy="range-help range-help"
      ariaLabelledBy="range-label"
      tabindex="3"
      today="2026-07-15"
      [disabled]="disabled()"
      [open]="open()"
      [value]="value()"
      (openChange)="open.set($event)"
      (valueChange)="value.set($event)"
    />
  `,
})
class DateRangePickerHost {
  readonly disabled = signal(false);
  readonly open = signal(true);
  readonly value = signal<KrnDateRangeValue>({
    start: '2026-07-22',
    end: '2026-07-20',
  });
  readonly picker = viewChild.required(KrnDateRangePicker);
}

@Component({
  imports: [KrnDateRangePicker, ReactiveFormsModule],
  template: `<krn-date-range-picker [formControl]="control" />`,
})
class DateRangeValidationHost {
  readonly control = new FormControl<KrnDateRangeValue>(
    { start: '', end: '2026-07-22' },
    { nonNullable: true },
  );
}

describe('KrnDateRangePicker', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('normalizes standalone ranges and emits only structural user changes', async () => {
    const fixture = TestBed.createComponent(DateRangePickerHost);
    await fixture.whenStable();
    const host = fixture.componentInstance;
    const component = host.picker();
    const valueChange = vi.fn();
    component.valueChange.subscribe(valueChange);

    const start = fixture.nativeElement.querySelector(
      '[data-date="2026-07-20"]',
    ) as HTMLButtonElement;
    const end = fixture.nativeElement.querySelector(
      '[data-date="2026-07-22"]',
    ) as HTMLButtonElement;
    expect(start.getAttribute('data-range-start')).toBe('true');
    expect(end.getAttribute('data-range-end')).toBe('true');
    expect(end.ownerDocument.activeElement).toBe(end);

    (
      fixture.nativeElement.querySelector(
        '.krn-calendar__navigation button:last-child',
      ) as HTMLButtonElement
    ).click();
    await fixture.whenStable();
    const clear = fixture.nativeElement.querySelector(
      '.krn-picker__footer button:first-child',
    ) as HTMLButtonElement;
    clear.focus();
    clear.click();
    await fixture.whenStable();
    expect(host.value()).toEqual({ start: '', end: '' });
    expect(valueChange).toHaveBeenCalledOnce();
    expect(
      (fixture.nativeElement.querySelector('.krn-calendar__header strong') as HTMLElement)
        .textContent,
    ).toContain('August 2026');
    expect((clear.ownerDocument.activeElement as HTMLElement).dataset['date']).toBeUndefined();

    clear.dispatchEvent(
      new clear.ownerDocument.defaultView!.MouseEvent('click', { bubbles: true }),
    );
    await fixture.whenStable();
    expect(valueChange).toHaveBeenCalledOnce();

    host.value.set({ start: '', end: '2026-07-25' });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(
      (
        fixture.nativeElement.querySelector('[data-date="2026-07-25"]') as HTMLButtonElement
      ).getAttribute('data-range-start'),
    ).toBe('true');

    host.value.set({ start: '2026-07-24', end: '2026-07-23' });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(
      (fixture.nativeElement.querySelector('.krn-picker__trigger') as HTMLButtonElement)
        .textContent,
    ).toContain('Jul 23, 2026');

    const validationFixture = TestBed.createComponent(DateRangeValidationHost);
    await validationFixture.whenStable();
    expect(validationFixture.componentInstance.control.errors).toEqual({ dateRange: true });
  });

  it('composes external semantics and forwards tab and focus contracts', async () => {
    const fixture = TestBed.createComponent(DateRangePickerHost);
    fixture.componentInstance.open.set(false);
    await fixture.whenStable();
    const host = fixture.componentInstance;
    const component = host.picker();
    const trigger = fixture.nativeElement.querySelector(
      '.krn-picker__trigger',
    ) as HTMLButtonElement;

    expect(trigger.getAttribute('aria-label')).toBeNull();
    expect(trigger.getAttribute('aria-labelledby')).toBe('range-label');
    expect(trigger.getAttribute('aria-describedby')).toBe('range-help');
    expect(trigger.tabIndex).toBe(3);

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
    const fixture = TestBed.createComponent(DateRangePickerHost);
    await fixture.whenStable();
    const selected = fixture.nativeElement.querySelector(
      '[data-date="2026-07-22"]',
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
      '2026-07-23',
    );
  });

  it('does not let stale focus callbacks escape a rapid controlled reopen', async () => {
    const fixture = TestBed.createComponent(DateRangePickerHost);
    await fixture.whenStable();
    const host = fixture.componentInstance;
    const selected = fixture.nativeElement.querySelector(
      '[data-date="2026-07-22"]',
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

    const reopenedEnd = fixture.nativeElement.querySelector(
      '[data-date="2026-07-22"]',
    ) as HTMLButtonElement;
    expect(host.open()).toBe(true);
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).not.toBeNull();
    expect(reopenedEnd.ownerDocument.activeElement).toBe(reopenedEnd);
  });

  it('touches only after focus leaves the trigger and calendar composite', async () => {
    const fixture = TestBed.createComponent(KrnDateRangePicker);
    fixture.componentRef.setInput('today', '2026-07-15');
    fixture.componentInstance.writeValue({ start: '2026-07-20', end: '' });
    const touched = vi.fn();
    fixture.componentInstance.registerOnTouched(touched);
    await fixture.whenStable();
    const component = fixture.componentInstance;
    const trigger = fixture.nativeElement.querySelector(
      '.krn-picker__trigger',
    ) as HTMLButtonElement;

    component.focus();
    trigger.click();
    await fixture.whenStable();
    (fixture.nativeElement.querySelector('[data-date="2026-07-22"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(touched).not.toHaveBeenCalled();

    (
      fixture.nativeElement.querySelector(
        '.krn-picker__footer button:last-child',
      ) as HTMLButtonElement
    ).click();
    await fixture.whenStable();
    expect(trigger.ownerDocument.activeElement).toBe(trigger);
    expect(touched).not.toHaveBeenCalled();

    component.blur();
    expect(trigger.ownerDocument.activeElement).not.toBe(trigger);
    expect(touched).toHaveBeenCalledOnce();
  });
});
