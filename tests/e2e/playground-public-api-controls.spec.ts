import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { expect, test, type Locator, type Page } from '@playwright/test';

import { previewUrl, settlePage, watchRuntimeErrors } from '../support/browser';

type PlaygroundValue = string | number | boolean | null;
type ControlKind = 'boolean' | 'number' | 'range' | 'select' | 'text';
type PublicBinding =
  | { readonly kind: 'input'; readonly publicName: string }
  | { readonly kind: 'model'; readonly publicName: string };

interface ManifestControl {
  readonly key: string;
  readonly label: string;
  readonly kind: ControlKind;
  readonly defaultValue: PlaygroundValue;
  readonly testValue: PlaygroundValue;
  readonly binding:
    PublicBinding | { readonly kind: 'fixture' | 'composition'; readonly publicName?: never };
  readonly options?: readonly { readonly label: string; readonly value: PlaygroundValue }[];
  readonly min?: number;
  readonly max?: number;
}

interface PlaygroundManifest {
  readonly components: readonly {
    readonly id: string;
    readonly playground: {
      readonly controls: readonly ManifestControl[];
    };
  }[];
}

type PublicControl = ManifestControl & { readonly binding: PublicBinding };

type FingerprintChannel = 'aria' | 'dom' | 'forms' | 'presentation';

interface FingerprintValue {
  readonly hash: string;
  readonly length: number;
}

interface SpecimenFingerprint {
  readonly aria: FingerprintValue;
  readonly dom: FingerprintValue;
  readonly forms: FingerprintValue;
  readonly presentation: FingerprintValue;
}

function isPublicControl(control: ManifestControl): control is PublicControl {
  return control.binding.kind === 'input' || control.binding.kind === 'model';
}

function assertTestValue(componentId: string, control: PublicControl): void {
  const context = `${componentId}.${control.key}`;
  if (Object.is(control.testValue, control.defaultValue)) {
    throw new Error(`${context}: testValue must differ from defaultValue.`);
  }
  if (control.kind !== 'select' && typeof control.testValue !== typeof control.defaultValue) {
    throw new Error(`${context}: testValue and defaultValue must have the same scalar type.`);
  }
  if (
    control.kind === 'select' &&
    !control.options?.some(({ value }) => Object.is(value, control.testValue))
  ) {
    throw new Error(`${context}: testValue must be one of the select options.`);
  }
  if (
    (control.kind === 'number' || control.kind === 'range') &&
    (typeof control.testValue !== 'number' ||
      control.testValue < (control.min ?? Number.NEGATIVE_INFINITY) ||
      control.testValue > (control.max ?? Number.POSITIVE_INFINITY))
  ) {
    throw new Error(`${context}: numeric testValue must stay within the control bounds.`);
  }
}

const playgroundManifest = JSON.parse(
  readFileSync(resolve(process.cwd(), 'metadata/agent/generated/component-manifest.json'), 'utf8'),
) as PlaygroundManifest;
if (!Array.isArray(playgroundManifest.components) || playgroundManifest.components.length === 0) {
  throw new Error('The generated KERN component manifest has no component playground contracts.');
}

const componentIds = new Set<string>();
const publicDefinitions = playgroundManifest.components
  .map((component) => {
    if (componentIds.has(component.id)) {
      throw new Error(`Duplicate component "${component.id}" in the generated KERN manifest.`);
    }
    componentIds.add(component.id);
    if (!Array.isArray(component.playground.controls)) {
      throw new Error(`${component.id}: generated playground controls must be an array.`);
    }
    const controls = component.playground.controls.filter(isPublicControl);
    for (const control of controls) assertTestValue(component.id, control);
    return { id: component.id, controls };
  })
  .filter(({ controls }) => controls.length > 0);

function escapeAttributeValue(value: string): string {
  return value.replaceAll('\\', '\\\\').replaceAll('"', '\\"');
}

function propertyControl(page: Page, key: string): Locator {
  return page.locator(
    `.property-panel label[data-control-key="${escapeAttributeValue(key)}"] input, ` +
      `.property-panel label[data-control-key="${escapeAttributeValue(key)}"] select`,
  );
}

async function readControlValue(field: Locator, control: PublicControl): Promise<PlaygroundValue> {
  const value = await field.evaluate((element, kind) => {
    if (kind === 'boolean') return (element as HTMLInputElement).checked;
    if (kind === 'number' || kind === 'range') return Number((element as HTMLInputElement).value);
    return (element as HTMLInputElement | HTMLSelectElement).value;
  }, control.kind);
  if (control.kind !== 'select') return value;
  return (
    control.options?.find((option) => String(option.value) === value)?.value ?? control.defaultValue
  );
}

