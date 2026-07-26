import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, effect, inject, signal } from '@angular/core';
import { KrnThemeService } from '@kern-ui/angular';

export type DocsTheme = 'system' | 'light' | 'dark' | 'contrast';
export type DocsDensity = 'compact' | 'comfortable' | 'spacious';

@Injectable({ providedIn: 'root' })
export class DocsPreferences {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly themeService = inject(KrnThemeService);

  readonly theme = signal<DocsTheme>('system');
  readonly density = signal<DocsDensity>('comfortable');
  readonly direction = signal<'ltr' | 'rtl'>('ltr');
  readonly brand = signal('#4666da');
  readonly mobilePreview = signal(false);
  readonly navigationOpen = signal(false);

  constructor() {
    effect(() => {
      const root = this.document.documentElement;
      const theme = this.theme();
      root.setAttribute('dir', this.direction());
      this.themeService.setTheme(theme === 'contrast' ? 'high-contrast' : theme);
      this.themeService.setDensity(this.density());
      this.themeService.setBrandColor(this.brand());
      if (isPlatformBrowser(this.platformId)) {
        root.style.colorScheme =
          this.theme() === 'dark' ? 'dark' : this.theme() === 'light' ? 'light' : 'light dark';
      }
    });
  }
}
