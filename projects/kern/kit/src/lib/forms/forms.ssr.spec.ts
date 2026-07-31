import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { bootstrapApplication } from '@angular/platform-browser';
import { renderApplication } from '@angular/platform-server';
import { KrnFormField } from './form-field';
import { KrnNativeSelect } from './select-controls';
import { KrnTextInput } from './text-inputs';

@Component({
  selector: 'krn-ssr-validators-host',
  imports: [KrnFormField, KrnTextInput, ReactiveFormsModule],
  template: `
    <krn-form-field label="Workspace name" optionalText="Optional">
      <krn-text-input [formControl]="control" />
    </krn-form-field>
  `,
})
class SsrValidatorsHost {
  readonly control = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });
}

@Component({
  selector: 'krn-ssr-native-select-host',
  imports: [KrnNativeSelect, ReactiveFormsModule],
  template: `
    <krn-native-select class="empty" [formControl]="empty" [options]="options" />
    <krn-native-select class="selected" [formControl]="selected" [options]="options" />
  `,
})
class SsrNativeSelectHost {
  readonly options = [
    { value: 'alpha', label: 'Alpha' },
    { value: 'beta', label: 'Beta' },
  ];
  readonly empty = new FormControl<string | null>(null);
  readonly selected = new FormControl<string | null>('beta');
}

describe('Kern forms SSR', () => {
  it('serializes validators-only required state without exposing pristine invalid state', async () => {
    const html = await renderApplication(
      (context) => bootstrapApplication(SsrValidatorsHost, { providers: [] }, context),
      {
        document:
          '<!doctype html><html><body><krn-ssr-validators-host></krn-ssr-validators-host></body></html>',
        url: 'https://kern.example/forms',
        allowedHosts: ['kern.example'],
      },
    );
    const document = new DOMParser().parseFromString(html, 'text/html');
    const field = document.querySelector('krn-form-field');
    const input = document.querySelector('krn-text-input input');

    expect(field?.getAttribute('data-required')).toBe('true');
    expect(field?.getAttribute('data-invalid')).toBe('false');
    expect(field?.getAttribute('data-state')).toBe('default');
    expect(field?.querySelector('.krn-required')).not.toBeNull();
    expect(field?.querySelector('.krn-optional')).toBeNull();
    expect(input?.hasAttribute('required')).toBe(true);
    expect(input?.getAttribute('aria-invalid')).toBe('false');
  });

  it('serializes a null sentinel before native options when no placeholder is supplied', async () => {
    const html = await renderApplication(
      (context) => bootstrapApplication(SsrNativeSelectHost, { providers: [] }, context),
      {
        document:
          '<!doctype html><html><body><krn-ssr-native-select-host></krn-ssr-native-select-host></body></html>',
        url: 'https://kern.example/forms',
        allowedHosts: ['kern.example'],
      },
    );
    const document = new DOMParser().parseFromString(html, 'text/html');
    const select = document.querySelector<HTMLSelectElement>('krn-native-select.empty select');
    const selected = document.querySelector<HTMLSelectElement>('krn-native-select.selected select');

    expect(select?.options).toHaveLength(3);
    expect(select?.selectedIndex).toBe(0);
    expect(select?.options[0]?.hidden).toBe(true);
    expect(select?.options[0]?.hasAttribute('selected')).toBe(true);
    expect(select?.options[0]?.textContent?.trim()).toBe('');
    expect(select?.options[1]?.textContent?.trim()).toBe('Alpha');
    expect(selected?.selectedIndex).toBe(2);
    expect(selected?.options[2]?.hasAttribute('selected')).toBe(true);
  });
});
