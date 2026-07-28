import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Result } from 'axe-core';

import { DOCS_URL, labUrl, settlePage } from '../support/browser';

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

  const labStates = [
    labUrl(),
    labUrl({
      component: 'text-input',
      scenario: 'states',
      theme: 'dark',
      density: 'compact',
      direction: 'rtl',
    }),
    labUrl({
      component: 'alert',
      scenario: 'stress',
      theme: 'high-contrast',
      density: 'spacious',
      direction: 'ltr',
    }),
  ] as const;

  for (const [index, url] of labStates.entries()) {
    test(`Lab state ${index + 1} has no serious automated violations`, async ({
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
});
