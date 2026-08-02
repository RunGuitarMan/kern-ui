import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import {
  KRN_OVERLAY_HOST,
  KRN_PLATFORM,
  krnPrefersReducedMotion,
  type KrnCloseWatcher,
} from './platform';

function installCloseWatcherConstructor(value: unknown): () => void {
  const view = window as unknown as object;
  const descriptor = Object.getOwnPropertyDescriptor(view, 'CloseWatcher');
  Object.defineProperty(view, 'CloseWatcher', {
    configurable: true,
    writable: true,
    value,
  });

  return () => {
    if (descriptor) Object.defineProperty(view, 'CloseWatcher', descriptor);
    else Reflect.deleteProperty(view, 'CloseWatcher');
  };
}

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
    expect(platform.createCloseWatcher?.()).toBeNull();
    expect(platform.matchMedia('(width > 1px)')).toBeNull();
    expect(platform.requestAnimationFrame(() => undefined)).toBeNull();
    expect(() => platform.cancelAnimationFrame(null)).not.toThrow();
    expect(platform.schedule(() => undefined)).toBeNull();
    expect(() => platform.cancelScheduled(null)).not.toThrow();
    expect(typeof platform.now()).toBe('number');
    expect(krnPrefersReducedMotion(platform)).toBe(true);
  });

  it('feature-detects CloseWatcher and returns null when construction fails', () => {
    const restoreMissing = installCloseWatcherConstructor(undefined);
    try {
      const platform = TestBed.inject(KRN_PLATFORM);
      expect(platform.createCloseWatcher?.()).toBeNull();
    } finally {
      TestBed.resetTestingModule();
      restoreMissing();
    }

    const restoreBroken = installCloseWatcherConstructor(
      class BrokenCloseWatcher {
        constructor() {
          throw new Error('CloseWatcher is unavailable');
        }
      },
    );
    try {
      const platform = TestBed.inject(KRN_PLATFORM);
      expect(platform.createCloseWatcher?.()).toBeNull();
    } finally {
      TestBed.resetTestingModule();
      restoreBroken();
    }
  });

  it('wraps the native CloseWatcher with idempotent destruction', () => {
    const nativeWatchers: NativeCloseWatcher[] = [];
    class NativeCloseWatcher extends EventTarget {
      destroyCalls = 0;

      constructor() {
        super();
        nativeWatchers.push(this);
      }

      destroy(): void {
        this.destroyCalls += 1;
      }
    }
    const restore = installCloseWatcherConstructor(NativeCloseWatcher);

    try {
      const platform = TestBed.inject(KRN_PLATFORM);
      const watcher = platform.createCloseWatcher?.() as KrnCloseWatcher;
      const close = vi.fn();
      watcher.addEventListener('close', close);
      nativeWatchers[0]?.dispatchEvent(new Event('close'));
      expect(close).toHaveBeenCalledOnce();

      watcher.destroy();
      watcher.destroy();
      expect(nativeWatchers[0]?.destroyCalls).toBe(1);
    } finally {
      TestBed.resetTestingModule();
      restore();
    }
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
