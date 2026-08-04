import type { EnvironmentProviders } from '@angular/core';
import {
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  InjectionToken,
  input,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
  Renderer2,
  RendererStyleFlags2,
  signal,
  computed,
  Injectable,
} from '@angular/core';

import { KRN_PLATFORM } from '@kern-ui/angular/cdk';
import {
  generateKrnBrandPalette,
  KRN_BRAND_STEPS,
  krnBrandPaletteVariables,
} from '../foundations/brand-color';
import type { KrnDensity, KrnResolvedTheme, KrnTheme } from '../foundations/tokens';
import {
  captureKrnElementState,
  ownKrnDocumentState,
  restoreKrnElementState,
} from './document-state-ownership';

export interface KrnThemeConfig {
  readonly theme?: KrnTheme;
  readonly density?: KrnDensity;
  readonly brandColor?: string | null;
  readonly persist?: boolean;
  readonly storageKey?: string;
}

export const KRN_THEME_CONFIG = new InjectionToken<Readonly<KrnThemeConfig>>('KRN_THEME_CONFIG', {
  providedIn: 'root',
  factory: () => ({}),
});

interface PersistedThemeState {
  readonly theme?: KrnTheme;
  readonly density?: KrnDensity;
  readonly brandColor?: string | null;
}

const THEMES = new Set<KrnTheme>(['light', 'dark', 'system', 'high-contrast']);
const DENSITIES = new Set<KrnDensity>(['compact', 'comfortable', 'spacious']);
const DEFAULT_PREFERENCE_STORAGE_KEY = 'krn.preferences';
const KRN_THEME_DOCUMENT_STATE = Symbol.for('@kern-ui/angular/core/theme-document-state/v1');
const THEME_DOCUMENT_ATTRIBUTES = [
  'data-krn-theme-mode',
  'data-krn-theme',
  'data-krn-density',
] as const;
const THEME_DOCUMENT_STYLES = [
  'color-scheme',
  ...KRN_BRAND_STEPS.map((step) => `--krn-color-brand-${step}`),
] as const;

function validBrandColor(value: unknown): value is string | null {
  return value === null || (typeof value === 'string' && generateKrnBrandPalette(value) !== null);
}

function readPersistedThemeState(
  storage: Pick<Storage, 'getItem'> | null,
  storageKey: string,
): PersistedThemeState | null {
  try {
    const raw = storage?.getItem(storageKey);
    return raw ? (JSON.parse(raw) as PersistedThemeState) : null;
  } catch {
    return null;
  }
}

function documentStorage(document: Document): Storage | null {
  try {
    return document.defaultView?.localStorage ?? null;
  } catch {
    return null;
  }
}

export interface KrnPrepaintThemeOptions {
  readonly document?: Document | null;
  readonly storage?: Pick<Storage, 'getItem'> | null;
  readonly storageKey?: string;
  readonly persist?: boolean;
  readonly theme?: KrnTheme;
  readonly density?: KrnDensity;
  readonly brandColor?: string | null;
  readonly systemDark?: boolean;
  readonly forcedContrast?: boolean;
}

export interface KrnPrepaintThemeState {
  readonly theme: KrnTheme;
  readonly resolvedTheme: KrnResolvedTheme;
  readonly density: KrnDensity;
  readonly brandColor: string | null;
}

/**
 * Applies validated theme preferences before Angular starts.
 *
 * The helper only mutates attributes and custom properties on an existing
 * document. It never creates inline scripts, uses `eval`, or writes HTML, so it
 * can be called from a CSP-approved external module before `bootstrapApplication`.
 */
