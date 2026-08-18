import { expect, test, type Page } from '@playwright/test';

import { DOCS_URL, previewUrl, settlePage, watchRuntimeErrors } from '../support/browser';

async function expectQueryParam(page: Page, key: string, value: string | null): Promise<void> {
  await expect.poll(() => new URL(page.url()).searchParams.get(key)).toBe(value);
}

interface DocumentEnvironmentSnapshot {
  readonly brand500: string;
  readonly density: string | null;
  readonly direction: string | null;
  readonly language: string | null;
  readonly motion: string | null;
  readonly resolvedTheme: string | null;
  readonly themeMode: string | null;
}

async function documentEnvironment(page: Page): Promise<DocumentEnvironmentSnapshot> {
  return page.locator('html').evaluate((root) => ({
    brand500: getComputedStyle(root).getPropertyValue('--krn-color-brand-500').trim(),
    density: root.getAttribute('data-krn-density'),
    direction: root.getAttribute('dir'),
    language: root.getAttribute('lang'),
    motion: root.getAttribute('data-krn-motion'),
    resolvedTheme: root.getAttribute('data-krn-theme'),
    themeMode: root.getAttribute('data-krn-theme-mode'),
  }));
}

async function expectDocumentEnvironment(
  page: Page,
  expected: DocumentEnvironmentSnapshot,
): Promise<void> {
  await expect.poll(() => documentEnvironment(page)).toEqual(expected);
}

test.describe('Docs smoke contracts', () => {
  test('renders the calibration bench and complete navigation catalog', async ({ page }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);

    await page.goto(DOCS_URL);
    await settlePage(page);

    await expect(page).toHaveTitle(/Kern/);
    await expect(page.getByRole('link', { name: 'Kern documentation home' })).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 1, name: /One rhythm\. Any product\./ }),
    ).toBeVisible();
    await expect(page.getByRole('complementary', { name: 'Documentation' })).toContainText(
      '132 documented entries',
    );
    assertNoRuntimeErrors();
  });

  test('exposes document theme and contrast controls beside search', async ({ page }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);
    await page.goto(`${DOCS_URL}/components/button`);
    await settlePage(page);

    const root = page.locator('html');
    const stage = page.getByTestId('specimen-stage');
    await page.getByTestId('theme-control').selectOption('dark');
    await expect(root).toHaveAttribute('data-krn-theme-mode', 'dark');
    await expect(stage).toHaveAttribute('data-krn-theme-mode', 'dark');

    const contrast = page.getByRole('button', { name: 'High contrast' });
    await contrast.click();
    await expect(contrast).toHaveAttribute('aria-pressed', 'true');
    await expect(root).toHaveAttribute('data-krn-theme-mode', 'high-contrast');
    await expect(root).toHaveAttribute('data-krn-contrast-scheme', 'dark');
    await expect(stage).toHaveAttribute('data-krn-theme-mode', 'high-contrast');
    await expect(stage).toHaveAttribute('data-krn-contrast-scheme', 'dark');

    await page.getByTestId('theme-control').selectOption('light');
    await expect(root).toHaveAttribute('data-krn-theme-mode', 'high-contrast');
    await expect(root).toHaveAttribute('data-krn-contrast-scheme', 'light');
    await expect(stage).toHaveAttribute('data-krn-contrast-scheme', 'light');
    assertNoRuntimeErrors();
  });

  test('switches the complete documentation interface between English and Russian', async ({
    page,
  }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);
    await page.goto(`${DOCS_URL}/components/button`);
    await settlePage(page);

    const locale = page.getByTestId('locale-control');
    await locale.selectOption('ru-RU');

    await expect(page.locator('html')).toHaveAttribute('lang', 'ru-RU');
    await expect(page.getByRole('heading', { level: 1, name: 'Button' })).toBeVisible();
    await expect(page.getByPlaceholder('Перейти к компоненту…')).toBeVisible();
    await expect(page.getByRole('complementary', { name: 'Документация' })).toContainText(
      'Основные компоненты',
    );
    await expect(page.getByRole('region', { name: 'Пример: Button' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Сбросить' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Опубликовать изменения' })).toBeVisible();
    await expect(page.locator('[data-control-key="variant"] .property-name')).toHaveText('variant');
    await expect(page.locator('[data-control-key="variant"] .property-name strong')).toHaveCount(0);

    await locale.selectOption('en-US');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en-US');
    await expect(page.getByRole('heading', { level: 1, name: 'Button' })).toBeVisible();
    await expect(page.getByPlaceholder('Jump to a component…')).toBeVisible();
    assertNoRuntimeErrors();
  });

  const routes = [
    { path: '/foundations', heading: 'A semantic system, not a paint box.' },
    { path: '/components/button', heading: 'Button' },
    { path: '/components/data-grid', heading: 'Data Grid' },
    { path: '/patterns', heading: 'Product flows, assembled in the open.' },
    { path: '/accessibility', heading: 'WCAG 2.2 AA is the floor.' },
    { path: '/changelog', heading: 'Every release, clearly documented.' },
  ] as const;

  for (const route of routes) {
    test(`${route.path} exposes its primary heading`, async ({ page }) => {
      const assertNoRuntimeErrors = watchRuntimeErrors(page);

      await page.goto(`${DOCS_URL}${route.path}`);
      await settlePage(page);

      await expect(page.getByRole('heading', { level: 1, name: route.heading })).toBeVisible();
      await expect(page.locator('#docs-main')).toBeVisible();
      assertNoRuntimeErrors();
    });
  }
});

