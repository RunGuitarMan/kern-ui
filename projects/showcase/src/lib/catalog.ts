import {
  KERN_RUNTIME_COMPONENTS,
  type KernRuntimeApiKind,
  type KernRuntimeComponentContract,
} from './generated-component-contract';
import {
  KERN_CATALOG_INDEX,
  type KernCatalogIndexItem,
  type KernCategory,
  type KernComponentStatus,
} from '@kern-ui/showcase/catalog-index';

export interface KernApiRow {
  readonly name: string;
  readonly type: string;
  readonly defaultValue: string;
  readonly description: string;
  readonly kind?: KernRuntimeApiKind;
  readonly required?: boolean;
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

type KernCatalogDocumentationOverride = Partial<
  Pick<KernCatalogItem, 'summary' | 'states' | 'keyboard' | 'accessibility' | 'do' | 'dont'>
>;

const VISUAL_STATES = [
  'default',
  'overflow',
  'long text',
  'dark',
  'high contrast',
  'compact',
  'RTL',
  'mobile',
] as const;

const NON_TEXT_VISUAL_STATES = [
  'default',
  'dark',
  'high contrast',
  'compact',
  'RTL',
  'mobile',
] as const;

const INTERACTION_STATES = ['hover', 'focus-visible', 'active', 'disabled'] as const;

const FORM_FOUNDATION_IDS = /* @__PURE__ */ new Set([
  'form-field',
  'label',
  'hint',
  'validation-message',
]);
const OVERLAY_IDS = /* @__PURE__ */ new Set([
  'tooltip',
  'popover',
  'hover-card',
  'dialog',
  'alert-dialog',
  'drawer',
  'bottom-sheet',
  'context-menu',
  'menu',
  'dropdown-button',
  'command-palette',
]);
const INTERACTIVE_DATA_IDS = /* @__PURE__ */ new Set([
  'accordion',
  'disclosure',
  'tree',
  'json-view',
  'data-table',
  'data-grid',
  'calendar',
  'rating',
  'line-chart',
  'bar-chart',
  'donut-chart',
]);
const NON_TEXT_LAYOUT_IDS = /* @__PURE__ */ new Set([
  'aspect-ratio',
  'divider',
  'responsive-show-hide',
  'spacer',
]);

function statesFor(
  id: string,
  category: KernCategory,
  api: readonly KernApiRow[],
): readonly string[] {
  const apiNames = new Set(api.map((member) => member.name));
  let states: string[] = [
    ...(NON_TEXT_LAYOUT_IDS.has(id) ? NON_TEXT_VISUAL_STATES : VISUAL_STATES),
  ];

  if (category === 'Actions') {
    states.push(...INTERACTION_STATES);
  } else if (category === 'Forms' && !FORM_FOUNDATION_IDS.has(id)) {
    states.push(...INTERACTION_STATES, 'filled', 'empty');
  } else if (category === 'Navigation') {
    states.push(...INTERACTION_STATES, 'current');
  } else if (INTERACTIVE_DATA_IDS.has(id)) {
    states.push(...INTERACTION_STATES);
  } else if (category === 'Patterns') {
    states.push('loading', 'empty', 'error', 'success');
  }

  if (OVERLAY_IDS.has(id)) states.push('closed', 'open', 'nested', 'dismissed');
  if (apiNames.has('loading') || ['spinner', 'skeleton', 'loading-overlay'].includes(id)) {
    states.push('loading');
  }
  if (apiNames.has('disabled')) states.push('disabled');
  if (apiNames.has('readOnly') || apiNames.has('readonly')) states.push('readonly');
  if (apiNames.has('required')) states.push('required');
  if (apiNames.has('invalid')) states.push('invalid');
  if (
    apiNames.has('selected') ||
    apiNames.has('selection') ||
    ['checkbox', 'radio', 'switch', 'toggle-button', 'toggle-group'].includes(id)
  ) {
    states.push('selected', 'unselected');
  }
  if (apiNames.has('open') || apiNames.has('expanded')) states.push('closed', 'open');
  if (apiNames.has('min') || apiNames.has('max')) states.push('minimum', 'maximum');

  switch (id) {
    case 'resizable-panels':
      states.push(
        'handle hover',
        'handle focus-visible',
        'minimum size',
        'maximum size',
        'collapsed',
        'expanded',
      );
      break;
    case 'data-grid':
    case 'data-table':
      states.push(
        'loading',
        'empty',
        'error',
        'sorted',
        'filtered',
        'selected rows',
        'virtualized',
        'pinned columns',
      );
      break;
    case 'tree':
    case 'tree-navigation':
      states.push('loading branch', 'error branch', 'collapsed', 'expanded', 'selected');
      break;
    case 'json-view':
      states.push('collapsed', 'expanded', 'highlighted', 'wrapped');
      break;
    case 'select':
    case 'multi-select':
    case 'combobox':
    case 'autocomplete':
    case 'date-picker':
    case 'date-range-picker':
    case 'time-picker':
    case 'color-picker':
      states.push('closed', 'open', 'empty results', 'async loading');
      break;
    case 'progress-bar':
    case 'circular-progress':
    case 'meter':
      states.push('minimum', 'partial', 'maximum');
      break;
    case 'empty-state':
      states = [...VISUAL_STATES, 'with action', 'without action'];
      break;
    case 'error-state':
      states = [...VISUAL_STATES, 'recoverable', 'terminal', 'with retry'];
      break;
    case 'success-state':
      states = [...VISUAL_STATES, 'with next action', 'without action'];
      break;
  }

  return [...new Set(states)];
}

const SELECTOR_BY_ID: Readonly<Record<string, string>> = {
  button: 'button[krnButton]',
  'icon-button': 'button[krnIconButton]',
  'button-group': 'div[krnButtonGroup]',
  'floating-action-button': 'button[krnFab]',
  'toggle-button': 'button[krnToggleButton]',
  'toggle-group': 'div[krnToggleGroup]',
  link: 'a[krnLink]',
  tooltip: '[krnTooltip]',
};

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

const RUNTIME_COMPONENTS: Readonly<Record<string, KernRuntimeComponentContract>> =
  KERN_RUNTIME_COMPONENTS;

const API_DESCRIPTIONS: Readonly<Record<string, string>> = {
  ariaLabel: 'Accessible name used when visible content is not sufficient.',
  disabled: 'Prevents interaction and participates in the component disabled contract.',
  readOnly: 'Keeps the value perceivable while preventing user edits.',
  required: 'Marks the value as required and participates in Angular Forms validation.',
  invalid: 'Exposes an externally controlled invalid presentation state.',
  loading: 'Prevents duplicate actions and exposes an accessible busy state.',
  connected: 'Joins adjacent action borders and radii without changing child semantics.',
  orientation:
    'Logical axis exposed by the component; behavior follows its documented keyboard contract.',
  value: 'Controlled component value.',
  open: 'Controlled disclosure or overlay state.',
  size: 'Semantic component size.',
  tone: 'Semantic intent; color is never the only state indicator.',
  variant: 'Visual emphasis within the component hierarchy.',
  appearance: 'Named visual treatment resolved through the appearance system.',
  copyingLabel: 'Localized status announced while the clipboard operation is pending.',
  copiedLabel: 'Localized confirmation announced with the visible success indicator.',
  errorLabel: 'Localized failure feedback announced with the visible error indicator.',
  copyLabel: 'Localized visible fallback used when no Copy Button action label is projected.',
  feedbackDuration:
    'Duration in milliseconds that copied or error feedback remains visible before returning to idle.',
  pressedVariant: 'Visual emphasis used while the toggle is pressed.',
  pressedTone: 'Semantic tone used while the toggle is pressed.',
  unpressedVariant: 'Visual emphasis used while the toggle is not pressed.',
  unpressedTone: 'Semantic tone used while the toggle is not pressed.',
  data: 'Immutable data supplied by the consumer.',
  emptyLabel: 'Human-readable empty state announced to assistive technology.',
};

function apiDescription(name: string, kind: KernRuntimeApiKind): string {
  const explicit = API_DESCRIPTIONS[name];
  if (explicit) return explicit;
  if (kind === 'model') return `Controlled ${name} state with a matching ${name}Change output.`;
  if (kind === 'output') return `Emitted when the component completes the ${name} action.`;
  return `Configures the component ${name} contract.`;
}

function apiFor(selector: string): readonly KernApiRow[] {
  const contract = RUNTIME_COMPONENTS[selector];
  if (!contract) return [];
  return contract.api.map((row) => ({
    name: row.name,
    type: row.type,
    defaultValue: row.defaultValue,
    description: apiDescription(row.name, row.kind),
    kind: row.kind,
    required: row.required,
  }));
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

const COMPONENT_OVERRIDES: Readonly<Record<string, KernCatalogDocumentationOverride>> = {
  button: {
    summary:
      'Button. Enhances a native button with Kern hierarchy, visual defaults, and a focus-preserving loading state.',
    keyboard: [
      'Tab focuses the native button',
      'Enter and Space dispatch the native click behavior',
      'A loading button retains focus but suppresses click and form submission',
    ],
    accessibility: [
      'Native type, disabled, name, value, form, accessible naming, descriptions, and pressed state stay on the host button.',
      'Loading uses a persistent polite status and aria-disabled without removing the action from focus order.',
      'aria-disabled is reserved for the derived loading state; use native disabled for ordinary unavailability.',
      'Visible text supplies the accessible name unless the consumer provides a native aria-label.',
    ],
    do: 'Use <button krnButton> and keep native form and event semantics explicit at the call site.',
    dont: 'Do not add role="button", proxy click through a custom output, or use Button as a pressed-state toggle.',
  },
  'icon-button': {
    summary:
      'Icon Button. Enhances a native button with a compact square action target, visual defaults, and a focus-preserving loading state.',
    keyboard: [
      'Tab focuses the native button',
      'Enter and Space dispatch the native click behavior',
      'A loading icon button retains focus but suppresses click and form submission',
    ],
    accessibility: [
      'Every icon-only action has a native aria-label or aria-labelledby on the host button.',
      'Native type, disabled, name, value, form, and aria-describedby relationships stay on the host button.',
      'Loading uses a persistent polite status and aria-disabled without removing the action from focus order.',
      'aria-disabled is reserved for the derived loading state; use native disabled for ordinary unavailability.',
    ],
    do: 'Use <button krnIconButton type="button"> with a native accessible name and native events or form attributes.',
    dont: 'Do not add role="button", proxy native attributes through component inputs, or use Icon Button for managed toggle state; use Toggle Button.',
  },
  'floating-action-button': {
    summary:
      'Floating Action Button. Exposes one high-priority contextual action on a native button with extended or compact geometry.',
    keyboard: [
      'Tab focuses the native floating action',
      'Enter and Space dispatch the native click behavior',
      'A loading floating action retains focus but suppresses click and form submission',
    ],
    accessibility: [
      'The projected label remains the accessible name in both extended and visually compact modes.',
      'Native type, disabled, form, accessible naming, and description relationships stay on the host button.',
      'Loading owns aria-disabled and a persistent polite status; use native disabled for ordinary unavailability.',
    ],
    do: 'Reserve <button krnFab> for one high-priority contextual action and keep its visible label meaningful.',
    dont: 'Do not use Floating Action Button for navigation, multiple equal-priority actions, or consumer-owned aria-disabled state.',
  },
  'toggle-button': {
    summary:
      'Toggle Button. Enhances one native button with controlled pressed state, deterministic aria-pressed semantics, and scoped state appearances.',
    keyboard: [
      'Tab focuses the native button',
      'Enter and Space dispatch the native click behavior',
      'Activation toggles standalone pressed state or delegates to the owning Toggle Group',
    ],
    accessibility: [
      'The native button retains form ownership, accessible naming, descriptions, focus, and click behavior.',
      'aria-pressed is always derived from effective standalone or group state and must not be consumer-authored.',
      'Native disabled state prevents activation; visible text supplies the accessible name unless native ARIA naming is provided.',
      'Pressed state is communicated through aria-pressed and appearance, not color alone.',
    ],
    do: 'Use <button krnToggleButton> with a stable value and bind [(pressed)] for standalone controlled state.',
    dont: 'Do not nest a button, link, or other interactive control inside Toggle Button, and do not bind aria-pressed independently.',
  },
  'toggle-group': {
    summary:
      'Toggle Group. Coordinates stable pressed values across native toggle buttons in a labelled, orientation-aware action toolbar.',
    keyboard: [
      'Tab enters or leaves the toolbar through one remembered roving tab stop',
      'Arrow keys move focus on the configured axis without changing pressed state',
      'Home and End move focus to the first or last enabled toggle; navigation wraps and respects RTL',
      'Enter and Space activate only the focused native toggle button',
    ],
    accessibility: [
      'The canonical <div krnToggleGroup> host exposes role="toolbar", aria-orientation, and a native aria-label or aria-labelledby.',
      'Each direct <button krnToggleButton> retains its native accessible name, aria-pressed state, focus, and activation behavior.',
      'Group disabled state is reflected as aria-disabled on the toolbar and native disabled on every toggle button.',
      'Single mode exposes at most one effective pressed value; duplicate controlled values are canonicalized on the next user transition.',
    ],
    do: 'Use <div krnToggleGroup aria-label="Formatting"> with direct native Toggle Button children and stable unique values.',
    dont: 'Do not use Toggle Group as an Angular form radio control or project arbitrary links and labels; use Radio Group or Segmented Control for a mandatory exclusive choice.',
  },
  'button-group': {
    summary:
      'Button Group. Labels and arranges independent native actions without owning their focus, activation, disabled, loading, or selection state.',
    states: [...VISUAL_STATES, 'connected'],
    keyboard: [
      'Tab visits each enabled native action in document order',
      'Enter and Space activate the focused native button',
      'Orientation and connected styling do not add Arrow-key navigation or a roving tab stop',
    ],
    accessibility: [
      'The canonical <div krnButtonGroup> host exposes role="group" and uses native aria-label or aria-labelledby for its accessible name.',
      'Each child action owns its native accessible name, disabled, loading, form, and activation semantics.',
      'Button Group does not expose selection; use Toggle Group or Segmented Control for a managed choice.',
    ],
    do: 'Use <div krnButtonGroup aria-label="Review actions"> for a small set of related, independent native actions.',
    dont: 'Do not add Arrow-key navigation, selected state, or group-level disabled/loading behavior; use Toggle Group or Segmented Control when the group must own a choice.',
  },
  'copy-button': {
    summary:
      'Copy Button. Copies one explicit string through an injectable clipboard capability and exposes deterministic pending, copied, and error feedback without removing its native button from focus order.',
    states: [
      ...VISUAL_STATES,
      'hover',
      'focus-visible',
      'active',
      'idle',
      'pending',
      'copied',
      'error',
      'disabled',
    ],
    keyboard: [
      'Tab focuses the inner native button',
      'Enter and Space start one clipboard operation',
      'A pending operation retains focus and suppresses duplicate activation',
    ],
    accessibility: [
      'The visible action label supplies a stable accessible name; an explicit ariaLabel override must include that visible label.',
      'One persistent polite sibling status announces pending, copied, and error copy without relying on descendants of the native button.',
      'The inner native button defaults to type="button" and disabled uses native button semantics.',
    ],
    do: 'Pass the exact value, provide a context-specific visible action label, and handle copied or copyError when product behavior depends on the result.',
    dont: 'Do not scrape projected DOM text, mutate navigator.clipboard in tests, or trigger another operation while data-pending="true".',
  },
  link: {
    summary:
      'Link. Enhances one native navigation anchor with KERN inline presentation while the browser or Angular Router owns its destination, relationships, focus, and activation.',
    states: [...VISUAL_STATES, 'hover', 'focus-visible', 'active'],
    keyboard: [
      'Tab follows native document order when the anchor has href or RouterLink',
      'Enter follows the native anchor destination',
      'An anchor without a destination remains a non-navigation placeholder and is not made artificially disabled',
    ],
    accessibility: [
      'href or RouterLink, target, rel, referrerpolicy, download, accessible naming, descriptions, focus, and click stay on the native anchor.',
      'Visible anchor text normally supplies the accessible name; native aria-label or aria-labelledby remains available when context requires it.',
      'KrnLink does not rewrite relationship tokens or referrer policy; external privacy requirements stay explicit at the call site.',
    ],
    do: 'Use <a krnLink> for navigation and keep href or RouterLink plus all native anchor semantics on that host.',
    dont: 'Do not simulate disabled navigation or use Link for an action in the current context; omit unavailable navigation or use a native Button.',
  },
  'form-field': {
    summary:
      'Form Field. Coordinates one projected control with its visible label, optional copy, hints, errors, and Angular state without owning the control value.',
    keyboard: [
      'The projected control owns focus and keyboard behavior',
      'Clicking the associated visible label moves focus to the projected control',
      'Form Field itself does not add a tab stop or intercept control events',
    ],
    accessibility: [
      'Exactly one registered control supplies the field identity and required, disabled, readonly, pending, valid, and invalid state.',
      'A projected KrnLabel replaces the shorthand label so the field never renders two competing visible labels.',
      'aria-describedby references only hints and errors that are currently mounted in the DOM.',
      'Inline errors use a polite live region; the projected control remains the source of truth for Angular Forms state.',
    ],
    do: 'Keep identity and state on the projected control, and disable reactive controls through their FormControl.',
    dont: 'Do not project multiple controls or proxy id, required, disabled, readonly, or state through Form Field.',
  },
  tree: {
    summary:
      'Tree. Presents hierarchical data with one roving tab stop, expansion, selection, and locale-aware typeahead.',
    keyboard: [
      'Arrow Up and Arrow Down move through visible enabled items',
      'Arrow Right expands or enters a branch; Arrow Left collapses or returns to its parent',
      'Home and End jump to the first and last enabled visible items',
      'Typing moves to the next matching visible item',
    ],
    accessibility: [
      'Every node id is a stable, non-empty identifier unique across the complete tree.',
      'Disabled nodes remain perceivable but are skipped by roving focus.',
      'Expansion, hierarchy, position, and selection are exposed through tree semantics.',
    ],
    do: 'Use stable domain identifiers for nodes and preserve them across filtering and refreshes.',
    dont: 'Do not reuse an id in another branch or derive ids from a mutable array index.',
  },
  'data-grid': {
    summary:
      'Data Grid. Provides a typed interactive grid with stable row identity, controlled or client data flow, virtualization, and managed cell actions.',
    keyboard: [
      'Arrow keys, Home, End, Page Up, and Page Down move the single roving grid focus',
      'Enter or F2 enters actions or editing within the focused cell',
      'Escape restores grid navigation from cell action mode',
      'Tab enters or leaves the grid without adding every cell action to the page tab sequence',
    ],
    accessibility: [
      'The grid has one page tab stop and exposes row, column, sort, selection, and virtual position semantics.',
      'Every source occurrence has a stable unique row identity, including repeated object or primitive values.',
      'Virtual mode uses measurable fixed-height rows and intentionally rejects expandable detail rows.',
    ],
    do: 'Use controlled mode for server data, stable domain keys for rows, and cell templates for typed product actions.',
    dont: 'Do not use array indexes as persistent row identity after sorting or filtering, or combine virtual mode with row expansion.',
  },
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
  'json-view': {
    summary:
      'JSON View. Renders structured JSON as a collapsible, searchable tree with typed syntax color and selectable text.',
    keyboard: [
      'Arrow Down and Arrow Up move through visible JSON nodes',
      'Arrow Right expands a collection or moves to its first child',
      'Arrow Left collapses a collection or moves to its parent',
      'Home and End move to the first and last visible nodes',
      'Enter and Space toggle the focused collection',
    ],
    do: 'Use it for inspectable API payloads, configuration, and structured diagnostic data.',
    dont: 'Do not use it as an editable JSON form or for untrusted executable code.',
  },
  'line-chart': {
    keyboard: [
      'Tab reaches the source-data toggle, then the single roving data mark in the plot',
      'Arrow Left and Arrow Right move between data marks and reverse direction in RTL',
      'Home and End move to the first and last data marks',
      'Enter and Space disclose the focused datum through the chart status detail',
      'Keyboard focus reveals the focused datum; Tab leaves the plot without trapping focus',
    ],
  },
  'bar-chart': {
    keyboard: [
      'Tab reaches the source-data toggle, then the single roving data mark in the plot',
      'Arrow Left and Arrow Right move between data marks and reverse direction in RTL',
      'Home and End move to the first and last data marks',
      'Enter and Space disclose the focused datum through the chart status detail',
      'Keyboard focus reveals the focused datum; Tab leaves the plot without trapping focus',
    ],
  },
  'donut-chart': {
    keyboard: [
      'Tab reaches the source-data toggle and every legend button in document order',
      'Keyboard focus on a legend button reveals its matching segment and value',
      'Enter and Space use native button activation for the focused legend item',
      'SVG segment hit targets stay out of the Tab order so the legend is not duplicated',
    ],
  },
};

function createItem(indexItem: KernCatalogIndexItem): KernCatalogItem {
  const { id, name, category, status, variantOf } = indexItem;
  const selector = SELECTOR_BY_ID[id] ?? `krn-${id}`;
  const api = apiFor(selector);

  const item: KernCatalogItem = {
    id,
    name,
    category,
    selector,
    variantOf,
    summary: summaryFor(name, category),
    status,
    states: statesFor(id, category, api),
    keyboard: keyboardFor(category),
    accessibility: [
      'Visible focus indicator with forced-colors support.',
      'Works at 200% text zoom and in narrow containers.',
      'State is communicated by text, shape, or icon in addition to color.',
    ],
    api,
    do: 'Use the smallest semantic primitive that communicates the intended relationship.',
    dont: 'Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.',
  };
  return { ...item, ...COMPONENT_OVERRIDES[id] };
}

export const KERN_CATALOG: readonly KernCatalogItem[] = /* @__PURE__ */ KERN_CATALOG_INDEX.map(
  (item) => createItem(item),
);

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
  keyboardContracts: /* @__PURE__ */ KERN_CATALOG.filter((item) => item.keyboard.length > 0).length,
} as const;
