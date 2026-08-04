import { computed, inject } from '@angular/core';
import type { Signal } from '@angular/core';
import { KRN_LOCALE } from '@kern-ui/angular/core';
import { krnReadI18nValue } from '@kern-ui/angular/i18n';

export type KrnIntlLocale = string | string[];

/**
 * Returns either the reactive application locale or the closest fixed scoped
 * `KRN_LOCALE` override.
 */
export function krnInheritedLocale(): Signal<string> {
  const locale = inject(KRN_LOCALE);

  return computed(() => krnReadI18nValue(locale));
}

/** Resolves a component locale input ahead of the reactive inherited locale. */
export function krnResolvedLocale(locale: Signal<string | undefined>): Signal<string>;
export function krnResolvedLocale(locale: Signal<KrnIntlLocale | undefined>): Signal<KrnIntlLocale>;
export function krnResolvedLocale(
  locale: Signal<KrnIntlLocale | undefined>,
): Signal<KrnIntlLocale> {
  const inheritedLocale = krnInheritedLocale();

  return computed(() => locale() ?? inheritedLocale());
}
