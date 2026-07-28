import { expect, test, type Locator, type Page } from '@playwright/test';

import { labUrl, settlePage, watchRuntimeErrors } from '../support/browser';

async function openVirtualGrid(
  page: Page,
  density: 'compact' | 'spacious',
): Promise<{ readonly row: Locator; readonly viewport: Locator }> {
  await page.goto(
    labUrl({
      component: 'data-grid',
      scenario: 'virtual',
      theme: 'light',
      density,
      direction: 'ltr',
    }),
  );
  await settlePage(page);

  const specimen = page.getByTestId('specimen-data-grid');
  await expect(specimen).toBeVisible();
  const viewport = specimen.locator('cdk-virtual-scroll-viewport');
  const row = viewport.locator('.virtual-row').first();
  await expect(viewport).toBeVisible();
  await expect(row).toBeVisible();
  return { row, viewport };
}

async function expectSynchronizedItemSize(
  viewport: Locator,
  row: Locator,
  expected: number,
): Promise<void> {
  await expect
    .poll(async () => {
      const itemSize = Number(await viewport.getAttribute('data-item-size'));
      const rowSize = await row.evaluate((element) => element.getBoundingClientRect().height);
      return Math.max(Math.abs(rowSize - expected), Math.abs(itemSize - rowSize));
    })
    .toBeLessThanOrEqual(0.5);
}

test.describe('Data grid enterprise contracts', () => {
  test('virtual strategy follows compact and spacious density tokens', async ({ page }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);

    let grid = await openVirtualGrid(page, 'compact');
    await expectSynchronizedItemSize(grid.viewport, grid.row, 36);

    grid = await openVirtualGrid(page, 'spacious');
    await expectSynchronizedItemSize(grid.viewport, grid.row, 52);

    assertNoRuntimeErrors();
  });

  test('text zoom remeasures virtual rows without losing managed cell focus', async ({ page }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);
    const { row, viewport } = await openVirtualGrid(page, 'compact');
    const firstCell = viewport.locator('[data-cell="0-0"]');

    await firstCell.focus();
    await expect(firstCell).toBeFocused();
    await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
    await expectSynchronizedItemSize(viewport, row, 72);
    await expect(firstCell).toBeFocused();

    await firstCell.press('ArrowDown');
    await expect(viewport.locator('[data-cell="1-0"]')).toBeFocused();
    assertNoRuntimeErrors();
  });

  test('header and selection actions participate in one managed virtual-grid sequence', async ({
    page,
  }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);
    await openVirtualGrid(page, 'compact');
    const grid = page.getByTestId('specimen-data-grid').locator('[role="grid"]');
    const managedCells = grid.locator('[data-cell]');
    const managedActions = grid.locator('button, input, [role="separator"]');

    await expect
      .poll(() =>
        managedCells.evaluateAll((cells) => cells.filter((cell) => cell.tabIndex === 0).length),
      )
      .toBe(1);
    await expect
      .poll(() =>
        managedActions.evaluateAll((actions) => actions.every((action) => action.tabIndex === -1)),
      )
      .toBe(true);

    const plainCell = grid.locator('[data-cell="0-1"]');
    await plainCell.focus();
    await plainCell.press('Tab');
    await expect
      .poll(() => page.evaluate(() => document.activeElement?.closest('[role="grid"]') === null))
      .toBe(true);

    const selectAllCell = grid.locator('[data-cell="-1-0"]');
    const selectAll = selectAllCell.locator('input[type="checkbox"]');
    await selectAllCell.focus();
    await selectAllCell.press('Enter');
    await expect(selectAll).toBeFocused();
    await expect(selectAll).toHaveAttribute('tabindex', '0');
    await selectAll.press('Escape');
    await expect(selectAllCell).toBeFocused();
    await expect(selectAll).toHaveAttribute('tabindex', '-1');

    const firstHeader = grid.locator('[data-cell="-1-1"]');
    const sortButton = firstHeader.locator('button');
    const separator = firstHeader.locator('[role="separator"]');
    await firstHeader.focus();
    await firstHeader.press('Enter');
    await expect(sortButton).toBeFocused();
    await sortButton.press('Tab');
    await expect(separator).toBeFocused();
    const initialWidth = Number(await separator.getAttribute('aria-valuenow'));
    await separator.press('ArrowRight');
    await expect(separator).toHaveAttribute('aria-valuenow', String(initialWidth + 10));
    await separator.press('Tab');
    await expect
      .poll(() => page.evaluate(() => document.activeElement?.closest('[role="grid"]') === null))
      .toBe(true);

    assertNoRuntimeErrors();
  });
});
