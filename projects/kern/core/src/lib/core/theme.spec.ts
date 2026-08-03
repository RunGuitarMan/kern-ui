import { DOCUMENT } from '@angular/common';
import {
  Component,
  createEnvironmentInjector,
  EnvironmentInjector,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { KRN_PLATFORM } from '@kern-ui/angular/cdk';
import { generateKrnBrandPalette, KRN_BRAND_STEPS } from '../foundations/brand-color';
import {
  applyKrnPrepaintTheme,
  KrnThemeDirective,
  KrnThemeService,
  KRN_THEME_CONFIG,
  provideKrnTheme,
} from './theme';

@Component({
  imports: [KrnThemeDirective],
  template: `<div data-testid="scope" [krnTheme]="'system'" [krnBrandColor]="brandColor()"></div>`,
})
class ScopedThemeFixture {
  readonly brandColor = signal<string | null>('#4666da');
}

describe('KrnThemeService', () => {
  afterEach(() => {
    const root = TestBed.inject(DOCUMENT).documentElement;
    TestBed.resetTestingModule();
    delete root.dataset['krnTheme'];
    delete root.dataset['krnThemeMode'];
    delete root.dataset['krnDensity'];
    root.removeAttribute('style');
  });

  it('preserves prepaint DOM until explicit initialization has loaded state', () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: KRN_THEME_CONFIG,
          useValue: {
            theme: 'light',
            density: 'compact',
            brandColor: '#4666da',
            persist: false,
          },
        },
        KrnThemeService,
      ],
    });
    const root = TestBed.inject(DOCUMENT).documentElement;
    root.setAttribute('data-krn-theme-mode', 'dark');
    root.setAttribute('data-krn-theme', 'dark');
    root.setAttribute('data-krn-density', 'spacious');
    root.style.setProperty('--krn-color-brand-500', 'rebeccapurple', 'important');

    const service = TestBed.inject(KrnThemeService);
    expect(root.getAttribute('data-krn-theme-mode')).toBe('dark');
    expect(root.getAttribute('data-krn-theme')).toBe('dark');
    expect(root.getAttribute('data-krn-density')).toBe('spacious');
    expect(root.style.getPropertyValue('--krn-color-brand-500')).toBe('rebeccapurple');
    expect(root.style.getPropertyPriority('--krn-color-brand-500')).toBe('important');

    service.initialize();
    expect(root.getAttribute('data-krn-theme-mode')).toBe('light');
    expect(root.getAttribute('data-krn-theme')).toBe('light');
    expect(root.getAttribute('data-krn-density')).toBe('compact');
    expect(root.style.getPropertyValue('--krn-color-brand-500')).toContain('oklch');
  });

  it('applies theme and density at runtime', () => {
    TestBed.configureTestingModule({
      providers: [
        provideKrnTheme({
          theme: 'light',
          density: 'comfortable',
          persist: false,
        }),
      ],
    });
    const service = TestBed.inject(KrnThemeService);
    const root = TestBed.inject(DOCUMENT).documentElement;

    service.setTheme('dark');
    service.setDensity('compact');
    TestBed.tick();

    expect(service.resolvedTheme()).toBe('dark');
    expect(root.dataset['krnTheme']).toBe('dark');
    expect(root.dataset['krnDensity']).toBe('compact');
  });

  it('generates and removes brand properties without accepting invalid input', () => {
    TestBed.configureTestingModule({
      providers: [provideKrnTheme({ persist: false })],
    });
    const service = TestBed.inject(KrnThemeService);
    const root = TestBed.inject(DOCUMENT).documentElement;

    expect(service.setBrandColor('#ef5a32')).toBe(true);
    TestBed.tick();
    expect(root.style.getPropertyValue('--krn-color-brand-500')).toContain('oklch');

    expect(service.setBrandColor('not-a-color')).toBe(false);
    expect(service.brandColor()).toBe('#ef5a32');

    service.setBrandColor(null);
    TestBed.tick();
    expect(root.style.getPropertyValue('--krn-color-brand-500')).toBe('');
  });

  it('updates scoped brand custom properties through the theme directive', () => {
    TestBed.configureTestingModule({
      providers: [provideKrnTheme({ persist: false })],
    });
    const fixture = TestBed.createComponent(ScopedThemeFixture);
    fixture.detectChanges();
    TestBed.tick();
    const scope = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(
      '[data-testid="scope"]',
    );
    const initial = scope?.style.getPropertyValue('--krn-color-brand-500');

    expect(initial).toBe(generateKrnBrandPalette('#4666da')?.[500]);

    fixture.componentInstance.brandColor.set('#d95831');
    TestBed.tick();
    fixture.detectChanges();

    expect(scope?.style.getPropertyValue('--krn-color-brand-500')).toBe(
      generateKrnBrandPalette('#d95831')?.[500],
    );

    fixture.componentInstance.brandColor.set(null);
    TestBed.tick();
    fixture.detectChanges();

    expect(scope?.style.getPropertyValue('--krn-color-brand-500')).toBe('');
  });

  it('initializes without browser globals during SSR', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'server' },
        provideKrnTheme({ theme: 'dark', persist: true }),
      ],
    });

    const service = TestBed.inject(KrnThemeService);
    TestBed.tick();

    expect(service.resolvedTheme()).toBe('dark');
    expect(TestBed.inject(DOCUMENT).documentElement.dataset['krnTheme']).toBe('dark');
  });

  it('applies validated persisted preferences before Angular bootstrap', () => {
    TestBed.configureTestingModule({});
    const document = TestBed.inject(DOCUMENT);
    const storage = {
      getItem: () =>
        JSON.stringify({
          theme: 'dark',
          density: 'compact',
          brandColor: '#ef5a32',
        }),
    };

    const state = applyKrnPrepaintTheme({ document, storage });

    expect(state).toEqual({
      theme: 'dark',
      resolvedTheme: 'dark',
      density: 'compact',
      brandColor: '#ef5a32',
    });
    expect(document.documentElement.dataset['krnThemeMode']).toBe('dark');
    expect(document.documentElement.dataset['krnTheme']).toBe('dark');
    expect(document.documentElement.dataset['krnDensity']).toBe('compact');
    expect(document.documentElement.style.getPropertyValue('--krn-color-brand-500')).toContain(
      'oklch',
    );
  });

  it('falls back safely when prepaint storage is unavailable or invalid', () => {
    TestBed.configureTestingModule({});
    const document = TestBed.inject(DOCUMENT);
    const invalidStorage = {
      getItem: () =>
        JSON.stringify({
          theme: 'unsupported',
          density: 'tiny',
          brandColor: 'not-a-color',
        }),
    };

    const state = applyKrnPrepaintTheme({
      document,
      storage: invalidStorage,
      theme: 'system',
      density: 'spacious',
      systemDark: true,
    });

    expect(state).toEqual({
      theme: 'system',
      resolvedTheme: 'dark',
      density: 'spacious',
      brandColor: null,
    });
    expect(document.documentElement.dataset['krnTheme']).toBe('dark');
    expect(document.documentElement.style.getPropertyValue('--krn-color-brand-500')).toBe('');
  });

  it('promotes a live nested theme owner and finally restores prior attributes and styles', () => {
    const root = TestBed.inject(DOCUMENT).documentElement;
    root.setAttribute('data-krn-theme-mode', 'high-contrast');
    root.setAttribute('data-krn-theme', 'high-contrast');
    root.setAttribute('data-krn-density', 'spacious');
    root.style.setProperty('color-scheme', 'light dark');
    root.style.setProperty('--krn-color-brand-500', 'rebeccapurple', 'important');
    const owner = createEnvironmentInjector(
      [
        provideKrnTheme({
          theme: 'light',
          density: 'compact',
          brandColor: '#4666da',
          persist: false,
        }),
      ],
      TestBed.inject(EnvironmentInjector),
    );
    const ownedBrand = root.style.getPropertyValue('--krn-color-brand-500');
    const nested = createEnvironmentInjector(
      [
        provideKrnTheme({
          theme: 'dark',
          density: 'comfortable',
          brandColor: '#d95831',
          persist: false,
        }),
      ],
      owner,
    );

    try {
      expect(root.getAttribute('data-krn-theme-mode')).toBe('light');
      expect(root.getAttribute('data-krn-theme')).toBe('light');
      expect(root.getAttribute('data-krn-density')).toBe('compact');
      expect(ownedBrand).toContain('oklch');
      expect(root.style.getPropertyValue('--krn-color-brand-500')).toBe(ownedBrand);

      owner.get(KrnThemeService).setBrandColor(null);
      TestBed.tick();
      for (const step of KRN_BRAND_STEPS) {
        expect(root.style.getPropertyValue(`--krn-color-brand-${step}`)).toBe('');
      }

      owner.destroy();
      expect(root.getAttribute('data-krn-theme-mode')).toBe('dark');
      expect(root.getAttribute('data-krn-theme')).toBe('dark');
      expect(root.getAttribute('data-krn-density')).toBe('comfortable');
      expect(root.style.getPropertyValue('--krn-color-brand-500')).toContain('oklch');

      nested.destroy();
    } finally {
      if (!nested.destroyed) nested.destroy();
      if (!owner.destroyed) owner.destroy();
    }

    expect(root.getAttribute('data-krn-theme-mode')).toBe('high-contrast');
    expect(root.getAttribute('data-krn-theme')).toBe('high-contrast');
    expect(root.getAttribute('data-krn-density')).toBe('spacious');
    expect(root.style.getPropertyValue('color-scheme')).toBe('light dark');
    expect(root.style.getPropertyValue('--krn-color-brand-500')).toBe('rebeccapurple');
    expect(root.style.getPropertyPriority('--krn-color-brand-500')).toBe('important');
  });

  it('persists only the active owner and writes dormant state when it is promoted', () => {
    const root = TestBed.inject(DOCUMENT).documentElement;
    root.setAttribute('data-krn-theme-mode', 'system');
    root.setAttribute('data-krn-theme', 'light');
    root.setAttribute('data-krn-density', 'spacious');
    const setItem = vi.fn();
    const removeItem = vi.fn();
    const storage: Storage = {
      length: 0,
      clear: vi.fn(),
      getItem: vi.fn(() => null),
      key: vi.fn(() => null),
      removeItem,
      setItem,
    };
    const platform = {
      ...TestBed.inject(KRN_PLATFORM),
      localStorage: storage,
    };
    const owner = createEnvironmentInjector(
      [
        { provide: KRN_PLATFORM, useValue: platform },
        provideKrnTheme({ theme: 'light', density: 'compact', persist: true }),
      ],
      TestBed.inject(EnvironmentInjector),
    );
    TestBed.tick();
    setItem.mockClear();
    const nested = createEnvironmentInjector(
      [
        provideKrnTheme({
          theme: 'dark',
          density: 'comfortable',
          brandColor: '#d95831',
          persist: true,
        }),
      ],
      owner,
    );

    try {
      expect(setItem).not.toHaveBeenCalled();
      const nestedTheme = nested.get(KrnThemeService);
      nestedTheme.reset();
      expect(removeItem).not.toHaveBeenCalled();
      nestedTheme.setTheme('high-contrast');
      TestBed.tick();
      expect(root.getAttribute('data-krn-theme-mode')).toBe('light');
      expect(root.getAttribute('data-krn-density')).toBe('compact');
      expect(setItem).not.toHaveBeenCalled();

      owner.destroy();
      expect(root.getAttribute('data-krn-theme-mode')).toBe('high-contrast');
      expect(root.getAttribute('data-krn-theme')).toBe('high-contrast');
      expect(root.getAttribute('data-krn-density')).toBe('comfortable');
      expect(setItem).toHaveBeenCalledOnce();
      expect(JSON.parse(setItem.mock.calls[0]?.[1] ?? '{}')).toEqual({
        theme: 'high-contrast',
        density: 'comfortable',
        brandColor: '#d95831',
      });

      nested.destroy();
    } finally {
      if (!nested.destroyed) nested.destroy();
      if (!owner.destroyed) owner.destroy();
    }

    expect(root.getAttribute('data-krn-theme-mode')).toBe('system');
    expect(root.getAttribute('data-krn-theme')).toBe('light');
    expect(root.getAttribute('data-krn-density')).toBe('spacious');
  });
});
