import { expect, test, type Locator, type Page } from '@playwright/test';

import { KERN_CATALOG } from '../../projects/showcase/src/lib/catalog';
import { DOCS_URL, settlePage, watchRuntimeErrors } from '../support/browser';

interface ElementRect {
  readonly height: number;
  readonly width: number;
  readonly x: number;
  readonly y: number;
}

interface OverlayStyle {
  readonly backgroundColor: string;
  readonly borderRadius: number;
  readonly borderStyle: string;
  readonly boxShadow: string;
}

async function openSpecimen(page: Page, id: string): Promise<Locator> {
  await page.goto(`${DOCS_URL}/components/${id}`);
  await settlePage(page);
  const specimen = page.getByTestId(`component-specimen-${id}`);
  await expect(specimen).toBeVisible();
  return specimen;
}

async function elementRect(locator: Locator): Promise<ElementRect> {
  return locator.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      height: rect.height,
      width: rect.width,
      x: rect.x + window.scrollX,
      y: rect.y + window.scrollY,
    };
  });
}

function expectStableRect(before: ElementRect, after: ElementRect, label: string): void {
  expect.soft(Math.abs(after.x - before.x), `${label}: x`).toBeLessThanOrEqual(1);
  expect.soft(Math.abs(after.y - before.y), `${label}: y`).toBeLessThanOrEqual(1);
  expect.soft(Math.abs(after.width - before.width), `${label}: width`).toBeLessThanOrEqual(1);
  expect.soft(Math.abs(after.height - before.height), `${label}: height`).toBeLessThanOrEqual(1);
}

async function overlayStyle(locator: Locator): Promise<OverlayStyle> {
  return locator.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      backgroundColor: style.backgroundColor,
      borderRadius: Number.parseFloat(style.borderRadius),
      borderStyle: style.borderStyle,
      boxShadow: style.boxShadow,
    };
  });
}

function expectStyledOverlay(style: OverlayStyle, label: string): void {
  expect(style.backgroundColor, `${label}: opaque surface`).not.toBe('rgba(0, 0, 0, 0)');
  expect(style.borderRadius, `${label}: rounded surface`).toBeGreaterThanOrEqual(6);
  expect(style.borderStyle, `${label}: visible border`).toBe('solid');
  expect(style.boxShadow, `${label}: elevation`).not.toBe('none');
}

function boxShadowLayerCount(value: string): number {
  return value === 'none' ? 0 : value.split(/,(?![^(]*\))/).length;
}

