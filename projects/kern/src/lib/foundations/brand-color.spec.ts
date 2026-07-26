import { generateKrnBrandPalette, krnBrandPaletteVariables, parseHexColor } from './brand-color';

describe('Kern brand color generation', () => {
  it('creates a complete, perceptually ordered palette', () => {
    const palette = generateKrnBrandPalette('#e34b2f');

    expect(palette).not.toBeNull();
    expect(Object.keys(palette ?? {})).toHaveLength(11);
    expect(palette?.[50]).toMatch(/^oklch\(97\.00%/);
    expect(palette?.[950]).toMatch(/^oklch\(20\.00%/);
    expect(krnBrandPaletteVariables(palette!)['--krn-color-brand-500']).toBe(palette?.[500]);
  });

  it('is SSR-safe and rejects unsupported CSS syntax', () => {
    expect(parseHexColor('#0f8')).not.toBeNull();
    expect(parseHexColor('color(display-p3 1 0 0)')).toBeNull();
    expect(generateKrnBrandPalette('tomato')).toBeNull();
  });
});
