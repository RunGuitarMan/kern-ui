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

  test('typing in global search preserves the current document scroll position', async ({
    page,
  }) => {
    await page.goto(`${DOCS_URL}/components/data-grid`);
    await settlePage(page);
    await page.evaluate(() => window.scrollTo({ top: 900 }));
    const initialScroll = await page.evaluate(() => window.scrollY);
    expect(initialScroll).toBeGreaterThan(200);

    const search = page.getByRole('combobox', { name: 'Search Kern components' });
    const searchBounds = await search.boundingBox();
    expect(searchBounds).not.toBeNull();
    await page.mouse.click(
      (searchBounds?.x ?? 0) + (searchBounds?.width ?? 0) / 2,
      (searchBounds?.y ?? 0) + (searchBounds?.height ?? 0) / 2,
    );
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(initialScroll);
    await page.keyboard.type('button');
    await expect(
      page.getByRole('listbox', { name: 'Search Kern components results' }),
    ).toBeVisible();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(initialScroll);
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

  test('Docs environment controls update the page and canvas together', async ({ page }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);

    await page.goto(`${DOCS_URL}/components/button`);
    await settlePage(page);

    const root = page.locator('html');
    const stage = page.getByTestId('specimen-stage');
    const direction = page.getByTestId('direction-control');
    await direction.selectOption('rtl');
    await expect(page).toHaveURL(/direction=rtl/);
    await expect(stage).toHaveAttribute('dir', 'rtl');
    await expect(root).toHaveAttribute('dir', 'rtl');

    const theme = page.getByTestId('theme-control');
    await theme.selectOption('dark');
    await expect(page).toHaveURL(/theme=dark/);
    await expect(stage).toHaveAttribute('data-krn-theme-mode', 'dark');
    await expect(root).toHaveAttribute('data-krn-theme-mode', 'dark');

    const density = page.getByTestId('density-control');
    await density.selectOption('spacious');
    await expect(page).toHaveURL(/density=spacious/);
    await expect(stage).toHaveAttribute('data-krn-density', 'spacious');
    await expect(root).toHaveAttribute('data-krn-density', 'spacious');

    await expect(page).toHaveURL(/\/components\/button\?/);
    await expect(page.getByTestId('component-specimen-button')).toBeVisible();
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
