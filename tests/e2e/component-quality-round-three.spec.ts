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
      x: bounds.x,
      y: bounds.y,
    };
  });
}

async function documentRect(locator: Locator): Promise<Rect> {
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

function expectStablePosition(before: Rect, after: Rect, label: string): void {
  expect.soft(Math.abs(after.x - before.x), `${label}: x`).toBeLessThanOrEqual(1);
  expect.soft(Math.abs(after.y - before.y), `${label}: y`).toBeLessThanOrEqual(1);
}

test.describe('Round three: layout specimens', () => {
  test('app shell mobile navigation is modal and restores its trigger', async ({ page }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);
    await page.setViewportSize({ width: 600, height: 900 });
    const specimen = await openSpecimen(page, 'app-shell');
    const trigger = specimen.locator('.krn-shell__mobile-trigger');
    const navigation = specimen.locator('.krn-shell__navigation');
    const close = navigation.locator('.krn-shell__mobile-close');

    await expect(trigger).toBeVisible();
    await trigger.click();
    await expect(navigation).toBeVisible();
    await expect(navigation).toHaveAttribute('role', 'dialog');
    await expect(navigation).toHaveAttribute('aria-modal', 'true');
    await expect(close).toBeFocused();
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('hidden');

    await navigation.evaluate((element) => {
      const event = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });
      event.preventDefault();
      element.dispatchEvent(event);
    });
    await expect(navigation).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(navigation).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('');
    assertNoRuntimeErrors();
  });

  test('header elevation connects directly to its boundary line', async ({ page }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);
    const specimen = await openSpecimen(page, 'header');
    const header = specimen.locator('.bounded-surface .krn-header');
    const elevation = await header.evaluate((element) => {
      const styles = getComputedStyle(element);
      return {
        borderWidth: Number.parseFloat(styles.borderBlockEndWidth),
        shadow: styles.boxShadow,
      };
    });

    expect(elevation.borderWidth).toBe(1);
    expect(elevation.shadow).not.toContain('0px 1px 0px 0px');
    expect(elevation.shadow).not.toBe('none');
    assertNoRuntimeErrors();
  });

  test('rail, stack, scroll area, and responsive slots keep deliberate geometry', async ({
    page,
  }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);
    await page.setViewportSize({ width: 1200, height: 900 });

    let specimen = await openSpecimen(page, 'app-shell');
    const shellRadii = await specimen.locator('.mini-app-shell').evaluate((element) => {
      const host = element.querySelector<HTMLElement>('krn-app-shell');
      const shell = element.querySelector<HTMLElement>('.krn-shell');
      const header = element.querySelector<HTMLElement>('.krn-header');
      if (!host || !shell || !header) {
        throw new Error('App shell specimen is missing a rendered layer.');
      }

      return {
        headerStart: Number.parseFloat(getComputedStyle(header).borderStartStartRadius),
        host: Number.parseFloat(getComputedStyle(host).borderRadius),
        hostOverflow: getComputedStyle(host).overflow,
        shell: Number.parseFloat(getComputedStyle(shell).borderRadius),
        wrapper: Number.parseFloat(getComputedStyle(element).borderRadius),
      };
    });
    expect(shellRadii.wrapper).toBeGreaterThan(0);
    expect(shellRadii.host).toBe(shellRadii.wrapper);
    expect(shellRadii.shell).toBe(shellRadii.wrapper);
    expect(shellRadii.headerStart).toBe(shellRadii.wrapper);
    expect(shellRadii.hostOverflow).toBe('clip');

    specimen = await openSpecimen(page, 'navigation-rail');
    const rail = specimen.locator('krn-navigation-rail');
    await expect(rail).toHaveCSS('width', '56px');
    const railAlignment = await rail.evaluate((element) => {
      const railBounds = element.getBoundingClientRect();
      const railCenter = railBounds.left + railBounds.width / 2;
      return [...element.querySelectorAll<HTMLElement>('.rail-brand, button, krn-avatar')].map(
        (control) => {
          const bounds = control.getBoundingClientRect();
          return Math.abs(bounds.left + bounds.width / 2 - railCenter);
        },
      );
    });
    expect(Math.max(...railAlignment)).toBeLessThanOrEqual(1);
    await expect(rail.locator('svg')).toHaveCount(4);

    specimen = await openSpecimen(page, 'stack');
    const stackRows = specimen.locator('.stack-specimen > article');
    await expect(stackRows).toHaveCount(3);
    for (let index = 0; index < 3; index += 1) {
      const row = stackRows.nth(index);
      await expect(row).toHaveCSS('align-items', 'center');
      const centers = await row.evaluate((element) => {
        const rowBounds = element.getBoundingClientRect();
        const indexBounds = element.querySelector('span')?.getBoundingClientRect();
        return {
          index: indexBounds ? indexBounds.top + indexBounds.height / 2 : 0,
          row: rowBounds.top + rowBounds.height / 2,
        };
      });
      expect(Math.abs(centers.index - centers.row)).toBeLessThanOrEqual(1);
    }

    specimen = await openSpecimen(page, 'scroll-area');
    const scrollArea = specimen.locator('krn-scroll-area');
    const viewport = scrollArea.locator('.krn-scroll-area__viewport');
    const clipping = await scrollArea.evaluate((element) => {
      const host = getComputedStyle(element);
      const inner = getComputedStyle(
        element.querySelector('.krn-scroll-area__viewport') as HTMLElement,
      );
      return {
        hostOverflow: host.overflow,
        hostRadius: Number.parseFloat(host.borderRadius),
        innerRadius: Number.parseFloat(inner.borderRadius),
      };
    });
    expect(clipping.hostOverflow).toBe('clip');
    expect(clipping.hostRadius).toBeGreaterThan(0);
    expect(clipping.innerRadius).toBe(clipping.hostRadius);
    await viewport.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
    const viewportBounds = await rect(viewport);
    const lastRowBounds = await rect(scrollArea.locator('article').last());
    expect(lastRowBounds.y + lastRowBounds.height).toBeLessThanOrEqual(
      viewportBounds.y + viewportBounds.height + 1,
    );

    specimen = await openSpecimen(page, 'responsive-show-hide');
    await expect(specimen.getByText('Wide navigation + contextual actions')).toBeVisible();
    await expect(specimen.getByText('Compact navigation + essential actions')).toBeHidden();
    await page.setViewportSize({ width: 700, height: 900 });
    await expect(specimen.getByText('Compact navigation + essential actions')).toBeVisible();
    await expect(specimen.getByText('Wide navigation + contextual actions')).toBeHidden();
    assertNoRuntimeErrors();
  });
});

