import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { renderApplication } from '@angular/platform-server';
import { KrnSplitButton } from './dropdown-button';
import { provideKrnMenuButtonOptions } from './dropdown-button-options';

@Component({
  selector: 'krn-ssr-split-button-host',
  imports: [KrnSplitButton],
  template: `
    <krn-split-button menuLabel="Открыть варианты публикации">
      <span krnLabel>Опубликовать</span>
      <button krnMenu type="button">Сохранить черновик</button>
    </krn-split-button>
  `,
})
class SsrSplitButtonHost {}

@Component({
  selector: 'krn-ssr-loading-split-button-host',
  imports: [KrnSplitButton],
  template: `
    <krn-split-button loading [open]="true">
      <span krnLabel>Publishing</span>
      <button krnMenu type="button">Hidden action</button>
    </krn-split-button>
  `,
})
class SsrLoadingSplitButtonHost {}

describe('KrnSplitButton SSR', () => {
  it('serializes two native KrnButton segments and deterministic closed menu ownership', async () => {
    const html = await renderApplication(
      (context) =>
        bootstrapApplication(
          SsrSplitButtonHost,
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
          '<!doctype html><html><body><krn-ssr-split-button-host></krn-ssr-split-button-host></body></html>',
        url: 'https://kern.example/split-button',
        allowedHosts: ['kern.example'],
      },
    );
    const document = new DOMParser().parseFromString(html, 'text/html');
    const host = document.querySelector('krn-split-button') as HTMLElement | null;
    const primary = host?.querySelector('.krn-split-button__primary') as HTMLButtonElement | null;
    const menuTrigger = host?.querySelector(
      '.krn-split-button__menu-trigger',
    ) as HTMLButtonElement | null;

    expect(host?.dataset).toMatchObject({
      loading: 'false',
      menuAlign: 'start',
      open: 'false',
      size: 'lg',
      tone: 'neutral',
      variant: 'outline',
    });
    expect(host?.querySelectorAll('button[krnButton]')).toHaveLength(2);
    expect(primary?.type).toBe('button');
    expect(primary?.textContent).toContain('Опубликовать');
    expect(primary?.disabled).toBe(false);
    expect(menuTrigger?.type).toBe('button');
    expect(menuTrigger?.getAttribute('aria-label')).toBe('Открыть варианты публикации');
    expect(menuTrigger?.getAttribute('aria-expanded')).toBe('false');
    expect(menuTrigger?.getAttribute('aria-controls')).toMatch(/^krn-.+-menu-\d+$/);
    expect(menuTrigger?.disabled).toBe(false);
    expect(document.querySelector('[role="menu"]')).toBeNull();
  });

  it('coerces loading open state closed with one focusable progress segment', async () => {
    const html = await renderApplication(
      (context) => bootstrapApplication(SsrLoadingSplitButtonHost, { providers: [] }, context),
      {
        document:
          '<!doctype html><html><body><krn-ssr-loading-split-button-host></krn-ssr-loading-split-button-host></body></html>',
        url: 'https://kern.example/loading-split-button',
        allowedHosts: ['kern.example'],
      },
    );
    const document = new DOMParser().parseFromString(html, 'text/html');
    const host = document.querySelector('krn-split-button') as HTMLElement | null;
    const primary = host?.querySelector('.krn-split-button__primary') as HTMLButtonElement | null;
    const menuTrigger = host?.querySelector(
      '.krn-split-button__menu-trigger',
    ) as HTMLButtonElement | null;

    expect(host?.getAttribute('data-open')).toBe('false');
    expect(host?.getAttribute('data-loading')).toBe('true');
    expect(primary?.getAttribute('aria-disabled')).toBe('true');
    expect(primary?.getAttribute('data-loading')).toBe('true');
    expect(primary?.disabled).toBe(false);
    expect(menuTrigger?.disabled).toBe(true);
    expect(menuTrigger?.getAttribute('aria-expanded')).toBe('false');
    expect(document.querySelector('[role="menu"]')).toBeNull();
  });
});
