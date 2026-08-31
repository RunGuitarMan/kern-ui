import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  numberAttribute,
  output,
  signal,
} from '@angular/core';
import { KRN_TRANSLATIONS } from '@kern-ui/angular/core';
import type { KrnBreadcrumbItem } from './navigation.types';

interface VisibleBreadcrumb extends KrnBreadcrumbItem {
  readonly source: KrnBreadcrumbItem;
  readonly index: number;
  readonly ellipsis?: true;
}

const DEFAULT_MAX_ITEMS = 5;

@Component({
  selector: 'krn-breadcrumbs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './breadcrumbs.html',
  styleUrl: './breadcrumbs.css',
})
export class KrnBreadcrumbs {
  private readonly translations = inject(KRN_TRANSLATIONS);
  readonly items = input<readonly KrnBreadcrumbItem[]>([]);
  readonly maxItems = input(5, { transform: numberAttribute });
  readonly separator = input('›');
  readonly ariaLabel = input<string | undefined>();
  readonly moreLabel = input<string | undefined>();
  readonly showAllLabel = input<string | undefined>();
  readonly itemActivated = output<KrnBreadcrumbItem>();
  protected readonly expanded = signal(false);
  protected readonly resolvedMaxItems = computed(() => {
    const maxItems = this.maxItems();
    return Number.isFinite(maxItems) ? Math.max(0, Math.trunc(maxItems)) : DEFAULT_MAX_ITEMS;
  });
  protected readonly resolvedAriaLabel = computed(
    () => this.ariaLabel()?.trim() || this.translations.navigation.breadcrumb.trim() || null,
  );
  protected readonly resolvedShowAllLabel = computed(
    () =>
      this.showAllLabel()?.trim() ||
      this.translations.navigation.breadcrumbShowAll.trim() ||
      this.translations.navigation.breadcrumbMore.trim(),
  );
  protected readonly resolvedMoreLabel = computed(
    () => this.moreLabel()?.trim() || this.translations.navigation.breadcrumbMore.trim(),
  );
  protected readonly currentIndex = computed(() => this.items().length - 1);
  protected readonly ellipsis = computed<VisibleBreadcrumb>(() => ({
    label: this.resolvedMoreLabel(),
    source: { label: this.resolvedMoreLabel() },
    index: -1,
    ellipsis: true,
  }));
  protected readonly visibleItems = computed<readonly VisibleBreadcrumb[]>(() => {
    const items = this.items();
    const visibleItems = items.map((item, index) => ({ ...item, source: item, index }));
    const maxItems = this.resolvedMaxItems();
    if (this.expanded() || maxItems < 3 || items.length <= maxItems) {
      return visibleItems;
    }
    const tailCount = Math.max(1, maxItems - 2);
    const tailIndices = Array.from(
      { length: tailCount },
      (_, offset) => items.length - tailCount + offset,
    );
    return [visibleItems[0]!, this.ellipsis(), ...tailIndices.map((index) => visibleItems[index]!)];
  });

  constructor() {
    let previousItems = this.items();
    let previousMaxItems = this.resolvedMaxItems();

    effect(() => {
      const items = this.items();
      const maxItems = this.resolvedMaxItems();
      if (items !== previousItems || maxItems !== previousMaxItems) {
        this.expanded.set(false);
        previousItems = items;
        previousMaxItems = maxItems;
      }
    });
  }
}
