interface KrnDocumentRuntimeRegistryV1 {
  readonly channels: Map<symbol, unknown>;
  readonly version: 1;
}

interface KrnDocumentRuntimeFallbackV1 {
  readonly documents: WeakMap<object, KrnDocumentRuntimeRegistryV1>;
  readonly version: 1;
}

const registryKey = Symbol.for('@kern-ui/angular/cdk/document-runtime-registry/v1');
const fallbackKey = Symbol.for('@kern-ui/angular/cdk/document-runtime-fallback/v1');
const localFallbackDocuments = new WeakMap<object, KrnDocumentRuntimeRegistryV1>();

function symbolRecord(value: object): Record<symbol, unknown> {
  return value as unknown as Record<symbol, unknown>;
}

function isRegistry(value: unknown): value is KrnDocumentRuntimeRegistryV1 {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as Partial<KrnDocumentRuntimeRegistryV1>).version === 1 &&
    (value as Partial<KrnDocumentRuntimeRegistryV1>).channels instanceof Map
  );
}

function fallbackRegistries(): WeakMap<object, KrnDocumentRuntimeRegistryV1> {
  const globalRecord = symbolRecord(globalThis);
  const existing = globalRecord[fallbackKey];
  if (
    typeof existing === 'object' &&
    existing !== null &&
    (existing as Partial<KrnDocumentRuntimeFallbackV1>).version === 1 &&
    (existing as Partial<KrnDocumentRuntimeFallbackV1>).documents instanceof WeakMap
  ) {
    return (existing as KrnDocumentRuntimeFallbackV1).documents;
  }

  const fallback: KrnDocumentRuntimeFallbackV1 = { documents: new WeakMap(), version: 1 };
  try {
    Object.defineProperty(globalThis, fallbackKey, {
      configurable: true,
      value: fallback,
    });
  } catch {
    // This only applies to locked-down runtimes; the returned map still keeps
    // one package copy functional even when it cannot coordinate other copies.
    return localFallbackDocuments;
  }
  return fallback.documents;
}

function documentRegistry(document: Document): KrnDocumentRuntimeRegistryV1 {
  const documentRecord = symbolRecord(document);
  const existing = documentRecord[registryKey];
  if (isRegistry(existing)) return existing;

  const registry: KrnDocumentRuntimeRegistryV1 = { channels: new Map(), version: 1 };
  try {
    Object.defineProperty(document, registryKey, {
      configurable: true,
      value: registry,
    });
    const installed = documentRecord[registryKey];
    if (isRegistry(installed)) return installed;
  } catch {
    // Some SSR DOM implementations expose non-extensible document facades.
  }

  const fallback = fallbackRegistries();
  const fallbackRegistry = fallback.get(document);
  if (fallbackRegistry) return fallbackRegistry;
  fallback.set(document, registry);
  return registry;
}

/** Resolves a versioned runtime channel shared by every Kern bundle on one document. */
export function getKrnDocumentRuntimeChannel<T>(
  document: Document,
  channelKey: symbol,
  create: () => T,
): T {
  const channels = documentRegistry(document).channels;
  if (channels.has(channelKey)) return channels.get(channelKey) as T;

  const value = create();
  channels.set(channelKey, value);
  return value;
}

export function deleteKrnDocumentRuntimeChannel<T>(
  document: Document,
  channelKey: symbol,
  value: T,
): void {
  const channels = documentRegistry(document).channels;
  if (channels.get(channelKey) === value) channels.delete(channelKey);
}
