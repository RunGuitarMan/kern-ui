import { KERN_CATALOG, type KernCatalogItem } from '@kern-ui/showcase';

import { CONTROL_SETS } from './playground-control-sets';
import {
  boolean,
  compositionBinding,
  disabled,
  inputBinding,
  invalid,
  loading,
  number,
  option,
  placeholder,
  publicApiControl,
  range,
  readOnly,
  required,
  select,
  text,
  textTestValue,
  type KernPlaygroundApiCoverage,
  type KernPlaygroundApiExclusion,
  type KernPlaygroundControl,
  type KernPlaygroundDefinition,
  type KernPlaygroundFixtureEffect,
  type KernPlaygroundStatePreset,
  type KernPlaygroundStateRequest,
  type KernPlaygroundValue,
  type KernPlaygroundValues,
  type KernResolvedPlaygroundState,
  type KernSpecimenScenario,
} from './playground-foundation';

export { normalizeKernPlaygroundApiType } from './playground-foundation';
export type {
  KernSpecimenScenario,
  KernPlaygroundValue,
  KernPlaygroundValues,
  KernPlaygroundControlKind,
  KernPlaygroundVisualPseudoState,
  KernPlaygroundFixtureEffect,
  KernPlaygroundEnvironment,
  KernPlaygroundCodeBinding,
  KernPlaygroundOption,
  KernPlaygroundControl,
  KernPlaygroundStatePreset,
  KernPlaygroundDefinition,
  KernPlaygroundApiExclusionCode,
  KernPlaygroundApiExclusion,
  KernPlaygroundApiCoverage,
  KernPlaygroundStateRequest,
  KernResolvedPlaygroundState,
} from './playground-foundation';

const SPECIMEN_CONTROL_DEFAULTS: Readonly<
  Record<string, Readonly<Record<string, KernPlaygroundValue>>>
> = {
  'split-button': { menuOffset: 8, size: 'md', tone: 'brand' },
  'toggle-button': {
    pressedTone: 'brand',
    pressedVariant: 'soft',
    size: 'md',
    unpressedTone: 'neutral',
    unpressedVariant: 'ghost',
    value: 'watch',
  },
  'copy-button': { value: 'npm i @kern-ui/angular' },
  'dropdown-button': { menuOffset: 8, size: 'md', tone: 'brand' },
  'form-field': { hint: 'Required enterprise value.', required: true },
  label: { required: true },
  'text-input': { autocomplete: 'organization' },
  checkbox: { description: 'Receive a summary every Monday at 09:00.' },
  radio: { description: 'Flexible, billed each month', value: 'monthly' },
  switch: { description: 'Members will authenticate through your identity provider.' },
  slider: { label: 'Seat allocation' },
  'range-slider': { label: 'Usage range' },
  'file-upload': {
    accept: '.csv,text/csv',
    description: 'CSV, up to 10 MB.',
    label: 'Choose a CSV file',
    maxSize: 10_485_760,
  },
  'drag-drop-upload': {
    accept: '.svg,.png,.jpg,.jpeg',
    description: 'SVG, PNG, or JPG · 5 MB each',
    label: 'Browse files',
  },
  'verification-code': { label: 'Enter the 6-digit verification code' },
  'tags-input': { maxTags: 6, placeholder: 'Add a tag' },
  'vertical-tabs': { orientation: 'vertical' },
  'command-palette': { title: 'Jump to…' },
  'table-of-contents': { title: 'On this page' },
  'back-button': { href: '/', label: 'Back to catalog' },
  banner: { title: 'Scheduled maintenance' },
  'alert-dialog': {
    description: 'This action cannot be undone.',
    title: 'Delete Northstar?',
  },
  drawer: { eyebrow: 'AUDIT', title: 'Recent activity' },
  'bottom-sheet': { title: 'Workspace actions' },
  'empty-state': {
    description: 'Create an automation to connect events with repeatable actions.',
    title: 'No automations yet',
  },
  'error-state': {
    description: 'The service did not respond. Your changes are safe.',
    title: 'Could not load workspaces',
  },
  'success-state': {
    description: 'Northstar is ready for collaborators.',
    title: 'Workspace created',
  },
  'confirmation-pattern': { prompt: 'Archive Northstar and pause all automations?' },
  'status-badge': { status: true },
  avatar: { name: 'Avery Cole', size: 'lg', status: 'online' },
  'list-item': { heading: 'Quarterly audit package' },
  disclosure: { heading: 'Advanced automation settings' },
  calendar: { today: '2026-07-26' },
  'line-chart': { eyebrow: 'THROUGHPUT' },
  'bar-chart': { eyebrow: 'AUTOMATION' },
  'donut-chart': { eyebrow: 'ALLOCATION' },
  'user-menu': { detail: 'avery@north.ops', name: 'Avery Cole' },
  'notification-center': { heading: 'Recent events' },
  'global-search': { placeholder: 'Search workspaces, projects, people…' },
  'page-header': {
    description: 'Monitor runs, failures, and throughput across environments.',
    eyebrow: 'Workspace / Northstar',
    index: '07',
  },
  'settings-panel': { heading: 'Workspace settings' },
  'dashboard-widget': { eyebrow: 'AUTOMATION', heading: 'Runs by environment' },
  'login-form': { recoveryHref: '#specimen' },
};

