import { describe, expect, it } from 'vitest';

import { KERN_CATALOG, KERN_CATEGORIES, KERN_COVERAGE, findKernComponent } from './catalog';

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

  it('marks intentional variants and preserves directive selectors', () => {
    expect(findKernComponent('vertical-tabs')?.variantOf).toBe('tabs');
    expect(findKernComponent('status-badge')?.variantOf).toBe('badge');
    expect(findKernComponent('tag')?.variantOf).toBe('chip');
    expect(findKernComponent('data-table')?.variantOf).toBe('data-grid');
    expect(findKernComponent('bulk-actions')?.variantOf).toBe('crud-toolbar');
    expect(findKernComponent('tooltip')?.selector).toBe('[krnTooltip]');
  });
});
