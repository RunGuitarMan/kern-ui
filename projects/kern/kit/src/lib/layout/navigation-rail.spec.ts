import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { KrnAppShell, KrnNavigationRail } from './app-shell';

@Component({
  imports: [KrnAppShell, KrnNavigationRail],
  template: `
    <krn-app-shell sidebarPosition="end">
      <krn-navigation-rail ariaLabelledBy="primary-navigation-title">
        <header id="primary-navigation-title">Primary navigation</header>
        <a href="/home">Home</a>
        <footer>Help</footer>
      </krn-navigation-rail>
      <p>Content</p>
    </krn-app-shell>
  `,
})
class RailInShellHost {}

describe('KrnNavigationRail', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('composes its navigation name and description', async () => {
    const fixture = TestBed.createComponent(KrnNavigationRail);
    fixture.componentRef.setInput('ariaLabel', 'Primary navigation');
    fixture.componentRef.setInput('ariaLabelledBy', 'navigation-title');
    fixture.componentRef.setInput('ariaDescribedBy', 'navigation-help');
    await fixture.whenStable();
    const navigation = fixture.nativeElement.querySelector('nav') as HTMLElement;

    expect(navigation.getAttribute('aria-label')).toBeNull();
    expect(navigation.getAttribute('aria-labelledby')).toBe('navigation-title');
    expect(navigation.getAttribute('aria-describedby')).toBe('navigation-help');

    fixture.componentRef.setInput('ariaLabelledBy', '');
    await fixture.whenStable();
    expect(navigation.getAttribute('aria-label')).toBe('Primary navigation');
    expect(navigation.getAttribute('aria-labelledby')).toBeNull();
  });

  it('exposes idempotent expansion methods and preserves hidden semantics', async () => {
    const fixture = TestBed.createComponent(KrnNavigationRail);
    fixture.componentRef.setInput('width', 56);
    fixture.componentRef.setInput('expandedWidth', '16');
    fixture.componentInstance.expand();
    fixture.componentInstance.expand();
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;

    expect(fixture.componentInstance.expanded()).toBe(true);
    expect(host.style.getPropertyValue('--krn-rail-width')).toBe('56px');
    expect(host.style.getPropertyValue('--krn-rail-expanded-width')).toBe('var(--krn-space-16)');

    fixture.componentInstance.collapse();
    fixture.componentInstance.collapse();
    expect(fixture.componentInstance.expanded()).toBe(false);

    host.hidden = true;
    expect(getComputedStyle(host).display).toBe('none');
  });

  it('follows the App Shell side by default and accepts semantic regions', async () => {
    const fixture = TestBed.createComponent(RailInShellHost);
    await fixture.whenStable();
    const host = fixture.nativeElement.querySelector('krn-navigation-rail') as HTMLElement;
    const navigation = host.querySelector('.krn-rail') as HTMLElement;

    expect(host.getAttribute('data-side')).toBe('auto');
    expect(getComputedStyle(navigation).getPropertyValue('--krn-rail-divider-start-width')).toBe(
      '1px',
    );
    expect(getComputedStyle(navigation).getPropertyValue('--krn-rail-divider-end-width')).toBe('0');
    expect(host.querySelector('.krn-rail__header > header')?.textContent).toContain(
      'Primary navigation',
    );
    expect(host.querySelector('.krn-rail__footer > footer')?.textContent).toContain('Help');
  });
});
