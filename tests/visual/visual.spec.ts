import { expect, test } from '@playwright/test';

import { KERN_CATALOG } from '../../projects/showcase/src/lib/catalog';
import { DOCS_URL, previewUrl, settlePage } from '../support/browser';

test.describe('Deterministic visual baselines', () => {
  test('Docs calibration bench', async ({ page }) => {
    await page.goto(DOCS_URL);
    await settlePage(page);

    await expect(page).toHaveScreenshot('docs-calibration-bench.png', {
      fullPage: true,
    });
  });

  test('Docs button component specimen', async ({ page }) => {
    await page.goto(`${DOCS_URL}/components/button`);
    await settlePage(page);

    await expect(page.locator('.workbench')).toHaveScreenshot('docs-button-specimen.png');
  });

  test('Docs preview loading action specimen and controls', async ({ page }) => {
    await page.goto(
      previewUrl({
        component: 'button',
        state: 'loading',
        theme: 'light',
        density: 'comfortable',
        direction: 'ltr',
      }),
    );
    await settlePage(page);

    await expect(page.getByTestId('preview-controls')).toHaveScreenshot('preview-controls.png');
    await expect(page.getByTestId('specimen-stage')).toHaveScreenshot('preview-button-loading.png');
  });

  test('Docs preview compact dark RTL data grid specimen', async ({ page }) => {
    await page.goto(
      previewUrl({
        component: 'data-grid',
        scenario: 'stress',
        theme: 'dark',
        density: 'compact',
        direction: 'rtl',
      }),
    );
    await settlePage(page);

    await expect(page.getByTestId('specimen-stage')).toHaveScreenshot(
      'preview-data-grid-dark-rtl.png',
    );
  });

  for (const item of KERN_CATALOG) {
    test(`${item.name} default specimen matches its visual baseline`, async ({ page }) => {
      await page.goto(
        previewUrl({
          component: item.id,
          scenario: 'default',
          theme: 'light',
          density: 'comfortable',
          direction: 'ltr',
        }),
      );
      await settlePage(page);

      const stage = page.getByTestId('specimen-stage');
      await expect(stage.getByTestId(`component-specimen-${item.id}`)).toBeVisible();
      await expect(stage).toHaveScreenshot(`component-${item.id}.png`);
    });
  }
});
