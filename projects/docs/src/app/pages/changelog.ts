import { ChangeDetectionStrategy, Component } from '@angular/core';
import { KrnBadge } from '@kern-ui/angular/kit';
import { KrnPageHeader } from '@kern-ui/angular/patterns';

import {
  KERN_DOCS_RELEASE_HEADING,
  KERN_DOCS_RELEASE_STATE_LABEL,
  KERN_DOCS_RELEASE_TITLE,
  KERN_DOCS_VERSION,
  KERN_DOCS_VERSION_LABEL,
} from '../release-identity';

@Component({
  selector: 'kdocs-changelog-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [KrnBadge, KrnPageHeader],
  templateUrl: './changelog.html',
  styleUrl: './changelog.css',
})
export class ChangelogPage {
  protected readonly docsVersion = KERN_DOCS_VERSION;
  protected readonly docsVersionLabel = KERN_DOCS_VERSION_LABEL;
  protected readonly docsReleaseStateLabel = KERN_DOCS_RELEASE_STATE_LABEL;
  protected readonly docsReleaseHeading = KERN_DOCS_RELEASE_HEADING;
  protected readonly docsReleaseTitle = KERN_DOCS_RELEASE_TITLE;
  protected readonly groups = [
    {
      title: 'Foundations',
      items: [
        'Light, dark, system, and high-contrast themes with runtime brand generation.',
        'Compact, comfortable, and spacious density scales.',
        'Typed tokens, application configuration, English UI-copy overrides, RTL, motion, and forced-color foundations.',
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
        'SSR documentation application with an integrated deterministic component playground.',
        'Idempotent installation/doctor schematics and a public CDK component-harness entry point.',
        'Generated runtime API metadata with curated lifecycle status for every catalog entry.',
      ],
    },
  ] as const;
}
