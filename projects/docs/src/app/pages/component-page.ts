import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  KERN_CATALOG,
  findKernComponent,
  type KernCatalogItem,
  type KernComponentStatus,
} from '@kern-ui/showcase';
import {
  KrnBreadcrumbs,
  KrnCodeBlock,
  KrnCopyButton,
  type KrnBreadcrumbItem,
} from '@kern-ui/angular';

import { DocsPreferences } from '../preferences';
import { ComponentSpecimen } from './component-specimen';

const EXAMPLE_MARKUP: Readonly<Record<string, string>> = {
  'app-shell':
    '<krn-app-shell><krn-header>Header</krn-header><krn-sidebar>Navigation</krn-sidebar><main>Content</main></krn-app-shell>',
  header: '<krn-header><span krnHeaderStart>Kern</span>Workspace</krn-header>',
  sidebar: '<krn-sidebar ariaLabel="Workspace navigation">Navigation</krn-sidebar>',
  'navigation-rail':
    '<krn-navigation-rail ariaLabel="Primary navigation">Tools</krn-navigation-rail>',
  container: '<krn-container size="lg">Content</krn-container>',
  stack: '<krn-stack gap="4">Content</krn-stack>',
  inline: '<krn-inline gap="3" wrap>Content</krn-inline>',
  cluster: '<krn-cluster gap="2">Content</krn-cluster>',
  grid: '<krn-grid [columns]="3" gap="4">Content</krn-grid>',
  'split-layout':
    '<krn-split-layout ratio="1:2"><div krnSplitPrimary>Primary</div><div krnSplitSecondary>Secondary</div></krn-split-layout>',
  center: '<krn-center maxWidth="32rem">Content</krn-center>',
  spacer: '<krn-spacer axis="horizontal" size="6" />',
  divider: '<krn-divider label="Next section" />',
  'aspect-ratio': '<krn-aspect-ratio ratio="16 / 9">Media</krn-aspect-ratio>',
  'scroll-area': '<krn-scroll-area maxBlockSize="20rem">Content</krn-scroll-area>',
  'responsive-show-hide':
    '<krn-responsive-show-hide from="md">Desktop content</krn-responsive-show-hide>',
  'resizable-panels':
    '<krn-resizable-panels [sizes]="[40, 60]"><krn-resizable-panel>Navigation</krn-resizable-panel><krn-resize-handle /><krn-resizable-panel>Content</krn-resizable-panel></krn-resizable-panels>',
  button: '<krn-button>Publish changes</krn-button>',
  'icon-button': '<krn-icon-button ariaLabel="Add item">+</krn-icon-button>',
  'button-group':
    '<krn-button-group ariaLabel="Record actions"><krn-button>Save</krn-button><krn-button>Archive</krn-button></krn-button-group>',
  'split-button':
    '<krn-split-button><span krnLabel>Export</span><button krnMenu role="menuitem">CSV</button></krn-split-button>',
  'floating-action-button':
    '<krn-floating-action-button ariaLabel="Create item">Create</krn-floating-action-button>',
  'toggle-button': '<krn-toggle-button value="list">List</krn-toggle-button>',
  'toggle-group':
    '<krn-toggle-group ariaLabel="View mode"><krn-toggle-button value="list">List</krn-toggle-button></krn-toggle-group>',
  'copy-button': '<krn-copy-button value="Copied text">Copy</krn-copy-button>',
  link: '<krn-link href="/dashboard">Dashboard</krn-link>',
  'dropdown-button':
    '<krn-dropdown-button><span krnLabel>Export</span><button krnMenu role="menuitem">CSV</button></krn-dropdown-button>',
  'form-field': '<krn-form-field label="Workspace name"><krn-text-input /></krn-form-field>',
  radio: '<krn-radio value="weekly">Weekly</krn-radio>',
  select: '<krn-select ariaLabel="Plan" [options]="[]" />',
  'native-select': '<krn-native-select ariaLabel="Plan" [options]="[]" />',
  'multi-select': '<krn-multi-select ariaLabel="Teams" [options]="[]" />',
  combobox:
    '<krn-combobox ariaLabel="Workspace plan" placeholder="Filter plans…" [options]="plans" />',
  autocomplete:
    '<krn-autocomplete ariaLabel="Workspace alias" placeholder="Type an alias…" [options]="suggestions" />',
  'segmented-control': '<krn-segmented-control [options]="[]" />',
  'date-range-picker': '<krn-date-range-picker ariaLabel="Reporting period" />',
  'file-upload': '<krn-file-upload label="Choose files" />',
  'drag-drop-upload': '<krn-drag-drop-upload label="Browse files" />',
  'verification-code': '<krn-verification-code label="Verification code" />',
  breadcrumbs: '<krn-breadcrumbs [items]="items" />',
  tabs: '<krn-tabs [items]="tabs">Panel</krn-tabs>',
  'vertical-tabs': '<krn-vertical-tabs [items]="tabs">Panel</krn-vertical-tabs>',
  stepper: '<krn-stepper [steps]="steps" />',
  menu: '<krn-menu [items]="items" />',
  'tree-navigation': '<krn-tree-navigation [items]="items" />',
  'command-palette': '<krn-command-palette [items]="commands" [(open)]="open" />',
  tooltip: '<button type="button" krnTooltip="Helpful detail">Help</button>',
  dialog: '<krn-dialog title="Edit workspace" [(open)]="open">Content</krn-dialog>',
  'alert-dialog':
    '<krn-alert-dialog title="Delete workspace?" [(open)]="open">Content</krn-alert-dialog>',
  drawer: '<krn-drawer title="Activity" [(open)]="open">Content</krn-drawer>',
  'bottom-sheet': '<krn-bottom-sheet title="Actions" [(open)]="open">Content</krn-bottom-sheet>',
  'progress-bar': '<krn-progress-bar [value]="68" />',
  'circular-progress': '<krn-circular-progress [value]="68" [showValue]="true" />',
  stat: '<krn-stat label="Active users" value="2,481" />',
  disclosure: '<krn-disclosure heading="Advanced settings">Content</krn-disclosure>',
  'description-list':
    '<krn-description-list><krn-description-item term="Owner">Avery Cole</krn-description-item></krn-description-list>',
  timeline:
    '<krn-timeline><krn-timeline-item heading="Published">Version 2.4.0</krn-timeline-item></krn-timeline>',
  'data-table': '<krn-data-table ariaLabel="Accounts" [data]="[]" [columns]="[]" />',
  'data-grid': '<krn-data-grid ariaLabel="Accounts" [data]="[]" [columns]="[]" />',
  'code-block': '<krn-code-block language="shell" code="npm install @kern-ui/angular" />',
  'keyboard-shortcut': `<krn-keyboard-shortcut [keys]="['⌘', 'K']" />`,
  meter: '<krn-meter label="Storage used" [value]="68" />',
  'line-chart': '<krn-line-chart title="Weekly usage" [data]="[]" />',
  'bar-chart': '<krn-bar-chart title="Weekly usage" [data]="[]" />',
  'donut-chart': '<krn-donut-chart title="Plan mix" [data]="[]" />',
  'user-menu': '<krn-user-menu name="Avery Cole" />',
  'notification-center': '<krn-notification-center [notifications]="notifications" />',
  'global-search': '<krn-global-search ariaLabel="Search" [results]="results" />',
  'filter-bar': '<krn-filter-bar [filters]="filters" />',
  'page-header': '<krn-page-header heading="Workspace health" />',
  'settings-panel':
    '<krn-settings-panel heading="Settings" [(open)]="open">Content</krn-settings-panel>',
  'crud-toolbar':
    '<krn-crud-toolbar><strong krnToolbarTitle>Workspaces</strong></krn-crud-toolbar>',
  'bulk-actions': '<krn-bulk-actions [selectedCount]="3">Actions</krn-bulk-actions>',
  'master-detail-layout':
    '<krn-master-detail-layout><div krnMaster>List</div><div krnDetail>Detail</div></krn-master-detail-layout>',
  'dashboard-widget': '<krn-dashboard-widget heading="Activation">Content</krn-dashboard-widget>',
  'multi-step-form': '<krn-multi-step-form [steps]="steps">Content</krn-multi-step-form>',
  'mobile-navigation': '<krn-mobile-navigation><a href="/">Home</a></krn-mobile-navigation>',
  'responsive-application-shell':
    '<krn-responsive-application-shell><header krnAppHeader>Header</header><main>Content</main></krn-responsive-application-shell>',
};

