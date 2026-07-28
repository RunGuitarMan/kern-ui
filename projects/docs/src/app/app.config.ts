import { DOCUMENT, ViewportScroller } from '@angular/common';
import type { ApplicationConfig } from '@angular/core';
import { inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideKrn } from '@kern-ui/angular';

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAppInitializer(() => {
      const document = inject(DOCUMENT);
      const viewportScroller = inject(ViewportScroller);
      viewportScroller.setOffset(() => {
        const stickyNavigation = document.querySelector<HTMLElement>('.page-nav');
        const rootStyles = getComputedStyle(document.documentElement);
        const rootFontSize = Number.parseFloat(rootStyles.fontSize) || 16;
        const headerToken = rootStyles.getPropertyValue('--docs-header-height').trim();
        const headerValue = Number.parseFloat(headerToken) || 0;
        const headerHeight = headerToken.endsWith('rem') ? headerValue * rootFontSize : headerValue;
        const navigationHeight =
          stickyNavigation?.getBoundingClientRect().height ?? rootFontSize * 2.75;
        return [0, headerHeight + navigationHeight + 16];
      });
    }),
    provideRouter(
      routes,
      withInMemoryScrolling({
        anchorScrolling: 'enabled',
        scrollPositionRestoration: 'top',
      }),
    ),
    provideClientHydration(),
    provideKrn({
      locale: 'en-US',
      direction: 'ltr',
      theme: 'system',
      density: 'comfortable',
      motion: 'system',
      persistPreferences: true,
      preferenceStorageKey: 'kern.docs.preferences.v2',
    }),
  ],
};