async function setControlValue(
  field: Locator,
  control: PublicControl,
  value: PlaygroundValue,
): Promise<void> {
  await field.evaluate(
    (element, payload) => {
      if (payload.kind === 'boolean') {
        (element as HTMLInputElement).checked = Boolean(payload.value);
        element.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
        return;
      }

      (element as HTMLInputElement | HTMLSelectElement).value = String(payload.value);
      element.dispatchEvent(
        new Event(payload.kind === 'range' ? 'input' : 'change', {
          bubbles: true,
          composed: true,
        }),
      );
    },
    { kind: control.kind, value },
  );
}

async function specimenFingerprint(page: Page, componentId: string): Promise<SpecimenFingerprint> {
  return page.evaluate((id) => {
    const specimen = document.querySelector<HTMLElement>(
      `[data-testid="component-specimen-${CSS.escape(id)}"]`,
    );
    if (!specimen) throw new Error(`Missing rendered specimen for "${id}".`);

    // The specimen header and playground controls intentionally describe the
    // requested arguments. They are excluded so that this gate can only pass
    // when the rendered component canvas or its scoped overlay actually changes.
    const roots = [
      specimen.querySelector<HTMLElement>('.specimen-canvas'),
      document.querySelector<HTMLElement>('[data-krn-preview-overlay-host]'),
    ].filter((root): root is HTMLElement => root !== null);
    const elements = roots.flatMap((root) => [root, ...root.querySelectorAll<HTMLElement>('*')]);

    const stableHash = (source: string): FingerprintValue => {
      let hash = 0x811c9dc5;
      for (let index = 0; index < source.length; index += 1) {
        hash ^= source.charCodeAt(index);
        hash = Math.imul(hash, 0x01000193);
      }
      return {
        hash: (hash >>> 0).toString(16).padStart(8, '0'),
        length: source.length,
      };
    };
    const rounded = (value: number): number => Math.round(value * 100) / 100;

    const dom = roots
      .map((root) => `${root.tagName.toLowerCase()}:${root.innerHTML}`)
      .join('\n--- scoped-root ---\n');
    const aria = elements
      .map((element, index) => {
        const semantics = [...element.attributes]
          .filter(
            ({ name }) =>
              name === 'role' ||
              name === 'alt' ||
              name === 'for' ||
              name === 'hidden' ||
              name === 'inert' ||
              name === 'tabindex' ||
              name === 'title' ||
              name.startsWith('aria-'),
          )
          .map(({ name, value }) => `${name}=${value}`)
          .sort()
          .join(';');
        return `${index}:${element.tagName.toLowerCase()}:${semantics}`;
      })
      .join('\n');
    const forms = elements
      .filter(
        (
          element,
        ): element is
          | HTMLButtonElement
          | HTMLDetailsElement
          | HTMLDialogElement
          | HTMLInputElement
          | HTMLMeterElement
          | HTMLOptionElement
          | HTMLProgressElement
          | HTMLSelectElement
          | HTMLTextAreaElement =>
          element.matches(
            'button, details, dialog, input, meter, option, progress, select, textarea',
          ),
      )
      .map((element, index) => {
        const state: Record<string, boolean | number | string> = {
          disabled: 'disabled' in element ? element.disabled : false,
          tag: element.tagName.toLowerCase(),
        };
        if ('value' in element) state['value'] = element.value;
        if (element instanceof HTMLInputElement) {
          state['checked'] = element.checked;
          state['indeterminate'] = element.indeterminate;
          state['readOnly'] = element.readOnly;
        }
        if (element instanceof HTMLSelectElement) {
          state['selectedIndex'] = element.selectedIndex;
        }
        if (element instanceof HTMLOptionElement) state['selected'] = element.selected;
        if (element instanceof HTMLDetailsElement || element instanceof HTMLDialogElement) {
          state['open'] = element.open;
        }
        if (element instanceof HTMLMeterElement || element instanceof HTMLProgressElement) {
          state['max'] = element.max;
        }
        if (element instanceof HTMLMeterElement) {
          state['high'] = element.high;
          state['low'] = element.low;
          state['min'] = element.min;
          state['optimum'] = element.optimum;
        }
        return `${index}:${JSON.stringify(state)}`;
      })
      .join('\n');
    const presentation = elements
      .map((element, index) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return [
          index,
          element.tagName.toLowerCase(),
          style.display,
          style.visibility,
          style.opacity,
          style.position,
          style.color,
          style.backgroundColor,
          style.borderColor,
          style.borderRadius,
          style.boxShadow,
          style.width,
          style.height,
          style.minWidth,
          style.minHeight,
          style.maxWidth,
          style.maxHeight,
          style.paddingBlock,
          style.paddingInline,
          style.marginBlock,
          style.marginInline,
          style.gap,
          style.flex,
          style.gridTemplateColumns,
          style.fontFamily,
          style.fontSize,
          style.fontWeight,
          style.lineHeight,
          style.textAlign,
          style.textDecorationLine,
          style.overflow,
          style.overflowX,
          style.overflowY,
          style.pointerEvents,
          rounded(rect.x),
          rounded(rect.y),
          rounded(rect.width),
          rounded(rect.height),
        ].join('|');
      })
      .join('\n');

    return {
      aria: stableHash(aria),
      dom: stableHash(dom),
      forms: stableHash(forms),
      presentation: stableHash(presentation),
    };
  }, componentId);
}