test.describe('Quality regressions: menus and focus treatment', () => {
  test('split and dropdown menus keep their trigger geometry, styling, and keyboard contract', async ({
    page,
  }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);

    for (const config of [
      {
        id: 'split-button',
        root: '.krn-split',
        triggerName: 'More actions',
        firstItem: 'Publish now',
        lastItem: 'Save as draft',
      },
      {
        id: 'dropdown-button',
        root: '.krn-dropdown',
        triggerName: 'Export',
        firstItem: 'CSV spreadsheet',
        lastItem: 'JSON archive',
      },
    ] as const) {
      const specimen = await openSpecimen(page, config.id);
      const host = specimen.locator(`krn-${config.id}`);
      const root = host.locator(config.root);
      const trigger = host.getByRole('button', { name: config.triggerName });
      const rootBefore = await elementRect(root);
      const triggerBefore = await elementRect(trigger);

      await trigger.press('ArrowDown');

      const menu = host.getByRole('menu');
      const firstItem = menu.getByRole('menuitem', { name: config.firstItem });
      const lastItem = menu.getByRole('menuitem', { name: config.lastItem });
      await expect(menu).toBeVisible();
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await expect(firstItem).toBeFocused();

      const rootAfter = await elementRect(root);
      const triggerAfter = await elementRect(trigger);
      const menuRect = await elementRect(menu);
      expectStableRect(rootBefore, rootAfter, `${config.id} root`);
      expectStableRect(triggerBefore, triggerAfter, `${config.id} trigger`);
      expect(menuRect.y, `${config.id}: menu opens below trigger`).toBeGreaterThanOrEqual(
        rootAfter.y + rootAfter.height - 1,
      );
      expect(
        Math.abs(menuRect.x + menuRect.width - (rootAfter.x + rootAfter.width)),
        `${config.id}: menu aligns to the trigger edge`,
      ).toBeLessThanOrEqual(2);
      expectStyledOverlay(await overlayStyle(menu), `${config.id} menu`);

      const itemMetrics = await firstItem.evaluate((element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return {
          display: style.display,
          fontSize: Number.parseFloat(style.fontSize),
          height: rect.height,
          width: rect.width,
        };
      });
      expect(itemMetrics.display).toBe('flex');
      expect(itemMetrics.fontSize).toBeGreaterThanOrEqual(14);
      expect(itemMetrics.height).toBeGreaterThanOrEqual(36);
      expect(itemMetrics.width).toBeGreaterThanOrEqual(menuRect.width - 10);

      await firstItem.press('End');
      await expect(lastItem).toBeFocused();
      await lastItem.press('Escape');
      await expect(menu).toHaveCount(0);
      await expect(trigger).toBeFocused();
    }

    assertNoRuntimeErrors();
  });

  test('user menu stays attached to its trigger and supports roving keyboard focus', async ({
    page,
  }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);
    const specimen = await openSpecimen(page, 'user-menu');
    const host = specimen.locator('krn-user-menu');
    const trigger = host.locator('.trigger');
    const triggerBefore = await elementRect(trigger);

    await trigger.press('ArrowDown');

    const menu = host.getByRole('menu', { name: 'User actions' });
    const profile = menu.getByRole('menuitem', { name: 'Profile' });
    const signOut = menu.getByRole('menuitem', { name: 'Sign out' });
    await expect(menu).toBeVisible();
    await expect(profile).toBeFocused();

    const triggerAfter = await elementRect(trigger);
    const menuRect = await elementRect(menu);
    expectStableRect(triggerBefore, triggerAfter, 'user-menu trigger');
    expect(Math.abs(menuRect.x - triggerAfter.x), 'user-menu left alignment').toBeLessThanOrEqual(
      2,
    );
    expect(menuRect.y, 'user-menu opens below its trigger').toBeGreaterThanOrEqual(
      triggerAfter.y + triggerAfter.height - 1,
    );
    expect(menuRect.width).toBeGreaterThanOrEqual(triggerAfter.width - 1);
    expectStyledOverlay(await overlayStyle(menu), 'user-menu panel');

    await profile.press('End');
    await expect(signOut).toBeFocused();
    await signOut.press('Escape');
    await expect(menu).toHaveCount(0);
    await expect(trigger).toBeFocused();
    assertNoRuntimeErrors();
  });

  test('invalid controls keep one danger focus indicator and tags do not double-ring', async ({
    page,
  }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);
    let specimen = await openSpecimen(page, 'validation-message');
    const invalidShell = specimen.locator('.krn-control-shell');
    const invalidInput = invalidShell.locator('input');
    const invalidRectBefore = await elementRect(invalidInput);
    const dangerBorderBefore = await invalidShell.evaluate(
      (element) => getComputedStyle(element).borderColor,
    );

    await invalidInput.focus();

    const invalidRectAfter = await elementRect(invalidInput);
    const invalidFocus = await invalidShell.evaluate((element) => {
      const shellStyle = getComputedStyle(element);
      const inputStyle = getComputedStyle(element.querySelector('input') as HTMLElement);
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) {
        throw new Error('Canvas color normalization is unavailable.');
      }
      context.fillStyle = shellStyle.borderColor;
      context.fillRect(0, 0, 1, 1);
      const [red = 0, green = 0, blue = 0] = context.getImageData(0, 0, 1, 1).data;
      return {
        borderColor: shellStyle.borderColor,
        borderRgb: { blue, green, red },
        inputBoxShadow: inputStyle.boxShadow,
        inputOutlineWidth: inputStyle.outlineWidth,
        shellBoxShadow: shellStyle.boxShadow,
      };
    });
    expectStableRect(invalidRectBefore, invalidRectAfter, 'invalid input');
    expect(invalidFocus.borderColor).toBe(dangerBorderBefore);
    expect(invalidFocus.inputBoxShadow).toBe('none');
    expect(invalidFocus.inputOutlineWidth).toBe('0px');
    expect(boxShadowLayerCount(invalidFocus.shellBoxShadow)).toBe(1);
    expect(invalidFocus.borderRgb.red, 'danger border has a red-dominant color').toBeGreaterThan(
      Math.max(invalidFocus.borderRgb.green, invalidFocus.borderRgb.blue),
    );

    specimen = await openSpecimen(page, 'tags-input');
    const tagsShell = specimen.locator('.krn-control-shell');
    const tagsInput = tagsShell.locator('input');
    await tagsInput.focus();
    const tagFocus = await tagsShell.evaluate((element) => {
      const shellStyle = getComputedStyle(element);
      const inputStyle = getComputedStyle(element.querySelector('input') as HTMLElement);
      return {
        inputBoxShadow: inputStyle.boxShadow,
        inputOutlineWidth: inputStyle.outlineWidth,
        shellBoxShadow: shellStyle.boxShadow,
      };
    });
    expect(tagFocus.inputBoxShadow).toBe('none');
    expect(tagFocus.inputOutlineWidth).toBe('0px');
    expect(boxShadowLayerCount(tagFocus.shellBoxShadow)).toBe(1);

    await tagsInput.fill('operations');
    await tagsInput.press('Enter');
    await expect(specimen.locator('.krn-token')).toContainText('operations');
    await expect(tagsInput).toBeFocused();
    assertNoRuntimeErrors();
  });
});

