import { expect, test, type Locator, type Page } from '@playwright/test';

import { DOCS_URL, settlePage, watchRuntimeErrors } from '../support/browser';

interface Rect {
  readonly height: number;
  readonly width: number;
  readonly x: number;
  readonly y: number;
}

async function openSpecimen(page: Page, id: string): Promise<Locator> {
  await page.goto(`${DOCS_URL}/components/${id}`);
  await settlePage(page);
  const specimen = page.getByTestId(`component-specimen-${id}`);
  await expect(specimen).toBeVisible();
  return specimen;
}

async function rect(locator: Locator): Promise<Rect> {
  return locator.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return {
      height: bounds.height,
      width: bounds.width,
      x: bounds.x + window.scrollX,
      y: bounds.y + window.scrollY,
    };
  });
}

function expectStableRect(before: Rect, after: Rect, label: string): void {
  expect.soft(Math.abs(after.x - before.x), `${label}: x`).toBeLessThanOrEqual(1);
  expect.soft(Math.abs(after.y - before.y), `${label}: y`).toBeLessThanOrEqual(1);
  expect.soft(Math.abs(after.width - before.width), `${label}: width`).toBeLessThanOrEqual(1);
  expect.soft(Math.abs(after.height - before.height), `${label}: height`).toBeLessThanOrEqual(1);
}

