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
  calendar: {
    dayHover: '--krn-calendar-day-hover',
    rangeSurface: '--krn-calendar-range-surface',
    rangeText: '--krn-calendar-range-text',
    selectedSurface: '--krn-calendar-selected-surface',
    selectedText: '--krn-calendar-selected-text',
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
    lineNone: '--krn-line-height-none',
    lineTight: '--krn-line-height-tight',
    lineHeading: '--krn-line-height-heading',
    lineBody: '--krn-line-height-body',
    lineRelaxed: '--krn-line-height-relaxed',
    weightRegular: '--krn-font-weight-regular',
    weightMedium: '--krn-font-weight-medium',
    weightSemibold: '--krn-font-weight-semibold',
    weightBold: '--krn-font-weight-bold',
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
    formWidth: '--krn-form-focus-ring-width',
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
    popover: '--krn-z-popover',
    drawer: '--krn-z-drawer',
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
  appearance: {
    borderSubtle: '--krn-color-border-subtle',
    brandSolid: '--krn-color-brand-solid',
    brandSurface: '--krn-color-brand-surface',
    brandText: '--krn-color-brand-text',
    brandBorder: '--krn-color-brand-border',
    onBrand: '--krn-color-on-brand',
    accent: '--krn-color-accent',
    accentSoft: '--krn-color-accent-soft',
    accentStrong: '--krn-color-accent-strong',
    accentBorder: '--krn-color-accent-border',
    onAccent: '--krn-color-on-accent',
    successSolid: '--krn-color-success-solid',
    successSoft: '--krn-color-success-soft',
    successSurface: '--krn-color-success-surface',
    successText: '--krn-color-success-text',
    successStrong: '--krn-color-success-strong',
    successBorder: '--krn-color-success-border',
    warningSolid: '--krn-color-warning-solid',
    warningSoft: '--krn-color-warning-soft',
    warningSurface: '--krn-color-warning-surface',
    warningText: '--krn-color-warning-text',
    warningStrong: '--krn-color-warning-strong',
    warningBorder: '--krn-color-warning-border',
    dangerSolid: '--krn-color-danger-solid',
    dangerSoft: '--krn-color-danger-soft',
    dangerSurface: '--krn-color-danger-surface',
    dangerText: '--krn-color-danger-text',
    dangerStrong: '--krn-color-danger-strong',
    dangerBorder: '--krn-color-danger-border',
    infoSolid: '--krn-color-info-solid',
    infoSoft: '--krn-color-info-soft',
    infoSurface: '--krn-color-info-surface',
    infoText: '--krn-color-info-text',
    infoStrong: '--krn-color-info-strong',
    infoBorder: '--krn-color-info-border',
  },
  typographyRecipe: {
    familyUi: '--krn-font-family-ui',
    sizeControl: '--krn-font-size-control',
    body: '--krn-font-body',
    bodySm: '--krn-font-body-sm',
    label: '--krn-font-label',
    labelSm: '--krn-font-label-sm',
    headingSm: '--krn-font-heading-sm',
    headingLg: '--krn-font-heading-lg',
    headingXl: '--krn-font-heading-xl',
  },
  motionRecipe: {
    fast: '--krn-motion-fast',
    moderate: '--krn-motion-moderate',
    slow: '--krn-motion-slow',
    interaction: '--krn-motion-duration-interaction',
    selection: '--krn-motion-duration-selection',
    enterDuration: '--krn-motion-duration-enter',
    exitDuration: '--krn-motion-duration-exit',
    layout: '--krn-motion-duration-layout',
    feedback: '--krn-motion-duration-feedback',
    spinner: '--krn-motion-duration-spinner',
    progress: '--krn-motion-duration-progress',
    skeleton: '--krn-motion-duration-skeleton',
    continuousIterations: '--krn-motion-iteration-continuous',
    standard: '--krn-ease-standard',
    enter: '--krn-ease-enter',
  },
  radiusRecipe: {
    control: '--krn-radius-control',
    surface: '--krn-radius-surface',
    overlay: '--krn-radius-overlay',
    pill: '--krn-radius-pill',
  },
  controlRecipe: {
    sizeSm: '--krn-control-size-sm',
    size: '--krn-control-size',
  },
  density: {
    scale: '--krn-density-scale',
    gap: '--krn-density-gap',
    sectionGap: '--krn-density-section-gap',
    cellPaddingBlock: '--krn-density-cell-padding-block',
    cellPaddingInline: '--krn-density-cell-padding-inline',
    tableRowHeight: '--krn-table-row-height',
  },
  shadowRecipe: {
    control: '--krn-shadow-control',
    floating: '--krn-shadow-floating',
    drawer: '--krn-shadow-drawer',
  },
  chart: {
    1: '--krn-chart-1',
    2: '--krn-chart-2',
    3: '--krn-chart-3',
    4: '--krn-chart-4',
    5: '--krn-chart-5',
  },
} as const;

export type KrnTokenTree = {
  readonly [key: string]: string | KrnTokenTree;
};

