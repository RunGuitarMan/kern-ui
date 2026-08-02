import { expect, test, type Locator, type Page } from '@playwright/test';

import { KERN_CATALOG } from '../../projects/showcase/src/lib/catalog';
import {
  DOCS_URL,
  expectNoPageOverflow,
  previewUrl,
  settlePage,
  watchRuntimeErrors,
} from '../support/browser';

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

async function expectNoHorizontalOverflow(locator: Locator, label: string): Promise<void> {
  const overflow = await locator.evaluate((element) => element.scrollWidth - element.clientWidth);
  expect(overflow, `${label} overflowed horizontally by ${overflow}px`).toBeLessThanOrEqual(1);
}

test.describe('Quality regressions: layout primitives', () => {
  test('divider keeps physical orientation and a visible standalone vertical line', async ({
    page,
  }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);
    const specimen = await openSpecimen(page, 'divider');
    await specimen.locator('.divider-demo').evaluate((element) => {
      (element as HTMLElement).style.writingMode = 'vertical-rl';
    });

    const horizontal = specimen.locator('krn-divider[data-orientation="horizontal"]');
    const vertical = specimen.locator('krn-divider[data-orientation="vertical"]');
    const horizontalSeparator = horizontal.locator('[role="separator"]');
    const verticalSeparator = vertical.locator('[role="separator"]');
    const verticalLine = vertical.locator('.krn-divider__line').first();
    await vertical.locator('.krn-divider__label').evaluate((element) => element.remove());
    await vertical
      .locator('.krn-divider__line')
      .nth(1)
      .evaluate((element) => element.remove());

    await expect(horizontalSeparator).toHaveAttribute('aria-orientation', 'horizontal');
    await expect(verticalSeparator).toHaveAttribute('aria-orientation', 'vertical');
    const horizontalRect = await elementRect(horizontalSeparator);
    const verticalRect = await elementRect(verticalSeparator);
    const verticalLineRect = await elementRect(verticalLine);
    expect(horizontalRect.width).toBeGreaterThan(horizontalRect.height);
    expect(verticalRect.height).toBeGreaterThan(verticalRect.width);
    expect(verticalLineRect.height).toBeGreaterThan(verticalLineRect.width);
    expect(verticalLineRect.height).toBeGreaterThan(0);

    assertNoRuntimeErrors();
  });
});

