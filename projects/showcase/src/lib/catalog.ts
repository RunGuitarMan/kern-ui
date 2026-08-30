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

const COMPONENT_SUMMARIES: Readonly<Record<string, string>> = {
  'app-shell':
    'Coordinates header, navigation, sidebar, and main content across wide and narrow application layouts.',
  header:
    'Provides a sticky or static header landmark with configurable height, offset, and elevation.',
  sidebar:
    'Provides a collapsible complementary panel that can shrink to icons or hide completely.',
  'navigation-rail':
    'Provides compact primary navigation that expands from a narrow rail to a labelled panel.',
  container:
    'Constrains content width, adds inline gutters, and aligns the content block within its parent.',
  stack:
    'Arranges children vertically with a consistent gap, alignment, and block-axis distribution.',
  inline:
    'Arranges children horizontally with optional wrapping, gap, alignment, and inline-axis distribution.',
  cluster: 'Wraps related items into rows with independent row and column spacing.',
  grid: 'Creates fixed or auto-fitting columns and collapses them responsively in narrow containers.',
  'split-layout':
    'Places two panels in a configurable ratio and stacks them below a container breakpoint.',
  center:
    'Centers child content inside a width-constrained surface. For new work, use Container with intrinsic centering.',
  spacer:
    'Reserves decorative horizontal or vertical space and stays hidden from assistive technology.',
  divider:
    'Separates adjacent content horizontally or vertically, with optional inset and visible label.',
  'aspect-ratio':
    'Maintains a chosen width-to-height ratio while controlling how media fits its box.',
  'scroll-area':
    'Constrains overflowing content to one or both axes with explicit scrollbar and keyboard policies.',
  'responsive-show-hide':
    'Shows or hides projected content between named responsive boundaries without duplicating it.',
  'resizable-panels':
    'Lets users resize adjacent panels by pointer or keyboard while enforcing normalized size limits.',
  button:
    'Enhances a native button with Kern hierarchy, visual defaults, and a focus-preserving loading state.',
  'icon-button':
    'Enhances a native button with a compact square target, required accessible name, and loading state.',
  'button-group':
    'Labels and arranges independent native actions without owning their focus or selection state.',
  'split-button':
    'Pairs one primary native action with a separate menu of closely related secondary actions.',
  'floating-action-button':
    'Exposes one high-priority contextual action with compact or extended floating geometry.',
  'toggle-button':
    'Adds controlled pressed state and deterministic aria-pressed semantics to one native button.',
  'toggle-group':
    'Coordinates pressed values and roving focus across a labelled toolbar of toggle buttons.',
  'copy-button':
    'Copies one explicit value and reports pending, copied, and failed states without moving focus.',
  link: 'Styles a native anchor while the browser or Angular Router retains navigation semantics.',
  'dropdown-button': 'Opens a menu of actions from one labelled native button.',
  'form-field':
    'Connects one projected control to its visible label, optional copy, hints, errors, and Angular state.',
  label: 'Gives one labelable form control a visible accessible name and optional required marker.',
  hint: 'Provides supporting guidance that a Form Field associates with its control.',
  'validation-message':
    'Displays validation feedback and exposes its message to the associated form control.',
  'text-input': 'Captures one line of free text and participates in Angular Forms.',
  textarea: 'Captures multiline text with optional automatic resizing and character count.',
  'password-input':
    'Captures a password and lets users reveal or hide the value with localized controls.',
  'search-input':
    'Captures a query, provides a clear action, and emits explicit search submission.',
  'number-input':
    'Captures a bounded numeric value with optional increment and decrement controls.',
  checkbox: 'Represents an independent boolean choice and supports a separate indeterminate state.',
  'checkbox-group':
    'Labels a set of independent checkbox choices and coordinates their shared form state.',
  radio: 'Represents one option inside a radio group while retaining native radio semantics.',
  'radio-group':
    'Enforces one choice from a labelled set and manages orientation-aware arrow navigation.',
  switch:
    'Controls an immediate on or off setting with switch semantics and supporting description.',
  select: 'Opens a styled list and commits exactly one value from a predefined option set.',
  'native-select':
    'Delegates a single predefined choice to the browser and operating system selection surface.',
  'multi-select':
    'Commits several predefined values while keeping selected items visible in a compact trigger.',
  combobox: 'Filters a defined option set and commits the value of one explicit selection.',
  autocomplete: 'Suggests known values while preserving valid free text as the final value.',
  slider: 'Selects one bounded numeric value through pointer, touch, or keyboard adjustment.',
  'range-slider':
    'Selects a bounded numeric interval with independently labelled start and end thumbs.',
  'segmented-control':
    'Presents a small set of mutually exclusive views or modes as adjacent labelled segments.',
  'date-picker': 'Selects one bounded date from a localized calendar popup.',
  'date-range-picker':
    'Selects an ordered start and end date within localized calendar and boundary rules.',
  'time-picker': 'Accepts a precise 24-hour time and offers a short list of common choices.',
  'color-picker': 'Selects one color through an accessible palette and controlled value.',
  'file-upload': 'Selects one or more files and reports type, size, and file-count rejections.',
  'drag-drop-upload':
    'Presents File Upload as a drop zone. For new work, use File Upload with its drop-zone presentation.',
  'verification-code':
    'Captures a fixed-length verification code across coordinated editable positions.',
  'tags-input':
    'Creates and removes user-authored text values while enforcing count and duplicate rules.',
  breadcrumbs:
    'Shows the current location hierarchy and collapses middle items when space is limited.',
  tabs: 'Switches between related panels with one selected tab and orientation-aware keyboard navigation.',
  'vertical-tabs': 'Presents the Tabs interaction model on a vertical axis.',
  pagination:
    'Moves through a bounded page range while exposing the current page and surrounding context.',
  stepper:
    'Shows progress through an ordered workflow and optionally prevents skipping incomplete steps.',
  menu: 'Opens a transient list of commands and closes after selection or dismissal.',
  menubar: 'Provides persistent top-level commands with roving focus and nested menu navigation.',
  'context-menu':
    'Opens commands for a specific target at the pointer or keyboard invocation point.',
  'tree-navigation':
    'Navigates hierarchical destinations with expansion, selection, and one managed tab stop.',
  'bottom-navigation':
    'Presents a small set of primary destinations in a touch-friendly bottom navigation bar.',
  'command-palette':
    'Searches a command collection and activates the focused result from a modal palette.',
  'table-of-contents':
    'Lists page headings and tracks the section currently active in the reading viewport.',
  'back-button': 'Provides an explicitly labelled native link to the previous product destination.',
  'skip-link': 'Reveals a keyboard shortcut that moves focus directly to the main content target.',
  alert: 'Displays an inline status message with semantic tone and an optional dismiss action.',
  banner:
    'Shows an Alert across the page as a banner. For new work, use Alert with banner placement.',
  toast:
    'Queues transient status messages and controls their position, visible count, and expansion.',
  tooltip: 'Shows short supplemental text on hover or keyboard focus without adding a tab stop.',
  popover:
    'Opens a focusable non-modal surface from an owned trigger and dismisses it predictably.',
  'hover-card': 'Reveals richer non-modal preview content while its trigger is hovered or focused.',
  dialog:
    'Opens a modal or non-modal task surface with title, description, actions, and focus restoration.',
  'alert-dialog':
    'Requests a decision before a consequential action and keeps focus within the modal surface.',
  drawer:
    'Opens a side-anchored task surface with configurable modality, size, and focus restoration.',
  'bottom-sheet': 'Opens a bottom-anchored task surface suited to compact and touch layouts.',
  'loading-overlay':
    'Marks a region as busy and optionally blocks interaction while work is in progress.',
  'progress-bar': 'Shows determinate or indeterminate progress along a horizontal track.',
  'circular-progress':
    'Shows determinate or indeterminate progress in a compact circular indicator.',
  spinner: 'Indicates ongoing work when no meaningful completion percentage is available.',
  skeleton: 'Reserves content geometry with a non-interactive loading placeholder.',
  'empty-state': 'Explains why no content is available and can offer one appropriate next action.',
  'error-state':
    'Presents Empty State for a failed outcome. For new work, use Empty State with the error kind.',
  'success-state':
    'Presents Empty State for a completed outcome. For new work, use Empty State with the success kind.',
  'confirmation-pattern':
    'Adds an explicit confirmation step before a consequential product action.',
  badge: 'Displays compact supporting metadata or a count without implying interactive state.',
  'status-badge':
    'Displays a named domain status with coordinated text and non-color-only styling.',
  chip: 'Displays a compact value that can be selected without becoming a form-control option.',
  tag: 'Displays a compact removable label for a user- or system-assigned value.',
  avatar:
    'Represents a person or entity with an image, fallback initials, and optional presence status.',
  'avatar-group':
    'Overlaps several avatars and summarizes identities that do not fit the visible limit.',
  card: 'Groups related content and optional actions on one bounded surface.',
  stat: 'Pairs one prominent value with its label, context, and optional trend.',
  'description-list': 'Presents term-and-description pairs with responsive semantic grouping.',
  list: 'Provides semantic structure and spacing for a related sequence of items.',
  'list-item':
    'Presents one structured list row with heading, supporting content, and optional actions.',
  accordion: 'Coordinates expansion across a set of labelled disclosure sections.',
  disclosure: 'Reveals or hides one section of supporting content from a labelled trigger.',
  timeline: 'Orders dated or sequential events along a shared visual and semantic axis.',
  tree: 'Presents hierarchical data with expansion, selection, typeahead, and one managed tab stop.',
  'data-table': 'Presents structured rows for scanning, sorting, filtering, and row-level actions.',
  'data-grid':
    'Provides an interactive grid with stable row identity, virtualization, selection, and managed cell actions.',
  calendar: 'Displays a localized month grid and manages bounded date focus and selection.',
  'code-block':
    'Renders selectable source code with language metadata and an optional copy action.',
  'json-view':
    'Renders structured JSON as a collapsible searchable tree with typed syntax styling.',
  'keyboard-shortcut': 'Displays a localized key combination without claiming activation behavior.',
  meter:
    'Shows a scalar measurement within known bounds and interprets low, high, and optimum ranges.',
  rating: 'Captures or displays a bounded ordinal rating with keyboard and pointer interaction.',
  'line-chart':
    'Plots change across an ordered axis and exposes each datum through keyboard navigation.',
  'bar-chart': 'Compares categorical values and exposes each bar through keyboard navigation.',
  'donut-chart':
    'Shows part-to-whole proportions with an interactive legend and accessible data summary.',
  'responsive-media':
    'Frames projected media in a fixed-ratio, clipped surface. For new work, use Aspect Ratio.',
  'user-menu': 'Combines user identity with account and session actions in a transient menu.',
  'notification-center':
    'Collects recent notifications and exposes unread, empty, loading, and error states.',
  'global-search': 'Searches product-wide destinations and actions from one command-style surface.',
  'filter-bar': 'Coordinates visible filters, their current values, and clear or apply actions.',
  'page-header':
    'Composes page context, heading, description, index, and actions into one heading region.',
  'settings-panel': 'Edits a focused group of settings in a dismissible side panel.',
  'crud-toolbar': 'Groups create, search, filter, view, and record actions for a collection.',
  'bulk-actions':
    'Replaces collection actions with operations that apply to the current selection.',
  'master-detail-layout':
    'Coordinates collection and detail panes across wide and narrow viewports.',
  'dashboard-widget':
    'Packages one metric or visualization with context, states, and optional actions.',
  'login-form': 'Collects credentials, exposes validation, and provides recovery navigation.',
  'profile-form': 'Edits core profile fields with validation and explicit save progress.',
  'multi-step-form': 'Coordinates validation, progress, and navigation across a multi-stage form.',
  'mobile-navigation':
    'Composes primary destinations into a compact navigation surface for narrow screens.',
  'responsive-application-shell':
    'Switches application navigation and content structure across wide and narrow viewports.',
};

