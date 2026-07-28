import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { KERN_CATALOG, KERN_COVERAGE } from '@kern-ui/showcase';
import { KrnCodeBlock } from '@kern-ui/angular';

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
  imports: [RouterLink, KrnCodeBlock],
  template: `
    <article class="home">
      <section class="hero" aria-labelledby="home-title">
        <div class="hero-copy">
          <p class="product-mark"><span aria-hidden="true"></span>Kern UI · Angular 22</p>
          <h1 id="home-title">One rhythm. Any product.</h1>
          <p class="hero-summary">
            Accessible Angular components, semantic tokens, and product patterns for teams building
            real application interfaces.
          </p>
          <div class="hero-actions">
            <a class="primary-action" routerLink="/components/button">
              Browse components <span aria-hidden="true">→</span>
            </a>
            <a routerLink="/foundations">Understand the system</a>
          </div>
          <ul class="hero-facts" aria-label="Library coverage">
            <li>
              <strong>{{ coverage.components }}</strong> catalog entries
            </li>
            <li><strong>AA</strong> accessibility target</li>
            <li><strong>4</strong> runtime themes</li>
          </ul>
        </div>

        <aside class="quick-start" aria-labelledby="quick-start-title">
          <header>
            <div>
              <span>Quick start</span>
              <h2 id="quick-start-title">Install. Theme. Build.</h2>
            </div>
            <span class="time">≈ 2 min</span>
          </header>
          <ol>
            <li>
              <span>1</span>
              <div>
                <strong>Install the package</strong>
                <code>npm i @kern-ui/angular @angular/cdk @angular/aria</code>
              </div>
            </li>
            <li>
              <span>2</span>
              <div>
                <strong>Load the shared styles</strong>
                <code>&#64;import '@kern-ui/angular/styles/kern.css';</code>
              </div>
            </li>
            <li>
              <span>3</span>
              <div>
                <strong>Import only what you use</strong>
                <p>Every standalone component can be adopted independently.</p>
              </div>
            </li>
          </ol>
          <krn-code-block
            language="typescript"
            [code]="'import { provideKrn } from \\'@kern-ui/angular\\';\\n\\nexport const appConfig = {\\n  providers: [provideKrn({ theme: \\'system\\', density: \\'comfortable\\' })],\\n};'"
          />
        </aside>
      </section>

      <section class="start-here" aria-labelledby="start-heading">
        <header class="section-heading">
          <div>
            <span>Start here</span>
            <h2 id="start-heading">Choose the shortest path.</h2>
          </div>
          <p>
            Use the library by task. Each component page opens with a working example and copy-ready
            Angular code.
          </p>
        </header>
        <div class="route-grid">
          @for (route of startRoutes; track route.href) {
            <a [routerLink]="route.href">
              <span class="route-index">{{ route.index }}</span>
              <div>
                <small>{{ route.eyebrow }}</small>
                <h3>{{ route.title }}</h3>
                <p>{{ route.description }}</p>
              </div>
              <strong>{{ route.cta }} <span aria-hidden="true">↗</span></strong>
            </a>
          }
        </div>
      </section>

      <section class="popular" aria-labelledby="popular-heading">
        <header class="section-heading">
          <div>
            <span>Common building blocks</span>
            <h2 id="popular-heading">Go straight to the component.</h2>
          </div>
          <p>
            These routes cover the most common product work: actions, forms, overlays, data, and
            responsive application structure.
          </p>
        </header>
        <nav class="component-links" aria-label="Popular components">
          @for (item of featured; track item.id; let index = $index) {
            <a [routerLink]="['/components', item.id]">
              <span>{{ (index + 1).toString().padStart(2, '0') }}</span>
              <div>
                <strong>{{ item.name }}</strong>
                <small>{{ item.category }}</small>
              </div>
              <span aria-hidden="true">→</span>
            </a>
          }
        </nav>
      </section>

      <section class="preferences" aria-labelledby="preferences-heading">
        <div>
          <span>Documentation preview</span>
          <h2 id="preferences-heading">Make the examples match your product context.</h2>
          <p>
            These controls update every live specimen in the documentation. They do not change the
            public API examples.
          </p>
        </div>
        <div class="preference-panel">
          <fieldset>
            <legend>Theme</legend>
            <div class="segmented">
              @for (theme of themes; track theme) {
                <button
                  type="button"
                  [attr.aria-pressed]="prefs.theme() === theme"
                  (click)="prefs.theme.set(theme)"
                >
                  {{ theme === 'contrast' ? 'High contrast' : titleCase(theme) }}
                </button>
              }
            </div>
          </fieldset>
          <label>
            <span>Density</span>
            <select [value]="prefs.density()" (change)="setDensity($event)">
              @for (density of densities; track density) {
                <option [value]="density">{{ titleCase(density) }}</option>
              }
            </select>
          </label>
          <button
            class="direction-control"
            type="button"
            [attr.aria-pressed]="prefs.direction() === 'rtl'"
            (click)="prefs.direction.update(toggleDirection)"
          >
            <span>Direction</span>
            <strong>{{ prefs.direction().toUpperCase() }}</strong>
          </button>
          <a routerLink="/accessibility"
            >Accessibility guidance <span aria-hidden="true">→</span></a
          >
        </div>
      </section>
    </article>
  `,
  styleUrl: './home.css',
})
export class HomePage {
  protected readonly prefs = inject(DocsPreferences);
  protected readonly coverage = KERN_COVERAGE;
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
    .map((id) => KERN_CATALOG.find((item) => item.id === id))
    .filter((item): item is (typeof KERN_CATALOG)[number] => Boolean(item));

  protected setDensity(event: Event): void {
    this.prefs.density.set((event.currentTarget as HTMLSelectElement).value as DocsDensity);
  }

  protected titleCase(value: string): string {
    return value[0]?.toUpperCase() + value.slice(1);
  }
}
