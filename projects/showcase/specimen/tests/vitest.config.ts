import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@kern-ui/angular/cdk': fileURLToPath(
        new URL('../../../../dist/kern/fesm2022/kern-ui-angular-cdk.mjs', import.meta.url),
      ),
      '@kern-ui/angular/i18n': fileURLToPath(
        new URL('../../../../dist/kern/fesm2022/kern-ui-angular-i18n.mjs', import.meta.url),
      ),
      '@kern-ui/angular/core': fileURLToPath(
        new URL('../../../../dist/kern/fesm2022/kern-ui-angular-core.mjs', import.meta.url),
      ),
      '@kern-ui/angular/actions': fileURLToPath(
        new URL('../../../../dist/kern/fesm2022/kern-ui-angular-actions.mjs', import.meta.url),
      ),
      '@kern-ui/angular/forms': fileURLToPath(
        new URL('../../../../dist/kern/fesm2022/kern-ui-angular-forms.mjs', import.meta.url),
      ),
      '@kern-ui/angular/navigation': fileURLToPath(
        new URL('../../../../dist/kern/fesm2022/kern-ui-angular-navigation.mjs', import.meta.url),
      ),
      '@kern-ui/angular/feedback': fileURLToPath(
        new URL('../../../../dist/kern/fesm2022/kern-ui-angular-feedback.mjs', import.meta.url),
      ),
      '@kern-ui/angular/layout': fileURLToPath(
        new URL('../../../../dist/kern/fesm2022/kern-ui-angular-layout.mjs', import.meta.url),
      ),
      '@kern-ui/angular/data-display': fileURLToPath(
        new URL('../../../../dist/kern/fesm2022/kern-ui-angular-data-display.mjs', import.meta.url),
      ),
      '@kern-ui/angular/kit': fileURLToPath(
        new URL('../../../../dist/kern/fesm2022/kern-ui-angular-kit.mjs', import.meta.url),
      ),
      '@kern-ui/angular/addon-grid': fileURLToPath(
        new URL('../../../../dist/kern/fesm2022/kern-ui-angular-addon-grid.mjs', import.meta.url),
      ),
      '@kern-ui/angular/addon-charts': fileURLToPath(
        new URL('../../../../dist/kern/fesm2022/kern-ui-angular-addon-charts.mjs', import.meta.url),
      ),
      '@kern-ui/angular/patterns': fileURLToPath(
        new URL('../../../../dist/kern/fesm2022/kern-ui-angular-patterns.mjs', import.meta.url),
      ),
      '@kern-ui/angular': fileURLToPath(new URL('../../../../dist/kern', import.meta.url)),
      '@kern-ui/showcase/catalog-index': fileURLToPath(
        new URL('../../catalog-index/src/public-api.ts', import.meta.url),
      ),
      '@kern-ui/showcase': fileURLToPath(new URL('../../src/public-api.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
  },
});
