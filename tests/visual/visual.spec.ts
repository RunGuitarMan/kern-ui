import { expect, test } from '@playwright/test';

import { KERN_CATALOG } from '../../projects/showcase/src/lib/catalog';
import { DOCS_URL, labUrl, settlePage } from '../support/browser';

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

  test('Lab action specimen and controls', async ({ page }) => {
    await page.goto(
      labUrl({
        component: 'button',
        scenario: 'states',
        theme: 'light',
        density: 'comfortable',
        direction: 'ltr',
      }),
    );
    await settlePage(page);

    await expect(page.getByTestId('lab-controls')).toHaveScreenshot('lab-controls.png');
    await expect(page.getByTestId('specimen-stage')).toHaveScreenshot('lab-button-states.png');
  });

  test('Lab compact dark RTL data grid specimen', async ({ page }) => {
    await page.goto(
      labUrl({
        component: 'data-grid',
        scenario: 'stress',
        theme: 'dark',
        density: 'compact',
        direction: 'rtl',
      }),
    );
    await settlePage(page);

    await expect(page.getByTestId('specimen-stage')).toHaveScreenshot('lab-data-grid-dark-rtl.png');
  });

  for (const item of KERN_CATALOG) {
    test(`${item.name} default specimen matches its visual baseline`, async ({ page }) => {
      await page.goto(
        labUrl({
          component: item.id,
          scenario: 'default',
          theme: 'light',
          density: 'comfortable',
          direction: 'ltr',
        }),
      );
      await settlePage(page);

      const stage = page.getByTestId('specimen-stage');
      await expect(stage.getByTestId(`specimen-${item.id}`)).toBeVisible();
      await expect(stage).toHaveScreenshot(`component-${item.id}.png`);
    });
  }
});
