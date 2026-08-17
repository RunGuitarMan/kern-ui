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
import { DocsI18n } from '../docs-i18n';
import { DataGridExamples } from './data-grid-examples';

@Component({
  selector: 'kdocs-component-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ComponentPlayground, DataGridExamples, KrnBreadcrumbs, KrnCopyButton],
  templateUrl: './component-page.html',
  styleUrl: './component-page.css',
})
export class ComponentPage {
  private readonly route = inject(ActivatedRoute);
  private readonly title = inject(Title);
  protected readonly i18n = inject(DocsI18n);
  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });
  private readonly sourceItem = computed(() => findKernComponent(this.params().get('id') ?? ''));
  protected readonly item = computed(() => {
    const item = this.sourceItem();
    return item ? this.i18n.catalogItem(item) : undefined;
  });
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
      this.title.setTitle(
        item
          ? `${item.name} · Kern`
          : `${this.i18n.t('component.notFound', 'Component not found')} · Kern`,
      );
    });
  }

  protected breadcrumbs(name: string): readonly KrnBreadcrumbItem[] {
    return [
      { label: this.i18n.t('shell.overview', 'Overview'), href: '/' },
      { label: name, current: true },
    ];
  }

  protected variantName(item: KernCatalogItem): string {
    const variant = findKernComponent(item.variantOf ?? '');
    return variant ? this.i18n.componentName(variant) : (item.variantOf ?? '');
  }

  protected statusDescription(status: KernComponentStatus): string {
    return this.i18n.statusDescription(status);
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
