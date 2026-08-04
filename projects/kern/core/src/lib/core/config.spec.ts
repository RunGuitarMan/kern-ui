import { DOCUMENT } from '@angular/common';
import { OverlayContainer } from '@angular/cdk/overlay';
import { createEnvironmentInjector, EnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { KRN_OVERLAY_HOST, KRN_PLATFORM } from '@kern-ui/angular/cdk';
import {
  KRN_COPY_LABELS,
  KRN_LOADING_LABEL,
  KRN_MORE_ACTIONS_LABEL,
  krnReadI18nValue,
} from '@kern-ui/angular/i18n';
import { KRN_CONFIG, KRN_DIRECTION, KRN_LOCALE, KRN_MOTION, provideKrn } from './config';
import { KrnI18n, createKrnTranslations, KRN_TRANSLATIONS } from './i18n';
import { provideKrnTranslationBridge } from './translation-bridge';

describe('provideKrn', () => {
  const rootAttributes = ['lang', 'dir', 'data-krn-motion', 'data-krn-theme', 'data-krn-density'];

  afterEach(() => {
    const document = TestBed.inject(DOCUMENT);
    TestBed.resetTestingModule();
    for (const attribute of rootAttributes) {
      document.documentElement.removeAttribute(attribute);
    }
    document.documentElement.removeAttribute('style');
    document.querySelector('[data-config-spec-overlay]')?.remove();
  });

  it('registers one immutable runtime contract and applies explicit preferences', () => {
    TestBed.configureTestingModule({
      providers: [
        provideKrn({
          locale: 'de-DE',
          direction: 'rtl',
          density: 'compact',
          motion: 'reduce',
          theme: 'dark',
          persistPreferences: false,
          overlayHost: '[data-config-spec-overlay]',
          translations: {
            actions: {
              copying: 'Wird kopiert…',
              moreActions: 'Weitere Aktionen',
            },
            dataGrid: {
              empty: 'Keine Daten',
            },
            feedback: {
              loadingInProgress: 'Wird geladen…',
            },
          },
        }),
      ],
    });
    const document = TestBed.inject(DOCUMENT);
    const overlay = document.createElement('div');
    overlay.setAttribute('data-config-spec-overlay', '');
    document.body.append(overlay);

    expect(krnReadI18nValue(TestBed.inject(KRN_LOCALE))).toBe('de-DE');
    expect(TestBed.inject(KRN_DIRECTION)).toBe('rtl');
    expect(TestBed.inject(KRN_MOTION)).toBe('reduce');
    const translations = TestBed.inject(KRN_TRANSLATIONS);
    expect(translations.dataGrid.empty).toBe('Keine Daten');
    expect(translations.dataGrid.nextPage).toBe('Next');
    expect(Object.isFrozen(translations.dataGrid)).toBe(true);
    expect(krnReadI18nValue(TestBed.inject(KRN_LOADING_LABEL))).toBe('Wird geladen…');
    expect(krnReadI18nValue(TestBed.inject(KRN_MORE_ACTIONS_LABEL))).toBe('Weitere Aktionen');
    expect(krnReadI18nValue(TestBed.inject(KRN_COPY_LABELS))).toEqual({
      copy: 'Copy to clipboard',
      copied: 'Copied',
      copying: 'Wird kopiert…',
      failed: 'Could not copy',
    });
    expect(Object.isFrozen(krnReadI18nValue(TestBed.inject(KRN_COPY_LABELS)))).toBe(true);
    expect(Object.isFrozen(TestBed.inject(KRN_CONFIG))).toBe(true);
    expect(TestBed.inject(KRN_OVERLAY_HOST)()).toBe(overlay);
    expect(document.documentElement.getAttribute('lang')).toBe('de-DE');
    expect(document.documentElement.getAttribute('dir')).toBe('rtl');
    expect(document.documentElement.getAttribute('data-krn-motion')).toBe('reduce');

    TestBed.tick();
    expect(document.documentElement.getAttribute('data-krn-theme')).toBe('dark');
    expect(document.documentElement.getAttribute('data-krn-density')).toBe('compact');
  });

  it('switches scoped locale and frozen translation views reactively', () => {
    TestBed.configureTestingModule({
      providers: [provideKrn({ locale: 'en-US', persistPreferences: false })],
    });
    const document = TestBed.inject(DOCUMENT);
    const i18n = TestBed.inject(KrnI18n);
    const translations = TestBed.inject(KRN_TRANSLATIONS);
    const locale = TestBed.inject(KRN_LOCALE);
    const loadingLabel = TestBed.inject(KRN_LOADING_LABEL);
    const moreActionsLabel = TestBed.inject(KRN_MORE_ACTIONS_LABEL);
    const copyLabels = TestBed.inject(KRN_COPY_LABELS);

    expect(Object.isFrozen(translations)).toBe(true);
    expect(Object.isFrozen(translations.feedback)).toBe(true);
    expect(translations.feedback.loadingInProgress).toBe('Loading…');

    i18n.activate('ru-ru', {
      actions: {
        copied: 'Скопировано',
        moreActions: 'Другие действия',
      },
      feedback: { loadingInProgress: 'Загрузка…' },
    });
    TestBed.tick();

    expect(i18n.locale()).toBe('ru-RU');
    expect(krnReadI18nValue(locale)).toBe('ru-RU');
    expect(TestBed.inject(KRN_TRANSLATIONS)).toBe(translations);
    expect(translations.feedback.loadingInProgress).toBe('Загрузка…');
    expect(krnReadI18nValue(loadingLabel)).toBe('Загрузка…');
    expect(krnReadI18nValue(moreActionsLabel)).toBe('Другие действия');
    expect(krnReadI18nValue(copyLabels).copied).toBe('Скопировано');
    expect(document.documentElement.getAttribute('lang')).toBe('ru-RU');
  });

  it('tracks runtime locale and restores lang when no initial locale is configured', () => {
    const document = TestBed.inject(DOCUMENT);
    const root = document.documentElement;
    root.setAttribute('lang', 'fr');
    const owner = createEnvironmentInjector(
      [provideKrn({ persistPreferences: false })],
      TestBed.inject(EnvironmentInjector),
    );

    try {
      owner.get(KrnI18n).setLocale('ru-ru');
      TestBed.tick();
      expect(root.getAttribute('lang')).toBe('ru-RU');
    } finally {
      owner.destroy();
    }

    expect(root.getAttribute('lang')).toBe('fr');
  });

  it('resolves loading copy from the final translation provider in the same injector', () => {
    const translations = createKrnTranslations({
      actions: {
        copied: 'Final copied',
        copying: 'Final copying…',
        moreActions: 'Final more actions',
      },
      feedback: { loadingInProgress: 'Final registry copy…' },
    });
    TestBed.configureTestingModule({
      providers: [
        provideKrn({ persistPreferences: false }),
        { provide: KRN_TRANSLATIONS, useValue: translations },
      ],
    });

    expect(krnReadI18nValue(TestBed.inject(KRN_LOADING_LABEL))).toBe('Final registry copy…');
    expect(krnReadI18nValue(TestBed.inject(KRN_MORE_ACTIONS_LABEL))).toBe('Final more actions');
    expect(krnReadI18nValue(TestBed.inject(KRN_COPY_LABELS))).toMatchObject({
      copied: 'Final copied',
      copying: 'Final copying…',
    });
  });

  it('bridges a low-level translation boundary explicitly', () => {
    const translations = createKrnTranslations({
      actions: {
        copyFailed: 'Nested copy failed',
        moreActions: 'Nested more actions',
      },
      feedback: { loadingInProgress: 'Nested registry copy…' },
    });
    TestBed.configureTestingModule({
      providers: [
        { provide: KRN_TRANSLATIONS, useValue: translations },
        provideKrnTranslationBridge(),
      ],
    });

    expect(krnReadI18nValue(TestBed.inject(KRN_LOADING_LABEL))).toBe('Nested registry copy…');
    expect(krnReadI18nValue(TestBed.inject(KRN_MORE_ACTIONS_LABEL))).toBe('Nested more actions');
    expect(krnReadI18nValue(TestBed.inject(KRN_COPY_LABELS)).failed).toBe('Nested copy failed');
  });

  it('exposes the translation bridge as an extensible aggregate provider set', () => {
    const providers = provideKrnTranslationBridge();

    expect(Array.isArray(providers)).toBe(true);
    expect(providers).toHaveLength(3);
  });

  it('supports a replaceable platform adapter without browser globals', () => {
    TestBed.configureTestingModule({});
    const defaultPlatform = TestBed.inject(KRN_PLATFORM);
    const customPlatform = {
      ...defaultPlatform,
      isBrowser: false,
      window: null,
      localStorage: null,
      matchMedia: () => null,
      requestAnimationFrame: () => null,
      cancelAnimationFrame: () => undefined,
    } as const;

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideKrn({
          platform: customPlatform,
          persistPreferences: false,
          overlayHost: () => null,
        }),
      ],
    });

    expect(TestBed.inject(KRN_PLATFORM)).toBe(customPlatform);
    const container = TestBed.inject(OverlayContainer).getContainerElement();
    expect(container.parentElement).toBe(customPlatform.document.body);
    expect(customPlatform.document.querySelectorAll('.cdk-overlay-container')).toHaveLength(1);
  });

  it('always routes CDK overlays through the Kern host contract', () => {
    const document = TestBed.inject(DOCUMENT);
    const host = document.createElement('div');
    host.setAttribute('data-config-spec-overlay', '');
    document.body.append(host);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideKrn({ persistPreferences: false }),
        { provide: KRN_OVERLAY_HOST, useValue: () => host },
      ],
    });

    const container = TestBed.inject(OverlayContainer).getContainerElement();
    expect(container.parentElement).toBe(host);
    expect(document.querySelectorAll('.cdk-overlay-container')).toHaveLength(1);
  });

  it('does not move the Angular overlay container across document boundaries', () => {
    const angularDocument = TestBed.inject(DOCUMENT);
    const defaultPlatform = TestBed.inject(KRN_PLATFORM);
    const foreignDocument = angularDocument.implementation.createHTMLDocument('foreign');
    const foreignPlatform = {
      ...defaultPlatform,
      document: foreignDocument,
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideKrn({
          platform: foreignPlatform,
          persistPreferences: false,
        }),
      ],
    });

    const container = TestBed.inject(OverlayContainer).getContainerElement();
    expect(container.ownerDocument).toBe(angularDocument);
    expect(container.parentElement).toBe(angularDocument.body);
    expect(foreignDocument.querySelector('.cdk-overlay-container')).toBeNull();
  });

  it('moves one CDK overlay container into a late-rendered custom host', () => {
    TestBed.configureTestingModule({
      providers: [
        provideKrn({
          persistPreferences: false,
          overlayHost: '[data-config-spec-overlay]',
        }),
      ],
    });
    const document = TestBed.inject(DOCUMENT);
    const overlayContainer = TestBed.inject(OverlayContainer);
    const initialContainer = overlayContainer.getContainerElement();
    expect(initialContainer.parentElement).toBe(document.body);

    const host = document.createElement('div');
    host.setAttribute('data-config-spec-overlay', '');
    document.body.append(host);

    const movedContainer = overlayContainer.getContainerElement();
    expect(movedContainer).toBe(initialContainer);
    expect(movedContainer.parentElement).toBe(host);
    expect(document.querySelectorAll('.cdk-overlay-container')).toHaveLength(1);
  });

  it('rejects an empty locale during provider creation', () => {
    expect(() => provideKrn({ locale: '   ' })).toThrowError(/non-empty BCP 47/);
    expect(() => provideKrn({ locale: 'not_a_locale' })).toThrowError(/Invalid Kern locale/);
  });

  it('promotes a live nested runtime owner and finally restores prior attributes', () => {
    const document = TestBed.inject(DOCUMENT);
    const root = document.documentElement;
    root.setAttribute('lang', 'fr');
    root.setAttribute('dir', 'ltr');
    root.setAttribute('data-krn-motion', 'full');
    const owner = createEnvironmentInjector(
      [
        provideKrn({
          locale: 'de-DE',
          direction: 'rtl',
          motion: 'reduce',
          persistPreferences: false,
        }),
      ],
      TestBed.inject(EnvironmentInjector),
    );
    const nested = createEnvironmentInjector(
      [
        provideKrn({
          direction: 'ltr',
          motion: 'system',
          persistPreferences: false,
        }),
      ],
      owner,
    );

    try {
      expect(root.getAttribute('lang')).toBe('de-DE');
      expect(root.getAttribute('dir')).toBe('rtl');
      expect(root.getAttribute('data-krn-motion')).toBe('reduce');

      nested.get(KrnI18n).setLocale('ru-RU');
      TestBed.tick();
      expect(root.getAttribute('lang')).toBe('de-DE');

      owner.destroy();
      expect(root.getAttribute('lang')).toBe('ru-RU');
      expect(root.getAttribute('dir')).toBe('ltr');
      expect(root.getAttribute('data-krn-motion')).toBe('system');

      nested.destroy();
    } finally {
      if (!nested.destroyed) nested.destroy();
      if (!owner.destroyed) owner.destroy();
    }

    expect(root.getAttribute('lang')).toBe('fr');
    expect(root.getAttribute('dir')).toBe('ltr');
    expect(root.getAttribute('data-krn-motion')).toBe('full');
  });
});
