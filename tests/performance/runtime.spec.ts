import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { expect, test, type Locator, type Page } from '@playwright/test';
import { previewUrl, settlePage, watchRuntimeErrors } from '../support/browser';

interface RuntimeBudgets {
  readonly coldRouteMs: number;
  readonly interactionMs: number;
  readonly gridScrollFrameP95Ms: number;
  readonly formInputFrameP95Ms: number;
  readonly retainedHeapBytes: number;
  readonly gridRenderedRows: number;
  readonly gridDomNodes: number;
  readonly formDomNodes: number;
}

const budgets = JSON.parse(
  readFileSync(resolve(process.cwd(), 'tests/performance/budgets.json'), 'utf8'),
) as RuntimeBudgets;

function percentile95(samples: readonly number[]): number {
  const ordered = [...samples].sort((left, right) => left - right);
  return ordered[Math.max(0, Math.ceil(ordered.length * 0.95) - 1)] ?? 0;
}

async function chromiumRuntimeSnapshot(page: Page): Promise<{
  readonly heapBytes: number;
  readonly nodes: number;
  readonly documents: number;
  readonly eventListeners: number;
  readonly liveNodes: number;
}> {
  const session = await page.context().newCDPSession(page);
  try {
    await session.send('Performance.enable');
    await session.send('HeapProfiler.enable');
    await session.send('HeapProfiler.collectGarbage');
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        }),
    );
    const liveNodes = await page.evaluate(
      () => document.documentElement.getElementsByTagName('*').length + 1,
    );
    await session.send('HeapProfiler.collectGarbage');

    const [performanceMetrics, domCounters] = await Promise.all([
      session.send('Performance.getMetrics'),
      session.send('Memory.getDOMCounters'),
    ]);
    const values = new Map(performanceMetrics.metrics.map((metric) => [metric.name, metric.value]));
    return {
      heapBytes: values.get('JSHeapUsedSize') ?? 0,
      nodes: domCounters.nodes,
      documents: domCounters.documents,
      eventListeners: domCounters.jsEventListeners,
      liveNodes,
    };
  } finally {
    await session.detach();
  }
}

async function openFixture(
  page: Page,
  component: string,
  scenario: 'default' | 'stress' | 'virtual',
): Promise<number> {
  const started = Date.now();
  await page.goto(previewUrl({ component, scenario }), { waitUntil: 'domcontentloaded' });
  await page.getByTestId(`component-specimen-${component}`).waitFor();
  await settlePage(page);
  return Date.now() - started;
}

async function exerciseDialog(fixture: Locator, cycles: number): Promise<number> {
  return fixture.evaluate(async (root, cycleCount) => {
    const trigger = root.querySelector<HTMLButtonElement>('.feedback-trigger button');
    if (!trigger) throw new Error('Dialog fixture trigger is missing.');

    const waitForDialogState = async (open: boolean): Promise<void> => {
      for (let frame = 0; frame < 30; frame += 1) {
        const dialog = root.querySelector('krn-dialog [aria-modal="true"]');
        if (Boolean(dialog) === open) return;
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      }
      throw new Error(`Dialog fixture did not become ${open ? 'open' : 'closed'}.`);
    };

    const started = performance.now();
    for (let index = 0; index < cycleCount; index += 1) {
      trigger.click();
      await waitForDialogState(true);
      const save = [...root.querySelectorAll<HTMLButtonElement>('krn-dialog footer button')].find(
        (button) => button.textContent?.trim() === 'Save',
      );
      if (!save) throw new Error('Dialog fixture Save action is missing.');
      save.click();
      await waitForDialogState(false);
    }
    return performance.now() - started;
  }, cycles);
}