test.describe('Round two: documentation and preview contracts', () => {
  test('fragment navigation preserves the active component route and scrolls to its target', async ({
    page,
  }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);
    await openSpecimen(page, 'header');

    await page.locator('.page-nav').getByRole('link', { name: 'API' }).click();
    await expect(page).toHaveURL(`${DOCS_URL}/components/header#specimen-api`);
    await expect(page.locator('#specimen-api')).toBeInViewport();

    await page.goBack();
    await expect(page).toHaveURL(`${DOCS_URL}/components/header`);
    await page.goForward();
    await expect(page).toHaveURL(`${DOCS_URL}/components/header#specimen-api`);

    await page.locator('.page-nav').getByRole('link', { name: 'Example' }).click();
    await expect(page).toHaveURL(`${DOCS_URL}/components/header#specimen-overview`);
    await expect(page.locator('#specimen-overview')).toBeInViewport();

    await page
      .getByTestId('component-specimen-header')
      .getByRole('link', { name: 'Overview' })
      .click();
    await expect(page).toHaveURL(`${DOCS_URL}/components/header#specimen`);
    await expect(page.locator('#specimen')).toBeInViewport();
    const targetTop = (await page.locator('#specimen').boundingBox())?.y ?? 0;
    const pageNavBottom = await page.locator('.page-nav').evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      return bounds.bottom;
    });
    expect(targetTop).toBeGreaterThanOrEqual(pageNavBottom - 1);

    const skipLink = page.getByRole('link', { name: 'Skip to documentation' });
    await skipLink.focus();
    await skipLink.click();
    await expect(page).toHaveURL(`${DOCS_URL}/components/header#docs-main`);
    await expect(page.locator('#docs-main')).toBeFocused();
    assertNoRuntimeErrors();
  });

  test('code blocks follow light, dark, and high-contrast theme tokens', async ({ page }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);
    await openSpecimen(page, 'spacer');
    await page.getByRole('button', { name: 'Code', exact: true }).click();

    const codeBlock = page.locator('#code-panel krn-code-block');
    const themeSnapshot = (): Promise<{
      readonly background: string;
      readonly barBackground: string;
      readonly borderColor: string;
      readonly color: string;
      readonly copyColor: string;
      readonly keywordColor: string;
      readonly shadow: string;
      readonly stringColor: string;
    }> =>
      codeBlock.evaluate((element) => {
        const host = getComputedStyle(element);
        const bar = getComputedStyle(element.querySelector('.bar') as HTMLElement);
        const copy = getComputedStyle(element.querySelector('.bar button') as HTMLElement);
        const keyword = getComputedStyle(element.querySelector('.token-keyword') as HTMLElement);
        const string = getComputedStyle(element.querySelector('.token-string') as HTMLElement);
        return {
          background: host.backgroundColor,
          barBackground: bar.backgroundColor,
          borderColor: host.borderColor,
          color: host.color,
          copyColor: copy.color,
          keywordColor: keyword.color,
          shadow: host.boxShadow,
          stringColor: string.color,
        };
      });

    const light = await themeSnapshot();

    await page.getByRole('button', { name: 'Dark', exact: true }).click();
    await expect(page.locator('#code-panel')).toHaveAttribute('data-krn-theme', 'dark');
    const dark = await themeSnapshot();

    await page.getByTestId('theme-control').selectOption('high-contrast');
    await expect(page.locator('#code-panel')).toHaveAttribute('data-krn-theme', 'high-contrast');
    const highContrast = await themeSnapshot();

    expect(light.background).not.toBe(dark.background);
    expect(light.barBackground).not.toBe(dark.barBackground);
    expect(light.color).not.toBe(dark.color);
    expect(light.keywordColor).not.toBe(dark.keywordColor);
    expect(light.stringColor).not.toBe(dark.stringColor);
    expect(highContrast.shadow).toBe('none');
    expect(highContrast.borderColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(highContrast.copyColor).not.toBe('rgba(0, 0, 0, 0)');
    assertNoRuntimeErrors();
  });

  test('calendar hover, range, and endpoint colors keep a distinct hierarchy', async ({ page }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);
    const snapshot = async (
      theme: 'dark' | 'light',
    ): Promise<{
      readonly endpoint: string;
      readonly hover: string;
      readonly range: string;
    }> => {
      const specimen = await openSpecimen(page, 'date-range-picker');
      await page.getByTestId('theme-control').selectOption(theme);
      await expect(page.getByTestId('specimen-stage')).toHaveAttribute('data-krn-theme', theme);

      await specimen.getByRole('button', { name: 'Reporting period' }).click();
      const dialog = specimen.getByRole('dialog', { name: 'Reporting period' });
      const currentMonthDays = dialog.locator(
        '.krn-calendar__day:not([data-outside="true"]):not(:disabled)',
      );
      await currentMonthDays.nth(8).click();
      await currentMonthDays.nth(12).click();

      const endpoint = dialog.locator('.krn-calendar__day[data-selected="true"]').first();
      const rangeDay = dialog.locator('.krn-calendar__day[data-in-range="true"]').first();
      const hoverDay = dialog
        .locator(
          '.krn-calendar__day:not([data-outside="true"]):not([data-selected="true"]):not([data-in-range="true"]):not(:disabled)',
        )
        .last();
      await hoverDay.hover();
      return {
        endpoint: await endpoint.evaluate((element) => getComputedStyle(element).backgroundColor),
        hover: await hoverDay.evaluate((element) => getComputedStyle(element).backgroundColor),
        range: await rangeDay.evaluate((element) => getComputedStyle(element).backgroundColor),
      };
    };

    const light = await snapshot('light');
    const dark = await snapshot('dark');

    for (const [theme, colors] of Object.entries({ dark, light })) {
      expect(colors.hover, `${theme}: hover is visible`).not.toBe('rgba(0, 0, 0, 0)');
      expect(colors.hover, `${theme}: hover is quieter than an endpoint`).not.toBe(colors.endpoint);
      expect(colors.range, `${theme}: range is distinct from an endpoint`).not.toBe(
        colors.endpoint,
      );
      expect(colors.range, `${theme}: range is distinct from hover`).not.toBe(colors.hover);
    }
    expect(light.hover).not.toBe(dark.hover);
    expect(light.range).not.toBe(dark.range);
    assertNoRuntimeErrors();
  });

  test('standalone calendar keeps a roving tab stop across month navigation', async ({ page }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);
    const specimen = await openSpecimen(page, 'calendar');
    const calendar = specimen.locator('krn-calendar');
    await expect(calendar.locator('[role="gridcell"][tabindex="0"]')).toHaveCount(1);

    const julyThirtyFirst = calendar.locator('[data-date="2026-07-31"]');
    await julyThirtyFirst.focus();
    await julyThirtyFirst.press('PageDown');
    await expect(calendar.getByRole('grid', { name: 'August 2026' })).toBeVisible();
    await expect(calendar.locator('[data-date="2026-08-31"]')).toBeFocused();
    await expect(calendar.locator('[role="gridcell"][tabindex="0"]')).toHaveCount(1);
    assertNoRuntimeErrors();
  });

  test('dropdown overlays remain inside the live preview canvas', async ({ page }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);
    const specimen = await openSpecimen(page, 'dropdown-button');
    const canvas = specimen.locator('.specimen-canvas');
    await specimen.getByRole('button', { name: 'Export' }).click();
    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible();

    const canvasRect = await rect(canvas);
    const menuRect = await rect(menu);
    expect(menuRect.x).toBeGreaterThanOrEqual(canvasRect.x - 1);
    expect(menuRect.x + menuRect.width).toBeLessThanOrEqual(canvasRect.x + canvasRect.width + 1);
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(menu).toBeHidden();
    await expect(specimen.getByRole('button', { name: 'Export' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    assertNoRuntimeErrors();
  });
});

