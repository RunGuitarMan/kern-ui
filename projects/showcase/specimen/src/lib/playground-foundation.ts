import type { KernApiRow, KernCatalogItem } from '@kern-ui/showcase';

export type KernSpecimenScenario = 'default' | 'states' | 'stress' | 'virtual';

export type KernPlaygroundValue = string | number | boolean | null;

export type KernPlaygroundValues = Readonly<Record<string, KernPlaygroundValue>>;

export type KernPlaygroundControlKind = 'boolean' | 'number' | 'range' | 'select' | 'text';

export type KernPlaygroundVisualPseudoState = 'active' | 'focus-visible' | 'hover';

/**
 * A deterministic specimen-only effect for an acceptance state that cannot be
 * represented by the component's public inputs/models. Code generators must
 * not serialize this metadata as component API.
 */
export type KernPlaygroundFixtureEffect =
  | {
      readonly kind: 'layout';
      readonly mode: 'alternate' | 'constrained' | 'expanded' | 'overflow';
      readonly label: string;
      readonly description: string;
    }
  | {
      readonly kind: 'content';
      readonly mode:
        'alternate' | 'empty' | 'filled' | 'long-text' | 'with-action' | 'without-action';
      readonly label: string;
      readonly description: string;
    }
  | {
      readonly kind: 'data';
      readonly mode:
        | 'alternate'
        | 'empty'
        | 'error'
        | 'filtered'
        | 'loading'
        | 'selected'
        | 'sorted'
        | 'success'
        | 'virtualized';
      readonly label: string;
      readonly description: string;
    }
  | {
      readonly kind: 'status';
      readonly mode: 'danger' | 'info' | 'neutral' | 'success' | 'warning';
      readonly label: string;
      readonly description: string;
    };

export interface KernPlaygroundEnvironment {
  readonly theme?: 'system' | 'light' | 'dark' | 'high-contrast';
  readonly density?: 'compact' | 'comfortable' | 'spacious';
  readonly direction?: 'ltr' | 'rtl';
  readonly viewport?: 'responsive' | 'phone' | 'tablet';
}

export type KernPlaygroundCodeBinding =
  | {
      readonly kind: 'input';
      readonly publicName: string;
      readonly syntax?: 'attribute' | 'property';
    }
  | {
      readonly kind: 'model';
      readonly publicName: string;
    }
  | {
      readonly kind: 'fixture';
      readonly target: 'content' | 'data' | 'interaction' | 'overlay';
      readonly description: string;
    }
  | {
      readonly kind: 'composition';
      readonly target: 'canvas';
      readonly attribute: 'data-composition';
    };

export interface KernPlaygroundOption {
  readonly label: string;
  readonly value: KernPlaygroundValue;
}

export interface KernPlaygroundControl {
  readonly key: string;
  readonly label: string;
  readonly kind: KernPlaygroundControlKind;
  readonly defaultValue: KernPlaygroundValue;
  /** A valid, deterministic non-default value used by catalog-wide browser verification. */
  readonly testValue: KernPlaygroundValue;
  readonly description: string;
  readonly binding: KernPlaygroundCodeBinding;
  readonly options?: readonly KernPlaygroundOption[];
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
}

export interface KernPlaygroundStatePreset {
  readonly id: string;
  readonly label: string;
  readonly scenario: KernSpecimenScenario;
  readonly args: KernPlaygroundValues;
  readonly environment?: KernPlaygroundEnvironment;
  readonly visualPseudoState?: KernPlaygroundVisualPseudoState;
  /** Rendered by KernComponentSpecimen; never a public component binding. */
  readonly fixtureEffect?: KernPlaygroundFixtureEffect;
}

export interface KernPlaygroundDefinition {
  readonly id: string;
  /** Illustrative preset used by docs and Reset; `default` remains the exhaustive QA baseline. */
  readonly defaultStoryId: string;
  /** A short, teachable subset of the executable presets shown as story tabs. */
  readonly featuredPresetIds: readonly string[];
  /** The first controls a reader needs; the complete control list remains in `controls`. */
  readonly essentialControlKeys: readonly string[];
  /** Whether the target component itself owns user interaction in this specimen. */
  readonly interactive: boolean;
  /** Component ids that provide necessary composition context around the target. */
  readonly supportingComponentIds: readonly string[];
  readonly scenarios: readonly KernSpecimenScenario[];
  /**
   * Stable query-string identifiers. Use `presets` when label, arguments, or
   * environment effects are required.
   */
  readonly states: readonly string[];
  readonly presets: readonly KernPlaygroundStatePreset[];
  readonly controls: readonly KernPlaygroundControl[];
}

