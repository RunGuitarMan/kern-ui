import { describe, expect, it } from 'vitest';

import { KERN_CATALOG, KERN_CATEGORIES, KERN_COVERAGE, findKernComponent } from './catalog';
import { KERN_RUNTIME_COMPONENTS } from './generated-component-contract';

describe('Kern showcase catalog', () => {
  it('keeps ids and selectors unique', () => {
    expect(new Set(KERN_CATALOG.map((item) => item.id)).size).toBe(KERN_CATALOG.length);
    expect(new Set(KERN_CATALOG.map((item) => item.selector)).size).toBe(KERN_CATALOG.length);
  });

  it('covers every category with docs and state metadata', () => {
    expect(KERN_CATEGORIES).toHaveLength(7);
    expect(KERN_COVERAGE.components).toBeGreaterThan(100);
    expect(KERN_CATALOG.every((item) => item.states.length > 0)).toBe(true);
    expect(KERN_CATALOG.every((item) => item.states.includes('default'))).toBe(true);
    expect(findKernComponent('data-grid')?.category).toBe('Data display');
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
    }
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
    expect(findKernComponent('tooltip')?.selector).toBe('[krnTooltip]');
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
