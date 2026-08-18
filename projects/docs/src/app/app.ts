import { DOCUMENT, ViewportScroller } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ApplicationRef,
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
import { DocsI18n } from './docs-i18n';
import {
  DOCS_DEFAULT_BRAND_COLOR,
  DocsPreferences,
  type DocsBaseTheme,
  type DocsDensity,
  type DocsLocale,
  type DocsMotion,
  type DocsViewport,
} from './preferences';
import { KERN_DOCS_RELEASE_STATE_LABEL, KERN_DOCS_VERSION_LABEL } from './release-identity';

@Component({
  selector: 'kdocs-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, DocsGlobalSearch],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly application = inject(ApplicationRef);
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly viewportScroller = inject(ViewportScroller);
  protected readonly i18n = inject(DocsI18n);
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
  protected readonly sidebarNames = computed(
    () => new Map(this.catalog.map((item) => [item.id, this.i18n.componentName(item)] as const)),
  );
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
    effect((onCleanup) => {
      const fragment = this.router.parseUrl(this.currentUrl()).fragment;
      const browserWindow = this.document.defaultView;
      if (!fragment || !browserWindow) return;

      let remainingFrames = 3;
      let animationFrame = 0;
      const restoreAnchor = (): void => {
        if (this.document.getElementById(fragment)) {
          this.viewportScroller.scrollToAnchor(fragment);
        }
        remainingFrames -= 1;
        if (remainingFrames > 0) {
          animationFrame = browserWindow.requestAnimationFrame(restoreAnchor);
        }
      };

      animationFrame = browserWindow.requestAnimationFrame(restoreAnchor);
      onCleanup(() => browserWindow.cancelAnimationFrame(animationFrame));
    });
  }

  protected itemsFor(category: KernCategory) {
    return catalogIndexByCategory(category);
  }

  protected optionLabel(value: string): string {
    return this.i18n.term(value.charAt(0).toUpperCase() + value.slice(1));
  }

  protected tr(key: string, english: string): string {
    return this.i18n.tFor(this.prefs.locale(), key, english);
  }

  protected toggleNavigation(): void {
    this.prefs.navigationOpen.update((value) => !value);
  }

  protected setTheme(event: Event): void {
    const value = (event.currentTarget as HTMLSelectElement).value as DocsBaseTheme;
    if (this.prefs.theme() === 'contrast') this.prefs.highContrast.set(true);
    this.prefs.theme.set(value);
    void this.updateEnvironmentQuery('theme', value, 'system');
  }

  protected toggleContrast(): void {
    if (this.prefs.theme() === 'contrast') {
      this.prefs.theme.set('system');
      this.prefs.highContrast.set(true);
    }
    this.prefs.highContrast.update((value) => !value);
    void this.updateEnvironmentQuery('contrast', this.prefs.contrastMode() ? 'true' : null, null);
  }

  protected setDensity(event: Event): void {
    const value = (event.currentTarget as HTMLSelectElement).value as DocsDensity;
    this.prefs.density.set(value);
    void this.updateEnvironmentQuery('density', value, 'comfortable');
  }

  protected setDirection(event: Event): void {
    const value = (event.currentTarget as HTMLSelectElement).value as 'ltr' | 'rtl';
    this.prefs.direction.set(value);
    void this.updateEnvironmentQuery('direction', value, 'ltr');
  }

  protected setLocale(event: Event): void {
    const value = (event.currentTarget as HTMLSelectElement).value as DocsLocale;
    this.prefs.locale.set(value);
    const prepared = this.i18n.prepare(value);
    const navigation = this.updateEnvironmentQuery('locale', value, 'en-US');
    void Promise.all([prepared, navigation]).then(() => this.application.tick());
  }

  protected setMotion(event: Event): void {
    const value = (event.currentTarget as HTMLSelectElement).value as DocsMotion;
    this.prefs.motion.set(value);
    void this.updateEnvironmentQuery('motion', value, 'system');
  }

  protected setViewport(event: Event): void {
    const value = (event.currentTarget as HTMLSelectElement).value as DocsViewport;
    this.prefs.viewport.set(value);
    void this.updateEnvironmentQuery('viewport', value, 'responsive');
  }

  protected setBrandColor(event: Event): void {
    const value = (event.currentTarget as HTMLInputElement).value.toLowerCase();
    this.prefs.brand.set(value);
    void this.updateEnvironmentQuery('brandColor', value, DOCS_DEFAULT_BRAND_COLOR);
  }

  private updateEnvironmentQuery(
    key: string,
    value: string | null,
    defaultValue: string | null,
  ): Promise<boolean> {
    if (!this.currentPath().startsWith('/components/')) return Promise.resolve(false);
    return this.router.navigate([], {
      queryParams: { [key]: value === defaultValue ? null : value },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
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
