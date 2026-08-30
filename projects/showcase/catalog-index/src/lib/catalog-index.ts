export type KernCategory =
  'Layout' | 'Actions' | 'Forms' | 'Navigation' | 'Feedback' | 'Data display' | 'Patterns';

export type KernComponentStatus = 'stable' | 'beta' | 'experimental' | 'recipe' | 'deprecated';

/** Lightweight routing and navigation metadata that does not pull in runtime API contracts. */
export interface KernCatalogIndexItem {
  readonly id: string;
  readonly name: string;
  readonly category: KernCategory;
  readonly status: KernComponentStatus;
  readonly variantOf?: string;
}

/** A related catalog entry with a deliberately different interaction or composition role. */
export interface KernCatalogFamilyMember {
  readonly id: string;
  readonly role: string;
  readonly migration?: string;
}

/**
 * Documentation taxonomy for components that solve adjacent problems.
 *
 * Families are explanatory, not inheritance or API compatibility contracts. Literal aliases are
 * represented separately by `KERN_CATALOG_ALIASES`.
 */
export interface KernCatalogFamily {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly members: readonly KernCatalogFamilyMember[];
}

/** A presentation group used by the documentation navigation. */
export interface KernCatalogNavigationGroup {
  readonly id: string;
  readonly label?: string;
  readonly items: readonly KernCatalogIndexItem[];
}

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
    'JSON View',
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

const VARIANT_OF = {
  'vertical-tabs': 'tabs',
  'status-badge': 'badge',
  tag: 'chip',
  'data-table': 'data-grid',
  'bulk-actions': 'crud-toolbar',
} as const satisfies Readonly<Record<string, string>>;

/** Legacy catalog ids that share the canonical component implementation and documentation page. */
export const KERN_CATALOG_ALIASES = VARIANT_OF;

/**
 * Related components that are easy to confuse but are not interchangeable aliases.
 * Member roles make the selection boundary explicit on each canonical catalog page.
 */
