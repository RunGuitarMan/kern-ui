import {
  documentationAssetCacheControl,
  isMutableAgentContractAsset,
} from './agent-contract-cache';

describe('isMutableAgentContractAsset', () => {
  it.each([
    'llms.txt',
    'llms-full.txt',
    'component-manifest.json',
    'component-manifest.schema.json',
    'import-map.json',
    'root-export-map.json',
    'checklist.md',
    'common-mistakes.md',
    'components/button.json',
    'components/date-range-picker.md',
    'examples/index.json',
    'examples/README.md',
    'examples/data-grid.ts',
    'recipes/controlled-data-grid.ts',
    'agent/component-manifest.json',
    'agent/components/button.md',
    'agent/examples/button.ts',
    'agent/recipes/controlled-data-grid.ts',
  ])('classifies %s as mutable contract content', (filePath) => {
    expect(isMutableAgentContractAsset(filePath)).toBe(true);
  });

  it.each([
    'favicon.ico',
    'main-ABC123.js',
    'styles-ABC123.css',
    'components/button',
    'components/button.js',
    'examples/nested/button.ts',
    '../component-manifest.json',
  ])('does not classify %s as mutable contract content', (filePath) => {
    expect(isMutableAgentContractAsset(filePath)).toBe(false);
  });

  it('keeps the mutable root contract coherent while versioned assets remain immutable', () => {
    expect(documentationAssetCacheControl('/', 'components/button.json')).toBe(
      'public, max-age=300, must-revalidate',
    );
    expect(documentationAssetCacheControl('/', 'agent/examples/button.ts')).toBe(
      'public, max-age=300, must-revalidate',
    );
    expect(documentationAssetCacheControl('/', 'main-ABC123.js')).toBe('public, max-age=31536000');
    expect(documentationAssetCacheControl('/versions/0.1.0', 'component-manifest.json')).toBe(
      'public, max-age=31536000, immutable',
    );
    expect(documentationAssetCacheControl('/versions/0.1.0', 'agent/llms.txt')).toBe(
      'public, max-age=31536000, immutable',
    );
  });
});
