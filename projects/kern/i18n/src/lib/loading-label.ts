import { InjectionToken } from '@angular/core';
import type { KrnI18nValue } from './reactive-value';

/** English fallback used when an application does not configure loading copy. */
export const KRN_DEFAULT_LOADING_LABEL = 'Loading…';

/**
 * Lightweight application-wide loading copy.
 *
 * `provideKrn({translations})` derives this token from
 * `translations.feedback.loadingInProgress`. Consumers that create a nested
 * locale boundary with low-level tokens must also install
 * `provideKrnTranslationBridge()` from Core, or override this leaf token
 * directly. Read the injected fixed-or-signal value with
 * `krnReadI18nValue`.
 */
export const KRN_LOADING_LABEL = new InjectionToken<KrnI18nValue<string>>('KRN_LOADING_LABEL', {
  providedIn: 'root',
  factory: () => KRN_DEFAULT_LOADING_LABEL,
});
