import type { EnvironmentProviders, Provider } from '@angular/core';
import {
  inject,
  Injectable,
  InjectionToken,
  LOCALE_ID,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
} from '@angular/core';
import { OverlayContainer } from '@angular/cdk/overlay';

import { KRN_OVERLAY_HOST, KRN_PLATFORM } from '@kern-ui/angular/cdk';
import type { KrnOverlayHostResolver, KrnPlatformAdapter } from '@kern-ui/angular/cdk';
import type { KrnDensity, KrnTheme } from '../foundations/tokens';
import { createKrnTranslations, KRN_TRANSLATIONS } from './i18n';
import type { KrnTranslationsPatch } from './i18n';
import { provideKrnTheme } from './theme';

export type KrnDirection = 'ltr' | 'rtl';
export type KrnMotionPreference = 'system' | 'reduce' | 'full';
export type KrnOverlayHost = string | KrnOverlayHostResolver;

export interface KrnConfig {
  readonly locale?: string;
  readonly direction?: KrnDirection;
  readonly density?: KrnDensity;
  readonly motion?: KrnMotionPreference;
  readonly theme?: KrnTheme;
  readonly brandColor?: string | null;
  readonly persistPreferences?: boolean;
  readonly preferenceStorageKey?: string;
  readonly overlayHost?: KrnOverlayHost;
  readonly platform?: KrnPlatformAdapter;
  readonly translations?: KrnTranslationsPatch;
}

const EMPTY_CONFIG: Readonly<KrnConfig> = Object.freeze({});

export const KRN_CONFIG = new InjectionToken<Readonly<KrnConfig>>('KRN_CONFIG', {
  providedIn: 'root',
  factory: () => EMPTY_CONFIG,
});

export const KRN_LOCALE = new InjectionToken<string>('KRN_LOCALE', {
  providedIn: 'root',
  factory: () => inject(LOCALE_ID),
});

export const KRN_DIRECTION = new InjectionToken<KrnDirection>('KRN_DIRECTION', {
  providedIn: 'root',
  factory: () => {
    const direction = inject(KRN_PLATFORM).document.documentElement?.getAttribute('dir');
    return direction === 'rtl' ? 'rtl' : 'ltr';
  },
});

export const KRN_MOTION = new InjectionToken<KrnMotionPreference>('KRN_MOTION', {
  providedIn: 'root',
  factory: () => 'system',
});

function normalizedLocale(locale: string): string {
  const value = locale.trim();
  if (!value) {
    throw new Error('Kern locale must be a non-empty BCP 47 language tag.');
  }

  try {
    const canonical = Intl.getCanonicalLocales(value)[0];
    if (canonical) {
      return canonical;
    }
  } catch {
    // The public error below is stable across JavaScript engines.
  }

  throw new Error(`Invalid Kern locale "${value}". Expected a BCP 47 language tag.`);
}

function overlayHostProvider(host: KrnOverlayHost): Provider {
  if (typeof host === 'function') {
    return { provide: KRN_OVERLAY_HOST, useValue: host };
  }

  return {
    provide: KRN_OVERLAY_HOST,
    useFactory: (): KrnOverlayHostResolver => {
      const platform = inject(KRN_PLATFORM);
      return () => platform.document.querySelector<HTMLElement>(host);
    },
  };
}

/**
 * Keeps Angular CDK portals in Kern's configured overlay branch. Resolving the
 * host on every access also supports hosts that are rendered after bootstrap.
 */
@Injectable()
class KrnOverlayContainer extends OverlayContainer {
  private readonly resolveHost = inject(KRN_OVERLAY_HOST);

  override getContainerElement(): HTMLElement {
    const container = super.getContainerElement();
    const host = this.resolveHost() ?? this._document.body;
    if (
      host !== container &&
      host.ownerDocument === this._document &&
      container.parentElement !== host
    ) {
      host.append(container);
    }
    return container;
  }
}

/**
 * Applies document-level preferences only when the consumer explicitly owns
 * them through `provideKrn`. Injection-token defaults never mutate the host app.
 */
@Injectable()
class KrnRuntimeConfigService {
  private readonly config = inject(KRN_CONFIG);
  private readonly platform = inject(KRN_PLATFORM);
  private initialized = false;

  initialize(): void {
    if (this.initialized) {
      return;
    }
    this.initialized = true;

    const root = this.platform.document.documentElement;
    if (!root) {
      return;
    }

    if (this.config.locale !== undefined) {
      root.setAttribute('lang', this.config.locale);
    }
    if (this.config.direction !== undefined) {
      root.setAttribute('dir', this.config.direction);
    }
    if (this.config.motion !== undefined) {
      root.setAttribute('data-krn-motion', this.config.motion);
    }
  }
}

/**
 * Registers Kern's cross-cutting configuration as one environment provider.
 * Feature-level providers may still override individual tokens in a child
 * injector when an embedded application needs a different locale or direction.
 */
export function provideKrn(config: KrnConfig = {}): EnvironmentProviders {
  const frozenConfig = Object.freeze({
    ...config,
    locale: config.locale === undefined ? undefined : normalizedLocale(config.locale),
  });
  const providers: Array<Provider | EnvironmentProviders> = [
    { provide: KRN_CONFIG, useValue: frozenConfig },
    {
      provide: KRN_TRANSLATIONS,
      useValue: createKrnTranslations(frozenConfig.translations),
    },
    provideKrnTheme({
      theme: frozenConfig.theme,
      density: frozenConfig.density,
      brandColor: frozenConfig.brandColor,
      persist: frozenConfig.persistPreferences,
      storageKey: frozenConfig.preferenceStorageKey,
    }),
    KrnRuntimeConfigService,
    provideEnvironmentInitializer(() => {
      inject(KrnRuntimeConfigService).initialize();
    }),
  ];

  if (frozenConfig.locale !== undefined) {
    providers.push({ provide: KRN_LOCALE, useValue: frozenConfig.locale });
  }
  if (frozenConfig.direction !== undefined) {
    providers.push({ provide: KRN_DIRECTION, useValue: frozenConfig.direction });
  }
  if (frozenConfig.motion !== undefined) {
    providers.push({ provide: KRN_MOTION, useValue: frozenConfig.motion });
  }
  if (frozenConfig.platform !== undefined) {
    providers.push({ provide: KRN_PLATFORM, useValue: frozenConfig.platform });
  }
  if (frozenConfig.overlayHost !== undefined) {
    providers.push(overlayHostProvider(frozenConfig.overlayHost));
    providers.push({ provide: OverlayContainer, useClass: KrnOverlayContainer });
  }

  return makeEnvironmentProviders(providers);
}
