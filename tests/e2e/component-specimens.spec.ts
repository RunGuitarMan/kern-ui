import { expect, test, type Page } from '@playwright/test';

import { KERN_CATALOG } from '../../projects/showcase/src/lib/catalog';
import { DOCS_URL, expectNoPageOverflow, settlePage, watchRuntimeErrors } from '../support/browser';

const ERROR_OVERLAY_SELECTOR = [
  'vite-error-overlay',
  'ng-error-overlay',
  'angular-error-overlay',
  '#vite-error-overlay',
  '#ng-error-overlay',
  '.vite-error-overlay',
  '.ng-error-overlay',
].join(', ');

async function openSpecimen(page: Page, id: string): Promise<void> {
  await page.goto(`${DOCS_URL}/components/${id}`);
  await settlePage(page);
  await expect(page.getByTestId(`component-specimen-${id}`)).toBeVisible();
}

test.describe('Complete component specimen routing', () => {
  test('raw SSR response contains every exact catalog route specimen and hydration preserves every server-rendered specimen node', async ({
    page,
  }) => {
    test.setTimeout(240_000);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addInitScript(() => {
      const state = globalThis as typeof globalThis & {
        __krnServerSpecimen?: Element;
        __krnServerSpecimenNodes?: Node[];
        __krnServerCaptureComplete?: boolean;
      };
      let observer: MutationObserver | undefined;
      const captureServerNodes = (force = false): void => {
        if (!force && document.readyState !== 'loading') return;
        const specimen = document.querySelector('[data-testid^="component-specimen-"]');
        if (!specimen) return;
        state.__krnServerSpecimen ??= specimen;
        const nodes: Node[] = [specimen];
        const walker = document.createTreeWalker(specimen, NodeFilter.SHOW_ALL);
        for (let node = walker.nextNode(); node; node = walker.nextNode()) nodes.push(node);
        state.__krnServerSpecimenNodes = nodes;
      };
      const finishServerCapture = (): void => {
        if (document.readyState === 'loading') return;
        captureServerNodes(true);
        observer?.disconnect();
        state.__krnServerCaptureComplete = true;
      };
      observer = new MutationObserver(() => captureServerNodes());
      observer.observe(document, {
        childList: true,
        subtree: true,
      });
      document.addEventListener('readystatechange', finishServerCapture);
      captureServerNodes();
      finishServerCapture();
    });

    let activeRoute = 'bootstrap';
    const runtimeErrors: string[] = [];
    page.on('pageerror', (error) => {
      runtimeErrors.push(`[${activeRoute}] pageerror: ${error.message}`);
    });
    page.on('console', (message) => {
      if (message.type() === 'error') {
        runtimeErrors.push(`[${activeRoute}] console: ${message.text()}`);
      }
    });

    expect(KERN_CATALOG).toHaveLength(132);

    for (const item of KERN_CATALOG) {
      activeRoute = item.id;
      const errorsBeforeRoute = runtimeErrors.length;
      const response = await page.goto(`${DOCS_URL}/components/${item.id}`, {
        waitUntil: 'domcontentloaded',
      });

      expect.soft(response?.ok(), `${item.id}: route returned a successful response`).toBe(true);
      const serverHtml = (await response?.text()) ?? '';
      const rawServerSnapshot = {
        hasExactSpecimen: serverHtml.includes(`data-testid="component-specimen-${item.id}"`),
        hasSpecimenIdentity: serverHtml.includes(`data-specimen="${item.id}"`),
        hasDeferPlaceholder: serverHtml.includes('class="specimen-loading"'),
      };
      expect
        .soft(rawServerSnapshot.hasExactSpecimen, `${item.id}: raw response has exact specimen`)
        .toBe(true);
      expect
        .soft(
          rawServerSnapshot.hasSpecimenIdentity,
          `${item.id}: raw response has specimen identity`,
        )
        .toBe(true);
      expect
        .soft(
          rawServerSnapshot.hasDeferPlaceholder,
          `${item.id}: raw response contains no defer placeholder`,
        )
        .toBe(false);

      await page
        .getByTestId(`component-specimen-${item.id}`)
        .waitFor({ state: 'attached', timeout: 10_000 })
        .catch(() => undefined);
      await page.waitForFunction(
        () =>
          Boolean(
            (
              globalThis as typeof globalThis & {
                __krnServerCaptureComplete?: boolean;
              }
            ).__krnServerCaptureComplete,
          ),
        undefined,
        { timeout: 10_000 },
      );
      // A retained server node is not proof of hydration by itself. Waiting for network idle makes
      // the route and defer chunks part of the gate, including deliberately delayed chunk responses.
      await page.waitForLoadState('networkidle', { timeout: 10_000 });
      await page.evaluate(async () => {
        await document.fonts.ready;
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        });
      });

      const snapshot = await page.evaluate(
        ({ id, overlaySelector }) => {
          const state = globalThis as typeof globalThis & {
            __krnServerSpecimen?: Element;
            __krnServerSpecimenNodes?: Node[];
            __krnServerCaptureComplete?: boolean;
          };
          const specimens = [
            ...document.querySelectorAll<HTMLElement>('[data-testid^="component-specimen-"]'),
          ];
          const exactSpecimen = document.querySelector<HTMLElement>(
            `[data-testid="component-specimen-${id}"]`,
          );
          const specimenRect = exactSpecimen?.getBoundingClientRect();
          const root = document.documentElement;
          const serverNodes = state.__krnServerSpecimenNodes ?? [];
          const preservedServerNodes = serverNodes.filter(
            (node) =>
              node.isConnected &&
              (node === exactSpecimen || Boolean(exactSpecimen?.contains(node))),
          );

          return {
            title: document.title,
            primaryH1: document
              .querySelector('article.page > .component-header h1')
              ?.textContent?.trim(),
            specimenTestIds: specimens.map((specimen) => specimen.dataset['testid']),
            dataSpecimen: exactSpecimen?.dataset['specimen'],
            selectorText: exactSpecimen?.querySelector('.specimen-ident code')?.textContent?.trim(),
            errorOverlayCount: document.querySelectorAll(overlaySelector).length,
            missingSpecimenCount: exactSpecimen?.querySelectorAll('.missing-specimen').length ?? 0,
            pendingSpecimenCount: exactSpecimen?.querySelectorAll('.specimen-loading').length ?? 0,
            hasCompileFailureText: /failed to compile|internal server error|uncaught error/i.test(
              document.body.innerText,
            ),
            horizontalOverflow:
              Math.max(root.scrollWidth, document.body.scrollWidth) - root.clientWidth,
            specimenWidth: specimenRect?.width ?? 0,
            specimenHeight: specimenRect?.height ?? 0,
            specimenOutsideViewport:
              specimenRect === undefined ||
              specimenRect.left < -2 ||
              specimenRect.right > window.innerWidth + 2,
            serverNodeCount: serverNodes.length,
            preservedServerNodeCount: preservedServerNodes.length,
            serverSpecimenPreserved: state.__krnServerSpecimen === exactSpecimen,
            serverCaptureComplete: state.__krnServerCaptureComplete === true,
          };
        },
        { id: item.id, overlaySelector: ERROR_OVERLAY_SELECTOR },
      );

      expect.soft(snapshot.title, `${item.id}: document title`).toBe(`${item.name} · Kern`);
      expect.soft(snapshot.primaryH1, `${item.id}: exact page h1`).toBe(item.name);
      expect
        .soft(snapshot.specimenTestIds, `${item.id}: one route-specific specimen`)
        .toEqual([`component-specimen-${item.id}`]);
      expect.soft(snapshot.dataSpecimen, `${item.id}: data-specimen`).toBe(item.id);
      expect.soft(snapshot.selectorText, `${item.id}: selector label`).toBe(item.selector);
      expect.soft(snapshot.errorOverlayCount, `${item.id}: Angular/Vite error overlay`).toBe(0);
      expect.soft(snapshot.missingSpecimenCount, `${item.id}: focused renderer exists`).toBe(0);
      expect.soft(snapshot.pendingSpecimenCount, `${item.id}: renderer finished loading`).toBe(0);
      expect
        .soft(snapshot.hasCompileFailureText, `${item.id}: compile failure message`)
        .toBe(false);
      expect
        .soft(snapshot.horizontalOverflow, `${item.id}: page horizontal overflow`)
        .toBeLessThanOrEqual(2);
      expect
        .soft(snapshot.specimenWidth, `${item.id}: specimen has measurable width`)
        .toBeGreaterThan(16);
      expect
        .soft(snapshot.specimenHeight, `${item.id}: specimen has measurable height`)
        .toBeGreaterThan(16);
      expect
        .soft(snapshot.specimenOutsideViewport, `${item.id}: specimen stays in the viewport`)
        .toBe(false);
      expect
        .soft(snapshot.serverNodeCount, `${item.id}: server rendered a non-empty specimen subtree`)
        .toBeGreaterThan(1);
      expect
        .soft(snapshot.serverCaptureComplete, `${item.id}: server DOM capture completed`)
        .toBe(true);
      expect
        .soft(snapshot.serverSpecimenPreserved, `${item.id}: hydration retained the specimen root`)
        .toBe(true);
      expect
        .soft(
          snapshot.preservedServerNodeCount,
          `${item.id}: hydration retained every server-rendered specimen node`,
        )
        .toBe(snapshot.serverNodeCount);

      const routeErrors = runtimeErrors.slice(errorsBeforeRoute);
      expect.soft(routeErrors, `${item.id}: browser runtime errors`).toEqual([]);
    }

    expect(runtimeErrors, runtimeErrors.join('\n')).toEqual([]);
  });
});

