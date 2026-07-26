/**
 * Kern's public token contract.
 *
 * The values are CSS custom-property references on purpose: application code can
 * share the exact same semantic vocabulary as component styles without copying
 * theme values into JavaScript bundles.
 */
export const KRN_TOKEN_NAMES = {
  color: {
    canvas: '--krn-color-canvas',
    surface: '--krn-color-surface',
    surfaceSubtle: '--krn-color-surface-subtle',
    surfaceRaised: '--krn-color-surface-raised',
    surfaceSunken: '--krn-color-surface-sunken',
    surfaceInverse: '--krn-color-surface-inverse',
    surfaceHover: '--krn-color-surface-hover',
    surfaceDisabled: '--krn-color-surface-disabled',
    surfaceOverlay: '--krn-color-surface-overlay',
    text: '--krn-color-text',
    textMuted: '--krn-color-text-muted',
    textSubtle: '--krn-color-text-subtle',
    textDisabled: '--krn-color-text-disabled',
    textPlaceholder: '--krn-color-text-placeholder',
    textInverse: '--krn-color-text-inverse',
    border: '--krn-color-border',
    borderStrong: '--krn-color-border-strong',
    borderInteractive: '--krn-color-border-interactive',
    primary: '--krn-color-primary',
    primaryHover: '--krn-color-primary-hover',
    primaryActive: '--krn-color-primary-active',
    primarySubtle: '--krn-color-primary-subtle',
    onPrimary: '--krn-color-on-primary',
    link: '--krn-color-link',
    focus: '--krn-color-focus',
    selection: '--krn-color-selection',
    backdrop: '--krn-color-backdrop',
    success: '--krn-color-success',
    successSubtle: '--krn-color-success-subtle',
    onSuccess: '--krn-color-on-success',
    warning: '--krn-color-warning',
    warningSubtle: '--krn-color-warning-subtle',
    onWarning: '--krn-color-on-warning',
    danger: '--krn-color-danger',
    dangerSubtle: '--krn-color-danger-subtle',
    onDanger: '--krn-color-on-danger',
    info: '--krn-color-info',
    infoSubtle: '--krn-color-info-subtle',
    onInfo: '--krn-color-on-info',
  },
  space: {
    0: '--krn-space-0',
    px: '--krn-space-px',
    0.5: '--krn-space-0-5',
    1: '--krn-space-1',
    1.5: '--krn-space-1-5',
    2: '--krn-space-2',
    3: '--krn-space-3',
    4: '--krn-space-4',
    5: '--krn-space-5',
    6: '--krn-space-6',
    8: '--krn-space-8',
    10: '--krn-space-10',
    12: '--krn-space-12',
    16: '--krn-space-16',
    20: '--krn-space-20',
    24: '--krn-space-24',
  },
  radius: {
    none: '--krn-radius-none',
    xs: '--krn-radius-xs',
    sm: '--krn-radius-sm',
    md: '--krn-radius-md',
    lg: '--krn-radius-lg',
    xl: '--krn-radius-xl',
    full: '--krn-radius-full',
  },
  border: {
    none: '--krn-border-width-0',
    standard: '--krn-border-width-1',
    strong: '--krn-border-width-2',
  },
  opacity: {
    disabled: '--krn-opacity-disabled',
    muted: '--krn-opacity-muted',
    overlay: '--krn-opacity-overlay',
  },
  shadow: {
    xs: '--krn-shadow-xs',
    sm: '--krn-shadow-sm',
    md: '--krn-shadow-md',
    lg: '--krn-shadow-lg',
    overlay: '--krn-shadow-overlay',
  },
  typography: {
    fontSans: '--krn-font-family-sans',
    fontMono: '--krn-font-family-mono',
    sizeXs: '--krn-font-size-xs',
    sizeSm: '--krn-font-size-sm',
    sizeMd: '--krn-font-size-md',
    sizeLg: '--krn-font-size-lg',
    sizeXl: '--krn-font-size-xl',
    size2xl: '--krn-font-size-2xl',
    size3xl: '--krn-font-size-3xl',
    size4xl: '--krn-font-size-4xl',
    lineTight: '--krn-line-height-tight',
    lineBody: '--krn-line-height-body',
    lineRelaxed: '--krn-line-height-relaxed',
    weightRegular: '--krn-font-weight-regular',
    weightMedium: '--krn-font-weight-medium',
    weightSemibold: '--krn-font-weight-semibold',
    trackingTight: '--krn-letter-spacing-tight',
    trackingNormal: '--krn-letter-spacing-normal',
    trackingWide: '--krn-letter-spacing-wide',
  },
  motion: {
    instant: '--krn-motion-duration-instant',
    fast: '--krn-motion-duration-fast',
    normal: '--krn-motion-duration-normal',
    slow: '--krn-motion-duration-slow',
    deliberate: '--krn-motion-duration-deliberate',
    standard: '--krn-motion-ease-standard',
    enter: '--krn-motion-ease-enter',
    exit: '--krn-motion-ease-exit',
    spring: '--krn-motion-ease-spring',
  },
  control: {
    heightSm: '--krn-control-height-sm',
    heightMd: '--krn-control-height-md',
    heightLg: '--krn-control-height-lg',
    paddingInline: '--krn-control-padding-inline',
    touchTargetMin: '--krn-touch-target-min',
    iconSm: '--krn-icon-size-sm',
    iconMd: '--krn-icon-size-md',
    iconLg: '--krn-icon-size-lg',
    iconStroke: '--krn-icon-stroke-width',
    dataRow: '--krn-data-row-size',
  },
  focus: {
    width: '--krn-focus-ring-width',
    offset: '--krn-focus-ring-offset',
    ring: '--krn-focus-ring',
    dangerRing: '--krn-focus-ring-danger',
  },
  layer: {
    base: '--krn-z-base',
    sticky: '--krn-z-sticky',
    dropdown: '--krn-z-dropdown',
    overlay: '--krn-z-overlay',
    modal: '--krn-z-modal',
    toast: '--krn-z-toast',
  },
  breakpoint: {
    sm: '--krn-breakpoint-sm',
    md: '--krn-breakpoint-md',
    lg: '--krn-breakpoint-lg',
    xl: '--krn-breakpoint-xl',
  },
  container: {
    sm: '--krn-container-sm',
    md: '--krn-container-md',
    lg: '--krn-container-lg',
    xl: '--krn-container-xl',
  },
} as const;

