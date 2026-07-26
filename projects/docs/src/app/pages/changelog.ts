import { ChangeDetectionStrategy, Component } from '@angular/core';
import { KrnBadge, KrnPageHeader } from '@kern-ui/angular';

@Component({
  selector: 'kdocs-changelog-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [KrnBadge, KrnPageHeader],
  template: `
    <article class="page">
      <krn-page-header
        index="10"
        eyebrow="Changelog"
        heading="Every release, clearly documented."
        description="Kern follows semantic versioning. Accessibility regressions and public API changes are documented as product changes, not hidden as implementation details."
      >
        <krn-badge tone="brand">0.1.0</krn-badge>
      </krn-page-header>

      <section class="release">
        <aside>
          <strong>0.1.0</strong>
          <time datetime="2026-07-26">26 July 2026</time>
          <krn-badge status tone="success">Initial release</krn-badge>
        </aside>
        <div>
          <h2>Foundation release</h2>
          @for (group of groups; track group.title) {
            <section>
              <h3>{{ group.title }}</h3>
              <ul>
                @for (item of group.items; track item) {
                  <li>{{ item }}</li>
                }
              </ul>
            </section>
          }
        </div>
      </section>
    </article>
  `,
  styles: `
    :host {
      display: block;
    }
    .page {
      max-inline-size: var(--docs-content-max);
      margin-inline: auto;
      padding-inline: clamp(1rem, 4vw, 3rem);
    }
    krn-page-header {
      container-type: inline-size;
    }
    .release {
      display: grid;
      grid-template-columns: minmax(12rem, 0.28fr) minmax(0, 1fr);
      gap: clamp(2rem, 6vw, 5rem);
      padding-block: clamp(2.75rem, 6vw, 4.5rem);
    }
    aside {
      display: flex;
      align-items: start;
      flex-direction: column;
      gap: 0.75rem;
      padding-inline-end: 1.5rem;
      border-inline-end: 1px solid var(--krn-color-border-subtle);
    }
    aside strong {
      font: 600 1.5rem/1 var(--krn-font-family-mono);
    }
    time {
      color: var(--krn-color-text-muted);
    }
    .release > div {
      display: grid;
      gap: 2rem;
    }
    .release > div > h2 {
      margin: 0;
      font-size: clamp(1.75rem, 3vw, 2.5rem);
      font-weight: 600;
      letter-spacing: -0.035em;
    }
    .release section {
      display: grid;
      grid-template-columns: 10rem minmax(0, 1fr);
      gap: 1rem;
      padding-block-start: 1.5rem;
      border-block-start: 1px solid var(--krn-color-border-subtle);
    }
    h3 {
      margin: 0;
      font-size: 0.75rem;
      font-weight: 550;
    }
    ul {
      display: grid;
      gap: 0.75rem;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    li {
      position: relative;
      padding-inline-start: 1.25rem;
      color: var(--krn-color-text-muted);
    }
    li::before {
      position: absolute;
      inset-inline-start: 0;
      color: var(--krn-color-primary);
      content: '↳';
    }
    @media (max-width: 42rem) {
      .release,
      .release section {
        grid-template-columns: 1fr;
      }
      aside {
        padding-block-end: 1.5rem;
        padding-inline-end: 0;
        border-block-end: 1px solid var(--krn-color-border-subtle);
        border-inline-end: 0;
      }
    }
  `,
})
export class ChangelogPage {
  protected readonly groups = [
    {
      title: 'Foundations',
      items: [
        'Light, dark, system, and high-contrast themes with runtime brand generation.',
        'Compact, comfortable, and spacious density scales.',
        'Typed CSS/TypeScript token contract, RTL, reduced motion, and forced-colors support.',
      ],
    },
    {
      title: 'Components',
      items: [
        'Layout, actions, forms, navigation, overlays, feedback, and data-display families.',
        'Accessible SVG line, bar, and donut chart primitives with data-table fallback.',
        'Sortable, filterable, selectable, expandable, resizable, paginated, and virtualized data grid.',
      ],
    },
    {
      title: 'Tooling',
      items: [
        'Zoneless Angular 22 workspace with strict TypeScript and standalone components.',
        'Vitest unit coverage plus Playwright accessibility, responsive, keyboard, and visual projects.',
        'SSR documentation application and deterministic component laboratory.',
      ],
    },
  ] as const;
}
