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
      ...(VARIANT_OF[id] ? { variantOf: VARIANT_OF[id] } : {}),
    };
  }),
);

export const KERN_CATEGORIES: readonly KernCategory[] = Object.keys(GROUPS) as KernCategory[];

export function catalogIndexByCategory(category: KernCategory): readonly KernCatalogIndexItem[] {
  return KERN_CATALOG_INDEX.filter((item) => item.category === category);
}