type TokenTree = {
  readonly [key: string]: string | TokenTree;
};

type CssReferenceTree<T extends TokenTree> = {
  readonly [K in keyof T]: T[K] extends string
    ? `var(${T[K]})`
    : T[K] extends TokenTree
      ? CssReferenceTree<T[K]>
      : never;
};

function toCssReferences<T extends TokenTree>(tree: T): CssReferenceTree<T> {
  const output: Record<string, string | TokenTree> = {};

  for (const [key, value] of Object.entries(tree)) {
    output[key] =
      typeof value === 'string' ? `var(${value})` : (toCssReferences(value) as TokenTree);
  }

  return output as CssReferenceTree<T>;
}

/** Ready-to-use `var(--krn-*)` values, strongly typed to the token contract. */
export const krnTokens = toCssReferences(KRN_TOKEN_NAMES);

export type KrnSpace =
  | '0'
  | 'px'
  | '0.5'
  | '1'
  | '1.5'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '8'
  | '10'
  | '12'
  | '16'
  | '20'
  | '24';
export type KrnRadius = keyof typeof KRN_TOKEN_NAMES.radius;
export type KrnElevation = keyof typeof KRN_TOKEN_NAMES.shadow | 'none';
export type KrnFoundationSize = 'sm' | 'md' | 'lg';
export type KrnBreakpoint = 'sm' | 'md' | 'lg' | 'xl';
export type KrnDensity = 'compact' | 'comfortable' | 'spacious';
export type KrnTheme = 'light' | 'dark' | 'system' | 'high-contrast';
export type KrnResolvedTheme = Exclude<KrnTheme, 'system'>;