test.describe('Docs preview smoke contracts', () => {
  test('hydrates an exact query state on the shared Docs runtime', async ({ page }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);

    await page.goto(DOCS_URL);
    await settlePage(page);
    const docsEnvironment = await documentEnvironment(page);

    await page.goto(
      previewUrl({
        component: 'data-grid',
        scenario: 'stress',
        theme: 'dark',
        density: 'compact',
        direction: 'rtl',
      }),
    );
    await settlePage(page);

    await expect(page.getByTestId('docs-preview-root')).toBeVisible();
    await expect(page.getByTestId('preview-controls')).toHaveCount(0);
    await expect(page.getByTestId('component-specimen-data-grid')).toBeVisible();
    await expect(page.getByTestId('scenario-control')).toHaveCount(0);
    await expect(page.locator('.state-presets')).toHaveCount(0);
    const stage = page.getByTestId('specimen-stage');
    await expect(stage).toHaveAttribute('dir', 'rtl');
    await expect(stage).toHaveAttribute('data-krn-theme-mode', 'dark');
    await expect(stage).toHaveAttribute('data-krn-theme', 'dark');
    await expect(stage).toHaveAttribute('data-krn-density', 'compact');
    await expect(stage).toHaveAttribute('lang', 'en-US');
    await expect(stage).toHaveAttribute('data-krn-motion', 'system');
    await expect(page.getByTestId('component-specimen-data-grid')).toHaveAttribute(
      'data-scenario',
      'stress',
    );
    await expectDocumentEnvironment(page, docsEnvironment);
    assertNoRuntimeErrors();
  });

  test('hydrates Russian copy in an isolated preview URL', async ({ page }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);
    await page.goto(previewUrl({ component: 'button', locale: 'ru-RU' }));
    await settlePage(page);

    await expect(page.getByTestId('specimen-stage')).toHaveAttribute('lang', 'ru-RU');
    await expect(page.locator('.preview-header strong')).toHaveText('Button');
    await expect(page.getByRole('region', { name: 'Пример: Button' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Опубликовать изменения' })).toBeVisible();
    assertNoRuntimeErrors();
  });

  test('addresses component state through a stable, shareable preview URL', async ({ page }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);

    await page.goto(
      previewUrl({
        component: 'data-grid',
        scenario: 'states',
        theme: 'high-contrast',
        density: 'spacious',
        direction: 'rtl',
      }),
    );
    await settlePage(page);

    await expect(page).toHaveURL(/\/preview\/data-grid\?/);
    await expect(page).toHaveURL(/scenario=states/);
    const stage = page.getByTestId('specimen-stage');
    await expect(stage).toHaveAttribute('dir', 'rtl');
    await expect(stage).toHaveAttribute('data-krn-theme-mode', 'high-contrast');
    await expect(stage).toHaveAttribute('data-krn-theme', 'high-contrast');
    await expect(stage).toHaveAttribute('data-krn-density', 'spacious');
    await expect(page.getByTestId('component-specimen-data-grid')).toBeVisible();
    assertNoRuntimeErrors();
  });

  test('applies every header environment setting to the document and specimen', async ({
    page,
  }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);

    await page.goto(`${DOCS_URL}/components/data-grid`);
    await settlePage(page);

    const root = page.locator('html');
    const stage = page.getByTestId('specimen-stage');
    const previewPanel = page.locator('#preview-panel');
    const specimen = page.getByTestId('component-specimen-data-grid');

    for (const theme of ['system', 'light', 'dark'] as const) {
      await page.getByTestId('theme-control').selectOption(theme);
      await expectQueryParam(page, 'theme', theme === 'system' ? null : theme);
      await expect(stage).toHaveAttribute('data-krn-theme-mode', theme);
      await expect(root).toHaveAttribute('data-krn-theme-mode', theme);
      await expect
        .poll(async () => {
          const [stageSurface, specimenSurface] = await Promise.all([
            stage.evaluate((element) =>
              getComputedStyle(element).getPropertyValue('--krn-color-surface').trim(),
            ),
            specimen.evaluate((element) =>
              getComputedStyle(element).getPropertyValue('--krn-color-surface').trim(),
            ),
          ]);
          return stageSurface !== '' && stageSurface === specimenSurface;
        })
        .toBe(true);
    }

    const contrast = page.getByTestId('contrast-control');
    await page.getByTestId('theme-control').selectOption('dark');
    await contrast.click();
    await expectQueryParam(page, 'contrast', 'true');
    await expect(root).toHaveAttribute('data-krn-theme-mode', 'high-contrast');
    await expect(root).toHaveAttribute('data-krn-contrast-scheme', 'dark');
    await expect(stage).toHaveAttribute('data-krn-theme-mode', 'high-contrast');
    await expect(stage).toHaveAttribute('data-krn-contrast-scheme', 'dark');
    await page.getByTestId('theme-control').selectOption('light');
    await expect(root).toHaveAttribute('data-krn-contrast-scheme', 'light');
    await expect(stage).toHaveAttribute('data-krn-contrast-scheme', 'light');
    await contrast.click();

    for (const density of ['compact', 'comfortable', 'spacious'] as const) {
      await page.getByTestId('density-control').selectOption(density);
      await expectQueryParam(page, 'density', density === 'comfortable' ? null : density);
      await expect(stage).toHaveAttribute('data-krn-density', density);
      await expect(root).toHaveAttribute('data-krn-density', density);
      await expect
        .poll(async () => {
          const [stageHeight, specimenHeight] = await Promise.all([
            stage.evaluate((element) =>
              getComputedStyle(element).getPropertyValue('--krn-control-height-md').trim(),
            ),
            specimen.evaluate((element) =>
              getComputedStyle(element).getPropertyValue('--krn-control-height-md').trim(),
            ),
          ]);
          return stageHeight !== '' && stageHeight === specimenHeight;
        })
        .toBe(true);
    }

    for (const direction of ['ltr', 'rtl'] as const) {
      await page.getByTestId('direction-control').selectOption(direction);
      await expectQueryParam(page, 'direction', direction === 'ltr' ? null : direction);
      await expect(stage).toHaveAttribute('dir', direction);
      await expect(root).toHaveAttribute('dir', direction);
    }

    for (const locale of ['en-US', 'ru-RU'] as const) {
      await page.getByTestId('locale-control').selectOption(locale);
      await expectQueryParam(page, 'locale', locale === 'en-US' ? null : locale);
      await expect(stage).toHaveAttribute('lang', locale);
      await expect(root).toHaveAttribute('lang', locale);
    }

    for (const motion of ['system', 'reduce', 'full'] as const) {
      await page.getByTestId('motion-control').selectOption(motion);
      await expectQueryParam(page, 'motion', motion === 'system' ? null : motion);
      await expect(stage).toHaveAttribute('data-krn-motion', motion);
      await expect(root).toHaveAttribute('data-krn-motion', motion);
      await expect
        .poll(() =>
          stage.evaluate((element) => {
            const duration = getComputedStyle(element)
              .getPropertyValue('--krn-motion-duration-fast')
              .trim();
            return duration.endsWith('ms') ? Number.parseFloat(duration) : Number.NaN;
          }),
        )
        .toBe(motion === 'full' ? 90 : 0.01);
    }

    const brandControl = page.getByTestId('brand-color-control');
    const defaultBrand500 = await stage.evaluate((element) =>
      getComputedStyle(element).getPropertyValue('--krn-color-brand-500').trim(),
    );
    await brandControl.evaluate((element) => {
      const input = element as HTMLInputElement;
      input.value = '#d95831';
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await expectQueryParam(page, 'brandColor', '#d95831');
    await expect(brandControl).toHaveValue('#d95831');
    await expect
      .poll(() =>
        stage.evaluate((element) =>
          getComputedStyle(element).getPropertyValue('--krn-color-brand-500').trim(),
        ),
      )
      .not.toBe(defaultBrand500);
    await brandControl.evaluate((element) => {
      const input = element as HTMLInputElement;
      input.value = '#5818ff';
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await expectQueryParam(page, 'brandColor', null);

    for (const viewport of ['responsive', 'phone', 'tablet'] as const) {
      await page.getByTestId('viewport-control').selectOption(viewport);
      await expectQueryParam(page, 'viewport', viewport === 'responsive' ? null : viewport);
      await expect(previewPanel).toHaveAttribute('data-viewport', viewport);
    }

    assertNoRuntimeErrors();
  });

  test('live properties update the rendered component and URL contract', async ({ page }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);

    await page.goto(`${DOCS_URL}/preview/button`);
    await settlePage(page);

    const specimen = page.getByTestId('component-specimen-button');
    const primaryAction = specimen.getByRole('button', { name: 'Publish changes' });
    await expect(primaryAction).toHaveAttribute('data-variant', 'solid');
    await expect(primaryAction).toBeEnabled();
    await expect(page.locator('.state-presets')).toHaveCount(0);

    await page.getByRole('combobox', { name: 'Variant' }).selectOption('soft');
    await expect(page).toHaveURL(/arg\.variant=soft/);
    await expect(primaryAction).toHaveAttribute('data-variant', 'soft');

    await expect(specimen.getByRole('button', { name: 'Unavailable' })).toBeDisabled();

    await page.getByRole('checkbox', { name: 'Loading' }).check();
    await expectQueryParam(page, 'arg.loading', 'true');
    await expect(primaryAction).toHaveAttribute('data-loading', 'true');
    await expect(primaryAction).toHaveAttribute('aria-disabled', 'true');
    await expect(primaryAction.getByRole('status')).toHaveText('Loading…');
    assertNoRuntimeErrors();
  });

  test('reset restores locally changed component models even when the URL is already canonical', async ({
    page,
  }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);

    await page.goto(`${DOCS_URL}/preview/toggle-button`);
    await settlePage(page);

    const toggle = page
      .getByTestId('component-specimen-toggle-button')
      .getByRole('button', { name: 'Watch changes' });
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(page).toHaveURL(`${DOCS_URL}/preview/toggle-button`);

    await page.getByRole('button', { name: 'Reset', exact: true }).click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await expect(page).toHaveURL(`${DOCS_URL}/preview/toggle-button`);
    assertNoRuntimeErrors();
  });

  test('keeps incompatible data-grid expansion and virtualization controls canonical', async ({
    page,
  }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);

    await page.goto(previewUrl({ component: 'data-grid' }));
    await settlePage(page);

    const expandable = page.getByRole('checkbox', { name: 'Expandable' });
    const virtualize = page.getByRole('checkbox', { name: 'Virtualize' });
    await expect(expandable).toBeChecked();
    await expect(virtualize).not.toBeChecked();

    await virtualize.check();
    await expectQueryParam(page, 'arg.virtualize', 'true');
    await expectQueryParam(page, 'arg.expandable', null);
    await expect(expandable).not.toBeChecked();
    await expect(virtualize).toBeChecked();

    await expandable.check();
    await expectQueryParam(page, 'arg.virtualize', null);
    await expectQueryParam(page, 'arg.expandable', null);
    await expect(expandable).toBeChecked();
    await expect(virtualize).not.toBeChecked();
    assertNoRuntimeErrors();
  });

  test('round-trips valid URL state and canonicalizes invalid or unknown values', async ({
    page,
  }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);

    await page.goto(DOCS_URL);
    await settlePage(page);
    const docsEnvironment = await documentEnvironment(page);

    await page.goto(
      previewUrl({
        component: 'button',
        theme: 'high-contrast',
        density: 'spacious',
        direction: 'rtl',
        locale: 'ru-RU',
        motion: 'reduce',
        brandColor: '#d95831',
        viewport: 'phone',
        state: 'loading',
        args: { variant: 'soft' },
      }),
    );
    await settlePage(page);

    const sharedUrl = page.url();
    const primaryAction = page
      .getByTestId('component-specimen-button')
      .getByRole('button', { name: /^(Publish changes|Опубликовать изменения)$/ });
    await expect(primaryAction).toHaveAttribute('data-variant', 'soft');
    await expect(primaryAction).not.toHaveAttribute('aria-busy');
    await expect(primaryAction.getByRole('status')).toHaveText('Загрузка…');
    const stage = page.getByTestId('specimen-stage');
    await expect(stage).toHaveAttribute('data-state', 'loading');
    await expect(stage).toHaveAttribute('data-krn-motion', 'reduce');
    await expect(stage).toHaveAttribute('data-krn-theme-mode', 'high-contrast');
    await expect(stage).toHaveAttribute('data-krn-density', 'spacious');
    await expect(stage).toHaveAttribute('dir', 'rtl');
    await expect(stage).toHaveAttribute('lang', 'ru-RU');
    await expect(page.locator('#preview-panel')).toHaveAttribute('data-viewport', 'phone');

    await page.reload();
    await settlePage(page);
    await expect(page).toHaveURL(sharedUrl);
    await expect(page.getByRole('combobox', { name: 'Variant' })).toHaveValue('soft');
    await expect(page.getByRole('checkbox', { name: 'Loading' })).toBeChecked();
    await expect(stage).toHaveAttribute('data-krn-motion', 'reduce');
    await expect(primaryAction).toHaveAttribute('data-variant', 'soft');
    await expect(primaryAction).not.toHaveAttribute('aria-busy');
    await expect(primaryAction.getByRole('status')).toHaveText('Загрузка…');

    await page.goto(
      `${DOCS_URL}/preview/button?theme=sepia&density=tiny&direction=sideways&locale=xx-YY` +
        '&motion=warp&brandColor=red&viewport=watch&scenario=virtual&state=imaginary&arg.variant=neon' +
        '&arg.disabled=maybe&arg.unknown=injected',
    );
    await settlePage(page);

    await expect(stage).toHaveAttribute('data-krn-theme-mode', 'system');
    await expect(stage).toHaveAttribute('data-krn-density', 'comfortable');
    await expect(stage).toHaveAttribute('dir', 'ltr');
    await expect(stage).toHaveAttribute('lang', 'en-US');
    await expect(stage).toHaveAttribute('data-krn-motion', 'system');
    await expect(page.locator('#preview-panel')).toHaveAttribute('data-viewport', 'responsive');
    await expect(page.getByTestId('scenario-control')).toHaveCount(0);
    await expect(page.getByRole('combobox', { name: 'Variant' })).toHaveValue('solid');
    await expect(page.getByRole('checkbox', { name: 'Loading' })).not.toBeChecked();
    await expect(primaryAction).toHaveAttribute('data-variant', 'solid');
    await expect(primaryAction).toBeEnabled();
    await expect(page.getByTestId('specimen-stage')).toHaveAttribute('data-state', 'default');

    await expect
      .poll(() => {
        const params = new URL(page.url()).searchParams;
        return (
          params.get('theme') !== 'sepia' &&
          params.get('density') !== 'tiny' &&
          params.get('direction') !== 'sideways' &&
          params.get('locale') !== 'xx-YY' &&
          params.get('motion') !== 'warp' &&
          params.get('brandColor') !== 'red' &&
          params.get('viewport') !== 'watch' &&
          params.get('scenario') !== 'virtual' &&
          params.get('state') !== 'imaginary' &&
          params.get('arg.variant') !== 'neon' &&
          params.get('arg.disabled') !== 'maybe' &&
          !params.has('arg.unknown')
        );
      })
      .toBe(true);

    await expectDocumentEnvironment(page, docsEnvironment);
    assertNoRuntimeErrors();
  });

  test('uses replace history for transient range updates', async ({ page }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);

    await page.goto(DOCS_URL);
    await settlePage(page);
    await page.goto(previewUrl({ component: 'progress-bar' }));
    await settlePage(page);

    const historyLength = await page.evaluate(() => history.length);
    const valueControl = page.getByRole('slider', { name: 'Value' });
    for (const value of ['12', '37', '82']) {
      await valueControl.evaluate((element, nextValue) => {
        const input = element as HTMLInputElement;
        input.value = nextValue;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }, value);
      await expectQueryParam(page, 'arg.value', value);
    }

    await expect.poll(() => page.evaluate(() => history.length)).toBe(historyLength);
    await expect(
      page.getByTestId('component-specimen-progress-bar').getByText('82%', { exact: false }),
    ).toBeVisible();

    await page.goBack();
    await expect(page).toHaveURL(`${DOCS_URL}/`);
    assertNoRuntimeErrors();
  });

  test('recreates locale providers and preserves RTL semantics', async ({ page }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);

    await page.goto(DOCS_URL);
    await settlePage(page);
    const docsEnvironment = await documentEnvironment(page);

    await page.goto(
      previewUrl({
        component: 'select',
        state: 'async-loading',
        locale: 'ru-RU',
        direction: 'rtl',
      }),
    );
    await settlePage(page);

    const stage = page.getByTestId('specimen-stage');
    await expect(stage).toHaveAttribute('lang', 'ru-RU');
    await expect(stage).toHaveAttribute('dir', 'rtl');
    await expectDocumentEnvironment(page, docsEnvironment);
    const select = page
      .getByTestId('component-specimen-select')
      .getByRole('combobox', { name: 'Workspace plan' });
    await expect(select).toHaveAttribute('aria-busy', 'true');
    await select.click();
    await expect(page.getByRole('status').getByText('Загрузка вариантов…')).toBeVisible();

    await page.goto(previewUrl({ component: 'select', state: 'async-loading', direction: 'rtl' }));
    await settlePage(page);
    await expect(stage).toHaveAttribute('lang', 'en-US');
    await expect(stage).toHaveAttribute('dir', 'rtl');
    await expect(select).toHaveAttribute('aria-busy', 'true');
    await select.click();
    await expect(page.getByRole('status').getByText('Loading options…')).toBeVisible();
    await expectDocumentEnvironment(page, docsEnvironment);
    assertNoRuntimeErrors();
  });

  test('materializes configured bindings without claiming the live output was AOT verified', async ({
    page,
  }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);

    await page.goto(
      previewUrl({
        component: 'button',
        args: {
          loading: true,
          size: 'sm',
          tone: 'danger',
          variant: 'soft',
        },
      }),
    );
    await settlePage(page);
    await page.getByRole('button', { name: 'Code', exact: true }).click();

    const codePanel = page.locator('#code-panel');
    await expect(codePanel).toBeVisible();
    await expect(codePanel).not.toContainText(
      'Strict AOT verified against the packed npm artifact.',
    );
    await expect(codePanel).toContainText('<button krnButton');
    await expect(codePanel).not.toContainText('<button[krnButton]');
    await expect(codePanel).toContainText(`[variant]="'soft'"`);
    await expect(codePanel).toContainText(`[tone]="'danger'"`);
    await expect(codePanel).toContainText(`[size]="'sm'"`);
    await expect(codePanel).toContainText(`[loading]="true"`);
    await expect(codePanel).not.toContainText('Public input');
    assertNoRuntimeErrors();
  });
});
