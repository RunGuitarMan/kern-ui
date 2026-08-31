import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { KrnAppShell, KrnSidebar } from './app-shell';

@Component({
  imports: [KrnAppShell, KrnSidebar],
  template: `
    <krn-app-shell sidebarPosition="end">
      <krn-sidebar ariaLabelledBy="workspace-title">
        <header id="workspace-title">Workspace</header>
        <a href="/projects">Projects</a>
        <footer>Acme</footer>
      </krn-sidebar>
      <p>Content</p>
    </krn-app-shell>
  `,
})
class SidebarInShellHost {}

describe('KrnSidebar', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('composes its landmark name and description', async () => {
    const fixture = TestBed.createComponent(KrnSidebar);
    fixture.componentRef.setInput('ariaLabel', 'Workspace navigation');
    fixture.componentRef.setInput('ariaLabelledBy', 'workspace-title');
    fixture.componentRef.setInput('ariaDescribedBy', 'workspace-help');
    await fixture.whenStable();
    const sidebar = fixture.nativeElement.querySelector('aside') as HTMLElement;

    expect(sidebar.getAttribute('aria-label')).toBeNull();
    expect(sidebar.getAttribute('aria-labelledby')).toBe('workspace-title');
    expect(sidebar.getAttribute('aria-describedby')).toBe('workspace-help');

    fixture.componentRef.setInput('ariaLabelledBy', '');
    await fixture.whenStable();
    expect(sidebar.getAttribute('aria-label')).toBe('Workspace navigation');
    expect(sidebar.getAttribute('aria-labelledby')).toBeNull();
  });

  it('uses native hidden and inert semantics for the fully collapsed mode', async () => {
    const fixture = TestBed.createComponent(KrnSidebar);
    fixture.componentRef.setInput('collapsedMode', 'hidden');
    fixture.componentInstance.collapse();
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    const sidebar = host.querySelector('aside') as HTMLElement;

    expect(fixture.componentInstance.collapsed()).toBe(true);
    expect(sidebar.hidden).toBe(true);
    expect(sidebar.hasAttribute('inert')).toBe(true);
    expect(getComputedStyle(sidebar).display).toBe('none');

    fixture.componentInstance.expand();
    await fixture.whenStable();
    expect(fixture.componentInstance.collapsed()).toBe(false);
    expect(sidebar.hidden).toBe(false);
    expect(sidebar.hasAttribute('inert')).toBe(false);

    host.hidden = true;
    expect(getComputedStyle(host).display).toBe('none');
  });

  it('follows the App Shell side by default and accepts semantic regions', async () => {
    const fixture = TestBed.createComponent(SidebarInShellHost);
    await fixture.whenStable();
    const host = fixture.nativeElement.querySelector('krn-sidebar') as HTMLElement;
    const sidebar = host.querySelector('.krn-sidebar') as HTMLElement;

    expect(host.getAttribute('data-side')).toBe('auto');
    expect(getComputedStyle(sidebar).getPropertyValue('--krn-sidebar-divider-start-width')).toBe(
      '1px',
    );
    expect(getComputedStyle(sidebar).getPropertyValue('--krn-sidebar-divider-end-width')).toBe('0');
    expect(host.querySelector('.krn-sidebar__header > header')?.textContent).toContain('Workspace');
    expect(host.querySelector('.krn-sidebar__footer > footer')?.textContent).toContain('Acme');
  });
});
