import { DOCUMENT } from '@angular/common';
import { provideRouter, Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { provideKrnTheme } from '@kern-ui/angular/core';

import { App } from './app';

describe('Kern QA Lab', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        provideKrnTheme({
          theme: 'light',
          density: 'comfortable',
          persist: false,
        }),
      ],
    }).compileComponents();
  });

  it('renders the deterministic specimen and complete catalog', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('[data-testid="specimen-stage"]')).toBeTruthy();
    expect(root.querySelectorAll('[data-testid^="catalog-item-"]').length).toBeGreaterThan(100);
    expect(root.querySelector('[data-testid="specimen-button"]')).toBeTruthy();
    expect(
      (root.querySelector('[data-testid="component-control"]') as HTMLSelectElement).value,
    ).toBe('button');
    expect((root.querySelector('[data-testid="density-control"]') as HTMLSelectElement).value).toBe(
      'comfortable',
    );
  });

  it('hydrates state from the supported query parameters', async () => {
    const router = TestBed.inject(Router);
    await router.navigate([], {
      queryParams: {
        component: 'data-grid',
        scenario: 'stress',
        theme: 'dark',
        density: 'compact',
        direction: 'rtl',
        locale: 'ru-RU',
      },
    });

    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.getAttribute('dir')).toBe('rtl');
    expect(root.getAttribute('data-theme')).toBe('dark');
    expect(root.getAttribute('data-density')).toBe('compact');
    expect(root.getAttribute('data-scenario')).toBe('stress');
    expect((root.querySelector('[data-testid="locale-control"]') as HTMLSelectElement).value).toBe(
      'ru-RU',
    );
    expect(root.querySelector('[data-testid="specimen-data-grid"]')).toBeTruthy();
    expect(
      (root.querySelector('[data-testid="component-control"]') as HTMLSelectElement).value,
    ).toBe('data-grid');
    expect(TestBed.inject(DOCUMENT).documentElement.dir).toBe('rtl');
    expect(TestBed.inject(DOCUMENT).documentElement.lang).toBe('ru-RU');
  });

  it('falls back to canonical values for unsupported query parameters', async () => {
    const router = TestBed.inject(Router);
    await router.navigate([], {
      queryParams: {
        component: 'unknown',
        scenario: 'random',
        theme: 'ultraviolet',
        density: 'tiny',
        direction: 'up',
        locale: 'invalid',
      },
    });

    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.getAttribute('dir')).toBe('ltr');
    expect(root.getAttribute('data-theme')).toBe('light');
    expect(root.getAttribute('data-density')).toBe('comfortable');
    expect(root.getAttribute('data-scenario')).toBe('default');
    expect((root.querySelector('[data-testid="locale-control"]') as HTMLSelectElement).value).toBe(
      'en-US',
    );
    expect(root.querySelector('[data-testid="specimen-button"]')).toBeTruthy();
  });
});