function changedChannels(
  before: SpecimenFingerprint,
  after: SpecimenFingerprint,
): readonly FingerprintChannel[] {
  return (['aria', 'dom', 'forms', 'presentation'] as const).filter(
    (channel) =>
      before[channel].hash !== after[channel].hash ||
      before[channel].length !== after[channel].length,
  );
}

async function expectFingerprintChange(
  page: Page,
  componentId: string,
  control: PublicControl,
  before: SpecimenFingerprint,
): Promise<void> {
  let current = before;
  let persistentChannels: readonly FingerprintChannel[] = [];
  await expect
    .poll(
      async () => {
        const first = await specimenFingerprint(page, componentId);
        await page.evaluate(
          () =>
            new Promise<void>((resolve) => {
              requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
            }),
        );
        const second = await specimenFingerprint(page, componentId);
        current = second;
        persistentChannels = changedChannels(before, second).filter(
          (channel) =>
            first[channel].hash === second[channel].hash &&
            first[channel].length === second[channel].length,
        );
        return persistentChannels.length;
      },
      {
        message:
          `${componentId}.${control.key} (${control.binding.kind} ` +
          `${control.binding.publicName}) must change rendered DOM, ARIA, form state, or presentation`,
        timeout: 3_000,
      },
    )
    .toBeGreaterThan(0);

  expect(
    persistentChannels,
    `${componentId}.${control.key}: no stable rendered channel changed; last fingerprint ${JSON.stringify(
      current,
    )}`,
  ).not.toEqual([]);
}

function failureSummary(error: unknown): string {
  if (!(error instanceof Error)) return String(error);
  return error.message.split('\n').find((line) => line.trim().length > 0) ?? error.name;
}

test.describe('Catalog-wide public playground control contract', () => {
  for (const definition of publicDefinitions) {
    test(`${definition.id}: every public input/model control changes the rendered UI`, async ({
      page,
    }) => {
      test.setTimeout(Math.max(45_000, 15_000 + definition.controls.length * 12_000));
      const assertNoRuntimeErrors = watchRuntimeErrors(page);

      await page.goto(previewUrl({ component: definition.id }), {
        waitUntil: 'domcontentloaded',
      });
      await settlePage(page);

      const specimen = page.getByTestId(`component-specimen-${definition.id}`);
      await expect(specimen).toBeVisible();
      await expect(specimen.locator('.specimen-loading')).toHaveCount(0);

      const failures: string[] = [];
      for (const control of definition.controls) {
        const context =
          `${definition.id}.${control.key} (${control.binding.kind} ` +
          `${control.binding.publicName})`;

        try {
          const field = propertyControl(page, control.key);
          await expect(field, `${context}: property-panel field`).toHaveCount(1);
          await expect
            .poll(() => readControlValue(field, control), {
              message: `${context}: field must begin at its registry default`,
            })
            .toEqual(control.defaultValue);

          const before = await specimenFingerprint(page, definition.id);
          await setControlValue(field, control, control.testValue);

          await expect
            .poll(() => new URL(page.url()).searchParams.get(`arg.${control.key}`), {
              message: `${context}: canonical URL argument`,
            })
            .toBe(String(control.testValue));
          await expect
            .poll(() => readControlValue(field, control), {
              message: `${context}: field reflects the requested testValue`,
            })
            .toEqual(control.testValue);
          await expectFingerprintChange(page, definition.id, control, before);

          await setControlValue(field, control, control.defaultValue);
          await expect
            .poll(() => new URL(page.url()).searchParams.get(`arg.${control.key}`), {
              message: `${context}: resetting the default removes the URL argument`,
            })
            .toBeNull();
          await expect
            .poll(() => readControlValue(field, control), {
              message: `${context}: field returns to its registry default`,
            })
            .toEqual(control.defaultValue);
        } catch (error) {
          failures.push(`${context}: ${failureSummary(error)}`);
          // Recover a clean fixture so one broken public parameter cannot hide
          // the remaining contract failures for the same component.
          await page.goto(previewUrl({ component: definition.id }), {
            waitUntil: 'domcontentloaded',
          });
          await settlePage(page);
          await expect(page.getByTestId(`component-specimen-${definition.id}`)).toBeVisible();
        }
      }

      expect(failures, failures.join('\n')).toEqual([]);
      assertNoRuntimeErrors();
    });
  }
});