test.describe('Representative live specimen interactions', () => {
  test('client-side component navigation immediately materializes the next specimen', async ({
    page,
  }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);
    await openSpecimen(page, 'dropdown-button');

    await page.locator('.component-pager a.next').click();
    await expect(page).toHaveURL(/\/components\/form-field$/);
    const specimen = page.getByTestId('component-specimen-form-field');
    await expect(specimen).toBeVisible();
    await expect(specimen.locator('.specimen-loading')).toHaveCount(0);
    assertNoRuntimeErrors();
  });

  test('buttons activate and form values can be edited', async ({ page }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);

    await openSpecimen(page, 'button');
    const buttonSpecimen = page.getByTestId('component-specimen-button');
    const publish = buttonSpecimen.getByRole('button', {
      name: 'Publish changes',
      exact: true,
    });
    await expect(publish).toBeEnabled();
    await publish.focus();
    await page.keyboard.press('Enter');
    const loading = buttonSpecimen.getByRole('button', { name: 'Publishing' });
    await expect(loading).not.toHaveAttribute('disabled');
    await expect(loading).not.toHaveAttribute('aria-busy');
    await expect(loading).toHaveAttribute('aria-disabled', 'true');
    await expect(loading.getByRole('status')).toHaveText('Loading…');
    await expect(buttonSpecimen.getByRole('button', { name: 'Unavailable' })).toBeDisabled();

    await openSpecimen(page, 'text-input');
    const workspaceName = page
      .getByTestId('component-specimen-text-input')
      .locator('input[placeholder="Northstar"]');
    await workspaceName.fill('Aurora');
    await expect(workspaceName).toHaveValue('Aurora');
    await expectNoPageOverflow(page);

    assertNoRuntimeErrors();
  });

  test('tabs support pointer and arrow-key selection', async ({ page }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);
    await openSpecimen(page, 'tabs');

    const specimen = page.getByTestId('component-specimen-tabs');
    const activityTab = specimen.getByRole('tab', { name: /Activity/ });
    const settingsTab = specimen.getByRole('tab', { name: 'Settings' });

    await activityTab.click();
    await expect(activityTab).toHaveAttribute('aria-selected', 'true');
    await activityTab.press('ArrowRight');
    await expect(settingsTab).toBeFocused();
    await expect(settingsTab).toHaveAttribute('aria-selected', 'true');

    assertNoRuntimeErrors();
  });

  test('dialog focus lifecycle and toast dismissal work', async ({ page }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);

    await openSpecimen(page, 'dialog');
    const editWorkspace = page.getByRole('button', { name: 'Edit workspace' });
    await editWorkspace.click();
    await expect(page.getByRole('dialog', { name: 'Edit workspace' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Edit workspace' })).toHaveCount(0);
    await expect(editWorkspace).toBeFocused();

    await openSpecimen(page, 'toast');
    await page.getByRole('button', { name: 'Show success toast' }).click();
    const toast = page.locator('.toast[role="status"]');
    await expect(toast).toContainText('Changes saved');
    await expect(toast).toContainText('Workspace settings were published.');
    await page.getByRole('button', { name: 'Dismiss notification' }).click();
    await expect(toast).toHaveCount(0);

    assertNoRuntimeErrors();
  });

  test('data grid sorts, selects, expands, and filters rows', async ({ page }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);
    await openSpecimen(page, 'data-grid');

    const specimen = page.getByTestId('component-specimen-data-grid');
    const workspaceHeader = specimen.getByRole('columnheader', { name: /Workspace/ });
    await workspaceHeader.getByRole('button').click();
    await expect(workspaceHeader).toHaveAttribute('aria-sort', 'ascending');

    const firstRowSelection = specimen.getByRole('checkbox', { name: 'Select row 1' });
    await firstRowSelection.click();
    await expect(firstRowSelection).toBeChecked();

    await specimen.getByRole('button', { name: 'Expand row' }).first().click();
    await expect(specimen.locator('.detail-row')).toContainText('is owned by');

    await specimen.getByPlaceholder('Filter rows…').fill('Fieldnote');
    await expect(specimen.getByText('1 row', { exact: true })).toBeVisible();
    await expect(specimen).toContainText('Fieldnote');

    assertNoRuntimeErrors();
  });

  test('login, profile, and multi-step pattern forms expose working state', async ({ page }) => {
    const assertNoRuntimeErrors = watchRuntimeErrors(page);

    await openSpecimen(page, 'login-form');
    const login = page.getByTestId('component-specimen-login-form');
    await login.getByLabel(/Email/).fill('not-an-email');
    await login.getByLabel(/Password/).fill('short');
    await login.getByLabel(/Email/).blur();
    await expect(
      login.getByRole('alert').filter({ hasText: 'Enter a valid email address.' }),
    ).toBeVisible();
    await login.getByLabel(/Email/).fill('avery@example.com');
    await login.getByLabel(/Password/).fill('correct-horse');
    await expect(login.getByRole('button', { name: 'Sign in' })).toBeEnabled();

    await openSpecimen(page, 'profile-form');
    const profile = page.getByTestId('component-specimen-profile-form');
    await profile.getByLabel(/Display name/).fill('Avery Stone');
    await expect(profile.getByRole('status')).toHaveText('Unsaved changes');
    await expect(profile.getByRole('button', { name: 'Save profile' })).toBeEnabled();

    await openSpecimen(page, 'multi-step-form');
    const multiStep = page.getByTestId('component-specimen-multi-step-form');
    await multiStep.getByRole('button', { name: 'Continue' }).click();
    await expect(multiStep.locator('.step-copy h3')).toHaveText('People');
    await expect(multiStep).toContainText('Step 2 of 3');
    await multiStep.getByRole('button', { name: 'Back' }).click();
    await expect(multiStep.locator('.step-copy h3')).toHaveText('Workspace');

    assertNoRuntimeErrors();
  });
});
