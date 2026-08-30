import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { KrnAppShell, KrnHeader } from './app-shell';

@Component({
  imports: [KrnAppShell, KrnHeader],
  template: `
    <krn-app-shell>
      <krn-header>Workspace</krn-header>
      <p>Content</p>
    </krn-app-shell>
  `,
})
class HeaderInShellHost {}

describe('KrnHeader', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('forwards an accessible landmark name and resolves layout lengths', async () => {
    const fixture = TestBed.createComponent(KrnHeader);
    fixture.componentRef.setInput('ariaLabel', 'Application header');
    fixture.componentRef.setInput('ariaLabelledBy', 'workspace-title');
    fixture.componentRef.setInput('height', 48);
    fixture.componentRef.setInput('stickyOffset', '2');
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    const header = host.querySelector('header')!;

    expect(header.getAttribute('aria-label')).toBeNull();
    expect(header.getAttribute('aria-labelledby')).toBe('workspace-title');
    expect(host.style.getPropertyValue('--krn-header-height')).toBe('48px');
    expect(host.style.getPropertyValue('--krn-header-sticky-offset')).toBe('var(--krn-space-2)');

    fixture.componentRef.setInput('ariaLabelledBy', '');
    await fixture.whenStable();
    expect(header.getAttribute('aria-label')).toBe('Application header');
    expect(header.getAttribute('aria-labelledby')).toBeNull();
  });

  it('preserves hidden semantics and assigns stable logical grid areas', async () => {
    const fixture = TestBed.createComponent(KrnHeader);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    const header = host.querySelector<HTMLElement>('.krn-header')!;
    const start = host.querySelector<HTMLElement>('.krn-header__start')!;
    const content = host.querySelector<HTMLElement>('.krn-header__content')!;
    const end = host.querySelector<HTMLElement>('.krn-header__end')!;

    expect(getComputedStyle(header).gridTemplateAreas).toContain('start content end');
    expect(getComputedStyle(start).gridArea).toBe('start');
    expect(getComputedStyle(content).gridArea).toBe('content');
    expect(getComputedStyle(end).gridArea).toBe('end');

    host.hidden = true;
    expect(getComputedStyle(host).display).toBe('none');
  });

  it('keeps a sticky header as a direct App Shell grid box', async () => {
    const fixture = TestBed.createComponent(HeaderInShellHost);
    await fixture.whenStable();
    const wrapper = fixture.nativeElement.querySelector('.krn-shell__header') as HTMLElement;
    const header = fixture.nativeElement.querySelector('krn-header') as HTMLElement;

    expect(getComputedStyle(wrapper).display).toBe('contents');
    expect(getComputedStyle(header).gridArea).toBe('header');
    expect(getComputedStyle(header).position).toBe('sticky');
  });
});
