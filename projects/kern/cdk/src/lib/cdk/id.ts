import { APP_ID, ElementRef, assertInInjectionContext, inject, Injectable } from '@angular/core';
import { getKrnDocumentRuntimeChannel } from './document-runtime';
import { KRN_PLATFORM } from './platform';

interface DocumentIdState {
  readonly counters: Map<string, number>;
  readonly pendingHydration: Set<string>;
  readonly reserved: Set<string>;
  hydrationLedgersScanned: boolean;
}

const idStateChannel = Symbol.for('@kern-ui/angular/cdk/id-state/v2');
const idLedgerAttribute = 'data-krn-id-ledger';

function documentIdState(document: Document): DocumentIdState {
  return getKrnDocumentRuntimeChannel<DocumentIdState>(document, idStateChannel, () => ({
    counters: new Map(),
    hydrationLedgersScanned: false,
    pendingHydration: new Set(),
    reserved: new Set(),
  }));
}

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
 * Document- and application-scoped, SSR-safe ID generation.
 *
 * `next` shares its counters across Angular roots and records server allocations
 * on the owning component host. Hydration consumes that local ledger, preserving
 * even base IDs that only appear through derived `tab-*` or `title-*` IDs when
 * roots hydrate out of order. `fromKey` remains order-independent.
 */
@Injectable({ providedIn: 'root' })
export class KrnIdService {
  private readonly applicationId = normalizeIdPart(inject(APP_ID), 'app');
  private readonly platform = inject(KRN_PLATFORM);
  private readonly state = documentIdState(this.platform.document);

  next(prefix = 'id'): string {
    const safePrefix = normalizeIdPart(prefix, 'id');
    const base = `krn-${this.applicationId}-${safePrefix}-`;
    const counterKey = `${this.applicationId}:${safePrefix}`;
    let count = this.state.counters.get(counterKey) ?? 0;
    const host = this.currentHost();
    if (this.platform.isBrowser) this.reserveHydrationLedgers();

    const hydratedId = this.platform.isBrowser && host ? this.claimHydratedId(base, host) : null;
    if (hydratedId) {
      this.state.counters.set(counterKey, Math.max(count, hydratedId.count));
      return hydratedId.id;
    }

    let id: string;
    do {
      count += 1;
      id = `${base}${count}`;
    } while (
      this.state.reserved.has(id) ||
      this.state.pendingHydration.has(id) ||
      this.platform.document.getElementById(id)
    );

    this.state.counters.set(counterKey, count);
    this.state.reserved.add(id);
    if (!this.platform.isBrowser && host) this.recordServerId(host, id);
    return id;
  }

  fromKey(prefix: string, key: string | number): string {
    const safePrefix = normalizeIdPart(prefix, 'id');
    const stableKey = String(key);
    const id = `krn-${this.applicationId}-${safePrefix}-${hashIdKey(stableKey)}`;
    this.state.reserved.add(id);
    return id;
  }

  private currentHost(): HTMLElement | null {
    try {
      // Unlike checking the environment injector directly, this also recognizes
      // the node-injector context used while component fields are initialized.
      assertInInjectionContext(this.currentHost);
    } catch {
      return null;
    }

    return inject<ElementRef<HTMLElement>>(ElementRef, { optional: true })?.nativeElement ?? null;
  }

  private claimHydratedId(
    base: string,
    host: HTMLElement,
  ): { readonly count: number; readonly id: string } | null {
    const ledger = this.readLedger(host);
    const ledgerIndex = ledger.findIndex((id) => {
      return !this.state.reserved.has(id) && this.sequentialCount(base, id) !== null;
    });
    if (ledgerIndex >= 0) {
      const [id] = ledger.splice(ledgerIndex, 1);
      this.writeLedger(host, ledger);
      if (id) {
        const count = this.sequentialCount(base, id);
        if (count !== null) {
          this.state.reserved.add(id);
          this.state.pendingHydration.delete(id);
          return { count, id };
        }
      }
    }

    const descendants = host.querySelectorAll<HTMLElement>(`[id^="${base}"]`);
    const candidates: readonly HTMLElement[] = [host, ...descendants];
    for (const element of candidates) {
      if (!element.id.startsWith(base) || this.state.reserved.has(element.id)) continue;
      const count = this.sequentialCount(base, element.id);
      if (count === null) continue;

      this.state.reserved.add(element.id);
      this.state.pendingHydration.delete(element.id);
      return { count, id: element.id };
    }

    return null;
  }

  private recordServerId(host: HTMLElement, id: string): void {
    const ledger = this.readLedger(host);
    ledger.push(id);
    this.writeLedger(host, ledger);
  }

  private reserveHydrationLedgers(): void {
    if (this.state.hydrationLedgersScanned) return;
    this.state.hydrationLedgersScanned = true;
    for (const host of this.platform.document.querySelectorAll<HTMLElement>(
      `[${idLedgerAttribute}]`,
    )) {
      for (const id of this.readLedger(host)) {
        if (!this.state.reserved.has(id)) this.state.pendingHydration.add(id);
      }
    }
  }

  private readLedger(host: HTMLElement): string[] {
    return (host.getAttribute(idLedgerAttribute) ?? '').split(/\s+/).filter(Boolean);
  }

  private writeLedger(host: HTMLElement, ledger: readonly string[]): void {
    if (ledger.length > 0) host.setAttribute(idLedgerAttribute, ledger.join(' '));
    else host.removeAttribute(idLedgerAttribute);
  }

  private sequentialCount(base: string, id: string): number | null {
    if (!id.startsWith(base)) return null;
    const suffix = id.slice(base.length);
    const count = Number(suffix);
    return /^[1-9]\d*$/.test(suffix) && Number.isSafeInteger(count) ? count : null;
  }
}
