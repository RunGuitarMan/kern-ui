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
  templateUrl: './component-page.html',
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
