import { computed } from '@angular/core';
import type { Signal } from '@angular/core';

/**
 * Resolves an optional local input ahead of a reactive application fallback.
 * `null`, empty strings, and falsey values remain explicit overrides.
 */
export function krnInputFallback<T>(value: Signal<T | undefined>, fallback: () => T): Signal<T> {
  return computed(() => {
    const current = value();
    return current === undefined ? fallback() : current;
  });
}