export type KernPlaygroundApiExclusionCode =
  | 'accessibility-copy'
  | 'callback'
  | 'complex-data'
  | 'dom-wiring'
  | 'form-serialization'
  | 'locale-environment'
  | 'polymorphic-value'
  | 'template'
  | 'translation-object';

/**
 * Machine-readable accounting for public inputs/models that are intentionally
 * not represented by a scalar playground control.
 */
export interface KernPlaygroundApiExclusion {
  readonly componentId: string;
  readonly publicName: string;
  readonly kind: 'input' | 'model';
  readonly type: string;
  readonly code: KernPlaygroundApiExclusionCode;
  readonly reason: string;
  readonly evidence: {
    readonly category:
      | 'a11y-test'
      | 'component-example'
      | 'forms-integration'
      | 'locale-preview'
      | 'specimen-fixture';
    readonly pointer: string;
  };
}

export interface KernPlaygroundApiCoverage {
  readonly publicInputsAndModels: number;
  readonly controlled: number;
  readonly excluded: number;
  readonly unclassified: number;
}

export interface KernPlaygroundStateRequest {
  readonly state?: string;
  readonly scenario?: KernSpecimenScenario;
  readonly args?: KernPlaygroundValues;
}

export interface KernResolvedPlaygroundState {
  readonly preset: KernPlaygroundStatePreset;
  readonly scenario: KernSpecimenScenario;
  readonly args: KernPlaygroundValues;
  readonly environment: KernPlaygroundEnvironment;
  readonly visualPseudoState: KernPlaygroundVisualPseudoState | null;
  readonly fixtureEffect: KernPlaygroundFixtureEffect | null;
}

const inputBinding = (
  publicName: string,
  syntax: 'attribute' | 'property' = 'property',
): KernPlaygroundCodeBinding => Object.freeze({ kind: 'input', publicName, syntax });

const modelBinding = (publicName: string): KernPlaygroundCodeBinding =>
  Object.freeze({ kind: 'model', publicName });

const fixtureBinding = (
  target: 'content' | 'data' | 'interaction' | 'overlay',
  description: string,
): KernPlaygroundCodeBinding => Object.freeze({ kind: 'fixture', target, description });

const compositionBinding: KernPlaygroundCodeBinding = Object.freeze({
  kind: 'composition',
  target: 'canvas',
  attribute: 'data-composition',
});

const option = (label: string, value: KernPlaygroundValue): KernPlaygroundOption =>
  Object.freeze({
    label,
    value,
  });

const select = (
  key: string,
  label: string,
  defaultValue: KernPlaygroundValue,
  description: string,
  values: readonly KernPlaygroundValue[],
  binding: KernPlaygroundCodeBinding = inputBinding(key),
): KernPlaygroundControl => {
  const options = Object.freeze(values.map((value) => option(String(value), value)));
  return Object.freeze({
    key,
    label,
    kind: 'select',
    defaultValue,
    testValue: options.find(({ value }) => !Object.is(value, defaultValue))?.value ?? defaultValue,
    description,
    binding,
    options,
  });
};

const boolean = (
  key: string,
  label: string,
  defaultValue: boolean,
  description: string,
  binding: KernPlaygroundCodeBinding = inputBinding(key),
): KernPlaygroundControl =>
  Object.freeze({
    key,
    label,
    kind: 'boolean',
    defaultValue,
    testValue: !defaultValue,
    description,
    binding,
  });

const number = (
  key: string,
  label: string,
  defaultValue: number,
  description: string,
  min: number,
  max: number,
  step = 1,
  binding: KernPlaygroundCodeBinding = inputBinding(key),
): KernPlaygroundControl => {
  const candidate = defaultValue + step <= max ? defaultValue + step : defaultValue - step;
  return Object.freeze({
    key,
    label,
    kind: 'number',
    defaultValue,
    testValue: Math.min(max, Math.max(min, candidate)),
    description,
    binding,
    min,
    max,
    step,
  });
};

