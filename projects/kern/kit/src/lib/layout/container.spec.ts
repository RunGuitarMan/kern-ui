import { TestBed } from '@angular/core/testing';

import { KrnCenter, KrnContainer } from './container';

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

describe('KrnCenter', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('keeps responsive gutters inside its maximum inline size', async () => {
    const fixture = TestBed.createComponent(KrnCenter);
    fixture.componentRef.setInput('maxWidth', 640);
    fixture.componentRef.setInput('gutters', 16);
    fixture.componentRef.setInput('intrinsic', true);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    const inner = host.querySelector<HTMLElement>('.krn-center__inner')!;
    const style = getComputedStyle(host);
    const innerStyle = getComputedStyle(inner);

    expect(host.style.getPropertyValue('--krn-center-max')).toBe('640px');
    expect(host.style.getPropertyValue('--krn-center-gutter')).toBe('16px');
    expect(style.boxSizing).toBe('border-box');
    expect(style.inlineSize).toBe('100%');
    expect(style.maxInlineSize).toBe('var(--krn-center-max)');
    expect(style.minInlineSize).toBe('0px');
    expect(style.paddingInline).toBe('var(--krn-center-gutter)');
    expect(host.hasAttribute('data-intrinsic')).toBe(true);
    expect(innerStyle.display).toBe('flex');
    expect(innerStyle.inlineSize).toBe('100%');
    expect(innerStyle.minInlineSize).toBe('0px');
    expect(innerStyle.alignItems).toBe('center');
  });

  it('resolves named widths and preserves native hidden semantics', async () => {
    const fixture = TestBed.createComponent(KrnCenter);
    fixture.componentRef.setInput('maxWidth', 'sm');
    fixture.componentRef.setInput('gutters', '6');
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.style.getPropertyValue('--krn-center-max')).toBe('var(--krn-container-sm)');
    expect(host.style.getPropertyValue('--krn-center-gutter')).toBe('var(--krn-space-6)');

    fixture.componentRef.setInput('maxWidth', 'full');
    await fixture.whenStable();
    expect(host.style.getPropertyValue('--krn-center-max')).toBe('100%');

    fixture.componentRef.setInput('maxWidth', '');
    await fixture.whenStable();
    expect(host.style.getPropertyValue('--krn-center-max')).toBe('var(--krn-container-md)');

    host.hidden = true;
    expect(getComputedStyle(host).display).toBe('none');
  });
});
