import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  KrnColorPicker,
  KrnDatePicker,
  KrnDateRangePicker,
  KrnTimePicker,
} from './date-time-controls';
import { KrnFormField } from './form-field';
import { KrnOtpInput, KrnTagsInput } from './otp-tags';
import { KrnRangeSlider, KrnSlider } from './range-controls';
import {
  KrnAutocomplete,
  KrnCombobox,
  KrnMultiSelect,
  KrnNativeSelect,
  KrnSelect,
} from './select-controls';
import {
  KrnCheckbox,
  KrnCheckboxGroup,
  KrnRadio,
  KrnRadioGroup,
  KrnSegmentedControl,
} from './selection-controls';
import { KrnSearchInput, KrnTextarea, KrnTextInput } from './text-inputs';

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

  it('clears invalid form-field semantics when the value becomes valid', async () => {
    @Component({
      imports: [KrnFormField, KrnTextInput],
      template: `
        <krn-form-field
          id="workspace-name"
          label="Workspace name"
          [error]="error()"
          [state]="state()"
        >
          <krn-text-input />
        </krn-form-field>
      `,
    })
    class FormFieldHost {
      readonly error = signal('Use 3–48 characters.');
      readonly state = signal<'default' | 'invalid' | 'valid' | 'pending'>('invalid');
    }

    const fixture = TestBed.createComponent(FormFieldHost);
    await fixture.whenStable();
    const field = fixture.nativeElement.querySelector('krn-form-field') as HTMLElement;
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(field.getAttribute('data-invalid')).toBe('true');
    expect(field.hasAttribute('id')).toBe(false);
    expect(input.id).toBe('workspace-name');
    expect(input.getAttribute('aria-invalid')).toBe('true');

    fixture.componentInstance.error.set('');
    fixture.componentInstance.state.set('valid');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(field.getAttribute('data-invalid')).toBe('false');
    expect(field.getAttribute('data-valid')).toBe('true');
    expect(input.getAttribute('aria-invalid')).toBe('false');
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
  });

  it('enforces an explicit textarea limit and keeps its counter in sync', async () => {
    const fixture = TestBed.createComponent(KrnTextarea);
    expect(fixture.componentInstance.showCount()).toBe(false);
    fixture.componentRef.setInput('id', 'change-summary');
    fixture.componentRef.setInput('maxLength', 280);
    fixture.componentRef.setInput('showCount', true);
    fixture.componentRef.setInput('autoResize', true);
    const change = vi.fn();
    fixture.componentInstance.registerOnChange(change);
    await fixture.whenStable();
    const textarea = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;

    expect(textarea.maxLength).toBe(280);
    expect((fixture.nativeElement as HTMLElement).hasAttribute('id')).toBe(false);
    expect(textarea.id).toBe('change-summary');
    expect(
      fixture.nativeElement.querySelector('.krn-control-shell')?.getAttribute('data-auto-resize'),
    ).toBe('true');
    expect(fixture.nativeElement.querySelector('.krn-textarea-footer')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.krn-textarea-count')?.textContent).toContain(
      '0 / 280',
    );

    textarea.value = 'x'.repeat(300);
    textarea.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(textarea.value).toHaveLength(280);
    expect(change).toHaveBeenLastCalledWith('x'.repeat(280));
    expect(fixture.nativeElement.querySelector('.krn-textarea-count')?.textContent).toContain(
      '280 / 280',
    );
  });

  it('renders and operates one custom clear control for search', async () => {
    const fixture = TestBed.createComponent(KrnSearchInput);
    fixture.componentRef.setInput('id', 'workspace-search');
    const change = vi.fn();
    fixture.componentInstance.registerOnChange(change);
    fixture.componentInstance.writeValue('navigation');
    await fixture.whenStable();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const buttons = fixture.nativeElement.querySelectorAll('button');
    expect(input.type).toBe('search');
    expect((fixture.nativeElement as HTMLElement).hasAttribute('id')).toBe(false);
    expect(input.id).toBe('workspace-search');
    expect(buttons).toHaveLength(1);

    (buttons[0] as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(change).toHaveBeenCalledWith('');
    expect(fixture.nativeElement.querySelectorAll('button')).toHaveLength(0);
  });

  it('propagates native checkbox state through CVA', async () => {
    const fixture = TestBed.createComponent(KrnCheckbox);
    fixture.componentRef.setInput('id', 'policy-updates');
    const change = vi.fn();
    fixture.componentInstance.registerOnChange(change);
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect((fixture.nativeElement as HTMLElement).hasAttribute('id')).toBe(false);
    expect(input.id).toBe('policy-updates');

    input.checked = true;
    input.dispatchEvent(new Event('change'));

    expect(change).toHaveBeenCalledWith(true);
  });

  it('keeps implicit checkbox-group values independent', async () => {
    @Component({
      imports: [KrnCheckbox, KrnCheckboxGroup, ReactiveFormsModule],
      template: `
        <krn-checkbox-group label="Included events" [formControl]="control">
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

    const optionGroup = fixture.nativeElement.querySelector(
      '.krn-choice-group__options',
    ) as HTMLElement;
    expect(optionGroup.previousElementSibling?.tagName).toBe('LEGEND');
    expect(optionGroup.querySelectorAll('krn-checkbox')).toHaveLength(3);

    inputs[1]!.click();
    await fixture.whenStable();

    expect(inputs.map((input) => input.checked)).toEqual([false, true, false]);
    expect(fixture.componentInstance.control.value).toHaveLength(1);
  });

  it('keeps radio-group selection exclusive', async () => {
    @Component({
      imports: [KrnRadio, KrnRadioGroup, ReactiveFormsModule],
      template: `
        <krn-radio-group label="Billing cycle" [formControl]="control">
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

    const optionGroup = fixture.nativeElement.querySelector(
      '.krn-choice-group__options',
    ) as HTMLElement;
    expect(optionGroup.previousElementSibling?.tagName).toBe('LEGEND');
    expect(optionGroup.querySelectorAll('krn-radio')).toHaveLength(2);

    inputs[0]!.click();
    inputs[1]!.click();
    await fixture.whenStable();

    expect(inputs.map((input) => input.checked)).toEqual([false, true]);
    expect(fixture.componentInstance.control.value).toBe('annual');
  });

  it('renders and updates a native select', async () => {
    const fixture = TestBed.createComponent(KrnNativeSelect);
    fixture.componentRef.setInput('id', 'native-plan');
    fixture.componentRef.setInput('options', [
      { value: 'alpha', label: 'Alpha' },
      { value: 'beta', label: 'Beta' },
    ]);
    const change = vi.fn();
    fixture.componentInstance.registerOnChange(change);
    await fixture.whenStable();
    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    expect((fixture.nativeElement as HTMLElement).hasAttribute('id')).toBe(false);
    expect(select.id).toBe('native-plan');

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

  it('opens the combobox from both its field and disclosure control', async () => {
    const fixture = TestBed.createComponent(KrnCombobox);
    fixture.componentRef.setInput('id', 'workspace-plan');
    fixture.componentRef.setInput('options', [
      { value: 'alpha', label: 'Alpha' },
      { value: 'beta', label: 'Beta' },
    ]);
    await fixture.whenStable();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const toggle = fixture.nativeElement.querySelector('.krn-combobox-toggle') as HTMLButtonElement;
    expect((fixture.nativeElement as HTMLElement).hasAttribute('id')).toBe(false);
    expect(input.id).toBe('workspace-plan');

    input.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.open()).toBe(true);
    expect(fixture.nativeElement.querySelector('[role="listbox"]')).not.toBeNull();

    toggle.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.open()).toBe(false);

    toggle.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.open()).toBe(true);
    expect(document.activeElement).toBe(input);
  });

  it('keeps combobox constrained while autocomplete defaults to free text', async () => {
    const options = [
      { value: 'alpha', label: 'Alpha' },
      { value: 'beta', label: 'Beta' },
    ];
    const combobox = TestBed.createComponent(KrnCombobox);
    combobox.componentRef.setInput('options', options);
    const comboboxChange = vi.fn();
    combobox.componentInstance.registerOnChange(comboboxChange);
    const autocomplete = TestBed.createComponent(KrnAutocomplete);
    autocomplete.componentRef.setInput('options', options);
    const autocompleteChange = vi.fn();
    autocomplete.componentInstance.registerOnChange(autocompleteChange);
    await Promise.all([combobox.whenStable(), autocomplete.whenStable()]);

    expect(combobox.componentInstance.allowCustomValue()).toBe(false);
    expect(combobox.componentInstance.autocompleteMode()).toBe('list');
    expect(autocomplete.componentInstance.allowCustomValue()).toBe(true);
    expect(autocomplete.componentInstance.autocompleteMode()).toBe('both');
    const comboboxInput = combobox.nativeElement.querySelector('input') as HTMLInputElement;
    const autocompleteInput = autocomplete.nativeElement.querySelector('input') as HTMLInputElement;
    expect(comboboxInput.getAttribute('aria-autocomplete')).toBe('list');
    expect(autocompleteInput.getAttribute('aria-autocomplete')).toBe('both');

    comboboxInput.value = 'Custom plan';
    comboboxInput.dispatchEvent(new Event('input', { bubbles: true }));
    autocompleteInput.value = 'Custom alias';
    autocompleteInput.dispatchEvent(new Event('input', { bubbles: true }));
    await Promise.all([combobox.whenStable(), autocomplete.whenStable()]);
    expect(comboboxChange).not.toHaveBeenCalled();
    expect(autocompleteChange).toHaveBeenLastCalledWith('Custom alias');

    comboboxInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await combobox.whenStable();
    expect(comboboxInput.value).toBe('');

    combobox.componentInstance.writeValue('alpha');
    await combobox.whenStable();
    comboboxInput.value = 'Uncommitted plan';
    comboboxInput.dispatchEvent(new Event('input', { bubbles: true }));
    comboboxInput.dispatchEvent(
      new FocusEvent('focusout', { bubbles: true, relatedTarget: document.body }),
    );
    await combobox.whenStable();
    expect(combobox.componentInstance.query()).toBe('Alpha');
    expect(comboboxInput.value).toBe('Alpha');
    expect(comboboxChange).not.toHaveBeenCalled();

    autocomplete.componentRef.setInput('allowCustomValue', false);
    autocomplete.componentRef.setInput('autocompleteMode', 'list');
    await autocomplete.whenStable();
    expect(autocomplete.componentInstance.allowCustomValue()).toBe(false);
    expect(autocomplete.componentInstance.autocompleteMode()).toBe('list');
  });

  it('clamps slider changes to its public range', async () => {
    const fixture = TestBed.createComponent(KrnSlider);
    fixture.componentRef.setInput('min', 10);
    fixture.componentRef.setInput('max', 20);
    const change = vi.fn();
    fixture.componentInstance.registerOnChange(change);
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const output = fixture.nativeElement.querySelector('output') as HTMLOutputElement;

    expect(input.value).toBe('10');
    expect(input.getAttribute('aria-valuetext')).toBe('10');
    expect(output.textContent).toBe('10');
    expect(
      (fixture.nativeElement.querySelector('.krn-slider') as HTMLElement).style.getPropertyValue(
        '--krn-slider-progress',
      ),
    ).toBe('0%');

    input.value = '18';
    input.dispatchEvent(new Event('input'));
    expect(change).toHaveBeenCalledWith(18);
  });

  it('renders range slider as one track with two accessible thumbs', async () => {
    const fixture = TestBed.createComponent(KrnRangeSlider);
    fixture.componentRef.setInput('id', 'usage-range');
    fixture.componentRef.setInput('min', 0);
    fixture.componentRef.setInput('max', 100);
    fixture.componentInstance.writeValue({ start: 20, end: 80 });
    const change = vi.fn();
    fixture.componentInstance.registerOnChange(change);
    await fixture.whenStable();

    const track = fixture.nativeElement.querySelector('.krn-dual-range__track');
    const group = fixture.nativeElement.querySelector('.krn-range-pair') as HTMLElement;
    const sliderSurface = fixture.nativeElement.querySelector('.krn-dual-range') as HTMLElement;
    const inputs = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>(
        '.krn-range--overlay',
      ),
    ];
    expect(track).not.toBeNull();
    expect((fixture.nativeElement as HTMLElement).hasAttribute('id')).toBe(false);
    expect(group.id).toBe('usage-range');
    expect(inputs).toHaveLength(2);
    expect(inputs.map((input) => input.getAttribute('aria-label'))).toEqual([
      'Minimum value',
      'Maximum value',
    ]);
    expect(inputs.map((input) => [input.min, input.max])).toEqual([
      ['0', '100'],
      ['0', '100'],
    ]);

    inputs[0]!.value = '35';
    inputs[0]!.dispatchEvent(new Event('input'));
    expect(change).toHaveBeenCalledWith({ start: 35, end: 80 });
    expect(inputs[1]!.value).toBe('80');

    inputs[1]!.value = '50';
    inputs[1]!.dispatchEvent(new Event('input'));
    expect(change).toHaveBeenLastCalledWith({ start: 35, end: 50 });

    vi.spyOn(sliderSurface, 'getBoundingClientRect').mockReturnValue({
      bottom: 32,
      height: 32,
      left: 0,
      right: 200,
      top: 0,
      width: 200,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    sliderSurface.dispatchEvent(
      new MouseEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        clientX: 170,
      }),
    );
    await fixture.whenStable();
    expect(change).toHaveBeenLastCalledWith({ start: 35, end: 88 });
    expect(document.activeElement).toBe(inputs[1]);
    expect(sliderSurface.getAttribute('data-dragging')).toBe('true');

    sliderSurface.dispatchEvent(
      new MouseEvent('pointermove', {
        bubbles: true,
        cancelable: true,
        clientX: 190,
      }),
    );
    await fixture.whenStable();
    expect((change.mock.calls.at(-1)?.[0] as { end: number }).end).toBeGreaterThan(88);
    sliderSurface.dispatchEvent(
      new MouseEvent('pointerup', {
        bubbles: true,
        cancelable: true,
        clientX: 190,
      }),
    );
    await fixture.whenStable();
    expect(sliderSurface.getAttribute('data-dragging')).toBe('false');

    sliderSurface.dispatchEvent(
      new MouseEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        clientX: 45,
      }),
    );
    await fixture.whenStable();
    expect(change).toHaveBeenLastCalledWith({ start: 20, end: 99 });
    expect(document.activeElement).toBe(inputs[0]);
  });

  it('reactively normalizes range defaults to custom bounds', async () => {
    const fixture = TestBed.createComponent(KrnRangeSlider);
    fixture.componentRef.setInput('min', 10);
    fixture.componentRef.setInput('max', 90);
    await fixture.whenStable();

    const group = fixture.nativeElement.querySelector('.krn-range-pair') as HTMLElement;
    const inputs = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>(
        '.krn-range--overlay',
      ),
    ];
    const output = fixture.nativeElement.querySelector('output') as HTMLOutputElement;
    expect(inputs.map((input) => input.value)).toEqual(['10', '90']);
    expect(output.textContent).toContain('10 – 90');
    expect(group.style.getPropertyValue('--krn-range-start')).toBe('0%');
    expect(group.style.getPropertyValue('--krn-range-end')).toBe('100%');

    fixture.componentRef.setInput('min', 30);
    fixture.componentRef.setInput('max', 60);
    await fixture.whenStable();
    expect(inputs.map((input) => input.value)).toEqual(['30', '60']);
    expect(output.textContent).toContain('30 – 60');
  });

  it('shows an English custom calendar instead of the browser date picker', async () => {
    const fixture = TestBed.createComponent(KrnDatePicker);
    fixture.componentRef.setInput('id', 'launch-date');
    fixture.componentInstance.writeValue('2026-07-29');
    await fixture.whenStable();

    const trigger = fixture.nativeElement.querySelector(
      '.krn-picker__trigger',
    ) as HTMLButtonElement;
    expect((fixture.nativeElement as HTMLElement).hasAttribute('id')).toBe(false);
    expect(trigger.id).toBe('launch-date');
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
    const timeChange = vi.fn();
    timeFixture.componentInstance.registerOnChange(timeChange);
    await timeFixture.whenStable();
    (timeFixture.nativeElement.querySelector('.krn-picker__trigger') as HTMLButtonElement).click();
    await timeFixture.whenStable();

    expect(timeFixture.nativeElement.querySelector('input[type="time"]')).toBeNull();
    expect(timeFixture.nativeElement.querySelectorAll('[role="listbox"]')).toHaveLength(0);
    const timeParts = [
      ...(timeFixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>(
        '[role="spinbutton"]',
      ),
    ];
    expect(timeParts).toHaveLength(2);
    expect(
      timeFixture.nativeElement.querySelectorAll('.krn-time-presets button').length,
    ).toBeGreaterThanOrEqual(3);
    timeParts[0]!.value = '09';
    timeParts[0]!.dispatchEvent(new Event('input', { bubbles: true }));
    timeParts[1]!.value = '30';
    timeParts[1]!.dispatchEvent(new Event('input', { bubbles: true }));
    await timeFixture.whenStable();
    (
      timeFixture.nativeElement.querySelector(
        '.krn-picker__footer button:last-child',
      ) as HTMLButtonElement
    ).click();
    await timeFixture.whenStable();
    expect(timeChange).toHaveBeenLastCalledWith('09:30');
    expect(timeFixture.componentInstance.open()).toBe(false);

    const colorFixture = TestBed.createComponent(KrnColorPicker);
    await colorFixture.whenStable();
    (colorFixture.nativeElement.querySelector('.krn-picker__trigger') as HTMLButtonElement).click();
    await colorFixture.whenStable();

    expect(colorFixture.nativeElement.querySelector('input[type="color"]')).toBeNull();
    expect(colorFixture.nativeElement.querySelectorAll('.krn-color-swatches button')).toHaveLength(
      8,
    );
  });

  it('keeps time presets and arrow adjustments as a draft until Apply', async () => {
    const fixture = TestBed.createComponent(KrnTimePicker);
    fixture.componentRef.setInput('step', 900);
    fixture.componentInstance.writeValue('08:00');
    const change = vi.fn();
    fixture.componentInstance.registerOnChange(change);
    await fixture.whenStable();

    (fixture.nativeElement.querySelector('.krn-picker__trigger') as HTMLButtonElement).click();
    await fixture.whenStable();
    const preset = fixture.nativeElement.querySelector(
      '.krn-time-presets button',
    ) as HTMLButtonElement;
    preset.click();
    await fixture.whenStable();
    expect(change).not.toHaveBeenCalled();

    const picker = fixture.nativeElement.querySelector('.krn-picker') as HTMLElement;
    picker.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await fixture.whenStable();
    expect(fixture.componentInstance.open()).toBe(false);
    expect(change).not.toHaveBeenCalled();

    (fixture.nativeElement.querySelector('.krn-picker__trigger') as HTMLButtonElement).click();
    await fixture.whenStable();
    const hour = fixture.nativeElement.querySelector(
      '[role="spinbutton"][aria-label="Hour"]',
    ) as HTMLInputElement;
    expect(hour.value).toBe('08');
    hour.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    await fixture.whenStable();
    expect(change).not.toHaveBeenCalled();
    (
      fixture.nativeElement.querySelector(
        '.krn-picker__footer button:last-child',
      ) as HTMLButtonElement
    ).click();
    await fixture.whenStable();
    expect(change).toHaveBeenCalledWith('09:00');
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
    fixture.componentRef.setInput('id', 'verification-code');
    fixture.componentRef.setInput('length', 4);
    const completed = vi.fn();
    fixture.componentInstance.completed.subscribe(completed);
    await fixture.whenStable();
    const first = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const fieldset = fixture.nativeElement.querySelector('fieldset') as HTMLFieldSetElement;
    expect((fixture.nativeElement as HTMLElement).hasAttribute('id')).toBe(false);
    expect(fieldset.id).toBe('verification-code');
    const pasteEvent = new Event('paste', { bubbles: true });
    Object.defineProperty(pasteEvent, 'clipboardData', {
      value: { getData: () => '1234' },
    });
    first.dispatchEvent(pasteEvent);
    await fixture.whenStable();

    expect(completed).toHaveBeenCalledWith('1234');
  });

  it('keeps OTP slots editable while blocking non-numeric input', async () => {
    const fixture = TestBed.createComponent(KrnOtpInput);
    fixture.componentRef.setInput('length', 4);
    const change = vi.fn();
    fixture.componentInstance.registerOnChange(change);
    fixture.componentInstance.writeValue('1234');
    await fixture.whenStable();
    const inputs = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>('input'),
    ];

    const invalidKey = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'a',
    });
    inputs[2]!.dispatchEvent(invalidKey);
    expect(invalidKey.defaultPrevented).toBe(true);

    inputs[2]!.value = 'x';
    inputs[2]!.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    expect(inputs.map((input) => input.value)).toEqual(['1', '2', '3', '4']);

    inputs[2]!.focus();
    inputs[2]!.dispatchEvent(
      new KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        key: 'Backspace',
      }),
    );
    await fixture.whenStable();
    expect(inputs.map((input) => input.value)).toEqual(['1', '2', '', '4']);
    expect(change).toHaveBeenLastCalledWith('124');
    expect(document.activeElement).toBe(inputs[2]);

    inputs[2]!.value = '3';
    inputs[2]!.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    expect(inputs.map((input) => input.value)).toEqual(['1', '2', '3', '4']);
    expect(change).toHaveBeenLastCalledWith('1234');

    inputs[2]!.dispatchEvent(
      new KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        key: 'ArrowLeft',
      }),
    );
    expect(document.activeElement).toBe(inputs[1]);
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
    expect(fixture.nativeElement.querySelector('.krn-tag-feedback')?.textContent).toContain(
      'Added',
    );
    expect(fixture.nativeElement.querySelector('.krn-message')).toBeNull();
    expect(fixture.nativeElement.querySelector('[role="status"]')?.textContent).toContain(
      'Angular added.',
    );
  });
});
