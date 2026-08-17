import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { KrnThemeService } from '@kern-ui/angular/core';

export type DocsTheme = 'system' | 'light' | 'dark' | 'contrast';
export type DocsBaseTheme = Exclude<DocsTheme, 'contrast'>;
export type DocsDensity = 'compact' | 'comfortable' | 'spacious';
export type DocsLocale = 'en-US' | 'ru-RU';
export type DocsMotion = 'system' | 'reduce' | 'full';
export type DocsViewport = 'responsive' | 'phone' | 'tablet';

@Injectable({ providedIn: 'root' })
export class DocsPreferences {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly themeService = inject(KrnThemeService);

  readonly theme = signal<DocsTheme>('system');
  readonly highContrast = signal(false);
  readonly density = signal<DocsDensity>('comfortable');
  readonly direction = signal<'ltr' | 'rtl'>('ltr');
  readonly locale = signal<DocsLocale>('en-US');
  readonly motion = signal<DocsMotion>('system');
  readonly brand = signal('#4666da');
  readonly viewport = signal<DocsViewport>('responsive');
  readonly mobilePreview = signal(false);
  readonly navigationOpen = signal(false);
  readonly baseTheme = computed<DocsBaseTheme>(() => {
    const theme = this.theme();
    return theme === 'contrast' ? 'system' : theme;
  });
  readonly contrastMode = computed(() => this.highContrast() || this.theme() === 'contrast');
  readonly appliedTheme = computed(() =>
    this.contrastMode() ? ('high-contrast' as const) : this.baseTheme(),
  );
  readonly colorScheme = computed(() => {
    const theme = this.baseTheme();
    return theme === 'dark' ? 'dark' : theme === 'light' ? 'light' : 'light dark';
  });

  constructor() {
    effect(() => {
      const root = this.document.documentElement;
      root.setAttribute('dir', this.direction());
      root.setAttribute('lang', this.locale());
      root.setAttribute('data-krn-motion', this.motion());
      root.setAttribute('data-krn-contrast-scheme', this.baseTheme());
      this.themeService.setTheme(this.appliedTheme());
      this.themeService.setDensity(this.density());
      this.themeService.setBrandColor(this.brand());
      if (isPlatformBrowser(this.platformId)) {
        root.style.colorScheme = this.colorScheme();
      }
    });
  }
}