export const KERN_CATALOG_FAMILIES: readonly KernCatalogFamily[] = [
  {
    id: 'layout-flow',
    name: 'Layout flow',
    description: 'One-dimensional layout primitives, distinguished by direction and wrapping.',
    members: [
      { id: 'stack', role: 'Vertical flow with a consistent block-axis gap.' },
      { id: 'inline', role: 'Inline flow for items that primarily stay on one row.' },
      { id: 'cluster', role: 'Wrapping inline groups with deliberate row and column gaps.' },
    ],
  },
  {
    id: 'application-shells',
    name: 'Application shells',
    description: 'Page-level compositions for persistent application navigation and content.',
    members: [
      { id: 'app-shell', role: 'The reusable shell primitive and its structural slots.' },
      {
        id: 'responsive-application-shell',
        role: 'A recipe that composes shell primitives into responsive product behavior.',
        migration: 'Compose responsive navigation directly with App Shell.',
      },
      {
        id: 'mobile-navigation',
        role: 'A legacy recipe for compact-viewport navigation.',
        migration: 'Compose mobile navigation with App Shell and navigation primitives.',
      },
    ],
  },
  {
    id: 'content-containers',
    name: 'Content containers',
    description: 'Width-constrained layout with optional intrinsic child centering.',
    members: [
      {
        id: 'container',
        role: 'The canonical width, gutter, alignment, and intrinsic layout API.',
      },
      {
        id: 'center',
        role: 'A legacy centered-container wrapper with narrower inputs.',
        migration: 'Use Container; enable intrinsic when children need inline-axis centering.',
      },
    ],
  },
  {
    id: 'media-framing',
    name: 'Media framing',
    description: 'Size and crop media predictably without mixing layout policy into content.',
    members: [
      { id: 'aspect-ratio', role: 'A generic ratio-preserving layout frame for any content.' },
      {
        id: 'responsive-media',
        role: 'A legacy media-specific ratio wrapper.',
        migration: 'Use Aspect Ratio for the same ratio-preserving layout contract.',
      },
    ],
  },
  {
    id: 'action-groups',
    name: 'Action and choice groups',
    description: 'Grouped controls with different state ownership and keyboard contracts.',
    members: [
      { id: 'button-group', role: 'Layout for independent actions; it owns no selection state.' },
      { id: 'toggle-group', role: 'A managed set of persistent pressed-state buttons.' },
      {
        id: 'segmented-control',
        role: 'A compact form control for one mutually exclusive value.',
      },
      { id: 'radio-group', role: 'An explicit form choice where every option stays visible.' },
    ],
  },
  {
    id: 'form-anatomy',
    name: 'Form anatomy',
    description: 'Composable parts of one accessible field rather than competing input controls.',
    members: [
      { id: 'form-field', role: 'Coordinates control, label, help, and validation relationships.' },
      { id: 'label', role: 'Provides the field accessible name and visible caption.' },
      { id: 'hint', role: 'Adds non-error guidance or constraints to a field.' },
      { id: 'validation-message', role: 'Communicates validation failure and recovery guidance.' },
    ],
  },
  {
    id: 'select-family',
    name: 'Select family',
    description: 'Value pickers distinguished by option source, search, and cardinality.',
    members: [
      { id: 'select', role: 'A styled single choice from a defined option set.' },
      { id: 'native-select', role: 'A platform-native single choice with native interaction.' },
      { id: 'multi-select', role: 'Multiple values from a defined option set.' },
      { id: 'combobox', role: 'A searchable single choice constrained to defined options.' },
      {
        id: 'autocomplete',
        role: 'Free text enhanced by suggestions; custom values remain valid.',
      },
    ],
  },
  {
    id: 'file-inputs',
    name: 'File inputs',
    description: 'File acquisition controls with different primary input methods.',
    members: [
      { id: 'file-upload', role: 'A conventional file picker and selected-file summary.' },
      {
        id: 'drag-drop-upload',
        role: 'A legacy drop-zone wrapper around the file-upload interaction.',
        migration: 'Use File Upload with presentation="dropzone".',
      },
    ],
  },
  {
    id: 'menu-surfaces',
    name: 'Menu surfaces',
    description: 'Command collections distinguished by trigger and navigation model.',
    members: [
      { id: 'menu', role: 'A transient command list opened from an explicit trigger.' },
      { id: 'menubar', role: 'A persistent horizontal root for related menus.' },
      { id: 'context-menu', role: 'A contextual command list opened at the invocation point.' },
    ],
  },
  {
    id: 'notices',
    name: 'Notices',
    description: 'Messages distinguished by placement, persistence, and interruption level.',
    members: [
      { id: 'alert', role: 'An inline message tied to nearby content or a task.' },
      {
        id: 'banner',
        role: 'A legacy page-wide presentation of the Alert contract.',
        migration: 'Use Alert with placement="banner".',
      },
      { id: 'toast', role: 'A transient, non-blocking message about a completed event.' },
    ],
  },
  {
    id: 'contextual-overlays',
    name: 'Contextual overlays',
    description: 'Anchored overlays distinguished by content richness and interaction.',
    members: [
      { id: 'tooltip', role: 'A short, non-interactive label or clarification.' },
      { id: 'popover', role: 'Interactive contextual content with explicit dismissal.' },
      { id: 'hover-card', role: 'A richer preview disclosed from hover or keyboard focus.' },
    ],
  },
  {
    id: 'modal-surfaces',
    name: 'Modal surfaces',
    description: 'Blocking overlays distinguished by urgency, edge, and responsive context.',
    members: [
      { id: 'dialog', role: 'A general modal task or focused content surface.' },
      { id: 'alert-dialog', role: 'An urgent decision that requires explicit acknowledgement.' },
      { id: 'drawer', role: 'A panel entering from a viewport edge for secondary work.' },
      { id: 'bottom-sheet', role: 'A lower-edge surface optimized for compact viewports.' },
      {
        id: 'settings-panel',
        role: 'A legacy recipe that precomposes a Drawer for settings content.',
        migration: 'Compose Drawer with product-specific settings fields and actions.',
      },
    ],
  },
  {
    id: 'progress-indicators',
    name: 'Progress indicators',
    description: 'Work-status visuals distinguished by geometry and whether progress is known.',
    members: [
      { id: 'progress-bar', role: 'Linear determinate or indeterminate task progress.' },
      { id: 'circular-progress', role: 'Compact radial progress when a value can be shown.' },
      { id: 'spinner', role: 'Indeterminate activity when no useful progress value exists.' },
    ],
  },
  {
    id: 'states',
    name: 'Outcome states',
    description: 'Whole-region outcomes with different recovery and next-action expectations.',
    members: [
      {
        id: 'empty-state',
        role: 'The canonical outcome surface; kind selects empty, error, or success semantics.',
      },
      {
        id: 'error-state',
        role: 'A legacy error-kind wrapper that explains failure and recovery.',
        migration: 'Use Empty State with kind="error".',
      },
      {
        id: 'success-state',
        role: 'A legacy success-kind wrapper that confirms completion and next steps.',
        migration: 'Use Empty State with kind="success".',
      },
    ],
  },
  {
    id: 'data-visualization',
    name: 'Charts',
    description:
      'One generic Chart API configured by type; legacy wrappers document each comparison mode.',
    members: [
      {
        id: 'line-chart',
        role: 'Shows change or trend across an ordered dimension.',
        migration: 'Use Chart with type="line".',
      },
      {
        id: 'bar-chart',
        role: 'Compares magnitudes across discrete categories.',
        migration: 'Use Chart with type="bar".',
      },
      {
        id: 'donut-chart',
        role: 'Shows a small part-to-whole composition.',
        migration: 'Use Chart with type="donut".',
      },
    ],
  },
  {
    id: 'disclosure-containers',
    name: 'Disclosure containers',
    description: 'Progressive disclosure for either one region or a coordinated collection.',
    members: [
      { id: 'disclosure', role: 'A single independently expanded content region.' },
      { id: 'accordion', role: 'A coordinated collection of related disclosure regions.' },
    ],
  },
  {
    id: 'tree-experiences',
    name: 'Tree experiences',
    description: 'Hierarchical interfaces distinguished by whether nodes are destinations or data.',
    members: [
      { id: 'tree-navigation', role: 'A hierarchy of navigational destinations.' },
      { id: 'tree', role: 'Hierarchical data with selection and expansion behavior.' },
    ],
  },
  {
    id: 'content-cards',
    name: 'Content cards',
    description: 'Contained content surfaces at different levels of product composition.',
    members: [
      { id: 'card', role: 'A reusable content container without dashboard-specific policy.' },
      {
        id: 'dashboard-widget',
        role: 'A legacy recipe for metric content, actions, and dashboard layout.',
        migration: 'Compose Card with a named product region and product-specific content.',
      },
    ],
  },
] as const;