test.describe('Round two: form behavior and geometry', () => {
  test('form-field validation clears for valid input and returns for invalid input', async ({
    page,
  }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);
    const specimen = await openSpecimen(page, 'form-field');
    const input = specimen.getByRole('textbox', { name: /Workspace name/ });
    const shell = specimen.locator('.krn-control-shell');

    await input.fill('Northstar operations');
    await expect(shell).not.toHaveAttribute('data-invalid', 'true');
    await expect(specimen.locator('.krn-message--error')).toHaveCount(0);

    await input.fill('ab');
    await expect(shell).toHaveAttribute('data-invalid', 'true');
    await expect(specimen.locator('.krn-message--error')).toContainText('3–48');

    await input.fill('x'.repeat(49));
    await expect(input).toHaveValue('x'.repeat(49));
    await expect(shell).toHaveAttribute('data-invalid', 'true');
    await expect(specimen.locator('.krn-message--error')).toContainText('3–48');

    await input.fill('Northstar');
    await expect(shell).not.toHaveAttribute('data-invalid', 'true');
    await expect(specimen.locator('.krn-message--error')).toHaveCount(0);
    expect(
      await shell.evaluate((element) =>
        getComputedStyle(element).getPropertyValue('--krn-form-focus-ring-width').trim(),
      ),
    ).toBe('1px');

    await page.evaluate(() => {
      document.documentElement.setAttribute('data-krn-theme', 'high-contrast');
      document.documentElement.setAttribute('data-krn-theme-mode', 'high-contrast');
    });
    expect(
      await shell.evaluate((element) =>
        getComputedStyle(element).getPropertyValue('--krn-form-focus-ring-width').trim(),
      ),
    ).toBe('3px');
    assertNoRuntimeErrors();
  });

  test('textarea, search, number, and label demos expose one deliberate native contract', async ({
    page,
  }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);

    let specimen = await openSpecimen(page, 'textarea');
    const textarea = specimen.getByRole('textbox', { name: 'Change summary' });
    await expect(textarea).toHaveAttribute('maxlength', '280');
    await textarea.pressSequentially('x'.repeat(300));
    await expect(textarea).toHaveValue('x'.repeat(280));

    specimen = await openSpecimen(page, 'search-input');
    const search = specimen.getByRole('searchbox', { name: 'Search workspaces' });
    await search.fill('northstar');
    await expect(specimen.getByRole('button', { name: 'Clear search' })).toHaveCount(1);
    expect(await search.evaluate((element) => getComputedStyle(element).appearance)).toBe('none');

    specimen = await openSpecimen(page, 'number-input');
    const number = specimen.getByRole('spinbutton', { name: 'Seat limit' });
    expect(await number.evaluate((element) => getComputedStyle(element).appearance)).toBe(
      'textfield',
    );
    const increase = specimen.getByRole('button', { name: 'Increase value' });
    await expect(increase).toHaveCount(1);
    await expect(specimen.getByRole('button', { name: 'Decrease value' })).toHaveCount(1);
    const incrementBackground = await increase.evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    );
    await increase.hover();
    expect(
      await increase.evaluate((element) => getComputedStyle(element).backgroundColor),
    ).not.toBe(incrementBackground);
    await increase.click();
    await expect(number).toHaveValue('6');

    specimen = await openSpecimen(page, 'label');
    await expect(specimen.locator('select')).toHaveCount(0);
    const slug = specimen.getByRole('textbox', { name: 'Workspace slug' });
    await specimen.locator('label[for="workspace-slug"]').click();
    await expect(slug).toBeFocused();
    await expect(page.getByRole('listbox')).toHaveCount(0);
    await expect(specimen.locator('.control-contract')).toContainText(
      'does not own a value or popup',
    );
    assertNoRuntimeErrors();
  });

  test('choice-group legends keep a readable gap before their first choice', async ({ page }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);
    for (const id of ['checkbox-group', 'radio', 'radio-group'] as const) {
      const specimen = await openSpecimen(page, id);
      const legend = specimen.locator('legend');
      const firstChoice = specimen.locator('label.krn-choice').first();
      const legendRect = await rect(legend);
      const choiceRect = await rect(firstChoice);
      expect(
        choiceRect.y - (legendRect.y + legendRect.height),
        `${id}: legend-to-choice gap`,
      ).toBeGreaterThanOrEqual(8);
    }
    assertNoRuntimeErrors();
  });

  test('multi-select options do not merge borders and retain stable trigger geometry', async ({
    page,
  }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);
    const specimen = await openSpecimen(page, 'multi-select');
    const trigger = specimen.getByRole('combobox', { name: 'Owners' });
    const triggerBefore = await rect(trigger);

    await trigger.click();
    const listbox = page.getByRole('listbox');
    await listbox.getByRole('option', { name: 'Starter' }).click();
    await listbox.getByRole('option', { name: /Team/ }).click();
    const selected = listbox.locator('[role="option"][aria-selected="true"]');
    await expect(selected).toHaveCount(2);
    const optionRects = await selected.evaluateAll((elements) =>
      elements.map((element) => {
        const bounds = element.getBoundingClientRect();
        return { bottom: bounds.bottom, top: bounds.top };
      }),
    );
    expect((optionRects[1]?.top ?? 0) - (optionRects[0]?.bottom ?? 0)).toBeGreaterThanOrEqual(2);
    expectStableRect(triggerBefore, await rect(trigger), 'multi-select trigger');
    assertNoRuntimeErrors();
  });

  test('single and dual sliders use aligned tracks and independently positioned values', async ({
    page,
  }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);
    let specimen = await openSpecimen(page, 'slider');
    const slider = specimen.locator('krn-slider');
    const singleState = await slider.evaluate((element) => {
      const input = element.querySelector('input[type="range"]') as HTMLInputElement;
      const output = element.querySelector('output');
      const surface = element.querySelector('.krn-slider') as HTMLElement;
      return {
        ariaValueText: input.getAttribute('aria-valuetext'),
        max: Number(input.max),
        min: Number(input.min),
        output: output?.textContent?.trim(),
        progress: getComputedStyle(surface).getPropertyValue('--krn-slider-progress').trim(),
        value: Number(input.value),
      };
    });
    expect(singleState.value).toBe(singleState.min);
    expect(singleState.output).toBe(`${singleState.value}`);
    expect(singleState.ariaValueText).toBe(`${singleState.value}`);
    expect(Number.parseFloat(singleState.progress)).toBeCloseTo(
      ((singleState.value - singleState.min) / (singleState.max - singleState.min)) * 100,
      5,
    );

    specimen = await openSpecimen(page, 'range-slider');
    const range = specimen.locator('krn-range-slider');
    const thumbs = range.locator('input[type="range"]');
    const setValue = async (index: number, value: number): Promise<void> => {
      await thumbs.nth(index).evaluate((element, next) => {
        const input = element as HTMLInputElement;
        input.value = `${next}`;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }, value);
    };
    await setValue(0, 20);
    await setValue(1, 60);
    await expect(thumbs.nth(0)).toHaveValue('20');
    await expect(thumbs.nth(1)).toHaveValue('60');

    const before = await range.evaluate((element) => ({
      end: getComputedStyle(element.querySelector('.krn-range-pair') as HTMLElement)
        .getPropertyValue('--krn-range-end')
        .trim(),
      start: getComputedStyle(element.querySelector('.krn-range-pair') as HTMLElement)
        .getPropertyValue('--krn-range-start')
        .trim(),
    }));
    expect(before).toEqual({ end: '60%', start: '20%' });

    await thumbs.nth(1).focus();
    await thumbs.nth(1).press('ArrowRight');
    await expect(thumbs.nth(0)).toHaveValue('20');
    await expect(thumbs.nth(1)).toHaveValue('65');
    const after = await range.evaluate((element) => ({
      end: getComputedStyle(element.querySelector('.krn-range-pair') as HTMLElement)
        .getPropertyValue('--krn-range-end')
        .trim(),
      start: getComputedStyle(element.querySelector('.krn-range-pair') as HTMLElement)
        .getPropertyValue('--krn-range-start')
        .trim(),
    }));
    expect(after).toEqual({ end: '65%', start: '20%' });

    const rangeSurface = range.locator('.krn-dual-range');
    const rangeBounds = await rect(rangeSurface);
    await rangeSurface.click({
      position: { x: rangeBounds.width * 0.85, y: rangeBounds.height / 2 },
    });
    await expect(thumbs.nth(0)).toHaveValue('20');
    const clickedEnd = Number(await thumbs.nth(1).inputValue());
    expect(clickedEnd).toBeGreaterThan(65);

    await rangeSurface.click({
      position: { x: rangeBounds.width * 0.1, y: rangeBounds.height / 2 },
    });
    await expect.poll(async () => Number(await thumbs.nth(0).inputValue())).toBeLessThan(20);
    await expect(thumbs.nth(1)).toHaveValue(`${clickedEnd}`);

    await rangeSurface.scrollIntoViewIfNeeded();
    const dragBounds = await rangeSurface.boundingBox();
    expect(dragBounds).not.toBeNull();
    if (!dragBounds) return;
    const startBeforeDrag = Number(await thumbs.nth(0).inputValue());
    const endBeforeDrag = Number(await thumbs.nth(1).inputValue());
    const thumbRadius = 9;
    const travel = dragBounds.width - thumbRadius * 2;
    const startX = dragBounds.x + thumbRadius + travel * (startBeforeDrag / 100);
    await page.mouse.move(startX, dragBounds.y + dragBounds.height / 2);
    await page.mouse.down();
    await page.mouse.move(
      dragBounds.x + thumbRadius + travel * 0.35,
      dragBounds.y + dragBounds.height / 2,
      { steps: 6 },
    );
    await page.mouse.up();
    await expect
      .poll(async () => Number(await thumbs.nth(0).inputValue()))
      .toBeGreaterThan(startBeforeDrag);
    await expect(thumbs.nth(1)).toHaveValue(`${endBeforeDrag}`);
    assertNoRuntimeErrors();
  });

  test('combobox opens from both the field and disclosure affordance', async ({ page }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);
    const specimen = await openSpecimen(page, 'combobox');
    const combobox = specimen.getByRole('combobox', { name: 'Workspace plan' });

    await combobox.click();
    await expect(page.getByRole('listbox')).toBeVisible();
    await page.keyboard.press('Escape');

    const disclosure = specimen.getByRole('button', { name: /options|suggestions/i });
    await disclosure.click();
    const listbox = page.getByRole('listbox');
    await expect(listbox).toBeVisible();
    await listbox.getByRole('option', { name: 'Starter' }).click();
    await expect(combobox).toHaveValue('Starter');
    assertNoRuntimeErrors();
  });

  test('verification code rejects letters without trapping deletion or focus', async ({ page }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);
    const specimen = await openSpecimen(page, 'verification-code');
    const input = specimen.getByRole('textbox', {
      name: 'Enter the 6-digit verification code',
    });

    await input.focus();
    await input.press('a');
    await expect(input).toHaveValue('');
    await expect(input).toBeFocused();

    await input.press('8');
    await expect(input).toHaveValue('8');
    await expect(input).toBeFocused();
    await input.press('x');
    await expect(input).toHaveValue('8');
    await expect(input).toBeFocused();

    await input.press('Backspace');
    await expect(input).toBeFocused();
    await expect(input).toHaveValue('');
    await input.pressSequentially('123456');
    await expect(input).toHaveValue('123456');
    assertNoRuntimeErrors();
  });
});

