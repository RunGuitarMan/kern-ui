import { describe, expect, it } from 'vitest';
import {
  KERN_CANONICAL_CATALOG_INDEX,
  KERN_CATALOG_ALIASES,
  KERN_CATALOG_FAMILIES,
  KERN_CATALOG_INDEX,
  KERN_CATEGORIES,
  KERN_COMPONENT_CATALOG_INDEX,
  KERN_COMPONENT_CATEGORIES,
  KERN_RECIPE_CATALOG_INDEX,
  canonicalCatalogId,
  catalogAliasesFor,
  catalogFamilyFor,
  catalogNavigationGroups,
  relatedCatalogItems,
} from '@kern-ui/showcase/catalog-index';

import { KERN_CATALOG, KERN_COVERAGE, findKernComponent } from './catalog';
import { KERN_RUNTIME_COMPONENTS } from './generated-component-contract';

describe('Kern showcase catalog', () => {
  it('keeps ids and selectors unique', () => {
    expect(new Set(KERN_CATALOG.map((item) => item.id)).size).toBe(KERN_CATALOG.length);
    expect(new Set(KERN_CATALOG.map((item) => item.selector)).size).toBe(KERN_CATALOG.length);
  });

  it('keeps the lightweight navigation index in exact parity with the full catalog', () => {
    expect(KERN_CATALOG_INDEX).toEqual(
      KERN_CATALOG.map(({ id, name, category, status, variantOf }) => ({
        id,
        name,
        category,
        status,
        ...(variantOf ? { variantOf } : {}),
      })),
    );
  });

  it('publishes one canonical documentation entry for every literal component alias', () => {
    expect(KERN_CATALOG_ALIASES).toEqual({
      'vertical-tabs': 'tabs',
      'status-badge': 'badge',
      tag: 'chip',
      'data-table': 'data-grid',
      'bulk-actions': 'crud-toolbar',
    });
    expect(KERN_CANONICAL_CATALOG_INDEX).toHaveLength(KERN_CATALOG_INDEX.length - 5);

    for (const [alias, canonical] of Object.entries(KERN_CATALOG_ALIASES)) {
      expect(canonicalCatalogId(alias)).toBe(canonical);
      expect(KERN_CANONICAL_CATALOG_INDEX.some((item) => item.id === alias)).toBe(false);
      expect(catalogAliasesFor(canonical).map((item) => item.id)).toContain(alias);
    }
  });

  it('separates recipe compositions from the canonical component navigation', () => {
    expect(KERN_COMPONENT_CATEGORIES).not.toContain('Patterns');
    expect(KERN_COMPONENT_CATALOG_INDEX.every((item) => item.status !== 'recipe')).toBe(true);
    expect(KERN_RECIPE_CATALOG_INDEX.every((item) => item.status === 'recipe')).toBe(true);
    expect(KERN_COMPONENT_CATALOG_INDEX).toHaveLength(113);
    expect(KERN_RECIPE_CATALOG_INDEX).toHaveLength(14);
    expect(
      new Set([...KERN_COMPONENT_CATALOG_INDEX, ...KERN_RECIPE_CATALOG_INDEX].map(({ id }) => id)),
    ).toEqual(new Set(KERN_CANONICAL_CATALOG_INDEX.map(({ id }) => id)));
  });

  it('defines non-overlapping explanatory families with explicit member roles', () => {
    const memberIds = KERN_CATALOG_FAMILIES.flatMap((family) =>
      family.members.map((member) => member.id),
    );
    expect(new Set(memberIds).size).toBe(memberIds.length);
    expect(KERN_CATALOG_FAMILIES.map((family) => family.id)).toEqual(
      expect.arrayContaining([
        'data-visualization',
        'states',
        'modal-surfaces',
        'select-family',
        'form-anatomy',
        'action-groups',
      ]),
    );

    for (const family of KERN_CATALOG_FAMILIES) {
      expect(family.description.trim(), `${family.id}: description`).not.toBe('');
      expect(family.members.length, `${family.id}: related member count`).toBeGreaterThan(1);
      for (const member of family.members) {
        expect(member.role.trim(), `${family.id}/${member.id}: role`).not.toBe('');
        expect(
          KERN_CANONICAL_CATALOG_INDEX.some((item) => item.id === member.id),
          `${family.id}/${member.id}: canonical member`,
        ).toBe(true);
        expect(catalogFamilyFor(member.id)?.id).toBe(family.id);
      }
    }

    expect(relatedCatalogItems('combobox').map((item) => item.id)).toEqual(
      expect.arrayContaining(['select', 'native-select', 'multi-select', 'autocomplete']),
    );
  });

  it('groups canonical category navigation without duplicating entries', () => {
    for (const category of KERN_CATEGORIES) {
      const groupedItems = catalogNavigationGroups(category).flatMap((group) => group.items);
      expect(new Set(groupedItems.map((item) => item.id)).size).toBe(groupedItems.length);
      expect(groupedItems).toEqual(
        expect.arrayContaining(
          KERN_CANONICAL_CATALOG_INDEX.filter((item) => item.category === category),
        ),
      );
      expect(groupedItems).toHaveLength(
        KERN_CANONICAL_CATALOG_INDEX.filter((item) => item.category === category).length,
      );
    }

    expect(
      catalogNavigationGroups('Feedback')
        .find((group) => group.id === 'modal-surfaces')
        ?.items.map((item) => item.id),
    ).toEqual(['dialog', 'alert-dialog', 'drawer', 'bottom-sheet']);
  });

  it('covers every category with docs and state metadata', () => {
    expect(KERN_CATEGORIES).toHaveLength(7);
    expect(KERN_COVERAGE.components).toBeGreaterThan(100);
    expect(KERN_CATALOG.every((item) => item.states.length > 0)).toBe(true);
    expect(KERN_CATALOG.every((item) => item.states.includes('default'))).toBe(true);
    expect(findKernComponent('data-grid')?.category).toBe('Data display');
  });

  it('publishes one concise component-specific summary per catalog id', () => {
    const bodies = KERN_CATALOG.map((item) => {
      expect(item.summary, item.id).toMatch(
        new RegExp(`^${item.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\. `),
      );
      return item.summary.slice(item.name.length + 2);
    });

    expect(new Set(bodies).size).toBe(KERN_CATALOG.length);
    expect(bodies).not.toContain(
      'A composable spatial primitive that keeps product layouts predictable across containers.',
    );
    expect(bodies).not.toContain(
      'A typed form control with visible state, reliable labeling, and Angular Forms semantics.',
    );
  });

  it('does not publish generic or capability-inaccurate documentation fallbacks', () => {
    for (const item of KERN_CATALOG) {
      expect(item.do, item.id).not.toBe(
        'Use the smallest semantic primitive that communicates the intended relationship.',
      );
      expect(item.dont, item.id).not.toBe(
        'Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.',
      );
      expect(
        item.api.every(({ description }) => !/^Configures the component /.test(description)),
        item.id,
      ).toBe(true);
    }

    expect(findKernComponent('alert')?.keyboard).toEqual([
      'The component adds no keyboard interaction or tab stop of its own',
    ]);
    expect(findKernComponent('text-input')?.keyboard).toEqual([
      'Tab focuses the native input; native editing and selection keys remain available',
    ]);
    expect(findKernComponent('spacer')?.accessibility).toEqual([
      'Is always aria-hidden because it communicates spacing, not content.',
    ]);
  });

  it('publishes capability-specific acceptance states without impossible generic interaction', () => {
    for (const id of ['spacer', 'divider', 'badge', 'skeleton', 'empty-state']) {
      const states = findKernComponent(id)?.states ?? [];
      expect(states, id).not.toContain('hover');
      expect(states, id).not.toContain('focus-visible');
      expect(states, id).not.toContain('active');
      expect(states, id).not.toContain('disabled');
    }

    expect(findKernComponent('resizable-panels')?.states).toEqual(
      expect.arrayContaining([
        'handle focus-visible',
        'minimum size',
        'maximum size',
        'collapsed',
        'expanded',
      ]),
    );
    expect(findKernComponent('data-grid')?.states).toEqual(
      expect.arrayContaining(['loading', 'empty', 'error', 'virtualized', 'pinned columns']),
    );
    expect(findKernComponent('dialog')?.states).toEqual(
      expect.arrayContaining(['closed', 'open', 'nested', 'dismissed']),
    );
  });

  it('derives every public API table from the runtime component contract', () => {
    for (const item of KERN_CATALOG) {
      const contract =
        KERN_RUNTIME_COMPONENTS[item.selector as keyof typeof KERN_RUNTIME_COMPONENTS];
      expect(contract, `${item.id} has no runtime selector contract`).toBeDefined();
      expect(item.api.map(({ name, kind }) => ({ name, kind }))).toEqual(
        contract?.api.map(({ name, kind }) => ({ name, kind })),
      );
      expect(item.api.map(({ name, description }) => ({ name, description }))).toEqual(
        contract?.api.map(({ name, description }) => ({ name, description })),
      );
      expect(contract?.api.every(({ description }) => description.trim().length > 0)).toBe(true);
    }
  });

  it('publishes source-authored descriptions for merged component-family APIs', () => {
    const expected = [
      [
        'alert',
        'placement',
        'Places the message inline or stretches it into a page-level banner treatment.',
      ],
      [
        'empty-state',
        'kind',
        'Selects the state meaning, default visual, status role, title, and recommended tone.',
      ],
      [
        'file-upload',
        'presentation',
        'Selects a compact picker button or a drag-and-drop surface.',
      ],
      [
        'file-upload',
        'dropLabel',
        'Localized instruction shown inside the drag-and-drop upload surface.',
      ],
      [
        'container',
        'intrinsic',
        'Centers projected children on the inline axis while preserving the container measure.',
      ],
    ] as const;

    for (const [componentId, apiName, description] of expected) {
      expect(
        findKernComponent(componentId)?.api.find(({ name }) => name === apiName)?.description,
        `${componentId}.${apiName}`,
      ).toBe(description);
    }

    expect(
      findKernComponent('banner')?.api.find(({ name }) => name === 'placement')?.description,
    ).toBe(expected[0][2]);
    expect(
      findKernComponent('error-state')?.api.find(({ name }) => name === 'kind')?.description,
    ).toBe(expected[1][2]);
    expect(
      findKernComponent('drag-drop-upload')?.api.find(({ name }) => name === 'presentation')
        ?.description,
    ).toBe(expected[2][2]);
  });

  it('uses lifecycle statuses instead of presenting recipes and complex previews as stable', () => {
    expect(findKernComponent('login-form')?.status).toBe('recipe');
    expect(findKernComponent('data-grid')?.status).toBe('beta');
    expect(findKernComponent('resizable-panels')?.status).toBe('experimental');
    expect(findKernComponent('button')?.status).toBe('stable');
  });

  it('marks intentional variants and preserves directive selectors', () => {
    expect(findKernComponent('vertical-tabs')?.variantOf).toBe('tabs');
    expect(findKernComponent('status-badge')?.variantOf).toBe('badge');
    expect(findKernComponent('tag')?.variantOf).toBe('chip');
    expect(findKernComponent('data-table')?.variantOf).toBe('data-grid');
    expect(findKernComponent('bulk-actions')?.variantOf).toBe('crud-toolbar');
    expect(findKernComponent('button')?.selector).toBe('button[krnButton]');
    expect(findKernComponent('icon-button')?.selector).toBe('button[krnIconButton]');
    expect(findKernComponent('button-group')?.selector).toBe('div[krnButtonGroup]');
    expect(findKernComponent('tooltip')?.selector).toBe('[krnTooltip]');
  });

  it('documents Icon Button as a named native action instead of a managed toggle', () => {
    const iconButton = findKernComponent('icon-button');

    expect(iconButton?.accessibility).toEqual(
      expect.arrayContaining([
        expect.stringContaining('aria-label or aria-labelledby'),
        expect.stringContaining('aria-describedby'),
      ]),
    );
    expect(iconButton?.do).toContain('<button krnIconButton');
    expect(iconButton?.dont).toContain('Toggle Button');
  });

  it('documents Button Group as a named stateless layout for independent actions', () => {
    const buttonGroup = findKernComponent('button-group');

    expect(buttonGroup?.states).toEqual([
      'default',
      'overflow',
      'long text',
      'dark',
      'high contrast',
      'compact',
      'RTL',
      'mobile',
      'connected',
    ]);
    expect(buttonGroup?.keyboard).toEqual(
      expect.arrayContaining([
        expect.stringContaining('document order'),
        expect.stringContaining('do not add Arrow-key navigation'),
      ]),
    );
    expect(buttonGroup?.accessibility).toEqual(
      expect.arrayContaining([
        expect.stringContaining('aria-label or aria-labelledby'),
        expect.stringContaining('Toggle Group or Segmented Control'),
      ]),
    );
    expect(buttonGroup?.do).toContain('<div krnButtonGroup');
    expect(buttonGroup?.dont).toContain('group-level disabled/loading');
  });

  it('documents combobox selection separately from free-text autocomplete', () => {
    const combobox = findKernComponent('combobox');
    const autocomplete = findKernComponent('autocomplete');

    expect(combobox?.summary).toContain('defined option set');
    expect(combobox?.do).toContain('authoritative list');
    expect(combobox?.dont).toContain('custom values');
    expect(autocomplete?.summary).toContain('free text');
    expect(autocomplete?.do).toContain('new value is still valid');
    expect(autocomplete?.dont).toContain('constrained picker');
    expect(combobox?.summary).not.toBe(autocomplete?.summary);
  });

  it('publishes exact keyboard contracts for each chart interaction model', () => {
    const sharedCartesianContract = [
      'Tab reaches the source-data toggle, then the single roving data mark in the plot',
      'Arrow Left and Arrow Right move between data marks and reverse direction in RTL',
      'Home and End move to the first and last data marks',
      'Enter and Space disclose the focused datum through the chart status detail',
      'Keyboard focus reveals the focused datum; Tab leaves the plot without trapping focus',
    ];

    expect(findKernComponent('line-chart')?.keyboard).toEqual(sharedCartesianContract);
    expect(findKernComponent('bar-chart')?.keyboard).toEqual(sharedCartesianContract);
    expect(findKernComponent('donut-chart')?.keyboard).toEqual([
      'Tab reaches the source-data toggle and every legend button in document order',
      'Keyboard focus on a legend button reveals its matching segment and value',
      'Enter and Space use native button activation for the focused legend item',
      'SVG segment hit targets stay out of the Tab order so the legend is not duplicated',
    ]);

    for (const id of ['line-chart', 'bar-chart', 'donut-chart']) {
      expect(findKernComponent(id)?.keyboard).not.toContain('Arrow keys navigate interactive data');
    }
  });
});
