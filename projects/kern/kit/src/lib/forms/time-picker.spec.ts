import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { KrnTimePicker } from './date-time-controls';
import { KrnFormField } from './form-field';

@Component({
  imports: [KrnFormField, KrnTimePicker],
  template: `
    <span id="external-time-label">External time name</span>
    <span id="external-time-help">External time help.</span>
    <krn-form-field label="Maintenance time" hint="Choose an allowed slot.">
      <krn-time-picker
        id="maintenance-time"
        ariaLabel="Fallback time"
        ariaDescribedBy="external-time-help"
        ariaLabelledBy="external-time-label"
        tabindex="3"
        [disabled]="disabled()"
        [max]="max()"
        [min]="min()"
        [open]="open()"
        [readonly]="readOnly()"
        [step]="step()"
        [value]="value()"
        (openChange)="open.set($event)"
        (valueChange)="value.set($event)"
      />
    </krn-form-field>
  `,
})
class TimePickerHost {
  readonly disabled = signal(false);
  readonly max = signal('18:00');
  readonly min = signal('06:00');
  readonly open = signal(true);
  readonly readOnly = signal(false);
  readonly step = signal(900);
  readonly value = signal('08:00');
  readonly picker = viewChild.required(KrnTimePicker);
}

const timeParts = (root: HTMLElement): readonly [HTMLInputElement, HTMLInputElement] => {
  const parts = [...root.querySelectorAll<HTMLInputElement>('[role="spinbutton"]')];
  if (!parts[0] || !parts[1]) {
    throw new Error('Expected both Time Picker spinbuttons.');
  }
  return [parts[0], parts[1]];
};

describe('KrnTimePicker', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('owns a standalone value, supports controlled open, and deduplicates accepted commits', async () => {
    const fixture = TestBed.createComponent(TimePickerHost);
    await fixture.whenStable();
    const host = fixture.componentInstance;
    const component = host.picker();
    const valueChange = vi.fn();
    component.valueChange.subscribe(valueChange);
    const [hour, minute] = timeParts(fixture.nativeElement);
    const view = hour.ownerDocument.defaultView!;

    expect(hour.value).toBe('08');
    expect(minute.value).toBe('00');
    expect(hour.ownerDocument.activeElement).toBe(hour);

    minute.dispatchEvent(
      new view.KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter' }),
    );
    await fixture.whenStable();
    expect(host.open()).toBe(false);
    expect(valueChange).not.toHaveBeenCalled();

    host.open.set(true);
    await fixture.whenStable();
    const [nextHour, nextMinute] = timeParts(fixture.nativeElement);
    nextHour.value = '09';
    nextHour.dispatchEvent(new view.Event('input', { bubbles: true }));
    nextMinute.value = '30';
    nextMinute.dispatchEvent(new view.Event('input', { bubbles: true }));
    nextMinute.dispatchEvent(
      new view.KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter' }),
    );
    await fixture.whenStable();

    expect(host.value()).toBe('09:30');
    expect(host.open()).toBe(false);
    expect(valueChange).toHaveBeenCalledOnce();
    expect(valueChange).toHaveBeenLastCalledWith('09:30');

    host.value.set('10:15');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(
      (fixture.nativeElement.querySelector('.krn-picker__trigger') as HTMLButtonElement)
        .textContent,
    ).toContain('10:15');
    expect(valueChange).toHaveBeenCalledOnce();
  });

  it('composes FormField and external semantics and forwards tab and focus contracts', async () => {
    const fixture = TestBed.createComponent(TimePickerHost);
    fixture.componentInstance.open.set(false);
    await fixture.whenStable();
    const host = fixture.componentInstance;
    const component = host.picker();
    const trigger = fixture.nativeElement.querySelector(
      '.krn-picker__trigger',
    ) as HTMLButtonElement;

    expect(trigger.getAttribute('aria-label')).toBeNull();
    expect(trigger.getAttribute('aria-labelledby')).toBe(
      'external-time-label maintenance-time-field-label',
    );
    expect(trigger.getAttribute('aria-describedby')).toBe(
      'external-time-help maintenance-time-hint',
    );
    expect(trigger.tabIndex).toBe(3);

    component.focus({ preventScroll: true });
    expect(trigger.ownerDocument.activeElement).toBe(trigger);
    component.blur();
    expect(trigger.ownerDocument.activeElement).not.toBe(trigger);

    host.readOnly.set(true);
    await fixture.whenStable();
    expect(trigger.disabled).toBe(false);
    expect(trigger.getAttribute('aria-disabled')).toBe('true');
    expect(trigger.tabIndex).toBe(3);

    host.disabled.set(true);
    await fixture.whenStable();
    expect(trigger.disabled).toBe(true);
    expect(trigger.tabIndex).toBe(-1);
  });

  it('validates canonical HH:mm values against min, max, and a min-anchored step', async () => {
    const fixture = TestBed.createComponent(KrnTimePicker);
    fixture.componentRef.setInput('min', '06:10');
    fixture.componentRef.setInput('max', '18:00');
    fixture.componentRef.setInput('step', 900);
    await fixture.whenStable();
    const component = fixture.componentInstance;

    expect(component.validate(new FormControl('06:10'))).toBeNull();
    expect(component.validate(new FormControl('06:25'))).toBeNull();
    expect(component.validate(new FormControl('06:20'))).toEqual({
      stepTime: { step: 900, actual: '06:20' },
    });
    expect(component.validate(new FormControl('06:25:00'))).toEqual({ time: true });
    expect(component.validate(new FormControl('05:55'))).toEqual({
      minTime: { min: '06:10', actual: '05:55' },
    });
    expect(component.validate(new FormControl('18:10'))).toEqual({
      maxTime: { max: '18:00', actual: '18:10' },
    });

    fixture.componentRef.setInput('min', '');
    fixture.componentRef.setInput('step', 90);
    await fixture.whenStable();
    expect(component.validate(new FormControl('00:03'))).toBeNull();
    expect(component.validate(new FormControl('00:01'))).toEqual({
      stepTime: { step: 90, actual: '00:01' },
    });
  });

  it('touches only after focus leaves the trigger and time-panel composite', async () => {
    const fixture = TestBed.createComponent(KrnTimePicker);
    fixture.componentInstance.writeValue('08:00');
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
    const [hour] = timeParts(fixture.nativeElement);
    expect(hour.ownerDocument.activeElement).toBe(hour);
    expect(touched).not.toHaveBeenCalled();

    hour.dispatchEvent(
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
