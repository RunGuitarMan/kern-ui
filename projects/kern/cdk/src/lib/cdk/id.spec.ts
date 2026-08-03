import {
  APP_ID,
  ElementRef,
  EnvironmentInjector,
  createEnvironmentInjector,
  runInInjectionContext,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { KrnIdService } from './id';
import { KRN_PLATFORM, type KrnPlatformAdapter } from './platform';

function createPlatform(target: Document, isBrowser = true): KrnPlatformAdapter {
  return {
    document: target,
    isBrowser,
    window: null,
    localStorage: null,
    matchMedia: () => null,
    requestAnimationFrame: () => null,
    cancelAnimationFrame: () => undefined,
    schedule: () => null,
    cancelScheduled: () => undefined,
    queueMicrotask: (callback) => callback(),
    now: () => 0,
  };
}

function createIdRoot(
  applicationId: string,
  platform: KrnPlatformAdapter,
): { readonly ids: KrnIdService; readonly injector: EnvironmentInjector } {
  const injector = createEnvironmentInjector(
    [
      KrnIdService,
      { provide: APP_ID, useValue: applicationId },
      { provide: KRN_PLATFORM, useValue: platform },
    ],
    TestBed.inject(EnvironmentInjector),
  );
  return { ids: injector.get(KrnIdService), injector };
}

describe('KrnIdService', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('creates deterministic application-scoped sequential IDs', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: APP_ID, useValue: 'Enterprise Shell' }],
    });
    const ids = TestBed.inject(KrnIdService);

    expect(ids.next('field label')).toBe('krn-enterprise-shell-field-label-1');
    expect(ids.next('field label')).toBe('krn-enterprise-shell-field-label-2');
    expect(ids.next('hint')).toBe('krn-enterprise-shell-hint-1');
  });

  it('creates order-independent IDs from stable keys', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: APP_ID, useValue: 'server' }],
    });
    const ids = TestBed.inject(KrnIdService);

    const first = ids.fromKey('row', 'customer-42');
    ids.next('unrelated');
    const second = ids.fromKey('row', 'customer-42');

    expect(first).toBe(second);
    expect(first).toMatch(/^krn-server-row-[a-z0-9]+$/);
    expect(ids.fromKey('row', 'customer-43')).not.toBe(first);
  });

  it('shares sequential namespaces across Angular roots in one document', () => {
    const isolatedDocument = document.implementation.createHTMLDocument('multi-root');
    const platform = createPlatform(isolatedDocument);
    const firstRoot = createIdRoot('shell', platform);
    const secondRoot = createIdRoot('shell', platform);

    try {
      expect(firstRoot.ids.next('field')).toBe('krn-shell-field-1');
      expect(secondRoot.ids.next('field')).toBe('krn-shell-field-2');
      expect(firstRoot.ids.next('field')).toBe('krn-shell-field-3');
    } finally {
      firstRoot.injector.destroy();
      secondRoot.injector.destroy();
    }
  });

  it('reuses a versioned document registry installed by an independent bundle copy', () => {
    const isolatedDocument = document.implementation.createHTMLDocument('shared-runtime');
    const counters = new Map([['shell:field', 40]]);
    const reserved = new Set<string>();
    const channels = new Map<symbol, unknown>([
      [
        Symbol.for('@kern-ui/angular/cdk/id-state/v2'),
        {
          counters,
          hydrationLedgersScanned: false,
          pendingHydration: new Set<string>(),
          reserved,
        },
      ],
    ]);
    Object.defineProperty(
      isolatedDocument,
      Symbol.for('@kern-ui/angular/cdk/document-runtime-registry/v1'),
      { configurable: true, value: { channels, version: 1 } },
    );
    const root = createIdRoot('shell', createPlatform(isolatedDocument));

    try {
      expect(root.ids.next('field')).toBe('krn-shell-field-41');
      expect(counters.get('shell:field')).toBe(41);
    } finally {
      root.injector.destroy();
    }
  });

  it('hydrates derived-only IDs from per-host SSR ledgers when roots start out of order', () => {
    const serverDocument = document.implementation.createHTMLDocument('incremental-ssr');
    serverDocument.body.innerHTML = `
      <section data-root="earlier"></section>
      <section data-root="later"></section>
    `;
    const serverPlatform = createPlatform(serverDocument, false);
    const earlierServerRoot = createIdRoot('shell', serverPlatform);
    const laterServerRoot = createIdRoot('shell', serverPlatform);
    const earlierServerHost = serverDocument.querySelector<HTMLElement>('[data-root="earlier"]');
    const laterServerHost = serverDocument.querySelector<HTMLElement>('[data-root="later"]');
    if (!earlierServerHost || !laterServerHost) throw new Error('Expected both server roots.');
    const earlierServerContext = createEnvironmentInjector(
      [{ provide: ElementRef, useValue: new ElementRef(earlierServerHost) }],
      earlierServerRoot.injector,
    );
    const laterServerContext = createEnvironmentInjector(
      [{ provide: ElementRef, useValue: new ElementRef(laterServerHost) }],
      laterServerRoot.injector,
    );

    const earlierTabs = runInInjectionContext(earlierServerContext, () =>
      earlierServerRoot.ids.next('tabs'),
    );
    const earlierTitle = runInInjectionContext(earlierServerContext, () =>
      earlierServerRoot.ids.next('base-title'),
    );
    const laterTabs = runInInjectionContext(laterServerContext, () =>
      laterServerRoot.ids.next('tabs'),
    );
    const laterTitle = runInInjectionContext(laterServerContext, () =>
      laterServerRoot.ids.next('base-title'),
    );
    earlierServerHost.innerHTML = `<button id="${earlierTabs}-tab-overview"></button><h2 id="${earlierTitle}-title"></h2>`;
    laterServerHost.innerHTML = `<button id="${laterTabs}-tab-details"></button><h2 id="${laterTitle}-title"></h2>`;

    earlierServerContext.destroy();
    laterServerContext.destroy();
    earlierServerRoot.injector.destroy();
    laterServerRoot.injector.destroy();

    const clientDocument = document.implementation.createHTMLDocument('incremental-client');
    clientDocument.body.innerHTML = serverDocument.body.innerHTML;
    const clientPlatform = createPlatform(clientDocument);
    const laterClientRoot = createIdRoot('shell', clientPlatform);
    const earlierClientRoot = createIdRoot('shell', clientPlatform);
    const laterClientHost = clientDocument.querySelector<HTMLElement>('[data-root="later"]');
    const earlierClientHost = clientDocument.querySelector<HTMLElement>('[data-root="earlier"]');
    if (!laterClientHost || !earlierClientHost) throw new Error('Expected both client roots.');
    const laterClientContext = createEnvironmentInjector(
      [{ provide: ElementRef, useValue: new ElementRef(laterClientHost) }],
      laterClientRoot.injector,
    );
    const earlierClientContext = createEnvironmentInjector(
      [{ provide: ElementRef, useValue: new ElementRef(earlierClientHost) }],
      earlierClientRoot.injector,
    );

    try {
      expect(
        runInInjectionContext(laterClientContext, () => laterClientRoot.ids.next('tabs')),
      ).toBe(laterTabs);
      expect(
        runInInjectionContext(laterClientContext, () => laterClientRoot.ids.next('base-title')),
      ).toBe(laterTitle);
      expect(
        runInInjectionContext(earlierClientContext, () => earlierClientRoot.ids.next('tabs')),
      ).toBe(earlierTabs);
      expect(
        runInInjectionContext(earlierClientContext, () => earlierClientRoot.ids.next('base-title')),
      ).toBe(earlierTitle);
      expect(clientDocument.getElementById(laterTabs)).toBeNull();
      expect(clientDocument.getElementById(earlierTabs)).toBeNull();
      expect(clientDocument.getElementById(`${laterTabs}-tab-details`)).not.toBeNull();
      expect(clientDocument.getElementById(`${earlierTabs}-tab-overview`)).not.toBeNull();
      expect(laterClientHost.hasAttribute('data-krn-id-ledger')).toBe(false);
      expect(earlierClientHost.hasAttribute('data-krn-id-ledger')).toBe(false);
    } finally {
      laterClientContext.destroy();
      earlierClientContext.destroy();
      laterClientRoot.injector.destroy();
      earlierClientRoot.injector.destroy();
    }
  });

  it('reserves unhydrated root ledgers before dynamic same-prefix allocations', () => {
    const clientDocument = document.implementation.createHTMLDocument('pending-hydration');
    clientDocument.body.innerHTML = `
      <section data-root="first" data-krn-id-ledger="krn-shell-base-title-1">
        <h2 id="krn-shell-base-title-1-title"></h2>
      </section>
      <section data-root="second" data-krn-id-ledger="krn-shell-base-title-2">
        <h2 id="krn-shell-base-title-2-title"></h2>
      </section>
      <section data-root="third" data-krn-id-ledger="krn-shell-base-title-3">
        <h2 id="krn-shell-base-title-3-title"></h2>
      </section>
    `;
    const platform = createPlatform(clientDocument);
    const secondRoot = createIdRoot('shell', platform);
    const dynamicRoot = createIdRoot('shell', platform);
    const thirdRoot = createIdRoot('shell', platform);
    const secondHost = clientDocument.querySelector<HTMLElement>('[data-root="second"]');
    const thirdHost = clientDocument.querySelector<HTMLElement>('[data-root="third"]');
    if (!secondHost || !thirdHost) throw new Error('Expected hydration hosts.');
    const secondContext = createEnvironmentInjector(
      [{ provide: ElementRef, useValue: new ElementRef(secondHost) }],
      secondRoot.injector,
    );
    const thirdContext = createEnvironmentInjector(
      [{ provide: ElementRef, useValue: new ElementRef(thirdHost) }],
      thirdRoot.injector,
    );

    try {
      expect(runInInjectionContext(secondContext, () => secondRoot.ids.next('base-title'))).toBe(
        'krn-shell-base-title-2',
      );
      expect(dynamicRoot.ids.next('base-title')).toBe('krn-shell-base-title-4');
      expect(runInInjectionContext(thirdContext, () => thirdRoot.ids.next('base-title'))).toBe(
        'krn-shell-base-title-3',
      );
    } finally {
      secondContext.destroy();
      thirdContext.destroy();
      secondRoot.injector.destroy();
      dynamicRoot.injector.destroy();
      thirdRoot.injector.destroy();
    }
  });
});
