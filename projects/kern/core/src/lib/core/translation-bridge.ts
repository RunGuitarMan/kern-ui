import { computed } from '@angular/core';
import type { Provider, Signal } from '@angular/core';
import {
  KRN_COPY_LABELS,
  KRN_DEFAULT_COPY_LABELS,
  KRN_LOADING_LABEL,
  KRN_MORE_ACTIONS_LABEL,
  type KrnCopyLabels,
} from '@kern-ui/angular/i18n';
import { KRN_TRANSLATIONS } from './i18n';
import type { KrnTranslations } from './i18n';

/**
 * Bridges the complete translation registry to the aggregate set of
 * tree-shakable leaf-copy tokens.
 *
 * `provideKrn` installs this automatically. Add it explicitly at a nested
 * injector boundary that provides `KRN_TRANSLATIONS` directly. The returned
 * provider array is intentionally extensible as new leaf-copy tokens appear.
 */
export function provideKrnTranslationBridge(): Provider[] {
  return [
    {
      provide: KRN_COPY_LABELS,
      deps: [KRN_TRANSLATIONS],
      useFactory: (translations: Readonly<KrnTranslations>): Signal<Readonly<KrnCopyLabels>> =>
        computed(() =>
          Object.freeze({
            copy: translations.actions.copyToClipboard,
            copying: translations.actions.copying ?? KRN_DEFAULT_COPY_LABELS.copying,
            copied: translations.actions.copied,
            failed: translations.actions.copyFailed,
          }),
        ),
    },
    {
      provide: KRN_LOADING_LABEL,
      deps: [KRN_TRANSLATIONS],
      useFactory: (translations: Readonly<KrnTranslations>): Signal<string> =>
        computed(() => translations.feedback.loadingInProgress),
    },
    {
      provide: KRN_MORE_ACTIONS_LABEL,
      deps: [KRN_TRANSLATIONS],
      useFactory: (translations: Readonly<KrnTranslations>): Signal<string> =>
        computed(() => translations.actions.moreActions),
    },
  ];
}
