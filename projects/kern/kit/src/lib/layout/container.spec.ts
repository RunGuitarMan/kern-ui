import { TestBed } from '@angular/core/testing';

import { KrnContainer } from './container';

describe('KrnContainer', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('uses border-box gutters without shrinking the outer responsive width', async () => {
    const fixture = TestBed.createComponent(KrnContainer);
    fixture.componentRef.setInput('maxWidth', 640);
    fixture.componentRef.setInput('gutter', 16);
    fixture.componentRef.setInput('align', 'end');
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    const style = getComputedStyle(host);

    expect(host.style.getPropertyValue('--krn-container-max')).toBe('640px');
    expect(host.style.getPropertyValue('--krn-container-gutter')).toBe('16px');
    expect(style.boxSizing).toBe('border-box');
    expect(style.inlineSize).toBe('100%');
    expect(style.maxInlineSize).toBe('var(--krn-container-max)');
    expect(style.paddingInline).toBe('var(--krn-container-gutter)');
    expect(host.getAttribute('data-align')).toBe('end');
  });

  it('falls back to the active size and preserves native hidden semantics', async () => {
    const fixture = TestBed.createComponent(KrnContainer);
    fixture.componentRef.setInput('size', 'sm');
    fixture.componentRef.setInput('maxWidth', '');
    fixture.componentRef.setInput('gutter', '6');
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.style.getPropertyValue('--krn-container-max')).toBe('var(--krn-container-sm)');
    expect(host.style.getPropertyValue('--krn-container-gutter')).toBe('var(--krn-space-6)');

    fixture.componentRef.setInput('maxWidth', '12');
    await fixture.whenStable();
    expect(host.style.getPropertyValue('--krn-container-max')).toBe('var(--krn-space-12)');

    host.hidden = true;
    expect(getComputedStyle(host).display).toBe('none');
  });
});
