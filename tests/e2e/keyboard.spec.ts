import { expect, test } from '@playwright/test';

import { DOCS_URL, labUrl, settlePage } from '../support/browser';

test.describe('Keyboard interaction', () => {
  test('global search selects the active result with Enter', async ({ page }) => {
    await page.goto(DOCS_URL);
    await settlePage(page);

    const search = page.getByRole('combobox', { name: 'Search Kern components' });
    await search.focus();
    await search.pressSequentially('button');
    await expect(
      page.getByRole('listbox', { name: 'Search Kern components results' }),
    ).toBeVisible();
    await expect(page.getByRole('option', { name: /Button/ }).first()).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await search.press('Enter');

    await expect(page).toHaveURL(/\/components\/button$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Button' })).toBeVisible();
  });

  test('horizontal tabs use roving focus and arrow navigation', async ({ page }) => {
    await page.goto(`${DOCS_URL}/components/tabs`);
    await settlePage(page);

    const tabs = page.getByRole('tab');
    const first = tabs.nth(0);
    const second = tabs.nth(1);

    await expect(first).toHaveAttribute('aria-selected', 'true');
    await first.focus();
    await first.press('ArrowRight');

    await expect(second).toBeFocused();
    await expect(second).toHaveAttribute('aria-selected', 'true');
    await expect(first).toHaveAttribute('aria-selected', 'false');
  });

  test('Lab controls update state and catalog entries activate from the keyboard', async ({
    page,
  }) => {
    await page.goto(labUrl());
    await settlePage(page);

    const direction = page.getByTestId('direction-control');
    await direction.selectOption('rtl');
    await expect(page).toHaveURL(/direction=rtl/);
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

    const theme = page.getByTestId('theme-control');
    await theme.selectOption('dark');
    await expect(page).toHaveURL(/theme=dark/);
    await expect(page.locator('html')).toHaveAttribute('data-krn-theme', 'dark');

    const dataGridEntry = page.getByTestId('catalog-item-data-grid');
    await dataGridEntry.focus();
    await dataGridEntry.press('Enter');
    await expect(page).toHaveURL(/component=data-grid/);
    await expect(page.getByTestId('specimen-data-grid')).toBeVisible();
  });

  test('skip link is the first focus target and reaches documentation content', async ({
    page,
  }) => {
    await page.goto(DOCS_URL);
    await settlePage(page);

    await page.keyboard.press('Tab');
    const skipLink = page.getByRole('link', { name: 'Skip to documentation' });
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeVisible();
    await skipLink.press('Enter');

    await expect(page).toHaveURL(/#docs-main$/);
  });
});
