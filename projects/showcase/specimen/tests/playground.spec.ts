import '@angular/compiler';
import { describe, expect, it } from 'vitest';
import { KERN_CATALOG } from '../../src/public-api';
import {
  KERN_SPECIMEN_RENDERER_CONTROLS,
  resolveKernSpecimenFilterValues,
  resolveKernSpecimenMenubarItems,
  resolveKernSpecimenNotifications,
  resolveKernSpecimenShortcutKeys,
} from '../src/lib/component-specimen';
import {
  KERN_PLAYGROUND_API_COVERAGE,
  KERN_PLAYGROUND_API_EXCLUSIONS,
  KERN_PLAYGROUND_AUTO_CONTROL_KEYS,
  KERN_PLAYGROUND_DEFINITIONS,
  findKernPlaygroundDefinition,
  normalizeKernPlaygroundApiType,
  normalizeKernPlaygroundValues,
  normalizeKernPlaygroundStateId,
  resolveKernPlaygroundState,
  type KernPlaygroundDefinition,
} from '../src/lib/playground';

function definition(id: string): KernPlaygroundDefinition {
  const result = findKernPlaygroundDefinition(id);
  expect(result, id).toBeDefined();
  return result as KernPlaygroundDefinition;
}

describe('KERN playground registry', () => {
  it('covers every catalog item exactly once with an interactive contract', () => {
    expect(KERN_CATALOG).toHaveLength(131);
    expect(KERN_PLAYGROUND_DEFINITIONS).toHaveLength(KERN_CATALOG.length);
    expect(Object.isFrozen(KERN_PLAYGROUND_DEFINITIONS)).toBe(true);
    expect(new Set(KERN_PLAYGROUND_DEFINITIONS.map(({ id }) => id)).size).toBe(KERN_CATALOG.length);

    for (const item of KERN_CATALOG) {
      const entry = definition(item.id);
      expect(entry.controls.length, `${item.id}.controls`).toBeGreaterThan(0);
      expect(
        entry.controls.some(({ binding }) => binding.kind !== 'composition'),
        `${item.id}.component-control`,
      ).toBe(true);
      expect(entry.presets.length, `${item.id}.presets`).toBeGreaterThan(0);
      expect(entry.presets[0]?.id, `${item.id}.default`).toBe('default');
      expect(entry.states, `${item.id}.states`).toEqual(entry.presets.map(({ id }) => id));
      expect(entry.scenarios[0], `${item.id}.scenario`).toBe('default');
      expect(new Set(entry.scenarios).size, item.id).toBe(entry.scenarios.length);
      expect(Object.isFrozen(entry), item.id).toBe(true);
      expect(Object.isFrozen(entry.controls), `${item.id}.controls`).toBe(true);
      expect(Object.isFrozen(entry.presets), `${item.id}.presets`).toBe(true);
    }
  });

  it('maps every catalog acceptance state to the same stable preset id', () => {
    const unmapped: string[] = [];
    const acceptanceStates = KERN_CATALOG.flatMap((item) =>
      item.states.map((state) => ({ item, state })),
    );
    expect(acceptanceStates.length).toBeGreaterThan(1_500);

    for (const { item, state } of acceptanceStates) {
      const stateId = normalizeKernPlaygroundStateId(state);
      const preset = definition(item.id).presets.find(({ id }) => id === stateId);
      if (!preset) unmapped.push(`${item.id}.${state} -> ${stateId}`);
      expect(normalizeKernPlaygroundStateId(preset?.label ?? ''), `${item.id}.${state}`).toBe(
        stateId,
      );
    }

    expect(unmapped).toEqual([]);
    expect(normalizeKernPlaygroundStateId(' high contrast ')).toBe('high-contrast');
    expect(normalizeKernPlaygroundStateId('RTL')).toBe('rtl');
    expect(normalizeKernPlaygroundStateId('handle focus-visible')).toBe('handle-focus-visible');
  });

  it('declares valid controls, defaults, and code-binding provenance', () => {
    for (const item of KERN_CATALOG) {
      const entry = definition(item.id);
      expect(new Set(entry.controls.map(({ key }) => key)).size, item.id).toBe(
        entry.controls.length,
      );

      for (const control of entry.controls) {
        const context = `${entry.id}.${control.key}`;
        expect(control.label.length, context).toBeGreaterThan(0);
        expect(control.description.length, context).toBeGreaterThan(0);
        expect(Object.isFrozen(control), context).toBe(true);
        expect(Object.isFrozen(control.binding), `${context}.binding`).toBe(true);
        expect(['boolean', 'number', 'string'], `${context}.testValue`).toContain(
          typeof control.testValue,
        );
        expect(control.testValue, `${context}.testValue`).not.toBe(control.defaultValue);

        const binding = control.binding;
        if (binding.kind === 'input' || binding.kind === 'model') {
          const api = item.api.find(({ name }) => name === binding.publicName);
          expect(api, `${context}.${binding.publicName}`).toBeDefined();
          expect(api?.kind, context).toBe(binding.kind);
        } else if (binding.kind === 'fixture') {
          expect(binding.description.length, context).toBeGreaterThan(0);
        } else {
          expect(binding).toEqual({
            kind: 'composition',
            target: 'canvas',
            attribute: 'data-composition',
          });
        }

        if (control.kind === 'boolean') {
          expect(typeof control.defaultValue, context).toBe('boolean');
        }

        if (control.kind === 'text') {
          expect(typeof control.defaultValue, context).toBe('string');
          expect(typeof control.testValue, context).toBe('string');
        }

        if (control.kind === 'select') {
          expect(control.options?.length, context).toBeGreaterThan(1);
          expect(
            control.options?.some(({ value }) => Object.is(value, control.defaultValue)),
            context,
          ).toBe(true);
          expect(
            control.options?.some(({ value }) => Object.is(value, control.testValue)),
            `${context}.testValue`,
          ).toBe(true);
          expect(Object.isFrozen(control.options), context).toBe(true);
        }

        if (control.kind === 'number' || control.kind === 'range') {
          expect(typeof control.defaultValue, context).toBe('number');
          expect(control.min, context).toBeTypeOf('number');
          expect(control.max, context).toBeTypeOf('number');
          expect(control.step, context).toBeGreaterThan(0);
          expect(control.defaultValue, context).toBeGreaterThanOrEqual(
            control.min ?? Number.NEGATIVE_INFINITY,
          );
          expect(control.defaultValue, context).toBeLessThanOrEqual(
            control.max ?? Number.POSITIVE_INFINITY,
          );
          expect(control.testValue, `${context}.testValue`).toBeGreaterThanOrEqual(
            control.min ?? Number.NEGATIVE_INFINITY,
          );
          expect(control.testValue, `${context}.testValue`).toBeLessThanOrEqual(
            control.max ?? Number.POSITIVE_INFINITY,
          );
        }
      }
    }
  });

  it('publishes only unique executable presets and resolves every one', () => {
    for (const entry of KERN_PLAYGROUND_DEFINITIONS) {
      expect(new Set(entry.presets.map(({ id }) => id)).size, entry.id).toBe(entry.presets.length);

      for (const preset of entry.presets) {
        const context = `${entry.id}.${preset.id}`;
        expect(preset.label.length, context).toBeGreaterThan(0);
        expect(entry.scenarios, context).toContain(preset.scenario);
        expect(Object.isFrozen(preset), context).toBe(true);
        expect(Object.isFrozen(preset.args), `${context}.args`).toBe(true);
        if (preset.environment) {
          expect(Object.isFrozen(preset.environment), `${context}.environment`).toBe(true);
        }
        if (preset.fixtureEffect) {
          expect(Object.isFrozen(preset.fixtureEffect), `${context}.fixtureEffect`).toBe(true);
          expect(preset.fixtureEffect.label.length, context).toBeGreaterThan(0);
          expect(preset.fixtureEffect.description.length, context).toBeGreaterThan(0);
        }

        for (const [key, value] of Object.entries(preset.args)) {
          expect(
            entry.controls.some((control) => control.key === key),
            context,
          ).toBe(true);
          expect(['boolean', 'number', 'string'], `${context}.${key}`).toContain(typeof value);
        }

        if (preset.id !== 'default') {
          const defaults = normalizeKernPlaygroundValues(entry);
          const changesArgument = Object.entries(preset.args).some(
            ([key, value]) => !Object.is(defaults[key], value),
          );
          expect(
            preset.scenario !== 'default' ||
              changesArgument ||
              preset.environment !== undefined ||
              preset.visualPseudoState !== undefined ||
              preset.fixtureEffect !== undefined,
            context,
          ).toBe(true);
        }

        const resolved = resolveKernPlaygroundState(entry, {
          state: preset.id,
          args: Object.fromEntries(
            entry.controls.map((control) => [control.key, control.defaultValue]),
          ),
        });
        expect(resolved.preset, context).toBe(preset);
        expect(resolved.scenario, context).toBe(preset.scenario);
        expect(resolved.fixtureEffect, context).toBe(preset.fixtureEffect ?? null);
        expect(Object.isFrozen(resolved), context).toBe(true);
        expect(Object.isFrozen(resolved.args), `${context}.args`).toBe(true);
        expect(normalizeKernPlaygroundValues(entry, resolved.args), context).toEqual(resolved.args);
      }
    }
  });

  it('provides executable environment and visual pseudo-state presets', () => {
    for (const entry of KERN_PLAYGROUND_DEFINITIONS) {
      expect(entry.presets.find(({ id }) => id === 'dark')?.environment).toEqual({
        theme: 'dark',
      });
      expect(entry.presets.find(({ id }) => id === 'high-contrast')?.environment).toEqual({
        theme: 'high-contrast',
      });
      expect(entry.presets.find(({ id }) => id === 'compact')?.environment).toEqual({
        density: 'compact',
      });
      expect(entry.presets.find(({ id }) => id === 'rtl')?.environment).toEqual({
        direction: 'rtl',
      });
      expect(entry.presets.find(({ id }) => id === 'mobile')?.environment).toEqual({
        viewport: 'phone',
      });
    }

    const focus = resolveKernPlaygroundState(definition('button'), {
      state: 'focus-visible',
    });
    expect(focus.visualPseudoState).toBe('focus-visible');
    expect(focus.scenario).toBe('default');

    const legacyLabel = resolveKernPlaygroundState(definition('button'), {
      state: ' High contrast ',
    });
    expect(legacyLabel.preset.id).toBe('high-contrast');
    expect(legacyLabel.environment.theme).toBe('high-contrast');
  });

  it('uses typed fixture effects for acceptance states without public API', () => {
    expect(definition('button').presets.find(({ id }) => id === 'overflow')?.fixtureEffect).toEqual(
      expect.objectContaining({ kind: 'layout', mode: 'overflow', label: 'overflow' }),
    );
    expect(
      definition('button').presets.find(({ id }) => id === 'long-text')?.fixtureEffect,
    ).toEqual(expect.objectContaining({ kind: 'content', mode: 'long-text', label: 'long text' }));
    expect(
      definition('text-input').presets.find(({ id }) => id === 'filled')?.fixtureEffect,
    ).toEqual(expect.objectContaining({ kind: 'content', mode: 'filled', label: 'filled' }));
    expect(definition('dialog').presets.find(({ id }) => id === 'nested')?.fixtureEffect).toEqual(
      expect.objectContaining({ kind: 'status', label: 'nested' }),
    );
    expect(
      definition('user-menu').presets.find(({ id }) => id === 'loading')?.fixtureEffect,
    ).toEqual(expect.objectContaining({ kind: 'data', mode: 'loading', label: 'loading' }));

    const fixturePresets = KERN_PLAYGROUND_DEFINITIONS.flatMap(({ presets }) =>
      presets.filter(({ fixtureEffect }) => fixtureEffect !== undefined),
    );
    expect(fixturePresets.length).toBeGreaterThanOrEqual(500);
  });

  it('normalizes primitive values, drops unknown keys, and is idempotent', () => {
    const entry = definition('button');
    const normalized = normalizeKernPlaygroundValues(entry, {
      variant: 'not-a-variant',
      tone: 'danger',
      size: 'lg',
      loading: 'true',
      disabled: true,
      pressed: false,
      unknown: 'discard me',
    });

    expect(normalized).toEqual({
      variant: 'solid',
      tone: 'danger',
      size: 'lg',
      loading: false,
    });
    expect('unknown' in normalized).toBe(false);
    expect(Object.isFrozen(normalized)).toBe(true);
    expect(normalizeKernPlaygroundValues(entry, normalized)).toEqual(normalized);
  });

  it('normalizes ordered numeric boundaries and invalid numeric input', () => {
    const normalized = normalizeKernPlaygroundValues(definition('number-input'), {
      min: 100,
      max: 10,
      step: 0,
      showSteppers: true,
      disabled: false,
      readOnly: false,
      required: false,
      invalid: false,
    });

    expect(normalized['min']).toBe(10);
    expect(normalized['max']).toBe(100);
    expect(normalized['step']).toBe(1);

    const fallback = normalizeKernPlaygroundValues(definition('number-input'), {
      min: Number.POSITIVE_INFINITY,
    });
    expect(fallback['min']).toBe(1);
  });

  it('validates and orders ISO date and time boundaries', () => {
    const dates = normalizeKernPlaygroundValues(definition('date-picker'), {
      min: '2027-01-01',
      max: '2026-01-01',
    });
    expect(dates['min']).toBe('2026-01-01');
    expect(dates['max']).toBe('2027-01-01');

    const invalidDate = normalizeKernPlaygroundValues(definition('date-picker'), {
      min: '2026-02-30',
    });
    expect(invalidDate['min']).toBe('2026-01-01');

    const times = normalizeKernPlaygroundValues(definition('time-picker'), {
      min: '21:30',
      max: '07:15',
    });
    expect(times['min']).toBe('07:15');
    expect(times['max']).toBe('21:30');

    const invalidTime = normalizeKernPlaygroundValues(definition('time-picker'), {
      max: '25:99',
    });
    expect(invalidTime['max']).toBe('20:00');
  });

  it('clamps progress and meter values to normalized cross-field ranges', () => {
    const progress = normalizeKernPlaygroundValues(definition('progress-bar'), {
      value: 90,
      max: 40,
    });
    expect(progress['max']).toBe(40);
    expect(progress['value']).toBe(40);

    const meter = normalizeKernPlaygroundValues(definition('meter'), {
      value: 0,
      min: 90,
      max: 10,
      low: 95,
      high: 5,
      optimum: 100,
    });
    expect(meter).toMatchObject({
      value: 10,
      min: 10,
      max: 90,
      low: 10,
      high: 90,
      optimum: 90,
    });
  });

  it('gives preset effects deterministic precedence without discarding unrelated args', () => {
    const button = resolveKernPlaygroundState(definition('icon-button'), {
      state: 'disabled',
      scenario: 'virtual',
      args: {
        variant: 'ghost',
        disabled: false,
      },
    });
    expect(button.args['variant']).toBe('ghost');
    expect(button.args['disabled']).toBe(true);
    expect(button.scenario).toBe('default');

    const grid = resolveKernPlaygroundState(definition('data-grid'), {
      state: 'virtualized',
      scenario: 'stress',
      args: { pageSize: 20 },
    });
    expect(grid.scenario).toBe('virtual');
    expect(grid.args['pageSize']).toBe(20);

    const unknown = resolveKernPlaygroundState(definition('button'), {
      state: 'not-a-state',
      args: { tone: 'danger' },
    });
    expect(unknown.preset.id).toBe('default');
    expect(unknown.args['tone']).toBe('danger');
  });

  it('keeps native Icon Button state outside the component input contract', () => {
    const iconButton = definition('icon-button');

    expect(
      iconButton.controls.find((control) => control.key === 'disabled')?.binding,
    ).toMatchObject({
      kind: 'fixture',
      target: 'interaction',
    });
    expect(iconButton.controls.some((control) => control.key === 'pressed')).toBe(false);
    expect(
      KERN_CATALOG.find(({ id }) => id === 'icon-button')?.api.map(({ name }) => name),
    ).not.toEqual(expect.arrayContaining(['disabled', 'pressed', 'type', 'ariaLabel']));
  });

  it('keeps Button Group controls limited to layout and child-native keyboard behavior', () => {
    const buttonGroup = definition('button-group');
    const orientation = buttonGroup.controls.find(({ key }) => key === 'orientation');
    const connected = buttonGroup.controls.find(({ key }) => key === 'connected');

    expect(buttonGroup.controls.map(({ key }) => key)).toEqual(['orientation', 'connected']);
    expect(orientation?.description).toContain('only the visual layout');
    expect(orientation?.description).toContain('document-order keyboard navigation');
    expect(connected).toMatchObject({
      kind: 'boolean',
      defaultValue: false,
      binding: { kind: 'input', publicName: 'connected' },
    });
    expect(connected?.description).toContain('without changing their semantics or keyboard order');
    expect(buttonGroup.presets.find(({ id }) => id === 'connected')?.args).toEqual({
      connected: true,
    });
    expect(buttonGroup.presets.map(({ id }) => id)).not.toEqual(
      expect.arrayContaining(['hover', 'focus-visible', 'active', 'disabled', 'loading']),
    );
    expect(
      KERN_PLAYGROUND_API_EXCLUSIONS.find(
        ({ componentId, publicName }) =>
          componentId === 'button-group' && publicName === 'ariaLabel',
      )?.reason,
    ).toContain('Deprecated compatibility input');
    expect(KERN_SPECIMEN_RENDERER_CONTROLS['button-group']).toEqual(['orientation', 'connected']);
  });

  it('models Copy Button async outcomes with deterministic fixture state', () => {
    const copyButton = definition('copy-button');
    const feedbackDuration = copyButton.controls.find(({ key }) => key === 'feedbackDuration');
    const copyState = copyButton.controls.find(({ key }) => key === 'copyState');

    expect(copyButton.controls.map(({ key }) => key)).toEqual([
      'variant',
      'tone',
      'size',
      'feedbackDuration',
      'disabled',
      'value',
      'copyState',
    ]);
    expect(feedbackDuration).toMatchObject({
      kind: 'number',
      defaultValue: 1_800,
      min: 0,
      max: 60_000,
      binding: { kind: 'input', publicName: 'feedbackDuration' },
    });
    expect(copyState).toMatchObject({
      kind: 'select',
      defaultValue: 'live',
      binding: { kind: 'fixture', target: 'interaction' },
    });
    expect(copyState?.options?.map(({ value }) => value)).toEqual([
      'live',
      'idle',
      'pending',
      'copied',
      'error',
    ]);
    expect(copyButton.presets.find(({ id }) => id === 'idle')?.args).toEqual({
      copyState: 'idle',
    });
    expect(copyButton.presets.find(({ id }) => id === 'pending')?.args).toEqual({
      copyState: 'pending',
    });
    expect(copyButton.presets.find(({ id }) => id === 'copied')?.args).toEqual({
      copyState: 'copied',
      feedbackDuration: 60_000,
    });
    expect(copyButton.presets.find(({ id }) => id === 'error')?.args).toEqual({
      copyState: 'error',
      feedbackDuration: 60_000,
    });
    expect(
      KERN_PLAYGROUND_API_EXCLUSIONS.find(
        ({ componentId, publicName }) =>
          componentId === 'copy-button' && publicName === 'copyingLabel',
      )?.evidence.pointer,
    ).toBe('tests/a11y/accessibility.spec.ts#copy-button');
    expect(KERN_SPECIMEN_RENDERER_CONTROLS['copy-button']).toEqual([
      'variant',
      'tone',
      'size',
      'feedbackDuration',
      'disabled',
      'value',
      'copyState',
    ]);
  });

  it('keeps fixture-only and composition controls explicit for code generation', () => {
    expect(
      definition('checkbox').controls.find(({ key }) => key === 'selected')?.binding,
    ).toMatchObject({ kind: 'fixture', target: 'interaction' });
    expect(
      definition('data-grid').controls.find(({ key }) => key === 'dataState')?.binding,
    ).toMatchObject({ kind: 'fixture', target: 'data' });
    expect(definition('tabs').controls.find(({ key }) => key === 'selected')?.binding).toEqual({
      kind: 'model',
      publicName: 'value',
    });
    expect(definition('app-shell').controls).toContainEqual(
      expect.objectContaining({
        key: 'mobileNavigationOpen',
        binding: {
          kind: 'model',
          publicName: 'mobileNavigationOpen',
        },
      }),
    );
  });

  it('preserves purposeful specimen defaults and interactive public models', () => {
    expect(definition('data-grid').controls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'expandable', defaultValue: true }),
        expect.objectContaining({ key: 'virtualize', defaultValue: false }),
        expect.objectContaining({
          key: 'filter',
          binding: { kind: 'model', publicName: 'filter' },
        }),
        expect.objectContaining({
          key: 'page',
          binding: { kind: 'model', publicName: 'page' },
        }),
      ]),
    );
    expect(definition('floating-action-button').controls).toContainEqual(
      expect.objectContaining({ key: 'size', defaultValue: 'lg' }),
    );
    expect(definition('form-field').controls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'hint', defaultValue: 'Required enterprise value.' }),
        expect.objectContaining({ key: 'required', defaultValue: true }),
      ]),
    );
    expect(definition('center').controls).toContainEqual(
      expect.objectContaining({
        key: 'gutters',
        defaultValue: '4',
        testValue: '20rem',
      }),
    );
    expect(definition('tags-input').controls).toContainEqual(
      expect.objectContaining({
        key: 'tabindex',
        defaultValue: 0,
        min: -1,
        max: 0,
        testValue: -1,
      }),
    );
    expect(definition('calendar').controls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'focusedDate',
          binding: { kind: 'model', publicName: 'focusedDate' },
        }),
        expect.objectContaining({
          key: 'value',
          binding: { kind: 'model', publicName: 'value' },
        }),
      ]),
    );
  });

  it('classifies every public input/model as one real control or one exact exclusion', () => {
    expect(KERN_PLAYGROUND_API_COVERAGE).toEqual({
      publicInputsAndModels: 1028,
      controlled: 647,
      excluded: 381,
      unclassified: 0,
    });
    expect(KERN_PLAYGROUND_API_EXCLUSIONS).toHaveLength(381);
    expect(Object.values(KERN_PLAYGROUND_AUTO_CONTROL_KEYS).flat().length).toBeGreaterThan(0);

    for (const item of KERN_CATALOG) {
      const entry = definition(item.id);
      const controlsByPublicName = new Map(
        entry.controls.flatMap((control) =>
          control.binding.kind === 'input' || control.binding.kind === 'model'
            ? [[control.binding.publicName, control]]
            : [],
        ),
      );
      const exclusionsByPublicName = new Map(
        KERN_PLAYGROUND_API_EXCLUSIONS.filter(({ componentId }) => componentId === item.id).map(
          (exclusion) => [exclusion.publicName, exclusion],
        ),
      );

      for (const api of item.api.filter(({ kind }) => kind === 'input' || kind === 'model')) {
        const control = controlsByPublicName.get(api.name);
        const exclusion = exclusionsByPublicName.get(api.name);
        expect(
          Number(Boolean(control)) + Number(Boolean(exclusion)),
          `${item.id}.${api.name}`,
        ).toBe(1);
        if (exclusion) {
          expect(exclusion.kind, `${item.id}.${api.name}.kind`).toBe(api.kind);
          expect(exclusion.type, `${item.id}.${api.name}.type`).toBe(
            normalizeKernPlaygroundApiType(api.type),
          );
          expect(exclusion.reason.length, `${item.id}.${api.name}.reason`).toBeGreaterThan(24);
          expect(exclusion.evidence.pointer, `${item.id}.${api.name}.evidence`).toContain(item.id);
        }
      }
    }
  });

  it('keeps every definition control covered by the focused renderer gate', () => {
    expect(Object.keys(KERN_SPECIMEN_RENDERER_CONTROLS)).toHaveLength(KERN_CATALOG.length);

    for (const entry of KERN_PLAYGROUND_DEFINITIONS) {
      const rendererControls =
        KERN_SPECIMEN_RENDERER_CONTROLS[entry.id as keyof typeof KERN_SPECIMEN_RENDERER_CONTROLS];
      expect(rendererControls, entry.id).toBeDefined();
      expect(rendererControls, entry.id).toEqual(entry.controls.map(({ key }) => key));
      expect(Object.isFrozen(rendererControls), entry.id).toBe(true);
    }
  });

  it('resolves representative renderer fixtures deterministically', () => {
    const navigationItems = [
      { id: 'overview', label: 'Overview' },
      { id: 'archive', label: 'Archive' },
    ] as const;
    expect(resolveKernSpecimenMenubarItems('default', navigationItems)).toBe(navigationItems);
    expect(resolveKernSpecimenMenubarItems('current', navigationItems)[0]?.label).toBe(
      'Overview · Current',
    );
    expect(resolveKernSpecimenMenubarItems('disabled', navigationItems)[0]?.disabled).toBe(true);

    const notifications = [
      {
        id: 'notice',
        title: 'Policy updated',
        detail: 'The policy is current.',
        timestamp: 'Now',
        read: true,
      },
    ] as const;
    expect(resolveKernSpecimenNotifications('empty', notifications)).toEqual([]);
    expect(resolveKernSpecimenNotifications('unread', notifications)[0]?.read).toBe(false);
    expect(resolveKernSpecimenNotifications('ready', notifications)).toBe(notifications);

    expect(resolveKernSpecimenFilterValues('healthy')).toEqual({ state: 'healthy' });
    expect(resolveKernSpecimenFilterValues('none')).toEqual({});
    expect(resolveKernSpecimenShortcutKeys('Windows')).toEqual(['Ctrl', 'K']);
    expect(resolveKernSpecimenShortcutKeys('macOS')).toEqual(['⌘', 'K']);
  });
});
