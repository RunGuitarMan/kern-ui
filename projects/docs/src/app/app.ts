import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
  KERN_CATEGORIES,
  KERN_CATALOG_INDEX,
  catalogIndexByCategory,
  type KernCategory,
} from '@kern-ui/showcase/catalog-index';
import { filter, map, startWith } from 'rxjs';

import { DocsGlobalSearch } from './docs-global-search';
import { DocsPreferences } from './preferences';
import { KERN_DOCS_RELEASE_STATE_LABEL, KERN_DOCS_VERSION_LABEL } from './release-identity';

@Component({
  selector: 'kdocs-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, DocsGlobalSearch],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly router = inject(Router);
  protected readonly prefs = inject(DocsPreferences);
  protected readonly categories = KERN_CATEGORIES;
  protected readonly catalog = KERN_CATALOG_INDEX;
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
  protected readonly darkMode = computed(() => this.prefs.theme() === 'dark');
  protected readonly contrastMode = computed(
    () => this.prefs.highContrast() || this.prefs.theme() === 'contrast',
  );
  protected readonly colorModeLabel = computed(() =>
    this.darkMode() ? 'Switch to light theme' : 'Switch to dark theme',
  );
  private readonly expandedCategories = signal<ReadonlySet<KernCategory>>(
    new Set<KernCategory>(['Actions']),
  );
  protected readonly activeCategory = computed<KernCategory | null>(() => {
    const match = this.currentUrl().match(/^\/components\/([^/?#]+)/);
    return this.catalog.find((item) => item.id === match?.[1])?.category ?? null;
  });

  constructor() {
    effect(() => {
      this.currentUrl();
      const active = this.activeCategory();
      this.prefs.navigationOpen.set(false);
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
    return catalogIndexByCategory(category);
  }

  protected toggleNavigation(): void {
    this.prefs.navigationOpen.update((value) => !value);
  }

  protected toggleColorMode(): void {
    this.prefs.highContrast.set(false);
    this.prefs.theme.set(this.darkMode() ? 'light' : 'dark');
  }

  protected toggleContrast(): void {
    if (this.prefs.theme() === 'contrast') {
      this.prefs.theme.set('system');
      this.prefs.highContrast.set(false);
      return;
    }
    this.prefs.highContrast.update((value) => !value);
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