export function applyKrnPrepaintTheme(
  options: KrnPrepaintThemeOptions = {},
): KrnPrepaintThemeState | null {
  const targetDocument =
    options.document === undefined
      ? typeof document === 'undefined'
        ? null
        : document
      : options.document;
  const root = targetDocument?.documentElement;
  if (!targetDocument || !root) {
    return null;
  }

  const storage =
    options.persist === false
      ? null
      : options.storage === undefined
        ? documentStorage(targetDocument)
        : options.storage;
  const saved = readPersistedThemeState(
    storage,
    options.storageKey ?? DEFAULT_PREFERENCE_STORAGE_KEY,
  );
  const configuredTheme = options.theme && THEMES.has(options.theme) ? options.theme : 'system';
  const configuredDensity =
    options.density && DENSITIES.has(options.density) ? options.density : 'comfortable';
  const configuredBrand = validBrandColor(options.brandColor) ? options.brandColor : null;
  const theme = saved?.theme && THEMES.has(saved.theme) ? saved.theme : configuredTheme;
  const density =
    saved?.density && DENSITIES.has(saved.density) ? saved.density : configuredDensity;
  const brandColor =
    saved && validBrandColor(saved.brandColor) ? saved.brandColor : configuredBrand;
  const view = targetDocument.defaultView;
  const systemDark =
    options.systemDark ??
    (typeof view?.matchMedia === 'function' &&
      view.matchMedia('(prefers-color-scheme: dark)').matches);
  const forcedContrast =
    options.forcedContrast ??
    (typeof view?.matchMedia === 'function' && view.matchMedia('(forced-colors: active)').matches);
  const resolvedTheme: KrnResolvedTheme =
    theme === 'high-contrast' || forcedContrast
      ? 'high-contrast'
      : theme === 'system'
        ? systemDark
          ? 'dark'
          : 'light'
        : theme;

  root.setAttribute('data-krn-theme-mode', theme);
  root.setAttribute('data-krn-theme', resolvedTheme);
  root.setAttribute('data-krn-density', density);
  root.style.colorScheme = resolvedTheme === 'high-contrast' ? 'light dark' : resolvedTheme;

  for (const step of KRN_BRAND_STEPS) {
    root.style.removeProperty(`--krn-color-brand-${step}`);
  }
  const palette = brandColor ? generateKrnBrandPalette(brandColor) : null;
  if (palette) {
    for (const [property, value] of Object.entries(krnBrandPaletteVariables(palette))) {
      root.style.setProperty(property, value);
    }
  }

  return { theme, resolvedTheme, density, brandColor };
}

@Injectable({ providedIn: 'root' })
export class KrnThemeService {
  private readonly config = inject(KRN_THEME_CONFIG);
  private readonly platform = inject(KRN_PLATFORM);
  private readonly document = this.platform.document;
  private readonly destroyRef = inject(DestroyRef);
  private readonly browser = this.platform.isBrowser;
  private readonly storageKey = this.config.storageKey ?? DEFAULT_PREFERENCE_STORAGE_KEY;
  private readonly systemDark = signal(false);
  private readonly forcedContrast = signal(false);
  private readonly initialized = signal(false);
  private readonly themeState = signal<KrnTheme>(this.config.theme ?? 'system');
  private readonly densityState = signal<KrnDensity>(this.config.density ?? 'comfortable');
  private readonly brandColorState = signal<string | null>(
    validBrandColor(this.config.brandColor) ? this.config.brandColor : null,
  );
  private documentOwnership: ReturnType<typeof ownKrnDocumentState> | null = null;

  readonly theme = this.themeState.asReadonly();
  readonly density = this.densityState.asReadonly();
  readonly brandColor = this.brandColorState.asReadonly();
  readonly resolvedTheme = computed<KrnResolvedTheme>(() => this.resolveTheme(this.themeState()));

  resolveTheme(theme: KrnTheme): KrnResolvedTheme {
    if (theme === 'high-contrast' || this.forcedContrast()) {
      return 'high-contrast';
    }

    if (theme === 'system') {
      return this.systemDark() ? 'dark' : 'light';
    }

    return theme;
  }

  constructor() {
    effect(() => {
      this.themeState();
      this.resolvedTheme();
      this.densityState();
      this.brandColorState();
      this.documentOwnership?.refresh();
    });
  }

  initialize(): void {
    if (this.initialized()) {
      return;
    }

    if (this.browser) {
      this.connectMediaQuery(
        this.platform.matchMedia('(prefers-color-scheme: dark)') ?? undefined,
        this.systemDark,
      );
      this.connectMediaQuery(
        this.platform.matchMedia('(forced-colors: active)') ?? undefined,
        this.forcedContrast,
      );

      if (this.config.persist !== false) {
        const saved = this.readPersisted();
        if (saved?.theme && THEMES.has(saved.theme)) {
          this.themeState.set(saved.theme);
        }
        if (saved?.density && DENSITIES.has(saved.density)) {
          this.densityState.set(saved.density);
        }
        if (saved && validBrandColor(saved.brandColor)) {
          this.brandColorState.set(saved.brandColor);
        }
      }
    }

    this.initialized.set(true);
    const root = this.document.documentElement;
    if (root) {
      this.documentOwnership = ownKrnDocumentState(
        root,
        KRN_THEME_DOCUMENT_STATE,
        this.destroyRef,
        () => captureKrnElementState(root, THEME_DOCUMENT_ATTRIBUTES, THEME_DOCUMENT_STYLES),
        () => {
          const theme = this.themeState();
          const resolvedTheme = this.resolvedTheme();
          const density = this.densityState();
          const brandColor = this.brandColorState();
          this.applyToElement(root, theme, resolvedTheme, density, brandColor);
          if (this.browser && this.config.persist !== false) {
            this.persist({ theme, density, brandColor });
          }
        },
        (snapshot) => restoreKrnElementState(root, snapshot),
      );
    }
  }

  setTheme(theme: KrnTheme): void {
    this.themeState.set(theme);
  }

