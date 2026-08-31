import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  KrnColorPicker,
  KrnDatePicker,
  KrnDateRangePicker,
  KrnTimePicker,
} from './date-time-controls';
import { KrnFormField, KrnHint, KrnLabel } from './form-field';
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
  KrnSwitch,
} from './selection-controls';
import {
  KrnNumberInput,
  KrnPasswordInput,
  KrnSearchInput,
  KrnTextarea,
  KrnTextInput,
} from './text-inputs';
import { KrnDropUpload, KrnFileUpload } from './upload-controls';

const accessibleNameFromLabelledBy = (element: HTMLElement): string =>
  (element.getAttribute('aria-labelledby') ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .map((id) => element.ownerDocument.getElementById(id)?.textContent ?? '')
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

describe('KrnFormField', () => {
  it('preserves the host id and associates one projected label with the registered control id', async () => {
    @Component({
      imports: [KrnFormField, KrnLabel, KrnTextInput],
      template: `
        <krn-form-field id="field-container" label="Shorthand label">
          <krn-label>Projected label</krn-label>
          <krn-text-input id="workspace-name" />
        </krn-form-field>
      `,
    })
    class LabelHost {}

    const fixture = TestBed.createComponent(LabelHost);
    await fixture.whenStable();
    const field = fixture.nativeElement.querySelector('krn-form-field') as HTMLElement;
    const labels = field.querySelectorAll('label');
    const input = field.querySelector('input') as HTMLInputElement;

    expect(field.id).toBe('field-container');
    expect(labels).toHaveLength(1);
    expect(labels[0]?.textContent?.trim()).toBe('Projected label');
    expect(labels[0]?.htmlFor).toBe('workspace-name');
    expect(input.id).toBe('workspace-name');
    expect(input.getAttribute('aria-labelledby')).toBe(labels[0]?.id);
    expect(input.getAttribute('aria-label')).toBeNull();
  });

  it('references only mounted inline descriptions while preserving projected hints', async () => {
    @Component({
      imports: [KrnFormField, KrnHint, KrnTextInput],
      template: `
        <krn-form-field label="Workspace name" hint="Visible to every member." [error]="error()">
          <krn-text-input id="workspace-name" />
          <krn-hint id="workspace-policy">Use the legal entity name.</krn-hint>
        </krn-form-field>
      `,
    })
    class DescriptionHost {
      readonly error = signal('Use 3–48 characters.');
    }

    const fixture = TestBed.createComponent(DescriptionHost);
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    expect(fixture.nativeElement.querySelector('#workspace-name-hint')).toBeNull();
    expect(input.getAttribute('aria-describedby')?.split(' ')).toEqual([
      'workspace-policy',
      'workspace-name-error',
    ]);

    fixture.componentInstance.error.set('');
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('#workspace-name-hint')).not.toBeNull();
    expect(input.getAttribute('aria-describedby')?.split(' ')).toEqual([
      'workspace-name-hint',
      'workspace-policy',
    ]);
  });

  it('derives required, pending, valid, and disabled state from all Angular control events', async () => {
    @Component({
      imports: [KrnFormField, KrnTextInput, ReactiveFormsModule],
      template: `
        <krn-form-field label="Account name" optionalText="Optional">
          <krn-text-input id="account-name" [formControl]="control" />
        </krn-form-field>
      `,
    })
    class AngularStateHost {
      readonly control = new FormControl('', { nonNullable: true });
    }

    const fixture = TestBed.createComponent(AngularStateHost);
    await fixture.whenStable();
    const field = fixture.nativeElement.querySelector('krn-form-field') as HTMLElement;
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const control = fixture.componentInstance.control;

    expect(field.getAttribute('data-state')).toBe('default');
    expect(field.getAttribute('data-required')).toBe('false');
    expect(field.querySelector('.krn-optional')?.textContent?.trim()).toBe('Optional');

    control.addValidators(Validators.required);
    control.updateValueAndValidity();
    await fixture.whenStable();
    expect(field.getAttribute('data-required')).toBe('true');
    expect(field.getAttribute('data-invalid')).toBe('false');
    expect(field.getAttribute('data-state')).toBe('default');
    expect(field.querySelector('.krn-required')).not.toBeNull();
    expect(field.querySelector('.krn-optional')).toBeNull();

    control.markAsTouched();
    await fixture.whenStable();
    expect(field.getAttribute('data-invalid')).toBe('true');
    expect(field.getAttribute('data-state')).toBe('invalid');

    control.setValue('Enterprise');
    await fixture.whenStable();
    expect(field.getAttribute('data-state')).toBe('valid');
    expect(field.getAttribute('data-valid')).toBe('true');

    control.markAsPending();
    await fixture.whenStable();
    expect(field.getAttribute('data-state')).toBe('pending');

    control.disable();
    await fixture.whenStable();
    expect(field.getAttribute('data-disabled')).toBe('true');
    expect(input.disabled).toBe(true);
  });

  it('derives the required marker exclusively from the registered control inside a field', async () => {
    @Component({
      imports: [KrnFormField, KrnLabel, KrnTextInput],
      template: `
        <krn-form-field optionalText="Optional">
          <krn-label required>Account name</krn-label>
          <krn-text-input [required]="controlRequired()" />
        </krn-form-field>
      `,
    })
    class RequiredOwnershipHost {
      readonly controlRequired = signal(false);
    }

    const fixture = TestBed.createComponent(RequiredOwnershipHost);
    await fixture.whenStable();
    const field = fixture.nativeElement.querySelector('krn-form-field') as HTMLElement;

    expect(field.querySelector('.krn-required')).toBeNull();
    expect(field.querySelector('.krn-optional')?.textContent?.trim()).toBe('Optional');

    fixture.componentInstance.controlRequired.set(true);
    await fixture.whenStable();

    expect(field.querySelector('.krn-required')).not.toBeNull();
    expect(field.querySelector('.krn-optional')).toBeNull();
  });

  it('labels and focuses every composite form control through its registered group root', async () => {
    @Component({
      imports: [
        KrnCheckbox,
        KrnCheckboxGroup,
        KrnFormField,
        KrnRadio,
        KrnRadioGroup,
        KrnRangeSlider,
        KrnSegmentedControl,
      ],
      template: `
        <krn-form-field label="Permissions" hint="Choose permissions.">
          <krn-checkbox-group label="Internal permissions">
            <krn-checkbox value="read">Read</krn-checkbox>
          </krn-checkbox-group>
        </krn-form-field>
        <krn-form-field label="Plan" hint="Choose a plan.">
          <krn-radio-group label="Internal plan">
            <krn-radio value="starter">Starter</krn-radio>
          </krn-radio-group>
        </krn-form-field>
        <krn-form-field label="Density" hint="Choose a density.">
          <krn-segmented-control ariaLabel="Internal density" [options]="segments" />
        </krn-form-field>
        <krn-form-field label="Budget range" hint="Choose both limits.">
          <krn-range-slider label="Internal budget range" />
        </krn-form-field>
      `,
    })
    class CompositeControlsHost {
      readonly segments = [{ value: 'comfortable', label: 'Comfortable' }] as const;
    }

    const fixture = TestBed.createComponent(CompositeControlsHost);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    const fields = [...host.querySelectorAll<HTMLElement>('krn-form-field')];

    expect(fields).toHaveLength(4);
    for (const field of fields) {
      const label = field.querySelector<HTMLLabelElement>('.krn-field-heading label');
      const control = field.querySelector<HTMLElement>('[data-krn-form-field-control]');

      expect(label?.id).toBe(`${control?.id}-field-label`);
      expect(label?.htmlFor).toBe('');
      expect(control?.getAttribute('aria-labelledby')).toBe(label?.id);
      expect(control?.getAttribute('aria-label')).toBeNull();
      expect(control?.getAttribute('aria-describedby')).toBe(`${control?.id}-hint`);
      expect(control?.querySelector('legend')).toBeNull();

      label?.click();
      expect(control?.contains(fixture.nativeElement.ownerDocument.activeElement)).toBe(true);
    }
  });

  it('keeps the OTP internal name when no Form Field label is mounted', async () => {
    @Component({
      imports: [KrnFormField, KrnOtpInput],
      template: `
        <krn-form-field hint="Enter every digit.">
          <krn-otp-input label="Verification code" />
        </krn-form-field>
      `,
    })
    class InternallyLabelledCompositeHost {}

    const fixture = TestBed.createComponent(InternallyLabelledCompositeHost);
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const label = fixture.nativeElement.querySelector(`#${input.id}-label`) as HTMLElement;

    expect(input.getAttribute('aria-labelledby')).toBe(label.id);
    expect(label.textContent?.trim()).toBe('Verification code');
  });

  it('gives every native-strategy control visible Form Field label ownership', async () => {
    @Component({
      imports: [
        KrnAutocomplete,
        KrnCheckbox,
        KrnColorPicker,
        KrnCombobox,
        KrnDatePicker,
        KrnDateRangePicker,
        KrnDropUpload,
        KrnFileUpload,
        KrnFormField,
        KrnMultiSelect,
        KrnNativeSelect,
        KrnNumberInput,
        KrnOtpInput,
        KrnPasswordInput,
        KrnSearchInput,
        KrnSelect,
        KrnSlider,
        KrnSwitch,
        KrnTagsInput,
        KrnTextarea,
        KrnTextInput,
        KrnTimePicker,
      ],
      template: `
        <krn-form-field label="Text"><krn-text-input ariaLabel="Local text" /></krn-form-field>
        <krn-form-field label="Notes"><krn-textarea ariaLabel="Local notes" /></krn-form-field>
        <krn-form-field label="Password">
          <krn-password-input ariaLabel="Local password" />
        </krn-form-field>
        <krn-form-field label="Query"><krn-search-input ariaLabel="Local search" /></krn-form-field>
        <krn-form-field label="Count"><krn-number-input ariaLabel="Local count" /></krn-form-field>
        <krn-form-field label="Native choice">
          <krn-native-select ariaLabel="Local native choice" [options]="options" />
        </krn-form-field>
        <krn-form-field label="Choice">
          <krn-select ariaLabel="Local choice" [options]="options" />
        </krn-form-field>
        <krn-form-field label="Choices">
          <krn-multi-select ariaLabel="Local choices" [options]="options" />
        </krn-form-field>
        <krn-form-field label="Combobox">
          <krn-combobox ariaLabel="Local combobox" [options]="options" />
        </krn-form-field>
        <krn-form-field label="Autocomplete">
          <krn-autocomplete ariaLabel="Local autocomplete" [options]="options" />
        </krn-form-field>
        <krn-form-field label="Enabled">
          <krn-checkbox ariaLabel="Local enabled">I agree to emails</krn-checkbox>
        </krn-form-field>
        <krn-form-field label="Notifications">
          <krn-switch ariaLabel="Local notifications">Send product updates</krn-switch>
        </krn-form-field>
        <krn-form-field label="Value">
          <krn-slider label="Monthly budget" ariaLabel="Local value" />
        </krn-form-field>
        <krn-form-field label="Tags">
          <krn-tags-input inputLabel="Local tag input" />
        </krn-form-field>
        <krn-form-field label="Date"><krn-date-picker ariaLabel="Local date" /></krn-form-field>
        <krn-form-field label="Date range">
          <krn-date-range-picker ariaLabel="Local date range" />
        </krn-form-field>
        <krn-form-field label="Time"><krn-time-picker ariaLabel="Local time" /></krn-form-field>
        <krn-form-field label="Color"><krn-color-picker ariaLabel="Local color" /></krn-form-field>
        <krn-form-field label="Files"><krn-file-upload label="Local files" /></krn-form-field>
        <krn-form-field label="Drop files">
          <krn-drop-upload label="Local drop files" />
        </krn-form-field>
        <krn-form-field label="Verification code">
          <krn-otp-input label="Local verification code" />
        </krn-form-field>
      `,
    })
    class NativeControlsHost {
      readonly options = [{ value: 'one', label: 'One' }] as const;
    }

    const fixture = TestBed.createComponent(NativeControlsHost);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    const fields = [...host.querySelectorAll<HTMLElement>('krn-form-field')];

    expect(fields).toHaveLength(21);
    for (const field of fields) {
      const label = field.querySelector<HTMLLabelElement>('.krn-field-heading label');
      const control = field.querySelector<HTMLElement>('[data-krn-form-field-control]');

      expect(control).not.toBeNull();
      expect(label?.htmlFor).toBe(control?.id);
      expect(control?.getAttribute('aria-labelledby')?.split(/\s+/)).toContain(label?.id);
      expect(control?.getAttribute('aria-label')).toBeNull();
    }

    const selfLabelledNames = fields
      .slice(10, 13)
      .map((field) =>
        accessibleNameFromLabelledBy(
          field.querySelector<HTMLElement>('[data-krn-form-field-control]')!,
        ),
      );
    expect(selfLabelledNames).toEqual([
      'Enabled I agree to emails',
      'Notifications Send product updates',
      'Value Monthly budget',
    ]);
  });

  it('merges manual group descriptions with mounted field hint and error ids', async () => {
    @Component({
      imports: [KrnCheckboxGroup, KrnFormField],
      template: `
        <p id="policy">Company policy.</p>
        <krn-form-field label="Permissions" hint="Choose permissions." [error]="error()">
          <krn-checkbox-group id="permissions" describedBy="policy policy" />
        </krn-form-field>
      `,
    })
    class GroupDescriptionsHost {
      readonly error = signal('');
    }

    const fixture = TestBed.createComponent(GroupDescriptionsHost);
    await fixture.whenStable();
    const group = fixture.nativeElement.querySelector('fieldset') as HTMLFieldSetElement;

    expect(group.getAttribute('aria-describedby')).toBe('policy permissions-hint');

    fixture.componentInstance.error.set('Choose at least one permission.');
    await fixture.whenStable();

    expect(group.getAttribute('aria-describedby')).toBe('policy permissions-error');
  });

  it('moves primary ownership when tracked controls are reordered in the DOM', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    @Component({
      imports: [KrnFormField, KrnTextInput],
      template: `
        <krn-form-field label="Tracked controls">
          @for (item of items(); track item.id) {
            <krn-text-input [id]="item.id" />
          }
        </krn-form-field>
      `,
    })
    class ReorderedControlsHost {
      readonly first = { id: 'first-control' };
      readonly second = { id: 'second-control' };
      readonly items = signal([this.first, this.second]);
    }

    const fixture = TestBed.createComponent(ReorderedControlsHost);
    await fixture.whenStable();
    const field = fixture.nativeElement.querySelector('krn-form-field') as HTMLElement;
    const label = field.querySelector('label') as HTMLLabelElement;

    expect(label.htmlFor).toBe('first-control');
    expect(field.querySelector<HTMLInputElement>('[data-krn-form-field-control]')?.id).toBe(
      'first-control',
    );

    fixture.componentInstance.items.set([
      fixture.componentInstance.second,
      fixture.componentInstance.first,
    ]);
    await fixture.whenStable();

    expect([...field.querySelectorAll('input')].map((input) => input.id)).toEqual([
      'second-control',
      'first-control',
    ]);
    expect(label.htmlFor).toBe('second-control');
    expect(field.querySelector<HTMLInputElement>('[data-krn-form-field-control]')?.id).toBe(
      'second-control',
    );
    warn.mockRestore();
  });

  it('keeps control ids unique and moves primary ownership after removal', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    @Component({
      imports: [KrnFormField, KrnTextInput],
      template: `
        <krn-form-field label="Ambiguous">
          @if (showFirst()) {
            <krn-text-input />
          }
          <krn-text-input id="second-control" />
        </krn-form-field>
      `,
    })
    class MultipleControlsHost {
      readonly showFirst = signal(true);
    }

    const fixture = TestBed.createComponent(MultipleControlsHost);
    await fixture.whenStable();
    const field = fixture.nativeElement.querySelector('krn-form-field') as HTMLElement;
    const label = field.querySelector('label') as HTMLLabelElement;
    const inputs = [...field.querySelectorAll<HTMLInputElement>('input')];

    expect(
      warn.mock.calls.filter(([message]) =>
        String(message).includes('more than one registered control'),
      ),
    ).toHaveLength(1);
    expect(inputs).toHaveLength(2);
    expect(inputs[0]?.id).toBeTruthy();
    expect(inputs[0]?.id).not.toBe(inputs[1]?.id);
    expect(inputs[1]?.id).toBe('second-control');
    expect(label.htmlFor).toBe(inputs[0]?.id);
    expect(inputs[0]?.hasAttribute('data-krn-form-field-control')).toBe(true);
    expect(inputs[1]?.hasAttribute('data-krn-form-field-control')).toBe(false);

    fixture.componentInstance.showFirst.set(false);
    await fixture.whenStable();

    const remaining = field.querySelector('input') as HTMLInputElement;
    expect(remaining.id).toBe('second-control');
    expect(label.htmlFor).toBe('second-control');
    expect(remaining.hasAttribute('data-krn-form-field-control')).toBe(true);
    warn.mockRestore();
  });
});
