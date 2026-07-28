import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { inject, InjectionToken, PLATFORM_ID } from '@angular/core';

export type KrnScheduledHandle = ReturnType<typeof globalThis.setTimeout>;

/**
 * The browser capabilities Kern uses at runtime.
 *
 * Components should inject this contract instead of reading global `window`,
 * `document`, storage, or media-query APIs directly. Tests and non-browser
 * renderers can replace it through `provideKern`.
 */
export interface KrnPlatformAdapter {
  readonly document: Document;
  readonly isBrowser: boolean;
  readonly window: (Window & typeof globalThis) | null;
  readonly localStorage: Storage | null;
  matchMedia(query: string): MediaQueryList | null;
  requestAnimationFrame(callback: FrameRequestCallback): number | null;
  cancelAnimationFrame(handle: number | null): void;
  schedule(callback: () => void, delay?: number): KrnScheduledHandle | null;
  cancelScheduled(handle: KrnScheduledHandle | null): void;
  queueMicrotask(callback: () => void): void;
  now(): number;
}

export function krnIsNode(platform: KrnPlatformAdapter, value: unknown): value is Node {
  const NodeConstructor = platform.window?.Node;
  return Boolean(NodeConstructor && value instanceof NodeConstructor);
}

export function krnIsElement(platform: KrnPlatformAdapter, value: unknown): value is Element {
  const ElementConstructor = platform.window?.Element;
  return Boolean(ElementConstructor && value instanceof ElementConstructor);
}

export function krnIsHtmlElement(
  platform: KrnPlatformAdapter,
  value: unknown,
): value is HTMLElement {
  const HTMLElementConstructor = platform.window?.HTMLElement;
  return Boolean(HTMLElementConstructor && value instanceof HTMLElementConstructor);
}

export function krnIsInputElement(
  platform: KrnPlatformAdapter,
  value: unknown,
): value is HTMLInputElement {
  const HTMLInputElementConstructor = platform.window?.HTMLInputElement;
  return Boolean(HTMLInputElementConstructor && value instanceof HTMLInputElementConstructor);
}

/**
 * Resolves Kern's effective motion preference.
 *
 * The explicit application preference wins over the operating-system media
 * query. Server renderers return `true` so animation-dependent teardown never
 * delays deterministic rendering.
 */
export function krnPrefersReducedMotion(platform: KrnPlatformAdapter): boolean {
  if (!platform.isBrowser) {
    return true;
  }

  const preference = platform.document.documentElement?.getAttribute('data-krn-motion');
  if (preference === 'reduce') {
    return true;
  }
  if (preference === 'full') {
    return false;
  }

  return platform.matchMedia('(prefers-reduced-motion: reduce)')?.matches ?? true;
}

function safeLocalStorage(view: Window | null): Storage | null {
  if (!view) {
    return null;
  }

  try {
    return view.localStorage;
  } catch {
    return null;
  }
}

function createDefaultPlatformAdapter(): KrnPlatformAdapter {
  const document = inject(DOCUMENT);
  const browser = isPlatformBrowser(inject(PLATFORM_ID));
  const view = browser ? document.defaultView : null;

  return Object.freeze({
    document,
    isBrowser: browser,
    window: view,
    localStorage: safeLocalStorage(view),
    matchMedia: (query: string): MediaQueryList | null => {
      return view && typeof view.matchMedia === 'function' ? view.matchMedia(query) : null;
    },
    requestAnimationFrame: (callback: FrameRequestCallback): number | null => {
      return view && typeof view.requestAnimationFrame === 'function'
        ? view.requestAnimationFrame(callback)
        : null;
    },
    cancelAnimationFrame: (handle: number | null): void => {
      if (handle !== null && view && typeof view.cancelAnimationFrame === 'function') {
        view.cancelAnimationFrame(handle);
      }
    },
    schedule: (callback: () => void, delay = 0): KrnScheduledHandle | null => {
      return browser ? globalThis.setTimeout(callback, delay) : null;
    },
    cancelScheduled: (handle: KrnScheduledHandle | null): void => {
      if (handle !== null && browser) {
        globalThis.clearTimeout(handle);
      }
    },
    queueMicrotask: (callback: () => void): void => {
      if (view) {
        view.queueMicrotask(callback);
      } else {
        callback();
      }
    },
    now: (): number => Date.now(),
  });
}

/** Replaceable platform boundary used by all new low-level Kern services. */
export const KRN_PLATFORM = new InjectionToken<KrnPlatformAdapter>('KRN_PLATFORM', {
  providedIn: 'root',
  factory: createDefaultPlatformAdapter,
});

/** Resolves the element where application-level overlay portals are attached. */
export type KrnOverlayHostResolver = () => HTMLElement | null;

export const KRN_OVERLAY_HOST = new InjectionToken<KrnOverlayHostResolver>('KRN_OVERLAY_HOST', {
  providedIn: 'root',
  factory: () => {
    const platform = inject(KRN_PLATFORM);
    return () => platform.document.body;
  },
});
