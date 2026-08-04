import { expect, test, type Page, type TestInfo } from '@playwright/test';

import {
  expectNoPageOverflow,
  previewUrl,
  settlePage,
  watchRuntimeErrors,
} from '../support/browser';

async function openMobileSpecimen(
  page: Page,
  component: string,
  options: { readonly scenario?: 'default' | 'virtual'; readonly direction?: 'ltr' | 'rtl' } = {},
) {
  await page.goto(
    previewUrl({
      component,
      scenario: options.scenario ?? 'default',
      theme: 'light',
      density: 'comfortable',
      direction: options.direction ?? 'ltr',
    }),
  );
  await settlePage(page);
  const specimen = page.getByTestId(`component-specimen-${component}`);
  await expect(specimen).toBeVisible();
  return specimen;
}

async function expectGridFocusVisible(
  page: Page,
  specimen: ReturnType<Page['locator']>,
  targetColumn: 'end' | number = 'end',
  targetRow = -1,
) {
  const scroller = specimen.locator('.table-scroll, .virtual-grid');
  await expect
    .poll(() => scroller.evaluate((element) => element.scrollWidth > element.clientWidth))
    .toBe(true);
  const headerCells = specimen.locator('[data-cell^="-1-"]');
  const firstCell = headerCells.first();
  const lastCell = headerCells.last();
  await firstCell.focus();
  const horizontalKey = await firstCell.evaluate((cell) =>
    getComputedStyle(cell).direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight',
  );
  const pageScrollBefore = await page.evaluate(() => ({ x: scrollX, y: scrollY }));
  if (targetRow >= 0) {
    await page.keyboard.press('ArrowDown');
    await expect(specimen.locator(`[data-cell="${targetRow}-0"]`)).toBeFocused();
  }
  if (targetColumn === 'end') {
    await page.keyboard.press('End');
  } else {
    for (let index = 0; index < targetColumn; index += 1) {
      await page.keyboard.press(horizontalKey);
    }
  }
  const targetCell =
    targetRow < 0
      ? targetColumn === 'end'
        ? lastCell
        : headerCells.nth(targetColumn)
      : specimen.locator(
          `[data-cell="${targetRow}-${targetColumn === 'end' ? (await headerCells.count()) - 1 : targetColumn}"]`,
        );
  await expect(targetCell).toBeVisible();
  await expect(targetCell).toBeFocused();
  await expect
    .poll(() => scroller.evaluate((element) => Math.abs(element.scrollLeft)))
    .toBeGreaterThan(0);
  const visibility = await targetCell.evaluate((cell) => {
    const owner = cell.closest<HTMLElement>('.table-scroll, .virtual-grid');
    if (!owner) return null;
    const cellRect = cell.getBoundingClientRect();
    const ownerRect = owner.getBoundingClientRect();
    const position = cell.getAttribute('data-cell')?.split('-');
    const header = position
      ? owner.querySelector<HTMLElement>(`[data-cell="-1-${position.at(-1)}"]`)
      : null;
    const headerRect = header?.getBoundingClientRect();
    return {
      inlineStart: cellRect.left - ownerRect.left,
      inlineEnd: ownerRect.right - cellRect.right,
      headerInlineStart: headerRect ? headerRect.left - ownerRect.left : null,
      headerInlineEnd: headerRect ? ownerRect.right - headerRect.right : null,
      headerBodyOffset: headerRect ? Math.abs(headerRect.left - cellRect.left) : null,
    };
  });
  expect(visibility).not.toBeNull();
  expect(visibility?.inlineStart ?? -1).toBeGreaterThanOrEqual(-1);
  expect(visibility?.inlineEnd ?? -1).toBeGreaterThanOrEqual(-1);
  if (targetRow >= 0) {
    expect(visibility?.headerInlineStart ?? -1).toBeGreaterThanOrEqual(-1);
    expect(visibility?.headerInlineEnd ?? -1).toBeGreaterThanOrEqual(-1);
    expect(visibility?.headerBodyOffset ?? Number.POSITIVE_INFINITY).toBeLessThanOrEqual(1);
  }
  await expect
    .poll(() => page.evaluate(() => ({ x: scrollX, y: scrollY })))
    .toEqual(pageScrollBefore);
}

async function expectVirtualPinsAligned(specimen: ReturnType<Page['locator']>) {
  const grid = specimen.locator('.virtual-grid');
  const metrics = () =>
    grid.evaluate((element) => {
      const row = element.querySelector<HTMLElement>('.virtual-row');
      if (!row) {
        return {
          alignment: Number.POSITIVE_INFINITY,
          visibilityMismatch: Number.POSITIVE_INFINITY,
          visibleRatio: 0,
        };
      }

      const ownerRect = element.getBoundingClientRect();
      const pinnedCells = [...row.querySelectorAll<HTMLElement>('[data-pinned][data-cell]')];
      if (!pinnedCells.some((cell) => cell.dataset['pinned'] === 'start')) {
        return {
          alignment: Number.POSITIVE_INFINITY,
          visibilityMismatch: Number.POSITIVE_INFINITY,
          visibleRatio: 0,
        };
      }
      if (!pinnedCells.some((cell) => cell.dataset['pinned'] === 'end')) {
        return {
          alignment: Number.POSITIVE_INFINITY,
          visibilityMismatch: Number.POSITIVE_INFINITY,
          visibleRatio: 0,
        };
      }

      return pinnedCells.reduce(
        (maximum, cell) => {
          const column = cell.dataset['cell']?.split('-').at(-1);
          const header = column
            ? element.querySelector<HTMLElement>(`[data-cell="-1-${column}"]`)
            : null;
          if (!header) {
            return {
              alignment: Number.POSITIVE_INFINITY,
              visibilityMismatch: Number.POSITIVE_INFINITY,
              visibleRatio: 0,
            };
          }

          const bodyRect = cell.getBoundingClientRect();
          const headerRect = header.getBoundingClientRect();
          const bodyVisible = Math.max(
            0,
            Math.min(bodyRect.right, ownerRect.right) - Math.max(bodyRect.left, ownerRect.left),
          );
          const headerVisible = Math.max(
            0,
            Math.min(headerRect.right, ownerRect.right) - Math.max(headerRect.left, ownerRect.left),
          );
          return {
            alignment: Math.max(maximum.alignment, Math.abs(bodyRect.left - headerRect.left)),
            visibilityMismatch: Math.max(
              maximum.visibilityMismatch,
              Math.abs(bodyVisible - headerVisible),
            ),
            visibleRatio: Math.min(maximum.visibleRatio, bodyVisible / bodyRect.width),
          };
        },
        { alignment: 0, visibilityMismatch: 0, visibleRatio: 1 },
      );
    });

  await expect.poll(async () => (await metrics()).alignment).toBeLessThanOrEqual(1);
  await expect.poll(async () => (await metrics()).visibilityMismatch).toBeLessThanOrEqual(1);
  await expect.poll(async () => (await metrics()).visibleRatio).toBeGreaterThanOrEqual(0.95);
}

