import type { ApplicationConfig } from '@angular/core';
import { provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  KRN_EN_US_LOCALE,
  KRN_RU_RU_LOCALE,
  krnLocaleConfig,
  provideKrn,
} from '@kern-ui/angular/core';

import { routes } from './app.routes';

const requestedLocale =
  typeof globalThis.location === 'undefined'
    ? null
    : new URLSearchParams(globalThis.location.search).get('locale');
const localePack = requestedLocale === 'ru-RU' ? KRN_RU_RU_LOCALE : KRN_EN_US_LOCALE;

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideKrn({
      ...krnLocaleConfig(localePack),
      theme: 'light',
      density: 'comfortable',
      persistPreferences: false,
    }),
  ],
};
