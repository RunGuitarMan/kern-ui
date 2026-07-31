import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { renderApplication } from '@angular/platform-server';
import { KrnButton } from './button';
import { provideKrnButtonOptions } from './button-options';

@Component({
  selector: 'krn-ssr-button-host',
  imports: [KrnButton],
  template: `
    <form id="publish-form"></form>
    <button
      krnButton
      aria-label="Publish workspace"
      form="publish-form"
      name="intent"
      value="publish"
      loading
    >
      Publish
    </button>
  `,
})
class SsrButtonHost {}

describe('KrnButton SSR', () => {
  it('serializes native semantics, scoped defaults, and loading state without a wrapper', async () => {
    const html = await renderApplication(
      (context) =>
        bootstrapApplication(
          SsrButtonHost,
          {
            providers: [provideKrnButtonOptions({ size: 'lg', variant: 'outline' })],
          },
          context,
        ),
      {
        document:
          '<!doctype html><html><body><krn-ssr-button-host></krn-ssr-button-host></body></html>',
        url: 'https://kern.example/button',
        allowedHosts: ['kern.example'],
      },
    );
    const document = new DOMParser().parseFromString(html, 'text/html');
    const button = document.querySelector('button[krnButton]') as HTMLButtonElement | null;

    expect(document.querySelector('krn-button')).toBeNull();
    expect(button?.getAttribute('type')).toBe('button');
    expect(button?.getAttribute('form')).toBe('publish-form');
    expect(button?.getAttribute('name')).toBe('intent');
    expect(button?.getAttribute('value')).toBe('publish');
    expect(button?.getAttribute('aria-label')).toBe('Publish workspace');
    expect(button?.getAttribute('aria-busy')).toBeNull();
    expect(button?.getAttribute('aria-disabled')).toBe('true');
    expect(button?.getAttribute('data-size')).toBe('lg');
    expect(button?.getAttribute('data-variant')).toBe('outline');
    expect(button?.querySelector('[role="status"]')?.textContent).toContain('Loading');
  });
});
