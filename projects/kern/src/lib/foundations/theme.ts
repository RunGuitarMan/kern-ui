import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import type {
  EnvironmentProviders} from '@angular/core';
import {
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  InjectionToken,
  input,
  makeEnvironmentProviders,
  PLATFORM_ID,
  provideEnvironmentInitializer,
  Renderer2,
  signal,
  computed,
  Injectable,
} from '@angular/core';

import { generateKrnBrandPalette, krnBrandPaletteVariables } from './brand-color';
import type { KrnDensity, KrnResolvedTheme, KrnTheme } from './tokens';

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

function validBrandColor(value: unknown): value is string | null {
  return value === null || (typeof value === 'string' && generateKrnBrandPalette(value) !== null);
}

@Injectable({ providedIn: 'root' })
export class KrnThemeService {
  private readonly config = inject(KRN_THEME_CONFIG);
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly browser = isPlatformBrowser(this.platformId);
  private readonly storageKey = this.config.storageKey ?? 'krn.preferences';
  private readonly systemDark = signal(false);
  private readonly forcedContrast = signal(false);
  private readonly initialized = signal(false);
  private readonly managedBrandProperties = new Set<string>();
  private readonly themeState = signal<KrnTheme>(this.config.theme ?? 'system');
  private readonly densityState = signal<KrnDensity>(this.config.density ?? 'comfortable');
  private readonly brandColorState = signal<string | null>(
    validBrandColor(this.config.brandColor) ? this.config.brandColor : null,
  );

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
      const theme = this.themeState();
      const resolvedTheme = this.resolvedTheme();
      const density = this.densityState();
      const brandColor = this.brandColorState();
      const root = this.document.documentElement;

      if (root) {
        this.applyToElement(root, theme, resolvedTheme, density, brandColor);
      }

      if (this.browser && this.initialized() && this.config.persist !== false) {
        this.persist({ theme, density, brandColor });
      }
    });
  }

  initialize(): void {
    if (this.initialized()) {
      return;
    }

    if (this.browser) {
      const view = this.document.defaultView;
      const matchMedia =
        view && typeof view.matchMedia === 'function' ? view.matchMedia.bind(view) : null;
      this.connectMediaQuery(matchMedia?.('(prefers-color-scheme: dark)'), this.systemDark);
      this.connectMediaQuery(matchMedia?.('(forced-colors: active)'), this.forcedContrast);

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
    this.brandColorState.set(this.config.brandColor ?? null);
    if (this.browser) {
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

    for (const property of this.managedBrandProperties) {
      element.style.removeProperty(property);
    }
    this.managedBrandProperties.clear();

    const palette = brandColor ? generateKrnBrandPalette(brandColor) : null;
    if (palette) {
      for (const [property, value] of Object.entries(krnBrandPaletteVariables(palette))) {
        element.style.setProperty(property, value);
        this.managedBrandProperties.add(property);
      }
    }
  }

  private safeStorage(): Storage | null {
    try {
      return this.document.defaultView?.localStorage ?? null;
    } catch {
      return null;
    }
  }

  private readPersisted(): PersistedThemeState | null {
    try {
      const raw = this.safeStorage()?.getItem(this.storageKey);
      return raw ? (JSON.parse(raw) as PersistedThemeState) : null;
    } catch {
      return null;
    }
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
        this.renderer.removeStyle(this.element.nativeElement, property);
      }
      this.managedBrandProperties.clear();

      if (palette) {
        for (const [property, value] of Object.entries(krnBrandPaletteVariables(palette))) {
          this.renderer.setStyle(this.element.nativeElement, property, value);
          this.managedBrandProperties.add(property);
        }
      }
    });
  }
}