test.describe('Quality regressions: form controls', () => {
  test('checkbox values are independent and selected state never changes row geometry', async ({
    page,
  }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);
    const specimen = await openSpecimen(page, 'checkbox-group');
    const labels = specimen.locator('krn-checkbox label.krn-choice');
    const checks = specimen.locator('krn-checkbox input[type="checkbox"]');
    await expect(labels).toHaveCount(3);

    const before = await labels.evaluateAll((elements) =>
      elements.map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          height: rect.height,
          width: rect.width,
          x: rect.x + window.scrollX,
          y: rect.y + window.scrollY,
        };
      }),
    );
    await labels.nth(0).click();
    await expect(checks.nth(0)).toBeChecked();
    await expect(checks.nth(1)).not.toBeChecked();
    await expect(checks.nth(2)).not.toBeChecked();

    let after = await labels.evaluateAll((elements) =>
      elements.map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          height: rect.height,
          width: rect.width,
          x: rect.x + window.scrollX,
          y: rect.y + window.scrollY,
        };
      }),
    );
    before.forEach((rect, index) =>
      expectStableRect(rect, after[index] as ElementRect, `checkbox row ${index + 1}`),
    );

    await labels.nth(1).click();
    await expect(checks.nth(0)).toBeChecked();
    await expect(checks.nth(1)).toBeChecked();
    await expect(checks.nth(2)).not.toBeChecked();
    after = await labels.evaluateAll((elements) =>
      elements.map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          height: rect.height,
          width: rect.width,
          x: rect.x + window.scrollX,
          y: rect.y + window.scrollY,
        };
      }),
    );
    before.forEach((rect, index) =>
      expectStableRect(rect, after[index] as ElementRect, `checkbox row ${index + 1}`),
    );
    assertNoRuntimeErrors();
  });

  test('radio selection is exclusive and leaves vertical and horizontal rows in place', async ({
    page,
  }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);

    for (const id of ['radio', 'radio-group'] as const) {
      const specimen = await openSpecimen(page, id);
      const labels = specimen.locator('krn-radio label.krn-choice');
      const radios = specimen.locator('input[type="radio"]');
      const before = await labels.evaluateAll((elements) =>
        elements.map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            height: rect.height,
            width: rect.width,
            x: rect.x + window.scrollX,
            y: rect.y + window.scrollY,
          };
        }),
      );

      await labels.nth(0).click();
      await expect(radios.nth(0)).toBeChecked();
      await labels.nth(1).click();
      await expect(radios.nth(0)).not.toBeChecked();
      await expect(radios.nth(1)).toBeChecked();

      const after = await labels.evaluateAll((elements) =>
        elements.map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            height: rect.height,
            width: rect.width,
            x: rect.x + window.scrollX,
            y: rect.y + window.scrollY,
          };
        }),
      );
      before.forEach((rect, index) =>
        expectStableRect(rect, after[index] as ElementRect, `${id} row ${index + 1}`),
      );
    }

    assertNoRuntimeErrors();
  });

  test('multi-select keeps a fixed width while selected tokens appear', async ({ page }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);
    const specimen = await openSpecimen(page, 'multi-select');
    const trigger = specimen.getByRole('combobox', { name: 'Owners' });
    const before = await elementRect(trigger);

    await trigger.click();
    const listbox = page.getByRole('listbox');
    await expect(listbox).toBeVisible();
    await listbox.getByRole('option', { name: 'Starter' }).click();
    const afterFirst = await elementRect(trigger);
    expectStableRect(before, afterFirst, 'multi-select after first token');
    await expect(trigger.locator('.krn-token')).toContainText('Starter');

    await listbox.getByRole('option', { name: /Team/ }).click();
    const afterSecond = await elementRect(trigger);
    expectStableRect(before, afterSecond, 'multi-select after second token');
    await expect(trigger.locator('.krn-token')).toHaveCount(2);
    assertNoRuntimeErrors();
  });

  test('range slider uses one track with two independently operable thumbs', async ({ page }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);
    const specimen = await openSpecimen(page, 'range-slider');
    const slider = specimen.locator('krn-range-slider');
    const track = slider.locator('.krn-dual-range__track');
    const thumbs = slider.locator('input[type="range"]');
    await expect(track).toHaveCount(1);
    await expect(thumbs).toHaveCount(2);

    const startRect = await elementRect(thumbs.nth(0));
    const endRect = await elementRect(thumbs.nth(1));
    expectStableRect(startRect, endRect, 'dual range overlays');

    await thumbs.nth(0).focus();
    await thumbs.nth(0).press('ArrowRight');
    await expect(thumbs.nth(0)).toHaveValue('5');
    await expect(thumbs.nth(1)).toHaveValue('100');

    await thumbs.nth(1).focus();
    await thumbs.nth(1).press('ArrowLeft');
    await expect(thumbs.nth(0)).toHaveValue('5');
    await expect(thumbs.nth(1)).toHaveValue('95');
    await expect(slider.locator('output')).toHaveText('5 – 95');

    const selectionRect = await elementRect(slider.locator('.krn-dual-range__selection'));
    expect(selectionRect.width).toBeGreaterThan(0);
    expect(selectionRect.width).toBeLessThan(startRect.width);
    assertNoRuntimeErrors();
  });

  test('segmented control exposes and visibly renders the selected option', async ({ page }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);
    const specimen = await openSpecimen(page, 'segmented-control');
    const board = specimen.getByRole('radio', { name: 'Board' });
    const timeline = specimen.getByRole('radio', { name: 'Timeline' });
    const list = specimen.getByRole('radio', { name: 'List' });

    await board.click();
    await expect(board).toHaveAttribute('aria-checked', 'true');
    await expect(list).toHaveAttribute('aria-checked', 'false');
    const styles = await Promise.all(
      [board, list].map((locator) =>
        locator.evaluate((element) => {
          const style = getComputedStyle(element);
          return {
            backgroundColor: style.backgroundColor,
            boxShadow: style.boxShadow,
            color: style.color,
          };
        }),
      ),
    );
    expect(styles[0]?.backgroundColor).not.toBe(styles[1]?.backgroundColor);
    expect(styles[0]?.color).not.toBe(styles[1]?.color);
    expect(styles[0]?.boxShadow).not.toBe('none');

    await board.press('ArrowRight');
    await expect(timeline).toBeFocused();
    await expect(timeline).toHaveAttribute('aria-checked', 'true');
    assertNoRuntimeErrors();
  });

  test('date and date-range pickers use English, single-calendar custom popovers', async ({
    page,
  }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);
    let specimen = await openSpecimen(page, 'date-picker');
    await expect(specimen.locator('input[type="date"]')).toHaveCount(0);
    const dateTrigger = specimen.getByRole('button', { name: 'Launch date' });
    await dateTrigger.click();
    let dialog = specimen.getByRole('dialog', { name: 'Launch date' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('grid')).toHaveCount(1);
    await expect(dialog.getByRole('columnheader')).toHaveText([
      'Sun',
      'Mon',
      'Tue',
      'Wed',
      'Thu',
      'Fri',
      'Sat',
    ]);
    expectStyledOverlay(await overlayStyle(dialog), 'date picker');
    await dialog
      .locator('.krn-calendar__day:not([data-outside="true"]):not(:disabled)')
      .first()
      .click();
    await expect(dialog).toHaveCount(0);
    await expect(dateTrigger).not.toContainText('Select a date');

    specimen = await openSpecimen(page, 'date-range-picker');
    await expect(specimen.locator('input[type="date"]')).toHaveCount(0);
    const rangeTrigger = specimen.getByRole('button', { name: 'Reporting period' });
    await rangeTrigger.click();
    dialog = specimen.getByRole('dialog', { name: 'Reporting period' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('grid')).toHaveCount(1);
    await expect(dialog.getByRole('columnheader')).toHaveText([
      'Sun',
      'Mon',
      'Tue',
      'Wed',
      'Thu',
      'Fri',
      'Sat',
    ]);
    const currentMonthDays = dialog.locator(
      '.krn-calendar__day:not([data-outside="true"]):not(:disabled)',
    );
    await currentMonthDays.nth(8).click();
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Now choose an end date');
    await currentMonthDays.nth(12).click();
    await expect(dialog.locator('[data-range-start="true"]')).toHaveCount(1);
    await expect(dialog.locator('[data-range-end="true"]')).toHaveCount(1);
    await expect(dialog.locator('[data-in-range="true"]')).not.toHaveCount(0);
    await expect(rangeTrigger.locator('.krn-date-range__separator')).toHaveText('→');
    await dialog.getByRole('button', { name: 'Done' }).click();
    await expect(dialog).toHaveCount(0);
    assertNoRuntimeErrors();
  });

  test('time and color pickers expose styled custom controls instead of native popovers', async ({
    page,
  }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);
    let specimen = await openSpecimen(page, 'time-picker');
    await expect(specimen.locator('input[type="time"]')).toHaveCount(0);
    const timeTrigger = specimen.getByRole('button', { name: 'Digest time' });
    await timeTrigger.click();
    let dialog = specimen.getByRole('dialog', { name: 'Digest time' });
    await expect(dialog).toBeVisible();
    expectStyledOverlay(await overlayStyle(dialog), 'time picker');
    const hours = dialog.getByRole('listbox', { name: 'Hour' });
    const minutes = dialog.getByRole('listbox', { name: 'Minute' });
    await expect(hours.getByRole('option')).toHaveCount(24);
    await expect(minutes.getByRole('option')).toHaveCount(4);
    await hours.getByRole('option', { name: '09', exact: true }).click();
    await minutes.getByRole('option', { name: '30', exact: true }).click();
    await expect(timeTrigger).toContainText('09:30');
    await dialog.getByRole('button', { name: 'Done' }).click();
    await expect(dialog).toHaveCount(0);

    specimen = await openSpecimen(page, 'color-picker');
    await expect(specimen.locator('input[type="color"]')).toHaveCount(0);
    const colorTrigger = specimen.getByRole('button', { name: 'Choose brand accent' });
    await colorTrigger.click();
    dialog = specimen.getByRole('dialog', { name: 'Choose brand accent' });
    await expect(dialog).toBeVisible();
    expectStyledOverlay(await overlayStyle(dialog), 'color picker');
    await expect(dialog.getByRole('button', { name: /^Use color / })).toHaveCount(8);
    await expect(dialog.getByRole('slider', { name: 'Hue' })).toBeVisible();
    await expect(dialog.getByRole('slider', { name: 'Saturation' })).toBeVisible();
    await dialog.getByRole('button', { name: 'Use color #c43d55' }).click();
    await expect(colorTrigger).toContainText('#C43D55');
    await dialog.getByRole('button', { name: 'Done' }).click();
    await expect(dialog).toHaveCount(0);
    assertNoRuntimeErrors();
  });
});

