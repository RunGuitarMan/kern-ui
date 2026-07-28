import { KRN_TOKEN_MANIFEST, KRN_TOKEN_NAMES, krnTokens } from './tokens';

describe('Kern token manifest', () => {
  it('contains a unique machine-readable descriptor for every token', () => {
    const names = KRN_TOKEN_MANIFEST.map((token) => token.name);

    expect(new Set(names).size).toBe(names.length);
    expect(KRN_TOKEN_MANIFEST.every((token) => token.path.includes('.'))).toBe(true);
    expect(KRN_TOKEN_MANIFEST.some((token) => token.visibility === 'internal')).toBe(true);
    expect(KRN_TOKEN_MANIFEST.some((token) => token.tier === 'component')).toBe(true);
  });

  it('builds strongly typed CSS references from the public contract', () => {
    expect(krnTokens.color.canvas).toBe(`var(${KRN_TOKEN_NAMES.color.canvas})`);
    expect(krnTokens.appearance.dangerSurface).toBe(
      `var(${KRN_TOKEN_NAMES.appearance.dangerSurface})`,
    );
    expect(krnTokens.density.gap).toBe(`var(${KRN_TOKEN_NAMES.density.gap})`);
    expect(krnTokens.density.cellPaddingBlock).toBe(
      `var(${KRN_TOKEN_NAMES.density.cellPaddingBlock})`,
    );
    expect(krnTokens.motionRecipe.continuousIterations).toBe(
      `var(${KRN_TOKEN_NAMES.motionRecipe.continuousIterations})`,
    );
    expect(krnTokens.chart[1]).toBe(`var(${KRN_TOKEN_NAMES.chart[1]})`);
  });
});
