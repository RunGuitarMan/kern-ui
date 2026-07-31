import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { renderApplication } from '@angular/platform-server';
import { KrnAutocomplete } from './select-controls';

@Component({
  selector: 'krn-autocomplete-ssr-host',
  imports: [KrnAutocomplete],
  template: `
    <krn-autocomplete data-mode="inline" autocompleteMode="inline" [options]="options" />
    <krn-autocomplete data-mode="both" autocompleteMode="both" [options]="options" />
    <krn-autocomplete data-mode="none" autocompleteMode="none" [options]="options" />
  `,
})
class SsrAutocompleteHost {
  readonly options = [{ value: 'alpha', label: 'Alpha' }];
}

describe('KrnAutocomplete SSR', () => {
  it('serializes stable mode semantics before hydration', async () => {
    const html = await renderApplication(
      (context) => bootstrapApplication(SsrAutocompleteHost, { providers: [] }, context),
      {
        document:
          '<!doctype html><html><body><krn-autocomplete-ssr-host></krn-autocomplete-ssr-host></body></html>',
        url: 'https://kern.example/forms/autocomplete',
        allowedHosts: ['kern.example'],
      },
    );
    const document = new DOMParser().parseFromString(html, 'text/html');
    const inline = document.querySelector<HTMLElement>('[data-mode="inline"]');
    const both = document.querySelector<HTMLElement>('[data-mode="both"]');
    const none = document.querySelector<HTMLElement>('[data-mode="none"]');
    const inlineInput = inline?.querySelector('input');
    const bothInput = both?.querySelector('input');
    const noneInput = none?.querySelector('input');

    expect(inlineInput?.getAttribute('aria-autocomplete')).toBe('inline');
    expect(inlineInput?.getAttribute('aria-expanded')).toBe('false');
    expect(inline?.querySelector('.krn-combobox-toggle')).toBeNull();
    expect(bothInput?.getAttribute('aria-autocomplete')).toBe('both');
    expect(bothInput?.getAttribute('aria-expanded')).toBe('false');
    expect(both?.querySelector('.krn-combobox-toggle')).not.toBeNull();
    expect(noneInput?.getAttribute('aria-autocomplete')).toBe('none');
    expect(noneInput?.getAttribute('aria-expanded')).toBe('false');
    expect(none?.querySelector('.krn-combobox-toggle')).toBeNull();
  });
});
