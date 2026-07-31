import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { renderApplication } from '@angular/platform-server';
import { KRN_CLIPBOARD_WRITER, type KrnClipboardWriter } from '@kern-ui/angular/cdk';
import { provideKrn } from '@kern-ui/angular/core';
import { KrnCopyButton } from './copy-button';
import { provideKrnCopyButtonOptions } from './copy-button-options';

@Component({
  selector: 'krn-ssr-copy-button-host',
  imports: [KrnCopyButton],
  template: `
    <krn-copy-button value="сервер&#10;KERN">
      <span>Копировать идентификатор</span>
    </krn-copy-button>
  `,
})
class SsrCopyButtonHost {}

@Component({
  selector: 'krn-ssr-default-copy-button-host',
  imports: [KrnCopyButton],
  template: `<krn-copy-button value="default" />`,
})
class SsrDefaultCopyButtonHost {}

describe('KrnCopyButton SSR', () => {
  it('serializes deterministic idle semantics, localized labels, and scoped options', async () => {
    const writer: KrnClipboardWriter = {
      writeText: vi.fn(() => Promise.reject(new Error('SSR must not activate clipboard writes.'))),
    };
    const html = await renderApplication(
      (context) =>
        bootstrapApplication(
          SsrCopyButtonHost,
          {
            providers: [
              provideKrn({
                persistPreferences: false,
                translations: {
                  actions: {
                    copied: 'Идентификатор скопирован',
                    copying: 'Копирование идентификатора…',
                    copyFailed: 'Не удалось скопировать идентификатор',
                    copyToClipboard: 'Копировать идентификатор',
                  },
                },
              }),
              provideKrnCopyButtonOptions({
                feedbackDuration: 2500,
                size: 'lg',
                tone: 'brand',
                variant: 'soft',
              }),
              { provide: KRN_CLIPBOARD_WRITER, useValue: writer },
            ],
          },
          context,
        ),
      {
        document:
          '<!doctype html><html><body><krn-ssr-copy-button-host></krn-ssr-copy-button-host></body></html>',
        url: 'https://kern.example/copy-button',
        allowedHosts: ['kern.example'],
      },
    );
    const document = new DOMParser().parseFromString(html, 'text/html');
    const host = document.querySelector('krn-copy-button') as HTMLElement | null;
    const button = host?.querySelector('button[krnButton]') as HTMLButtonElement | null;
    const status = host?.querySelector('.krn-copy-status');
    const labels = Array.from(host?.querySelectorAll<HTMLElement>('.krn-copy-label') ?? []);

    expect(host?.dataset).toMatchObject({
      pending: 'false',
      size: 'lg',
      state: 'idle',
      tone: 'brand',
      variant: 'soft',
    });
    expect(button?.getAttribute('type')).toBe('button');
    expect(button?.getAttribute('aria-label')).toBeNull();
    expect(button?.getAttribute('aria-disabled')).toBeNull();
    expect(button?.getAttribute('data-loading')).toBe('false');
    expect(labels).toHaveLength(1);
    expect(labels[0]?.textContent?.trim()).toBe('Копировать идентификатор');
    expect(host?.querySelector('.krn-copy-indicator')?.getAttribute('data-state')).toBe('idle');
    expect(status?.getAttribute('role')).toBe('status');
    expect(status?.getAttribute('aria-live')).toBe('polite');
    expect(status?.getAttribute('aria-atomic')).toBe('true');
    expect(status?.textContent?.trim()).toBe('');
    expect(writer.writeText).not.toHaveBeenCalled();
  });

  it('instantiates the default clipboard writer under the real platform-server injector', async () => {
    const html = await renderApplication(
      (context) => bootstrapApplication(SsrDefaultCopyButtonHost, { providers: [] }, context),
      {
        document:
          '<!doctype html><html><body><krn-ssr-default-copy-button-host></krn-ssr-default-copy-button-host></body></html>',
        url: 'https://kern.example/default-copy-writer',
        allowedHosts: ['kern.example'],
      },
    );
    const document = new DOMParser().parseFromString(html, 'text/html');
    const host = document.querySelector('krn-copy-button');

    expect(host?.getAttribute('data-state')).toBe('idle');
    expect(host?.getAttribute('data-pending')).toBe('false');
    expect(host?.querySelector('button')?.getAttribute('aria-label')).toBeNull();
    expect(host?.querySelector('.krn-copy-label')?.textContent?.trim()).toBe('Copy to clipboard');
  });
});
