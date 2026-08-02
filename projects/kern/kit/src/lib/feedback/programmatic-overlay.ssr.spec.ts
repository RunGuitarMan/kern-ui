import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { renderApplication } from '@angular/platform-server';
import { provideKrn } from '@kern-ui/angular/core';
import { KrnOverlayService } from './programmatic-overlay';

@Component({
  selector: 'krn-programmatic-ssr-content-spec',
  standalone: true,
  template: `This content must not be instantiated on the server.`,
})
class SsrOverlayContent {}

@Component({
  selector: 'krn-programmatic-ssr-host-spec',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-outcome]': 'outcome()',
    '[attr.data-second-close]': 'secondCloseAccepted()',
  },
  template: `SSR overlay probe`,
})
class SsrOverlayHost {
  protected readonly outcome = signal('pending');
  protected readonly secondCloseAccepted = signal('pending');

  constructor() {
    const overlays = inject(KrnOverlayService);
    const ref = overlays.open<{ readonly accountId: string }, string>(SsrOverlayContent, {
      data: { accountId: 'account-42' },
      title: 'Server overlay',
    });
    ref.closed.subscribe((outcome) => {
      this.outcome.set(
        outcome.kind === 'dismissed' ? `${outcome.kind}:${outcome.reason}` : outcome.kind,
      );
    });
    this.secondCloseAccepted.set(String(ref.close('unexpected')));
  }
}

describe('KrnOverlayService SSR', () => {
  it('returns a replay-settled ref without constructing DOM, portals, or content', async () => {
    const html = await renderApplication(
      (context) =>
        bootstrapApplication(
          SsrOverlayHost,
          { providers: [provideKrn({ persistPreferences: false })] },
          context,
        ),
      {
        document:
          '<!doctype html><html><body><krn-programmatic-ssr-host-spec></krn-programmatic-ssr-host-spec></body></html>',
        url: 'https://kern.example/programmatic-overlay',
        allowedHosts: ['kern.example'],
      },
    );
    const rendered = new DOMParser().parseFromString(html, 'text/html');
    const host = rendered.querySelector('krn-programmatic-ssr-host-spec');

    expect(host?.getAttribute('data-outcome')).toBe('dismissed:ssr');
    expect(host?.getAttribute('data-second-close')).toBe('false');
    expect(rendered.querySelector('krn-programmatic-overlay-host')).toBeNull();
    expect(rendered.querySelector('krn-programmatic-ssr-content-spec')).toBeNull();
    expect(rendered.querySelector('.cdk-overlay-container')).toBeNull();
  });
});
