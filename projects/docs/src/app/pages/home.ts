import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { KERN_CATALOG_INDEX } from '@kern-ui/showcase/catalog-index';

import { DocsPreferences, type DocsDensity, type DocsTheme } from '../preferences';
import { DocsI18n } from '../docs-i18n';

interface StartRoute {
  readonly index: string;
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly href: string;
  readonly cta: string;
}

@Component({
  selector: 'kdocs-home-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomePage {
  protected readonly prefs = inject(DocsPreferences);
  protected readonly i18n = inject(DocsI18n);
  protected readonly coverage = { components: KERN_CATALOG_INDEX.length } as const;
  protected readonly providerSetup = `import { provideKrn } from '@kern-ui/angular/core';

export const appConfig = {
  providers: [provideKrn({ theme: 'system', density: 'comfortable' })],
};`;
  protected readonly themes: readonly DocsTheme[] = ['system', 'light', 'dark', 'contrast'];
  protected readonly densities: readonly DocsDensity[] = ['compact', 'comfortable', 'spacious'];
  protected readonly toggleDirection = (value: 'ltr' | 'rtl'): 'ltr' | 'rtl' =>
    value === 'ltr' ? 'rtl' : 'ltr';

  protected readonly startRoutes = computed<readonly StartRoute[]>(() => [
    {
      index: '01',
      eyebrow: this.i18n.t('shell.foundations', 'Foundations'),
      title: this.i18n.t('home.routeFoundationsTitle', 'Adopt tokens and themes'),
      description: this.i18n.t(
        'home.routeFoundationsDescription',
        'Color, type, spacing, density, motion, and runtime theme contracts.',
      ),
      href: '/foundations',
      cta: this.i18n.t('home.routeFoundationsCta', 'Open foundations'),
    },
    {
      index: '02',
      eyebrow: this.i18n.t('shell.components', 'Components'),
      title: this.i18n.t('home.routeComponentsTitle', 'Build an interaction'),
      description: this.i18n.t(
        'home.routeComponentsDescription',
        'Start with a focused live example, then copy the minimal Angular setup.',
      ),
      href: '/components/button',
      cta: this.i18n.t('home.routeComponentsCta', 'Browse components'),
    },
    {
      index: '03',
      eyebrow: this.i18n.t('shell.patterns', 'Patterns'),
      title: this.i18n.t('home.routePatternsTitle', 'Compose a product flow'),
      description: this.i18n.t(
        'home.routePatternsDescription',
        'Adaptable recipes for forms, settings, navigation, and data-heavy screens.',
      ),
      href: '/patterns',
      cta: this.i18n.t('home.routePatternsCta', 'View patterns'),
    },
  ]);

  protected readonly featured = [
    'button',
    'text-input',
    'select',
    'dialog',
    'data-grid',
    'responsive-application-shell',
  ]
    .map((id) => KERN_CATALOG_INDEX.find((item) => item.id === id))
    .filter((item): item is (typeof KERN_CATALOG_INDEX)[number] => Boolean(item));

  protected setDensity(event: Event): void {
    this.prefs.density.set((event.currentTarget as HTMLSelectElement).value as DocsDensity);
  }

  protected titleCase(value: string): string {
    return this.i18n.term(value[0]?.toUpperCase() + value.slice(1));
  }
}
