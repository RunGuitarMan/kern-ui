import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
  KERN_CATEGORIES,
  KERN_CATALOG,
  catalogByCategory,
  type KernCategory,
} from '@kern-ui/showcase';
import { KrnBadge } from '@kern-ui/angular/kit';
import { KrnGlobalSearch, type KrnSearchResult } from '@kern-ui/angular/patterns';
import { filter, map, startWith } from 'rxjs';

import { DocsPreferences } from './preferences';
import { KERN_DOCS_RELEASE_STATE_LABEL, KERN_DOCS_VERSION_LABEL } from './release-identity';

@Component({
  selector: 'kdocs-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, KrnBadge, KrnGlobalSearch],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly router = inject(Router);
  protected readonly prefs = inject(DocsPreferences);
  private readonly docsSearch = viewChild<KrnGlobalSearch>('docsSearch');
  protected readonly categories = KERN_CATEGORIES;
  protected readonly catalog = KERN_CATALOG;
  protected readonly docsVersionLabel = KERN_DOCS_VERSION_LABEL;
  protected readonly docsReleaseStateLabel = KERN_DOCS_RELEASE_STATE_LABEL;
  protected readonly essentials = [
    'button',
    'text-input',
    'dialog',
    'data-grid',
    'app-shell',
    'global-search',
  ]
    .map((id) => this.catalog.find((item) => item.id === id))
    .filter((item): item is (typeof this.catalog)[number] => Boolean(item));
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );
  protected readonly currentPath = computed(() => this.currentUrl().split(/[?#]/, 1)[0] || '/');
  protected readonly previewMode = computed(() => this.currentPath().startsWith('/preview/'));
  private readonly expandedCategories = signal<ReadonlySet<KernCategory>>(
    new Set<KernCategory>(['Actions']),
  );
  protected readonly activeCategory = computed<KernCategory | null>(() => {
    const match = this.currentUrl().match(/^\/components\/([^/?#]+)/);
    return this.catalog.find((item) => item.id === match?.[1])?.category ?? null;
  });
  protected readonly searchResults = computed<readonly KrnSearchResult[]>(() =>
    this.catalog.map((item) => ({
      id: item.id,
      label: item.name,
      description: item.summary,
      group: item.category,
      keywords: [item.selector, item.category],
    })),
  );

  constructor() {
    effect(() => {
      this.currentUrl();
      const active = this.activeCategory();
      this.prefs.navigationOpen.set(false);
      this.docsSearch()?.query.set('');
      if (!active) return;
      this.expandedCategories.update((current) => {
        if (current.has(active)) return current;
        const next = new Set(current);
        next.add(active);
        return next;
      });
    });
  }

  protected itemsFor(category: KernCategory) {
    return catalogByCategory(category);
  }

  protected openResult(result: KrnSearchResult): void {
    this.docsSearch()?.query.set('');
    void this.router.navigate(['/components', result.id]);
  }

  protected toggleNavigation(): void {
    this.prefs.navigationOpen.update((value) => !value);
  }

  protected categoryOpen(category: KernCategory): boolean {
    return this.expandedCategories().has(category);
  }

  protected setCategoryOpen(category: KernCategory, event: Event): void {
    const open = (event.currentTarget as HTMLDetailsElement).open;
    this.expandedCategories.update((current) => {
      const next = new Set(current);
      if (open) next.add(category);
      else next.delete(category);
      return next;
    });
  }
}