const BETA_COMPONENTS = /* @__PURE__ */ new Set([
  'autocomplete',
  'color-picker',
  'combobox',
  'command-palette',
  'data-grid',
  'data-table',
  'date-picker',
  'date-range-picker',
  'dialog',
  'drawer',
  'bottom-sheet',
  'multi-select',
  'select',
  'time-picker',
  'tree',
  'tree-navigation',
  'json-view',
  'line-chart',
  'bar-chart',
  'donut-chart',
]);

const EXPERIMENTAL_COMPONENTS = /* @__PURE__ */ new Set(['resizable-panels']);

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function statusFor(id: string, category: KernCategory): KernComponentStatus {
  if (category === 'Patterns') return 'recipe';
  if (EXPERIMENTAL_COMPONENTS.has(id)) return 'experimental';
  if (BETA_COMPONENTS.has(id)) return 'beta';
  return 'stable';
}

export const KERN_CATALOG_INDEX: readonly KernCatalogIndexItem[] = /* @__PURE__ */ Object.entries(
  GROUPS,
).flatMap(([category, names]) =>
  names.map((name) => {
    const id = slugify(name);
    return {
      id,
      name,
      category: category as KernCategory,
      status: statusFor(id, category as KernCategory),
      ...(id in KERN_CATALOG_ALIASES
        ? { variantOf: KERN_CATALOG_ALIASES[id as keyof typeof KERN_CATALOG_ALIASES] }
        : {}),
    };
  }),
);

export const KERN_CATEGORIES: readonly KernCategory[] = Object.keys(GROUPS) as KernCategory[];

