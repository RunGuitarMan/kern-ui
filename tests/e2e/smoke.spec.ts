import { expect, test } from '@playwright/test';

import {
  DOCS_URL,
  labUrl,
  settlePage,
  watchRuntimeErrors,
} from '../support/browser';

test.describe('Docs smoke contracts', () => {
  test('renders the calibration bench and complete navigation catalog', async ({ page }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);

    await page.goto(DOCS_URL);
    await settlePage(page);

    await expect(page).toHaveTitle(/Kern/);
    await expect(page.getByRole('link', { name: 'Kern documentation home' })).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 1, name: /One rhythm\. Any product\./ }),
    ).toBeVisible();
    await expect(page.getByRole('complementary', { name: 'Documentation' })).toContainText(
      '131 documented entries',
    );
    assertNoRuntimeErrors();
  });

  const routes = [
    { path: '/foundations', heading: 'A semantic system, not a paint box.' },
    { path: '/components/button', heading: 'Button' },
    { path: '/components/data-grid', heading: 'Data Grid' },
    { path: '/patterns', heading: 'Product flows, assembled in the open.' },
    { path: '/accessibility', heading: 'WCAG 2.2 AA is the floor.' },
    { path: '/changelog', heading: 'Every release, clearly documented.' },
  ] as const;

  for (const route of routes) {
    test(`${route.path} exposes its primary heading`, async ({ page }) => {
      const assertNoRuntimeErrors = watchRuntimeErrors(page);

      await page.goto(`${DOCS_URL}${route.path}`);
      await settlePage(page);

      await expect(page.getByRole('heading', { level: 1, name: route.heading })).toBeVisible();
      await expect(page.locator('#docs-main')).toBeVisible();
      assertNoRuntimeErrors();
    });
  }
});

test.describe('Lab smoke contracts', () => {
  test('hydrates an exact query state and exposes all catalog addresses', async ({ page }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);

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

    await expect(page.getByTestId('lab-root')).toBeVisible();
    await expect(page.getByTestId('specimen-data-grid')).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('html')).toHaveAttribute('data-krn-theme', 'dark');
    await expect(page.locator('html')).toHaveAttribute('data-krn-density', 'compact');
    await expect(page.locator('[data-testid^="catalog-item-"]')).toHaveCount(131);
    assertNoRuntimeErrors();
  });

  test('changes component state through a stable catalog address', async ({ page }) => {
    await page.goto(labUrl());
    await settlePage(page);

    await page.getByTestId('catalog-search').fill('data grid');
    const dataGridEntry = page.getByTestId('catalog-item-data-grid');
    await expect(dataGridEntry).toBeVisible();
    await dataGridEntry.click();

    await expect(page).toHaveURL(/component=data-grid/);
    await expect(page.getByTestId('specimen-data-grid')).toBeVisible();
  });
});
