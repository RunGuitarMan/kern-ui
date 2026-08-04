import { createEnvironmentInjector, EnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';

const attributes = [
  'lang',
  'dir',
  'data-krn-motion',
  'data-krn-theme-mode',
  'data-krn-theme',
  'data-krn-density',
] as const;

describe('document state ownership', () => {
  it('coordinates html preferences between independently evaluated Kern bundle copies', async () => {
    TestBed.configureTestingModule({});
    const root = document.documentElement;
    const originalAttributes = new Map(
      attributes.map((name) => [name, root.getAttribute(name)] as const),
    );
    const originalStyle = root.getAttribute('style');
    const firstBundle = await import('./config');
    vi.resetModules();
    const secondBundle = await import('./config');
    const parent = TestBed.inject(EnvironmentInjector);
    const firstOwner = createEnvironmentInjector(
      [
        firstBundle.provideKrn({
          locale: 'de-DE',
          direction: 'rtl',
          motion: 'reduce',
          theme: 'dark',
          density: 'compact',
          persistPreferences: false,
        }),
      ],
      parent,
    );
    const secondOwner = createEnvironmentInjector(
      [
        secondBundle.provideKrn({
          locale: 'en-US',
          direction: 'ltr',
          motion: 'full',
          theme: 'light',
          density: 'spacious',
          persistPreferences: false,
        }),
      ],
      parent,
    );

    expect(secondBundle.provideKrn).not.toBe(firstBundle.provideKrn);

    try {
      expect(root.getAttribute('lang')).toBe('de-DE');
      expect(root.getAttribute('dir')).toBe('rtl');
      expect(root.getAttribute('data-krn-motion')).toBe('reduce');
      expect(root.getAttribute('data-krn-theme')).toBe('dark');
      expect(root.getAttribute('data-krn-density')).toBe('compact');

      firstOwner.destroy();

      expect(root.getAttribute('lang')).toBe('en-US');
      expect(root.getAttribute('dir')).toBe('ltr');
      expect(root.getAttribute('data-krn-motion')).toBe('full');
      expect(root.getAttribute('data-krn-theme')).toBe('light');
      expect(root.getAttribute('data-krn-density')).toBe('spacious');

      secondOwner.destroy();

      for (const name of attributes) {
        expect(root.getAttribute(name)).toBe(originalAttributes.get(name) ?? null);
      }
      expect(root.getAttribute('style')).toBe(originalStyle);
    } finally {
      if (!firstOwner.destroyed) firstOwner.destroy();
      if (!secondOwner.destroyed) secondOwner.destroy();
      for (const [name, value] of originalAttributes) {
        if (value === null) root.removeAttribute(name);
        else root.setAttribute(name, value);
      }
      if (originalStyle === null) root.removeAttribute('style');
      else root.setAttribute('style', originalStyle);
    }
  });
});
