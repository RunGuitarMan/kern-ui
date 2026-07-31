import { Component, signal } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { renderApplication } from '@angular/platform-server';
import { KrnFloatingActionButton } from './button';
import { provideKrnFloatingActionButtonOptions } from './floating-action-button-options';

@Component({
  selector: 'krn-ssr-floating-action-host',
  imports: [KrnFloatingActionButton],
  template: `
    <form id="create-form"></form>
    <button
      krnFab
      aria-disabled="false"
      aria-describedby="create-help"
      extended="false"
      form="create-form"
      loading
      name="intent"
      type="submit"
      value="create"
    >
      <span krnFabIcon>+</span>
      Create workspace
    </button>
    <button krnFab aria-disabled="false" data-testid="idle">Idle action</button>
    <p id="create-help">Creates a workspace from the current template.</p>
  `,
})
class SsrFloatingActionHost {}

@Component({
  selector: 'krn-ssr-dynamic-floating-action-host',
  imports: [KrnFloatingActionButton],
  template: `
    <button krnFab loading [attr.aria-disabled]="ariaDisabled()">Create workspace</button>
  `,
})
class SsrDynamicFloatingActionHost {
  readonly ariaDisabled = signal<string | null>('false');

  constructor() {
    queueMicrotask(() => this.ariaDisabled.set(null));
  }
}

describe('KrnFloatingActionButton SSR', () => {
  it('serializes one native compact action with stable label, form, options, and loading state', async () => {
    const html = await renderApplication(
      (context) =>
        bootstrapApplication(
          SsrFloatingActionHost,
          {
            providers: [
              provideKrnFloatingActionButtonOptions({
                size: 'md',
                tone: 'success',
                variant: 'soft',
              }),
            ],
          },
          context,
        ),
      {
        document:
          '<!doctype html><html><body><krn-ssr-floating-action-host></krn-ssr-floating-action-host></body></html>',
        url: 'https://kern.example/floating-action',
        allowedHosts: ['kern.example'],
      },
    );
    const document = new DOMParser().parseFromString(html, 'text/html');
    const button = document.querySelector('button[krnFab]') as HTMLButtonElement | null;
    const idleButton = document.querySelector('[data-testid="idle"]');
    const label = button?.querySelector('.krn-action__label');

    expect(document.querySelector('krn-floating-action-button')).toBeNull();
    expect(button?.querySelector('button')).toBeNull();
    expect(button?.getAttribute('type')).toBe('submit');
    expect(button?.getAttribute('form')).toBe('create-form');
    expect(button?.getAttribute('name')).toBe('intent');
    expect(button?.getAttribute('value')).toBe('create');
    expect(button?.getAttribute('aria-describedby')).toBe('create-help');
    expect(button?.getAttribute('aria-disabled')).toBe('true');
    expect(button?.getAttribute('aria-busy')).toBeNull();
    expect(button?.getAttribute('data-extended')).toBe('false');
    expect(button?.getAttribute('data-size')).toBe('md');
    expect(button?.getAttribute('data-tone')).toBe('success');
    expect(button?.getAttribute('data-variant')).toBe('soft');
    expect(label?.getAttribute('aria-hidden')).toBeNull();
    expect(label?.textContent).toContain('Create workspace');
    expect(button?.querySelector('[role="status"]')?.textContent).toContain('Loading');
    expect(idleButton?.getAttribute('aria-disabled')).toBeNull();
  });

  it('keeps loading aria-disabled deterministic across additional server render passes', async () => {
    const html = await renderApplication(
      (context) => bootstrapApplication(SsrDynamicFloatingActionHost, { providers: [] }, context),
      {
        document:
          '<!doctype html><html><body><krn-ssr-dynamic-floating-action-host></krn-ssr-dynamic-floating-action-host></body></html>',
        url: 'https://kern.example/floating-action-dynamic',
        allowedHosts: ['kern.example'],
      },
    );
    const document = new DOMParser().parseFromString(html, 'text/html');

    expect(document.querySelector('button[krnFab]')?.getAttribute('aria-disabled')).toBe('true');
  });
});