const range = (
  key: string,
  label: string,
  defaultValue: number,
  description: string,
  min: number,
  max: number,
  step = 1,
  binding: KernPlaygroundCodeBinding = inputBinding(key),
): KernPlaygroundControl => {
  const candidate = defaultValue + step <= max ? defaultValue + step : defaultValue - step;
  return Object.freeze({
    key,
    label,
    kind: 'range',
    defaultValue,
    testValue: Math.min(max, Math.max(min, candidate)),
    description,
    binding,
    min,
    max,
    step,
  });
};

function textTestValue(key: string, defaultValue: string): string {
  const normalized = key.toLocaleLowerCase();
  if (normalized === 'min') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(defaultValue)) return '2026-02-01';
    if (/^\d{2}:\d{2}$/.test(defaultValue)) {
      return defaultValue === '08:00' ? '09:00' : '08:00';
    }
    if (defaultValue.length === 0) return '2026-02-01';
  }
  if (normalized === 'max') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(defaultValue)) return '2026-11-30';
    if (/^\d{2}:\d{2}$/.test(defaultValue)) return '18:00';
    if (defaultValue.length === 0) return '2026-11-30';
  }
  if (normalized.includes('month')) return '2026-08';
  if (normalized.includes('ratio')) return '4 / 3';
  if (
    normalized.includes('date') ||
    normalized === 'today' ||
    /^\d{4}-\d{2}-\d{2}$/.test(defaultValue)
  ) {
    return '2026-08-15';
  }
  if (/^\d{2}:\d{2}$/.test(defaultValue)) return '14:30';
  if (normalized.includes('href')) return '#specimen-overview';
  if (normalized === 'src') return '/favicon.ico';
  if (normalized === 'sortkey') return 'usage';
  if (normalized === 'accept') return '.png,.jpg';
  if (normalized.endsWith('offset')) return defaultValue === '0' ? '1rem' : '0';
  if (
    /(width|height|gutters?|gap|inset|indent|space|size)$/.test(normalized) ||
    /(?:rem|px|%|var\()/.test(defaultValue)
  ) {
    return '20rem';
  }
  if (normalized === 'code') return 'const status = 2;';
  if (defaultValue.length === 0) return 'Alternate value';
  return `${defaultValue} · alternate`;
}

const text = (
  key: string,
  label: string,
  defaultValue: string,
  description: string,
  binding: KernPlaygroundCodeBinding = inputBinding(key),
): KernPlaygroundControl =>
  Object.freeze({
    key,
    label,
    kind: 'text',
    defaultValue,
    testValue: textTestValue(key, defaultValue),
    description,
    binding,
  });

const disabled = boolean('disabled', 'Disabled', false, 'Prevents user interaction.');
const invalid = boolean('invalid', 'Invalid', false, 'Exposes the invalid visual and ARIA state.');
const readOnly = boolean(
  'readOnly',
  'Read only',
  false,
  'Keeps the value focusable while preventing edits.',
  inputBinding('readonly'),
);
const required = boolean('required', 'Required', false, 'Marks the control as required.');
const formSize = select('size', 'Size', 'md', 'Changes the control height and inline padding.', [
  'sm',
  'md',
  'lg',
]);
const placeholder = text('placeholder', 'Placeholder', 'Northstar', 'Sets the empty-value prompt.');
const actionVariant = select(
  'variant',
  'Variant',
  'solid',
  'Changes action emphasis without changing its semantics.',
  ['solid', 'soft', 'outline', 'ghost'],
);
const actionTone = select(
  'tone',
  'Tone',
  'brand',
  'Communicates neutral, branded, informational, or destructive intent.',
  ['neutral', 'brand', 'info', 'success', 'warning', 'danger'],
);
const actionSize = select('size', 'Size', 'md', 'Changes the action target and label size.', [
  'sm',
  'md',
  'lg',
]);
const loading = boolean('loading', 'Loading', false, 'Shows progress and disables activation.');
const closeOnOutside = Object.freeze({
  ...select(
    'closeOnOutside',
    'Outside click',
    null,
    'Inherits the surface policy by default, or explicitly enables or disables outside-click closing.',
    [null, true, false],
  ),
  options: Object.freeze([
    option('Inherit', null),
    option('Enabled', true),
    option('Disabled', false),
  ]),
});
const displayTone = select('tone', 'Tone', 'neutral', 'Changes the semantic color treatment.', [
  'neutral',
  'brand',
  'info',
  'success',
  'warning',
  'danger',
]);
const chartTitle = text('title', 'Title', 'Weekly active users', 'Sets the visible chart title.');
const chartDescription = text(
  'description',
  'Description',
  'Unique members, last 6 days',
  'Adds concise context for the dataset.',
);
const chartSummaryLimit = number(
  'summaryItemLimit',
  'Summary limit',
  12,
  'Limits items in the accessible data summary.',
  1,
  120,
);