test.describe('Quality regressions: data and feedback', () => {
  test('code blocks render multiple syntax token classes with distinct colors', async ({
    page,
  }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);
    const specimen = await openSpecimen(page, 'code-block');
    const tokens = specimen.locator('krn-code-block code .token');
    await expect(tokens).not.toHaveCount(0);
    const tokenSnapshot = await tokens.evaluateAll((elements) => ({
      colors: [...new Set(elements.map((element) => getComputedStyle(element).color))],
      kinds: [
        ...new Set(
          elements.flatMap((element) =>
            [...element.classList]
              .filter((className) => className.startsWith('token-') && className !== 'token-plain')
              .map((className) => className.slice('token-'.length)),
          ),
        ),
      ],
    }));
    expect(tokenSnapshot.kinds).toEqual(
      expect.arrayContaining(['decorator', 'keyword', 'string', 'type']),
    );
    expect(tokenSnapshot.kinds.length).toBeGreaterThanOrEqual(5);
    expect(tokenSnapshot.colors.length).toBeGreaterThanOrEqual(4);
    await expect(specimen.locator('krn-code-block code')).toContainText(
      "import { KrnButton } from '@kern-ui/angular';",
    );
    assertNoRuntimeErrors();
  });

  test('line, bar, and donut charts reveal the active datum on hover and keyboard focus', async ({
    page,
  }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);

    for (const id of ['line-chart', 'bar-chart', 'donut-chart'] as const) {
      const specimen = await openSpecimen(page, id);
      const marks = specimen.locator('[role="graphics-symbol"]');
      await expect(marks).not.toHaveCount(0);
      await marks.nth(0).hover();
      let tooltip = specimen.locator('.chart-tooltip');
      await expect(tooltip).toBeVisible();
      await expect(tooltip).toContainText('Mon');
      await expect(tooltip).toContainText('42');

      await marks.nth(1).focus();
      tooltip = specimen.locator('.chart-tooltip');
      await expect(marks.nth(1)).toHaveAttribute('data-active', '');
      await expect(tooltip).toContainText('Tue');
      await expect(tooltip).toContainText('56');
      await marks.nth(1).blur();
      await expect(tooltip).toHaveCount(0);
    }

    assertNoRuntimeErrors();
  });

  test('duplicate toasts group into a bounded stack and Clear all removes the batch', async ({
    page,
  }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);
    const specimen = await openSpecimen(page, 'toast');
    const showToast = specimen.getByRole('button', { name: 'Show success toast' });

    for (let index = 0; index < 12; index += 1) {
      await showToast.click();
    }

    const viewport = page.locator('krn-toast-viewport');
    const renderedToasts = viewport.locator('.toast');
    await expect(renderedToasts).toHaveCount(1);
    await expect(viewport.locator('.count')).toHaveText('×12');
    await expect(viewport.locator('.count')).toHaveAttribute(
      'aria-label',
      '12 identical notifications',
    );
    await expect(viewport.locator('.stack-controls')).toContainText('12 notifications');
    expect(
      await renderedToasts.count(),
      'rendered toast groups remain bounded',
    ).toBeLessThanOrEqual(4);

    await viewport.getByRole('button', { name: 'Clear all' }).click();
    await expect(renderedToasts).toHaveCount(0);
    await expect(viewport.locator('.stack-controls')).toHaveCount(0);
    assertNoRuntimeErrors();
  });
});

