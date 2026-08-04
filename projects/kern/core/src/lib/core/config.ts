import type { EnvironmentProviders, Provider, Signal } from '@angular/core';
import {
  DestroyRef,
  Injector,
  effect,
  inject,
  Injectable,
  InjectionToken,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
} from '@angular/core';
import { OverlayContainer } from '@angular/cdk/overlay';

import { KRN_OVERLAY_HOST, KRN_PLATFORM } from '@kern-ui/angular/cdk';
import type { KrnOverlayHostResolver, KrnPlatformAdapter } from '@kern-ui/angular/cdk';
import type { KrnI18nValue } from '@kern-ui/angular/i18n';
import type { KrnDensity, KrnTheme } from '../foundations/tokens';
import {
  KRN_I18N_INITIAL_LOCALE,
  KRN_I18N_INITIAL_TRANSLATIONS,
  KRN_TRANSLATIONS,
  KrnI18n,
  createKrnTranslations,
  normalizeKrnLocale,
} from './i18n';
import type { KrnTranslations, KrnTranslationsPatch } from './i18n';
import {
  captureKrnElementState,
  ownKrnDocumentState,
  restoreKrnElementState,
} from './document-state-ownership';
import { provideKrnTheme } from './theme';
import { provideKrnTranslationBridge } from './translation-bridge';

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
const KRN_RUNTIME_DOCUMENT_STATE = Symbol.for(
  '@kern-ui/angular/core/runtime-config-document-state/v1',
);

export const KRN_CONFIG = new InjectionToken<Readonly<KrnConfig>>('KRN_CONFIG', {
  providedIn: 'root',
  factory: () => EMPTY_CONFIG,
});

/** Active locale source; read direct injections with `krnReadI18nValue`. */
export const KRN_LOCALE = new InjectionToken<KrnI18nValue<string>>('KRN_LOCALE', {
  providedIn: 'root',
  factory: () => inject(KrnI18n).locale,
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
 * Applies document-level preferences only while an injector owns them through
 * `provideKrn`. Locale ownership always keeps `html[lang]` aligned with the
 * active `KrnI18n` scope; bare injection-token defaults do not mutate the host.
 */
@Injectable()
class KrnRuntimeConfigService {
  private readonly config = inject(KRN_CONFIG);
  private readonly i18n = inject(KrnI18n);
  private readonly platform = inject(KRN_PLATFORM);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
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

    const attributeNames = [
      'lang',
      ...(this.config.direction === undefined ? [] : ['dir']),
      ...(this.config.motion === undefined ? [] : ['data-krn-motion']),
    ];

    const ownership = ownKrnDocumentState(
      root,
      KRN_RUNTIME_DOCUMENT_STATE,
      this.destroyRef,
      () => captureKrnElementState(root, attributeNames),
      () => {
        root.setAttribute('lang', this.i18n.locale());
        if (this.config.direction !== undefined) root.setAttribute('dir', this.config.direction);
        if (this.config.motion !== undefined) {
          root.setAttribute('data-krn-motion', this.config.motion);
        }
      },
      (snapshot) => restoreKrnElementState(root, snapshot),
    );

    effect(
      () => {
        const locale = this.i18n.locale();
        if (ownership.isActive()) root.setAttribute('lang', locale);
      },
      { injector: this.injector },
    );
  }
}

/**
 * Registers Kern's cross-cutting configuration as one environment provider.
 * Feature-level providers may still override individual tokens in a child
 * injector when an embedded application needs a different locale or direction.
 * A child that provides the complete `KRN_TRANSLATIONS` registry directly must
 * also install `provideKrnTranslationBridge()` so dependency-light leaf-copy
 * tokens follow that registry.
 */
export function provideKrn(config: KrnConfig = {}): EnvironmentProviders {
  const frozenConfig = Object.freeze({
    ...config,
    locale: config.locale === undefined ? undefined : normalizeKrnLocale(config.locale),
  });
  const translations = createKrnTranslations(frozenConfig.translations);
  const providers: Array<Provider | EnvironmentProviders> = [
    { provide: KRN_CONFIG, useValue: frozenConfig },
    ...(frozenConfig.locale === undefined
      ? []
      : [{ provide: KRN_I18N_INITIAL_LOCALE, useValue: frozenConfig.locale }]),
    { provide: KRN_I18N_INITIAL_TRANSLATIONS, useValue: translations },
    KrnI18n,
    {
      provide: KRN_TRANSLATIONS,
      deps: [KrnI18n],
      useFactory: (i18n: KrnI18n): Readonly<KrnTranslations> => i18n.dictionary,
    },
    {
      provide: KRN_LOCALE,
      deps: [KrnI18n],
      useFactory: (i18n: KrnI18n): Signal<string> => i18n.locale,
    },
    provideKrnTranslationBridge(),
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
    { provide: OverlayContainer, useClass: KrnOverlayContainer },
  ];

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
  }

  return makeEnvironmentProviders(providers);
}