const PUBLIC_API_SELECT_OPTIONS: Readonly<Record<string, readonly string[]>> = Object.freeze({
  KrnActionVariant: ['solid', 'soft', 'outline', 'ghost'],
  KrnAutocompleteMode: ['list', 'both', 'inline', 'none'],
  KrnChartNegativeValuePolicy: ['clamp', 'reject'],
  KrnContainerSize: ['sm', 'md', 'lg', 'xl', 'full'],
  KrnDataSortDirection: ['asc', 'desc'],
  KrnDisplayTone: ['neutral', 'brand', 'info', 'success', 'warning', 'danger'],
  KrnFeedbackTone: ['neutral', 'info', 'success', 'warning', 'danger'],
  KrnInputMode: ['none', 'text', 'tel', 'url', 'email', 'numeric', 'decimal', 'search'],
  KrnLayoutAlignment: ['start', 'center', 'end', 'stretch', 'baseline'],
  KrnLayoutAxis: ['horizontal', 'vertical'],
  KrnLayoutJustification: [
    'start',
    'center',
    'end',
    'space-between',
    'space-around',
    'space-evenly',
  ],
  KrnMenuAlignment: ['start', 'end'],
  KrnNavigationOrientation: ['horizontal', 'vertical'],
  KrnOptionsState: ['ready', 'loading', 'error'],
  KrnOrientation: ['horizontal', 'vertical'],
  KrnResponsiveBreakpoint: ['none', 'sm', 'md', 'lg', 'xl'],
  KrnResponsiveDisplay: ['block', 'inline', 'contents', 'flex', 'grid'],
  KrnSize: ['sm', 'md', 'lg'],
  KrnSplitRatio: ['1:1', '1:2', '2:1', 'golden'],
  KrnToastPosition: [
    'top-start',
    'top-center',
    'top-end',
    'bottom-start',
    'bottom-center',
    'bottom-end',
  ],
  KrnTone: ['neutral', 'brand', 'info', 'success', 'warning', 'danger'],
});

const PUBLIC_API_COPY_DEFAULTS: Readonly<Record<string, string>> = Object.freeze({
  accept: 'image/png,image/jpeg',
  code: 'const status = 1;',
  closeShortcut: 'Escape',
  description: 'Operational context for this component.',
  detail: 'Updated a moment ago',
  dirtyMessage: 'You have unsaved changes.',
  emptyText: 'No options',
  error: 'Unable to load data.',
  errorMessage: 'Unable to continue. Check the entered values.',
  errorText: 'Options could not be loaded',
  eyebrow: 'WORKSPACE / 01',
  filter: '',
  filterPlaceholder: 'Filter records',
  heading: 'Workspace overview',
  hideText: 'Hide value',
  hint: 'Use a clear, descriptive value.',
  href: '#specimen',
  icon: '●',
  label: 'Interactive example',
  loadingText: 'Loading options',
  optionalText: 'Optional',
  placeholder: 'Enter a value',
  prompt: 'Confirm this operation?',
  recoveryHref: '#specimen',
  rel: 'noopener',
  separator: '›',
  showText: 'Show value',
  sortKey: 'workspace',
  title: 'Interactive example',
  today: '2026-07-30',
  value: 'Example value',
});

function humanizePublicName(value: string): string {
  const spaced = value
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim();
  return spaced.length > 0 ? spaced[0]!.toUpperCase() + spaced.slice(1) : value;
}

