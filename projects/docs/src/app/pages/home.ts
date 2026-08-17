import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { KERN_CATALOG_INDEX } from '@kern-ui/showcase/catalog-index';

import { DocsPreferences, type DocsDensity, type DocsTheme } from '../preferences';

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
  protected readonly coverage = { components: KERN_CATALOG_INDEX.length } as const;
  protected readonly providerSetup = `import { provideKrn } from '@kern-ui/angular/core';

export const appConfig = {
  providers: [provideKrn({ theme: 'system', density: 'comfortable' })],
};`;
  protected readonly themes: readonly DocsTheme[] = ['system', 'light', 'dark', 'contrast'];
  protected readonly densities: readonly DocsDensity[] = ['compact', 'comfortable', 'spacious'];
  protected readonly toggleDirection = (value: 'ltr' | 'rtl'): 'ltr' | 'rtl' =>
    value === 'ltr' ? 'rtl' : 'ltr';

  protected readonly startRoutes: readonly StartRoute[] = [
    {
      index: '01',
      eyebrow: 'Foundations',
      title: 'Adopt tokens and themes',
      description: 'Color, type, spacing, density, motion, and runtime theme contracts.',
      href: '/foundations',
      cta: 'Open foundations',
    },
    {
      index: '02',
      eyebrow: 'Components',
      title: 'Build an interaction',
      description: 'Start with a focused live example, then copy the minimal Angular setup.',
      href: '/components/button',
      cta: 'Browse components',
    },
    {
      index: '03',
      eyebrow: 'Patterns',
      title: 'Compose a product flow',
      description: 'Adaptable recipes for forms, settings, navigation, and data-heavy screens.',
      href: '/patterns',
      cta: 'View patterns',
    },
  ];

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
    return value[0]?.toUpperCase() + value.slice(1);
  }
}
