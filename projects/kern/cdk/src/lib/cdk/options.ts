import { inject, InjectionToken } from '@angular/core';
import type { FactoryProvider } from '@angular/core';

const OBJECT_CONSTRUCTOR_SOURCE = Function.prototype.toString.call(Object);
type KrnOptionsSource = 'DEFAULTS' | 'PATCH' | 'PARENT';

function isPlainRecord(value: unknown): value is object {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  try {
    const prototype = Object.getPrototypeOf(value) as object | null;
    if (prototype === null) {
      return true;
    }

    if (Object.getPrototypeOf(prototype) !== null) {
      return false;
    }

    const constructor = Object.getOwnPropertyDescriptor(prototype, 'constructor');
    return Boolean(
      constructor &&
      'value' in constructor &&
      typeof constructor.value === 'function' &&
      constructor.value.prototype === prototype &&
      Function.prototype.toString.call(constructor.value) === OBJECT_CONSTRUCTOR_SOURCE,
    );
  } catch {
    return false;
  }
}

function assertOptionsObject(
  value: unknown,
  description: string,
  source: KrnOptionsSource,
): asserts value is object {
  if (!isPlainRecord(value)) {
    const subject =
      source === 'DEFAULTS'
        ? description
        : source === 'PATCH'
          ? `${description} must resolve to`
          : `${description} inherited parent must be`;
    throw new TypeError(
      `KRN_OPTIONS_INVALID_${source}: ${
        source === 'DEFAULTS' ? `${subject} must be` : subject
      } a plain record with Object.prototype or null prototype.`,
    );
  }

  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor?.enumerable || !('value' in descriptor)) {
      const subject =
        source === 'DEFAULTS'
          ? `${description} must define`
          : source === 'PATCH'
            ? `${description} must resolve to a record that defines`
            : `${description} inherited parent must define`;
      throw new TypeError(
        `KRN_OPTIONS_INVALID_${source}: ${subject} only enumerable own data properties.`,
      );
    }
  }
}

/*
 * Every merge source is validated before reaching this copier. Reading only
 * descriptors keeps accessor code inert and makes manual parent providers obey
 * the same enumerable-own-data-property contract as defaults and patches.
 */
function copyEnumerableDataProperties(
  target: Record<PropertyKey, unknown>,
  source: object,
  inheritUndefined: boolean,
): void {
  for (const key of Reflect.ownKeys(source)) {
    const descriptor = Object.getOwnPropertyDescriptor(source, key);
    if (!descriptor?.enumerable || !('value' in descriptor)) {
      continue;
    }

    const value = descriptor.value;
    if (inheritUndefined && value === undefined) {
      continue;
    }

    Object.defineProperty(target, key, {
      configurable: true,
      enumerable: true,
      value,
      writable: true,
    });
  }
}

function mergeAndFreeze<T extends object>(base: object, patch?: object): Readonly<T> {
  const merged: Record<PropertyKey, unknown> = {};
  copyEnumerableDataProperties(merged, base, false);
  if (patch) {
    copyEnumerableDataProperties(merged, patch, true);
  }
  return Object.freeze(merged) as Readonly<T>;
}

/**
 * Creates a hierarchical immutable options contract.
 *
 * Defaults, inherited provider values, and provider patches must be plain
 * records at runtime: objects with the ordinary `Object.prototype` (including
 * cross-realm objects) or a null prototype. Arrays, functions, class instances,
 * and built-in collection or asynchronous objects are rejected rather than
 * silently losing their type. Only enumerable own data properties are accepted;
 * non-enumerable properties and accessors, including symbol properties, are
 * rejected without invoking getters.
 *
 * Providers merge their defined properties over the nearest parent scope.
 * Component instance inputs can then apply their own final overrides without
 * mutating the shared provider value.
 *
 * Immutability is deliberately shallow and top-level: each resolved record is
 * cloned and frozen, while nested values retain their original identities and
 * must be treated as immutable by their owners.
 *
 * This stable foundation is shared by component families that need immutable,
 * hierarchically scoped defaults without coupling their public option types.
 */
export function createKrnOptions<T extends object>(
  description: string,
  defaults: T,
): readonly [
  InjectionToken<Readonly<T>>,
  (patch: Partial<T> | (() => Partial<T>)) => FactoryProvider,
] {
  assertOptionsObject(defaults, description, 'DEFAULTS');
  const frozenDefaults = mergeAndFreeze<T>(defaults);

  const token = new InjectionToken<Readonly<T>>(description, {
    providedIn: 'root',
    factory: () => frozenDefaults,
  });

  const provideOptions = (patch: Partial<T> | (() => Partial<T>)): FactoryProvider => ({
    provide: token,
    useFactory: (): Readonly<T> => {
      const inherited = inject(token, {
        optional: true,
        skipSelf: true,
      });
      const resolvedPatch = typeof patch === 'function' ? patch() : patch;

      assertOptionsObject(resolvedPatch, description, 'PATCH');

      let base = frozenDefaults;
      if (inherited !== null && inherited !== undefined) {
        assertOptionsObject(inherited, description, 'PARENT');
        base = mergeAndFreeze<T>(frozenDefaults, inherited);
      }

      return mergeAndFreeze<T>(base, resolvedPatch);
    },
  });

  return Object.freeze([token, provideOptions] as const);
}
