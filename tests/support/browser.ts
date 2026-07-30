import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { expect, type Page } from '@playwright/test';

export const DOCS_URL = 'http://localhost:4200';
export const PREVIEW_URL = DOCS_URL;

export type PreviewScenario = 'default' | 'states' | 'stress' | 'virtual';
export type PreviewTheme = 'system' | 'light' | 'dark' | 'high-contrast';
export type PreviewDensity = 'compact' | 'comfortable' | 'spacious';
export type PreviewDirection = 'ltr' | 'rtl';
export type PreviewLocale = 'en-US' | 'ru-RU';
export type PreviewMotion = 'system' | 'reduce' | 'full';
export type PreviewViewport = 'responsive' | 'phone' | 'tablet';
export type PreviewArgument = string | number | boolean | null;

export interface PreviewUrlState {
  readonly component?: string;
  readonly scenario?: PreviewScenario;
  readonly theme?: PreviewTheme;
  readonly density?: PreviewDensity;
  readonly direction?: PreviewDirection;
  readonly locale?: PreviewLocale;
  readonly motion?: PreviewMotion;
  readonly brandColor?: string;
  readonly viewport?: PreviewViewport;
  readonly state?: string;
  readonly args?: Readonly<Record<string, PreviewArgument>>;
}

interface ComponentManifest {
  readonly components: readonly {
    readonly id: string;
    readonly playground: {
      readonly scenarios: readonly PreviewScenario[];
    };
  }[];
}

const componentManifest = JSON.parse(
  readFileSync(resolve(process.cwd(), 'metadata/agent/generated/component-manifest.json'), 'utf8'),
) as ComponentManifest;
const componentScenarios = new Map(
  componentManifest.components.map((component) => [
    component.id,
    new Set(component.playground.scenarios),
  ]),
);

export function previewUrl(state: PreviewUrlState = {}): string {
  const componentId = state.component ?? 'button';
  const scenario = state.scenario ?? 'default';
  const supportedScenarios = componentScenarios.get(componentId);
  if (!supportedScenarios) {
    throw new Error(`Unknown KERN preview component "${componentId}".`);
  }
  if (!supportedScenarios.has(scenario)) {
    throw new Error(
      `Unsupported preview scenario "${scenario}" for "${componentId}". ` +
        `Supported scenarios: ${[...supportedScenarios].join(', ')}.`,
    );
  }

  const component = encodeURIComponent(componentId);
  const query = new URLSearchParams({
    scenario,
    theme: state.theme ?? 'light',
    density: state.density ?? 'comfortable',
    direction: state.direction ?? 'ltr',
    locale: state.locale ?? 'en-US',
  });
  if (state.viewport !== undefined) query.set('viewport', state.viewport);
  if (state.motion !== undefined) query.set('motion', state.motion);
  if (state.brandColor !== undefined) query.set('brandColor', state.brandColor);
  if (state.state !== undefined) query.set('state', state.state);
  for (const [key, value] of Object.entries(state.args ?? {})) {
    query.set(`arg.${key}`, String(value));
  }
  return `${PREVIEW_URL}/preview/${component}?${query.toString()}`;
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