const compositionControl = select(
  'composition',
  'Canvas width',
  'default',
  'Tests the specimen in its default, constrained, and expanded compositions.',
  ['default', 'constrained', 'expanded'],
  compositionBinding,
);

const STRESS_SCENARIO_IDS = new Set<string>([
  'autocomplete',
  'bar-chart',
  'combobox',
  'data-grid',
  'data-table',
  'donut-chart',
  'form-field',
  'line-chart',
  'multi-select',
  'native-select',
  'select',
  'tree',
]);

const STATE_SCENARIO_IDS = new Set<string>([
  'bar-chart',
  'data-grid',
  'data-table',
  'donut-chart',
  'line-chart',
  'tree',
  'tree-navigation',
]);

const PSEUDO_STATE_DATA_IDS = new Set<string>([
  'accordion',
  'calendar',
  'card',
  'chip',
  'data-grid',
  'data-table',
  'disclosure',
  'list-item',
  'rating',
  'tag',
  'tree',
]);

const FORM_FOUNDATION_IDS = new Set<string>(['form-field', 'hint', 'label', 'validation-message']);

const createPreset = (
  preset: Omit<KernPlaygroundStatePreset, 'args'> & {
    readonly args?: KernPlaygroundValues;
  },
): KernPlaygroundStatePreset =>
  Object.freeze({
    ...preset,
    args: Object.freeze({ ...(preset.args ?? {}) }),
    environment: preset.environment ? Object.freeze({ ...preset.environment }) : undefined,
    fixtureEffect: preset.fixtureEffect ? Object.freeze({ ...preset.fixtureEffect }) : undefined,
  });

const ENVIRONMENT_PRESETS: readonly KernPlaygroundStatePreset[] = Object.freeze([
  createPreset({
    id: 'dark',
    label: 'Dark',
    scenario: 'default',
    environment: { theme: 'dark' },
  }),
  createPreset({
    id: 'high-contrast',
    label: 'High contrast',
    scenario: 'default',
    environment: { theme: 'high-contrast' },
  }),
  createPreset({
    id: 'compact',
    label: 'Compact',
    scenario: 'default',
    environment: { density: 'compact' },
  }),
  createPreset({
    id: 'rtl',
    label: 'RTL',
    scenario: 'default',
    environment: { direction: 'rtl' },
  }),
  createPreset({
    id: 'mobile',
    label: 'Mobile',
    scenario: 'default',
    environment: { viewport: 'phone' },
  }),
]);

function supportsVisualPseudoStates(item: (typeof KERN_CATALOG)[number]): boolean {
  if (item.id === 'button-group') return false;

  return (
    item.category === 'Actions' ||
    item.category === 'Navigation' ||
    (item.category === 'Forms' && !FORM_FOUNDATION_IDS.has(item.id)) ||
    PSEUDO_STATE_DATA_IDS.has(item.id)
  );
}

function visualPseudoPresets(
  item: (typeof KERN_CATALOG)[number],
): readonly KernPlaygroundStatePreset[] {
  if (!supportsVisualPseudoStates(item)) return [];

  return (['hover', 'focus-visible', 'active'] as const).map((visualPseudoState) =>
    createPreset({
      id: visualPseudoState,
      label: visualPseudoState === 'focus-visible' ? 'Focus visible' : titleCase(visualPseudoState),
      scenario: 'default',
      visualPseudoState,
    }),
  );
}