test.describe('Quality regressions: menus and focus treatment', () => {
  test('button keeps its geometry while its loading overlay is active', async ({ page }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);

    await page.goto(`${DOCS_URL}/components/button?arg.loading=false`);
    await settlePage(page);
    let specimen = page.getByTestId('component-specimen-button');
    let button = specimen.locator('button[krnButton]').first();
    await expect(button).toHaveAttribute('data-loading', 'false');
    const before = await elementRect(button);

    await page.goto(`${DOCS_URL}/components/button?arg.loading=true`);
    await settlePage(page);
    specimen = page.getByTestId('component-specimen-button');
    button = specimen.locator('button[krnButton]').first();
    await expect(button).toHaveAttribute('data-loading', 'true');
    expectStableRect(before, await elementRect(button), 'button loading state');

    assertNoRuntimeErrors();
  });

  test('icon button stays square and stable while loading', async ({ page }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);

    await page.goto(
      previewUrl({
        component: 'icon-button',
        args: { loading: false },
      }),
    );
    await settlePage(page);
    let specimen = page.getByTestId('component-specimen-icon-button');
    let button = specimen.locator('button[krnIconButton]').first();
    await expect(button).toHaveAttribute('data-loading', 'false');
    const before = await elementRect(button);
    expect(
      Math.abs(before.width - before.height),
      'resting icon button is square',
    ).toBeLessThanOrEqual(1);
    await button.evaluate((element) => {
      const probe = document.createElement('div');
      probe.style.display = 'flex';
      probe.style.inlineSize = '1px';
      element.parentElement?.insertBefore(probe, element);
      probe.append(element);
    });
    const constrained = await elementRect(button);
    expect(
      Math.abs(constrained.width - before.width),
      'icon button resists flex shrinking',
    ).toBeLessThanOrEqual(1);
    expect(
      Math.abs(constrained.width - constrained.height),
      'constrained icon button stays square',
    ).toBeLessThanOrEqual(1);

    await page.goto(
      previewUrl({
        component: 'icon-button',
        args: { loading: true },
      }),
    );
    await settlePage(page);
    specimen = page.getByTestId('component-specimen-icon-button');
    button = specimen.locator('button[krnIconButton]').first();
    await expect(button).toHaveAttribute('data-loading', 'true');
    const after = await elementRect(button);
    expectStableRect(before, after, 'icon-button loading state');
    expect(
      Math.abs(after.width - after.height),
      'loading icon button is square',
    ).toBeLessThanOrEqual(1);

    assertNoRuntimeErrors();
  });

  test('button group preserves separated spacing and connected geometry in both axes', async ({
    page,
  }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);
    const openButtonGroup = async (
      connected: boolean,
      orientation: 'horizontal' | 'vertical',
    ): Promise<{ actions: Locator; group: Locator }> => {
      await page.goto(
        previewUrl({
          component: 'button-group',
          args: { connected, orientation },
        }),
      );
      await settlePage(page);

      const specimen = page.getByTestId('component-specimen-button-group');
      const group = specimen.locator('div[krnButtonGroup]');
      const actions = group.locator(':scope > button[krnButton], :scope > button[krnIconButton]');
      if (connected) {
        await expect(group).toHaveAttribute('data-connected', 'true');
      } else {
        await expect(group).not.toHaveAttribute('data-connected');
      }
      await expect(group).toHaveAttribute('data-orientation', orientation);
      await expect(actions).toHaveCount(3);
      return { actions, group };
    };
    const adjacentOffsets = async (
      actions: Locator,
      orientation: 'horizontal' | 'vertical',
    ): Promise<number[]> =>
      actions.evaluateAll(
        (elements, axis) =>
          elements.slice(0, -1).map((element, index) => {
            const current = element.getBoundingClientRect();
            const next = elements[index + 1]?.getBoundingClientRect();
            if (!next) {
              throw new Error('Expected an adjacent button-group action.');
            }

            return axis === 'horizontal' ? next.left - current.right : next.top - current.bottom;
          }),
        orientation,
      );
    const logicalRadii = async (
      action: Locator,
    ): Promise<{
      endEnd: number;
      endStart: number;
      startEnd: number;
      startStart: number;
    }> =>
      action.evaluate((element) => {
        const style = getComputedStyle(element);
        const radius = (property: string): number =>
          Number.parseFloat(style.getPropertyValue(property)) || 0;

        return {
          endEnd: radius('border-end-end-radius'),
          endStart: radius('border-end-start-radius'),
          startEnd: radius('border-start-end-radius'),
          startStart: radius('border-start-start-radius'),
        };
      });

    let state = await openButtonGroup(false, 'horizontal');
    for (const gap of await adjacentOffsets(state.actions, 'horizontal')) {
      expect(gap, 'separated actions retain token spacing').toBeGreaterThan(1);
    }

    state = await openButtonGroup(true, 'horizontal');
    for (const gap of await adjacentOffsets(state.actions, 'horizontal')) {
      expect(gap, 'connected horizontal actions have no visible gap').toBeGreaterThanOrEqual(-2);
      expect(gap, 'connected horizontal actions have no visible gap').toBeLessThanOrEqual(0.5);
    }

    const horizontalFirst = await logicalRadii(state.actions.first());
    const horizontalMiddle = await logicalRadii(state.actions.nth(1));
    const horizontalLast = await logicalRadii(state.actions.last());
    expect(horizontalFirst.startStart).toBeGreaterThan(0);
    expect(horizontalFirst.endStart).toBeGreaterThan(0);
    expect(horizontalFirst.startEnd).toBe(0);
    expect(horizontalFirst.endEnd).toBe(0);
    expect(Object.values(horizontalMiddle)).toEqual([0, 0, 0, 0]);
    expect(horizontalLast.startStart).toBe(0);
    expect(horizontalLast.endStart).toBe(0);
    expect(horizontalLast.startEnd).toBeGreaterThan(0);
    expect(horizontalLast.endEnd).toBeGreaterThan(0);

    const requestChanges = state.group.getByRole('button', { name: 'Request changes' });
    const approve = state.group.getByRole('button', { name: 'Approve' });
    await requestChanges.focus();
    await page.keyboard.press('Tab');
    await expect(approve).toBeFocused();
    const focusTreatment = await approve.evaluate((element) => {
      const action = getComputedStyle(element);
      const group = getComputedStyle(element.parentElement as HTMLElement);
      const siblingZIndices = [...(element.parentElement?.children ?? [])]
        .filter((sibling) => sibling !== element)
        .map((sibling) => Number.parseInt(getComputedStyle(sibling).zIndex, 10) || 0);

      return {
        boxShadow: action.boxShadow,
        focusedZIndex: Number.parseInt(action.zIndex, 10) || 0,
        groupOverflowX: group.overflowX,
        groupOverflowY: group.overflowY,
        outlineStyle: action.outlineStyle,
        siblingZIndices,
      };
    });
    expect(focusTreatment.boxShadow).not.toBe('none');
    expect(focusTreatment.outlineStyle).not.toBe('none');
    expect(focusTreatment.groupOverflowX).not.toMatch(/hidden|clip/);
    expect(focusTreatment.groupOverflowY).not.toMatch(/hidden|clip/);
    expect(focusTreatment.focusedZIndex).toBeGreaterThan(
      Math.max(...focusTreatment.siblingZIndices),
    );
    const horizontalIcon = state.group.getByRole('button', { name: 'More review actions' });
    const horizontalIconRect = await elementRect(horizontalIcon);
    expect(
      Math.abs(horizontalIconRect.width - horizontalIconRect.height),
      'horizontally grouped icon action remains square',
    ).toBeLessThanOrEqual(1);

    state = await openButtonGroup(true, 'vertical');
    for (const gap of await adjacentOffsets(state.actions, 'vertical')) {
      expect(gap, 'connected vertical actions have no visible gap').toBeGreaterThanOrEqual(-2);
      expect(gap, 'connected vertical actions have no visible gap').toBeLessThanOrEqual(0.5);
    }

    const verticalFirst = await logicalRadii(state.actions.first());
    const verticalLast = await logicalRadii(state.actions.last());
    expect(verticalFirst.startStart).toBeGreaterThan(0);
    expect(verticalFirst.startEnd).toBeGreaterThan(0);
    expect(verticalFirst.endStart).toBe(0);
    expect(verticalFirst.endEnd).toBe(0);
    expect(verticalLast.startStart).toBe(0);
    expect(verticalLast.startEnd).toBe(0);
    expect(verticalLast.endStart).toBeGreaterThan(0);
    expect(verticalLast.endEnd).toBeGreaterThan(0);
    const verticalIcon = state.group.getByRole('button', { name: 'More review actions' });
    const verticalIconRect = await elementRect(verticalIcon);
    expect(
      Math.abs(verticalIconRect.width - verticalIconRect.height),
      'vertically grouped icon action remains square',
    ).toBeLessThanOrEqual(1);

    await state.actions.nth(1).evaluate((element) => element.remove());
    await state.actions.nth(1).evaluate((element) => element.remove());
    await expect(state.actions).toHaveCount(1);
    expect(
      Object.values(await logicalRadii(state.actions.first())).every((radius) => radius > 0),
    ).toBe(true);

    await page.goto(
      previewUrl({
        component: 'button-group',
        direction: 'rtl',
        args: { connected: true, orientation: 'horizontal' },
      }),
    );
    await settlePage(page);
    const rtlGroup = page
      .getByTestId('component-specimen-button-group')
      .locator('div[krnButtonGroup]');
    const rtlActions = rtlGroup.locator(
      ':scope > button[krnButton], :scope > button[krnIconButton]',
    );
    const rtlRects = await rtlActions.evaluateAll((elements) =>
      elements.map((element) => {
        const { left, right } = element.getBoundingClientRect();
        return { left, right };
      }),
    );
    expect(rtlRects[0]?.left).toBeGreaterThan(rtlRects[1]?.left ?? Number.POSITIVE_INFINITY);
    for (let index = 0; index < rtlRects.length - 1; index += 1) {
      const current = rtlRects[index];
      const next = rtlRects[index + 1];
      if (!current || !next) throw new Error('Expected adjacent RTL button-group actions.');
      const gap = current.left - next.right;
      expect(gap, 'RTL actions overlap one shared border').toBeGreaterThanOrEqual(-2);
      expect(gap, 'RTL actions overlap one shared border').toBeLessThanOrEqual(0.5);
    }
    const rtlPhysicalRadii = await rtlActions.evaluateAll((elements) =>
      [elements[0], elements.at(-1)].map((element) => {
        if (!element) throw new Error('Expected first and last RTL button-group actions.');
        const style = getComputedStyle(element);
        return {
          bottomLeft: Number.parseFloat(style.borderBottomLeftRadius) || 0,
          bottomRight: Number.parseFloat(style.borderBottomRightRadius) || 0,
          topLeft: Number.parseFloat(style.borderTopLeftRadius) || 0,
          topRight: Number.parseFloat(style.borderTopRightRadius) || 0,
        };
      }),
    );
    expect(rtlPhysicalRadii[0]).toMatchObject({
      bottomLeft: 0,
      topLeft: 0,
    });
    expect(rtlPhysicalRadii[0]?.bottomRight).toBeGreaterThan(0);
    expect(rtlPhysicalRadii[0]?.topRight).toBeGreaterThan(0);
    expect(rtlPhysicalRadii[1]).toMatchObject({
      bottomRight: 0,
      topRight: 0,
    });
    expect(rtlPhysicalRadii[1]?.bottomLeft).toBeGreaterThan(0);
    expect(rtlPhysicalRadii[1]?.topLeft).toBeGreaterThan(0);

    await page.setViewportSize({ width: 480, height: 900 });
    await page.goto(
      previewUrl({
        component: 'button-group',
        args: { connected: false, orientation: 'horizontal' },
      }),
    );
    await settlePage(page);
    await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
    const zoomedActions = page
      .getByTestId('component-specimen-button-group')
      .locator('div[krnButtonGroup] > button');
    const zoomedRows = await zoomedActions.evaluateAll((elements) => [
      ...new Set(elements.map((element) => Math.round(element.getBoundingClientRect().top))),
    ]);
    expect(zoomedRows.length, 'separated actions wrap under 200% text zoom').toBeGreaterThan(1);
    await expectNoPageOverflow(page);
    await expectNoHorizontalOverflow(page.locator('.preview-panel'), 'button-group preview');
    assertNoRuntimeErrors();
  });

  test('toggle group keeps visible focus and responsive toolbar geometry', async ({ page }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);
    await page.goto(
      previewUrl({
        component: 'toggle-group',
        args: { multiple: true, orientation: 'horizontal' },
      }),
    );
    await settlePage(page);

    const specimen = page.getByTestId('component-specimen-toggle-group');
    const group = specimen.locator('div[krnToggleGroup]');
    const actions = group.locator(':scope > button[krnToggleButton]');
    await expect(actions).toHaveCount(3);
    await expect(group).toHaveAttribute('role', 'toolbar');
    await expect(group).toHaveAttribute('aria-orientation', 'horizontal');

    const list = actions.first();
    const board = actions.nth(1);
    await list.focus();
    await list.press('ArrowRight');
    await expect(board).toBeFocused();
    const focusGeometry = await board.evaluate((element) => {
      const action = getComputedStyle(element);
      const toolbar = getComputedStyle(element.parentElement as HTMLElement);
      return {
        boxShadow: action.boxShadow,
        outlineStyle: action.outlineStyle,
        overflowX: toolbar.overflowX,
        overflowY: toolbar.overflowY,
      };
    });
    expect(focusGeometry.boxShadow).not.toBe('none');
    expect(focusGeometry.outlineStyle).not.toBe('none');
    expect(focusGeometry.overflowX).not.toMatch(/hidden|clip/);
    expect(focusGeometry.overflowY).not.toMatch(/hidden|clip/);

    await page.setViewportSize({ width: 480, height: 900 });
    await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
    await expectNoPageOverflow(page);
    await expectNoHorizontalOverflow(page.locator('.preview-panel'), 'toggle-group preview');
    const toolbarRect = await elementRect(group);
    const specimenRect = await elementRect(specimen);
    expect(toolbarRect.width).toBeLessThanOrEqual(specimenRect.width + 1);
    assertNoRuntimeErrors();
  });

  test('copy-button renders deterministic async feedback once and remains responsive', async ({
    page,
  }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);
    const openCopyState = async (
      state: 'idle' | 'pending' | 'copied' | 'error' | 'disabled',
    ): Promise<{ button: Locator; copy: Locator; status: Locator }> => {
      await page.goto(
        previewUrl({
          component: 'copy-button',
          state,
          args: {
            feedbackDuration: 60_000,
            size: 'lg',
            tone: 'success',
            variant: 'soft',
          },
        }),
      );
      await settlePage(page);
      const specimen = page.getByTestId('component-specimen-copy-button');
      const copy = specimen.locator('krn-copy-button');
      const button = copy.getByRole('button', { name: 'Copy install command' });
      const status = copy.locator('.krn-copy-status');

      await expect(copy).toHaveAttribute('data-size', 'lg');
      await expect(copy).toHaveAttribute('data-tone', 'success');
      await expect(copy).toHaveAttribute('data-variant', 'soft');
      await expect(button).toHaveAttribute('type', 'button');
      await expect(button).toHaveAccessibleName('Copy install command');
      return { button, copy, status };
    };
    const expectStableActionLabel = async (button: Locator): Promise<void> => {
      const label = button.locator('.krn-copy-label');
      await expect(label).toHaveCount(1);
      await expect(label).toHaveText('Copy install command');
      await expect(label).toBeVisible();
    };

    let fixture = await openCopyState('idle');
    await expect(fixture.copy).toHaveAttribute('data-state', 'idle');
    await expect(fixture.copy).toHaveAttribute('data-pending', 'false');
    await expect(fixture.status).toHaveText('');
    await expectStableActionLabel(fixture.button);
    await expect(fixture.button.locator('.krn-copy-indicator')).toHaveAttribute(
      'data-state',
      'idle',
    );
    await expect(fixture.button.locator('.krn-copy-indicator')).toHaveText('');
    const idleButtonRect = await elementRect(fixture.button);
    const expectStableButtonGeometry = async (button: Locator): Promise<void> => {
      const rect = await elementRect(button);
      expect(Math.abs(rect.width - idleButtonRect.width)).toBeLessThanOrEqual(1);
      expect(Math.abs(rect.height - idleButtonRect.height)).toBeLessThanOrEqual(1);
    };

    fixture = await openCopyState('pending');
    await expect(fixture.copy).toHaveAttribute('data-state', 'idle');
    await expect(fixture.copy).toHaveAttribute('data-pending', 'true');
    await expect(fixture.button).toHaveAttribute('aria-disabled', 'true');
    await expectStableActionLabel(fixture.button);
    await expectStableButtonGeometry(fixture.button);
    await expect(fixture.status).toHaveText('Copying…');
    await expect(fixture.button.locator('.krn-action__status')).toHaveText('');
    await fixture.button.click({ force: true });
    await expect(fixture.copy).toHaveAttribute('data-pending', 'true');

    for (const [state, feedback, indicator] of [
      ['copied', 'Copied', '✓'],
      ['error', 'Could not copy', '!'],
    ] as const) {
      fixture = await openCopyState(state);
      await expect(fixture.copy).toHaveAttribute('data-state', state);
      await expect(fixture.copy).toHaveAttribute('data-pending', 'false');
      await expectStableActionLabel(fixture.button);
      await expect(fixture.button.locator('.krn-copy-indicator')).toHaveAttribute(
        'data-state',
        state,
      );
      await expect(fixture.button.locator('.krn-copy-indicator')).toHaveText(indicator);
      await expectStableButtonGeometry(fixture.button);
      await expect(fixture.status).toHaveText(feedback);
      const hiddenStatusStyle = await fixture.status.evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          blockSize: style.blockSize,
          clipPath: style.clipPath,
          inlineSize: style.inlineSize,
          overflow: style.overflow,
          position: style.position,
        };
      });
      expect(hiddenStatusStyle).toMatchObject({
        blockSize: '1px',
        inlineSize: '1px',
        overflow: 'hidden',
        position: 'absolute',
      });
      expect(hiddenStatusStyle.clipPath).toContain('inset(50%)');
    }

    fixture = await openCopyState('disabled');
    await expect(fixture.button).toBeDisabled();
    await fixture.button.evaluate((element) => (element as HTMLButtonElement).click());
    await expect(fixture.copy).toHaveAttribute('data-state', 'idle');
    await expect(fixture.copy).toHaveAttribute('data-pending', 'false');

    await page.setViewportSize({ width: 480, height: 900 });
    fixture = await openCopyState('error');
    await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
    const copyRect = await elementRect(fixture.copy);
    const canvasRect = await elementRect(page.locator('.specimen-canvas'));
    expect(copyRect.width).toBeLessThanOrEqual(canvasRect.width + 1);
    await expectNoPageOverflow(page);
    await expectNoHorizontalOverflow(page.locator('.preview-panel'), 'copy-button preview');
    assertNoRuntimeErrors();
  });

  test('tooltip describes the native icon-button focus target', async ({ page }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);
    const specimen = await openSpecimen(page, 'tooltip');
    const trigger = specimen.locator('button[krnIconButton][aria-label="Copy public link"]');

    await expect(trigger).toHaveCount(1);
    await expect(specimen.locator('krn-icon-button')).toHaveCount(0);
    await trigger.focus();

    const tooltip = page.getByRole('tooltip');
    await expect(tooltip).toBeVisible();
    await expect(trigger).toBeFocused();
    expect(await trigger.evaluate((element) => element.tagName)).toBe('BUTTON');

    const tooltipId = await tooltip.getAttribute('id');
    const describedBy = await trigger.getAttribute('aria-describedby');
    expect(tooltipId).toBeTruthy();
    expect(describedBy?.split(/\s+/)).toContain(tooltipId);

    assertNoRuntimeErrors();
  });

  test('split-button menu items expose a subtle pointer hover without shifting', async ({
    page,
  }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);
    const specimen = await openSpecimen(page, 'split-button');
    const trigger = specimen.getByRole('button', { name: 'More actions' });

    await trigger.click();

    const menu = page.getByRole('menu');
    const firstItem = menu.getByRole('menuitem', { name: 'Publish now' });
    await expect(menu).toBeVisible();

    const beforeRect = await elementRect(firstItem);
    const restingBackground = await firstItem.evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    );

    await firstItem.hover();
    await expect
      .poll(() => firstItem.evaluate((element) => getComputedStyle(element).backgroundColor))
      .not.toBe(restingBackground);

    const hoverBackground = await firstItem.evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    );
    const menuBackground = await menu.evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    );
    expect(hoverBackground).not.toBe('rgba(0, 0, 0, 0)');
    expect(hoverBackground).not.toBe(menuBackground);
    expectStableRect(beforeRect, await elementRect(firstItem), 'split-button hover item');
    assertNoRuntimeErrors();
  });

  test('split and dropdown menus keep their trigger geometry, styling, and keyboard contract', async ({
    page,
  }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);

    for (const config of [
      {
        id: 'split-button',
        root: '.krn-split-button',
        triggerName: 'More actions',
        firstItem: 'Publish now',
        lastItem: 'Save as draft',
        typeaheadItem: 'Schedule…',
        typeaheadKey: 's',
      },
      {
        id: 'dropdown-button',
        root: '.krn-dropdown',
        triggerName: 'Export',
        firstItem: 'CSV spreadsheet',
        lastItem: 'JSON archive',
        typeaheadItem: 'JSON archive',
        typeaheadKey: 'j',
      },
    ] as const) {
      const specimen = await openSpecimen(page, config.id);
      const host = specimen.locator(`krn-${config.id}`);
      const root = host.locator(config.root);
      const trigger = host.getByRole('button', { name: config.triggerName });
      const rootBefore = await elementRect(root);
      const triggerBefore = await elementRect(trigger);

      await trigger.press('ArrowDown');

      const menu = page.getByRole('menu');
      const firstItem = menu.getByRole('menuitem', { name: config.firstItem });
      const lastItem = menu.getByRole('menuitem', { name: config.lastItem });
      const typeaheadItem = menu.getByRole('menuitem', { name: config.typeaheadItem });
      await expect(menu).toBeVisible();
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await expect(firstItem).toBeFocused();
      const controlledMenuId = await trigger.getAttribute('aria-controls');
      const triggerId = await trigger.getAttribute('id');
      expect(controlledMenuId).toBeTruthy();
      expect(triggerId).toBeTruthy();
      await expect(menu).toHaveAttribute('id', controlledMenuId!);
      await expect(menu).toHaveAttribute('aria-labelledby', triggerId!);

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

      await firstItem.press(config.typeaheadKey);
      await expect(typeaheadItem).toBeFocused();
      await typeaheadItem.press('Home');
      await expect(firstItem).toBeFocused();
      await firstItem.press('End');
      await expect(lastItem).toBeFocused();
      await lastItem.press('Home');
      await expect(firstItem).toBeFocused();
      await firstItem.press('Space');
      await expect(menu).toHaveCount(0);
      await expect(trigger).toBeFocused();

      await trigger.press('ArrowDown');
      await expect(firstItem).toBeFocused();
      await firstItem.press('Escape');
      await expect(menu).toHaveCount(0);
      await expect(trigger).toBeFocused();
    }

    assertNoRuntimeErrors();
  });

  test('dropdown exact-width mode and Tab order delegate to native browser focus navigation', async ({
    page,
  }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);
    await page.goto(
      previewUrl({
        component: 'dropdown-button',
        args: { matchTriggerWidth: true },
      }),
    );
    await settlePage(page);

    const specimen = page.getByTestId('component-specimen-dropdown-button');
    const host = specimen.locator('krn-dropdown-button');
    const trigger = host.getByRole('button', { name: 'Export' });
    await trigger.evaluate((element) => {
      element.setAttribute('tabindex', '2');
      element.style.inlineSize = '28rem';
      const dropdown = element.closest('krn-dropdown-button');
      if (!dropdown) {
        throw new Error('Dropdown host is missing.');
      }

      const before = document.createElement('button');
      before.type = 'button';
      before.tabIndex = 1;
      before.dataset['testid'] = 'dropdown-tab-before';
      before.textContent = 'Before dropdown';

      const hidden = document.createElement('button');
      hidden.type = 'button';
      hidden.tabIndex = 3;
      hidden.hidden = true;
      hidden.textContent = 'Hidden after dropdown';

      const after = document.createElement('button');
      after.type = 'button';
      after.tabIndex = 4;
      after.dataset['testid'] = 'dropdown-tab-after';
      after.textContent = 'After dropdown';

      dropdown.before(before);
      dropdown.after(hidden, after);
    });

    await trigger.press('ArrowDown');
    let menu = page.getByRole('menu');
    let firstItem = menu.getByRole('menuitem', { name: 'CSV spreadsheet' });
    await expect(firstItem).toBeFocused();
    const triggerRect = await elementRect(trigger);
    const menuRect = await elementRect(menu);
    expect(triggerRect.width).toBeGreaterThan(320);
    expect(Math.abs(menuRect.width - triggerRect.width)).toBeLessThanOrEqual(2);

    await page.keyboard.press('Tab');
    await expect(menu).toHaveCount(0);
    await expect(page.getByTestId('dropdown-tab-after')).toBeFocused();

    await trigger.focus();
    await trigger.press('ArrowDown');
    menu = page.getByRole('menu');
    firstItem = menu.getByRole('menuitem', { name: 'CSV spreadsheet' });
    await expect(firstItem).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(menu).toHaveCount(0);
    await expect(page.getByTestId('dropdown-tab-before')).toBeFocused();
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
    await expect(specimen.locator('.krn-tag-feedback')).toHaveText('Added');
    await expect(specimen.locator('[role="status"]')).toContainText('operations added');
    await expect(specimen.locator('.krn-message')).not.toContainText(/added|removed|already/i);
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
      'Mon',
      'Tue',
      'Wed',
      'Thu',
      'Fri',
      'Sat',
      'Sun',
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
    const timeTrigger = specimen.getByRole('button', { name: 'Daily digest' });
    await timeTrigger.click();
    let dialog = specimen.getByRole('dialog', { name: 'Digest time' });
    await expect(dialog).toBeVisible();
    expectStyledOverlay(await overlayStyle(dialog), 'time picker');
    await expect(dialog.getByRole('listbox')).toHaveCount(0);
    const hour = dialog.getByRole('spinbutton', { name: 'Hour' });
    const minute = dialog.getByRole('spinbutton', { name: 'Minute' });
    await expect(hour).toBeVisible();
    await expect(minute).toBeVisible();
    await expect(dialog.locator('.krn-time-presets button')).toHaveCount(4);
    await hour.fill('09');
    await minute.fill('30');
    await dialog.getByRole('button', { name: 'Apply' }).click();
    await expect(timeTrigger).toContainText('09:30');
    await expect(dialog).toHaveCount(0);

    specimen = await openSpecimen(page, 'color-picker');
    await expect(specimen.locator('input[type="color"]')).toHaveCount(0);
    const colorTrigger = specimen.getByRole('button', { name: 'Brand accent' });
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
  test('drawer runs translate and opacity transitions before its closing DOM is removed', async ({
    page,
  }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);
    const specimen = await openSpecimen(page, 'drawer');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-krn-motion', 'full');
      document.documentElement.style.setProperty('--krn-motion-duration-normal', '220ms');
      document.documentElement.style.setProperty('--krn-motion-duration-slow', '240ms');
    });

    const drawer = specimen.locator('krn-drawer');
    await specimen.getByRole('button', { name: 'Open activity drawer' }).click();

    const backdrop = drawer.locator('.backdrop');
    const surface = backdrop.locator('.surface');
    await expect(backdrop).toHaveAttribute('data-state', 'open');
    await expect(surface).toBeVisible();

    const openingMotion = await backdrop.evaluate(async (backdropElement) => {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      const surfaceElement = backdropElement.querySelector<HTMLElement>('.surface');
      if (!surfaceElement) throw new Error('Drawer surface was not rendered.');

      const transitionProperties = (element: Element): string[] =>
        element
          .getAnimations()
          .filter((animation) => 'transitionProperty' in animation)
          .map((animation) => String(Reflect.get(animation, 'transitionProperty')));
      const backdropStyle = getComputedStyle(backdropElement);
      const surfaceStyle = getComputedStyle(surfaceElement);

      return {
        backdropOpacity: Number.parseFloat(backdropStyle.opacity),
        backdropTransitions: transitionProperties(backdropElement),
        surfaceOpacity: Number.parseFloat(surfaceStyle.opacity),
        surfaceTransitions: transitionProperties(surfaceElement),
        surfaceTranslate: Math.abs(Number.parseFloat(surfaceStyle.translate) || 0),
      };
    });

    expect(openingMotion.backdropTransitions).toContain('opacity');
    expect(openingMotion.surfaceTransitions).toEqual(
      expect.arrayContaining(['opacity', 'translate']),
    );
    expect(openingMotion.backdropOpacity).toBeLessThan(1);
    expect(openingMotion.surfaceOpacity).toBeLessThan(1);
    expect(openingMotion.surfaceTranslate).toBeGreaterThan(0);

    await expect
      .poll(() =>
        backdrop.evaluate((backdropElement) => {
          const surfaceElement = backdropElement.querySelector<HTMLElement>('.surface');
          if (!surfaceElement) return false;
          const backdropStyle = getComputedStyle(backdropElement);
          const surfaceStyle = getComputedStyle(surfaceElement);
          return (
            Number.parseFloat(backdropStyle.opacity) === 1 &&
            Number.parseFloat(surfaceStyle.opacity) === 1 &&
            Math.abs(Number.parseFloat(surfaceStyle.translate) || 0) < 0.01 &&
            backdropElement.getAnimations().length === 0 &&
            surfaceElement.getAnimations().length === 0
          );
        }),
      )
      .toBe(true);

    await backdrop.evaluate((backdropElement) => {
      const traceWindow = window as typeof window & {
        __krnDrawerExitTrace?: {
          removedAt: number | null;
          transitionEndedAt: number | null;
        };
      };
      const trace = {
        removedAt: null as number | null,
        transitionEndedAt: null as number | null,
      };
      traceWindow.__krnDrawerExitTrace = trace;
      backdropElement.addEventListener('transitionend', (event) => {
        if (
          event instanceof TransitionEvent &&
          event.target === backdropElement &&
          event.propertyName === 'opacity'
        ) {
          trace.transitionEndedAt = performance.now();
        }
      });

      const host = backdropElement.closest('krn-drawer');
      if (!host) throw new Error('Drawer host was not found.');
      const observer = new MutationObserver(() => {
        if (!backdropElement.isConnected) {
          trace.removedAt = performance.now();
          observer.disconnect();
        }
      });
      observer.observe(host, { childList: true, subtree: true });
    });

    await surface.getByRole('button', { name: 'Close' }).click();
    await expect(backdrop).toHaveAttribute('data-state', 'closing');
    await expect(backdrop).toHaveAttribute('aria-hidden', 'true');
    await expect(backdrop).toHaveCount(1);

    const closingMotion = await backdrop.evaluate(async (backdropElement) => {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      const surfaceElement = backdropElement.querySelector<HTMLElement>('.surface');
      if (!surfaceElement) throw new Error('Closing drawer surface disappeared too early.');

      const transitionProperties = (element: Element): string[] =>
        element
          .getAnimations()
          .filter((animation) => 'transitionProperty' in animation)
          .map((animation) => String(Reflect.get(animation, 'transitionProperty')));
      const backdropStyle = getComputedStyle(backdropElement);
      const surfaceStyle = getComputedStyle(surfaceElement);

      return {
        backdropOpacity: Number.parseFloat(backdropStyle.opacity),
        backdropTransitions: transitionProperties(backdropElement),
        surfaceOpacity: Number.parseFloat(surfaceStyle.opacity),
        surfaceTransitions: transitionProperties(surfaceElement),
        surfaceTranslate: Math.abs(Number.parseFloat(surfaceStyle.translate) || 0),
      };
    });

    expect(closingMotion.backdropTransitions).toContain('opacity');
    expect(closingMotion.surfaceTransitions).toEqual(
      expect.arrayContaining(['opacity', 'translate']),
    );
    expect(closingMotion.backdropOpacity).toBeLessThan(1);
    expect(closingMotion.surfaceOpacity).toBeLessThan(1);
    expect(closingMotion.surfaceTranslate).toBeGreaterThan(0);

    await expect(backdrop).toHaveCount(0);
    await expect
      .poll(() =>
        page.evaluate(() => {
          const traceWindow = window as typeof window & {
            __krnDrawerExitTrace?: {
              removedAt: number | null;
              transitionEndedAt: number | null;
            };
          };
          return traceWindow.__krnDrawerExitTrace?.removedAt ?? null;
        }),
      )
      .not.toBeNull();
    const exitTrace = await page.evaluate(() => {
      const traceWindow = window as typeof window & {
        __krnDrawerExitTrace?: {
          removedAt: number | null;
          transitionEndedAt: number | null;
        };
      };
      return traceWindow.__krnDrawerExitTrace;
    });
    expect(exitTrace?.transitionEndedAt).not.toBeNull();
    expect(exitTrace?.removedAt).not.toBeNull();
    expect(exitTrace?.removedAt ?? 0).toBeGreaterThanOrEqual(exitTrace?.transitionEndedAt ?? 1);
    assertNoRuntimeErrors();
  });

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
      const marks =
        id === 'donut-chart'
          ? specimen.locator('.legend button')
          : specimen.locator('[role="button"][data-chart-index]');
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
      await expect(tooltip).toContainText('Mon');
      await page.mouse.move(0, 0);
      await expect(tooltip).toHaveCount(0);
    }

    assertNoRuntimeErrors();
  });

  test('progress and meter specimens expose animated, bounded value controls', async ({ page }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);

    let specimen = await openSpecimen(page, 'progress-bar');
    let progress = specimen.getByRole('progressbar', { name: 'Progress' });
    await expect(progress).toHaveAttribute('aria-valuenow', '68');
    await specimen.getByRole('button', { name: '+10' }).click();
    await expect(progress).toHaveAttribute('aria-valuenow', '78');

    specimen = await openSpecimen(page, 'circular-progress');
    progress = specimen.getByRole('progressbar', { name: 'Storage used' });
    await specimen.getByRole('button', { name: '−10' }).click();
    await expect(progress).toHaveAttribute('aria-valuenow', '58');

    specimen = await openSpecimen(page, 'meter');
    const meter = specimen.getByRole('meter', { name: 'Storage used' });
    await specimen.getByRole('button', { name: '+10' }).click();
    await specimen.getByRole('button', { name: '+10' }).click();
    await expect(meter).toHaveAttribute('aria-valuenow', '88');
    await expect(meter).toHaveAttribute('data-tone', 'danger');

    assertNoRuntimeErrors();
  });

  test('toasts remain individually dismissible in a bounded expandable stack', async ({ page }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);
    const specimen = await openSpecimen(page, 'toast');
    const showToast = specimen.getByRole('button', { name: 'Show success toast' });

    for (let index = 0; index < 12; index += 1) {
      await showToast.click();
    }

    const viewport = page.locator('krn-toast-viewport');
    const renderedToasts = viewport.locator('.toast');
    await expect(renderedToasts).toHaveCount(4);
    await expect(viewport.locator('.stack-controls')).toContainText('12 notifications');
    expect(
      await renderedToasts.count(),
      'rendered toast stack remains bounded',
    ).toBeLessThanOrEqual(4);

    await renderedToasts.first().getByRole('button', { name: 'Dismiss notification' }).click();
    await expect(viewport.locator('.stack-controls')).toContainText('11 notifications');
    await expect(renderedToasts).toHaveCount(4);

    await viewport.locator('.toast-stack').hover();
    await page.waitForTimeout(320);
    const firstToast = await renderedToasts.nth(0).boundingBox();
    const secondToast = await renderedToasts.nth(1).boundingBox();
    expect((secondToast?.y ?? 0) - (firstToast?.y ?? 0)).toBeGreaterThan(40);

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
                'krn-skip-link, .skip-link, [role="button"][data-chart-index], .legend button, .krn-choice__native, .krn-upload__input',
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
