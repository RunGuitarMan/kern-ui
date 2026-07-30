import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  KERN_CATALOG,
  findKernComponent,
  type KernCatalogItem,
  type KernComponentStatus,
} from '@kern-ui/showcase';
import { findKernAgentExample, type KernAgentExample } from '@kern-ui/showcase/examples';
import { KrnBreadcrumbs, KrnCopyButton, type KrnBreadcrumbItem } from '@kern-ui/angular/kit';

import { ComponentPlayground } from '../playground/component-playground';

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
  imports: [RouterLink, ComponentPlayground, KrnBreadcrumbs, KrnCopyButton],
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

        <kdocs-component-playground
          id="specimen-overview"
          [item]="current"
          [code]="codeExample()"
        />

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
  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });
  protected readonly item = computed(() => findKernComponent(this.params().get('id') ?? ''));
  protected readonly agentExample = computed<KernAgentExample | null>(() => {
    const current = this.item();
    return current ? (findKernAgentExample(current.id) ?? null) : null;
  });
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
  constructor() {
    effect(() => {
      const item = this.item();
      this.title.setTitle(item ? `${item.name} · Kern` : 'Component not found · Kern');
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
    const example = this.agentExample();
    if (!example) {
      throw new Error(`Missing compile-verified example for catalog component "${item.id}".`);
    }
    return example.code;
  }
}