function titleCase(value: string): string {
  return value
    .split('-')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

/** Produces the stable URL/manifest identifier used for catalog acceptance states. */
export function normalizeKernPlaygroundStateId(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function acceptanceArgsFor(
  stateId: string,
  controls: readonly KernPlaygroundControl[],
): KernPlaygroundValues {
  const booleanState: Readonly<Record<string, readonly [string, boolean]>> = {
    disabled: ['disabled', true],
    enabled: ['disabled', false],
    loading: ['loading', true],
    idle: ['loading', false],
    invalid: ['invalid', true],
    valid: ['invalid', false],
    readonly: ['readOnly', true],
    editable: ['readOnly', false],
    required: ['required', true],
    optional: ['required', false],
    selected: ['selected', true],
    unselected: ['selected', false],
    pressed: ['pressed', true],
    unpressed: ['pressed', false],
    open: ['open', true],
    closed: ['open', false],
    dismissed: ['open', false],
    indeterminate: ['indeterminate', true],
    determinate: ['indeterminate', false],
  };
  const booleanEntry = booleanState[stateId];
  if (booleanEntry) {
    const [key, value] = booleanEntry;
    const control = controls.find(
      (candidate) => candidate.key === key && candidate.kind === 'boolean',
    );
    if (control) return { [key]: value };
  }

  const stateValue = stateId.includes('loading')
    ? 'loading'
    : stateId.includes('error')
      ? 'error'
      : stateId === 'empty'
        ? 'empty'
        : null;
  if (stateValue) {
    for (const key of ['dataState', 'optionsState'] as const) {
      const control = controls.find(
        (candidate) => candidate.key === key && candidate.kind === 'select',
      );
      if (control?.options?.some(({ value }) => value === stateValue)) {
        return { [key]: stateValue };
      }
    }
  }

  const stateControl = controls.find(
    (candidate) =>
      candidate.key === 'state' &&
      candidate.kind === 'select' &&
      candidate.options?.some(({ value }) => value === stateId),
  );
  if (stateControl) {
    return { state: stateId };
  }

  return {};
}

function layoutFixtureMode(
  stateId: string,
): Extract<KernPlaygroundFixtureEffect, { kind: 'layout' }>['mode'] {
  if (stateId.includes('overflow')) return 'overflow';
  if (stateId.includes('expanded') || stateId.includes('maximum-size')) return 'expanded';
  if (
    stateId.includes('collapsed') ||
    stateId.includes('minimum-size') ||
    stateId.includes('handle')
  ) {
    return 'constrained';
  }
  return 'alternate';
}

function contentFixtureMode(
  stateId: string,
): Extract<KernPlaygroundFixtureEffect, { kind: 'content' }>['mode'] {
  if (stateId === 'empty') return 'empty';
  if (stateId === 'filled') return 'filled';
  if (stateId === 'long-text') return 'long-text';
  if (stateId.includes('without-action')) return 'without-action';
  if (stateId.includes('with-action') || stateId.includes('with-retry')) return 'with-action';
  return 'alternate';
}

function dataFixtureMode(
  stateId: string,
): Extract<KernPlaygroundFixtureEffect, { kind: 'data' }>['mode'] {
  if (stateId.includes('loading')) return 'loading';
  if (stateId.includes('error')) return 'error';
  if (stateId.includes('success')) return 'success';
  if (stateId.includes('empty')) return 'empty';
  if (stateId.includes('filter')) return 'filtered';
  if (stateId.includes('sort')) return 'sorted';
  if (stateId.includes('select')) return 'selected';
  if (stateId.includes('virtual')) return 'virtualized';
  return 'alternate';
}

function statusFixtureMode(
  stateId: string,
): Extract<KernPlaygroundFixtureEffect, { kind: 'status' }>['mode'] {
  if (stateId.includes('error') || stateId.includes('terminal')) return 'danger';
  if (stateId.includes('invalid') || stateId.includes('warning')) return 'warning';
  if (stateId.includes('success')) return 'success';
  if (stateId.includes('loading') || stateId.includes('open')) return 'info';
  return 'neutral';
}

function fixtureDescription(kind: KernPlaygroundFixtureEffect['kind'], stateId: string): string {
  if (kind === 'layout') {
    return stateId.includes('overflow')
      ? 'The fixture deliberately exceeds its normal inline size to expose overflow behavior.'
      : 'The fixture uses an alternate deterministic boundary to expose layout behavior.';
  }
  if (kind === 'content') {
    if (stateId === 'long-text') {
      return 'Northstar enterprise workspace policy configuration with deliberately extended content for wrapping and truncation verification.';
    }
    if (stateId === 'empty') return 'The component is composed with intentionally empty content.';
    if (stateId === 'filled')
      return 'The component is composed with a representative populated value.';
    return 'The projected content composition is changed for this acceptance state.';
  }
  if (kind === 'data') {
    if (stateId.includes('loading')) return 'The fixture is waiting for enterprise data.';
    if (stateId.includes('error')) return 'The fixture data request failed and can be retried.';
    if (stateId.includes('empty')) return 'The fixture data source returned no records.';
    if (stateId.includes('success')) return 'The fixture operation completed successfully.';
    return 'The fixture data projection is changed for this acceptance state.';
  }
  return `The fixture exposes the ${stateId.replaceAll('-', ' ')} status without claiming a public component input.`;
}

function fixtureEffectFor(
  item: (typeof KERN_CATALOG)[number],
  stateLabel: string,
): KernPlaygroundFixtureEffect {
  const stateId = normalizeKernPlaygroundStateId(stateLabel);
  const dataState =
    item.category === 'Patterns' ||
    ['data-grid', 'data-table', 'tree', 'tree-navigation'].includes(item.id) ||
    [
      'empty-results',
      'error-branch',
      'filtered',
      'loading-branch',
      'pinned-columns',
      'selected-rows',
      'sorted',
      'virtualized',
    ].some((token) => stateId.includes(token));
  const contentState =
    stateId === 'long-text' ||
    (item.category === 'Forms' && ['empty', 'filled'].includes(stateId)) ||
    stateId.includes('with-action') ||
    stateId.includes('without-action') ||
    stateId.includes('with-retry');
  const layoutState =
    stateId.includes('overflow') ||
    stateId.includes('handle') ||
    stateId.includes('minimum-size') ||
    stateId.includes('maximum-size') ||
    (!['tree', 'tree-navigation'].includes(item.id) &&
      (stateId.includes('collapsed') || stateId.includes('expanded')));

  if (dataState) {
    return {
      kind: 'data',
      mode: dataFixtureMode(stateId),
      label: stateLabel,
      description: fixtureDescription('data', stateId),
    };
  }
  if (contentState) {
    return {
      kind: 'content',
      mode: contentFixtureMode(stateId),
      label: stateLabel,
      description: fixtureDescription('content', stateId),
    };
  }
  if (layoutState) {
    return {
      kind: 'layout',
      mode: layoutFixtureMode(stateId),
      label: stateLabel,
      description: fixtureDescription('layout', stateId),
    };
  }
  return {
    kind: 'status',
    mode: statusFixtureMode(stateId),
    label: stateLabel,
    description: fixtureDescription('status', stateId),
  };
}

function changedBooleanPreset(
  controls: readonly KernPlaygroundControl[],
  key: string,
  enabledId: string,
  disabledId: string,
  enabledLabel = titleCase(enabledId),
  disabledLabel = titleCase(disabledId),
): KernPlaygroundStatePreset | null {
  const control = controls.find((candidate) => candidate.key === key);
  if (!control || control.kind !== 'boolean' || typeof control.defaultValue !== 'boolean') {
    return null;
  }
  const value = !control.defaultValue;
  return createPreset({
    id: value ? enabledId : disabledId,
    label: value ? enabledLabel : disabledLabel,
    scenario: 'default',
    args: { [key]: value },
  });
}

function optionStatePresets(
  controls: readonly KernPlaygroundControl[],
  key: 'dataState' | 'optionsState',
): readonly KernPlaygroundStatePreset[] {
  const control = controls.find((candidate) => candidate.key === key);
  if (!control || control.kind !== 'select') return [];

  return (control.options ?? [])
    .filter(({ value }) => value !== control.defaultValue)
    .map(({ value }) => {
      const valueId = String(value);
      return createPreset({
        id: key === 'optionsState' && valueId === 'loading' ? 'async-loading' : valueId,
        label:
          key === 'optionsState' && valueId === 'loading' ? 'Async loading' : titleCase(valueId),
        scenario: valueId === 'stress' ? 'stress' : 'default',
        args: { [key]: value },
      });
    });
}

function valuePresets(
  id: string,
  controls: readonly KernPlaygroundControl[],
): readonly KernPlaygroundStatePreset[] {
  if (!['circular-progress', 'meter', 'progress-bar'].includes(id)) return [];
  const valueControl = controls.find((control) => control.key === 'value');
  const minControl = controls.find((control) => control.key === 'min');
  const maxControl = controls.find((control) => control.key === 'max');
  if (
    !valueControl ||
    typeof valueControl.defaultValue !== 'number' ||
    !maxControl ||
    typeof maxControl.defaultValue !== 'number'
  ) {
    return [];
  }

  const minimum =
    minControl && typeof minControl.defaultValue === 'number' ? minControl.defaultValue : 0;
  const maximum = maxControl.defaultValue;
  const partial = minimum + (maximum - minimum) / 2;
  return [
    createPreset({
      id: 'minimum',
      label: 'Minimum',
      scenario: 'default',
      args: { value: minimum },
    }),
    createPreset({
      id: 'partial',
      label: 'Partial',
      scenario: 'default',
      args: { value: partial },
    }),
    createPreset({
      id: 'maximum',
      label: 'Maximum',
      scenario: 'default',
      args: { value: maximum },
    }),
  ].filter(({ args }) => !Object.is(args['value'], valueControl.defaultValue));
}

function functionalPresets(
  id: string,
  controls: readonly KernPlaygroundControl[],
): readonly KernPlaygroundStatePreset[] {
  const result: KernPlaygroundStatePreset[] = [];
  const add = (preset: KernPlaygroundStatePreset | null): void => {
    if (preset) result.push(preset);
  };

  add(changedBooleanPreset(controls, 'disabled', 'disabled', 'enabled'));
  add(changedBooleanPreset(controls, 'loading', 'loading', 'idle'));
  add(changedBooleanPreset(controls, 'invalid', 'invalid', 'valid'));
  add(changedBooleanPreset(controls, 'readOnly', 'readonly', 'editable'));
  add(changedBooleanPreset(controls, 'required', 'required', 'optional'));
  add(changedBooleanPreset(controls, 'selected', 'selected', 'unselected'));
  add(changedBooleanPreset(controls, 'pressed', 'pressed', 'unpressed'));
  add(changedBooleanPreset(controls, 'open', 'open', 'closed'));
  add(changedBooleanPreset(controls, 'indeterminate', 'indeterminate', 'determinate'));
  add(changedBooleanPreset(controls, 'interactive', 'interactive', 'static'));
  add(changedBooleanPreset(controls, 'removable', 'removable', 'fixed'));
  add(changedBooleanPreset(controls, 'dismissible', 'dismissible', 'persistent'));
  add(changedBooleanPreset(controls, 'showValue', 'value-visible', 'value-hidden'));
  add(changedBooleanPreset(controls, 'compact', 'compact-rows', 'comfortable-rows'));
  add(changedBooleanPreset(controls, 'status', 'status-marker', 'plain'));
  add(changedBooleanPreset(controls, 'active', 'active-overlay', 'inactive-overlay'));
  add(changedBooleanPreset(controls, 'connected', 'connected', 'separated'));

  if (id === 'copy-button') {
    for (const state of ['idle', 'pending', 'copied', 'error'] as const) {
      result.push(
        createPreset({
          id: state,
          label: titleCase(state),
          scenario: 'default',
          args: {
            copyState: state,
            ...(state === 'copied' || state === 'error' ? { feedbackDuration: 60_000 } : {}),
          },
        }),
      );
    }
  }

  result.push(
    ...optionStatePresets(controls, 'optionsState'),
    ...optionStatePresets(controls, 'dataState'),
    ...valuePresets(id, controls),
  );
  return result;
}

function scenarioPresets(id: string): readonly KernPlaygroundStatePreset[] {
  const presets: KernPlaygroundStatePreset[] = [];
  if (STRESS_SCENARIO_IDS.has(id)) {
    presets.push(
      createPreset({
        id: 'stress',
        label: 'Stress data',
        scenario: 'stress',
      }),
    );
  }
  if (STATE_SCENARIO_IDS.has(id)) {
    const tree = id === 'tree' || id === 'tree-navigation';
    const chart = ['bar-chart', 'donut-chart', 'line-chart'].includes(id);
    presets.push(
      createPreset({
        id: tree ? 'async-branches' : chart ? 'interactive-order' : 'pinned-columns',
        label: tree ? 'Async branches' : chart ? 'Interactive order' : 'Pinned columns',
        scenario: 'states',
      }),
    );
  }
  if (id === 'data-grid') {
    presets.push(
      createPreset({
        id: 'virtualized',
        label: 'Virtualized',
        scenario: 'virtual',
      }),
    );
  }
  return presets;
}

function acceptancePresetFor(
  item: (typeof KERN_CATALOG)[number],
  stateLabel: string,
  controls: readonly KernPlaygroundControl[],
): KernPlaygroundStatePreset {
  const id = normalizeKernPlaygroundStateId(stateLabel);
  const useStressScenario =
    STRESS_SCENARIO_IDS.has(item.id) && (id === 'overflow' || id === 'long-text');
  return createPreset({
    id,
    label: stateLabel,
    scenario: useStressScenario ? 'stress' : 'default',
    args: acceptanceArgsFor(id, controls),
    fixtureEffect: fixtureEffectFor(item, stateLabel),
  });
}

function presetsFor(
  item: (typeof KERN_CATALOG)[number],
  controls: readonly KernPlaygroundControl[],
): readonly KernPlaygroundStatePreset[] {
  const candidates = [
    createPreset({ id: 'default', label: 'Default', scenario: 'default' }),
    ...ENVIRONMENT_PRESETS,
    ...visualPseudoPresets(item),
    ...functionalPresets(item.id, controls),
    ...scenarioPresets(item.id),
  ];
  const unique = new Map<string, KernPlaygroundStatePreset>();
  for (const preset of candidates) {
    if (!unique.has(preset.id)) unique.set(preset.id, preset);
  }
  const acceptancePresets: KernPlaygroundStatePreset[] = [];
  const acceptanceIds = new Set<string>();
  for (const stateLabel of item.states) {
    const id = normalizeKernPlaygroundStateId(stateLabel);
    if (acceptanceIds.has(id)) continue;
    acceptanceIds.add(id);
    acceptancePresets.push(unique.get(id) ?? acceptancePresetFor(item, stateLabel, controls));
  }
  return Object.freeze([
    ...acceptancePresets,
    ...[...unique.values()].filter(({ id }) => !acceptanceIds.has(id)),
  ]);
}

function scenariosFor(
  presets: readonly KernPlaygroundStatePreset[],
): readonly KernSpecimenScenario[] {
  const supported = new Set<KernSpecimenScenario>([
    'default',
    ...presets.map(({ scenario }) => scenario),
  ]);
  return Object.freeze(
    (['default', 'states', 'stress', 'virtual'] as const).filter((scenario) =>
      supported.has(scenario),
    ),
  );
}

const playgroundApiExclusions: KernPlaygroundApiExclusion[] = [];
const autoControlKeysById = new Map<string, string[]>();

function withSpecimenDefault(
  componentId: string,
  control: KernPlaygroundControl,
): KernPlaygroundControl {
  const overrides = SPECIMEN_CONTROL_DEFAULTS[componentId];
  if (!overrides || !Object.prototype.hasOwnProperty.call(overrides, control.key)) return control;

  const defaultValue = overrides[control.key]!;
  const options =
    control.kind === 'select' &&
    !(control.options ?? []).some((candidate) => Object.is(candidate.value, defaultValue))
      ? Object.freeze([option(String(defaultValue), defaultValue), ...(control.options ?? [])])
      : control.options;
  const minimum = control.min ?? Number.NEGATIVE_INFINITY;
  const maximum =
    typeof defaultValue === 'number'
      ? control.max === undefined
        ? undefined
        : Math.max(control.max, defaultValue)
      : control.max;
  const step = control.step ?? 1;
  const numericCandidate =
    typeof defaultValue === 'number'
      ? defaultValue + step <= (maximum ?? Number.POSITIVE_INFINITY)
        ? defaultValue + step
        : defaultValue - step
      : defaultValue;
  const testValue =
    control.kind === 'boolean'
      ? !defaultValue
      : control.kind === 'select'
        ? ((options ?? []).find((candidate) => !Object.is(candidate.value, defaultValue))?.value ??
          defaultValue)
        : control.kind === 'number' || control.kind === 'range'
          ? Math.min(
              maximum ?? Number.POSITIVE_INFINITY,
              Math.max(minimum, Number(numericCandidate)),
            )
          : textTestValue(control.key, String(defaultValue));

  return Object.freeze({
    ...control,
    defaultValue,
    testValue,
    options,
    max: maximum,
  });
}

function controlsFor(item: KernCatalogItem): readonly KernPlaygroundControl[] {
  const controls = (CONTROL_SETS[item.id] ?? [compositionControl]).map((control) =>
    withSpecimenDefault(item.id, control),
  );
  const controlledPublicNames = new Set(
    controls.flatMap(({ binding }) =>
      binding.kind === 'input' || binding.kind === 'model' ? [binding.publicName] : [],
    ),
  );
  const controlKeys = new Set(controls.map(({ key }) => key));

  for (const api of [...item.api].sort((left, right) => left.name.localeCompare(right.name))) {
    if ((api.kind !== 'input' && api.kind !== 'model') || controlledPublicNames.has(api.name)) {
      continue;
    }
    const key = controlKeys.has(api.name) ? `${api.name}Api` : api.name;
    const classified = publicApiControl(item, api, key);
    if ('code' in classified) {
      playgroundApiExclusions.push(classified);
      continue;
    }
    controls.push(withSpecimenDefault(item.id, classified));
    const autoKeys = autoControlKeysById.get(item.id) ?? [];
    autoKeys.push(key);
    autoControlKeysById.set(item.id, autoKeys);
    controlKeys.add(key);
    controlledPublicNames.add(api.name);
  }

  return Object.freeze(controls);
}

export const KERN_PLAYGROUND_DEFINITIONS: readonly KernPlaygroundDefinition[] = Object.freeze(
  KERN_CATALOG.map((item) => {
    const controls = controlsFor(item);
    const presets = presetsFor(item, controls);
    return Object.freeze({
      id: item.id,
      scenarios: scenariosFor(presets),
      states: Object.freeze(presets.map(({ id }) => id)),
      presets,
      controls,
    });
  }),
);

export const KERN_PLAYGROUND_API_EXCLUSIONS: readonly KernPlaygroundApiExclusion[] =
  Object.freeze(playgroundApiExclusions);

export const KERN_PLAYGROUND_AUTO_CONTROL_KEYS: Readonly<Record<string, readonly string[]>> =
  Object.freeze(
    Object.fromEntries(
      KERN_CATALOG.map(({ id }) => [id, Object.freeze([...(autoControlKeysById.get(id) ?? [])])]),
    ),
  );

const controlledApiCount = KERN_PLAYGROUND_DEFINITIONS.reduce(
  (total, definition) =>
    total +
    definition.controls.filter(
      ({ binding }) => binding.kind === 'input' || binding.kind === 'model',
    ).length,
  0,
);
const publicApiCount = KERN_CATALOG.reduce(
  (total, item) =>
    total + item.api.filter(({ kind }) => kind === 'input' || kind === 'model').length,
  0,
);

export const KERN_PLAYGROUND_API_COVERAGE: KernPlaygroundApiCoverage = Object.freeze({
  publicInputsAndModels: publicApiCount,
  controlled: controlledApiCount,
  excluded: KERN_PLAYGROUND_API_EXCLUSIONS.length,
  unclassified: publicApiCount - controlledApiCount - KERN_PLAYGROUND_API_EXCLUSIONS.length,
});

const DEFINITION_BY_ID = new Map(
  KERN_PLAYGROUND_DEFINITIONS.map((definition) => [definition.id, definition] as const),
);

export function findKernPlaygroundDefinition(id: string): KernPlaygroundDefinition | undefined {
  return DEFINITION_BY_ID.get(id);
}

function normalizeNumber(control: KernPlaygroundControl, candidate: unknown): number {
  const fallback = Number(control.defaultValue);
  const value = typeof candidate === 'number' && Number.isFinite(candidate) ? candidate : fallback;
  const min = control.min ?? Number.NEGATIVE_INFINITY;
  const max = control.max ?? Number.POSITIVE_INFINITY;
  const clamped = Math.min(max, Math.max(min, value));
  const step = control.step ?? 1;
  if (!Number.isFinite(min) || step <= 0) return clamped;
  const snapped = min + Math.round((clamped - min) / step) * step;
  return Number(Math.min(max, Math.max(min, snapped)).toPrecision(12));
}

function defaultValueFor(definition: KernPlaygroundDefinition, key: string): KernPlaygroundValue {
  const control = definition.controls.find((candidate) => candidate.key === key);
  if (!control) {
    throw new Error(`Unknown playground control "${definition.id}.${key}".`);
  }
  return control.defaultValue;
}

function normalizeIsoDate(value: unknown, fallback: string): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return fallback;
  const [year, month, day] = value.split('-').map(Number);
  if (year === undefined || month === undefined || day === undefined) return fallback;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
    ? value
    : fallback;
}

function normalizeTime(value: unknown, fallback: string): string {
  if (typeof value !== 'string' || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    return fallback;
  }
  return value;
}

function timeInMinutes(value: string): number {
  const [hours = 0, minutes = 0] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

function orderNumbers(values: Record<string, KernPlaygroundValue>, first: string, second: string) {
  const firstValue = values[first];
  const secondValue = values[second];
  if (typeof firstValue !== 'number' || typeof secondValue !== 'number') return;
  if (firstValue > secondValue) {
    values[first] = secondValue;
    values[second] = firstValue;
  }
}

function clampNumber(
  values: Record<string, KernPlaygroundValue>,
  key: string,
  min: number,
  max: number,
): void {
  const value = values[key];
  if (typeof value === 'number') values[key] = Math.min(max, Math.max(min, value));
}

function normalizeCrossFieldValues(
  definition: KernPlaygroundDefinition,
  values: Record<string, KernPlaygroundValue>,
): void {
  if (['number-input', 'range-slider', 'slider'].includes(definition.id)) {
    orderNumbers(values, 'min', 'max');
  }

  if (definition.id === 'date-picker') {
    const defaultMin = String(defaultValueFor(definition, 'min'));
    const defaultMax = String(defaultValueFor(definition, 'max'));
    values['min'] = normalizeIsoDate(values['min'], defaultMin);
    values['max'] = normalizeIsoDate(values['max'], defaultMax);
    if (String(values['min']) > String(values['max'])) {
      const previousMin = values['min'];
      values['min'] = values['max'] ?? defaultMax;
      values['max'] = previousMin ?? defaultMin;
    }
  }

  if (definition.id === 'time-picker') {
    const defaultMin = String(defaultValueFor(definition, 'min'));
    const defaultMax = String(defaultValueFor(definition, 'max'));
    values['min'] = normalizeTime(values['min'], defaultMin);
    values['max'] = normalizeTime(values['max'], defaultMax);
    if (timeInMinutes(String(values['min'])) > timeInMinutes(String(values['max']))) {
      const previousMin = values['min'];
      values['min'] = values['max'] ?? defaultMax;
      values['max'] = previousMin ?? defaultMin;
    }
  }

  if (['circular-progress', 'progress-bar'].includes(definition.id)) {
    const maximum = Math.max(1, Number(values['max']));
    values['max'] = maximum;
    clampNumber(values, 'value', 0, maximum);
  }

  if (definition.id === 'meter') {
    orderNumbers(values, 'min', 'max');
    const minimum = Number(values['min']);
    const maximum = Number(values['max']);
    orderNumbers(values, 'low', 'high');
    clampNumber(values, 'low', minimum, maximum);
    clampNumber(values, 'high', Number(values['low']), maximum);
    clampNumber(values, 'optimum', minimum, maximum);
    clampNumber(values, 'value', minimum, maximum);
  }
}

/**
 * Converts unknown/partial values into the complete, immutable argument object
 * for a definition. Unknown keys are deliberately discarded.
 */
export function normalizeKernPlaygroundValues(
  definition: KernPlaygroundDefinition,
  values: KernPlaygroundValues = {},
): KernPlaygroundValues {
  const normalized: Record<string, KernPlaygroundValue> = {};
  for (const control of definition.controls) {
    const candidate = values[control.key];
    switch (control.kind) {
      case 'boolean':
        normalized[control.key] = typeof candidate === 'boolean' ? candidate : control.defaultValue;
        break;
      case 'number':
      case 'range':
        normalized[control.key] = normalizeNumber(control, candidate);
        break;
      case 'select':
        normalized[control.key] = (control.options ?? []).some(({ value }) =>
          Object.is(value, candidate),
        )
          ? candidate
          : control.defaultValue;
        break;
      case 'text':
        normalized[control.key] = typeof candidate === 'string' ? candidate : control.defaultValue;
        break;
    }
  }
  normalizeCrossFieldValues(definition, normalized);
  return Object.freeze(normalized);
}

/**
 * Resolves state, scenario, and user arguments with deterministic precedence:
 * a non-default preset owns its declared arguments/scenario; unrelated user
 * controls remain intact and are normalized afterward.
 */
export function resolveKernPlaygroundState(
  definition: KernPlaygroundDefinition,
  request: KernPlaygroundStateRequest = {},
): KernResolvedPlaygroundState {
  const requestedState = request.state ?? 'default';
  const requestedStateId = normalizeKernPlaygroundStateId(requestedState);
  const preset =
    definition.presets.find(
      (candidate) =>
        candidate.id === requestedStateId ||
        normalizeKernPlaygroundStateId(candidate.label) === requestedStateId,
    ) ?? definition.presets[0];
  if (!preset) {
    throw new Error(`Playground definition "${definition.id}" has no state presets.`);
  }
  const requestedScenario = request.scenario ?? 'default';
  const supportedScenario = definition.scenarios.includes(requestedScenario)
    ? requestedScenario
    : 'default';
  const scenario = preset.scenario === 'default' ? supportedScenario : preset.scenario;
  const args = normalizeKernPlaygroundValues(definition, {
    ...(request.args ?? {}),
    ...preset.args,
  });

  return Object.freeze({
    preset,
    scenario,
    args,
    environment: Object.freeze({ ...(preset.environment ?? {}) }),
    visualPseudoState: preset.visualPseudoState ?? null,
    fixtureEffect: preset.fixtureEffect ?? null,
  });
}