test.describe('enterprise runtime budgets', () => {
  test('virtual Data Grid keeps a 10k-row source and scroll frames within budgets', async ({
    page,
  }, testInfo) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);
    const mountMs = await openFixture(page, 'data-grid', 'virtual');
    const metrics = await page
      .getByTestId('component-specimen-data-grid')
      .evaluate(async (fixture) => {
        const viewport = fixture.querySelector<HTMLElement>('cdk-virtual-scroll-viewport');
        const frameSamples: number[] = [];
        if (viewport) {
          for (let index = 1; index <= 12; index += 1) {
            const started = performance.now();
            viewport.scrollTop = index * 4_000;
            viewport.dispatchEvent(new Event('scroll'));
            await new Promise<void>((resolve) => {
              requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
            });
            frameSamples.push(performance.now() - started);
          }
        }
        return {
          nodes: fixture.querySelectorAll('*').length,
          renderedRows: fixture.querySelectorAll('[role="row"]').length,
          ariaRowCount: Number(
            fixture.querySelector('[role="grid"]')?.getAttribute('aria-rowcount'),
          ),
          frameSamples,
        };
      });
    const result = { ...metrics, mountMs, scrollFrameP95Ms: percentile95(metrics.frameSamples) };
    await testInfo.attach('data-grid-runtime-metrics.json', {
      body: Buffer.from(JSON.stringify(result, null, 2)),
      contentType: 'application/json',
    });

    expect(mountMs).toBeLessThan(budgets.coldRouteMs);
    expect(metrics.ariaRowCount).toBe(10_001);
    expect(metrics.renderedRows).toBeLessThan(budgets.gridRenderedRows);
    expect(metrics.nodes).toBeLessThan(budgets.gridDomNodes);
    expect(result.scrollFrameP95Ms).toBeLessThan(budgets.gridScrollFrameP95Ms);
    assertNoRuntimeErrors();
  });

  test('Tree mounts 500 stable nodes without runaway DOM growth', async ({ page }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);
    const mountMs = await openFixture(page, 'tree', 'stress');
    const fixture = page.getByTestId('component-specimen-tree');

    await expect(fixture.locator('[role="treeitem"]')).toHaveCount(500);
    expect(mountMs).toBeLessThan(budgets.coldRouteMs);
    expect(await fixture.locator('*').count()).toBeLessThan(2_200);
    assertNoRuntimeErrors();
  });

  test('Select exposes the documented 1k-option stress envelope predictably', async ({ page }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);
    await openFixture(page, 'select', 'stress');
    const fixture = page.getByTestId('component-specimen-select');
    const started = Date.now();

    await fixture.locator('.krn-select-trigger').click();
    await expect(fixture.locator('[role="option"]')).toHaveCount(1_000);
    expect(Date.now() - started).toBeLessThan(budgets.interactionMs);
    expect(await fixture.locator('*').count()).toBeLessThan(4_500);
    assertNoRuntimeErrors();
  });

  test('Chart keyboard marks stay bounded at the 120-point analytics envelope', async ({
    page,
  }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);
    const mountMs = await openFixture(page, 'line-chart', 'stress');
    const fixture = page.getByTestId('component-specimen-line-chart');

    await expect(fixture.locator('[role="button"][data-chart-index]')).toHaveCount(120);
    expect(mountMs).toBeLessThan(budgets.coldRouteMs);
    expect(await fixture.locator('*').count()).toBeLessThan(1_800);
    assertNoRuntimeErrors();
  });

  test('large typed-form primitives update within frame and DOM budgets', async ({
    page,
  }, testInfo) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);
    const mountMs = await openFixture(page, 'form-field', 'stress');
    const fixture = page.getByTestId('component-specimen-form-field');
    const metrics = await fixture.evaluate(async (root) => {
      const inputs = [...root.querySelectorAll<HTMLInputElement>('input')];
      const frameSamples: number[] = [];
      for (const [index, input] of inputs.slice(0, 20).entries()) {
        const started = performance.now();
        input.value = `Enterprise value ${index + 1}`;
        input.dispatchEvent(new InputEvent('input', { bubbles: true, data: input.value }));
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        });
        frameSamples.push(performance.now() - started);
      }
      return {
        inputs: inputs.length,
        nodes: root.querySelectorAll('*').length,
        frameSamples,
      };
    });
    const result = {
      ...metrics,
      mountMs,
      inputFrameP95Ms: percentile95(metrics.frameSamples),
    };
    await testInfo.attach('large-form-runtime-metrics.json', {
      body: Buffer.from(JSON.stringify(result, null, 2)),
      contentType: 'application/json',
    });

    expect(mountMs).toBeLessThan(budgets.coldRouteMs);
    expect(metrics.inputs).toBe(200);
    expect(metrics.nodes).toBeLessThan(budgets.formDomNodes);
    expect(result.inputFrameP95Ms).toBeLessThan(budgets.formInputFrameP95Ms);
    assertNoRuntimeErrors();
  });

  test('Dialog repeated open/close cycles do not retain modal layers or heap', async ({
    page,
  }, testInfo) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);
    await openFixture(page, 'dialog', 'default');
    const fixture = page.getByTestId('component-specimen-dialog');
    await exerciseDialog(fixture, 1);
    const before = await chromiumRuntimeSnapshot(page);
    const durationMs = await exerciseDialog(fixture, 12);
    const after = await chromiumRuntimeSnapshot(page);
    const result = {
      durationMs,
      retainedHeapBytes: Math.max(0, after.heapBytes - before.heapBytes),
      retainedNodes: Math.max(0, after.nodes - before.nodes),
      retainedDocuments: Math.max(0, after.documents - before.documents),
      retainedEventListeners: Math.max(0, after.eventListeners - before.eventListeners),
      retainedLiveNodes: Math.max(0, after.liveNodes - before.liveNodes),
      before,
      after,
    };
    await testInfo.attach('dialog-retention-metrics.json', {
      body: Buffer.from(JSON.stringify(result, null, 2)),
      contentType: 'application/json',
    });

    expect(result.durationMs).toBeLessThan(budgets.interactionMs * 4);
    expect(await page.locator('[aria-modal="true"]:visible').count()).toBe(0);
    await expect(fixture.locator('krn-dialog .backdrop[data-state="closed"]')).toHaveAttribute(
      'hidden',
      '',
    );
    await expect(fixture.locator('krn-dialog .surface')).not.toHaveAttribute('aria-modal', 'true');
    expect(result.retainedHeapBytes).toBeLessThan(budgets.retainedHeapBytes);
    expect(result.retainedDocuments).toBe(0);
    expect(result.retainedEventListeners).toBe(0);
    expect(result.retainedLiveNodes).toBe(0);
    expect(
      result.retainedNodes,
      `Dialog retention metrics:\n${JSON.stringify(result, null, 2)}`,
    ).toBeLessThan(200);
    assertNoRuntimeErrors();
  });
});
