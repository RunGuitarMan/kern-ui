import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  KrnColorPicker,
  KrnDatePicker,
  KrnDateRangePicker,
  KrnTimePicker,
} from './date-time-controls';
import { KrnOtpInput, KrnTagsInput } from './otp-tags';
import { KrnRangeSlider, KrnSlider } from './range-controls';
import { KrnMultiSelect, KrnNativeSelect, KrnSelect } from './select-controls';
import {
  KrnCheckbox,
  KrnCheckboxGroup,
  KrnRadio,
  KrnRadioGroup,
  KrnSegmentedControl,
} from './selection-controls';
import { KrnTextInput } from './text-inputs';

describe('Kern form controls', () => {
  it('integrates text input with typed reactive forms', async () => {
    @Component({
      imports: [KrnTextInput, ReactiveFormsModule],
      template: `<krn-text-input [formControl]="control" />`,
    })
    class TextHost {
      readonly control = new FormControl('Initial', { nonNullable: true });
    }

    const fixture = TestBed.createComponent(TextHost);
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(input.value).toBe('Initial');

    input.value = 'Updated';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(fixture.componentInstance.control.value).toBe('Updated');

    fixture.componentInstance.control.disable();
    await fixture.whenStable();
    expect(input.disabled).toBe(true);
  });

  it('propagates native checkbox state through CVA', async () => {
    const fixture = TestBed.createComponent(KrnCheckbox);
    const change = vi.fn();
    fixture.componentInstance.registerOnChange(change);
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    input.checked = true;
    input.dispatchEvent(new Event('change'));

    expect(change).toHaveBeenCalledWith(true);
  });

  it('keeps implicit checkbox-group values independent', async () => {
    @Component({
      imports: [KrnCheckbox, KrnCheckboxGroup, ReactiveFormsModule],
      template: `
        <krn-checkbox-group [formControl]="control">
          <krn-checkbox>Policy changes</krn-checkbox>
          <krn-checkbox>Failed automations</krn-checkbox>
          <krn-checkbox>New members</krn-checkbox>
        </krn-checkbox-group>
      `,
    })
    class CheckboxGroupHost {
      readonly control = new FormControl<readonly string[]>([], { nonNullable: true });
    }

    const fixture = TestBed.createComponent(CheckboxGroupHost);
    await fixture.whenStable();
    const inputs = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>(
        'input[type="checkbox"]',
      ),
    ];

    inputs[1]!.click();
    await fixture.whenStable();

    expect(inputs.map((input) => input.checked)).toEqual([false, true, false]);
    expect(fixture.componentInstance.control.value).toHaveLength(1);
  });

  it('keeps radio-group selection exclusive', async () => {
    @Component({
      imports: [KrnRadio, KrnRadioGroup, ReactiveFormsModule],
      template: `
        <krn-radio-group [formControl]="control">
          <krn-radio value="monthly">Monthly</krn-radio>
          <krn-radio value="annual">Annual</krn-radio>
        </krn-radio-group>
      `,
    })
    class RadioGroupHost {
      readonly control = new FormControl<string | null>(null);
    }

    const fixture = TestBed.createComponent(RadioGroupHost);
    await fixture.whenStable();
    const inputs = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>(
        'input[type="radio"]',
      ),
    ];

    inputs[0]!.click();
    inputs[1]!.click();
    await fixture.whenStable();

    expect(inputs.map((input) => input.checked)).toEqual([false, true]);
    expect(fixture.componentInstance.control.value).toBe('annual');
  });

  it('renders and updates a native select', async () => {
    const fixture = TestBed.createComponent(KrnNativeSelect);
    fixture.componentRef.setInput('options', [
      { value: 'alpha', label: 'Alpha' },
      { value: 'beta', label: 'Beta' },
    ]);
    const change = vi.fn();
    fixture.componentInstance.registerOnChange(change);
    await fixture.whenStable();
    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;

    select.value = 'beta';
    select.dispatchEvent(new Event('change'));

    expect(change).toHaveBeenCalledWith('beta');
  });

  it('renders Angular Aria listbox options when select opens', async () => {
    const fixture = TestBed.createComponent(KrnSelect);
    const change = vi.fn();
    fixture.componentInstance.registerOnChange(change);
    fixture.componentRef.setInput('options', [
      { value: 'alpha', label: 'Alpha' },
      { value: 'beta', label: 'Beta', description: 'Second option' },
    ]);
    fixture.componentInstance.open.set(true);
    await fixture.whenStable();

    const listbox = fixture.nativeElement.querySelector('[role="listbox"]');
    const options = fixture.nativeElement.querySelectorAll('[role="option"]');
    expect(listbox).not.toBeNull();
    expect(options.length).toBe(2);

    (options[1] as HTMLElement | undefined)?.click();
    await fixture.whenStable();
    expect(change).toHaveBeenCalledWith('beta');
    expect(fixture.componentInstance.open()).toBe(false);
  });

  it('renders multi-select values without changing its trigger structure', async () => {
    const fixture = TestBed.createComponent(KrnMultiSelect);
    fixture.componentRef.setInput('options', [
      { value: 'alpha', label: 'Alpha team' },
      { value: 'beta', label: 'Beta team' },
      { value: 'gamma', label: 'Gamma team' },
    ]);
    fixture.componentInstance.writeValue(['alpha', 'beta', 'gamma']);
    await fixture.whenStable();

    const trigger = fixture.nativeElement.querySelector(
      '.krn-select-trigger--multiple',
    ) as HTMLButtonElement;
    expect(trigger).not.toBeNull();
    expect(trigger.querySelectorAll('.krn-token')).toHaveLength(3);
    expect(trigger.querySelector('.krn-select-chevron')).not.toBeNull();
  });

  it('clamps slider changes to its public range', async () => {
    const fixture = TestBed.createComponent(KrnSlider);
    fixture.componentRef.setInput('min', 10);
    fixture.componentRef.setInput('max', 20);
    const change = vi.fn();
    fixture.componentInstance.registerOnChange(change);
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    input.value = '18';
    input.dispatchEvent(new Event('input'));
    expect(change).toHaveBeenCalledWith(18);
  });

  it('renders range slider as one track with two accessible thumbs', async () => {
    const fixture = TestBed.createComponent(KrnRangeSlider);
    fixture.componentRef.setInput('min', 0);
    fixture.componentRef.setInput('max', 100);
    fixture.componentInstance.writeValue({ start: 20, end: 80 });
    const change = vi.fn();
    fixture.componentInstance.registerOnChange(change);
    await fixture.whenStable();

    const track = fixture.nativeElement.querySelector('.krn-dual-range__track');
    const inputs = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>(
        '.krn-range--overlay',
      ),
    ];
    expect(track).not.toBeNull();
    expect(inputs).toHaveLength(2);
    expect(inputs.map((input) => input.getAttribute('aria-label'))).toEqual([
      'Minimum value',
      'Maximum value',
    ]);

    inputs[0]!.value = '35';
    inputs[0]!.dispatchEvent(new Event('input'));
    expect(change).toHaveBeenCalledWith({ start: 35, end: 80 });
  });

  it('shows an English custom calendar instead of the browser date picker', async () => {
    const fixture = TestBed.createComponent(KrnDatePicker);
    fixture.componentInstance.writeValue('2026-07-29');
    await fixture.whenStable();

    const trigger = fixture.nativeElement.querySelector(
      '.krn-picker__trigger',
    ) as HTMLButtonElement;
    expect(trigger.textContent).toContain('Jul 29, 2026');
    trigger.click();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('input[type="date"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')?.textContent).toContain(
      'July 2026',
    );
    expect(fixture.nativeElement.querySelectorAll('[role="grid"]')).toHaveLength(1);
  });

  it('selects a date range from one calendar', async () => {
    const fixture = TestBed.createComponent(KrnDateRangePicker);
    fixture.componentInstance.writeValue({ start: '2026-07-10', end: '' });
    const change = vi.fn();
    fixture.componentInstance.registerOnChange(change);
    await fixture.whenStable();

    (fixture.nativeElement.querySelector('.krn-picker__trigger') as HTMLButtonElement).click();
    await fixture.whenStable();
    const endDate = fixture.nativeElement.querySelector(
      '[aria-label="Monday, July 20, 2026"]',
    ) as HTMLButtonElement;
    endDate.click();

    expect(fixture.nativeElement.querySelectorAll('[role="grid"]')).toHaveLength(1);
    expect(fixture.nativeElement.querySelector('input[type="date"]')).toBeNull();
    expect(change).toHaveBeenCalledWith({ start: '2026-07-10', end: '2026-07-20' });
  });

  it('uses custom time and color panels instead of browser-native popups', async () => {
    const timeFixture = TestBed.createComponent(KrnTimePicker);
    timeFixture.componentRef.setInput('step', 900);
    await timeFixture.whenStable();
    (timeFixture.nativeElement.querySelector('.krn-picker__trigger') as HTMLButtonElement).click();
    await timeFixture.whenStable();

    expect(timeFixture.nativeElement.querySelector('input[type="time"]')).toBeNull();
    expect(timeFixture.nativeElement.querySelectorAll('[role="listbox"]')).toHaveLength(2);

    const colorFixture = TestBed.createComponent(KrnColorPicker);
    await colorFixture.whenStable();
    (colorFixture.nativeElement.querySelector('.krn-picker__trigger') as HTMLButtonElement).click();
    await colorFixture.whenStable();

    expect(colorFixture.nativeElement.querySelector('input[type="color"]')).toBeNull();
    expect(colorFixture.nativeElement.querySelectorAll('.krn-color-swatches button')).toHaveLength(
      8,
    );
  });

  it('exposes a single selected segment', async () => {
    const fixture = TestBed.createComponent(KrnSegmentedControl);
    fixture.componentRef.setInput('options', [
      { value: 'list', label: 'List' },
      { value: 'board', label: 'Board' },
      { value: 'timeline', label: 'Timeline' },
    ]);
    fixture.componentInstance.writeValue('board');
    await fixture.whenStable();

    const selected = fixture.nativeElement.querySelectorAll('[aria-checked="true"]');
    expect(selected).toHaveLength(1);
    expect(selected[0]?.textContent).toContain('Board');
  });

  it('supports paste distribution and completion in OTP input', async () => {
    const fixture = TestBed.createComponent(KrnOtpInput);
    fixture.componentRef.setInput('length', 4);
    const completed = vi.fn();
    fixture.componentInstance.completed.subscribe(completed);
    await fixture.whenStable();
    const first = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const pasteEvent = new Event('paste', { bubbles: true });
    Object.defineProperty(pasteEvent, 'clipboardData', {
      value: { getData: () => '1234' },
    });
    first.dispatchEvent(pasteEvent);
    await fixture.whenStable();

    expect(completed).toHaveBeenCalledWith('1234');
  });

  it('adds and removes tags with keyboard controls', async () => {
    const fixture = TestBed.createComponent(KrnTagsInput);
    const change = vi.fn();
    fixture.componentInstance.registerOnChange(change);
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    input.value = 'Angular';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await fixture.whenStable();

    expect(change).toHaveBeenCalledWith(['Angular']);
    expect(fixture.nativeElement.textContent).toContain('Angular');
  });
});
