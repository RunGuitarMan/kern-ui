import { DOCUMENT } from '@angular/common';
import { OverlayContainer } from '@angular/cdk/overlay';
import { TestBed } from '@angular/core/testing';

import { KRN_OVERLAY_HOST, KRN_PLATFORM } from '@kern-ui/angular/cdk';
import { KRN_CONFIG, KRN_DIRECTION, KRN_LOCALE, KRN_MOTION, provideKrn } from './config';
import { KRN_TRANSLATIONS } from './i18n';

describe('provideKrn', () => {
  const rootAttributes = ['lang', 'dir', 'data-krn-motion', 'data-krn-theme', 'data-krn-density'];

  afterEach(() => {
    const document = TestBed.inject(DOCUMENT);
    for (const attribute of rootAttributes) {
      document.documentElement.removeAttribute(attribute);
    }
    document.documentElement.removeAttribute('style');
    document.querySelector('[data-config-spec-overlay]')?.remove();
    TestBed.resetTestingModule();
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
            dataGrid: {
              empty: 'Keine Daten',
            },
          },
        }),
      ],
    });
    const document = TestBed.inject(DOCUMENT);
    const overlay = document.createElement('div');
    overlay.setAttribute('data-config-spec-overlay', '');
    document.body.append(overlay);

    expect(TestBed.inject(KRN_LOCALE)).toBe('de-DE');
    expect(TestBed.inject(KRN_DIRECTION)).toBe('rtl');
    expect(TestBed.inject(KRN_MOTION)).toBe('reduce');
    const translations = TestBed.inject(KRN_TRANSLATIONS);
    expect(translations.dataGrid.empty).toBe('Keine Daten');
    expect(translations.dataGrid.nextPage).toBe('Next');
    expect(Object.isFrozen(translations.dataGrid)).toBe(true);
    expect(Object.isFrozen(TestBed.inject(KRN_CONFIG))).toBe(true);
    expect(TestBed.inject(KRN_OVERLAY_HOST)()).toBe(overlay);
    expect(document.documentElement.getAttribute('lang')).toBe('de-DE');
    expect(document.documentElement.getAttribute('dir')).toBe('rtl');
    expect(document.documentElement.getAttribute('data-krn-motion')).toBe('reduce');

    TestBed.tick();
    expect(document.documentElement.getAttribute('data-krn-theme')).toBe('dark');
    expect(document.documentElement.getAttribute('data-krn-density')).toBe('compact');
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
});
