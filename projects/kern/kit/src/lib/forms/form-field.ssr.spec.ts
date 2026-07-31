import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { bootstrapApplication } from '@angular/platform-browser';
import { renderApplication } from '@angular/platform-server';
import { KrnFormField, KrnHint, KrnLabel } from './form-field';
import { KrnOtpInput } from './otp-tags';
import { KrnTextInput } from './text-inputs';

@Component({
  selector: 'krn-form-field-ssr-host',
  imports: [KrnFormField, KrnHint, KrnLabel, KrnOtpInput, KrnTextInput, ReactiveFormsModule],
  template: `
    <krn-form-field
      id="workspace-field"
      label="Shorthand label"
      hint="Hidden inline hint"
      error="Use 3–48 characters."
      optionalText="Optional"
    >
      <krn-label>Workspace name</krn-label>
      <krn-text-input id="workspace-name" [formControl]="control" />
      <krn-hint id="workspace-policy">Use the legal entity name.</krn-hint>
    </krn-form-field>
    <krn-form-field data-testid="pristine-field" label="Pristine required">
      <krn-text-input [formControl]="pristineControl" />
    </krn-form-field>
    <krn-form-field data-testid="touched-field" label="Touched required">
      <krn-text-input [formControl]="touchedControl" />
    </krn-form-field>
    <krn-form-field data-testid="composite-field" label="Verification code">
      <krn-otp-input label="Internal verification code" />
    </krn-form-field>
  `,
})
class SsrFormFieldHost {
  readonly control = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });
  readonly pristineControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });
  readonly touchedControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });

  constructor() {
    this.touchedControl.markAsTouched();
  }
}

describe('KrnFormField SSR', () => {
  it('serializes control-owned state and only mounted description relationships', async () => {
    const html = await renderApplication(
      (context) => bootstrapApplication(SsrFormFieldHost, { providers: [] }, context),
      {
        document:
          '<!doctype html><html><body><krn-form-field-ssr-host></krn-form-field-ssr-host></body></html>',
        url: 'https://kern.example/forms/form-field',
        allowedHosts: ['kern.example'],
      },
    );
    const document = new DOMParser().parseFromString(html, 'text/html');
    const field = document.querySelector<HTMLElement>('krn-form-field');
    const labels = field?.querySelectorAll('label') ?? [];
    const input = field?.querySelector<HTMLInputElement>('input');
    const error = field?.querySelector<HTMLElement>('.krn-message--error');
    const pristineField = document.querySelector<HTMLElement>('[data-testid="pristine-field"]');
    const touchedField = document.querySelector<HTMLElement>('[data-testid="touched-field"]');
    const compositeField = document.querySelector<HTMLElement>('[data-testid="composite-field"]');
    const compositeControl = compositeField?.querySelector<HTMLElement>(
      '[data-krn-form-field-control]',
    );
    const compositeLabel = compositeField?.querySelector<HTMLLabelElement>('label');

    expect(field?.id).toBe('workspace-field');
    expect(field?.getAttribute('data-required')).toBe('true');
    expect(field?.getAttribute('data-invalid')).toBe('true');
    expect(labels).toHaveLength(1);
    expect(labels[0]?.htmlFor).toBe('workspace-name');
    expect(input?.id).toBe('workspace-name');
    expect(input?.getAttribute('aria-describedby')?.split(' ')).toEqual([
      'workspace-policy',
      'workspace-name-error',
    ]);
    expect(field?.querySelector('#workspace-name-hint')).toBeNull();
    expect(error?.getAttribute('aria-live')).toBe('polite');
    expect(error?.hasAttribute('role')).toBe(false);
    expect(pristineField?.getAttribute('data-state')).toBe('default');
    expect(pristineField?.getAttribute('data-invalid')).toBe('false');
    expect(touchedField?.getAttribute('data-state')).toBe('invalid');
    expect(touchedField?.getAttribute('data-invalid')).toBe('true');
    expect(compositeControl?.getAttribute('aria-labelledby')).toBe(compositeLabel?.id);
    expect(compositeControl?.querySelector('legend')).toBeNull();
  });
});
