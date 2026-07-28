import { APP_ID, inject, Injectable } from '@angular/core';

function normalizeIdPart(value: string, fallback: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || fallback;
}

function hashIdKey(value: string): string {
  // FNV-1a is deterministic in Node and browsers and does not rely on crypto APIs.
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

/**
 * Application-scoped, SSR-safe ID generation.
 *
 * `next` is appropriate when server and client instantiate the same view tree
 * in the same order. `fromKey` is order-independent and should be preferred for
 * data-driven content with a stable application key.
 */
@Injectable({ providedIn: 'root' })
export class KrnIdService {
  private readonly applicationId = normalizeIdPart(inject(APP_ID), 'app');
  private readonly counters = new Map<string, number>();

  next(prefix = 'id'): string {
    const safePrefix = normalizeIdPart(prefix, 'id');
    const count = (this.counters.get(safePrefix) ?? 0) + 1;
    this.counters.set(safePrefix, count);
    return `krn-${this.applicationId}-${safePrefix}-${count}`;
  }

  fromKey(prefix: string, key: string | number): string {
    const safePrefix = normalizeIdPart(prefix, 'id');
    const stableKey = String(key);
    return `krn-${this.applicationId}-${safePrefix}-${hashIdKey(stableKey)}`;
  }
}