test.describe('Cross-catalog focus geometry audit', () => {
  test('visible enabled controls never shift or create overflow when focused', async ({ page }) => {
    test.setTimeout(300_000);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });

    let activeRoute = 'bootstrap';
    const runtimeErrors: string[] = [];
    page.on('pageerror', (error) => runtimeErrors.push(`[${activeRoute}] ${error.message}`));
    page.on('console', (message) => {
      if (message.type() === 'error') {
        runtimeErrors.push(`[${activeRoute}] ${message.text()}`);
      }
    });

    const failures: string[] = [];
    for (const item of KERN_CATALOG) {
      activeRoute = item.id;
      const errorsBeforeRoute = runtimeErrors.length;
      await page.goto(`${DOCS_URL}/components/${item.id}`, { waitUntil: 'domcontentloaded' });
      await page
        .getByTestId(`component-specimen-${item.id}`)
        .waitFor({ state: 'visible', timeout: 10_000 });

      const result = await page
        .getByTestId(`component-specimen-${item.id}`)
        .evaluate((specimen) => {
          const selector =
            'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';
          const controls = [...specimen.querySelectorAll<HTMLElement>(selector)];
          const shifts: string[] = [];

          for (const [index, control] of controls.entries()) {
            const style = getComputedStyle(control);
            const before = control.getBoundingClientRect();
            const intentionallyExcluded = Boolean(
              control.closest(
                'krn-skip-link, .skip-link, [role="graphics-symbol"], .krn-choice__native, .krn-upload__input',
              ),
            );
            const disabled =
              control.matches(':disabled') || control.getAttribute('aria-disabled') === 'true';
            const visible =
              !intentionallyExcluded &&
              !disabled &&
              control.tabIndex >= 0 &&
              style.display !== 'none' &&
              style.visibility !== 'hidden' &&
              before.width > 1 &&
              before.height > 1 &&
              control.getClientRects().length > 0;
            if (!visible) continue;

            control.focus({ preventScroll: true });
            const after = control.getBoundingClientRect();
            const deltas = {
              height: Math.abs(after.height - before.height),
              width: Math.abs(after.width - before.width),
              x: Math.abs(after.x - before.x),
              y: Math.abs(after.y - before.y),
            };
            if (Object.values(deltas).some((delta) => delta > 1)) {
              const name =
                control.getAttribute('aria-label') ||
                control.textContent?.trim().replace(/\s+/g, ' ').slice(0, 60) ||
                `${control.tagName.toLowerCase()}[${index}]`;
              shifts.push(`${name}: ${JSON.stringify(deltas)}`);
            }
            control.blur();
          }

          const root = document.documentElement;
          return {
            horizontalOverflow:
              Math.max(root.scrollWidth, document.body.scrollWidth) - root.clientWidth,
            shifts,
          };
        });

      if (result.horizontalOverflow > 2) {
        failures.push(`${item.id}: horizontal overflow ${result.horizontalOverflow}px`);
      }
      result.shifts.forEach((shift) => failures.push(`${item.id}: ${shift}`));
      runtimeErrors
        .slice(errorsBeforeRoute)
        .forEach((error) => failures.push(`${item.id}: runtime error ${error}`));
    }

    expect(failures, failures.join('\n')).toEqual([]);
    expect(runtimeErrors, runtimeErrors.join('\n')).toEqual([]);
  });
});
