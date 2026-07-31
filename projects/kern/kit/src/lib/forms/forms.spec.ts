import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  KrnColorPicker,
  KrnDatePicker,
  KrnDateRangePicker,
  KrnTimePicker,
} from './date-time-controls';
import { KrnFormField, KrnHint, KrnLabel, KrnValidationMessage } from './form-field';
import type { KrnSelectOption } from './form-types';
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
import { KrnNumberInput, KrnSearchInput, KrnTextarea, KrnTextInput } from './text-inputs';
import { KrnFileUpload } from './upload-controls';
import { KrnDialog } from '../feedback/modal-overlays';

function expectCalendarRowSemantics(host: HTMLElement): void {
  const grid = host.querySelector<HTMLElement>('[role="grid"]');
  const rowGroup = grid?.querySelector<HTMLElement>('[role="rowgroup"]');
  const cells = [...(grid?.querySelectorAll<HTMLElement>('[role="gridcell"]') ?? [])];
  expect(grid?.firstElementChild?.getAttribute('role')).toBe('row');
  expect(rowGroup?.querySelectorAll(':scope > [role="row"]')).toHaveLength(6);
  expect(cells).toHaveLength(42);
  expect(cells.every((cell) => cell.parentElement?.getAttribute('role') === 'row')).toBe(true);
}

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

  it('reflects Angular control validity and required validators in native semantics', async () => {
    @Component({
      imports: [KrnTextInput, ReactiveFormsModule],
      template: `<krn-text-input [formControl]="control" />`,
    })
    class AngularValidationHost {
      readonly control = new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      });
    }

    const fixture = TestBed.createComponent(AngularValidationHost);
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    expect(input.required).toBe(true);
    expect(input.getAttribute('aria-invalid')).toBe('true');

    fixture.componentInstance.control.setValue('Enterprise');
    await fixture.whenStable();
    expect(input.getAttribute('aria-invalid')).toBe('false');
  });

  it('synchronizes validators-only state with form-field labels and optional semantics', async () => {
    @Component({
      imports: [KrnFormField, KrnLabel, KrnTextInput, ReactiveFormsModule],
      template: `
        <krn-form-field optionalText="Optional">
          <krn-label>Workspace name</krn-label>
          <krn-text-input [formControl]="control" />
        </krn-form-field>
      `,
    })
    class ValidatorsOnlyFieldHost {
      readonly control = new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      });
    }

    const fixture = TestBed.createComponent(ValidatorsOnlyFieldHost);
    await fixture.whenStable();
    const field = fixture.nativeElement.querySelector('krn-form-field') as HTMLElement;
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    expect(field.getAttribute('data-required')).toBe('true');
    expect(field.getAttribute('data-invalid')).toBe('true');
    expect(field.querySelector('.krn-required')).not.toBeNull();
    expect(field.querySelector('.krn-optional')).toBeNull();
    expect(input.required).toBe(true);
    expect(input.getAttribute('aria-invalid')).toBe('true');

    fixture.componentInstance.control.setValue('Enterprise');
    await fixture.whenStable();
    expect(field.getAttribute('data-invalid')).toBe('false');
    expect(field.getAttribute('data-required')).toBe('true');

    fixture.componentInstance.control.clearValidators();
    fixture.componentInstance.control.updateValueAndValidity();
    await fixture.whenStable();
    expect(field.getAttribute('data-required')).toBe('false');
    expect(field.querySelector('.krn-required')).toBeNull();
    expect(field.querySelector('.krn-optional')?.textContent?.trim()).toBe('Optional');
    expect(input.required).toBe(false);
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

  it('registers projected hints and validation messages with its control', async () => {
    @Component({
      imports: [KrnFormField, KrnHint, KrnTextInput, KrnValidationMessage],
      template: `
        <krn-form-field id="project-name" label="Project name">
          <krn-text-input />
          <krn-hint id="project-name-guidance">Use a recognizable name.</krn-hint>
          @if (showError()) {
            <krn-validation-message id="project-name-conflict">
              This name is already used.
            </krn-validation-message>
          }
        </krn-form-field>
      `,
    })
    class ProjectedMessagesHost {
      readonly showError = signal(false);
    }

    const fixture = TestBed.createComponent(ProjectedMessagesHost);
    await fixture.whenStable();
    const field = fixture.nativeElement.querySelector('krn-form-field') as HTMLElement;
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    expect(input.getAttribute('aria-describedby')).toBe('project-name-guidance');
    expect(field.getAttribute('data-invalid')).toBe('false');
    expect(fixture.nativeElement.querySelector('krn-hint')?.hasAttribute('id')).toBe(false);

    fixture.componentInstance.showError.set(true);
    await fixture.whenStable();

    expect(input.getAttribute('aria-describedby')?.split(' ')).toEqual([
      'project-name-guidance',
      'project-name-conflict',
    ]);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(field.getAttribute('data-invalid')).toBe('true');

    fixture.componentInstance.showError.set(false);
    await fixture.whenStable();
    expect(input.getAttribute('aria-describedby')).toBe('project-name-guidance');
    expect(input.getAttribute('aria-invalid')).toBe('false');
  });

  it('propagates form-field state and intrinsic constraints to Angular Forms', async () => {
    @Component({
      imports: [KrnFormField, KrnTextInput, ReactiveFormsModule],
      template: `
        <krn-form-field
          id="account-name"
          required
          [disabled]="fieldDisabled()"
          [readonly]="fieldReadOnly()"
        >
          <krn-text-input [formControl]="control" [minLength]="minimum()" />
        </krn-form-field>
      `,
    })
    class FormContractHost {
      readonly control = new FormControl('', { nonNullable: true });
      readonly minimum = signal(3);
      readonly fieldDisabled = signal(false);
      readonly fieldReadOnly = signal(false);
    }

    const fixture = TestBed.createComponent(FormContractHost);
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const host = fixture.componentInstance;

    expect(input.required).toBe(true);
    expect(host.control.errors).toEqual({ required: true });

    host.control.setValue('ab');
    await fixture.whenStable();
    expect(host.control.errors).toEqual({
      minlength: { requiredLength: 3, actualLength: 2 },
    });

    host.control.setValue('abc');
    await fixture.whenStable();
    expect(host.control.valid).toBe(true);

    host.minimum.set(4);
    await fixture.whenStable();
    expect(host.control.errors).toEqual({
      minlength: { requiredLength: 4, actualLength: 3 },
    });

    host.fieldReadOnly.set(true);
    host.fieldDisabled.set(true);
    await fixture.whenStable();
    expect(input.readOnly).toBe(true);
    expect(input.disabled).toBe(true);
  });

  it('exposes an explicit textarea limit and keeps its counter in sync', async () => {
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

    expect(textarea.value).toHaveLength(300);
    expect(change).toHaveBeenLastCalledWith('x'.repeat(300));
    expect(fixture.nativeElement.querySelector('.krn-textarea-count')?.textContent).toContain(
      '300 / 280',
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

  it('represents checkbox-group readonly state without prohibited fieldset ARIA', async () => {
    const fixture = TestBed.createComponent(KrnCheckboxGroup);
    fixture.componentRef.setInput('readonly', true);
    await fixture.whenStable();

    const fieldset = fixture.nativeElement.querySelector('fieldset') as HTMLFieldSetElement;
    expect(fieldset.hasAttribute('aria-readonly')).toBe(false);
    expect(fieldset.getAttribute('data-readonly')).toBe('true');
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

  it('validates required choice groups without making every checkbox required', async () => {
    @Component({
      imports: [
        KrnCheckbox,
        KrnCheckboxGroup,
        KrnFormField,
        KrnRadio,
        KrnRadioGroup,
        ReactiveFormsModule,
      ],
      template: `
        <krn-form-field required>
          <krn-checkbox-group [formControl]="checks">
            <krn-checkbox value="audit">Audit</krn-checkbox>
            <krn-checkbox value="billing">Billing</krn-checkbox>
          </krn-checkbox-group>
        </krn-form-field>
        <krn-radio-group required [formControl]="radio">
          <krn-radio value="daily">Daily</krn-radio>
          <krn-radio value="weekly">Weekly</krn-radio>
        </krn-radio-group>
      `,
    })
    class RequiredGroupsHost {
      readonly checks = new FormControl<readonly string[]>([], { nonNullable: true });
      readonly radio = new FormControl<string | null>(null);
    }

    const fixture = TestBed.createComponent(RequiredGroupsHost);
    await fixture.whenStable();
    const checkFieldset = fixture.nativeElement.querySelector(
      'krn-checkbox-group fieldset',
    ) as HTMLFieldSetElement;
    const radioFieldset = fixture.nativeElement.querySelector(
      'krn-radio-group fieldset',
    ) as HTMLFieldSetElement;
    const checkboxes = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>(
        'krn-checkbox input',
      ),
    ];

    expect(fixture.componentInstance.checks.errors).toEqual({ required: true });
    expect(fixture.componentInstance.radio.errors).toEqual({ required: true });
    expect(checkFieldset.getAttribute('aria-required')).toBe('true');
    expect(radioFieldset.getAttribute('aria-required')).toBe('true');
    expect(checkboxes.every((checkbox) => !checkbox.required)).toBe(true);

    checkboxes[0]!.click();
    (fixture.nativeElement.querySelector('krn-radio input') as HTMLInputElement).click();
    await fixture.whenStable();
    expect(fixture.componentInstance.checks.valid).toBe(true);
    expect(fixture.componentInstance.radio.valid).toBe(true);
  });

  it('accepts false in generic required controls and keeps checkbox requiredTrue semantics', async () => {
    @Component({
      imports: [KrnCheckbox, KrnNativeSelect, KrnSegmentedControl, ReactiveFormsModule],
      template: `
        <krn-native-select [formControl]="native" [options]="booleanOptions" />
        <krn-segmented-control [formControl]="segmented" [options]="booleanOptions" />
        <krn-checkbox required [formControl]="confirmation">Confirm policy</krn-checkbox>
      `,
    })
    class BooleanControlsHost {
      readonly booleanOptions = [
        { value: false, label: 'Disabled' },
        { value: true, label: 'Enabled' },
      ] as const;
      readonly native = new FormControl<boolean | null>(false, Validators.required);
      readonly segmented = new FormControl<boolean | null>(false, Validators.required);
      readonly confirmation = new FormControl(false, { nonNullable: true });
    }

    const fixture = TestBed.createComponent(BooleanControlsHost);
    await fixture.whenStable();
    const native = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    const segments = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>(
        'krn-segmented-control [role="radio"]',
      ),
    ];
    const checkbox = fixture.nativeElement.querySelector('krn-checkbox input') as HTMLInputElement;

    expect(fixture.componentInstance.native.valid).toBe(true);
    expect(fixture.componentInstance.segmented.valid).toBe(true);
    expect(native.required).toBe(true);
    expect(native.selectedIndex).toBe(1);
    expect(segments.map((segment) => segment.getAttribute('aria-checked'))).toEqual([
      'true',
      'false',
    ]);
    expect(fixture.componentInstance.confirmation.errors).toEqual({ required: true });
    expect(checkbox.required).toBe(true);

    checkbox.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.confirmation.valid).toBe(true);
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

    expect(select.selectedIndex).toBe(0);
    expect(select.options[0]?.hidden).toBe(true);

    select.selectedIndex = 2;
    select.dispatchEvent(new Event('change'));

    expect(change).toHaveBeenCalledWith('beta');
  });

  it('maps object values through the native select without string coercion', async () => {
    interface Region {
      readonly code: string;
    }
    const fixture = TestBed.createComponent(KrnNativeSelect<Region>);
    const eu = { code: 'eu' };
    const us = { code: 'us' };
    fixture.componentRef.setInput('options', [
      { value: eu, label: 'Europe' },
      { value: us, label: 'United States' },
    ]);
    fixture.componentRef.setInput(
      'identityMatcher',
      (left: Region, right: Region) => left.code === right.code,
    );
    fixture.componentInstance.writeValue({ code: 'eu' });
    const change = vi.fn();
    fixture.componentInstance.registerOnChange(change);
    await fixture.whenStable();
    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;

    expect(select.selectedIndex).toBe(1);
    select.selectedIndex = 2;
    select.dispatchEvent(new Event('change'));
    expect(change).toHaveBeenCalledWith(us);
  });

  it('round-trips collision-prone native-select values with exact runtime types', async () => {
    interface CollisionObject {
      readonly kind: 'object';
    }
    type CollisionValue = CollisionObject | '__krn-option-0' | 1 | '1' | false | 'false' | '';

    const objectValue: CollisionObject = { kind: 'object' };
    const options: readonly KrnSelectOption<CollisionValue>[] = [
      { value: objectValue, label: 'Object' },
      { value: '__krn-option-0', label: 'Reserved-looking string' },
      { value: 1, label: 'Number one' },
      { value: '1', label: 'String one' },
      { value: false, label: 'Boolean false' },
      { value: 'false', label: 'String false' },
      { value: '', label: 'Empty string' },
    ];
    const fixture = TestBed.createComponent(KrnNativeSelect<CollisionValue>);
    fixture.componentRef.setInput('placeholder', 'Choose a value');
    fixture.componentRef.setInput('options', options);
    const change = vi.fn();
    fixture.componentInstance.registerOnChange(change);
    await fixture.whenStable();
    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    const internalKeys = [...select.options].map((option) => option.value);

    expect(new Set(internalKeys).size).toBe(internalKeys.length);

    for (const [index, option] of options.entries()) {
      fixture.componentInstance.writeValue(option.value);
      fixture.detectChanges();
      expect(select.selectedIndex).toBe(index + 1);

      select.selectedIndex = index + 1;
      select.dispatchEvent(new Event('change'));
      expect(change).toHaveBeenLastCalledWith(option.value);
    }

    select.selectedIndex = 0;
    select.dispatchEvent(new Event('change'));
    expect(change).toHaveBeenLastCalledWith(null);
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

  it('keeps select loading, error, and empty results distinct', async () => {
    const fixture = TestBed.createComponent(KrnSelect);
    fixture.componentRef.setInput('options', [{ value: 'stale', label: 'Stale option' }]);
    fixture.componentRef.setInput('optionsState', 'loading');
    fixture.componentInstance.open.set(true);
    await fixture.whenStable();

    const state = (): HTMLElement =>
      fixture.nativeElement.querySelector('[role="option"]') as HTMLElement;
    const listbox = (): HTMLElement =>
      fixture.nativeElement.querySelector('[role="listbox"]') as HTMLElement;
    expect(listbox().getAttribute('aria-busy')).toBe('true');
    expect(state().dataset['optionsState']).toBe('loading');
    expect(fixture.nativeElement.textContent).not.toContain('Stale option');

    fixture.componentRef.setInput('optionsState', 'error');
    await fixture.whenStable();
    expect(listbox().getAttribute('aria-invalid')).toBe('true');
    expect(state().dataset['optionsState']).toBe('error');

    fixture.componentRef.setInput('optionsState', 'ready');
    fixture.componentRef.setInput('options', []);
    await fixture.whenStable();
    expect(listbox().getAttribute('aria-busy')).toBeNull();
    expect(listbox().getAttribute('aria-invalid')).toBeNull();
    expect(state().dataset['optionsState']).toBe('empty');
  });

  it('consumes Escape in nested form popups before the parent dialog handles it', async () => {
    @Component({
      imports: [KrnDatePicker, KrnDialog, KrnSelect],
      template: `
        <krn-dialog title="Edit schedule" [(open)]="dialogOpen">
          <krn-select [options]="options" />
          <krn-date-picker />
        </krn-dialog>
      `,
    })
    class NestedFormPopupsHost {
      dialogOpen = true;
      readonly options = [
        { value: 'alpha', label: 'Alpha' },
        { value: 'beta', label: 'Beta' },
      ];
    }

    const fixture = TestBed.createComponent(NestedFormPopupsHost);
    document.body.append(fixture.nativeElement);
    fixture.detectChanges();
    await fixture.whenStable();

    const selectTrigger = fixture.nativeElement.querySelector(
      '.krn-select-trigger',
    ) as HTMLButtonElement;
    selectTrigger.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(selectTrigger.getAttribute('aria-expanded')).toBe('true');

    const selectEscape = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    selectTrigger.dispatchEvent(selectEscape);
    fixture.detectChanges();

    expect(selectEscape.defaultPrevented).toBe(true);
    expect(selectTrigger.getAttribute('aria-expanded')).toBe('false');
    expect(fixture.componentInstance.dialogOpen).toBe(true);

    const dateTrigger = fixture.nativeElement.querySelector(
      '.krn-picker__trigger',
    ) as HTMLButtonElement;
    dateTrigger.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(dateTrigger.getAttribute('aria-expanded')).toBe('true');
    const focusedDay = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '.krn-calendar__day[tabindex="0"]',
    );
    expect(document.activeElement).toBe(focusedDay);

    const dateEscape = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    focusedDay?.dispatchEvent(dateEscape);
    fixture.detectChanges();

    expect(dateEscape.defaultPrevented).toBe(true);
    expect(dateTrigger.getAttribute('aria-expanded')).toBe('false');
    expect(fixture.componentInstance.dialogOpen).toBe(true);

    const dialogEscape = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    document.dispatchEvent(dialogEscape);
    fixture.detectChanges();
    expect(dialogEscape.defaultPrevented).toBe(true);
    expect(fixture.componentInstance.dialogOpen).toBe(false);

    fixture.destroy();
    fixture.nativeElement.remove();
  });

  it('supports object values, identity matching, disabled policies, and typed select slots', async () => {
    interface Plan {
      readonly id: string;
      readonly name: string;
      readonly archived?: boolean;
    }

    @Component({
      imports: [KrnSelect, ReactiveFormsModule],
      template: `
        <ng-template #plan let-option>
          <span class="plan-template">{{ option.value.name }}</span>
        </ng-template>
        <krn-select
          [formControl]="control"
          [options]="options"
          [identityMatcher]="identityMatcher"
          [trackBy]="trackBy"
          [disabledHandler]="disabledHandler"
          [optionTemplate]="plan"
          [selectedTemplate]="plan"
        />
      `,
    })
    class GenericSelectHost {
      readonly options: readonly KrnSelectOption<Plan>[] = [
        { value: { id: 'starter', name: 'Starter' }, label: 'Starter' },
        {
          value: { id: 'enterprise', name: 'Enterprise', archived: true },
          label: 'Enterprise',
        },
      ];
      readonly control = new FormControl<Plan | null>({
        id: 'starter',
        name: 'External starter value',
      });
      readonly identityMatcher = (left: Plan, right: Plan): boolean => left.id === right.id;
      readonly trackBy = (option: KrnSelectOption<Plan>): string => option.value.id;
      readonly disabledHandler = (option: KrnSelectOption<Plan>): boolean =>
        option.value.archived ?? false;
    }

    const fixture = TestBed.createComponent(GenericSelectHost);
    await fixture.whenStable();
    const trigger = fixture.nativeElement.querySelector('.krn-select-trigger') as HTMLButtonElement;

    expect(trigger.textContent).toContain('Starter');
    trigger.click();
    await fixture.whenStable();

    const options = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('[role="option"]'),
    ];
    expect(options).toHaveLength(2);
    expect(options[0]?.querySelector('.plan-template')?.textContent).toContain('Starter');
    expect(options[1]?.getAttribute('aria-disabled')).toBe('true');
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

  it('matches and de-duplicates object values in multi-select', async () => {
    interface Team {
      readonly id: number;
      readonly name: string;
    }
    const fixture = TestBed.createComponent(KrnMultiSelect<Team>);
    const alpha = { id: 1, name: 'Alpha' };
    const beta = { id: 2, name: 'Beta' };
    fixture.componentRef.setInput('options', [
      { value: alpha, label: alpha.name },
      { value: beta, label: beta.name },
    ]);
    fixture.componentRef.setInput(
      'identityMatcher',
      (left: Team, right: Team) => left.id === right.id,
    );
    fixture.componentInstance.writeValue([
      { id: 1, name: 'External Alpha' },
      { id: 1, name: 'Duplicate Alpha' },
    ]);
    const change = vi.fn();
    fixture.componentInstance.registerOnChange(change);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.krn-select-trigger')?.textContent).toContain(
      'Alpha',
    );
    fixture.componentInstance.open.set(true);
    await fixture.whenStable();
    const listbox = fixture.nativeElement.querySelector('[role="listbox"]') as HTMLElement;
    listbox.dispatchEvent(new Event('focus'));
    (fixture.nativeElement.querySelectorAll('[role="option"]')[1] as HTMLElement).click();
    await fixture.whenStable();

    const lastValue = change.mock.calls.at(-1)?.[0] as readonly Team[];
    expect(lastValue.map((team) => team.id)).toEqual([1, 2]);
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
    expect(comboboxInput.value).toBe('Alpha');
    expect(comboboxChange).not.toHaveBeenCalled();

    autocomplete.componentRef.setInput('allowCustomValue', false);
    autocomplete.componentRef.setInput('autocompleteMode', 'list');
    await autocomplete.whenStable();
    expect(autocompleteInput.getAttribute('aria-autocomplete')).toBe('list');
  });

  it('resolves late async combobox labels without overwriting an active query', async () => {
    const fixture = TestBed.createComponent(KrnCombobox);
    fixture.componentRef.setInput('options', []);
    fixture.componentInstance.writeValue('eu-central');
    await fixture.whenStable();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(input.value).toBe('eu-central');
    expect(fixture.componentInstance.open()).toBe(false);

    fixture.componentRef.setInput('options', [{ value: 'eu-central', label: 'Europe Central' }]);
    await fixture.whenStable();
    expect(input.value).toBe('Europe Central');

    input.value = 'europe remote query';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    fixture.componentRef.setInput('options', [
      { value: 'eu-central', label: 'EU Central (remote)' },
      { value: 'eu-west', label: 'EU West (remote)' },
    ]);
    await fixture.whenStable();

    expect(input.value).toBe('europe remote query');
  });

  it('supports controlled remote option loading without filtering server results twice', async () => {
    const fixture = TestBed.createComponent(KrnCombobox);
    fixture.componentRef.setInput('options', [{ value: 'server-alpha', label: 'Server Alpha' }]);
    fixture.componentRef.setInput('filterLocally', false);
    const queries: string[] = [];
    fixture.componentInstance.queryChange.subscribe((query) => queries.push(query));
    await fixture.whenStable();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = 'different server query';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();

    expect(queries).toEqual(['different server query']);
    expect(fixture.nativeElement.querySelector('[role="option"]')?.textContent).toContain(
      'Server Alpha',
    );

    fixture.componentRef.setInput('optionsState', 'loading');
    await fixture.whenStable();
    const loadingListbox = fixture.nativeElement.querySelector('[role="listbox"]') as HTMLElement;
    const loadingState = fixture.nativeElement.querySelector(
      '[role="option"][data-options-state="loading"]',
    ) as HTMLElement;
    expect(loadingListbox.getAttribute('aria-busy')).toBe('true');
    expect(loadingState.getAttribute('role')).toBe('option');
    expect(loadingState.getAttribute('aria-disabled')).toBe('true');
    expect(loadingState.textContent).toContain('Loading options');
    expect(fixture.nativeElement.textContent).not.toContain('Server Alpha');

    fixture.componentRef.setInput('optionsState', 'error');
    await fixture.whenStable();
    const errorListbox = fixture.nativeElement.querySelector('[role="listbox"]') as HTMLElement;
    const errorState = fixture.nativeElement.querySelector(
      '[role="option"][data-options-state="error"]',
    ) as HTMLElement;
    expect(errorListbox.getAttribute('aria-busy')).toBeNull();
    expect(errorListbox.getAttribute('aria-invalid')).toBe('true');
    expect(errorState.textContent).toContain('Could not load options');

    fixture.componentRef.setInput('options', []);
    fixture.componentRef.setInput('optionsState', 'ready');
    await fixture.whenStable();
    expect(
      fixture.nativeElement.querySelector('[data-options-state="empty"]')?.textContent,
    ).toContain('No matches');
  });

  it('uses a typed custom option filter when local filtering is enabled', async () => {
    const fixture = TestBed.createComponent(KrnAutocomplete);
    fixture.componentRef.setInput('options', [
      { value: 'emea', label: 'Europe', description: 'Region' },
      { value: 'amer', label: 'Americas', description: 'Region' },
    ]);
    fixture.componentRef.setInput(
      'optionFilter',
      (option: KrnSelectOption<string>, query: string) => option.value.startsWith(query),
    );
    await fixture.whenStable();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = 'am';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();

    const options = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('[role="option"]'),
    ];
    expect(options).toHaveLength(1);
    expect(options[0]?.textContent).toContain('Americas');
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
    expectCalendarRowSemantics(fixture.nativeElement as HTMLElement);
  });

  it('localizes the calendar, uses roving focus, and restores trigger focus', async () => {
    const fixture = TestBed.createComponent(KrnDatePicker);
    fixture.componentRef.setInput('locale', 'de-DE');
    fixture.componentRef.setInput('weekStartsOn', 1);
    fixture.componentInstance.writeValue('2026-07-29');
    const change = vi.fn();
    fixture.componentInstance.registerOnChange(change);
    await fixture.whenStable();

    const trigger = fixture.nativeElement.querySelector(
      '.krn-picker__trigger',
    ) as HTMLButtonElement;
    trigger.click();
    await fixture.whenStable();

    expect(
      fixture.nativeElement.querySelector('.krn-calendar__header strong')?.textContent,
    ).toContain('Juli 2026');
    expect(fixture.nativeElement.querySelector('.krn-calendar__weekday')?.textContent).toBe('Mo');
    expect(fixture.nativeElement.querySelectorAll('.krn-calendar__day[tabindex="0"]')).toHaveLength(
      1,
    );

    const selected = fixture.nativeElement.querySelector(
      '[data-date="2026-07-29"]',
    ) as HTMLButtonElement;
    expect(document.activeElement).toBe(selected);
    selected.dispatchEvent(
      new KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        key: 'ArrowRight',
      }),
    );
    await fixture.whenStable();

    const nextDay = fixture.nativeElement.querySelector(
      '[data-date="2026-07-30"]',
    ) as HTMLButtonElement;
    expect(document.activeElement).toBe(nextDay);
    nextDay.dispatchEvent(
      new KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        key: 'Home',
      }),
    );
    await fixture.whenStable();
    expect((document.activeElement as HTMLElement).dataset['date']).toBe('2026-07-27');

    (document.activeElement as HTMLElement).dispatchEvent(
      new KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        key: 'PageDown',
      }),
    );
    await fixture.whenStable();
    expect((document.activeElement as HTMLElement).dataset['date']).toBe('2026-08-27');

    (document.activeElement as HTMLElement).dispatchEvent(
      new KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        key: 'Enter',
      }),
    );
    await fixture.whenStable();
    expect(change).toHaveBeenCalledWith('2026-08-27');
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('validates date and date-range constraints through Angular Forms', async () => {
    @Component({
      imports: [KrnDatePicker, KrnDateRangePicker, ReactiveFormsModule],
      template: `
        <krn-date-picker required min="2026-07-10" max="2026-07-31" [formControl]="date" />
        <krn-date-range-picker required [formControl]="range" />
      `,
    })
    class DateValidationHost {
      readonly date = new FormControl('', { nonNullable: true });
      readonly range = new FormControl({ start: '', end: '' }, { nonNullable: true });
    }

    const fixture = TestBed.createComponent(DateValidationHost);
    await fixture.whenStable();
    const host = fixture.componentInstance;

    expect(host.date.errors).toEqual({ required: true });
    expect(host.range.errors).toEqual({ required: true });

    host.date.setValue('not-a-date');
    host.range.setValue({ start: '2026-07-20', end: '' });
    await fixture.whenStable();
    expect(host.date.errors).toEqual({ date: true });
    expect(host.range.errors).toEqual({ required: true });

    host.date.setValue('2026-07-01');
    host.range.setValue({ start: '2026-07-20', end: '2026-07-10' });
    await fixture.whenStable();
    expect(host.date.errors).toEqual({
      minDate: { min: '2026-07-10', actual: '2026-07-01' },
    });
    expect(host.range.errors).toEqual({ dateRange: true });

    host.date.setValue('2026-07-20');
    host.range.setValue({ start: '2026-07-10', end: '2026-07-20' });
    await fixture.whenStable();
    expect(host.date.valid).toBe(true);
    expect(host.range.valid).toBe(true);
  });

  it('selects a date range from one calendar', async () => {
    const fixture = TestBed.createComponent(KrnDateRangePicker);
    fixture.componentInstance.writeValue({ start: '2026-07-10', end: '' });
    const change = vi.fn();
    fixture.componentInstance.registerOnChange(change);
    await fixture.whenStable();

    (fixture.nativeElement.querySelector('.krn-picker__trigger') as HTMLButtonElement).click();
    await fixture.whenStable();
    expectCalendarRowSemantics(fixture.nativeElement as HTMLElement);
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
    const timeTrigger = timeFixture.nativeElement.querySelector(
      '.krn-picker__trigger',
    ) as HTMLButtonElement;
    timeTrigger.click();
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
    expect(timeFixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(timeTrigger);

    const colorFixture = TestBed.createComponent(KrnColorPicker);
    await colorFixture.whenStable();
    const colorTrigger = colorFixture.nativeElement.querySelector(
      '.krn-picker__trigger',
    ) as HTMLButtonElement;
    colorTrigger.click();
    await colorFixture.whenStable();

    expect(colorFixture.nativeElement.querySelector('input[type="color"]')).toBeNull();
    expect(colorFixture.nativeElement.querySelectorAll('.krn-color-swatches button')).toHaveLength(
      8,
    );
    (
      colorFixture.nativeElement.querySelector(
        '.krn-picker__footer button:last-child',
      ) as HTMLButtonElement
    ).click();
    await colorFixture.whenStable();
    expect(colorFixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(colorTrigger);
  });

  it('closes blocked picker panels and rejects stale mutations', async () => {
    const dateFixture = TestBed.createComponent(KrnDatePicker);
    dateFixture.componentInstance.writeValue('2026-07-20');
    const dateChange = vi.fn();
    dateFixture.componentInstance.registerOnChange(dateChange);
    await dateFixture.whenStable();
    (dateFixture.nativeElement.querySelector('.krn-picker__trigger') as HTMLButtonElement).click();
    await dateFixture.whenStable();
    const staleDateClear = dateFixture.nativeElement.querySelector(
      '.krn-picker__footer button:first-child',
    ) as HTMLButtonElement;
    dateFixture.componentInstance.setDisabledState(true);
    staleDateClear.click();
    await dateFixture.whenStable();
    expect(dateFixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
    expect(dateChange).not.toHaveBeenCalled();

    const rangeFixture = TestBed.createComponent(KrnDateRangePicker);
    rangeFixture.componentInstance.writeValue({ start: '2026-07-10', end: '' });
    const rangeChange = vi.fn();
    rangeFixture.componentInstance.registerOnChange(rangeChange);
    await rangeFixture.whenStable();
    const rangeTrigger = rangeFixture.nativeElement.querySelector(
      '.krn-picker__trigger',
    ) as HTMLButtonElement;
    rangeTrigger.click();
    await rangeFixture.whenStable();
    const staleRangeDay = rangeFixture.nativeElement.querySelector(
      '[data-date="2026-07-20"]',
    ) as HTMLButtonElement;
    rangeFixture.componentRef.setInput('readonly', true);
    staleRangeDay.click();
    await rangeFixture.whenStable();
    expect(rangeFixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
    expect(rangeChange).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(rangeTrigger);

    const timeFixture = TestBed.createComponent(KrnTimePicker);
    timeFixture.componentInstance.writeValue('08:00');
    const timeChange = vi.fn();
    timeFixture.componentInstance.registerOnChange(timeChange);
    await timeFixture.whenStable();
    (timeFixture.nativeElement.querySelector('.krn-picker__trigger') as HTMLButtonElement).click();
    await timeFixture.whenStable();
    const staleTimeApply = timeFixture.nativeElement.querySelector(
      '.krn-picker__footer button:last-child',
    ) as HTMLButtonElement;
    timeFixture.componentInstance.setDisabledState(true);
    staleTimeApply.click();
    await timeFixture.whenStable();
    expect(timeFixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
    expect(timeChange).not.toHaveBeenCalled();

    const colorFixture = TestBed.createComponent(KrnColorPicker);
    const colorChange = vi.fn();
    colorFixture.componentInstance.registerOnChange(colorChange);
    await colorFixture.whenStable();
    const colorTrigger = colorFixture.nativeElement.querySelector(
      '.krn-picker__trigger',
    ) as HTMLButtonElement;
    colorTrigger.click();
    await colorFixture.whenStable();
    const staleColorSwatch = colorFixture.nativeElement.querySelector(
      '.krn-color-swatches button:nth-child(2)',
    ) as HTMLButtonElement;
    colorFixture.componentRef.setInput('readonly', true);
    staleColorSwatch.click();
    await colorFixture.whenStable();
    expect(colorFixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
    expect(colorChange).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(colorTrigger);
  });

  it('localizes time and color picker copy through typed label contracts', async () => {
    const timeFixture = TestBed.createComponent(KrnTimePicker);
    timeFixture.componentRef.setInput('labels', {
      chooseTime: 'Выберите время',
      selectTime: 'Время не выбрано',
      hour: 'Час',
      minute: 'Минута',
      apply: 'Применить',
    });
    await timeFixture.whenStable();

    const timeTrigger = timeFixture.nativeElement.querySelector(
      '.krn-picker__trigger',
    ) as HTMLButtonElement;
    expect(timeTrigger.getAttribute('aria-label')).toBe('Выберите время');
    expect(timeTrigger.textContent).toContain('Время не выбрано');
    timeTrigger.click();
    await timeFixture.whenStable();
    expect(timeFixture.nativeElement.querySelector('[aria-label="Час"]')).toBeTruthy();
    expect(
      timeFixture.nativeElement.querySelector('.krn-picker__footer button:last-child')?.textContent,
    ).toContain('Применить');

    const colorFixture = TestBed.createComponent(KrnColorPicker);
    colorFixture.componentRef.setInput('labels', {
      chooseColor: 'Выберите цвет',
      preview: 'Предпросмотр',
      done: 'Готово',
    });
    await colorFixture.whenStable();
    const colorTrigger = colorFixture.nativeElement.querySelector(
      '.krn-picker__trigger',
    ) as HTMLButtonElement;
    expect(colorTrigger.getAttribute('aria-label')).toBe('Выберите цвет');
    colorTrigger.click();
    await colorFixture.whenStable();
    expect(colorFixture.nativeElement.querySelector('.krn-color-preview')?.textContent).toContain(
      'Предпросмотр',
    );
    expect(
      colorFixture.nativeElement.querySelector('.krn-picker__footer button')?.textContent,
    ).toContain('Готово');
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
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
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

  it('supports object identity and disabled policies in segmented control', async () => {
    interface View {
      readonly id: number;
      readonly locked?: boolean;
    }
    const fixture = TestBed.createComponent(KrnSegmentedControl<View>);
    const list = { id: 1 };
    const board = { id: 2, locked: true };
    fixture.componentRef.setInput('options', [
      { value: list, label: 'List' },
      { value: board, label: 'Board' },
    ]);
    fixture.componentRef.setInput(
      'identityMatcher',
      (left: View, right: View) => left.id === right.id,
    );
    fixture.componentRef.setInput(
      'disabledHandler',
      (option: { value: View }) => option.value.locked ?? false,
    );
    fixture.componentInstance.writeValue({ id: 1 });
    const change = vi.fn();
    fixture.componentInstance.registerOnChange(change);
    await fixture.whenStable();

    const buttons = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button'),
    ];
    expect(buttons[0]?.getAttribute('aria-checked')).toBe('true');
    expect(buttons[1]?.disabled).toBe(true);
    buttons[1]?.click();
    expect(change).not.toHaveBeenCalled();
  });

  it('validates OTP, tags, slider, and select intrinsic constraints', async () => {
    @Component({
      imports: [KrnMultiSelect, KrnOtpInput, KrnSlider, KrnTagsInput, ReactiveFormsModule],
      template: `
        <krn-otp-input [length]="4" [formControl]="otp" />
        <krn-tags-input required [maxTags]="2" [formControl]="tags" />
        <krn-slider [min]="0" [max]="100" [formControl]="slider" />
        <krn-multi-select required [options]="options" [formControl]="selection" />
      `,
    })
    class ExtendedValidationHost {
      readonly otp = new FormControl('12', { nonNullable: true });
      readonly tags = new FormControl<readonly string[]>([], { nonNullable: true });
      readonly slider = new FormControl(120, { nonNullable: true });
      readonly selection = new FormControl<readonly string[]>([], {
        nonNullable: true,
      });
      readonly options = [{ value: 'alpha', label: 'Alpha' }] as const;
    }

    const fixture = TestBed.createComponent(ExtendedValidationHost);
    await fixture.whenStable();
    const host = fixture.componentInstance;

    expect(host.otp.errors).toEqual({
      minlength: { requiredLength: 4, actualLength: 2 },
    });
    expect(host.tags.errors).toEqual({ required: true });
    expect(host.slider.errors).toEqual({ max: { max: 100, actual: 120 } });
    expect(host.selection.errors).toEqual({ required: true });

    host.otp.setValue('1234');
    host.tags.setValue(['one', 'two', 'three']);
    host.slider.setValue(80);
    host.selection.setValue(['alpha']);
    await fixture.whenStable();

    expect(host.otp.valid).toBe(true);
    expect(host.tags.errors).toEqual({
      maxlength: { requiredLength: 2, actualLength: 3 },
    });
    expect(host.slider.valid).toBe(true);
    expect(host.selection.valid).toBe(true);
  });

  it('validates required upload count, type, and size constraints', async () => {
    @Component({
      imports: [KrnFileUpload, ReactiveFormsModule],
      template: `
        <krn-file-upload
          required
          accept="image/png"
          [maxFiles]="1"
          [maxSize]="4"
          [formControl]="files"
        />
      `,
    })
    class UploadValidationHost {
      readonly files = new FormControl<readonly File[]>([], { nonNullable: true });
    }

    const fixture = TestBed.createComponent(UploadValidationHost);
    await fixture.whenStable();
    const control = fixture.componentInstance.files;
    expect(control.errors).toEqual({ required: true });

    control.setValue([new File(['12345'], 'report.txt', { type: 'text/plain' })]);
    await fixture.whenStable();
    expect(control.errors).toEqual({
      fileType: { files: ['report.txt'] },
      fileSize: { maxSize: 4, files: ['report.txt'] },
    });

    control.setValue([new File(['12'], 'avatar.png', { type: 'image/png' })]);
    await fixture.whenStable();
    expect(control.valid).toBe(true);
  });

  it('keeps readonly upload state on data attributes and the native file control', async () => {
    const fixture = TestBed.createComponent(KrnFileUpload);
    fixture.componentRef.setInput('readonly', true);
    await fixture.whenStable();

    const upload = fixture.nativeElement.querySelector('.krn-upload') as HTMLElement;
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(upload.hasAttribute('aria-readonly')).toBe(false);
    expect(upload.getAttribute('data-readonly')).toBe('true');
    expect(input.disabled).toBe(true);
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

  it('keeps readonly OTP semantics on each native input without prohibited fieldset ARIA', async () => {
    const fixture = TestBed.createComponent(KrnOtpInput);
    fixture.componentRef.setInput('readonly', true);
    await fixture.whenStable();

    const fieldset = fixture.nativeElement.querySelector('fieldset') as HTMLFieldSetElement;
    const inputs = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>('input'),
    ];
    expect(fieldset.hasAttribute('aria-readonly')).toBe(false);
    expect(fieldset.getAttribute('data-readonly')).toBe('true');
    expect(inputs.every((input) => input.readOnly)).toBe(true);
  });

  it('marks number controls with steppers for the 48px target-size layout', async () => {
    const fixture = TestBed.createComponent(KrnNumberInput);
    await fixture.whenStable();

    const shell = fixture.nativeElement.querySelector('.krn-number-control') as HTMLElement;
    expect(shell.querySelectorAll('.krn-stepper button')).toHaveLength(2);
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
