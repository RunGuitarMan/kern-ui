import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { findKernComponent } from '@kern-ui/showcase';
import { findKernAgentExample } from '@kern-ui/showcase/examples';

import { ComponentPlayground } from '../playground/component-playground';

@Component({
  selector: 'kdocs-preview-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ComponentPlayground],
  template: `
    <main class="preview-page" data-testid="docs-preview-root">
      @if (item(); as current) {
        <header class="preview-header">
          <a [routerLink]="['/components', current.id]" aria-label="Return to component docs"
            >KERN</a
          >
          <div>
            <span>Docs / deterministic preview</span>
            <strong>{{ current.name }}</strong>
          </div>
          <code>&lt;{{ current.selector }}&gt;</code>
        </header>
        <kdocs-component-playground [item]="current" [code]="codeExample()" [isolated]="true" />
      } @else {
        <section class="preview-not-found">
          <span>404 / PREVIEW</span>
          <h1>Unknown component fixture.</h1>
          <a routerLink="/">Return to documentation</a>
        </section>
      }
    </main>
  `,
  styleUrl: './preview-page.css',
})
export class PreviewPage {
  private readonly route = inject(ActivatedRoute);
  private readonly title = inject(Title);
  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });

  protected readonly item = computed(() => findKernComponent(this.params().get('id') ?? ''));
  protected readonly codeExample = computed(() => {
    const current = this.item();
    if (!current) return '';
    const example = findKernAgentExample(current.id);
    if (!example) {
      throw new Error(`Missing compile-verified example for catalog component "${current.id}".`);
    }
    return example.code;
  });

  constructor() {
    effect(() => {
      const current = this.item();
      this.title.setTitle(current ? `${current.name} preview · Kern` : 'Preview not found · Kern');
    });
  }
}
