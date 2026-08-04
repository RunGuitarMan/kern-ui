import { isSignal } from '@angular/core';
import type { Signal } from '@angular/core';

/** A fixed scoped value or a signal-backed application value. */
export type KrnI18nValue<T> = T | Signal<T>;

/** Reads an i18n value while preserving Angular signal dependency tracking. */
export function krnReadI18nValue<T>(value: KrnI18nValue<T>): T {
  return isSignal(value) ? (value() as T) : value;
}
