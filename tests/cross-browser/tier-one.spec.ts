import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';
import type { Result } from 'axe-core';

import { DOCS_URL, previewUrl, settlePage, watchRuntimeErrors } from '../support/browser';

async function openSpecimen(page: Page, id: string): Promise<Locator> {
  await page.goto(`${DOCS_URL}/components/${id}`);
  await settlePage(page);

  const specimen = page.getByTestId(`component-specimen-${id}`);
  await expect(specimen).toBeVisible();
  return specimen;
}

function summarizeViolations(violations: readonly Result[]): string {
  return violations
    .map((violation) => {
      const targets = violation.nodes.map((node) => node.target.map(String).join(' > ')).join(', ');
      return `${violation.id} [${violation.impact ?? 'unknown'}] · ${violation.nodes.length} node(s) · ${targets}`;
    })
    .join('\n');
}

test.describe('Tier 1 browser contract', () => {
  test('server-renders and hydrates representative documentation without runtime errors', async ({
    page,
    request,
  }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);

    const serverResponse = await request.get(`${DOCS_URL}/components/data-grid`);
    expect(serverResponse.status()).toBe(200);
    const serverHtml = await serverResponse.text();
    expect(serverHtml).toContain('ng-server-context="ssr"');
    expect(serverHtml).toContain('data-testid="component-specimen-data-grid"');

    await page.goto(DOCS_URL);
    await settlePage(page);

    await expect(page).toHaveTitle(/Kern/);
    await expect(page.getByRole('link', { name: 'Kern documentation home' })).toBeVisible();
    await expect(page.locator('#docs-main')).toBeVisible();

    const specimen = await openSpecimen(page, 'data-grid');
    const gridRegion = specimen.getByRole('region', { name: 'Workspace usage' });
    const grid = gridRegion.getByRole('grid', { name: 'Workspace usage' });
    await expect(grid).toBeVisible();
    await expect(grid).toHaveAttribute('aria-rowcount', /^[1-9]\d*$/);
    await expect(grid).toHaveAttribute('aria-colcount', /^[1-9]\d*$/);
    await expect(gridRegion.getByRole('columnheader', { name: /Workspace/ })).toBeVisible();

    assertNoRuntimeErrors();
  });

  test('preserves the full playground contract across a hard reload', async ({ page }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);

    await page.goto(
      previewUrl({
        component: 'button',
        theme: 'high-contrast',
        density: 'spacious',
        direction: 'rtl',
        locale: 'ru-RU',
        motion: 'reduce',
        brandColor: '#d95831',
        viewport: 'phone',
        state: 'loading',
        args: { variant: 'soft' },
      }),
    );
    await settlePage(page);
    await expect(page).toHaveURL(/state=loading/);
    await expect(page).toHaveURL(/arg\.variant=soft/);
    const sharedUrl = page.url();

    const stage = page.getByTestId('specimen-stage');
    const primaryAction = page
      .getByTestId('component-specimen-button')
      .getByRole('button', { name: 'Publish changes' });
    const assertPlaygroundState = async (): Promise<void> => {
      await expect(page.getByTestId('theme-control')).toHaveValue('high-contrast');
      await expect(page.getByTestId('density-control')).toHaveValue('spacious');
      await expect(page.getByTestId('direction-control')).toHaveValue('rtl');
      await expect(page.getByTestId('locale-control')).toHaveValue('ru-RU');
      await expect(page.getByTestId('motion-control')).toHaveValue('reduce');
      await expect(page.getByTestId('brand-color-control')).toHaveValue('#d95831');
      await expect(page.getByTestId('viewport-control')).toHaveValue('phone');
      await expect(page.getByRole('combobox', { name: 'Variant' })).toHaveValue('soft');
      await expect(page.getByRole('checkbox', { name: 'Loading' })).toBeChecked();
      await expect(stage).toHaveAttribute('data-krn-theme-mode', 'high-contrast');
      await expect(stage).toHaveAttribute('data-krn-density', 'spacious');
      await expect(stage).toHaveAttribute('dir', 'rtl');
      await expect(stage).toHaveAttribute('data-krn-motion', 'reduce');
      await expect(stage).toHaveAttribute('data-state', 'loading');
      await expect(primaryAction).toHaveAttribute('data-variant', 'soft');
      await expect(primaryAction).not.toHaveAttribute('aria-busy');
      await expect(primaryAction).toHaveAttribute('aria-disabled', 'true');
      await expect(primaryAction.getByRole('status')).toHaveText('Загрузка…');
    };

    await assertPlaygroundState();
    await page.reload();
    await settlePage(page);
    await expect(page).toHaveURL(sharedUrl);
    await assertPlaygroundState();

    assertNoRuntimeErrors();
  });

  test('keeps native icon-button semantics across browsers', async ({ page }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);

    await page.goto(
      previewUrl({
        component: 'icon-button',
        args: { loading: true },
      }),
    );
    await settlePage(page);

    const specimen = page.getByTestId('component-specimen-icon-button');
    const button = specimen.locator('button[krnIconButton]').first();
    await expect(button).toHaveAccessibleName('Create workspace');
    await expect(button).toHaveAttribute('type', 'button');
    await expect(button).toHaveAttribute('data-loading', 'true');
    await expect(button).toHaveAttribute('aria-disabled', 'true');
    await expect(button).not.toHaveAttribute('aria-busy');
    await expect(button.getByRole('status')).toHaveText('Loading…');
    await expect(button.locator('button')).toHaveCount(0);

    const rect = await button.evaluate((element) => {
      const { height, width } = element.getBoundingClientRect();
      return { height, width };
    });
    expect(Math.abs(rect.width - rect.height), 'icon button is square').toBeLessThanOrEqual(1);

    await button.focus();
    await expect(button).toBeFocused();
    assertNoRuntimeErrors();
  });

  test('keeps the native connected button-group contract across browsers', async ({ page }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);

    await page.goto(
      previewUrl({
        component: 'button-group',
        args: { connected: true, orientation: 'horizontal' },
      }),
    );
    await settlePage(page);

    const specimen = page.getByTestId('component-specimen-button-group');
    const group = specimen.locator('div[krnButtonGroup]');
    const actions = group.locator(':scope > button[krnButton], :scope > button[krnIconButton]');
    const requestChanges = group.getByRole('button', { name: 'Request changes' });
    const approve = group.getByRole('button', { name: 'Approve' });
    const more = group.getByRole('button', { name: 'More review actions' });

    await expect(group).toHaveCount(1);
    await expect(group).toHaveAttribute('role', 'group');
    await expect(group).toHaveAccessibleName('Review actions');
    await expect(group).toHaveAttribute('data-connected', 'true');
    await expect(group).toHaveAttribute('data-orientation', 'horizontal');
    await expect(actions).toHaveCount(3);
    await expect(group.locator(':scope > button[krnButton]')).toHaveCount(2);
    await expect(group.locator(':scope > button[krnIconButton]')).toHaveCount(1);

    const gaps = await actions.evaluateAll((elements) =>
      elements.slice(0, -1).map((element, index) => {
        const current = element.getBoundingClientRect();
        const next = elements[index + 1]?.getBoundingClientRect();
        if (!next) {
          throw new Error('Expected an adjacent button-group action.');
        }
        return next.left - current.right;
      }),
    );
    for (const gap of gaps) {
      expect(gap, 'connected actions have no visible horizontal gap').toBeGreaterThanOrEqual(-2);
      expect(gap, 'connected actions have no visible horizontal gap').toBeLessThanOrEqual(0.5);
    }

    await requestChanges.focus();
    await requestChanges.press('ArrowRight');
    await expect(requestChanges).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(approve).toBeFocused();

    const focusAndOverflow = await approve.evaluate((element) => {
      const actionStyle = getComputedStyle(element);
      const groupStyle = getComputedStyle(element.parentElement as HTMLElement);
      return {
        boxShadow: actionStyle.boxShadow,
        outlineStyle: actionStyle.outlineStyle,
        overflowX: groupStyle.overflowX,
        overflowY: groupStyle.overflowY,
      };
    });
    expect(focusAndOverflow.boxShadow).not.toBe('none');
    expect(focusAndOverflow.outlineStyle).not.toBe('none');
    expect(focusAndOverflow.overflowX).not.toMatch(/hidden|clip/);
    expect(focusAndOverflow.overflowY).not.toMatch(/hidden|clip/);

    await page.keyboard.press('Tab');
    await expect(more).toBeFocused();

    const iconRect = await more.evaluate((element) => {
      const { height, width } = element.getBoundingClientRect();
      return { height, width };
    });
    expect(
      Math.abs(iconRect.width - iconRect.height),
      'grouped icon button is square',
    ).toBeLessThanOrEqual(1);

    assertNoRuntimeErrors();
  });

  test('keeps toggle-group toolbar navigation and pressed state across browsers', async ({
    page,
  }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);
    await page.goto(
      previewUrl({
        component: 'toggle-group',
        args: { multiple: true, orientation: 'vertical' },
      }),
    );
    await settlePage(page);

    const specimen = page.getByTestId('component-specimen-toggle-group');
    const group = specimen.getByRole('toolbar', { name: 'View mode' });
    const list = group.getByRole('button', { name: 'List' });
    const board = group.getByRole('button', { name: 'Board' });

    await expect(group).toHaveAttribute('aria-orientation', 'vertical');
    await expect(list).toHaveAttribute('aria-pressed', 'true');
    await list.focus();
    await list.press('ArrowDown');
    await expect(board).toBeFocused();
    await expect(board).toHaveAttribute('aria-pressed', 'false');
    await board.press('Enter');
    await expect(board).toHaveAttribute('aria-pressed', 'true');
    await expect(list).toHaveAttribute('aria-pressed', 'true');
    assertNoRuntimeErrors();
  });

  test('keeps deterministic copy-button state and keyboard behavior across browsers', async ({
    page,
  }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);
    await page.goto(
      previewUrl({
        component: 'copy-button',
        state: 'idle',
        args: {
          feedbackDuration: 60_000,
          size: 'sm',
          tone: 'brand',
          variant: 'solid',
        },
      }),
    );
    await settlePage(page);

    let specimen = page.getByTestId('component-specimen-copy-button');
    let copy = specimen.locator('krn-copy-button');
    let button = copy.getByRole('button', { name: 'Copy install command' });
    let status = copy.locator('.krn-copy-status');

    await expect(copy).toHaveAttribute('data-state', 'idle');
    await expect(copy).toHaveAttribute('data-pending', 'false');
    await expect(copy).toHaveAttribute('data-size', 'sm');
    await expect(copy).toHaveAttribute('data-tone', 'brand');
    await expect(copy).toHaveAttribute('data-variant', 'solid');
    await expect(button).toHaveAttribute('type', 'button');
    await button.focus();
    await button.press('Space');
    await expect(button).toBeFocused();
    await expect(copy).toHaveAttribute('data-state', 'copied');
    await expect(status).toHaveText('Copied');

    await page.goto(
      previewUrl({
        component: 'copy-button',
        state: 'pending',
      }),
    );
    await settlePage(page);
    specimen = page.getByTestId('component-specimen-copy-button');
    copy = specimen.locator('krn-copy-button');
    button = copy.getByRole('button', { name: 'Copy install command' });
    status = copy.locator('.krn-copy-status');
    await expect(copy).toHaveAttribute('data-state', 'idle');
    await expect(copy).toHaveAttribute('data-pending', 'true');
    await expect(button).toHaveAttribute('aria-disabled', 'true');
    await expect(button).not.toHaveAttribute('aria-busy');
    await expect(status).toHaveText('Copying…');
    await expect(button.locator('.krn-action__status')).toHaveText('');

    await page.goto(
      previewUrl({
        component: 'copy-button',
        state: 'error',
      }),
    );
    await settlePage(page);
    specimen = page.getByTestId('component-specimen-copy-button');
    copy = specimen.locator('krn-copy-button');
    button = copy.getByRole('button', { name: 'Copy install command' });
    status = copy.locator('.krn-copy-status');
    await expect(copy).toHaveAttribute('data-state', 'error');
    await expect(copy).toHaveAttribute('data-pending', 'false');
    await expect(button).toHaveAccessibleName('Copy install command');
    await expect(status).toHaveText('Could not copy');
    assertNoRuntimeErrors();
  });

  test('preserves keyboard navigation and modal focus lifecycle', async ({ page }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);

    let specimen = await openSpecimen(page, 'tabs');
    const tabs = specimen.getByRole('tab');
    const firstTab = tabs.nth(0);
    const secondTab = tabs.nth(1);

    await expect(firstTab).toHaveAttribute('aria-selected', 'true');
    await firstTab.focus();
    await firstTab.press('ArrowRight');
    await expect(secondTab).toBeFocused();
    await expect(secondTab).toHaveAttribute('aria-selected', 'true');

    specimen = await openSpecimen(page, 'dialog');
    const trigger = specimen.getByRole('button', { name: 'Edit workspace' });
    await trigger.click();

    const dialog = page.getByRole('dialog', { name: 'Edit workspace' });
    await expect(dialog).toBeVisible();
    await expect
      .poll(() =>
        dialog.evaluate((element) => element.contains(element.ownerDocument.activeElement)),
      )
      .toBe(true);
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();

    assertNoRuntimeErrors();
  });

  test('has no serious axe violations in simple and complex component pages', async ({
    page,
  }, testInfo) => {
    for (const component of ['button', 'data-grid'] as const) {
      await openSpecimen(page, component);

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();
      const blocking = results.violations.filter(
        (violation) => violation.impact === 'critical' || violation.impact === 'serious',
      );

      await testInfo.attach(`axe-${component}-violations.json`, {
        body: Buffer.from(JSON.stringify(blocking, null, 2)),
        contentType: 'application/json',
      });
      expect(blocking.length, summarizeViolations(blocking)).toBe(0);
    }
  });
});
