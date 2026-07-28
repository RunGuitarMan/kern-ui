import { DOCUMENT } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { applyKrnPrepaintTheme, provideKrnTheme, KrnThemeService } from './theme';

describe('KrnThemeService', () => {
  afterEach(() => {
    const root = TestBed.inject(DOCUMENT).documentElement;
    delete root.dataset['krnTheme'];
    delete root.dataset['krnThemeMode'];
    delete root.dataset['krnDensity'];
    root.removeAttribute('style');
    TestBed.resetTestingModule();
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
});
