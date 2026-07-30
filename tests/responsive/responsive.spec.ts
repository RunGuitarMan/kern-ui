import { expect, test } from '@playwright/test';

import { DOCS_URL, expectNoPageOverflow, previewUrl, settlePage } from '../support/browser';

test.describe('Responsive, RTL, and text zoom contracts', () => {
  test('Docs reflows at a narrow mobile viewport without page overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(DOCS_URL);
    await settlePage(page);

    await expect(
      page.getByRole('heading', { level: 1, name: /One rhythm\. Any product\./ }),
    ).toBeVisible();
    await expectNoPageOverflow(page);
  });

  test('Docs mobile navigation opens, routes, and closes without losing context', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${DOCS_URL}/components/date-picker`);
    await settlePage(page);

    const navigationToggle = page.getByRole('button', {
      name: 'Open component navigation',
    });
    const navigation = page.getByRole('complementary', { name: 'Documentation' });

    await expect(navigationToggle).toHaveAttribute('aria-expanded', 'false');
    await navigationToggle.click();
    await expect(navigationToggle).toHaveAttribute('aria-expanded', 'true');
    await expect(navigation).toHaveClass(/open/);

    await navigation.getByRole('link', { name: 'Text Input Forms' }).click();

    await expect(page).toHaveURL(/\/components\/text-input$/);
    await expect(page.getByTestId('component-specimen-text-input')).toBeVisible();
    await expect(navigationToggle).toHaveAttribute('aria-expanded', 'false');
    await expectNoPageOverflow(page);
  });

  test('Docs preview stress content remains contained at the 320px minimum', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto(
      previewUrl({
        component: 'button',
        state: 'long-text',
        theme: 'light',
        density: 'comfortable',
        direction: 'ltr',
      }),
    );
    await settlePage(page);

    await expect(page.getByTestId('component-specimen-button')).toBeVisible();
    await expectNoPageOverflow(page);
  });

  test('RTL uses logical layout at tablet width without overflow', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(
      previewUrl({
        component: 'data-grid',
        scenario: 'states',
        theme: 'dark',
        density: 'compact',
        direction: 'rtl',
      }),
    );
    await settlePage(page);

    await expect(page.getByTestId('specimen-stage')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('html')).not.toHaveAttribute('dir', 'rtl');
    await expect(page.getByTestId('component-specimen-data-grid')).toBeVisible();
    await expectNoPageOverflow(page);
  });

  test('Docs remains operable with text enlarged to 200 percent', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`${DOCS_URL}/accessibility`);
    await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
    await settlePage(page);

    await expect(
      page.getByRole('heading', { level: 1, name: 'WCAG 2.2 AA is the floor.' }),
    ).toBeVisible();
    await expect(
      page.getByRole('table', { name: 'Accessibility verification matrix' }),
    ).toBeVisible();
    await expectNoPageOverflow(page);
  });

  test('Docs preview controls remain usable with text enlarged to 200 percent', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(
      previewUrl({
        component: 'text-input',
        state: 'invalid',
        theme: 'high-contrast',
        density: 'spacious',
        direction: 'rtl',
      }),
    );
    await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
    await settlePage(page);

    await expect(page.getByTestId('preview-controls')).toBeVisible();
    await expect(page.getByTestId('component-specimen-text-input')).toBeVisible();
    await expectNoPageOverflow(page);
  });

  test('complex Docs preview content reflows at the 320 CSS-pixel equivalent of 400 percent zoom', async ({
    page,
  }) => {
    // At a 1280px desktop baseline, 400% full-page zoom leaves a 320 CSS-pixel
    // layout viewport. Keep this contract explicit because it also preserves
    // native control and SVG scaling that a root font-size override cannot model.
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto(
      previewUrl({
        component: 'data-grid',
        scenario: 'states',
        theme: 'high-contrast',
        density: 'spacious',
        direction: 'ltr',
      }),
    );
    await settlePage(page);

    const specimen = page.getByTestId('component-specimen-data-grid');
    const internalScroller = specimen.locator('.table-scroll');
    await expect(specimen).toBeVisible();
    await expect(page.getByTestId('preview-controls')).toBeVisible();
    await expect
      .poll(() => internalScroller.evaluate((element) => element.scrollWidth > element.clientWidth))
      .toBe(true);
    await expectNoPageOverflow(page);

    await page.goto(
      previewUrl({
        component: 'bottom-sheet',
        scenario: 'default',
        theme: 'high-contrast',
        density: 'spacious',
        direction: 'ltr',
      }),
    );
    await settlePage(page);
    const trigger = page.getByRole('button', { name: 'Choose mobile action' });
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'Workspace actions' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Duplicate', { exact: true })).toBeVisible();
    await expectNoPageOverflow(page);
  });
});
