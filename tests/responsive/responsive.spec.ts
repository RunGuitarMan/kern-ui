import { expect, test } from '@playwright/test';

import { DOCS_URL, expectNoPageOverflow, labUrl, settlePage } from '../support/browser';

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

  test('Lab stress content remains contained at the 320px minimum', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto(
      labUrl({
        component: 'button',
        scenario: 'stress',
        theme: 'light',
        density: 'comfortable',
        direction: 'ltr',
      }),
    );
    await settlePage(page);

    await expect(page.getByTestId('specimen-button')).toBeVisible();
    await expectNoPageOverflow(page);
  });

  test('RTL uses logical layout at tablet width without overflow', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(
      labUrl({
        component: 'data-grid',
        scenario: 'states',
        theme: 'dark',
        density: 'compact',
        direction: 'rtl',
      }),
    );
    await settlePage(page);

    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.getByTestId('specimen-data-grid')).toBeVisible();
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

  test('Lab controls remain usable with text enlarged to 200 percent', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(
      labUrl({
        component: 'text-input',
        scenario: 'states',
        theme: 'high-contrast',
        density: 'spacious',
        direction: 'rtl',
      }),
    );
    await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
    await settlePage(page);

    await expect(page.getByTestId('component-control')).toBeVisible();
    await expect(page.getByTestId('specimen-text-input')).toBeVisible();
    await expectNoPageOverflow(page);
  });
});
