import { InjectionToken } from '@angular/core';

/** English fallback used when an application does not configure loading copy. */
export const KRN_DEFAULT_LOADING_LABEL = 'Loading…';

/**
 * Lightweight application-wide loading copy.
 *
 * `provideKrn({translations})` derives this token from
 * `translations.feedback.loadingInProgress`. Consumers that create a nested
 * locale boundary with low-level tokens must also install
 * `provideKrnTranslationBridge()` from Core, or override this leaf token
 * directly.
 */
export const KRN_LOADING_LABEL = new InjectionToken<string>('KRN_LOADING_LABEL', {
  providedIn: 'root',
  factory: () => KRN_DEFAULT_LOADING_LABEL,
});
