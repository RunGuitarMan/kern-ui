export { KRN_CONFIG, KRN_DIRECTION, KRN_LOCALE, KRN_MOTION, provideKrn } from './config';
export {
  KRN_ENGLISH_TRANSLATIONS,
  KRN_TRANSLATIONS,
  createKrnTranslations,
  krnFormatTranslation,
} from './i18n';
export {
  krnLocaleConfig,
  KRN_EN_US_LOCALE,
  KRN_LOCALE_PACKS,
  KRN_RU_RU_LOCALE,
} from './locale-packs';
export {
  KRN_THEME_CONFIG,
  KrnThemeDirective,
  KrnThemeService,
  applyKrnPrepaintTheme,
  provideKrnTheme,
} from './theme';

export type { KrnConfig, KrnDirection, KrnMotionPreference, KrnOverlayHost } from './config';
export type {
  KrnActionTranslations,
  KrnCalendarTranslations,
  KrnChartTranslations,
  KrnColorPickerTranslations,
  KrnDatePickerTranslations,
  KrnDataDisplayTranslations,
  KrnDataGridTranslations,
  KrnFeedbackTranslations,
  KrnFormTranslations,
  KrnLayoutTranslations,
  KrnNavigationTranslations,
  KrnPatternTranslations,
  KrnTimePickerTranslations,
  KrnToastTranslations,
  KrnTranslations,
  KrnTranslationsPatch,
} from './i18n';
export type { KrnLocaleConfig, KrnLocalePack } from './locale-packs';
export type { KrnPrepaintThemeOptions, KrnPrepaintThemeState, KrnThemeConfig } from './theme';
