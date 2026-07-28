import { expect, type Page } from '@playwright/test';

export const DOCS_URL = 'http://localhost:4200';
export const LAB_URL = 'http://localhost:4201';

export type LabScenario = 'default' | 'states' | 'stress' | 'virtual';
export type LabTheme = 'light' | 'dark' | 'high-contrast';
export type LabDensity = 'compact' | 'comfortable' | 'spacious';
export type LabDirection = 'ltr' | 'rtl';

interface LabUrlState {
  readonly component?: string;
  readonly scenario?: LabScenario;
  readonly theme?: LabTheme;
  readonly density?: LabDensity;
  readonly direction?: LabDirection;
}

export function labUrl(state: LabUrlState = {}): string {
  const query = new URLSearchParams({
    component: state.component ?? 'button',
    scenario: state.scenario ?? 'default',
    theme: state.theme ?? 'light',
    density: state.density ?? 'comfortable',
    direction: state.direction ?? 'ltr',
  });
  return `${LAB_URL}/?${query.toString()}`;
}

export async function settlePage(page: Page): Promise<void> {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForLoadState('networkidle');
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
}

export function watchRuntimeErrors(page: Page): () => void {
  const errors: string[] = [];

  page.on('pageerror', (error) => {
    errors.push(`pageerror: ${error.message}`);
  });
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(`console: ${message.text()}`);
    }
  });

  return () => {
    expect(errors, errors.join('\n')).toEqual([]);
  };
}

export async function expectNoPageOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => {
    const root = document.documentElement;
    return root.scrollWidth - root.clientWidth;
  });
  expect(overflow, `page overflowed horizontally by ${overflow}px`).toBeLessThanOrEqual(1);
}
