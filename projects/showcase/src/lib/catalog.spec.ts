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
    expect(KERN_CATALOG.every((item) => item.states.length >= 10)).toBe(true);
    expect(findKernComponent('data-grid')?.category).toBe('Data display');
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
});
