import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, RouterLink } from '@angular/router';
import { KrnLink } from './link';

@Component({
  imports: [KrnLink],
  template: `
    <a
      krnLink
      aria-describedby="audit-description"
      aria-label="Open audit report"
      download="audit.csv"
      href="/reports/audit.csv"
      hreflang="en"
      ping="/telemetry/link"
      referrerpolicy="strict-origin-when-cross-origin"
      rel="alternate nofollow"
      target="audit-window"
      (click)="recordNavigation($event)"
    >
      Audit report
    </a>
    <p id="audit-description">Opens the generated report.</p>
  `,
})
class NativeLinkHost {
  readonly clicks = signal(0);
  readonly increment = (value: number): number => value + 1;

  recordNavigation(event: MouseEvent): void {
    event.preventDefault();
    this.clicks.update(this.increment);
  }
}

@Component({
  imports: [KrnLink, RouterLink],
  template: `
    <a
      krnLink
      [fragment]="fragment()"
      [queryParams]="{ view: view() }"
      [routerLink]="['/workspaces', workspaceId()]"
    >
      Workspace audit
    </a>
  `,
})
class RouterLinkHost {
  readonly workspaceId = signal('atlas');
  readonly view = signal('audit');
  readonly fragment = signal('history');
}

describe('KrnLink', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('enhances one native anchor without proxying its navigation or accessibility contract', async () => {
    const fixture = TestBed.createComponent(NativeLinkHost);
    await fixture.whenStable();
    const link = fixture.nativeElement.querySelector('a[krnLink]') as HTMLAnchorElement;

    expect(fixture.nativeElement.querySelector('krn-link')).toBeNull();
    expect(link.querySelector('a')).toBeNull();
    expect(link.classList.contains('krn-link')).toBe(true);
    expect(link.getAttribute('href')).toBe('/reports/audit.csv');
    expect(link.getAttribute('target')).toBe('audit-window');
    expect(link.getAttribute('rel')).toBe('alternate nofollow');
    expect(link.getAttribute('download')).toBe('audit.csv');
    expect(link.getAttribute('hreflang')).toBe('en');
    expect(link.getAttribute('ping')).toBe('/telemetry/link');
    expect(link.getAttribute('referrerpolicy')).toBe('strict-origin-when-cross-origin');
    expect(link.getAttribute('aria-label')).toBe('Open audit report');
    expect(link.getAttribute('aria-describedby')).toBe('audit-description');

    link.click();

    expect(fixture.componentInstance.clicks()).toBe(1);
  });

  it('preserves consumer-owned rel tokens for blank and named browsing contexts', async () => {
    @Component({
      imports: [KrnLink],
      template: `
        <a krnLink href="/blank" target="_blank" rel="external">Blank</a>
        <a krnLink href="/named" target="report-window" rel="author">Named</a>
      `,
    })
    class LinkRelationshipHost {}

    const fixture = TestBed.createComponent(LinkRelationshipHost);
    await fixture.whenStable();
    const [blank, named] = Array.from(
      fixture.nativeElement.querySelectorAll('a[krnLink]'),
    ) as HTMLAnchorElement[];

    expect(blank?.getAttribute('target')).toBe('_blank');
    expect(blank?.getAttribute('rel')).toBe('external');
    expect(named?.getAttribute('target')).toBe('report-window');
    expect(named?.getAttribute('rel')).toBe('author');
  });

  it('composes with RouterLink and reflects dynamic router state on the same anchor', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(RouterLinkHost);
    await fixture.whenStable();
    const link = fixture.nativeElement.querySelector('a[krnLink]') as HTMLAnchorElement;

    expect(link.getAttribute('href')).toBe('/workspaces/atlas?view=audit#history');

    fixture.componentInstance.workspaceId.set('beacon');
    fixture.componentInstance.view.set('activity');
    fixture.componentInstance.fragment.set('events');
    await fixture.whenStable();

    expect(link.getAttribute('href')).toBe('/workspaces/beacon?view=activity#events');
  });

  it('leaves an anchor without href as a native non-navigation placeholder', async () => {
    @Component({
      imports: [KrnLink],
      template: `<a krnLink aria-label="Report destination unavailable">Report unavailable</a>`,
    })
    class PlaceholderLinkHost {}

    const fixture = TestBed.createComponent(PlaceholderLinkHost);
    await fixture.whenStable();
    const link = fixture.nativeElement.querySelector('a[krnLink]') as HTMLAnchorElement;

    expect(link.hasAttribute('href')).toBe(false);
    expect(link.hasAttribute('aria-disabled')).toBe(false);
    expect(link.hasAttribute('tabindex')).toBe(false);
  });
});
