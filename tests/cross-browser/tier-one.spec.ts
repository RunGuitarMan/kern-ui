import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';
import type { Result } from 'axe-core';

import { DOCS_URL, settlePage, watchRuntimeErrors } from '../support/browser';

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
    await expect(gridRegion.getByRole('table')).toBeVisible();
    await expect(gridRegion.getByRole('columnheader', { name: /Workspace/ })).toBeVisible();

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