test.describe('Round two: navigation and layout geometry', () => {
  test('header clipping and separator remain visible in both themes', async ({ page }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);
    const specimen = await openSpecimen(page, 'header');
    const surface = specimen.locator('.bounded-surface');
    const header = specimen.locator('krn-header .krn-header');

    const light = await header.evaluate((element) => {
      const style = getComputedStyle(element);
      const surfaceStyle = getComputedStyle(element.closest('.bounded-surface') as HTMLElement);
      return {
        borderBottomColor: style.borderBottomColor,
        boxShadow: style.boxShadow,
        overflow: surfaceStyle.overflow,
        radius: Number.parseFloat(surfaceStyle.borderRadius),
      };
    });
    expect(light.overflow).not.toBe('visible');
    expect(light.radius).toBeGreaterThanOrEqual(6);
    expect(light.boxShadow).not.toBe('none');

    await page.getByRole('button', { name: 'Dark', exact: true }).click();
    const dark = await header.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        borderBottomColor: style.borderBottomColor,
        boxShadow: style.boxShadow,
      };
    });
    expect(dark.borderBottomColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(dark.boxShadow).not.toBe('none');
    assertNoRuntimeErrors();
  });

  test('pagination keeps a fixed token count and stable navigation width', async ({ page }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);
    const specimen = await openSpecimen(page, 'pagination');
    const navigation = specimen.locator('krn-pagination nav');
    const slots = navigation.locator('ol > li');
    const resultRange = specimen.locator('.result-count strong');
    const initialCount = await slots.count();
    const initialRect = await rect(navigation);
    await expect(resultRange).toHaveText('1–20');

    const next = navigation.getByRole('button', { name: 'Next' });
    for (let index = 0; index < 7; index += 1) {
      await next.click();
      expect(await slots.count(), `page ${index + 2}: slot count`).toBe(initialCount);
      expectStableRect(initialRect, await rect(navigation), `pagination page ${index + 2}`);
      await expect(resultRange).toHaveText(`${(index + 1) * 20 + 1}–${(index + 2) * 20}`);
    }

    await page.setViewportSize({ width: 375, height: 812 });
    const mobileCurrentPage = navigation.locator('.mobile-pages [aria-current="page"]');
    await expect(mobileCurrentPage).toBeVisible();
    await expect(mobileCurrentPage).toHaveText('8');
    assertNoRuntimeErrors();
  });

  test('stepper connectors never cross step labels', async ({ page }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);
    const specimen = await openSpecimen(page, 'stepper');
    const intersections = await specimen.locator('krn-stepper .stepper > li').evaluateAll((items) =>
      items.slice(0, -1).map((item) => {
        const itemRect = item.getBoundingClientRect();
        const connector = getComputedStyle(item, '::after');
        const labelRect = (item.querySelector('.label') as HTMLElement).getBoundingClientRect();
        const lineX = itemRect.x + Number.parseFloat(connector.left || connector.insetInlineStart);
        const lineWidth = Number.parseFloat(connector.width);
        const lineY = itemRect.y + Number.parseFloat(connector.top || connector.insetBlockStart);
        return (
          lineY >= labelRect.top &&
          lineY <= labelRect.bottom &&
          lineX < labelRect.right &&
          lineX + lineWidth > labelRect.left
        );
      }),
    );
    expect(intersections).toEqual([false, false]);
    assertNoRuntimeErrors();
  });

  test('menu, tree navigation, and command palette use calm inset active states', async ({
    page,
  }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);

    let specimen = await openSpecimen(page, 'menu');
    const menuTrigger = specimen.getByRole('button', { name: 'Open menu' });
    await menuTrigger.click();
    const panel = page.getByRole('menu', { name: 'Workspace actions' });
    const firstItem = panel.getByRole('menuitem', { name: 'Overview' });
    const panelRect = await rect(panel);
    const itemRect = await rect(firstItem);
    expect(itemRect.x - panelRect.x).toBeGreaterThanOrEqual(4);
    expect(panelRect.x + panelRect.width - (itemRect.x + itemRect.width)).toBeGreaterThanOrEqual(4);
    await page.keyboard.press('Escape');
    await menuTrigger.press('ArrowUp');
    await expect(panel.getByRole('menuitem', { name: 'Reports' })).toBeFocused();

    specimen = await openSpecimen(page, 'tree-navigation');
    const tree = specimen.getByRole('tree');
    const automations = tree.getByRole('treeitem', { name: 'Automations' });
    const overview = tree.getByRole('treeitem', { name: 'Overview' });
    await automations.click();
    const selectedStyle = (item: Locator) =>
      item.evaluate((element) => {
        const row = element.closest('.node-row');
        if (!row) throw new Error('Tree item is missing its visual row.');
        const style = getComputedStyle(row);
        return {
          background: style.backgroundColor,
          radius: style.borderRadius,
          stripeColor: style.borderInlineStartColor,
          stripeStyle: style.borderInlineStartStyle,
          stripeWidth: style.borderInlineStartWidth,
        };
      });
    const automationStyle = await selectedStyle(automations);
    await overview.click();
    const overviewStyle = await selectedStyle(overview);
    expect(overviewStyle).toEqual(automationStyle);
    expect(overviewStyle.stripeStyle).toBe('solid');
    expect(Number.parseFloat(overviewStyle.stripeWidth)).toBeGreaterThan(0);
    expect(overviewStyle.stripeColor).not.toBe('rgba(0, 0, 0, 0)');

    specimen = await openSpecimen(page, 'command-palette');
    const trigger = specimen.getByRole('button', { name: /Open command palette/ });
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'Jump to…' });
    const iconSize = await dialog
      .locator('.search > [aria-hidden="true"]')
      .evaluate((element) => element.getBoundingClientRect().width);
    expect(iconSize).toBeGreaterThanOrEqual(16);
    const weights = await dialog
      .locator('.command-copy strong')
      .evaluateAll((elements) =>
        elements.map((element) => Number.parseInt(getComputedStyle(element).fontWeight, 10)),
      );
    expect(Math.max(...weights)).toBeLessThanOrEqual(600);
    assertNoRuntimeErrors();
  });
});