/** The one-page-per-component view used by documentation navigation and search. */
export const KERN_CANONICAL_CATALOG_INDEX: readonly KernCatalogIndexItem[] =
  KERN_CATALOG_INDEX.filter((item) => item.variantOf === undefined);

/** Canonical runtime primitives, excluding recipe-level compositions. */
export const KERN_COMPONENT_CATALOG_INDEX: readonly KernCatalogIndexItem[] =
  KERN_CANONICAL_CATALOG_INDEX.filter((item) => item.status !== 'recipe');

/** Canonical recipe-level compositions shown separately from runtime primitives. */
export const KERN_RECIPE_CATALOG_INDEX: readonly KernCatalogIndexItem[] =
  KERN_CANONICAL_CATALOG_INDEX.filter((item) => item.status === 'recipe');

export const KERN_COMPONENT_CATEGORIES: readonly KernCategory[] = KERN_CATEGORIES.filter(
  (category) => category !== 'Patterns',
);

const FAMILY_BY_MEMBER_ID = /* @__PURE__ */ new Map<string, KernCatalogFamily>(
  KERN_CATALOG_FAMILIES.flatMap((family) =>
    family.members.map((member) => [member.id, family] as const),
  ),
);

export function canonicalCatalogId(id: string): string {
  return id in KERN_CATALOG_ALIASES
    ? KERN_CATALOG_ALIASES[id as keyof typeof KERN_CATALOG_ALIASES]
    : id;
}

export function catalogAliasesFor(id: string): readonly KernCatalogIndexItem[] {
  const canonicalId = canonicalCatalogId(id);
  return KERN_CATALOG_INDEX.filter((item) => item.variantOf === canonicalId);
}

export function catalogFamilyFor(id: string): KernCatalogFamily | undefined {
  return FAMILY_BY_MEMBER_ID.get(canonicalCatalogId(id));
}

export function relatedCatalogItems(id: string): readonly KernCatalogIndexItem[] {
  const canonicalId = canonicalCatalogId(id);
  const family = catalogFamilyFor(canonicalId);
  if (!family) return [];
  return family.members
    .filter((member) => member.id !== canonicalId)
    .map((member) => KERN_CANONICAL_CATALOG_INDEX.find((item) => item.id === member.id))
    .filter((item): item is KernCatalogIndexItem => item !== undefined);
}

export function catalogIndexByCategory(category: KernCategory): readonly KernCatalogIndexItem[] {
  return KERN_CATALOG_INDEX.filter((item) => item.category === category);
}

/** Canonical items grouped by an explicit family when at least two family members share a category. */
export function catalogNavigationGroups(
  category: KernCategory,
): readonly KernCatalogNavigationGroup[] {
  const items = KERN_CANONICAL_CATALOG_INDEX.filter((item) => item.category === category);
  const eligibleFamilies = new Map(
    KERN_CATALOG_FAMILIES.map((family) => {
      const members = items.filter((item) =>
        family.members.some((member) => member.id === item.id),
      );
      return [family.id, members.length > 1 ? { family, members } : undefined] as const;
    }).filter(
      (
        entry,
      ): entry is readonly [
        string,
        { family: KernCatalogFamily; members: KernCatalogIndexItem[] },
      ] => entry[1] !== undefined,
    ),
  );
  const consumed = new Set<string>();
  const groups: KernCatalogNavigationGroup[] = [];
  let ungrouped: KernCatalogIndexItem[] = [];

  const flushUngrouped = (): void => {
    if (ungrouped.length === 0) return;
    groups.push({
      id: `ungrouped-${groups.length}`,
      items: ungrouped,
    });
    ungrouped = [];
  };

  for (const item of items) {
    if (consumed.has(item.id)) continue;
    const family = catalogFamilyFor(item.id);
    const eligible = family ? eligibleFamilies.get(family.id) : undefined;
    if (!eligible) {
      ungrouped.push(item);
      consumed.add(item.id);
      continue;
    }

    flushUngrouped();
    groups.push({ id: eligible.family.id, label: eligible.family.name, items: eligible.members });
    for (const member of eligible.members) consumed.add(member.id);
  }
  flushUngrouped();
  return groups;
}