async function expectRealMobileEmulation(page: Page, testInfo: TestInfo): Promise<void> {
  expect(testInfo.project.use.isMobile, `${testInfo.project.name}: isMobile`).toBe(true);
  expect(testInfo.project.use.hasTouch, `${testInfo.project.name}: hasTouch`).toBe(true);
  const browserName = testInfo.project.use.browserName;
  expect(['chromium', 'webkit']).toContain(browserName);
  const runtime = await page.evaluate(() => ({
    touchEvents: 'ontouchstart' in window,
    userAgent: navigator.userAgent,
    width: innerWidth,
  }));
  expect(runtime.touchEvents, `${testInfo.project.name}: touch events`).toBe(true);
  expect(runtime.userAgent).toMatch(/Android|iPhone|Mobile/);
  expect(runtime.width).toBeLessThanOrEqual(430);
}

test.describe('Risk-based mobile viewport and touch contracts', () => {
  test('[overlay] bottom sheet locks document scrolling and stays thumb-operable', async ({
    page,
  }, testInfo) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);
    const specimen = await openMobileSpecimen(page, 'bottom-sheet');
    await expectRealMobileEmulation(page, testInfo);

    await specimen.getByRole('button', { name: 'Choose mobile action' }).tap();
    const dialog = page.getByRole('dialog', { name: 'Workspace actions' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('hidden');
    const bounds = await dialog.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds?.width ?? 0).toBeLessThanOrEqual(testInfo.project.use.viewport?.width ?? 412);

    await dialog.getByRole('button', { name: 'Close' }).tap();
    await expect(dialog).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('');
    await expectNoPageOverflow(page);
    assertNoRuntimeErrors();
  });

  test('[form] custom select commits an option through touch without losing its accessible name', async ({
    page,
  }, testInfo) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);
    const specimen = await openMobileSpecimen(page, 'select');
    await expectRealMobileEmulation(page, testInfo);

    const trigger = specimen.getByRole('combobox', { name: 'Workspace plan' });
    await trigger.tap();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await specimen.getByRole('option', { name: /Team/ }).tap();
    await expect(trigger).toContainText('Team');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expectNoPageOverflow(page);
    assertNoRuntimeErrors();
  });

  test('[pointer] number stepper responds to a coarse touch target', async ({ page }, testInfo) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);
    const specimen = await openMobileSpecimen(page, 'number-input');
    await expectRealMobileEmulation(page, testInfo);

    const input = specimen.getByRole('spinbutton', { name: 'Seat limit' });
    const before = await input.inputValue();
    const increase = specimen.getByRole('button', { name: 'Increase value' });
    const bounds = await increase.boundingBox();
    expect(bounds).not.toBeNull();
    expect(Math.min(bounds?.width ?? 0, bounds?.height ?? 0)).toBeGreaterThanOrEqual(24);
    await increase.tap();
    await expect(input).not.toHaveValue(before);
    assertNoRuntimeErrors();
  });

  test('[scroll] data-grid keeps overflow focus-visible and row actions touch-operable', async ({
    page,
  }, testInfo) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);
    const specimen = await openMobileSpecimen(page, 'data-grid');
    await expectRealMobileEmulation(page, testInfo);

    await expectGridFocusVisible(page, specimen);
    await specimen.getByRole('checkbox', { name: 'Select row 1' }).tap();
    await expect(specimen.getByRole('checkbox', { name: 'Select row 1' })).toBeChecked();
    await expectNoPageOverflow(page);

    const virtualSpecimen = await openMobileSpecimen(page, 'data-grid', { scenario: 'virtual' });
    await expectGridFocusVisible(page, virtualSpecimen, 3, 0);
    await expectVirtualPinsAligned(virtualSpecimen);
    await expectNoPageOverflow(page);

    const rtlSpecimen = await openMobileSpecimen(page, 'data-grid', { direction: 'rtl' });
    await expectGridFocusVisible(page, rtlSpecimen);
    await expectNoPageOverflow(page);

    const rtlVirtualSpecimen = await openMobileSpecimen(page, 'data-grid', {
      scenario: 'virtual',
      direction: 'rtl',
    });
    await expectGridFocusVisible(page, rtlVirtualSpecimen, 3, 0);
    await expectVirtualPinsAligned(rtlVirtualSpecimen);
    await expectNoPageOverflow(page);
    assertNoRuntimeErrors();
  });
});