const KRN_INTERNAL_TOKEN_NAMES = {
  color: {
    neutral0: '--krn-color-neutral-0',
    neutral25: '--krn-color-neutral-25',
    neutral50: '--krn-color-neutral-50',
    neutral100: '--krn-color-neutral-100',
    neutral200: '--krn-color-neutral-200',
    neutral300: '--krn-color-neutral-300',
    neutral400: '--krn-color-neutral-400',
    neutral500: '--krn-color-neutral-500',
    neutral600: '--krn-color-neutral-600',
    neutral700: '--krn-color-neutral-700',
    neutral800: '--krn-color-neutral-800',
    neutral850: '--krn-color-neutral-850',
    neutral900: '--krn-color-neutral-900',
    neutral950: '--krn-color-neutral-950',
    neutral1000: '--krn-color-neutral-1000',
    brand50: '--krn-color-brand-50',
    brand100: '--krn-color-brand-100',
    brand200: '--krn-color-brand-200',
    brand300: '--krn-color-brand-300',
    brand400: '--krn-color-brand-400',
    brand500: '--krn-color-brand-500',
    brand600: '--krn-color-brand-600',
    brand700: '--krn-color-brand-700',
    brand800: '--krn-color-brand-800',
    brand900: '--krn-color-brand-900',
    brand950: '--krn-color-brand-950',
    green100: '--krn-color-green-100',
    green500: '--krn-color-green-500',
    green700: '--krn-color-green-700',
    amber100: '--krn-color-amber-100',
    amber500: '--krn-color-amber-500',
    amber800: '--krn-color-amber-800',
    red100: '--krn-color-red-100',
    red500: '--krn-color-red-500',
    red700: '--krn-color-red-700',
    blue100: '--krn-color-blue-100',
    blue500: '--krn-color-blue-500',
    blue700: '--krn-color-blue-700',
    violet500: '--krn-color-violet-500',
  },
  shadow: {
    color: '--krn-shadow-color',
  },
  focus: {
    shadow: '--krn-focus-ring-shadow',
  },
} as const;

export type KrnTokenTier = 'primitive' | 'semantic' | 'component' | 'recipe';
export type KrnTokenVisibility = 'public' | 'internal';

export type KrnTokenName = {
  readonly [
    Group in keyof typeof KRN_TOKEN_NAMES
  ]: (typeof KRN_TOKEN_NAMES)[Group][keyof (typeof KRN_TOKEN_NAMES)[Group]];
}[keyof typeof KRN_TOKEN_NAMES];

export interface KrnTokenDescriptor {
  readonly name: string;
  readonly path: string;
  readonly tier: KrnTokenTier;
  readonly visibility: KrnTokenVisibility;
}

const KRN_PUBLIC_TOKEN_TIERS = {
  color: 'semantic',
  calendar: 'component',
  space: 'primitive',
  radius: 'primitive',
  border: 'primitive',
  opacity: 'semantic',
  shadow: 'semantic',
  typography: 'primitive',
  motion: 'primitive',
  control: 'component',
  focus: 'component',
  layer: 'semantic',
  breakpoint: 'primitive',
  container: 'primitive',
  appearance: 'semantic',
  typographyRecipe: 'recipe',
  motionRecipe: 'recipe',
  radiusRecipe: 'recipe',
  controlRecipe: 'recipe',
  density: 'component',
  shadowRecipe: 'recipe',
  chart: 'component',
} as const satisfies Readonly<Record<keyof typeof KRN_TOKEN_NAMES, KrnTokenTier>>;

function tokenDescriptors(
  tree: KrnTokenTree,
  visibility: KrnTokenVisibility,
  tiers: Readonly<Record<string, KrnTokenTier>>,
): KrnTokenDescriptor[] {
  const descriptors: KrnTokenDescriptor[] = [];

  for (const [group, values] of Object.entries(tree)) {
    if (typeof values === 'string') {
      descriptors.push({
        name: values,
        path: group,
        tier: tiers[group] ?? 'primitive',
        visibility,
      });
      continue;
    }

    for (const [key, name] of Object.entries(values)) {
      if (typeof name !== 'string') {
        continue;
      }
      descriptors.push({
        name,
        path: `${group}.${key}`,
        tier: tiers[group] ?? 'primitive',
        visibility,
      });
    }
  }

  return descriptors;
}

/**
 * Machine-readable registry used by documentation and contract verification.
 * Internal entries are included for parity checks but are not part of
 * `krnTokens` and may change without a deprecation cycle before 1.0.
 */
export const KRN_TOKEN_MANIFEST: readonly KrnTokenDescriptor[] = Object.freeze([
  ...tokenDescriptors(KRN_TOKEN_NAMES, 'public', KRN_PUBLIC_TOKEN_TIERS),
  ...tokenDescriptors(KRN_INTERNAL_TOKEN_NAMES, 'internal', {
    color: 'primitive',
    shadow: 'primitive',
    focus: 'component',
  }),
]);

export type KrnCssReferenceTree<T extends KrnTokenTree> = {
  readonly [K in keyof T]: T[K] extends string
    ? `var(${T[K]})`
    : T[K] extends KrnTokenTree
      ? KrnCssReferenceTree<T[K]>
      : never;
};

function toCssReferences<T extends KrnTokenTree>(tree: T): KrnCssReferenceTree<T> {
  const output: Record<string, string | KrnTokenTree> = {};

  for (const [key, value] of Object.entries(tree)) {
    output[key] =
      typeof value === 'string' ? `var(${value})` : (toCssReferences(value) as KrnTokenTree);
  }

  return output as KrnCssReferenceTree<T>;
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