test.describe('Round three: form behavior', () => {
  test('form length, textarea counter, and number controls enforce their visible contracts', async ({
    page,
  }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);

    let specimen = await openSpecimen(page, 'form-field');
    const workspaceName = specimen.getByRole('textbox', { name: /Workspace name/ });
    await workspaceName.fill('x'.repeat(49));
    await expect(workspaceName).toHaveValue('x'.repeat(49));
    await expect(specimen.locator('.krn-control-shell')).toHaveAttribute('data-invalid', 'true');
    await expect(specimen.locator('.krn-message--error')).toContainText('3–48');

    specimen = await openSpecimen(page, 'textarea');
    const textarea = specimen.getByRole('textbox', { name: 'Change summary' });
    await expect(textarea).toHaveCSS('resize', 'none');
    await textarea.pressSequentially('x'.repeat(300));
    await expect(textarea).toHaveValue('x'.repeat(280));
    await expect(specimen.locator('.krn-textarea-count')).toHaveText('280 / 280');
    const textBounds = await rect(textarea);
    const footerBounds = await rect(specimen.locator('.krn-textarea-footer'));
    expect(footerBounds.y).toBeGreaterThanOrEqual(textBounds.y + textBounds.height - 1);

    specimen = await openSpecimen(page, 'number-input');
    const number = specimen.getByRole('spinbutton', { name: 'Seat limit' });
    const increase = specimen.getByRole('button', { name: 'Increase value' });
    const restBackground = await increase.evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    );
    await increase.hover();
    expect(
      await increase.evaluate((element) => getComputedStyle(element).backgroundColor),
    ).not.toBe(restBackground);
    const restingBounds = await rect(increase);
    await page.mouse.down();
    const pressedBounds = await rect(increase);
    expect(pressedBounds).toEqual(restingBounds);
    await expect(increase).toHaveCSS('border-bottom-width', '1px');
    await page.mouse.up();
    await expect(number).toHaveValue('6');
    await specimen.getByRole('button', { name: 'Decrease value' }).click();
    await expect(number).toHaveValue('1');
    assertNoRuntimeErrors();
  });

  test('range thumbs drag independently and preserve their ordering', async ({ page }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);
    const specimen = await openSpecimen(page, 'range-slider');
    const surface = specimen.locator('.krn-dual-range');
    const thumbs = surface.locator('input[type="range"]');
    await surface.scrollIntoViewIfNeeded();
    const bounds = await surface.boundingBox();
    expect(bounds).not.toBeNull();
    if (!bounds) return;

    const radius = 9;
    const travel = bounds.width - radius * 2;
    const centerY = bounds.y + bounds.height / 2;
    await page.mouse.move(bounds.x + radius, centerY);
    await page.mouse.down();
    await page.mouse.move(bounds.x + radius + travel * 0.3, centerY, { steps: 6 });
    await page.mouse.up();
    await expect(thumbs.nth(0)).toHaveValue('30');
    await expect(thumbs.nth(1)).toHaveValue('100');

    await page.mouse.move(bounds.x + radius + travel, centerY);
    await page.mouse.down();
    await page.mouse.move(bounds.x + radius + travel * 0.7, centerY, { steps: 6 });
    await page.mouse.up();
    await expect(thumbs.nth(0)).toHaveValue('30');
    await expect(thumbs.nth(1)).toHaveValue('70');
    await expect(surface).toHaveAttribute('data-dragging', 'false');
    assertNoRuntimeErrors();
  });

  test('time entry is compact and tag feedback is transient', async ({ page }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);

    let specimen = await openSpecimen(page, 'time-picker');
    const trigger = specimen.getByRole('button', { name: 'Digest time' });
    await trigger.click();
    const dialog = specimen.getByRole('dialog', { name: 'Digest time' });
    await expect(dialog.locator('.krn-time-list')).toHaveCount(0);
    const hour = dialog.getByRole('spinbutton', { name: 'Hour' });
    const minute = dialog.getByRole('spinbutton', { name: 'Minute' });
    await hour.fill('17');
    await minute.fill('30');
    await dialog.getByRole('button', { name: 'Apply' }).click();
    await expect(dialog).toBeHidden();
    await expect(trigger).toContainText('17:30');

    specimen = await openSpecimen(page, 'tags-input');
    const tagInput = specimen.getByRole('textbox', { name: 'Add tag' });
    await tagInput.fill('operations');
    await tagInput.press('Enter');
    await expect(specimen.locator('.krn-token')).toContainText('operations');
    const feedback = specimen.locator('.krn-tag-feedback[data-kind="added"]');
    await expect(feedback).toHaveText('Added');
    await expect(specimen.locator('[role="status"]')).toContainText('operations added');
    await expect(feedback).toHaveCount(0);
    await expect(specimen.locator('.krn-message')).not.toContainText(/added|removed|present/i);
    assertNoRuntimeErrors();
  });
});

