import { expect, test } from '@playwright/test';

import { KERN_CATALOG } from '../../projects/showcase/src/lib/catalog';
import { DOCS_URL, previewUrl, settlePage } from '../support/browser';

const RISK_BASELINES = [
  {
    id: 'data-grid',
    state: 'pinned-columns',
    scenario: 'stress',
    theme: 'dark',
    density: 'compact',
    direction: 'rtl',
  },
  {
    id: 'tree',
    state: 'async-branches',
    scenario: 'stress',
    theme: 'high-contrast',
    density: 'spacious',
    direction: 'ltr',
  },
  {
    id: 'json-view',
    state: 'highlighted',
    scenario: 'default',
    theme: 'dark',
    density: 'comfortable',
    direction: 'rtl',
  },
  {
    id: 'app-shell',
    state: 'long-text',
    scenario: 'default',
    theme: 'high-contrast',
    density: 'spacious',
    direction: 'rtl',
    viewport: 'phone',
  },
  {
    id: 'form-field',
    state: 'invalid',
    scenario: 'default',
    theme: 'high-contrast',
    density: 'spacious',
    direction: 'rtl',
  },
  {
    id: 'progress-bar',
    state: 'indeterminate',
    scenario: 'default',
    theme: 'dark',
    density: 'compact',
    direction: 'ltr',
  },
] as const;

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

  test('Docs component environment controls and loading action specimen', async ({ page }) => {
    await page.goto(`${DOCS_URL}/components/button`);
    await settlePage(page);

    await expect(page.getByTestId('preview-controls')).toHaveScreenshot('preview-controls.png');

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

  for (const risk of RISK_BASELINES) {
    test(`${risk.id} ${risk.state} risk baseline`, async ({ page }) => {
      await page.goto(
        previewUrl({
          component: risk.id,
          state: risk.state,
          scenario: risk.scenario,
          theme: risk.theme,
          density: risk.density,
          direction: risk.direction,
          viewport: 'viewport' in risk ? risk.viewport : undefined,
        }),
      );
      await settlePage(page);

      const stage = page.getByTestId('specimen-stage');
      await expect(stage.getByTestId(`component-specimen-${risk.id}`)).toBeVisible();
      await expect(stage).toHaveAttribute('dir', risk.direction);
      await page.addStyleTag({
        content: `[data-testid='specimen-stage'] { inline-size: 75rem !important; max-inline-size: none !important; }`,
      });
      await expect(stage).toHaveScreenshot(`risk-${risk.id}-${risk.state}.png`);
    });
  }

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
