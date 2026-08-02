import { expect, test, type Locator, type Page } from '@playwright/test';

import { KERN_CATALOG } from '../../projects/showcase/src/lib/catalog';
import {
  expectNoPageOverflow,
  previewUrl,
  settlePage,
  watchRuntimeErrors,
} from '../support/browser';

async function openPreviewSpecimen(
  page: Page,
  component: string,
  scenario: 'default' | 'states' | 'stress' | 'virtual' = 'default',
  locale: 'en-US' | 'ru-RU' = 'en-US',
  state?: string,
): Promise<Locator> {
  await page.goto(
    previewUrl({
      component,
      scenario,
      locale,
      state,
      theme: 'light',
      density: 'comfortable',
      direction: 'ltr',
    }),
  );
  await settlePage(page);
  const specimen = page.getByTestId(`component-specimen-${component}`);
  await expect(specimen).toBeVisible();
  return specimen;
}

test.describe('Enterprise browser acceptance contracts', () => {
  test('the shared Docs preview renderer activates every catalog specimen without a fallback', async ({
    page,
  }) => {
    test.setTimeout(180_000);
    const assertNoRuntimeErrors = watchRuntimeErrors(page);

    expect(KERN_CATALOG).toHaveLength(131);

    for (const item of KERN_CATALOG) {
      await page.goto(previewUrl({ component: item.id }), { waitUntil: 'domcontentloaded' });
      const specimen = page.getByTestId(`component-specimen-${item.id}`);
      await expect(
        specimen,
        `${item.id}: shared specimen is rendered in Docs preview`,
      ).toBeVisible();
      await expect(specimen, `${item.id}: exact catalog identity`).toHaveAttribute(
        'data-specimen',
        item.id,
      );
      await expect(
        specimen.locator('.missing-specimen'),
        `${item.id}: no generic fallback is shown`,
      ).toHaveCount(0);
    }

    assertNoRuntimeErrors();
  });

  test('async selection states remain explicit, operable, and semantic', async ({ page }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);

    let specimen = await openPreviewSpecimen(page, 'select', 'default', 'en-US', 'async-loading');
    const select = specimen.getByRole('combobox', { name: 'Workspace plan' });
    await expect(select).toHaveAttribute('aria-busy', 'true');
    await select.click();
    await expect(specimen.getByRole('status')).toHaveText('Loading options…');
    const loadingOption = specimen.getByRole('option', { name: 'Loading options…' });
    await expect(loadingOption).toHaveCount(1);
    await expect(loadingOption).toHaveAttribute('aria-disabled', 'true');
    await page.keyboard.press('Escape');
    await expect(select).toBeFocused();

    specimen = await openPreviewSpecimen(page, 'multi-select', 'default', 'en-US', 'error');
    const multiSelect = specimen.getByRole('combobox', { name: 'Owners' });
    await multiSelect.click();
    await expect(specimen.getByRole('listbox')).toHaveAttribute('aria-invalid', 'true');
    await expect(specimen.getByRole('alert')).toHaveText('Could not load options');
    const failedOption = specimen.getByRole('option', { name: 'Could not load options' });
    await expect(failedOption).toHaveCount(1);
    await expect(failedOption).toHaveAttribute('aria-disabled', 'true');

    assertNoRuntimeErrors();
  });

  test('async tree branches expose loading and retryable error state to assistive APIs', async ({
    page,
  }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);

    let specimen = await openPreviewSpecimen(page, 'tree', 'states');
    const loadingNode = specimen.getByRole('treeitem', {
      name: 'Loading children for Loading projects',
    });
    const failedNode = specimen.getByRole('treeitem', {
      name: 'Could not load children for Failed projects',
    });
    await expect(loadingNode).toHaveAttribute('aria-busy', 'true');
    await expect(failedNode).toHaveAttribute('aria-invalid', 'true');
    await loadingNode.focus();
    await loadingNode.press('ArrowDown');
    await expect(failedNode).toBeFocused();
    await failedNode.press('ArrowRight');
    await expect(failedNode).toHaveAttribute('aria-expanded', 'true');

    specimen = await openPreviewSpecimen(page, 'tree-navigation', 'states');
    await expect(
      specimen.getByRole('treeitem', { name: 'Loading children for Loading workspace' }),
    ).toHaveAttribute('aria-busy', 'true');
    await expect(
      specimen.getByRole('treeitem', {
        name: 'Could not load children for Failed workspace',
      }),
    ).toHaveAttribute('aria-invalid', 'true');

    assertNoRuntimeErrors();
  });

  test('Data Grid pins semantic columns to logical edges across LTR and RTL', async ({ page }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);
    await page.setViewportSize({ width: 640, height: 900 });

    for (const scenario of ['states', 'virtual'] as const) {
      for (const direction of ['ltr', 'rtl'] as const) {
        await page.goto(
          previewUrl({
            component: 'data-grid',
            scenario,
            direction,
            theme: 'light',
            density: 'compact',
          }),
        );
        await settlePage(page);

        const specimen = page.getByTestId('component-specimen-data-grid');
        const scroll = specimen.locator(scenario === 'virtual' ? '.virtual-grid' : '.table-scroll');
        const start = specimen.locator(
          '[role="columnheader"][data-column-key="workspace"][data-pinned="start"]',
        );
        const end = specimen.locator(
          '[role="columnheader"][data-column-key="usage"][data-pinned="end"]',
        );

        await expect(start).toHaveAttribute('data-pin-boundary', 'start');
        await expect(end).toHaveAttribute('data-pin-boundary', 'end');
        await expect
          .poll(() => scroll.evaluate((element) => element.scrollWidth > element.clientWidth))
          .toBe(true);

        await scroll.evaluate((element, nextDirection) => {
          element.scrollLeft = nextDirection === 'rtl' ? -element.scrollWidth : element.scrollWidth;
        }, direction);

        const scrollBox = await scroll.boundingBox();
        const startBox = await start.boundingBox();
        const endBox = await end.boundingBox();
        const startPosition = await start.evaluate((element) => getComputedStyle(element).position);
        const endPosition = await end.evaluate((element) => getComputedStyle(element).position);
        expect(scrollBox).not.toBeNull();
        expect(startBox).not.toBeNull();
        expect(endBox).not.toBeNull();
        expect(startPosition).toBe('sticky');
        expect(endPosition).toBe('sticky');
        expect((startBox?.x ?? 0) + (startBox?.width ?? 0)).toBeGreaterThan(scrollBox?.x ?? 0);
        expect(endBox?.x ?? 0).toBeLessThan((scrollBox?.x ?? 0) + (scrollBox?.width ?? 0));
        await expectNoPageOverflow(page);
      }
    }

    assertNoRuntimeErrors();
  });

  test('Chart identity survives reordering and long summaries stay bounded', async ({ page }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);

    let specimen = await openPreviewSpecimen(page, 'line-chart', 'states');
    const wed = specimen.locator('[role="button"][aria-label="Wed: 49"]');
    await wed.focus();
    await expect(wed).toBeFocused();
    await expect(specimen.locator('.chart-tooltip[role="status"]')).toContainText('Wed');
    await wed.evaluate((element) => {
      (element as Element & { __kernIdentityProbe?: string }).__kernIdentityProbe = 'wed';
    });

    await specimen
      .getByRole('button', { name: 'Reverse data order' })
      .evaluate((element) => (element as HTMLButtonElement).click());
    const reorderedWed = specimen.locator('[role="button"][aria-label="Wed: 49"]');
    await expect(reorderedWed).toBeFocused();
    await expect(reorderedWed).toHaveAttribute('data-active', '');
    await expect
      .poll(() =>
        reorderedWed.evaluate(
          (element) =>
            (element as Element & { __kernIdentityProbe?: string }).__kernIdentityProbe ?? null,
        ),
      )
      .toBe('wed');
    await expect(specimen.locator('.chart-tooltip[role="status"]')).toContainText('Wed');

    specimen = await openPreviewSpecimen(page, 'line-chart', 'stress');
    const chart = specimen.locator('svg[role="group"][aria-label*="Weekly active users"]');
    const summary = await chart.getAttribute('aria-label');
    expect(summary).toContain('P001: 40');
    expect(summary).toContain('108 more data points');
    expect(summary).not.toContain('P013:');
    expect(summary?.length ?? 0).toBeLessThan(320);

    assertNoRuntimeErrors();
  });

  test('the Russian locale pack reaches form, tree, grid, and chart runtime copy', async ({
    page,
  }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);

    await page.goto(previewUrl({ component: 'select', state: 'async-loading', locale: 'ru-RU' }));
    await settlePage(page);

    let specimen = page.getByTestId('component-specimen-select');
    await expect(specimen).toBeVisible();
    await expect(page.getByTestId('specimen-stage')).toHaveAttribute('lang', 'ru-RU');
    await expect(page.locator('html')).not.toHaveAttribute('lang', 'ru-RU');
    const select = specimen.getByRole('combobox', { name: 'Workspace plan' });
    await select.click();
    await expect(specimen.getByRole('status')).toHaveText('Загрузка вариантов…');

    specimen = await openPreviewSpecimen(page, 'tree', 'states', 'ru-RU');
    await expect(
      specimen.getByRole('treeitem', {
        name: 'Загрузка дочерних элементов для «Loading projects»',
      }),
    ).toHaveAttribute('aria-busy', 'true');
    await expect(
      specimen.getByRole('treeitem', {
        name: 'Не удалось загрузить дочерние элементы для «Failed projects»',
      }),
    ).toHaveAttribute('aria-invalid', 'true');

    specimen = await openPreviewSpecimen(page, 'data-grid', 'default', 'ru-RU');
    await expect(specimen.getByPlaceholder('Фильтр строк…')).toBeVisible();
    await expect(specimen.getByText('4 строки', { exact: true })).toBeVisible();

    specimen = await openPreviewSpecimen(page, 'line-chart', 'stress', 'ru-RU');
    await expect(specimen.getByRole('button', { name: 'Показать данные' })).toBeVisible();
    const summary = await specimen.locator('svg[role="group"]').getAttribute('aria-label');
    expect(summary).toContain('Ещё 108 точек данных');

    assertNoRuntimeErrors();
  });

  test('modal overlay variants trap focus, close from the top layer, and restore triggers', async ({
    page,
  }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);

    for (const overlay of [
      {
        component: 'drawer',
        trigger: 'Open activity drawer',
        name: 'Recent activity',
      },
      {
        component: 'bottom-sheet',
        trigger: 'Choose mobile action',
        name: 'Workspace actions',
      },
    ] as const) {
      const specimen = await openPreviewSpecimen(page, overlay.component);
      const trigger = specimen.getByRole('button', { name: overlay.trigger });
      await trigger.click();
      const dialog = page.getByRole('dialog', { name: overlay.name });
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveAttribute('aria-modal', 'true');
      await expect
        .poll(() =>
          dialog.evaluate((element) => element.closest('[data-testid="specimen-stage"]') !== null),
        )
        .toBe(true);
      await expect
        .poll(() =>
          dialog.evaluate((element) => element.contains(element.ownerDocument.activeElement)),
        )
        .toBe(true);
      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
      await expect(trigger).toBeFocused();
    }

    const specimen = await openPreviewSpecimen(page, 'alert-dialog');
    const trigger = specimen.getByRole('button', { name: 'Delete workspace' });
    await trigger.click();
    const alertDialog = page.getByRole('alertdialog', { name: 'Delete Northstar?' });
    await expect(alertDialog).toBeVisible();
    await expect
      .poll(() =>
        alertDialog.evaluate(
          (element) => element.closest('[data-testid="specimen-stage"]') !== null,
        ),
      )
      .toBe(true);
    await page.mouse.click(4, 4);
    await expect(alertDialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(alertDialog).toHaveCount(0);
    await expect(trigger).toBeFocused();

    assertNoRuntimeErrors();
  });
});