test.describe('Round three: navigation behavior', () => {
  test('table-of-contents and skip links preserve their component route', async ({ page }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);

    let specimen = await openSpecimen(page, 'table-of-contents');
    await specimen.locator('.toc-stage').getByRole('link', { name: 'API contract' }).click();
    await expect(page).toHaveURL(`${DOCS_URL}/components/table-of-contents#specimen-api`);
    await expect(specimen.locator('#specimen-api')).toBeInViewport();

    specimen = await openSpecimen(page, 'skip-link');
    const skipLink = specimen.getByRole('link', { name: 'Skip specimen navigation' });
    for (let attempt = 0; attempt < 2; attempt += 1) {
      await skipLink.focus();
      await skipLink.click();
      await expect(page).toHaveURL(`${DOCS_URL}/components/skip-link#specimen-skip-target`);
      await expect(specimen.locator('#specimen-skip-target')).toBeFocused();
    }
    assertNoRuntimeErrors();
  });

  test('context submenus and tree levels expose their hierarchy', async ({ page }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);

    let specimen = await openSpecimen(page, 'context-menu');
    await specimen.locator('.context-target').click({ button: 'right' });
    const rootMenu = specimen.getByRole('menu', { name: 'Canvas actions' });
    const moveTo = rootMenu.getByRole('menuitem', { name: 'Move to' });
    await moveTo.hover();
    await expect(moveTo).toHaveAttribute('aria-expanded', 'true');
    const submenu = specimen.getByRole('menu', { name: 'Move to' });
    await expect(submenu).toBeVisible();
    await expect(submenu.getByRole('menuitem', { name: 'Operations' })).toBeVisible();
    await expect(submenu.locator('.item-icon').first()).toHaveText('O');

    specimen = await openSpecimen(page, 'tree-navigation');
    const rootNode = specimen.locator('.node', { hasText: 'Northstar' }).first();
    const branchNode = specimen.locator('.node', { hasText: 'Operations' }).first();
    const leafNode = specimen.locator('.node', { hasText: 'Automations' }).first();
    const [rootBounds, branchBounds, leafBounds] = await Promise.all([
      rect(rootNode),
      rect(branchNode),
      rect(leafNode),
    ]);
    expect(branchBounds.x).toBeGreaterThan(rootBounds.x);
    expect(leafBounds.x).toBeGreaterThan(branchBounds.x);
    await expect(specimen.locator('ul.branch.with-guides')).toHaveCount(2);
    await expect(leafNode.locator('..')).toHaveClass(/selected/);
    assertNoRuntimeErrors();
  });

  test('bottom navigation selection does not change item geometry', async ({ page }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);
    const specimen = await openSpecimen(page, 'bottom-navigation');
    const items = specimen.locator('.bottom-nav > :is(a, button)');
    await items.first().scrollIntoViewIfNeeded();
    const before = await items.evaluateAll((elements) =>
      elements.map((element) => {
        const bounds = element.getBoundingClientRect();
        return { height: bounds.height, width: bounds.width, x: bounds.x, y: bounds.y };
      }),
    );
    await specimen.getByRole('button', { name: /Activity/ }).click();
    await expect(specimen.getByRole('button', { name: /Activity/ })).toHaveAttribute(
      'aria-current',
      'page',
    );
    const after = await items.evaluateAll((elements) =>
      elements.map((element) => {
        const bounds = element.getBoundingClientRect();
        return { height: bounds.height, width: bounds.width, x: bounds.x, y: bounds.y };
      }),
    );
    expect(after).toHaveLength(before.length);
    before.forEach((item, index) => {
      const next = after[index];
      expect(next).toBeDefined();
      if (next) expectStablePosition(item, next, `bottom-navigation item ${index + 1}`);
      if (next) expect(Math.abs(next.width - item.width)).toBeLessThanOrEqual(1);
      if (next) expect(Math.abs(next.height - item.height)).toBeLessThanOrEqual(1);
    });
    assertNoRuntimeErrors();
  });
});

