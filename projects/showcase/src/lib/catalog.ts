export type KernCategory =
  'Layout' | 'Actions' | 'Forms' | 'Navigation' | 'Feedback' | 'Data display' | 'Patterns';

export type KernComponentStatus = 'stable' | 'beta';

export interface KernApiRow {
  readonly name: string;
  readonly type: string;
  readonly defaultValue: string;
  readonly description: string;
}

export interface KernCatalogItem {
  readonly id: string;
  readonly name: string;
  readonly category: KernCategory;
  readonly selector: string;
  readonly variantOf?: string;
  readonly summary: string;
  readonly status: KernComponentStatus;
  readonly states: readonly string[];
  readonly keyboard: readonly string[];
  readonly accessibility: readonly string[];
  readonly api: readonly KernApiRow[];
  readonly do: string;
  readonly dont: string;
}

const COMMON_STATES = [
  'default',
  'hover',
  'focus-visible',
  'active',
  'disabled',
  'overflow',
  'long text',
  'dark',
  'high contrast',
  'compact',
  'RTL',
  'mobile',
] as const;

const INTERACTIVE_STATES = [
  ...COMMON_STATES,
  'loading',
  'selected',
  'invalid',
  'readonly',
] as const;

const ACTION_API: readonly KernApiRow[] = [
  {
    name: 'size',
    type: "'sm' | 'md' | 'lg'",
    defaultValue: "'md'",
    description: 'Control height and internal spacing without shrinking text.',
  },
  {
    name: 'variant',
    type: "'solid' | 'soft' | 'outline' | 'ghost'",
    defaultValue: "'solid'",
    description: 'Visual emphasis within an action hierarchy.',
  },
  {
    name: 'tone',
    type: "'neutral' | 'brand' | 'success' | 'warning' | 'danger'",
    defaultValue: "'neutral'",
    description: 'Semantic intent; never the only state indicator.',
  },
];

const FORM_API: readonly KernApiRow[] = [
  {
    name: 'value',
    type: 'T',
    defaultValue: '—',
    description: 'Typed control value; compatible controls expose Angular Forms integration.',
  },
  {
    name: 'disabled',
    type: 'boolean',
    defaultValue: 'false',
    description: 'Removes the control from interaction and form submission.',
  },
  {
    name: 'readonly',
    type: 'boolean',
    defaultValue: 'false',
    description: 'Keeps the value focusable and readable while preventing edits.',
  },
];

const DATA_API: readonly KernApiRow[] = [
  {
    name: 'data',
    type: 'readonly T[]',
    defaultValue: '[]',
    description: 'Immutable data supplied by the consumer.',
  },
  {
    name: 'emptyLabel',
    type: 'string',
    defaultValue: "'No data'",
    description: 'Human-readable empty state announced to assistive technology.',
  },
];

const GROUPS: Readonly<Record<KernCategory, readonly string[]>> = {
  Layout: [
    'App Shell',
    'Header',
    'Sidebar',
    'Navigation Rail',
    'Container',
    'Stack',
    'Inline',
    'Cluster',
    'Grid',
    'Split Layout',
    'Center',
    'Spacer',
    'Divider',
    'Aspect Ratio',
    'Scroll Area',
    'Responsive Show Hide',
    'Resizable Panels',
  ],
  Actions: [
    'Button',
    'Icon Button',
    'Button Group',
    'Split Button',
    'Floating Action Button',
    'Toggle Button',
    'Toggle Group',
    'Copy Button',
    'Link',
    'Dropdown Button',
  ],
  Forms: [
    'Form Field',
    'Label',
    'Hint',
    'Validation Message',
    'Text Input',
    'Textarea',
    'Password Input',
    'Search Input',
    'Number Input',
    'Checkbox',
    'Checkbox Group',
    'Radio',
    'Radio Group',
    'Switch',
    'Select',
    'Native Select',
    'Multi Select',
    'Combobox',
    'Autocomplete',
    'Slider',
    'Range Slider',
    'Segmented Control',
    'Date Picker',
    'Date Range Picker',
    'Time Picker',
    'Color Picker',
    'File Upload',
    'Drag Drop Upload',
    'Verification Code',
    'Tags Input',
  ],
  Navigation: [
    'Breadcrumbs',
    'Tabs',
    'Vertical Tabs',
    'Pagination',
    'Stepper',
    'Menu',
    'Menubar',
    'Context Menu',
    'Tree Navigation',
    'Bottom Navigation',
    'Command Palette',
    'Table of Contents',
    'Back Button',
    'Skip Link',
  ],
  Feedback: [
    'Alert',
    'Banner',
    'Toast',
    'Tooltip',
    'Popover',
    'Hover Card',
    'Dialog',
    'Alert Dialog',
    'Drawer',
    'Bottom Sheet',
    'Loading Overlay',
    'Progress Bar',
    'Circular Progress',
    'Spinner',
    'Skeleton',
    'Empty State',
    'Error State',
    'Success State',
    'Confirmation Pattern',
  ],
  'Data display': [
    'Badge',
    'Status Badge',
    'Chip',
    'Tag',
    'Avatar',
    'Avatar Group',
    'Card',
    'Stat',
    'Description List',
    'List',
    'List Item',
    'Accordion',
    'Disclosure',
    'Timeline',
    'Tree',
    'Data Table',
    'Data Grid',
    'Calendar',
    'Code Block',
    'Keyboard Shortcut',
    'Meter',
    'Rating',
    'Line Chart',
    'Bar Chart',
    'Donut Chart',
    'Responsive Media',
  ],
  Patterns: [
    'User Menu',
    'Notification Center',
    'Global Search',
    'Filter Bar',
    'Page Header',
    'Settings Panel',
    'CRUD Toolbar',
    'Bulk Actions',
    'Master Detail Layout',
    'Dashboard Widget',
    'Login Form',
    'Profile Form',
    'Multi Step Form',
    'Mobile Navigation',
    'Responsive Application Shell',
  ],
};