const COMPANION_EXAMPLE_SYMBOLS: Readonly<Record<string, readonly string[]>> = {
  'app-shell': ['KrnHeader', 'KrnSidebar'],
  'button-group': ['KrnButton'],
  'toggle-group': ['KrnToggleButton'],
  'form-field': ['KrnTextInput'],
  'resizable-panels': ['KrnResizablePanel', 'KrnResizeHandle'],
  'description-list': ['KrnDescriptionItem'],
  timeline: ['KrnTimelineItem'],
};

const STATUS_DESCRIPTIONS: Readonly<Record<KernComponentStatus, string>> = {
  stable: 'Supported contract; the documented compatibility policy applies.',
  beta: 'Available for controlled production evaluation; the contract may still be refined.',
  experimental: 'Early contract that may change in a pre-1.0 minor release.',
  recipe: 'An adaptable composition rather than a sealed primitive.',
  deprecated: 'Temporarily supported with a documented replacement.',
};

@Component({
  selector: 'kdocs-component-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ComponentSpecimen, KrnBreadcrumbs, KrnCodeBlock, KrnCopyButton],
  template: `
    @if (item(); as current) {
      <article class="page" [attr.data-component-page]="current.id">
        <krn-breadcrumbs [items]="breadcrumbs(current.name)" />

        <header class="component-header">
          <div class="component-identity">
            <p class="eyebrow">
              <span>{{ categoryIndex(current.category) }}</span>
              {{ current.category }}
              <span
                class="status"
                [attr.data-status]="current.status"
                [attr.aria-label]="'Lifecycle status: ' + current.status"
                [attr.title]="statusDescription(current.status)"
              >
                <i aria-hidden="true"></i>{{ current.status }}
              </span>
            </p>
            <h1>{{ current.name }}</h1>
            <p class="summary">{{ current.summary }}</p>
            <p class="status-description">
              <strong>Lifecycle</strong>
              {{ statusDescription(current.status) }}
            </p>
          </div>
          <div class="component-actions">
            @if (current.variantOf) {
              <a class="variant-link" [routerLink]="['/components', current.variantOf]">
                Variant of {{ variantName(current) }}
              </a>
            }
            <div class="selector">
              <code>{{ current.selector }}</code>
              <krn-copy-button [value]="current.selector">Copy</krn-copy-button>
            </div>
          </div>
        </header>

        <nav class="page-nav" aria-label="On this page">
          <a [routerLink]="['/components', current.id]" fragment="specimen-overview">Example</a>
          <a [routerLink]="['/components', current.id]" fragment="specimen-api">API</a>
          <a [routerLink]="['/components', current.id]" fragment="specimen-a11y"> Accessibility </a>
          <a [routerLink]="['/components', current.id]" fragment="specimen-guidance">Guidance</a>
        </nav>

        <section class="workbench" id="specimen-overview" aria-labelledby="example-heading">
          <header class="workbench-toolbar">
            <div>
              <p>Working example</p>
              <h2 id="example-heading">Try {{ current.name }}.</h2>
            </div>
            <div class="toolbar-actions">
              <div class="view-tabs" role="group" aria-label="Example view">
                <button
                  type="button"
                  [attr.aria-pressed]="workbenchTab() === 'preview'"
                  aria-controls="preview-panel"
                  (click)="workbenchTab.set('preview')"
                >
                  Preview
                </button>
                <button
                  type="button"
                  [attr.aria-pressed]="workbenchTab() === 'code'"
                  aria-controls="code-panel"
                  (click)="workbenchTab.set('code')"
                >
                  Code
                </button>
              </div>
              <div class="preview-controls" aria-label="Preview settings">
                <button
                  type="button"
                  (click)="prefs.theme.set(prefs.theme() === 'dark' ? 'light' : 'dark')"
                >
                  {{ prefs.theme() === 'dark' ? 'Light' : 'Dark' }}
                </button>
                <button
                  type="button"
                  (click)="
                    prefs.density.set(prefs.density() === 'compact' ? 'comfortable' : 'compact')
                  "
                >
                  {{ prefs.density() }}
                </button>
                <button type="button" (click)="prefs.direction.update(toggleDirection)">
                  {{ prefs.direction().toUpperCase() }}
                </button>
              </div>
            </div>
          </header>

          <div
            id="preview-panel"
            aria-label="Live component preview"
            [hidden]="workbenchTab() !== 'preview'"
          >
            <kdocs-component-specimen [item]="current" />
          </div>
          <div
            id="code-panel"
            class="code-panel"
            aria-label="Angular code example"
            [hidden]="workbenchTab() !== 'code'"
          >
            <div class="code-intro">
              <div>
                <span>Minimal Angular setup</span>
                <strong>Copy, paste, then adapt.</strong>
              </div>
              <krn-copy-button [value]="codeExample()">Copy example</krn-copy-button>
            </div>
            <krn-code-block language="typescript" [code]="codeExample()" />
          </div>
        </section>

        <section class="reference" aria-labelledby="reference-heading">
          <header class="reference-heading">
            <div>
              <p>Reference</p>
              <h2 id="reference-heading">Everything needed to ship.</h2>
            </div>
            <p>
              API names, kinds, types, required flags, and defaults are generated from runtime
              source. Lifecycle status, behavior, and usage guidance remain curated contracts.
            </p>
          </header>

          <div class="reference-list">
            <details id="specimen-api" open>
              <summary>
                <span>API</span>
                <strong>Generated public contract</strong>
                <small>{{ current.api.length }} entries</small>
              </summary>
              <div class="detail-content">
                <div class="api-table" tabindex="0" aria-label="Scrollable API table">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Kind</th>
                        <th>Type</th>
                        <th>Default</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (row of current.api; track (row.kind ?? 'api') + ':' + row.name) {
                        <tr>
                          <th scope="row">
                            <code>{{ row.name }}</code>
                            @if (row.required) {
                              <span class="required-api">required</span>
                            }
                          </th>
                          <td>
                            <code>{{ row.kind ?? 'input' }}</code>
                          </td>
                          <td>
                            <code>{{ row.type }}</code>
                          </td>
                          <td>
                            <code>{{ row.defaultValue }}</code>
                          </td>
                          <td>{{ row.description }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            </details>

            <details id="specimen-a11y">
              <summary>
                <span>Behavior</span>
                <strong>Keyboard and accessibility</strong>
                <small>{{ current.keyboard.length + current.accessibility.length }} notes</small>
              </summary>
              <div class="detail-content contract-grid">
                <article>
                  <h3>Keyboard contract</h3>
                  <ul>
                    @for (rule of current.keyboard; track rule) {
                      <li><span aria-hidden="true">↳</span>{{ rule }}</li>
                    }
                  </ul>
                </article>
                <article>
                  <h3>Accessibility notes</h3>
                  <ul>
                    @for (note of current.accessibility; track note) {
                      <li><span aria-hidden="true">✓</span>{{ note }}</li>
                    }
                  </ul>
                </article>
              </div>
            </details>

            <details id="specimen-states">
              <summary>
                <span>Quality</span>
                <strong>States to verify</strong>
                <small>{{ current.states.length }} states</small>
              </summary>
              <div class="detail-content">
                <ul class="state-list" aria-label="Required states">
                  @for (state of current.states; track state; let index = $index) {
                    <li>
                      <span>{{ (index + 1).toString().padStart(2, '0') }}</span>
                      <strong>{{ state }}</strong>
                    </li>
                  }
                </ul>
              </div>
            </details>

            <details id="specimen-guidance">
              <summary>
                <span>Guidance</span>
                <strong>When and how to use it</strong>
                <small>Do / don’t</small>
              </summary>
              <div class="detail-content guidance">
                <article class="do">
                  <span>Do</span>
                  <p>{{ current.do }}</p>
                </article>
                <article class="dont">
                  <span>Don’t</span>
                  <p>{{ current.dont }}</p>
                </article>
              </div>
            </details>
          </div>
        </section>

        <nav class="component-pager" aria-label="Adjacent components">
          @if (previousItem(); as previous) {
            <a [routerLink]="['/components', previous.id]">
              <small>← Previous</small>
              <span>{{ previous.name }}</span>
            </a>
          } @else {
            <span></span>
          }
          <strong>{{ positionLabel() }}</strong>
          @if (nextItem(); as next) {
            <a class="next" [routerLink]="['/components', next.id]">
              <small>Next →</small>
              <span>{{ next.name }}</span>
            </a>
          }
        </nav>
      </article>
    } @else {
      <section class="not-found">
        <p>404 / COMPONENT</p>
        <h1>That component is not in the catalog.</h1>
        <a routerLink="/">Return to overview</a>
      </section>
    }
  `,
  styleUrl: './component-page.css',
})
export class ComponentPage {
  private readonly route = inject(ActivatedRoute);
  private readonly title = inject(Title);
  protected readonly prefs = inject(DocsPreferences);
  protected readonly workbenchTab = signal<'preview' | 'code'>('preview');
  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });
  protected readonly item = computed(() => findKernComponent(this.params().get('id') ?? ''));
  private readonly itemIndex = computed(() => {
    const current = this.item();
    return current ? KERN_CATALOG.findIndex((item) => item.id === current.id) : -1;
  });
  protected readonly previousItem = computed(() => KERN_CATALOG[this.itemIndex() - 1]);
  protected readonly nextItem = computed(() => KERN_CATALOG[this.itemIndex() + 1]);
  protected readonly positionLabel = computed(() => {
    const index = this.itemIndex();
    return index < 0 ? '' : `${index + 1} / ${KERN_CATALOG.length}`;
  });
  protected readonly toggleDirection = (value: 'ltr' | 'rtl'): 'ltr' | 'rtl' =>
    value === 'ltr' ? 'rtl' : 'ltr';

  constructor() {
    effect(() => {
      const item = this.item();
      this.title.setTitle(item ? `${item.name} · Kern` : 'Component not found · Kern');
      this.workbenchTab.set('preview');
    });
  }

  protected breadcrumbs(name: string): readonly KrnBreadcrumbItem[] {
    return [
      { label: 'Overview', href: '/' },
      { label: name, current: true },
    ];
  }

  protected categoryIndex(category: string): string {
    return (
      {
        Layout: '02',
        Actions: '03',
        Forms: '04',
        Navigation: '05',
        Feedback: '06',
        'Data display': '07',
        Patterns: '08',
      }[category] ?? '00'
    );
  }

  protected variantName(item: KernCatalogItem): string {
    return findKernComponent(item.variantOf ?? '')?.name ?? item.variantOf ?? '';
  }

  protected statusDescription(status: KernComponentStatus): string {
    return STATUS_DESCRIPTIONS[status];
  }

  protected codeExample(): string {
    const item = this.item();
    if (!item) return '';
    const symbol = `Krn${item.name
      .replace(/[^a-zA-Z0-9]+/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase() + part.slice(1))
      .join('')}`;
    const markup =
      EXAMPLE_MARKUP[item.id] ??
      (item.selector.startsWith('[')
        ? `<button type="button" ${item.selector.slice(1, -1)}="Helpful detail">Help</button>`
        : `<${item.selector}>Content</${item.selector}>`);
    const symbols = [symbol, ...(COMPANION_EXAMPLE_SYMBOLS[item.id] ?? [])];
    return `import { Component } from '@angular/core';
import { ${symbols.join(', ')} } from '@kern-ui/angular';

@Component({
  imports: [${symbols.join(', ')}],
  template: \`${markup}\`,
})
export class ProductView {}`;
  }
}
