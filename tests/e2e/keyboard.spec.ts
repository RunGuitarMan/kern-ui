import { expect, test } from '@playwright/test';

import { DOCS_URL, previewUrl, settlePage, watchRuntimeErrors } from '../support/browser';

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

  test('Docs preview controls update shareable state without leaving the specimen', async ({
    page,
  }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);

    await page.goto(previewUrl());
    await settlePage(page);

    const stage = page.getByTestId('specimen-stage');
    const direction = page.getByTestId('direction-control');
    await direction.selectOption('rtl');
    await expect(page).toHaveURL(/direction=rtl/);
    await expect(stage).toHaveAttribute('dir', 'rtl');

    const theme = page.getByTestId('theme-control');
    await theme.selectOption('dark');
    await expect(page).toHaveURL(/theme=dark/);
    await expect(stage).toHaveAttribute('data-krn-theme-mode', 'dark');

    const density = page.getByTestId('density-control');
    await density.selectOption('spacious');
    await expect(page).toHaveURL(/density=spacious/);
    await expect(stage).toHaveAttribute('data-krn-density', 'spacious');

    await expect(page).toHaveURL(/\/preview\/button\?/);
    await expect(page.getByTestId('component-specimen-button')).toBeVisible();
    await expect(page.locator('html')).not.toHaveAttribute('dir', 'rtl');
    await expect(page.locator('html')).not.toHaveAttribute('data-krn-theme-mode', 'dark');
    await expect(page.locator('html')).not.toHaveAttribute('data-krn-density', 'spacious');
    assertNoRuntimeErrors();
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
