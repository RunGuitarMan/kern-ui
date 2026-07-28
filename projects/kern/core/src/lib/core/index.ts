export { KRN_CONFIG, KRN_DIRECTION, KRN_LOCALE, KRN_MOTION, provideKrn } from './config';
export { KRN_ENGLISH_TRANSLATIONS, KRN_TRANSLATIONS, createKrnTranslations } from './i18n';
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
export type { KrnPrepaintThemeOptions, KrnPrepaintThemeState, KrnThemeConfig } from './theme';
