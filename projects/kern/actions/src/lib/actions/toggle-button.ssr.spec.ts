import { Component, signal } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { renderApplication } from '@angular/platform-server';
import { KrnToggleButton } from './toggle-button';
import { provideKrnToggleButtonOptions } from './toggle-button-options';

@Component({
  selector: 'krn-ssr-toggle-button-host',
  imports: [KrnToggleButton],
  template: `
    <form id="format-form"></form>
    <button
      krnToggleButton
      aria-describedby="format-help"
      form="format-form"
      name="format"
      [pressed]="true"
      type="submit"
      value="bold"
    >
      <span krnLeadingIcon>B</span>
      Bold text
    </button>
    <p id="format-help">Applies formatting to the selection.</p>
  `,
})
class SsrToggleButtonHost {}

@Component({
  selector: 'krn-ssr-dynamic-toggle-button-host',
  imports: [KrnToggleButton],
  template: `
    <button
      krnToggleButton
      [attr.aria-pressed]="competingAriaPressed()"
      [pressed]="true"
      value="watch"
    >
      Watch changes
    </button>
  `,
})
class SsrDynamicToggleButtonHost {
  readonly competingAriaPressed = signal<string | null>('false');

  constructor() {
    queueMicrotask(() => this.competingAriaPressed.set(null));
  }
}

describe('KrnToggleButton SSR', () => {
  it('serializes one native toggle with state, form relationships, and scoped appearance', async () => {
    const html = await renderApplication(
      (context) =>
        bootstrapApplication(
          SsrToggleButtonHost,
          {
            providers: [
              provideKrnToggleButtonOptions({
                pressedTone: 'success',
                pressedVariant: 'solid',
                size: 'lg',
              }),
            ],
          },
          context,
        ),
      {
        document:
          '<!doctype html><html><body><krn-ssr-toggle-button-host></krn-ssr-toggle-button-host></body></html>',
        url: 'https://kern.example/toggle-button',
        allowedHosts: ['kern.example'],
      },
    );
    const document = new DOMParser().parseFromString(html, 'text/html');
    const button = document.querySelector('button[krnToggleButton]') as HTMLButtonElement | null;

    expect(document.querySelector('krn-toggle-button')).toBeNull();
    expect(button?.querySelector('button')).toBeNull();
    expect(button?.getAttribute('type')).toBe('submit');
    expect(button?.getAttribute('form')).toBe('format-form');
    expect(button?.getAttribute('name')).toBe('format');
    expect(button?.getAttribute('value')).toBe('bold');
    expect(button?.getAttribute('aria-describedby')).toBe('format-help');
    expect(button?.getAttribute('aria-pressed')).toBe('true');
    expect(button?.getAttribute('data-pressed')).toBe('true');
    expect(button?.getAttribute('data-size')).toBe('lg');
    expect(button?.getAttribute('data-tone')).toBe('success');
    expect(button?.getAttribute('data-variant')).toBe('solid');
    expect(button?.querySelector('.krn-action__label')?.textContent).toContain('Bold text');
  });

  it('reasserts pressed semantics across additional server render passes', async () => {
    const html = await renderApplication(
      (context) => bootstrapApplication(SsrDynamicToggleButtonHost, { providers: [] }, context),
      {
        document:
          '<!doctype html><html><body><krn-ssr-dynamic-toggle-button-host></krn-ssr-dynamic-toggle-button-host></body></html>',
        url: 'https://kern.example/toggle-button-dynamic',
        allowedHosts: ['kern.example'],
      },
    );
    const document = new DOMParser().parseFromString(html, 'text/html');

    expect(document.querySelector('button[krnToggleButton]')?.getAttribute('aria-pressed')).toBe(
      'true',
    );
  });
});