function parseQuotedDefault(value: string): string | undefined {
  const trimmed = value.trim();
  const match = /^(['"])([\s\S]*)\1$/.exec(trimmed);
  return match?.[2];
}

function literalStringOptions(type: string): readonly string[] | undefined {
  const parts = type.split('|').map((part) => part.trim());
  if (parts.length < 2) return undefined;
  const values: string[] = [];
  for (const part of parts) {
    if (part === 'null' || part === 'undefined') continue;
    const value = parseQuotedDefault(part);
    if (value === undefined) return undefined;
    values.push(value);
  }
  return values.length > 1
    ? Object.freeze(values.sort((left, right) => left.localeCompare(right)))
    : undefined;
}

function apiDescription(api: KernApiRow): string {
  const description = api.description.trim();
  return description.length > 0
    ? description
    : `Changes the public ${humanizePublicName(api.name).toLocaleLowerCase()} input.`;
}

function safeStringDefault(api: KernApiRow, options?: readonly string[]): string {
  const parsed = parseQuotedDefault(api.defaultValue);
  if (parsed !== undefined) return parsed;
  if (api.defaultValue.trim() === 'null' || api.defaultValue.trim() === 'undefined') return '';
  if (
    api.type.includes('KrnLayoutSpace') &&
    /^-?(?:\d+(?:\.\d+)?|\.\d+)$/.test(api.defaultValue.trim())
  ) {
    return api.defaultValue.trim();
  }
  const named = PUBLIC_API_COPY_DEFAULTS[api.name];
  if (named !== undefined) return named;
  return options?.[0] ?? humanizePublicName(api.name);
}

function numericBounds(
  api: KernApiRow,
  value: number,
): Readonly<{ min: number; max: number; step: number }> {
  const name = api.name.toLocaleLowerCase();
  if (name.includes('delay') || name.includes('duration')) {
    return Object.freeze({ min: 0, max: Math.max(5_000, value), step: 50 });
  }
  if (name.includes('size') && !name.includes('page')) {
    return Object.freeze({ min: 0, max: Math.max(10_000_000, value), step: 1 });
  }
  if (
    name.includes('count') ||
    name.includes('length') ||
    name.includes('items') ||
    name.includes('files') ||
    name.includes('results') ||
    name.includes('tags') ||
    name.includes('visible')
  ) {
    return Object.freeze({ min: 0, max: Math.max(1_000, value), step: 1 });
  }
  if (name.includes('step')) {
    return Object.freeze({ min: 0, max: Math.max(100, value), step: 1 });
  }
  if (name.includes('page') || name.includes('index')) {
    return Object.freeze({ min: 0, max: Math.max(10_000, value), step: 1 });
  }
  return Object.freeze({
    min: Math.min(-1_000, value),
    max: Math.max(1_000, value),
    step: Number.isInteger(value) ? 1 : 0.1,
  });
}

function safeNumberDefault(api: KernApiRow): number {
  const parsed = Number(api.defaultValue.trim());
  if (Number.isFinite(parsed)) return parsed;
  const name = api.name.toLocaleLowerCase();
  if (name.includes('maxsize')) return 5_000_000;
  if (name.includes('maxfiles')) return 5;
  if (name.includes('maxtags')) return 8;
  if (name.includes('max')) return 100;
  if (name.includes('step')) return 1;
  return 0;
}

function exclusionEvidence(
  componentId: string,
  code: KernPlaygroundApiExclusionCode,
): KernPlaygroundApiExclusion['evidence'] {
  switch (code) {
    case 'accessibility-copy':
    case 'dom-wiring':
      return Object.freeze({
        category: 'a11y-test',
        pointer: `tests/a11y/accessibility.spec.ts#${componentId}`,
      });
    case 'callback':
    case 'template':
      return Object.freeze({
        category: 'component-example',
        pointer: `agent/components/${componentId}.json#/examples/0`,
      });
    case 'form-serialization':
      return Object.freeze({
        category: 'forms-integration',
        pointer: `tests/e2e/enterprise-acceptance.spec.ts#${componentId}`,
      });
    case 'locale-environment':
    case 'translation-object':
      return Object.freeze({
        category: 'locale-preview',
        pointer: `preview/${componentId}?locale=ru-RU`,
      });
    case 'complex-data':
    case 'polymorphic-value':
      return Object.freeze({
        category: 'specimen-fixture',
        pointer: `preview/${componentId}?state=default`,
      });
  }
}

export function normalizeKernPlaygroundApiType(type: string): string {
  const normalized = type.replace(/\s+/g, ' ').trim();
  return normalized === 'string | number' ? 'number | string' : normalized;
}

function publicApiExclusion(
  item: KernCatalogItem,
  api: KernApiRow,
): KernPlaygroundApiExclusion | undefined {
  const type = normalizeKernPlaygroundApiType(api.type);
  const normalizedType =
    type === 'unknown' &&
    (/(?:Label|Id|Ids)$/.test(api.name) || /^(?:aria|describedBy|for|targetId)/i.test(api.name))
      ? 'string'
      : type;
  const base = {
    componentId: item.id,
    publicName: api.name,
    kind: api.kind as 'input' | 'model',
    type: normalizedType,
  } as const;

  if (/TemplateRef</.test(type)) {
    return Object.freeze({
      ...base,
      code: 'template',
      reason:
        'Template inputs require a compiled Angular fixture and cannot be represented by a scalar URL-safe control.',
      evidence: exclusionEvidence(item.id, 'template'),
    });
  }
  if (/=>|Formatter|Handler|Matcher|Predicate|TrackBy|Identity/.test(type)) {
    return Object.freeze({
      ...base,
      code: 'callback',
      reason:
        'Callback inputs require executable application code and are covered by the typed specimen fixture.',
      evidence: exclusionEvidence(item.id, 'callback'),
    });
  }
  if (/Partial<.*(?:Translations|Labels)>/.test(type)) {
    return Object.freeze({
      ...base,
      code: 'translation-object',
      reason:
        'Structured translation overrides are exercised through locale providers, not lossy scalar controls.',
      evidence: exclusionEvidence(item.id, 'translation-object'),
    });
  }
  if (/ReadonlyArray<|ReadonlySet<|Readonly<|Record<|Array</.test(type)) {
    return Object.freeze({
      ...base,
      code: 'complex-data',
      reason:
        'Collection and data-source inputs require typed identities and deterministic fixtures rather than scalar serialization.',
      evidence: exclusionEvidence(item.id, 'complex-data'),
    });
  }
  if (
    api.name !== 'columns' &&
    type.includes(' | ') &&
    /Array<|(?:string \| number|number \| string)|number \| "auto"/.test(type)
  ) {
    return Object.freeze({
      ...base,
      code: 'polymorphic-value',
      reason:
        'This polymorphic value cannot round-trip through one scalar control without changing its public type semantics.',
      evidence: exclusionEvidence(item.id, 'polymorphic-value'),
    });
  }
  if (api.name === 'locale') {
    return Object.freeze({
      ...base,
      code: 'locale-environment',
      reason:
        'Locale is owned by the playground environment selector so every locale-sensitive component changes consistently.',
      evidence: exclusionEvidence(item.id, 'locale-environment'),
    });
  }
  const accessibilityCopy =
    api.name.startsWith('aria') ||
    api.name.includes('Aria') ||
    /(?:LabelledBy|DescribedBy)$/.test(api.name);
  if (
    accessibilityCopy ||
    /(?:Id|Ids)$/.test(api.name) ||
    ['describedBy', 'for', 'initialFocus', 'targetId'].includes(api.name) ||
    /InitialFocus$/.test(api.name)
  ) {
    return Object.freeze({
      ...base,
      code: accessibilityCopy ? 'accessibility-copy' : 'dom-wiring',
      reason: accessibilityCopy
        ? 'Low-value duplicate accessibility copy is validated by the a11y fixture and kept stable while visual parameters change.'
        : 'DOM identity/focus wiring must stay deterministic so labels, overlays, and hydration references remain valid.',
      evidence: exclusionEvidence(item.id, accessibilityCopy ? 'accessibility-copy' : 'dom-wiring'),
    });
  }
  if (/Label$/.test(api.name)) {
    return Object.freeze({
      ...base,
      code: 'accessibility-copy',
      reason:
        'This localizable action label is stable accessibility copy; interaction/state controls exercise the same component behavior without duplicating every locale string.',
      evidence: exclusionEvidence(item.id, 'accessibility-copy'),
    });
  }
  if (api.name === 'name' && (item.category === 'Forms' || item.category === 'Actions')) {
    return Object.freeze({
      ...base,
      code: 'form-serialization',
      reason:
        'Form submission field names do not alter the rendered component and are covered by forms integration tests.',
      evidence: exclusionEvidence(item.id, 'form-serialization'),
    });
  }
  return undefined;
}

function publicApiControl(
  item: KernCatalogItem,
  api: KernApiRow,
  key: string,
): KernPlaygroundControl | KernPlaygroundApiExclusion {
  const excluded = publicApiExclusion(item, api);
  if (excluded) return excluded;
  const binding = api.kind === 'model' ? modelBinding(api.name) : inputBinding(api.name);
  const label = humanizePublicName(api.name);
  const description = apiDescription(api);
  const type = api.type.replace(/\s+/g, ' ').trim();

  if (item.id === 'split-layout' && api.name === 'ratio') {
    return select(key, label, '1:1', description, ['1:1', '1:2', '2:1'], binding);
  }

  if (/^boolean(?: \| (?:null|undefined))*$/.test(type)) {
    return boolean(key, label, api.defaultValue.trim() === 'true', description, binding);
  }

  if (/^number(?: \| undefined)*$/.test(type)) {
    const defaultValue = safeNumberDefault(api);
    const bounds = numericBounds(api, defaultValue);
    return number(
      key,
      label,
      defaultValue,
      description,
      bounds.min,
      bounds.max,
      bounds.step,
      binding,
    );
  }

  const options = literalStringOptions(type) ?? PUBLIC_API_SELECT_OPTIONS[type];
  if (options) {
    const defaultValue = safeStringDefault(api, options);
    return select(
      key,
      label,
      options.includes(defaultValue) ? defaultValue : options[0]!,
      description,
      options,
      binding,
    );
  }

  if (
    /^string(?: \| (?:null|undefined))*$/.test(type) ||
    type === 'KrnLayoutSpace' ||
    type === 'KrnLayoutSpace | null' ||
    type === 'KrnSplitRatio'
  ) {
    return text(key, label, safeStringDefault(api), description, binding);
  }

  if (type === '0 | 1') {
    const defaultValue = api.defaultValue.trim() === '0' ? 0 : 1;
    return Object.freeze({
      key,
      label,
      kind: 'select',
      defaultValue,
      testValue: defaultValue === 0 ? 1 : 0,
      description,
      binding,
      options: Object.freeze([option('0', 0), option('1', 1)]),
    });
  }

  if (api.name === 'columns' || type === "number | 'auto'") {
    return Object.freeze({
      key,
      label,
      kind: 'select',
      defaultValue: api.defaultValue.trim() === "'auto'" ? 'auto' : safeNumberDefault(api),
      testValue: api.defaultValue.trim() === "'auto'" ? 1 : 'auto',
      description,
      binding,
      options: Object.freeze([option('Auto', 'auto'), option('1', 1), option('2', 2)]),
    });
  }

  if (type === 'unknown') {
    if (/^(?:maxFiles|maxSize|maxTags)$/.test(api.name)) {
      const defaultValue = safeNumberDefault(api);
      const bounds = numericBounds(api, defaultValue);
      return number(
        key,
        label,
        defaultValue,
        description,
        bounds.min,
        bounds.max,
        bounds.step,
        binding,
      );
    }
    return text(key, label, safeStringDefault(api), description, binding);
  }

  return Object.freeze({
    componentId: item.id,
    publicName: api.name,
    kind: api.kind as 'input' | 'model',
    type: api.type,
    code: 'complex-data',
    reason:
      'The public type is not a lossless scalar/literal contract and requires a typed specimen fixture.',
    evidence: exclusionEvidence(item.id, 'complex-data'),
  });
}

export {
  inputBinding,
  modelBinding,
  fixtureBinding,
  compositionBinding,
  option,
  select,
  boolean,
  number,
  range,
  textTestValue,
  text,
  disabled,
  invalid,
  readOnly,
  required,
  formSize,
  placeholder,
  actionVariant,
  actionTone,
  actionSize,
  loading,
  closeOnOutside,
  displayTone,
  chartTitle,
  chartDescription,
  chartSummaryLimit,
  publicApiControl,
};
