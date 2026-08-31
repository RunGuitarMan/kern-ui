import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  findKernComponent,
  type KernCatalogItem,
  type KernComponentStatus,
} from '@kern-ui/showcase';
import { findKernAgentExample, type KernAgentExample } from '@kern-ui/showcase/examples';
import {
  KERN_CANONICAL_CATALOG_INDEX,
  canonicalCatalogId,
  catalogAliasesFor,
  catalogFamilyFor,
} from '@kern-ui/showcase/catalog-index';
import { KrnBreadcrumbs, KrnCopyButton, type KrnBreadcrumbItem } from '@kern-ui/angular/kit';

import { ComponentPlayground } from '../playground/component-playground';
import { DocsI18n } from '../docs-i18n';
import { DataGridExamples } from './data-grid-examples';

interface CatalogFamilyMemberView {
  readonly id: string;
  readonly role: string;
  readonly migration?: string;
  readonly item: KernCatalogItem;
}

interface CatalogFamilyView {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly members: readonly CatalogFamilyMemberView[];
}

const CANONICAL_CATALOG: readonly KernCatalogItem[] = KERN_CANONICAL_CATALOG_INDEX.map((item) =>
  findKernComponent(item.id),
).filter((item): item is KernCatalogItem => item !== undefined);

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
  private readonly sourceItem = computed(() =>
    findKernComponent(canonicalCatalogId(this.params().get('id') ?? '')),
  );
  protected readonly item = computed(() => {
    const item = this.sourceItem();
    return item ? this.i18n.catalogItem(item) : undefined;
  });
  protected readonly aliases = computed<readonly KernCatalogItem[]>(() => {
    const current = this.sourceItem();
    if (!current) return [];
    return catalogAliasesFor(current.id)
      .map((alias) => findKernComponent(alias.id))
      .filter((alias): alias is KernCatalogItem => alias !== undefined)
      .map((alias) => this.i18n.catalogItem(alias));
  });
  protected readonly family = computed<CatalogFamilyView | null>(() => {
    const current = this.sourceItem();
    const sourceFamily = current ? catalogFamilyFor(current.id) : undefined;
    if (!sourceFamily) return null;
    const family = this.i18n.catalogFamily(sourceFamily);
    return {
      ...family,
      members: family.members
        .map((member) => {
          const source = findKernComponent(member.id);
          return source
            ? {
                ...member,
                item: this.i18n.catalogItem(source),
              }
            : undefined;
        })
        .filter((member): member is CatalogFamilyMemberView => member !== undefined),
    };
  });
  protected readonly hasTaxonomy = computed(
    () => this.family() !== null || this.aliases().length > 0,
  );
  protected readonly agentExample = computed<KernAgentExample | null>(() => {
    const current = this.item();
    return current ? (findKernAgentExample(current.id) ?? null) : null;
  });
  private readonly itemIndex = computed(() => {
    const current = this.item();
    return current ? CANONICAL_CATALOG.findIndex((item) => item.id === current.id) : -1;
  });
  protected readonly previousItem = computed(() => CANONICAL_CATALOG[this.itemIndex() - 1]);
  protected readonly nextItem = computed(() => CANONICAL_CATALOG[this.itemIndex() + 1]);
  protected readonly positionLabel = computed(() => {
    const index = this.itemIndex();
    return index < 0 ? '' : `${index + 1} / ${CANONICAL_CATALOG.length}`;
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