test.describe('Round three: feedback and data display', () => {
  test('toasts close individually and expand from a bounded stack', async ({ page }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);
    const specimen = await openSpecimen(page, 'toast');
    const showToast = specimen.getByRole('button', { name: 'Show success toast' });
    await showToast.click();
    await showToast.click();
    await showToast.click();

    const viewport = page.locator('krn-toast-viewport');
    const toasts = viewport.locator('.toast');
    await expect(toasts).toHaveCount(3);
    await expect(viewport.locator('.stack-controls')).toContainText('3 notifications');
    const firstTitle = (await toasts.first().locator('strong').textContent())?.trim();
    await toasts.first().getByRole('button', { name: 'Dismiss notification' }).click();
    await expect(toasts).toHaveCount(2);
    if (firstTitle) await expect(viewport).not.toContainText(firstTitle);

    await showToast.focus();
    await page.mouse.move(0, 0);
    await expect
      .poll(() =>
        toasts
          .nth(1)
          .evaluate((element) => Number.parseFloat(getComputedStyle(element).marginBlockStart)),
      )
      .toBeLessThan(0);
    await toasts.first().hover();
    await expect(toasts.nth(1)).toHaveCSS('margin-top', '8px');
    await viewport.getByRole('button', { name: 'Clear all' }).click();
    await expect(toasts).toHaveCount(0);
    assertNoRuntimeErrors();
  });

  test('progress, meter, and state semantics remain interactive and distinct', async ({ page }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);

    let specimen = await openSpecimen(page, 'progress-bar');
    const progress = specimen.getByRole('progressbar', { name: 'Progress' });
    await expect(progress).toHaveAttribute('aria-valuenow', '68');
    await specimen.getByRole('button', { name: '+10' }).click();
    await expect(progress).toHaveAttribute('aria-valuenow', '78');

    specimen = await openSpecimen(page, 'meter');
    const meter = specimen.getByRole('meter', { name: 'Storage used' });
    await specimen.getByRole('button', { name: '+10' }).click();
    await specimen.getByRole('button', { name: '+10' }).click();
    await expect(meter).toHaveAttribute('aria-valuenow', '88');
    await expect(meter).toHaveAttribute('data-tone', 'danger');

    const signatures = new Map<string, string>();
    for (const id of ['empty-state', 'error-state', 'success-state'] as const) {
      specimen = await openSpecimen(page, id);
      const state = specimen.locator('.state');
      await expect(state).toHaveAttribute('data-kind', id.replace('-state', ''));
      signatures.set(
        id,
        await state
          .locator('.default-visual path')
          .evaluateAll((paths) => paths.map((path) => path.getAttribute('d')).join('|')),
      );
    }
    expect(new Set(signatures.values()).size).toBe(3);
    assertNoRuntimeErrors();
  });

  test('accordion and disclosure remain top-anchored while opening downward', async ({ page }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);

    let specimen = await openSpecimen(page, 'accordion');
    const accordion = specimen.locator('krn-accordion');
    const accordionBefore = await documentRect(accordion);
    await accordion.locator('summary').first().click();
    const accordionAfter = await documentRect(accordion);
    expectStablePosition(accordionBefore, accordionAfter, 'accordion');
    expect(accordionAfter.height).toBeGreaterThan(accordionBefore.height);

    specimen = await openSpecimen(page, 'disclosure');
    const disclosure = specimen.locator('krn-disclosure');
    const disclosureBefore = await documentRect(disclosure);
    await disclosure.locator('summary').click();
    const disclosureAfter = await documentRect(disclosure);
    expectStablePosition(disclosureBefore, disclosureAfter, 'disclosure');
    expect(disclosureAfter.height).toBeGreaterThan(disclosureBefore.height);
    assertNoRuntimeErrors();
  });
});
