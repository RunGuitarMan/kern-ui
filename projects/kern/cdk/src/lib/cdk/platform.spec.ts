import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { KRN_OVERLAY_HOST, KRN_PLATFORM, krnPrefersReducedMotion } from './platform';

describe('Kern platform boundary', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('exposes the owning document and default overlay host in a browser', () => {
    const platform = TestBed.inject(KRN_PLATFORM);
    const overlayHost = TestBed.inject(KRN_OVERLAY_HOST);

    expect(platform.isBrowser).toBe(true);
    expect(platform.window).toBe(platform.document.defaultView);
    expect(overlayHost()).toBe(platform.document.body);
  });

  it('does not expose browser-only capabilities during server rendering', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    });
    const platform = TestBed.inject(KRN_PLATFORM);

    expect(platform.isBrowser).toBe(false);
    expect(platform.window).toBeNull();
    expect(platform.localStorage).toBeNull();
    expect(platform.matchMedia('(width > 1px)')).toBeNull();
    expect(platform.requestAnimationFrame(() => undefined)).toBeNull();
    expect(() => platform.cancelAnimationFrame(null)).not.toThrow();
    expect(platform.schedule(() => undefined)).toBeNull();
    expect(() => platform.cancelScheduled(null)).not.toThrow();
    expect(typeof platform.now()).toBe('number');
    expect(krnPrefersReducedMotion(platform)).toBe(true);
  });

  it('lets an explicit application motion preference override the operating system', () => {
    const platform = TestBed.inject(KRN_PLATFORM);
    const root = platform.document.documentElement;
    const previous = root.getAttribute('data-krn-motion');

    root.setAttribute('data-krn-motion', 'reduce');
    expect(krnPrefersReducedMotion(platform)).toBe(true);

    root.setAttribute('data-krn-motion', 'full');
    expect(krnPrefersReducedMotion(platform)).toBe(false);

    if (previous === null) root.removeAttribute('data-krn-motion');
    else root.setAttribute('data-krn-motion', previous);
  });
});
