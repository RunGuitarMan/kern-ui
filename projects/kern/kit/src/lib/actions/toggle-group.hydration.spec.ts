import { Component, signal } from '@angular/core';
import { bootstrapApplication, provideClientHydration } from '@angular/platform-browser';
import { provideServerRendering, renderApplication } from '@angular/platform-server';
import { KrnToggleButton } from './toggle-button';
import { KrnToggleGroup } from './toggle-group';

@Component({
  selector: 'krn-hydrated-toggle-group-host',
  imports: [KrnToggleButton, KrnToggleGroup],
  template: `
    <krn-toggle-group [attr.aria-label]="nativeLabel()" [ariaLabel]="legacyLabel()">
      <button krnToggleButton value="bold">Bold</button>
    </krn-toggle-group>
  `,
})
class HydratedToggleGroupHost {
  readonly nativeLabel = signal('Native formatting');
  readonly legacyLabel = signal<string | undefined>('Legacy formatting');
}

describe('KrnToggleGroup hydration', () => {
  it('restores a consumer-owned native name after an SSR to hydration legacy transition', async () => {
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
    const serverGroup = serverDocument.querySelector('krn-toggle-group');

    expect(serverGroup?.getAttribute('aria-label')).toBe('Legacy formatting');
    expect(serverGroup?.getAttribute('data-krn-legacy-aria-label-before')).toBe(
      JSON.stringify('Native formatting'),
    );

    const originalHead = document.head.innerHTML;
    const originalBody = document.body.innerHTML;
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    let application: Awaited<ReturnType<typeof bootstrapApplication>> | undefined;

    try {
      document.head.innerHTML = serverDocument.head.innerHTML;
      document.body.innerHTML = serverDocument.body.innerHTML;
      const serverNode = document.querySelector('krn-toggle-group');
      application = await bootstrapApplication(HydratedToggleGroupHost, {
        providers: [provideClientHydration()],
      });
      await application.whenStable();
      const instance = application.components[0]?.instance as HydratedToggleGroupHost;
      const hydratedGroup = document.querySelector('krn-toggle-group');

      expect(hydratedGroup).toBe(serverNode);
      expect(
        [...consoleWarn.mock.calls, ...consoleError.mock.calls].flat().join(' '),
      ).not.toContain('NG0505');

      instance.legacyLabel.set(undefined);
      await application.whenStable();

      expect(hydratedGroup?.getAttribute('aria-label')).toBe('Native formatting');
      expect(hydratedGroup?.getAttribute('data-krn-legacy-aria-label-before')).toBeNull();
    } finally {
      application?.destroy();
      consoleWarn.mockRestore();
      consoleError.mockRestore();
      document.head.innerHTML = originalHead;
      document.body.innerHTML = originalBody;
    }
  });
});