function summaryFor(id: string, name: string): string {
  const summary = COMPONENT_SUMMARIES[id];
  if (!summary) throw new Error(`Missing component summary for "${id}".`);
  return `${name}. ${summary}`;
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

function apiDescription(
  name: string,
  kind: KernRuntimeApiKind,
  sourceDescription?: string,
): string {
  if (sourceDescription?.trim()) return sourceDescription.trim();
  const explicit = API_DESCRIPTIONS[name];
  if (explicit) return explicit;
  const words = name
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replaceAll(/[_-]+/g, ' ')
    .toLowerCase();
  if (kind === 'model')
    return `Controlled ${words} state with a matching Angular model-change output.`;
  if (kind === 'output') return `Notifies the consumer after the ${words} interaction completes.`;
  return `Defines the component's ${words} behavior or presentation.`;
}

function apiFor(selector: string): readonly KernApiRow[] {
  const contract = RUNTIME_COMPONENTS[selector];
  if (!contract) return [];
  return contract.api.map((row) => ({
    name: row.name,
    type: row.type,
    defaultValue: row.defaultValue,
    description: apiDescription(row.name, row.kind, row.description),
    kind: row.kind,
    required: row.required,
  }));
}

const KEYBOARD_BY_ID: Readonly<Record<string, readonly string[]>> = {
  'split-button': [
    'Tab visits the primary and menu actions in document order',
    'Enter or Space activates the focused action',
    'Arrow Down opens the secondary menu; Escape closes it and restores focus',
  ],
  'dropdown-button': [
    'Tab focuses the native trigger button',
    'Enter, Space, or Arrow Down opens the menu',
    'Arrow keys move through menu items; Escape closes the menu and restores focus',
  ],
  'form-field': ['The projected control owns focus and all keyboard interaction'],
  label: ['Clicking the label moves focus to its associated control'],
  hint: ['Hint is not focusable and adds no keyboard interaction'],
  'validation-message': ['Validation Message is not focusable and adds no keyboard interaction'],
  'text-input': [
    'Tab focuses the native input; native editing and selection keys remain available',
  ],
  textarea: [
    'Tab focuses the textarea; native multiline editing and selection keys remain available',
  ],
  'password-input': [
    'Tab visits the password input and reveal action in document order',
    'Enter or Space toggles password visibility from the reveal action',
  ],
  'search-input': [
    'Tab focuses the search field and its clear action',
    'Enter submits the current query; Escape dismisses transient suggestions when present',
  ],
  'number-input': [
    'Tab focuses the numeric input and optional stepper actions',
    'Arrow Up and Arrow Down adjust the value by the configured step',
  ],
  checkbox: ['Tab focuses the checkbox; Space toggles checked state'],
  'checkbox-group': ['Tab follows native checkbox order; Space toggles the focused checkbox'],
  radio: ['Tab follows the owning radio-group contract; Arrow keys change the group selection'],
  'radio-group': [
    'Tab enters or leaves the group through its selected or first enabled radio',
    'Arrow keys move and select within the configured orientation',
  ],
  switch: ['Tab focuses the switch; Space toggles its checked state'],
  select: [
    'Enter or Space opens the option list',
    'Arrow keys move through options; Enter commits; Escape closes without a new value',
  ],
  'native-select': ['Uses the browser and operating system keyboard behavior for a native select'],
  'multi-select': [
    'Enter or Space opens the option list',
    'Arrow keys move through options; Enter toggles a value; Escape closes the list',
  ],
  combobox: [
    'Typing filters the option list',
    'Arrow keys move through results; Enter commits an option; Escape closes the list',
  ],
  autocomplete: [
    'Typing updates free text and filters suggestions',
    'Arrow keys move through suggestions; Enter accepts one or keeps valid typed text',
  ],
  slider: ['Arrow keys adjust by one step; Page Up, Page Down, Home, and End make larger moves'],
  'range-slider': [
    'Tab moves between the start and end thumbs',
    'Arrow keys adjust the focused thumb without crossing the other value',
  ],
  'segmented-control': [
    'Tab enters the selected segment',
    'Arrow keys move and select a segment according to orientation and text direction',
  ],
  'date-picker': [
    'Enter or Space opens the calendar',
    'Arrow keys move by day; Page keys move by month; Enter selects; Escape closes',
  ],
  'date-range-picker': [
    'Enter or Space opens the calendar',
    'Arrow keys move by day; Enter chooses range boundaries; Escape closes',
  ],
  'time-picker': [
    'Typing edits the focused hour or minute part',
    'Arrow keys adjust the part; Enter applies a valid time; Escape closes',
  ],
  'color-picker': ['Arrow keys move through colors; Enter or Space commits the focused color'],
  'file-upload': ['Enter or Space on the browse action opens the native file picker'],
  'drag-drop-upload': [
    'Enter or Space on the browse action opens the native file picker',
    'Drag and drop is an additional pointer path, not the only way to add files',
  ],
  'verification-code': [
    'Typing fills the focused position and advances when possible',
    'Backspace clears and moves backward; arrow keys move between positions',
  ],
  'tags-input': [
    'Enter commits a valid draft tag',
    'Backspace removes the previous tag from an empty input; arrow keys move through tags',
  ],
  breadcrumbs: ['Tab visits destination links in document order; Enter follows the focused link'],
  tabs: [
    'Arrow keys move focus between tabs according to orientation and text direction',
    'Home and End move to the first and last tab; Enter or Space selects when activation is manual',
  ],
  'vertical-tabs': [
    'Arrow Up and Arrow Down move focus between tabs',
    'Home and End move to the first and last tab; Enter or Space selects when activation is manual',
  ],
  pagination: ['Tab visits page actions; Enter activates the focused page or boundary action'],
  stepper: ['Tab visits available step actions; Enter activates an allowed step'],
  menu: [
    'Arrow keys move through menu items; Home and End move to the boundaries',
    'Enter or Space activates an item; Escape closes and restores trigger focus',
  ],
  menubar: [
    'Arrow keys move across top-level items and through open submenus',
    'Enter or Space opens or activates; Escape closes the active submenu',
  ],
  'context-menu': [
    'Shift+F10 or the Context Menu key opens commands for the focused target',
    'Arrow keys move through commands; Escape closes and restores target focus',
  ],
  'tree-navigation': [
    'Arrow keys move through visible destinations and expand or collapse branches',
    'Home and End move to boundaries; Enter activates the focused destination',
  ],
  'bottom-navigation': ['Tab visits each destination; Enter follows the focused native link'],
  'command-palette': [
    'Typing filters commands; Arrow keys move the active result',
    'Enter activates the result; Escape closes and restores focus',
  ],
  'table-of-contents': [
    'Tab visits heading links in document order; Enter follows the focused link',
  ],
  'back-button': ['Tab focuses the native link; Enter follows its destination'],
  'skip-link': ['Tab reveals and focuses the link; Enter moves focus to the main content target'],
  tooltip: ['Focus shows the tooltip without adding a tab stop; Escape dismisses visible content'],
  popover: ['Enter or Space toggles the trigger; Escape closes and restores focus'],
  'hover-card': ['Focus reveals the card; Escape dismisses it without moving trigger focus'],
  dialog: [
    'Tab stays within a modal dialog; Escape closes when allowed and focus returns to the trigger',
  ],
  'alert-dialog': ['Tab stays within the alert dialog; Escape closes only when explicitly allowed'],
  drawer: ['Tab stays within a modal drawer; Escape closes when allowed and focus returns'],
  'bottom-sheet': ['Tab stays within a modal sheet; Escape closes when allowed and focus returns'],
  accordion: ['Enter or Space toggles a header; arrow keys move among accordion headers'],
  disclosure: ['Enter or Space toggles the disclosure trigger'],
  tree: [
    'Arrow keys move through visible nodes and expand or collapse branches',
    'Home and End move to boundaries; typing performs typeahead; Enter selects',
  ],
  'data-table': [
    'Tab reaches table-owned actions in document order',
    'Sorting and row actions use their native button keyboard behavior',
  ],
  'data-grid': [
    'Arrow keys, Home, End, Page Up, and Page Down move the single grid focus',
    'Enter or F2 enters cell actions; Escape returns to grid navigation',
  ],
  calendar: [
    'Arrow keys move the focused date; Page keys change month',
    'Home and End move within the week; Enter or Space selects the date',
  ],
  'code-block': ['Tab reaches the optional copy action; code text remains natively selectable'],
  rating: ['Arrow keys adjust the rating; Home and End select the minimum and maximum'],
  'line-chart': [
    'Arrow Left and Arrow Right move the roving focus between data marks',
    'Home and End move to boundaries; Enter or Space discloses the focused value',
  ],
  'bar-chart': [
    'Arrow Left and Arrow Right move the roving focus between data marks',
    'Home and End move to boundaries; Enter or Space discloses the focused value',
  ],
  'donut-chart': ['Tab visits legend buttons; Enter or Space activates the focused legend item'],
};

function keyboardFor(id: string, category: KernCategory): readonly string[] {
  const keyboard = KEYBOARD_BY_ID[id];
  if (keyboard) return keyboard;
  if (category === 'Patterns') {
    return [
      'Keyboard behavior is provided by the native elements and Kern primitives in the recipe',
    ];
  }
  return ['The component adds no keyboard interaction or tab stop of its own'];
}

const ACCESSIBILITY_BY_ID: Readonly<Record<string, readonly string[]>> = {
  'app-shell': [
    'Keeps header, navigation, complementary, and main landmarks in a stable document order.',
    'Mobile navigation owns its accessible name, focus entry, dismissal, and focus restoration.',
  ],
  header: [
    'Renders a native header landmark and accepts aria-label or aria-labelledby when more than one header exists.',
    'Sticky positioning does not change reading or focus order.',
  ],
  sidebar: [
    'Renders a complementary landmark with a stable accessible name and description relationship.',
    'Hidden collapse mode removes unavailable content from interaction as well as presentation.',
  ],
  'navigation-rail': [
    'Renders a navigation landmark with a stable accessible name and description relationship.',
    'Expansion changes available labels and width without changing destination order.',
  ],
  spacer: ['Is always aria-hidden because it communicates spacing, not content.'],
  divider: [
    'Exposes separator semantics and the configured orientation.',
    'A visible label supplements rather than replaces the surrounding section structure.',
  ],
  'responsive-show-hide': [
    'Hidden content is removed consistently from visual display and the accessibility tree.',
    'Responsive visibility never changes the relative order of content that remains present.',
  ],
  'resizable-panels': [
    'Resize handles expose separator value, orientation, and min/max state.',
    'Pointer and keyboard resizing produce the same bounded panel sizes.',
  ],
  'form-field': [
    'Exactly one projected control supplies field identity and Angular form state.',
    'Only mounted hints and errors are included in the control description relationship.',
  ],
  label: [
    'The for value resolves to one labelable control id.',
    'Required state is visible and is not communicated by color alone.',
  ],
  hint: ['The hint id is composed into the associated control aria-describedby relationship.'],
  'validation-message': [
    'The message is visibly associated with the invalid control and announced with appropriate urgency.',
  ],
  tooltip: [
    'The trigger retains its native role and accessible name.',
    'Tooltip text is referenced as a description and is available on both hover and focus.',
  ],
  popover: [
    'The owned trigger exposes expanded state and the relationship to the popover surface.',
    'Dismissal restores focus without turning the popover into an implicit modal dialog.',
  ],
  'hover-card': [
    'Preview content supplements the trigger and does not replace its accessible name.',
    'Hover and focus provide equivalent access to the same content.',
  ],
  dialog: [
    'The surface has dialog semantics and a visible title or explicit accessible name.',
    'Modal mode traps focus, hides background interaction, and restores focus after exit.',
  ],
  'alert-dialog': [
    'The surface exposes alertdialog semantics with a visible decision and consequence.',
    'Initial focus, modal containment, and restoration follow the destructive decision flow.',
  ],
  drawer: [
    'The surface exposes dialog semantics with an accessible title or name.',
    'Modal drawers contain focus; non-modal drawers leave document navigation available.',
  ],
  'bottom-sheet': [
    'The surface exposes dialog semantics independent of its bottom placement.',
    'Modal sheets contain focus and restore it after the closing transition.',
  ],
  'loading-overlay': [
    'The owned region exposes busy state while visible.',
    'Blocking mode prevents interaction without removing the region or its status from perception.',
  ],
  'progress-bar': ['Exposes progressbar semantics with current bounds or an indeterminate state.'],
  'circular-progress': ['Exposes progressbar semantics independent of its circular presentation.'],
  spinner: ['Provides an accessible busy label without exposing meaningless numeric progress.'],
  skeleton: [
    'Is hidden from assistive technology so the eventual content remains the semantic target.',
  ],
  'empty-state': [
    'Uses visible title and description; any next action retains native button or link semantics.',
  ],
  'error-state': [
    'Keeps the failure message visible and associates recovery actions with clear labels.',
  ],
  'success-state': ['Communicates completion with text and iconography rather than color alone.'],
  tree: [
    'Exposes tree, treeitem, level, position, expansion, and selection semantics.',
    'Stable unique node ids preserve roving focus through updates.',
  ],
  'data-table': [
    'Uses table structure with programmatic headers and sort state.',
    'Row actions retain native names and remain reachable in a predictable order.',
  ],
  'data-grid': [
    'Exposes grid row, column, sort, selection, and virtual-position semantics.',
    'One roving page tab stop prevents every cell action from entering the page tab sequence.',
  ],
  'line-chart': [
    'Provides a visible chart title, description, keyboard data marks, and source-data summary.',
    'Color is supplemented by series names and explicit values.',
  ],
  'bar-chart': [
    'Provides a visible chart title, description, keyboard data marks, and source-data summary.',
    'Color is supplemented by category names and explicit values.',
  ],
  'donut-chart': [
    'Provides a visible title, description, interactive legend, and source-data summary.',
    'Segment color is supplemented by legend text and explicit values.',
  ],
};

function accessibilityFor(id: string, category: KernCategory): readonly string[] {
  const accessibility = ACCESSIBILITY_BY_ID[id];
  if (accessibility) return accessibility;
  if (category === 'Layout') {
    return [
      'Projected content retains its document order and native semantics as layout changes.',
      'Logical sizing and placement work in both LTR and RTL without duplicating content.',
    ];
  }
  if (category === 'Actions') {
    return [
      'Native buttons and links retain their accessible names, focus, activation, and form behavior.',
      'Disabled, loading, pressed, and destructive states are not communicated by color alone.',
    ];
  }
  if (category === 'Forms') {
    return [
      'The real form control retains its visible name, described-by relationships, and Angular state.',
      'Required, readonly, disabled, and invalid states remain programmatically perceivable.',
    ];
  }
  if (category === 'Navigation') {
    return [
      'Destinations retain native link semantics and expose current location where applicable.',
      'Composite navigation uses one documented focus model without changing reading order.',
    ];
  }
  if (category === 'Feedback') {
    return [
      'Visible copy and semantic role communicate feedback independently of color or motion.',
      'Announcements use only the urgency required by the message.',
    ];
  }
  if (category === 'Data display') {
    return [
      'Visible labels and semantic structure preserve the meaning and relationships in the data.',
      'Interactive descendants retain native names and a predictable focus order.',
    ];
  }
  return [
    'The recipe preserves the accessible names, roles, states, and focus behavior of its primitives.',
    'Loading, empty, error, and success states remain visible and programmatically perceivable.',
  ];
}

function defaultGuidance(id: string, name: string): Readonly<Pick<KernCatalogItem, 'do' | 'dont'>> {
  return {
    do: `Use ${name} for this specific contract: ${COMPONENT_SUMMARIES[id]}`,
    dont: `Do not choose ${name} for visual similarity alone; its semantics and interaction model must match the product task.`,
  };
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
  const guidance = defaultGuidance(id, name);

  const item: KernCatalogItem = {
    id,
    name,
    category,
    selector,
    variantOf,
    summary: summaryFor(id, name),
    status,
    states: statesFor(id, category, api),
    keyboard: keyboardFor(id, category),
    accessibility: accessibilityFor(id, category),
    api,
    do: guidance.do,
    dont: guidance.dont,
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