const VARIANT_OF: Readonly<Record<string, string>> = {
  'vertical-tabs': 'tabs',
  'status-badge': 'badge',
  tag: 'chip',
  'data-table': 'data-grid',
  'bulk-actions': 'crud-toolbar',
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function summaryFor(name: string, category: KernCategory): string {
  const summaries: Readonly<Record<KernCategory, string>> = {
    Layout:
      'A composable spatial primitive that keeps product layouts predictable across containers.',
    Actions:
      'A deliberate action primitive with a consistent hierarchy, loading behavior, and keyboard contract.',
    Forms:
      'A typed form control with visible state, reliable labeling, and Angular Forms semantics.',
    Navigation:
      'A keyboard-first wayfinding primitive that preserves orientation and current location.',
    Feedback:
      'A perceivable feedback primitive with focus, announcement, and reduced-motion behavior.',
    'Data display':
      'A dense, readable data primitive with semantic structure and resilient overflow.',
    Patterns:
      'A product pattern composed from Kern primitives, intended as a starting point rather than a sealed widget.',
  };

  return `${name}. ${summaries[category]}`;
}

function apiFor(category: KernCategory): readonly KernApiRow[] {
  if (category === 'Actions') return ACTION_API;
  if (category === 'Forms') return FORM_API;
  if (category === 'Data display') return DATA_API;
  return [
    {
      name: 'ariaLabel',
      type: 'string | undefined',
      defaultValue: 'undefined',
      description: 'Optional accessible label when visible content is not sufficient.',
    },
  ];
}

function keyboardFor(category: KernCategory): readonly string[] {
  if (category === 'Actions') return ['Enter / Space activates', 'Tab follows document order'];
  if (category === 'Forms')
    return ['Tab focuses', 'Arrow keys operate grouped controls', 'Escape cancels transient UI'];
  if (category === 'Navigation')
    return ['Arrow keys move within composites', 'Home / End jump', 'Enter activates'];
  if (category === 'Feedback')
    return ['Escape closes modal layers', 'Focus returns to the trigger'];
  if (category === 'Data display')
    return ['Arrow keys navigate interactive data', 'Enter expands or selects'];
  return ['No custom keyboard behavior unless the composition is interactive'];
}

const EDITABLE_OPTION_API: readonly KernApiRow[] = [
  ...FORM_API,
  {
    name: 'options',
    type: 'readonly KrnSelectOption<string>[]',
    defaultValue: 'required',
    description: 'Known values used to filter and render the suggestion list.',
  },
  {
    name: 'allowCustomValue',
    type: 'boolean',
    defaultValue: 'false',
    description: 'When enabled, typed text can be committed without matching an option.',
  },
  {
    name: 'autocompleteMode',
    type: "'none' | 'inline' | 'list' | 'both'",
    defaultValue: "'list'",
    description: 'Communicates how suggestions are exposed to assistive technology.',
  },
];

const AUTOCOMPLETE_OPTION_API: readonly KernApiRow[] = EDITABLE_OPTION_API.map((row) => {
  if (row.name === 'allowCustomValue') {
    return { ...row, defaultValue: 'true' };
  }
  if (row.name === 'autocompleteMode') {
    return { ...row, defaultValue: "'both'" };
  }
  return row;
});

const COMPONENT_OVERRIDES: Readonly<Record<string, Partial<KernCatalogItem>>> = {
  label: {
    summary:
      'Label. Gives a form control its visible accessible name without owning a value, list, or popup.',
    keyboard: ['Click moves focus to the associated control', 'The label itself is not a tab stop'],
    accessibility: [
      'The for value resolves to exactly one control id.',
      'Required state is visible but is not communicated by color alone.',
      'Use a fieldset and legend instead when naming a group of related controls.',
    ],
    do: 'Use it to name an input, select, textarea, or other labelable form control.',
    dont: 'Do not use Label as a picker; it has no selection behavior of its own.',
  },
  select: {
    summary:
      'Select. Opens a styled list and commits exactly one value from a predefined option set.',
    keyboard: [
      'Enter or Space opens the option list',
      'Arrow keys move through options',
      'Enter commits one option',
      'Escape closes without changing the value',
    ],
    do: 'Use it when one known value must be selected and a custom popup is appropriate.',
    dont: 'Do not use it for free-text entry; use Autocomplete when custom values are valid.',
  },
  'native-select': {
    summary:
      'Native Select. Delegates a single predefined selection surface to the browser and operating system.',
    do: 'Use it when platform familiarity, compactness, or native mobile selection is the priority.',
    dont: 'Do not expect the option popup to inherit Kern surface styling across operating systems.',
  },
  'multi-select': {
    summary:
      'Multi Select. Commits several predefined values while keeping the trigger width and selected tokens stable.',
    do: 'Use it when users need a small set of known values and benefit from seeing selections inline.',
    dont: 'Do not use it for an unbounded vocabulary; use Tags Input for user-authored values.',
  },
  combobox: {
    summary:
      'Combobox. Filters a defined option set and commits the value of one explicit selection.',
    keyboard: [
      'Typing filters the available options',
      'Arrow keys move through the filtered list',
      'Enter commits the active option',
      'Escape closes the list without inventing a value',
    ],
    accessibility: [
      'The input exposes role="combobox", list expansion, and the active option.',
      'Option labels remain the source of truth for the committed value.',
      'Empty results are announced without turning arbitrary text into a selection.',
    ],
    api: EDITABLE_OPTION_API,
    do: 'Use it when the submitted value must come from an authoritative list, such as a plan, workspace, or assignee.',
    dont: 'Do not enable custom values when downstream logic expects a known option identifier.',
  },
  autocomplete: {
    summary:
      'Autocomplete. Offers known suggestions while preserving valid free text as the final value.',
    keyboard: [
      'Typing updates the free-text value and filters suggestions',
      'Arrow keys move through suggestions without discarding the query',
      'Enter accepts the active suggestion or commits the typed text',
      'Escape dismisses suggestions and keeps the current text',
    ],
    accessibility: [
      'Use autocompleteMode="both" when the input and suggestion list work together.',
      'Suggestions accelerate entry but do not imply that a match is required.',
      'The final free-text value remains visible and editable after the list closes.',
    ],
    api: AUTOCOMPLETE_OPTION_API,
    do: 'Use it when suggestions make entry faster but a new value is still valid, such as an alias, label, or location.',
    dont: 'Do not use it as a constrained picker when only predefined option identifiers are accepted.',
  },
  'time-picker': {
    summary:
      'Time Picker. Accepts a precise typeable 24-hour time and offers a short set of common choices.',
    keyboard: [
      'Type two digits in the hour and minute fields',
      'Arrow Up and Arrow Down adjust the focused part',
      'Enter applies a valid time',
      'Escape closes without trapping focus',
    ],
    do: 'Use it for precise scheduling when typing HH:mm is faster than scanning a long list.',
    dont: 'Do not render every hour and minute as scrolling columns.',
  },
};

function createItem(name: string, category: KernCategory): KernCatalogItem {
  const id = slugify(name);
  const isInteractive = category === 'Actions' || category === 'Forms' || category === 'Navigation';

  const item: KernCatalogItem = {
    id,
    name,
    category,
    selector: id === 'tooltip' ? '[krnTooltip]' : `krn-${id}`,
    variantOf: VARIANT_OF[id],
    summary: summaryFor(name, category),
    status: 'stable',
    states: isInteractive ? INTERACTIVE_STATES : COMMON_STATES,
    keyboard: keyboardFor(category),
    accessibility: [
      'Visible focus indicator with forced-colors support.',
      'Works at 200% text zoom and in narrow containers.',
      'State is communicated by text, shape, or icon in addition to color.',
    ],
    api: apiFor(category),
    do: 'Use the smallest semantic primitive that communicates the intended relationship.',
    dont: 'Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.',
  };
  return { ...item, ...COMPONENT_OVERRIDES[id] };
}

export const KERN_CATALOG: readonly KernCatalogItem[] = (
  Object.entries(GROUPS) as readonly [KernCategory, readonly string[]][]
).flatMap(([category, names]) => names.map((name) => createItem(name, category)));

export const KERN_CATEGORIES: readonly KernCategory[] = Object.keys(GROUPS) as KernCategory[];

export function findKernComponent(id: string): KernCatalogItem | undefined {
  return KERN_CATALOG.find((item) => item.id === id);
}

export function catalogByCategory(category: KernCategory): readonly KernCatalogItem[] {
  return KERN_CATALOG.filter((item) => item.category === category);
}

export const KERN_COVERAGE = {
  components: KERN_CATALOG.length,
  documented: KERN_CATALOG.length,
  stateMatrices: KERN_CATALOG.length,
  keyboardContracts: KERN_CATALOG.filter((item) => item.keyboard.length > 0).length,
} as const;
