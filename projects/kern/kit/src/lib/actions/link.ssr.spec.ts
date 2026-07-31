import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { renderApplication } from '@angular/platform-server';
import { provideRouter, RouterLink, withDisabledInitialNavigation } from '@angular/router';
import { KrnLink } from './link';

@Component({
  selector: 'krn-ssr-link-host',
  imports: [KrnLink, RouterLink],
  template: `
    <span id="report-link-label">Quarterly audit report</span>
    <a
      krnLink
      aria-labelledby="report-link-label"
      download="audit.csv"
      href="/reports/audit.csv"
      hreflang="en"
      referrerpolicy="strict-origin"
      rel="alternate nofollow"
      target="audit-window"
    >
      Download
    </a>
    <a krnLink [routerLink]="['/workspaces', 'atlas']" [queryParams]="{ view: 'audit' }">
      Workspace audit
    </a>
    <a krnLink>Unavailable destination</a>
  `,
})
class SsrLinkHost {}

describe('KrnLink SSR', () => {
  it('serializes native and RouterLink semantics without a wrapper or owned proxy attributes', async () => {
    const html = await renderApplication(
      (context) =>
        bootstrapApplication(
          SsrLinkHost,
          {
            providers: [provideRouter([], withDisabledInitialNavigation())],
          },
          context,
        ),
      {
        document: '<!doctype html><html><body><krn-ssr-link-host /></body></html>',
        url: 'https://kern.example/link',
        allowedHosts: ['kern.example'],
      },
    );
    const document = new DOMParser().parseFromString(html, 'text/html');
    const links = Array.from(document.querySelectorAll('a[krnLink]'));
    const [native, router, placeholder] = links;

    expect(document.querySelector('krn-link')).toBeNull();
    expect(links).toHaveLength(3);
    expect(native?.querySelector('a')).toBeNull();
    expect(native?.classList.contains('krn-link')).toBe(true);
    expect(native?.getAttribute('href')).toBe('/reports/audit.csv');
    expect(native?.getAttribute('target')).toBe('audit-window');
    expect(native?.getAttribute('rel')).toBe('alternate nofollow');
    expect(native?.getAttribute('download')).toBe('audit.csv');
    expect(native?.getAttribute('hreflang')).toBe('en');
    expect(native?.getAttribute('referrerpolicy')).toBe('strict-origin');
    expect(native?.getAttribute('aria-labelledby')).toBe('report-link-label');
    expect(router?.getAttribute('href')).toBe('https://kern.example/workspaces/atlas?view=audit');
    expect(placeholder?.hasAttribute('href')).toBe(false);
    expect(placeholder?.hasAttribute('aria-disabled')).toBe(false);
    expect(placeholder?.hasAttribute('tabindex')).toBe(false);
  });
});
