import { InjectionToken } from '@angular/core';
import type { KrnI18nValue } from './reactive-value';

/**
 * Small, immutable copy contract for leaf components that must not retain the
 * complete Core translation registry.
 */
export interface KrnCopyLabels {
  /** Stable accessible name for the copy action. */
  readonly copy: string;
  /** Polite announcement while an asynchronous write is in flight. */
  readonly copying: string;
  /** Feedback shown and announced after a confirmed write. */
  readonly copied: string;
  /** Feedback shown and announced after a failed write. */
  readonly failed: string;
}

/** English fallback used when an application does not configure copy labels. */
export const KRN_DEFAULT_COPY_LABELS: Readonly<KrnCopyLabels> = /* @__PURE__ */ Object.freeze({
  copy: 'Copy to clipboard',
  copying: 'Copying…',
  copied: 'Copied',
  failed: 'Could not copy',
});

/**
 * Lightweight application-wide labels for copy actions.
 *
 * `provideKrn({translations})` derives this value from the complete Core
 * translation registry. Consumers that create a nested low-level translation
 * boundary must install `provideKrnTranslationBridge()` or override this token
 * directly. Read the injected fixed-or-signal value with
 * `krnReadI18nValue`.
 */
export const KRN_COPY_LABELS = new InjectionToken<KrnI18nValue<Readonly<KrnCopyLabels>>>(
  'KRN_COPY_LABELS',
  {
    providedIn: 'root',
    factory: () => KRN_DEFAULT_COPY_LABELS,
  },
);
