import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { renderApplication } from '@angular/platform-server';
import { KrnDropdownButton } from './dropdown-button';
import { provideKrnMenuButtonOptions } from './dropdown-button-options';

@Component({
  selector: 'krn-ssr-dropdown-button-host',
  imports: [KrnDropdownButton],
  template: `
    <krn-dropdown-button>
      <span krnLabel>Действия отчёта</span>
      <button krnMenu type="button">Скачать CSV</button>
    </krn-dropdown-button>
  `,
})
class SsrDropdownButtonHost {}

@Component({
  selector: 'krn-ssr-loading-dropdown-button-host',
  imports: [KrnDropdownButton],
  template: `
    <krn-dropdown-button loading [open]="true">
      <span krnLabel>Loading actions</span>
      <button krnMenu type="button">Hidden action</button>
    </krn-dropdown-button>
  `,
})
class SsrLoadingDropdownButtonHost {}

describe('KrnDropdownButton SSR', () => {
  it('serializes a deterministic native trigger, scoped defaults, and closed overlay state', async () => {
    const html = await renderApplication(
      (context) =>
        bootstrapApplication(
          SsrDropdownButtonHost,
          {
            providers: [
              provideKrnMenuButtonOptions({
                matchTriggerWidth: true,
                menuAlign: 'start',
                menuOffset: 6,
                size: 'lg',
                tone: 'neutral',
                variant: 'outline',
              }),
            ],
          },
          context,
        ),
      {
        document:
          '<!doctype html><html><body><krn-ssr-dropdown-button-host></krn-ssr-dropdown-button-host></body></html>',
        url: 'https://kern.example/dropdown-button',
        allowedHosts: ['kern.example'],
      },
    );
    const document = new DOMParser().parseFromString(html, 'text/html');
    const host = document.querySelector('krn-dropdown-button') as HTMLElement | null;
    const trigger = host?.querySelector('button[krnButton]') as HTMLButtonElement | null;

    expect(host?.dataset).toMatchObject({
      menuAlign: 'start',
      open: 'false',
      size: 'lg',
      tone: 'neutral',
      variant: 'outline',
    });
    expect(trigger?.type).toBe('button');
    expect(trigger?.textContent).toContain('Действия отчёта');
    expect(trigger?.getAttribute('aria-haspopup')).toBe('menu');
    expect(trigger?.getAttribute('aria-expanded')).toBe('false');
    expect(trigger?.getAttribute('aria-controls')).toMatch(/^krn-.+-menu-\d+$/);
    expect(trigger?.id).toMatch(/^krn-.+-menu-button-trigger-\d+$/);
    expect(trigger?.disabled).toBe(false);
    expect(trigger?.dataset).toMatchObject({
      loading: 'false',
      size: 'lg',
      tone: 'neutral',
      variant: 'outline',
    });
    expect(document.querySelector('[role="menu"]')).toBeNull();
  });

  it('coerces an invalid server-side open request closed while preserving loading semantics', async () => {
    const html = await renderApplication(
      (context) => bootstrapApplication(SsrLoadingDropdownButtonHost, { providers: [] }, context),
      {
        document:
          '<!doctype html><html><body><krn-ssr-loading-dropdown-button-host></krn-ssr-loading-dropdown-button-host></body></html>',
        url: 'https://kern.example/loading-dropdown-button',
        allowedHosts: ['kern.example'],
      },
    );
    const document = new DOMParser().parseFromString(html, 'text/html');
    const host = document.querySelector('krn-dropdown-button');
    const trigger = host?.querySelector('button[krnButton]') as HTMLButtonElement | null;

    expect(host?.getAttribute('data-open')).toBe('false');
    expect(trigger?.getAttribute('aria-expanded')).toBe('false');
    expect(trigger?.getAttribute('aria-disabled')).toBe('true');
    expect(trigger?.disabled).toBe(false);
    expect(document.querySelector('[role="menu"]')).toBeNull();
  });
});
