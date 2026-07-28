export const KRN_BRAND_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

export type KrnBrandStep = (typeof KRN_BRAND_STEPS)[number];
export type KrnBrandPalette = Readonly<Record<KrnBrandStep, string>>;

export interface KrnOklchColor {
  readonly l: number;
  readonly c: number;
  readonly h: number;
}

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

function linearize(channel: number): number {
  const normalized = channel / 255;
  return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
}

function rgbToOklch(red: number, green: number, blue: number): KrnOklchColor {
  const r = linearize(red);
  const g = linearize(green);
  const b = linearize(blue);
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  const lRoot = Math.cbrt(l);
  const mRoot = Math.cbrt(m);
  const sRoot = Math.cbrt(s);
  const labL = 0.2104542553 * lRoot + 0.793617785 * mRoot - 0.0040720468 * sRoot;
  const labA = 1.9779984951 * lRoot - 2.428592205 * mRoot + 0.4505937099 * sRoot;
  const labB = 0.0259040371 * lRoot + 0.7827717662 * mRoot - 0.808675766 * sRoot;
  const chroma = Math.sqrt(labA * labA + labB * labB);
  const hue = ((Math.atan2(labB, labA) * 180) / Math.PI + 360) % 360;

  return { l: labL, c: chroma, h: Number.isFinite(hue) ? hue : 33 };
}

/** Parses #RGB, #RGBA, #RRGGBB and #RRGGBBAA without touching browser APIs. */
export function parseHexColor(value: string): KrnOklchColor | null {
  const match = value.trim().match(/^#([\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i);
  if (!match) {
    return null;
  }

  const source = match[1];
  if (!source) {
    return null;
  }

  const expanded =
    source.length <= 4 ? [...source].map((part) => `${part}${part}`).join('') : source;
  const red = Number.parseInt(expanded.slice(0, 2), 16);
  const green = Number.parseInt(expanded.slice(2, 4), 16);
  const blue = Number.parseInt(expanded.slice(4, 6), 16);

  return rgbToOklch(red, green, blue);
}

const LIGHTNESS_BY_STEP: Readonly<Record<KrnBrandStep, number>> = {
  50: 0.97,
  100: 0.93,
  200: 0.86,
  300: 0.77,
  400: 0.67,
  500: 0.58,
  600: 0.5,
  700: 0.42,
  800: 0.34,
  900: 0.27,
  950: 0.2,
};

/**
 * Builds a perceptually even OKLCH palette from a hex brand color.
 * It is deterministic and browser-independent, so it is safe during SSR.
 */
export function generateKrnBrandPalette(brandColor: string): KrnBrandPalette | null {
  const source = parseHexColor(brandColor);
  if (!source) {
    return null;
  }

  const entries = KRN_BRAND_STEPS.map((step) => {
    const lightness = LIGHTNESS_BY_STEP[step];
    const distanceFromCenter = Math.abs(lightness - 0.58);
    const chromaScale = clamp(1 - distanceFromCenter * 1.18, 0.3, 1);
    const chroma = clamp(source.c * chromaScale, 0.035, 0.27);
    const value = `oklch(${(lightness * 100).toFixed(2)}% ${chroma.toFixed(4)} ${source.h.toFixed(2)})`;
    return [step, value] as const;
  });

  return Object.fromEntries(entries) as Record<KrnBrandStep, string>;
}

export function krnBrandPaletteVariables(
  palette: KrnBrandPalette,
): Readonly<Record<`--krn-color-brand-${KrnBrandStep}`, string>> {
  return Object.fromEntries(
    KRN_BRAND_STEPS.map((step) => [`--krn-color-brand-${step}`, palette[step]]),
  ) as Record<`--krn-color-brand-${KrnBrandStep}`, string>;
}
