import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Result } from 'axe-core';

import { KERN_CATALOG } from '../../projects/showcase/src/lib/catalog';
import {
  DOCS_URL,
  expectNoPageOverflow,
  previewUrl,
  settlePage,
  watchRuntimeErrors,
} from '../support/browser';

const docsRoutes = [
  '/',
  '/foundations',
  '/components/button',
  '/components/data-grid',
  '/patterns',
  '/accessibility',
] as const;

function summarizeViolations(violations: readonly Result[]): string {
  return violations
    .map((violation) => {
      const targets = violation.nodes.map((node) => node.target.map(String).join(' > ')).join(', ');
      return `${violation.id} [${violation.impact ?? 'unknown'}] · ${violation.nodes.length} node(s) · ${targets}`;
    })
    .join('\n');
}

test.describe('WCAG automated checks', () => {
  test.describe.configure({ mode: 'parallel' });

  for (const route of docsRoutes) {
    test(`Docs ${route} has no serious automated violations`, async ({ page }, testInfo) => {
      await page.goto(`${DOCS_URL}${route === '/' ? '' : route}`);
      await settlePage(page);

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();
      const blocking = results.violations.filter(
        (violation) => violation.impact === 'critical' || violation.impact === 'serious',
      );
      await testInfo.attach('axe-violations.json', {
        body: Buffer.from(JSON.stringify(blocking, null, 2)),
        contentType: 'application/json',
      });

      expect(blocking.length, summarizeViolations(blocking)).toBe(0);
    });
  }

  for (const item of KERN_CATALOG) {
    test(`${item.name} specimen has no automated WCAG violations`, async ({ page }, testInfo) => {
      await page.goto(`${DOCS_URL}/components/${item.id}`);
      await settlePage(page);

      const specimenSelector = `[data-testid="component-specimen-${item.id}"]`;
      await expect(page.locator(specimenSelector)).toBeVisible();
      const results = await new AxeBuilder({ page })
        .include(specimenSelector)
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();
      await testInfo.attach(`${item.id}-axe-results.json`, {
        body: Buffer.from(JSON.stringify(results.violations, null, 2)),
        contentType: 'application/json',
      });

      expect(results.violations.length, summarizeViolations(results.violations)).toBe(0);
    });
  }

  const previewStates = [
    previewUrl(),
    previewUrl({
      component: 'text-input',
      state: 'invalid',
      theme: 'dark',
      density: 'compact',
      direction: 'rtl',
    }),
    previewUrl({
      component: 'alert',
      state: 'long-text',
      theme: 'high-contrast',
      density: 'spacious',
      direction: 'ltr',
    }),
  ] as const;

  for (const [index, url] of previewStates.entries()) {
    test(`Docs preview state ${index + 1} has no serious automated violations`, async ({
      page,
    }, testInfo) => {
      await page.goto(url);
      await settlePage(page);

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();
      const blocking = results.violations.filter(
        (violation) => violation.impact === 'critical' || violation.impact === 'serious',
      );
      await testInfo.attach('axe-violations.json', {
        body: Buffer.from(JSON.stringify(blocking, null, 2)),
        contentType: 'application/json',
      });

      expect(blocking.length, summarizeViolations(blocking)).toBe(0);
    });
  }

  test('button exposes a persistent localized live status without busy suppression', async ({
    page,
  }) => {
    await page.goto(
      previewUrl({
        component: 'button',
        locale: 'ru-RU',
        args: { loading: false },
      }),
    );
    await settlePage(page);

    const specimen = page.getByTestId('component-specimen-button');
    const button = specimen.locator('button[krnButton]').first();
    const status = button.locator('[role="status"]');
    await expect(status).toHaveCount(1);
    await expect(status).toHaveAttribute('aria-live', 'polite');
    await expect(status).toHaveText('');
    await status.evaluate((element) => {
      element.setAttribute('data-persistent-live-status', '');
    });

    await page.getByRole('checkbox', { name: 'Loading' }).check();

    await expect(status).toHaveAttribute('data-persistent-live-status', '');
    await expect(status).toHaveText('Загрузка…');
    await expect(button).toHaveAttribute('aria-disabled', 'true');
    await expect(button).not.toHaveAttribute('aria-busy');
    const accessibilityTree = await button.ariaSnapshot();
    expect(accessibilityTree).toContain('status');
    expect(accessibilityTree).toContain('Загрузка…');
  });

  test('icon button exposes a persistent localized live status on its native host', async ({
    page,
  }) => {
    await page.goto(
      previewUrl({
        component: 'icon-button',
        locale: 'ru-RU',
        args: { loading: false },
      }),
    );
    await settlePage(page);

    const specimen = page.getByTestId('component-specimen-icon-button');
    const button = specimen.locator('button[krnIconButton]').first();
    const status = button.getByRole('status');
    await expect(button).toHaveAccessibleName('Create workspace');
    await expect(button.locator('button')).toHaveCount(0);
    await expect(status).toHaveCount(1);
    await expect(status).toHaveAttribute('aria-live', 'polite');
    await expect(status).toHaveText('');
    await status.evaluate((element) => {
      element.setAttribute('data-persistent-live-status', '');
    });

    await page.getByRole('checkbox', { name: 'Loading' }).check();

    await expect(status).toHaveAttribute('data-persistent-live-status', '');
    await expect(status).toHaveText('Загрузка…');
    await expect(button).toHaveAttribute('aria-disabled', 'true');
    await expect(button).not.toHaveAttribute('aria-busy');
    await button.focus();
    await expect(button).toBeFocused();
    const accessibilityTree = await button.ariaSnapshot();
    expect(accessibilityTree).toContain('button "Create workspace"');
    expect(accessibilityTree).toContain('status');
    expect(accessibilityTree).toContain('Загрузка…');
  });

  test('button group keeps native naming and independent action keyboard order', async ({
    page,
  }) => {
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
    const requestChanges = group.getByRole('button', { name: 'Request changes' });
    const approve = group.getByRole('button', { name: 'Approve' });
    const more = group.getByRole('button', { name: 'More review actions' });

    await expect(group).toHaveCount(1);
    await expect(group).toHaveAttribute('role', 'group');
    await expect(group).toHaveAccessibleName('Review actions');
    await expect(group).toHaveAttribute('aria-label', 'Review actions');
    await expect(group).toHaveAttribute('data-orientation', 'horizontal');
    await expect(group).toHaveAttribute('data-connected', 'true');
    await expect(group).not.toHaveAttribute('aria-orientation');
    await expect(group.locator(':scope > button[krnButton]')).toHaveCount(2);
    await expect(group.locator(':scope > button[krnIconButton]')).toHaveCount(1);

    await requestChanges.focus();
    await expect(requestChanges).toBeFocused();
    await requestChanges.press('ArrowRight');
    await expect(requestChanges).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(approve).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(more).toBeFocused();

    const accessibilityTree = await group.ariaSnapshot();
    expect(accessibilityTree).toContain('group "Review actions"');
    expect(accessibilityTree).toContain('button "Request changes"');
    expect(accessibilityTree).toContain('button "Approve"');
    expect(accessibilityTree).toContain('button "More review actions"');
    expect(accessibilityTree).not.toContain('pressed');
    assertNoRuntimeErrors();
  });

  test('toggle group exposes a labelled toolbar with roving focus and independent activation', async ({
    page,
  }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);
    await page.goto(
      previewUrl({
        component: 'toggle-group',
        args: { multiple: true, orientation: 'horizontal' },
      }),
    );
    await settlePage(page);

    const specimen = page.getByTestId('component-specimen-toggle-group');
    const group = specimen.getByRole('toolbar', { name: 'View mode' });
    const list = group.getByRole('button', { name: 'List' });
    const board = group.getByRole('button', { name: 'Board' });
    const timeline = group.getByRole('button', { name: 'Timeline' });

    await expect(group).toHaveAttribute('aria-label', 'View mode');
    await expect(group).toHaveAttribute('aria-orientation', 'horizontal');
    await expect(group).toHaveAttribute('data-multiple', 'true');
    await expect(list).toHaveAttribute('aria-pressed', 'true');
    await expect(board).toHaveAttribute('aria-pressed', 'false');
    await expect(list).toHaveAttribute('tabindex', '0');
    await expect(board).toHaveAttribute('tabindex', '-1');
    await expect(timeline).toHaveAttribute('tabindex', '-1');

    await list.focus();
    await list.press('ArrowRight');
    await expect(board).toBeFocused();
    await expect(list).toHaveAttribute('aria-pressed', 'true');
    await expect(board).toHaveAttribute('aria-pressed', 'false');

    await board.press('Space');
    await expect(board).toHaveAttribute('aria-pressed', 'true');
    await expect(list).toHaveAttribute('aria-pressed', 'true');

    const accessibilityTree = await group.ariaSnapshot();
    expect(accessibilityTree).toContain('toolbar "View mode"');
    expect(accessibilityTree).toContain('button "List" [pressed]');
    expect(accessibilityTree).toContain('button "Board" [pressed]');

    await page.getByRole('checkbox', { name: 'Disabled' }).check();
    await expect(group).toHaveAttribute('aria-disabled', 'true');
    await expect(list).toBeDisabled();
    await expect(board).toBeDisabled();
    await expect(timeline).toBeDisabled();
    assertNoRuntimeErrors();
  });

  test('copy-button keeps one stable action name and persistent async status', async ({ page }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);
    await page.goto(
      previewUrl({
        component: 'copy-button',
        state: 'idle',
      }),
    );
    await settlePage(page);

    let specimen = page.getByTestId('component-specimen-copy-button');
    let copy = specimen.locator('krn-copy-button');
    let button = copy.getByRole('button', { name: 'Copy install command' });
    let status = copy.locator('.krn-copy-status');

    await expect(copy).toHaveAttribute('data-state', 'idle');
    await expect(copy).toHaveAttribute('data-pending', 'false');
    await expect(button).toHaveAttribute('type', 'button');
    await expect(button).not.toHaveAttribute('aria-busy');
    await expect(status).toHaveAttribute('role', 'status');
    await expect(status).toHaveAttribute('aria-live', 'polite');
    await expect(status).toHaveAttribute('aria-atomic', 'true');
    await expect(status).toHaveText('');
    await status.evaluate((element) => {
      element.setAttribute('data-persistent-copy-status', '');
    });

    await button.focus();
    await button.press('Enter');

    await expect(copy).toHaveAttribute('data-state', 'copied');
    await expect(copy).toHaveAttribute('data-pending', 'false');
    await expect(button).toBeFocused();
    await expect(button).toHaveAccessibleName('Copy install command');
    await expect(status).toHaveAttribute('data-persistent-copy-status', '');
    await expect(status).toHaveText('Copied');
    const copiedTree = await copy.ariaSnapshot();
    expect(copiedTree).toContain('button "Copy install command"');
    expect(copiedTree).toContain('status');
    expect(copiedTree).toContain('Copied');

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
    const pendingTree = await copy.ariaSnapshot();
    expect(pendingTree).toContain('button "Copy install command"');
    expect(pendingTree).toContain('status');
    expect(pendingTree).toContain('Copying…');

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

  test('interactive chart marks remain exposed below a non-atomic chart group', async ({
    page,
  }) => {
    await page.goto(
      previewUrl({
        component: 'line-chart',
        scenario: 'default',
        theme: 'light',
        density: 'comfortable',
        direction: 'ltr',
      }),
    );
    await settlePage(page);

    const specimen = page.getByTestId('component-specimen-line-chart');
    const chart = specimen.locator('svg[role="group"]');
    await expect(chart).toHaveAttribute('aria-label', /Weekly active users/);
    await expect(chart.locator('[role="button"][data-chart-index]')).toHaveCount(6);
    await expect(chart.locator('[role="graphics-symbol"]')).toHaveCount(0);
    await expect(chart.locator('[role="img"]')).toHaveCount(0);

    const accessibilityTree = await chart.ariaSnapshot();
    expect(accessibilityTree).toContain('group');
    expect(accessibilityTree).toContain('button "Mon: 42"');
    expect(accessibilityTree).not.toContain('- img');

    await specimen.getByRole('button', { name: 'View data' }).click();
    await expect(specimen.getByRole('table')).toBeVisible();
    await expect(specimen.locator('caption')).toContainText('Weekly active users');
  });

  test('forced-colors mode preserves focus, async state, chart, and modal operability', async ({
    page,
  }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);
    await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
    await page.goto(
      previewUrl({
        component: 'select',
        state: 'async-loading',
        theme: 'high-contrast',
        density: 'comfortable',
        direction: 'ltr',
      }),
    );
    await settlePage(page);

    expect(await page.evaluate(() => matchMedia('(forced-colors: active)').matches)).toBe(true);
    let specimen = page.getByTestId('component-specimen-select');
    const select = specimen.getByRole('combobox', { name: 'Workspace plan' });
    await select.focus();
    const focusStyle = await specimen.locator('.krn-control-shell').evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        outlineStyle: style.outlineStyle,
        outlineWidth: Number.parseFloat(style.outlineWidth),
      };
    });
    expect(focusStyle.outlineStyle).not.toBe('none');
    expect(focusStyle.outlineWidth).toBeGreaterThanOrEqual(1);
    await select.click();
    await expect(specimen.getByRole('status')).toHaveText('Loading options…');

    await page.goto(
      previewUrl({
        component: 'line-chart',
        scenario: 'states',
        theme: 'high-contrast',
        density: 'comfortable',
        direction: 'ltr',
      }),
    );
    await settlePage(page);
    specimen = page.getByTestId('component-specimen-line-chart');
    const mark = specimen.locator('[role="button"][aria-label="Mon: 42"]');
    await mark.focus();
    await expect(mark).toBeFocused();
    await expect(specimen.getByRole('status')).toContainText('Mon');

    await page.goto(
      previewUrl({
        component: 'dialog',
        scenario: 'default',
        theme: 'high-contrast',
        density: 'comfortable',
        direction: 'ltr',
      }),
    );
    await settlePage(page);
    await page.getByRole('button', { name: 'Edit workspace' }).click();
    const dialog = page.getByRole('dialog', { name: 'Edit workspace' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Close' })).toBeVisible();
    await expectNoPageOverflow(page);
    assertNoRuntimeErrors();
  });
});
