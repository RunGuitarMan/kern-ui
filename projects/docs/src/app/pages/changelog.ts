import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { KrnBadge } from '@kern-ui/angular/kit';
import { KrnPageHeader } from '@kern-ui/angular/patterns';

import {
  KERN_DOCS_RELEASE_HEADING,
  KERN_DOCS_RELEASE_STATE_LABEL,
  KERN_DOCS_RELEASE_TITLE,
  KERN_DOCS_VERSION,
  KERN_DOCS_VERSION_LABEL,
} from '../release-identity';
import { DocsI18n } from '../docs-i18n';

@Component({
  selector: 'kdocs-changelog-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [KrnBadge, KrnPageHeader],
  templateUrl: './changelog.html',
  styleUrl: './changelog.css',
})
export class ChangelogPage {
  protected readonly i18n = inject(DocsI18n);
  protected readonly docsVersion = KERN_DOCS_VERSION;
  protected readonly docsVersionLabel = KERN_DOCS_VERSION_LABEL;
  protected readonly docsReleaseStateLabel = KERN_DOCS_RELEASE_STATE_LABEL;
  protected readonly docsReleaseHeading = KERN_DOCS_RELEASE_HEADING;
  protected readonly docsReleaseTitle = KERN_DOCS_RELEASE_TITLE;
  protected readonly groups = computed(
    () =>
      [
        {
          title: this.i18n.t('shell.foundations', 'Foundations'),
          items: [
            this.i18n.t(
              'changelog.foundationThemes',
              'Light, dark, system, and high-contrast themes with runtime brand generation.',
            ),
            this.i18n.t(
              'changelog.foundationDensity',
              'Compact, comfortable, and spacious density scales.',
            ),
            this.i18n.t(
              'changelog.foundationTokens',
              'Typed tokens, application configuration, English UI-copy overrides, RTL, motion, and forced-color foundations.',
            ),
          ],
        },
        {
          title: this.i18n.t('shell.components', 'Components'),
          items: [
            this.i18n.t(
              'changelog.componentFamilies',
              'Layout, actions, forms, navigation, overlays, feedback, and data-display families.',
            ),
            this.i18n.t(
              'changelog.componentCharts',
              'Accessible SVG line, bar, and donut chart primitives with data-table fallback.',
            ),
            this.i18n.t(
              'changelog.componentGrid',
              'Sortable, filterable, selectable, expandable, resizable, paginated, and virtualized data grid.',
            ),
          ],
        },
        {
          title: this.i18n.t('changelog.tooling', 'Tooling'),
          items: [
            this.i18n.t(
              'changelog.toolingAngular',
              'Zoneless Angular 22 workspace with strict TypeScript and standalone components.',
            ),
            this.i18n.t(
              'changelog.toolingTests',
              'Vitest unit coverage plus Playwright accessibility, responsive, keyboard, and visual projects.',
            ),
            this.i18n.t(
              'changelog.toolingSsr',
              'SSR documentation application with an integrated deterministic component playground.',
            ),
            this.i18n.t(
              'changelog.toolingSchematics',
              'Idempotent installation/doctor schematics and a public CDK component-harness entry point.',
            ),
            this.i18n.t(
              'changelog.toolingMetadata',
              'Generated runtime API metadata with curated lifecycle status for every catalog entry.',
            ),
          ],
        },
      ] as const,
  );
}
