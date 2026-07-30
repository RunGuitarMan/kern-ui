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