  setDensity(density: KrnDensity): void {
    this.densityState.set(density);
  }

  /**
   * Accepts a hexadecimal brand color. Invalid values leave the current brand
   * untouched and return false, making validation easy in theme editors.
   */
  setBrandColor(brandColor: string | null): boolean {
    if (brandColor !== null && !generateKrnBrandPalette(brandColor)) {
      return false;
    }
    this.brandColorState.set(brandColor);
    return true;
  }

  reset(): void {
    this.themeState.set(this.config.theme ?? 'system');
    this.densityState.set(this.config.density ?? 'comfortable');
    this.brandColorState.set(
      validBrandColor(this.config.brandColor) ? this.config.brandColor : null,
    );
    if (this.browser && this.documentOwnership?.isActive()) {
      this.safeStorage()?.removeItem(this.storageKey);
    }
  }

  private connectMediaQuery(
    query: MediaQueryList | undefined,
    target: ReturnType<typeof signal<boolean>>,
  ): void {
    if (!query) {
      return;
    }

    target.set(query.matches);
    const listener = (event: MediaQueryListEvent): void => {
      target.set(event.matches);
    };
    query.addEventListener('change', listener);
    this.destroyRef.onDestroy(() => {
      query.removeEventListener('change', listener);
    });
  }

  private applyToElement(
    element: HTMLElement,
    mode: KrnTheme,
    resolved: KrnResolvedTheme,
    density: KrnDensity,
    brandColor: string | null,
  ): void {
    // Angular's server DOM implements attributes consistently, while `dataset`
    // is not guaranteed to exist during prerendering.
    element.setAttribute('data-krn-theme-mode', mode);
    element.setAttribute('data-krn-theme', resolved);
    element.setAttribute('data-krn-density', density);
    element.style.colorScheme = resolved === 'high-contrast' ? 'light dark' : resolved;

    for (const step of KRN_BRAND_STEPS) {
      element.style.removeProperty(`--krn-color-brand-${step}`);
    }

    const palette = brandColor ? generateKrnBrandPalette(brandColor) : null;
    if (palette) {
      for (const [property, value] of Object.entries(krnBrandPaletteVariables(palette))) {
        element.style.setProperty(property, value);
      }
    }
  }

  private safeStorage(): Storage | null {
    return this.platform.localStorage;
  }

  private readPersisted(): PersistedThemeState | null {
    return readPersistedThemeState(this.safeStorage(), this.storageKey);
  }

  private persist(state: PersistedThemeState): void {
    try {
      this.safeStorage()?.setItem(this.storageKey, JSON.stringify(state));
    } catch {
      // Storage can be unavailable in private browsing; theming still works.
    }
  }
}

export function provideKrnTheme(config: KrnThemeConfig = {}): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: KRN_THEME_CONFIG, useValue: Object.freeze({ ...config }) },
    KrnThemeService,
    provideEnvironmentInitializer(() => {
      inject(KrnThemeService).initialize();
    }),
  ]);
}

@Directive({
  selector: '[krnTheme]',
  standalone: true,
  host: {
    '[attr.data-krn-theme-mode]': 'themeMode()',
    '[attr.data-krn-theme]': 'resolvedTheme()',
    '[attr.data-krn-density]': 'resolvedDensity()',
  },
})
export class KrnThemeDirective {
  private readonly service = inject(KrnThemeService);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly managedBrandProperties = new Set<string>();

  readonly theme = input<KrnTheme | undefined>(undefined, {
    alias: 'krnTheme',
  });
  readonly density = input<KrnDensity | undefined>(undefined, {
    alias: 'krnDensity',
  });
  readonly brandColor = input<string | null | undefined>(undefined, {
    alias: 'krnBrandColor',
  });

  protected readonly themeMode = computed(() => this.theme() ?? this.service.theme());
  protected readonly resolvedTheme = computed<KrnResolvedTheme>(() => {
    return this.service.resolveTheme(this.themeMode());
  });
  protected readonly resolvedDensity = computed(() => this.density() ?? this.service.density());

  constructor() {
    this.service.initialize();

    effect(() => {
      const color = this.brandColor();
      const palette = color === undefined ? null : color ? generateKrnBrandPalette(color) : null;
      for (const property of this.managedBrandProperties) {
        this.renderer.removeStyle(
          this.element.nativeElement,
          property,
          RendererStyleFlags2.DashCase,
        );
      }
      this.managedBrandProperties.clear();

      if (palette) {
        for (const [property, value] of Object.entries(krnBrandPaletteVariables(palette))) {
          this.renderer.setStyle(
            this.element.nativeElement,
            property,
            value,
            RendererStyleFlags2.DashCase,
          );
          this.managedBrandProperties.add(property);
        }
      }
    });
  }
}
