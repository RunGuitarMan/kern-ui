import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { renderApplication } from '@angular/platform-server';
import { KrnIconButton } from './icon-button';
import { provideKrnIconButtonOptions } from './icon-button-options';

@Component({
  selector: 'krn-ssr-icon-button-host',
  imports: [KrnIconButton],
  template: `
    <form id="archive-form"></form>
    <span id="archive-label">Archive workspace</span>
    <button
      krnIconButton
      aria-describedby="archive-help"
      aria-labelledby="archive-label"
      form="archive-form"
      loading
      name="intent"
      value="archive"
    >
      ×
    </button>
    <p id="archive-help">Moves the current workspace into the archive.</p>
  `,
})
class SsrIconButtonHost {}

describe('KrnIconButton SSR', () => {
  it('serializes native semantics, scoped defaults, and loading state without a wrapper', async () => {
    const html = await renderApplication(
      (context) =>
        bootstrapApplication(
          SsrIconButtonHost,
          {
            providers: [provideKrnIconButtonOptions({ size: 'lg', variant: 'outline' })],
          },
          context,
        ),
      {
        document:
          '<!doctype html><html><body><krn-ssr-icon-button-host></krn-ssr-icon-button-host></body></html>',
        url: 'https://kern.example/icon-button',
        allowedHosts: ['kern.example'],
      },
    );
    const document = new DOMParser().parseFromString(html, 'text/html');
    const button = document.querySelector('button[krnIconButton]') as HTMLButtonElement | null;

    expect(document.querySelector('krn-icon-button')).toBeNull();
    expect(button?.querySelector('button')).toBeNull();
    expect(button?.getAttribute('type')).toBe('button');
    expect(button?.getAttribute('form')).toBe('archive-form');
    expect(button?.getAttribute('name')).toBe('intent');
    expect(button?.getAttribute('value')).toBe('archive');
    expect(button?.getAttribute('aria-labelledby')).toBe('archive-label');
    expect(button?.getAttribute('aria-describedby')).toBe('archive-help');
    expect(button?.getAttribute('aria-busy')).toBeNull();
    expect(button?.getAttribute('aria-disabled')).toBe('true');
    expect(button?.getAttribute('data-size')).toBe('lg');
    expect(button?.getAttribute('data-variant')).toBe('outline');
    expect(button?.querySelector('[role="status"]')?.textContent).toContain('Loading');
  });
});
