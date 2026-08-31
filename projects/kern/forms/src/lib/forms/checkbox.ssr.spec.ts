import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { bootstrapApplication } from '@angular/platform-browser';
import { renderApplication } from '@angular/platform-server';
import { KrnCheckbox } from './selection-controls';

@Component({
  selector: 'krn-checkbox-ssr-host',
  imports: [KrnCheckbox, ReactiveFormsModule],
  template: `
    <krn-checkbox class="mixed" [formControl]="mixed">Mixed option</krn-checkbox>
    <krn-checkbox class="determinate" [formControl]="determinate">
      Determinate option
    </krn-checkbox>
  `,
})
class SsrCheckboxHost {
  readonly mixed = new FormControl<boolean | null>(null);
  readonly determinate = new FormControl<boolean | null>(false);
}

describe('KrnCheckbox SSR', () => {
  it('serializes only the mixed ARIA state before hydration', async () => {
    const html = await renderApplication(
      (context) => bootstrapApplication(SsrCheckboxHost, { providers: [] }, context),
      {
        document:
          '<!doctype html><html><body><krn-checkbox-ssr-host></krn-checkbox-ssr-host></body></html>',
        url: 'https://kern.example/forms/checkbox',
        allowedHosts: ['kern.example'],
      },
    );
    const document = new DOMParser().parseFromString(html, 'text/html');
    const mixed = document.querySelector<HTMLInputElement>('krn-checkbox.mixed input');
    const determinate = document.querySelector<HTMLInputElement>('krn-checkbox.determinate input');

    expect(mixed?.getAttribute('aria-checked')).toBe('mixed');
    expect(mixed?.getAttribute('data-indeterminate')).toBe('true');
    expect(determinate?.hasAttribute('aria-checked')).toBe(false);
    expect(determinate?.getAttribute('data-indeterminate')).toBe('false');
  });
});
