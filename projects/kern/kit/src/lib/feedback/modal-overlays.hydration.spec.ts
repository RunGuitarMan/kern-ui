import { Component, signal } from '@angular/core';
import { bootstrapApplication, provideClientHydration } from '@angular/platform-browser';
import { provideServerRendering, renderApplication } from '@angular/platform-server';
import { KrnDialog } from './modal-overlays';

@Component({
  selector: 'krn-hydrated-dialog-host',
  imports: [KrnDialog],
  template: `
    <krn-dialog title="Edit workspace" [(open)]="open">
      <button type="button">Save</button>
    </krn-dialog>
  `,
})
class HydratedDialogHost {
  readonly open = signal(true);
}

describe('KrnDialog hydration', () => {
  it('reuses an initially open declarative modal and closes it through the client lifecycle', async () => {
    const html = await renderApplication(
      (context) =>
        bootstrapApplication(
          HydratedDialogHost,
          { providers: [provideClientHydration(), provideServerRendering()] },
          context,
        ),
      {
        document:
          '<!doctype html><html><body><krn-hydrated-dialog-host></krn-hydrated-dialog-host></body></html>',
        url: 'https://kern.example/dialog-hydration',
        allowedHosts: ['kern.example'],
      },
    );
    const serverDocument = new DOMParser().parseFromString(html, 'text/html');
    expect(serverDocument.querySelector('[role="dialog"]')?.textContent).toContain('Save');

    const originalHead = document.head.innerHTML;
    const originalBody = document.body.innerHTML;
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    let application: Awaited<ReturnType<typeof bootstrapApplication>> | undefined;

    try {
      document.head.innerHTML = serverDocument.head.innerHTML;
      document.body.innerHTML = serverDocument.body.innerHTML;
      const serverSurface = document.querySelector('[role="dialog"]');
      application = await bootstrapApplication(HydratedDialogHost, {
        providers: [provideClientHydration()],
      });
      await application.whenStable();

      const hydratedSurface = document.querySelector('[role="dialog"]');
      expect(hydratedSurface).toBe(serverSurface);
      expect([...consoleWarn.mock.calls, ...consoleError.mock.calls].flat().join(' ')).not.toMatch(
        /NG05\d{2}/u,
      );

      (document.querySelector('.close') as HTMLButtonElement).click();
      await application.whenStable();

      const instance = application.components[0]?.instance as HydratedDialogHost;
      expect(instance.open()).toBe(false);
      expect(document.querySelector('.backdrop')?.getAttribute('data-state')).toBe('closed');
    } finally {
      application?.destroy();
      consoleWarn.mockRestore();
      consoleError.mockRestore();
      document.head.innerHTML = originalHead;
      document.body.innerHTML = originalBody;
    }
  });
});
