import { Component, signal } from '@angular/core';
import { bootstrapApplication, provideClientHydration } from '@angular/platform-browser';
import { provideServerRendering, renderApplication } from '@angular/platform-server';
import { KrnToggleButton } from './toggle-button';
import { KrnToggleGroup } from './toggle-group';

@Component({
  selector: 'krn-hydrated-toggle-group-host',
  imports: [KrnToggleButton, KrnToggleGroup],
  template: `
    <div krnToggleGroup [attr.aria-label]="nativeLabel()">
      <button krnToggleButton value="bold">Bold</button>
    </div>
  `,
})
class HydratedToggleGroupHost {
  readonly nativeLabel = signal('Native formatting');
}

describe('KrnToggleGroup hydration', () => {
  it('hydrates the canonical host and keeps native naming consumer-owned', async () => {
    const html = await renderApplication(
      (context) =>
        bootstrapApplication(
          HydratedToggleGroupHost,
          { providers: [provideClientHydration(), provideServerRendering()] },
          context,
        ),
      {
        document:
          '<!doctype html><html><body><krn-hydrated-toggle-group-host></krn-hydrated-toggle-group-host></body></html>',
        url: 'https://kern.example/toggle-group-hydration',
        allowedHosts: ['kern.example'],
      },
    );
    const serverDocument = new DOMParser().parseFromString(html, 'text/html');
    const serverGroup = serverDocument.querySelector('div[krnToggleGroup]');

    expect(serverGroup?.getAttribute('aria-label')).toBe('Native formatting');

    const originalHead = document.head.innerHTML;
    const originalBody = document.body.innerHTML;
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    let application: Awaited<ReturnType<typeof bootstrapApplication>> | undefined;

    try {
      document.head.innerHTML = serverDocument.head.innerHTML;
      document.body.innerHTML = serverDocument.body.innerHTML;
      const serverNode = document.querySelector('div[krnToggleGroup]');
      application = await bootstrapApplication(HydratedToggleGroupHost, {
        providers: [provideClientHydration()],
      });
      await application.whenStable();
      const instance = application.components[0]?.instance as HydratedToggleGroupHost;
      const hydratedGroup = document.querySelector('div[krnToggleGroup]');

      expect(hydratedGroup).toBe(serverNode);
      expect(
        [...consoleWarn.mock.calls, ...consoleError.mock.calls].flat().join(' '),
      ).not.toContain('NG0505');

      instance.nativeLabel.set('Updated formatting');
      await application.whenStable();

      expect(hydratedGroup?.getAttribute('aria-label')).toBe('Updated formatting');
    } finally {
      application?.destroy();
      consoleWarn.mockRestore();
      consoleError.mockRestore();
      document.head.innerHTML = originalHead;
      document.body.innerHTML = originalBody;
    }
  });
});
