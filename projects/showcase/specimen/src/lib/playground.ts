import { KERN_CATALOG, type KernApiRow, type KernCatalogItem } from '@kern-ui/showcase';

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

const CONTROL_SETS: Readonly<Record<string, readonly KernPlaygroundControl[]>> = {
  // Layout
  'app-shell': [
    boolean(
      'mobileNavigationOpen',
      'Mobile navigation open',
      false,
      'Opens the shell navigation surface at mobile breakpoints.',
      modelBinding('mobileNavigationOpen'),
    ),
    text('mainMaxWidth', 'Main max width', '48rem', 'Constrains the primary content measure.'),
    text('sidebarWidth', 'Sidebar width', '10rem', 'Sets the shell sidebar width.'),
  ],
  header: [boolean('elevated', 'Elevated', true, 'Adds the elevated header treatment.')],
  sidebar: [
    boolean(
      'collapsed',
      'Collapsed',
      false,
      'Collapses the sidebar to its configured compact mode.',
      modelBinding('collapsed'),
    ),
    text('width', 'Width', '15rem', 'Sets the expanded sidebar width.'),
  ],
  'navigation-rail': [
    boolean(
      'expanded',
      'Expanded',
      false,
      'Expands the rail to show persistent labels.',
      modelBinding('expanded'),
    ),
  ],
  container: [
    select('size', 'Size', 'sm', 'Changes the maximum container width.', [
      'sm',
      'md',
      'lg',
      'xl',
      'full',
    ]),
  ],
  stack: [
    select('gap', 'Gap', '3', 'Changes the block-axis spacing between projected items.', [
      '2',
      '3',
      '4',
      '8',
    ]),
  ],
  inline: [boolean('wrap', 'Wrap', true, 'Allows inline items to wrap onto another flex line.')],
  cluster: [
    select('gap', 'Gap', '2', 'Changes the spacing between clustered items.', ['1', '2', '4']),
    select(
      'justify',
      'Justify',
      'space-between',
      'Distributes the cluster along its inline axis.',
      ['start', 'center', 'end', 'space-between', 'space-around', 'space-evenly'],
    ),
  ],
  grid: [
    boolean('responsive', 'Responsive', true, 'Enables responsive column collapsing.'),
    select('columns', 'Columns', 3, 'Sets a fixed or automatic column count.', [
      'auto',
      1,
      2,
      3,
      4,
    ]),
    text('gap', 'Gap', '3', 'Sets the grid gutter.'),
  ],
  'split-layout': [
    select('ratio', 'Ratio', '1:2', 'Changes the primary-to-secondary pane ratio.', [
      '1:1',
      '1:2',
      '2:1',
      'golden',
    ]),
    text('gap', 'Gap', '4', 'Sets the separation between panes.'),
  ],
  center: [
    boolean('intrinsic', 'Intrinsic', true, 'Centers the child using its intrinsic inline size.'),
    text('maxWidth', 'Maximum width', '28rem', 'Constrains the centered content measure.'),
  ],
  spacer: [
    select('axis', 'Axis', 'horizontal', 'Chooses the axis that receives spacing.', [
      'horizontal',
      'vertical',
    ]),
    text('size', 'Size', '12', 'Sets the spacer length.'),
  ],
  divider: [
    select(
      'orientation',
      'Orientation',
      'horizontal',
      'Changes the separator axis and accessibility semantics.',
      ['horizontal', 'vertical'],
    ),
    text('label', 'Label', 'Access policy', 'Adds an accessible separator label.'),
  ],
  'aspect-ratio': [
    select('fit', 'Object fit', 'cover', 'Changes how projected media fits the ratio box.', [
      'none',
      'fill',
      'cover',
      'contain',
    ]),
  ],
  'scroll-area': [
    select('axis', 'Scroll axis', 'vertical', 'Chooses the axes that can scroll.', [
      'horizontal',
      'vertical',
      'both',
    ]),
    text('maxBlockSize', 'Maximum block size', '16rem', 'Constrains the scrolling viewport.'),
  ],
  'responsive-show-hide': [
    select(
      'display',
      'Display',
      'block',
      'Chooses the display mode used while the responsive content is visible.',
      ['block', 'inline', 'contents', 'flex', 'grid'],
    ),
    select(
      'from',
      'Visible from',
      'md',
      'Shows the desktop specimen from the selected breakpoint.',
      ['none', 'sm', 'md', 'lg', 'xl'],
    ),
    select(
      'until',
      'Visible until',
      'none',
      'Optionally hides the desktop specimen at the selected breakpoint.',
      ['none', 'sm', 'md', 'lg', 'xl'],
    ),
  ],
  'resizable-panels': [
    boolean('disabled', 'Disabled', false, 'Disables pointer and keyboard resizing.'),
    number('step', 'Step', 5, 'Sets the keyboard resize increment.', 1, 25),
  ],

  // Actions
  'button-group': [
    select(
      'orientation',
      'Orientation',
      'horizontal',
      'Changes only the visual layout; native actions keep document-order keyboard navigation.',
      ['horizontal', 'vertical'],
    ),
    boolean(
      'connected',
      'Connected',
      false,
      'Joins adjacent action borders without changing their semantics or keyboard order.',
    ),
  ],
  'split-button': [
    boolean('open', 'Open', false, 'Opens the secondary action menu.', modelBinding('open')),
    select(
      'menuAlign',
      'Menu alignment',
      'end',
      'Aligns the connected menu to the logical start or end edge of the trigger.',
      ['start', 'end'],
    ),
  ],
  'toggle-group': [
    select(
      'orientation',
      'Orientation',
      'horizontal',
      'Changes the visual layout and Arrow-key axis exposed by the toolbar.',
      ['horizontal', 'vertical'],
    ),
    select('size', 'Size', 'sm', 'Changes the segmented control density.', ['sm', 'md', 'lg']),
    boolean('connected', 'Connected', true, 'Joins toggles into one segmented surface.'),
    boolean('multiple', 'Multiple', false, 'Allows more than one toggle to be selected.'),
    boolean(
      'disabled',
      'Disabled',
      false,
      'Disables every native toggle button while preserving perceivable toolbar semantics.',
    ),
  ],
  'copy-button': [
    select(
      'variant',
      'Variant',
      'outline',
      'Changes visual emphasis without changing clipboard behavior.',
      ['solid', 'soft', 'outline', 'ghost'],
    ),
    select(
      'tone',
      'Tone',
      'neutral',
      'Changes semantic action emphasis without becoming copy-result feedback.',
      ['neutral', 'brand', 'info', 'success', 'warning', 'danger'],
    ),
    actionSize,
    number(
      'feedbackDuration',
      'Feedback duration',
      1_800,
      'Keeps copied or error feedback visible for this many milliseconds.',
      0,
      60_000,
      100,
    ),
    disabled,
    text(
      'value',
      'Value',
      'npm i @kern-ui/angular',
      'Supplies the exact immutable string sent to the clipboard writer.',
    ),
    select(
      'copyState',
      'Operation state',
      'live',
      'Uses the live clipboard by default or a deterministic specimen writer for async states.',
      ['live', 'idle', 'pending', 'copied', 'error'],
      fixtureBinding(
        'interaction',
        'Selects a deterministic clipboard-writer outcome; it is not a component input.',
      ),
    ),
  ],
  link: [
    boolean(
      'externalDestination',
      'External destination',
      false,
      'Switches the fixture from internal navigation to an explicit privacy-hardened external link.',
      fixtureBinding(
        'data',
        'Changes native href, target, and rel attributes; it is not a KrnLink input.',
      ),
    ),
  ],
  'dropdown-button': [
    boolean('open', 'Open', false, 'Opens the dropdown action menu.', modelBinding('open')),
    select(
      'menuAlign',
      'Menu alignment',
      'end',
      'Aligns the connected menu to the logical start or end edge of the trigger.',
      ['start', 'end'],
    ),
  ],

  // Forms
  'form-field': [
    select(
      'state',
      'State',
      'default',
      'Drives a real projected FormControl through default, valid, pending, or invalid state.',
      ['default', 'valid', 'pending', 'invalid'],
      fixtureBinding(
        'interaction',
        'Updates the projected FormControl; state is derived rather than written to Form Field.',
      ),
    ),
    text('label', 'Label', '', 'Changes the visible field label.'),
    boolean(
      'disabled',
      'Disabled',
      false,
      'Disables the projected FormControl.',
      fixtureBinding(
        'interaction',
        'Calls disable or enable on the projected FormControl; it is not a Form Field input.',
      ),
    ),
    boolean(
      'readonly',
      'Read only',
      false,
      'Keeps the projected control focusable while preventing edits.',
      fixtureBinding(
        'interaction',
        'Binds readonly on the projected control; it is not a Form Field input.',
      ),
    ),
    boolean(
      'required',
      'Required',
      true,
      'Marks the projected control as required.',
      fixtureBinding(
        'interaction',
        'Binds required on the projected control; it is not a Form Field input.',
      ),
    ),
  ],
  label: [required],
  hint: [
    text(
      'content',
      'Hint content',
      'Use at least 12 characters.',
      'Changes the projected hint content.',
      fixtureBinding('content', 'Provides the projected text rendered by the hint specimen.'),
    ),
  ],
  'validation-message': [
    text(
      'content',
      'Message',
      'Use 3–48 characters.',
      'Changes the projected validation message.',
      fixtureBinding(
        'content',
        'Provides the projected text rendered by the validation-message specimen.',
      ),
    ),
  ],
  'checkbox-group': [
    disabled,
    text('label', 'Label', 'Included events', 'Names the checkbox group.'),
  ],
  'radio-group': [
    disabled,
    text('label', 'Label', 'Default visibility', 'Names the radio group.'),
    select('orientation', 'Orientation', 'horizontal', 'Changes the choice layout axis.', [
      'horizontal',
      'vertical',
    ]),
  ],
  'color-picker': [invalid],
  'file-upload': [
    boolean('multiple', 'Multiple files', false, 'Allows more than one file to be selected.'),
  ],
  'drag-drop-upload': [
    boolean('multiple', 'Multiple files', false, 'Allows more than one dropped file.'),
  ],
  'verification-code': [
    number('length', 'Length', 6, 'Changes the number of verification cells.', 4, 12),
  ],
  'tags-input': [
    disabled,
    select(
      'autocomplete',
      'Autocomplete',
      'off',
      'Controls native browser autocomplete for the tag editor.',
      ['off', 'on'],
    ),
    number(
      'tabindex',
      'Tab index',
      0,
      'Includes or removes the tag editor from sequential keyboard focus.',
      -1,
      0,
    ),
  ],

  // Navigation
  breadcrumbs: [
    number('maxItems', 'Maximum items', 5, 'Controls when middle breadcrumbs collapse.', 2, 12),
  ],
  stepper: [
    number(
      'activeStep',
      'Active step',
      1,
      'Changes the currently active step.',
      0,
      2,
      1,
      modelBinding('activeStep'),
    ),
  ],
  menu: [boolean('open', 'Open', false, 'Opens the navigation menu.', modelBinding('open'))],
  menubar: [
    select(
      'itemState',
      'Item state',
      'default',
      'Changes the deterministic menubar item fixture.',
      ['default', 'current', 'disabled'],
      fixtureBinding('data', 'Selects current and disabled item records in the menubar fixture.'),
    ),
  ],
  'context-menu': [
    boolean(
      'open',
      'Open',
      false,
      'Opens the context-menu fixture.',
      fixtureBinding(
        'interaction',
        'Invokes the documented context-menu trigger because open is interaction-owned.',
      ),
    ),
  ],
  'tree-navigation': [
    select(
      'selected',
      'Selected item',
      'automations',
      'Changes the selected navigation node.',
      ['overview', 'automations', 'archive'],
      modelBinding('selectedId'),
    ),
  ],
  'bottom-navigation': [
    select(
      'selected',
      'Selected item',
      'overview',
      'Changes the active bottom-navigation destination.',
      ['overview', 'activity', 'reports'],
      modelBinding('value'),
    ),
  ],
  'command-palette': [
    boolean('open', 'Open', false, 'Opens the command palette.', modelBinding('open')),
    text('query', 'Query', '', 'Changes the active command query.', modelBinding('query')),
    text(
      'placeholder',
      'Placeholder',
      'Search commands…',
      'Uses locale-aware command search copy until explicitly changed.',
    ),
    text(
      'closeShortcut',
      'Close shortcut',
      'Esc',
      'Uses the locale-aware close shortcut until explicitly changed.',
    ),
  ],
  'table-of-contents': [
    select(
      'active',
      'Active section',
      'specimen-overview',
      'Changes the active table-of-contents entry.',
      ['specimen-overview', 'specimen-api', 'specimen-a11y'],
      modelBinding('activeId'),
    ),
  ],
  'back-button': [text('label', 'Label', 'Back to components', 'Changes the back-button label.')],
  'skip-link': [
    text(
      'label',
      'Label',
      'Skip specimen navigation',
      'Changes the visible-on-focus skip-link label.',
    ),
  ],

  // Feedback
  banner: [boolean('dismissible', 'Dismissible', false, 'Shows the dismiss action.')],
  toast: [
    boolean(
      'expanded',
      'Expanded',
      false,
      'Expands the toast viewport stack.',
      modelBinding('expanded'),
    ),
  ],
  'empty-state': [
    select('tone', 'Tone', 'neutral', 'Changes the state illustration tone.', [
      'neutral',
      'info',
      'success',
      'warning',
      'danger',
    ]),
  ],
  'error-state': [
    select('tone', 'Tone', 'danger', 'Changes the state illustration tone.', [
      'neutral',
      'info',
      'success',
      'warning',
      'danger',
    ]),
  ],
  'success-state': [
    select('tone', 'Tone', 'success', 'Changes the state illustration tone.', [
      'neutral',
      'info',
      'success',
      'warning',
      'danger',
    ]),
  ],
  'confirmation-pattern': [
    boolean(
      'confirming',
      'Confirming',
      false,
      'Opens the confirmation surface.',
      modelBinding('confirming'),
    ),
  ],

  // Data display
  avatar: [
    boolean(
      'imageFailed',
      'Image fallback',
      false,
      'Shows the deterministic initials fallback.',
      modelBinding('imageFailed'),
    ),
  ],
  'avatar-group': [
    text('overlap', 'Overlap', '0.625rem', 'Changes how far adjacent avatars overlap.'),
  ],
  stat: [
    select('trend', 'Trend', 'up', 'Changes the trend indicator.', ['flat', 'up', 'down']),
    text('detail', 'Detail', '+12.4% this quarter', 'Adds context for the statistic.'),
    text('label', 'Label', 'Active workspaces', 'Names the statistic.'),
    text('value', 'Value', '2,481', 'Sets the displayed statistic value.'),
  ],
  'description-list': [
    select(
      'dataState',
      'Data state',
      'ready',
      'Changes the projected description-item fixture.',
      ['ready', 'empty', 'long-text'],
      fixtureBinding('data', 'Selects populated, empty, or long-text description-item records.'),
    ),
  ],
  list: [
    select('role', 'Role', 'list', 'Switches between static-list and listbox semantics.', [
      'list',
      'listbox',
    ]),
  ],
  'list-item': [boolean('selected', 'Selected', false, 'Shows the selected list-item state.')],
  accordion: [
    boolean(
      'expanded',
      'Expanded item',
      false,
      'Expands the first disclosure in the accordion fixture.',
      fixtureBinding('interaction', 'Controls the open model of the first projected disclosure.'),
    ),
  ],
  disclosure: [
    boolean('open', 'Open', false, 'Expands the disclosure content.', modelBinding('open')),
  ],
  timeline: [
    select(
      'dataState',
      'Data state',
      'ready',
      'Changes the projected timeline-item fixture.',
      ['ready', 'empty', 'long-text'],
      fixtureBinding('data', 'Selects populated, empty, or long-text timeline items.'),
    ),
  ],
  calendar: [
    text(
      'activeMonth',
      'Active month',
      '2026-07',
      'Changes the visible ISO calendar month.',
      modelBinding('activeMonth'),
    ),
    text(
      'focusedDate',
      'Focused date',
      '',
      'Changes the roving-focus ISO date.',
      modelBinding('focusedDate'),
    ),
    text('value', 'Value', '', 'Changes the selected ISO date.', modelBinding('value')),
  ],
  'code-block': [
    select('language', 'Language', 'typescript', 'Changes the displayed language label.', [
      'typescript',
      'html',
      'css',
      'json',
    ]),
    boolean(
      'copied',
      'Copied',
      false,
      'Changes the public copied acknowledgement state.',
      modelBinding('copied'),
    ),
    text(
      'code',
      'Code',
      'const status = 1;',
      'Overrides the production-like runnable code fixture.',
    ),
  ],
  'keyboard-shortcut': [
    select(
      'platform',
      'Platform',
      'macOS',
      'Changes the projected shortcut-key fixture.',
      ['macOS', 'Windows'],
      fixtureBinding('content', 'Selects the documented key sequence rendered by the specimen.'),
    ),
  ],
  rating: [
    number('value', 'Value', 4, 'Changes the selected rating.', 0, 5, 1, modelBinding('value')),
  ],
  'responsive-media': [
    text('aspectRatio', 'Aspect ratio', '16 / 9', 'Changes the responsive media ratio.'),
  ],

  // Patterns
  'user-menu': [boolean('open', 'Open', false, 'Opens the user menu.', modelBinding('open'))],
  'notification-center': [
    select(
      'dataState',
      'Data state',
      'ready',
      'Changes the notification collection fixture.',
      ['ready', 'empty', 'unread'],
      fixtureBinding('data', 'Selects ready, empty, or unread notification records.'),
    ),
  ],
  'global-search': [
    text('query', 'Query', '', 'Changes the active search query.', modelBinding('query')),
    number(
      'activeIndex',
      'Active result',
      0,
      'Changes the active result index.',
      0,
      20,
      1,
      modelBinding('activeIndex'),
    ),
    boolean('open', 'Open', false, 'Opens the search result surface.', modelBinding('open')),
  ],
  'filter-bar': [
    select(
      'activeFilter',
      'Active filter',
      'none',
      'Changes the deterministic filter-value fixture.',
      ['none', 'healthy', 'attention'],
      fixtureBinding(
        'interaction',
        'Seeds the public values model with a deterministic filter selection.',
      ),
    ),
  ],
  'page-header': [text('heading', 'Heading', 'Automation health', 'Changes the page heading.')],
  'settings-panel': [
    boolean('open', 'Open', false, 'Opens the settings panel.', modelBinding('open')),
  ],
  'crud-toolbar': [
    number('selectedCount', 'Selected count', 0, 'Changes the selected-record summary.', 0, 100),
  ],
  'bulk-actions': [
    number('selectedCount', 'Selected count', 3, 'Changes the selected-record summary.', 0, 100),
  ],
  'master-detail-layout': [
    boolean(
      'detailOpen',
      'Detail open',
      false,
      'Shows the detail pane on narrow layouts.',
      modelBinding('detailOpen'),
    ),
  ],
  'dashboard-widget': [
    text('heading', 'Heading', 'Automation health', 'Changes the widget heading.'),
  ],
  'login-form': [loading],
  'profile-form': [
    boolean('saving', 'Saving', false, 'Shows the saving state.'),
    text(
      'dirtyMessage',
      'Dirty message',
      'Unsaved changes',
      'Uses locale-aware unsaved-changes copy until explicitly changed.',
    ),
  ],
  'multi-step-form': [
    number(
      'current',
      'Current step',
      0,
      'Changes the current form step.',
      0,
      2,
      1,
      modelBinding('current'),
    ),
    number(
      'furthestStep',
      'Furthest step',
      0,
      'Changes the furthest completed or visited step.',
      0,
      2,
      1,
      modelBinding('furthestStep'),
    ),
  ],
  'mobile-navigation': [
    select(
      'selected',
      'Selected item',
      'overview',
      'Changes the selected projected navigation destination.',
      ['overview', 'activity', 'settings'],
      fixtureBinding(
        'interaction',
        'Selects the active projected navigation action in the mobile fixture.',
      ),
    ),
  ],
  'responsive-application-shell': [
    boolean(
      'navigationOpen',
      'Navigation open',
      false,
      'Opens the responsive shell navigation.',
      modelBinding('navigationOpen'),
    ),
  ],

  button: [actionVariant, actionTone, actionSize, loading],
  'icon-button': [
    select('variant', 'Variant', 'ghost', 'Changes icon-action emphasis.', [
      'solid',
      'soft',
      'outline',
      'ghost',
    ]),
    select('tone', 'Tone', 'neutral', 'Changes the semantic action tone.', [
      'neutral',
      'brand',
      'info',
      'success',
      'warning',
      'danger',
    ]),
    actionSize,
    loading,
    boolean(
      'disabled',
      'Disabled',
      false,
      'Binds the native disabled attribute and prevents user interaction.',
      fixtureBinding(
        'interaction',
        'Binds disabled directly to the native icon-button host; it is not a component input.',
      ),
    ),
  ],
  'floating-action-button': [
    actionVariant,
    actionTone,
    select('size', 'Size', 'lg', 'Changes the action target and label size.', ['sm', 'md', 'lg']),
    boolean('extended', 'Extended', true, 'Shows or hides the text label.'),
    loading,
    boolean(
      'disabled',
      'Disabled',
      false,
      'Binds the native disabled attribute and prevents user interaction.',
      fixtureBinding(
        'interaction',
        'Binds disabled directly to the native floating-action host; it is not a component input.',
      ),
    ),
  ],
  'toggle-button': [
    disabled,
    boolean('selected', 'Selected', false, 'Selects the action.', modelBinding('pressed')),
  ],
  'text-input': [placeholder, formSize, disabled, readOnly, required, invalid],
  textarea: [
    text(
      'placeholder',
      'Placeholder',
      'Explain what changed and why…',
      'Sets the empty-value prompt.',
    ),
    formSize,
    number('rows', 'Rows', 5, 'Sets the initial number of text rows.', 2, 12),
    number('maxLength', 'Maximum length', 280, 'Limits accepted characters.', 20, 2_000, 10),
    boolean('showCount', 'Show count', true, 'Shows the current character count.'),
    boolean('autoResize', 'Auto resize', true, 'Grows the field as content is entered.'),
    disabled,
    readOnly,
    required,
    invalid,
  ],
  'password-input': [
    text('placeholder', 'Placeholder', 'Enter password', 'Sets the empty-value prompt.'),
    text(
      'hideText',
      'Hide text',
      'Hide',
      'Uses locale-aware password-toggle copy until explicitly changed.',
    ),
    text(
      'showText',
      'Show text',
      'Show',
      'Uses locale-aware password-toggle copy until explicitly changed.',
    ),
    disabled,
    readOnly,
    required,
    invalid,
  ],
  'search-input': [
    text('placeholder', 'Placeholder', 'Search 248 workspaces…', 'Sets the empty search prompt.'),
    disabled,
    readOnly,
    invalid,
  ],
  'number-input': [
    number('min', 'Minimum', 1, 'Sets the lowest accepted value.', -10_000, 10_000),
    number('max', 'Maximum', 500, 'Sets the highest accepted value.', -10_000, 10_000),
    number('step', 'Step', 5, 'Sets the keyboard and stepper increment.', 1, 100),
    boolean('showSteppers', 'Show steppers', true, 'Shows increment and decrement actions.'),
    disabled,
    readOnly,
    required,
    invalid,
  ],
  checkbox: [
    boolean(
      'selected',
      'Checked',
      false,
      'Shows the checked state.',
      fixtureBinding('interaction', 'Seeds the Forms API value used by the checkbox specimen.'),
    ),
    boolean('indeterminate', 'Indeterminate', false, 'Shows a mixed selection state.'),
    disabled,
    readOnly,
    required,
    invalid,
  ],
  radio: [
    boolean(
      'selected',
      'Selected',
      false,
      'Selects the annual billing option.',
      fixtureBinding('interaction', 'Seeds the parent radio-group value used by the specimen.'),
    ),
    disabled,
    readOnly,
  ],
  switch: [
    boolean(
      'selected',
      'Checked',
      false,
      'Turns the setting on.',
      fixtureBinding('interaction', 'Seeds the Forms API value used by the switch specimen.'),
    ),
    disabled,
    readOnly,
    required,
    invalid,
  ],
  select: [
    text('placeholder', 'Placeholder', 'Choose a plan', 'Sets the empty selection prompt.'),
    select('size', 'Size', 'md', 'Changes the control height.', ['sm', 'md', 'lg']),
    select(
      'optionsState',
      'Options state',
      'ready',
      'Shows ready, loading, or error option content.',
      ['ready', 'loading', 'error'],
    ),
    text(
      'emptyText',
      'Empty text',
      'No options',
      'Uses locale-aware empty-options copy until explicitly changed.',
    ),
    text(
      'errorText',
      'Error text',
      'Could not load options',
      'Uses locale-aware option-load failure copy until explicitly changed.',
    ),
    text(
      'loadingText',
      'Loading text',
      'Loading options…',
      'Uses locale-aware loading copy until explicitly changed.',
    ),
    boolean('open', 'Open', false, 'Opens the listbox.', modelBinding('open')),
    disabled,
    readOnly,
    required,
    invalid,
  ],
  'native-select': [
    text('placeholder', 'Placeholder', 'Choose a region', 'Sets the empty selection prompt.'),
    select('size', 'Size', 'md', 'Changes the control height.', ['sm', 'md', 'lg']),
    disabled,
    readOnly,
    required,
    invalid,
  ],
  'multi-select': [
    text('placeholder', 'Placeholder', 'Select owners', 'Sets the empty selection prompt.'),
    select(
      'optionsState',
      'Options state',
      'ready',
      'Shows ready, loading, or error option content.',
      ['ready', 'loading', 'error'],
    ),
    text(
      'emptyText',
      'Empty text',
      'No options',
      'Uses locale-aware empty-options copy until explicitly changed.',
    ),
    text(
      'errorText',
      'Error text',
      'Could not load options',
      'Uses locale-aware option-load failure copy until explicitly changed.',
    ),
    text(
      'loadingText',
      'Loading text',
      'Loading options…',
      'Uses locale-aware loading copy until explicitly changed.',
    ),
    boolean('open', 'Open', false, 'Opens the listbox.', modelBinding('open')),
    disabled,
    readOnly,
    required,
    invalid,
  ],
  combobox: [
    text('placeholder', 'Placeholder', 'Filter plans…', 'Sets the empty input prompt.'),
    select(
      'optionsState',
      'Options state',
      'ready',
      'Shows ready, loading, or error option content.',
      ['ready', 'loading', 'error'],
    ),
    text(
      'emptyText',
      'Empty text',
      'No options',
      'Uses locale-aware empty-options copy until explicitly changed.',
    ),
    text(
      'errorText',
      'Error text',
      'Could not load options',
      'Uses locale-aware option-load failure copy until explicitly changed.',
    ),
    text(
      'loadingText',
      'Loading text',
      'Loading options…',
      'Uses locale-aware loading copy until explicitly changed.',
    ),
    boolean('open', 'Open', false, 'Opens the filtered listbox.', modelBinding('open')),
    disabled,
    readOnly,
    required,
    invalid,
  ],
  autocomplete: [
    text('placeholder', 'Placeholder', 'Type a workspace alias…', 'Sets the empty input prompt.'),
    select(
      'optionsState',
      'Options state',
      'ready',
      'Shows ready, loading, or error suggestions.',
      ['ready', 'loading', 'error'],
    ),
    text(
      'emptyText',
      'Empty text',
      'No options',
      'Uses locale-aware empty-options copy until explicitly changed.',
    ),
    text(
      'errorText',
      'Error text',
      'Could not load options',
      'Uses locale-aware option-load failure copy until explicitly changed.',
    ),
    text(
      'loadingText',
      'Loading text',
      'Loading options…',
      'Uses locale-aware loading copy until explicitly changed.',
    ),
    boolean('open', 'Open', false, 'Opens the suggestions listbox.', modelBinding('open')),
    disabled,
    readOnly,
    required,
    invalid,
  ],
  slider: [
    number('min', 'Minimum', 1, 'Sets the start of the range.', -1_000, 1_000),
    number('max', 'Maximum', 100, 'Sets the end of the range.', -1_000, 1_000),
    number('step', 'Step', 1, 'Sets the keyboard increment.', 1, 100),
    boolean('showValue', 'Show value', true, 'Shows the current numeric value.'),
    disabled,
    readOnly,
    invalid,
  ],
  'range-slider': [
    number('min', 'Minimum', 0, 'Sets the start of the range.', -1_000, 1_000),
    number('max', 'Maximum', 100, 'Sets the end of the range.', -1_000, 1_000),
    number('step', 'Step', 5, 'Sets the keyboard increment.', 1, 100),
    disabled,
    readOnly,
    invalid,
  ],
  'segmented-control': [disabled, readOnly, required, invalid],
  'date-picker': [
    text('min', 'Minimum date', '2026-01-01', 'Sets the first selectable ISO date.'),
    text('max', 'Maximum date', '2027-12-31', 'Sets the last selectable ISO date.'),
    number('weekStartsOn', 'Week starts on', 1, 'Uses 0 for Sunday through 6 for Saturday.', 0, 6),
    disabled,
    readOnly,
    required,
    invalid,
  ],
  'date-range-picker': [disabled, readOnly, required, invalid],
  'time-picker': [
    text('min', 'Minimum time', '08:00', 'Sets the first selectable time.'),
    text('max', 'Maximum time', '20:00', 'Sets the last selectable time.'),
    number('step', 'Step (seconds)', 900, 'Sets the list interval in seconds.', 60, 3_600, 60),
    disabled,
    readOnly,
    required,
    invalid,
  ],
  alert: [
    select('tone', 'Tone', 'success', 'Changes urgency and announcement behavior.', [
      'neutral',
      'info',
      'success',
      'warning',
      'danger',
    ]),
    select('appearance', 'Appearance', 'subtle', 'Changes the alert surface contrast.', [
      'subtle',
      'outline',
      'contrast',
    ]),
    text('title', 'Title', 'Changes published', 'Sets the alert heading.'),
    boolean('dismissible', 'Dismissible', true, 'Shows a close action.'),
  ],
  tooltip: [
    text(
      'text',
      'Text',
      'Copy public link',
      'Sets the concise tooltip content.',
      inputBinding('krnTooltip'),
    ),
    select(
      'position',
      'Position',
      'above',
      'Chooses the preferred placement around the trigger.',
      ['above', 'below', 'before', 'after'],
      inputBinding('krnTooltipPosition'),
    ),
    number(
      'showDelay',
      'Show delay',
      400,
      'Delays opening in milliseconds.',
      0,
      2_000,
      50,
      inputBinding('krnTooltipShowDelay'),
    ),
    number(
      'hideDelay',
      'Hide delay',
      80,
      'Delays closing in milliseconds.',
      0,
      1_000,
      20,
      inputBinding('krnTooltipHideDelay'),
    ),
  ],
  popover: [boolean('open', 'Open', false, 'Opens the popover surface.', modelBinding('open'))],
  'hover-card': [
    number('openDelay', 'Open delay', 350, 'Sets the pointer/focus opening delay.', 0, 2_000, 50),
    number('closeDelay', 'Close delay', 120, 'Sets the pointer/focus closing delay.', 0, 1_000, 20),
  ],
  dialog: [
    text('title', 'Title', 'Edit workspace', 'Sets the dialog heading.'),
    text(
      'description',
      'Description',
      'Changes apply to every member.',
      'Sets the dialog description.',
    ),
    select('size', 'Size', 'md', 'Sets the dialog width.', ['sm', 'md', 'lg']),
    boolean('modal', 'Modal', true, 'Traps focus and makes the background inert.'),
    boolean('open', 'Open', false, 'Opens the modal surface.', modelBinding('open')),
    boolean('showClose', 'Show close', true, 'Shows the close icon action.'),
    boolean('closeOnEscape', 'Close on Escape', true, 'Allows Escape to dismiss the dialog.'),
    closeOnOutside,
  ],
  'alert-dialog': [
    boolean('open', 'Open', false, 'Opens the destructive confirmation.', modelBinding('open')),
    closeOnOutside,
  ],
  drawer: [
    boolean('open', 'Open', false, 'Opens the edge-aligned drawer.', modelBinding('open')),
    select('side', 'Side', 'right', 'Chooses the viewport edge.', [
      'top',
      'right',
      'bottom',
      'left',
    ]),
    select('size', 'Size', 'md', 'Sets the sheet width or height.', ['sm', 'md', 'lg']),
    boolean('modal', 'Modal', true, 'Controls focus trapping and backdrop behavior.'),
    closeOnOutside,
  ],
  'bottom-sheet': [
    boolean('open', 'Open', false, 'Opens the mobile action sheet.', modelBinding('open')),
    select('size', 'Size', 'md', 'Sets the sheet width.', ['sm', 'md', 'lg']),
    boolean('modal', 'Modal', true, 'Controls focus trapping and backdrop behavior.'),
    closeOnOutside,
  ],
  'loading-overlay': [
    boolean('active', 'Active', true, 'Shows or hides the blocking loading layer.'),
    text(
      'label',
      'Label',
      'Importing customer records…',
      'Names the loading operation for assistive technology.',
    ),
  ],
  'progress-bar': [
    range('value', 'Value', 68, 'Sets determinate completion.', 0, 100),
    number('max', 'Maximum', 100, 'Sets the completion scale maximum.', 1, 1_000),
    boolean('indeterminate', 'Indeterminate', false, 'Shows progress without a known value.'),
    text('valueText', 'Value text', '', 'Overrides the computed accessible progress description.'),
  ],
  'circular-progress': [
    range('value', 'Value', 68, 'Sets determinate completion.', 0, 100),
    number('max', 'Maximum', 100, 'Sets the completion scale maximum.', 1, 1_000),
    boolean('indeterminate', 'Indeterminate', false, 'Shows progress without a known value.'),
    boolean('showValue', 'Show value', true, 'Shows the formatted percentage.'),
  ],
  spinner: [text('label', 'Label', 'Refreshing workspace data', 'Sets the accessible label.')],
  skeleton: [
    text('width', 'Width', '100%', 'Sets the placeholder inline size.'),
    text('height', 'Height', '5rem', 'Sets the placeholder block size.'),
    select('shape', 'Shape', 'rectangle', 'Chooses a text, rectangle, or circle silhouette.', [
      'text',
      'rectangle',
      'circle',
    ]),
  ],
  tabs: [
    select(
      'orientation',
      'Orientation',
      'horizontal',
      'Changes visual layout and arrow-key behavior.',
      ['horizontal', 'vertical'],
    ),
    select(
      'selected',
      'Selected tab',
      'overview',
      'Chooses the active tab panel.',
      ['overview', 'activity', 'settings'],
      modelBinding('value'),
    ),
  ],
  'vertical-tabs': [
    select(
      'selected',
      'Selected tab',
      'overview',
      'Chooses the active tab panel.',
      ['overview', 'activity', 'settings'],
      modelBinding('value'),
    ),
  ],
  pagination: [
    number('totalItems', 'Total items', 248, 'Sets the result count.', 0, 100_000),
    number('pageSize', 'Page size', 20, 'Sets results per page.', 1, 1_000),
    number('siblingCount', 'Sibling pages', 1, 'Sets pages shown beside the current page.', 0, 4),
    number('page', 'Current page', 1, 'Controls the active page.', 1, 13, 1, modelBinding('page')),
  ],
  'json-view': [
    number(
      'defaultExpandDepth',
      'Expanded depth',
      2,
      'Sets how many JSON hierarchy levels open initially.',
      0,
      8,
    ),
    text(
      'highlightPattern',
      'Highlight',
      '',
      'Highlights matching text; an empty value leaves the JSON unmarked.',
    ),
    boolean('sortKeys', 'Sort keys', false, 'Sorts object keys alphabetically.'),
    boolean('wrap', 'Wrap lines', true, 'Wraps long keys and values inside the viewport.'),
  ],
  badge: [
    displayTone,
    select('variant', 'Variant', 'subtle', 'Changes badge contrast.', [
      'solid',
      'subtle',
      'outline',
    ]),
    select('size', 'Size', 'md', 'Changes badge density.', ['sm', 'md', 'lg']),
    boolean('status', 'Status marker', false, 'Shows a status dot.'),
  ],
  'status-badge': [
    select('tone', 'Tone', 'success', 'Changes the semantic status color.', [
      'neutral',
      'brand',
      'info',
      'success',
      'warning',
      'danger',
    ]),
  ],
  chip: [
    boolean('interactive', 'Interactive', true, 'Renders the label as a toggle action.'),
    boolean(
      'selected',
      'Selected',
      true,
      'Shows the selected treatment.',
      modelBinding('selected'),
    ),
    boolean('removable', 'Removable', false, 'Shows a remove action.'),
    disabled,
  ],
  tag: [
    boolean('interactive', 'Interactive', false, 'Renders the label as a toggle action.'),
    boolean(
      'selected',
      'Selected',
      false,
      'Shows the selected treatment.',
      modelBinding('selected'),
    ),
    boolean('removable', 'Removable', true, 'Shows a remove action.'),
    disabled,
  ],
  card: [
    text('eyebrow', 'Eyebrow', 'WORKSPACE / 0248', 'Sets compact contextual metadata.'),
    text('heading', 'Heading', 'Northstar', 'Sets the card heading.'),
    boolean('interactive', 'Interactive', true, 'Adds the interactive surface treatment.'),
  ],
  tree: [
    select(
      'dataState',
      'Data state',
      'ready',
      'Shows ready, loading, error, or large-tree data.',
      ['ready', 'loading', 'error', 'stress'],
      fixtureBinding('data', 'Selects the specimen node fixture; it is not a KrnTree input.'),
    ),
    text('selected', 'Selected', '', 'Changes the selected tree node.', modelBinding('selected')),
  ],
  'data-table': [
    select(
      'dataState',
      'Data state',
      'ready',
      'Shows ready, empty, or large datasets.',
      ['ready', 'empty', 'stress'],
      fixtureBinding('data', 'Selects the table row fixture; it is not a KrnDataGrid input.'),
    ),
    boolean('resizable', 'Resizable', false, 'Allows pointer and keyboard column resizing.'),
    boolean(
      'pagination',
      'Pagination',
      false,
      'Paginates the table rows.',
      fixtureBinding('interaction', 'Composes the discriminated client mode for the specimen.'),
    ),
    boolean('compact', 'Compact', false, 'Uses the compact row treatment.'),
    number('pageSize', 'Page size', 4, 'Sets rows per page.', 1, 100),
    text('filter', 'Filter', '', 'Changes the active row filter.', modelBinding('filter')),
    number('page', 'Page', 1, 'Changes the active page.', 1, 1_000, 1, modelBinding('page')),
    select(
      'sortDirection',
      'Sort direction',
      'asc',
      'Changes the active sort direction.',
      ['asc', 'desc'],
      modelBinding('sortDirection'),
    ),
    text('sortKey', 'Sort key', '', 'Changes the active sort column.', modelBinding('sortKey')),
    text(
      'filterPlaceholder',
      'Filter placeholder',
      'Filter rows…',
      'Uses locale-aware filter copy until explicitly changed.',
    ),
  ],
  'data-grid': [
    select(
      'dataState',
      'Data state',
      'ready',
      'Shows ready, loading, error, empty, or large datasets.',
      ['ready', 'loading', 'error', 'empty', 'stress'],
      fixtureBinding('data', 'Selects data/loading/error fixtures and is not a KrnDataGrid input.'),
    ),
    boolean('selectable', 'Selectable', true, 'Adds row selection controls.'),
    boolean(
      'expandable',
      'Expandable',
      true,
      'Adds row expansion controls and turns virtualization off when enabled.',
    ),
    boolean(
      'virtualize',
      'Virtualize',
      false,
      'Virtualizes rows and turns row expansion off because both modes are incompatible.',
      fixtureBinding('interaction', 'Composes virtual or client mode for the specimen.'),
    ),
    boolean('filterable', 'Filterable', true, 'Shows the quick filter.'),
    boolean('resizable', 'Resizable', true, 'Allows pointer and keyboard column resizing.'),
    boolean(
      'pagination',
      'Pagination',
      true,
      'Paginates non-virtual data.',
      fixtureBinding('interaction', 'Composes the discriminated client mode for the specimen.'),
    ),
    boolean('compact', 'Compact', false, 'Uses the compact row treatment.'),
    number('pageSize', 'Page size', 3, 'Sets rows per page.', 1, 100),
    number(
      'viewportHeight',
      'Viewport height',
      360,
      'Sets the virtual viewport height.',
      160,
      720,
      20,
    ),
    text('filter', 'Filter', '', 'Changes the active row filter.', modelBinding('filter')),
    number('page', 'Page', 1, 'Changes the active page.', 1, 1_000, 1, modelBinding('page')),
    select(
      'sortDirection',
      'Sort direction',
      'asc',
      'Changes the active sort direction.',
      ['asc', 'desc'],
      modelBinding('sortDirection'),
    ),
    text('sortKey', 'Sort key', '', 'Changes the active sort column.', modelBinding('sortKey')),
    text(
      'filterPlaceholder',
      'Filter placeholder',
      'Filter rows…',
      'Uses locale-aware filter copy until explicitly changed.',
    ),
  ],
  meter: [
    range('value', 'Value', 68, 'Sets the current measured value.', 0, 100),
    number('min', 'Minimum', 0, 'Sets the lower bound.', 0, 100),
    number('max', 'Maximum', 100, 'Sets the upper bound.', 1, 1_000),
    number('low', 'Low threshold', 40, 'Sets the low-range threshold.', 0, 100),
    number('high', 'High threshold', 80, 'Sets the high-range threshold.', 0, 100),
    number('optimum', 'Optimum', 20, 'Sets the preferred value.', 0, 100),
    text('label', 'Label', 'Storage used', 'Names the meter for assistive technology.'),
  ],
  'line-chart': [chartTitle, chartDescription, chartSummaryLimit],
  'bar-chart': [
    text('title', 'Title', 'Runs by environment', 'Sets the visible chart title.'),
    text('description', 'Description', 'Successful runs', 'Adds concise dataset context.'),
    chartSummaryLimit,
  ],
  'donut-chart': [
    text('title', 'Title', 'Workspace plan mix', 'Sets the visible chart title.'),
    text(
      'description',
      'Description',
      'Current active workspaces',
      'Adds concise dataset context.',
    ),
    chartSummaryLimit,
  ],
};

/**
 * The catalog uses purposeful, production-like fixtures rather than raw
 * component defaults. Keep those fixture defaults explicit so automatically
 * generated public-API controls do not replace useful examples with empty or
 * generic values.
 */
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
