import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import {
  KERN_CATALOG,
  KERN_CATEGORIES,
  KERN_COVERAGE,
  type KernCatalogItem,
  type KernCategory,
} from '@kern-ui/showcase';
import { KernComponentSpecimen } from '@kern-ui/showcase/specimen';
import { KrnThemeService, type KrnDensity, type KrnTheme } from '@kern-ui/angular/core';

type LabTheme = Exclude<KrnTheme, 'system'>;
type LabDirection = 'ltr' | 'rtl';
type LabScenario = 'default' | 'states' | 'stress' | 'virtual';
type LabLocale = 'en-US' | 'ru-RU';
type CatalogFilter = 'All' | KernCategory;

interface MatrixGroup {
  readonly category: KernCategory;
  readonly items: readonly KernCatalogItem[];
}

const THEMES: readonly LabTheme[] = ['light', 'dark', 'high-contrast'];
const DENSITIES: readonly KrnDensity[] = ['compact', 'comfortable', 'spacious'];
const DIRECTIONS: readonly LabDirection[] = ['ltr', 'rtl'];
const SCENARIOS: readonly LabScenario[] = ['default', 'states', 'stress', 'virtual'];
const LOCALES: readonly LabLocale[] = ['en-US', 'ru-RU'];

function includesValue<T extends string>(values: readonly T[], value: string | null): value is T {
  return value !== null && values.includes(value as T);
}

@Component({
  selector: 'klab-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [KernComponentSpecimen],
  host: {
    '[attr.dir]': 'direction()',
    '[attr.data-theme]': 'theme()',
    '[attr.data-density]': 'density()',
    '[attr.data-scenario]': 'scenario()',
  },
  templateUrl: './app.html',
})
export class App {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly title = inject(Title);
  private readonly themeService = inject(KrnThemeService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly catalog = KERN_CATALOG;
  protected readonly categories = KERN_CATEGORIES;
  protected readonly coverage = KERN_COVERAGE;
  protected readonly themes = THEMES;
  protected readonly densities = DENSITIES;
  protected readonly directions = DIRECTIONS;
  protected readonly scenarios = SCENARIOS;
  protected readonly locales = LOCALES;

  protected readonly componentId = signal('button');
  protected readonly scenario = signal<LabScenario>('default');
  protected readonly theme = signal<LabTheme>('light');
  protected readonly density = signal<KrnDensity>('comfortable');
  protected readonly direction = signal<LabDirection>('ltr');
  protected readonly locale = signal<LabLocale>('en-US');
  protected readonly catalogQuery = signal('');
  protected readonly catalogFilter = signal<CatalogFilter>('All');

  protected readonly selectedItem = computed(
    () => this.catalog.find((item) => item.id === this.componentId()) ?? this.catalog[0],
  );
  protected readonly selectedOrdinal = computed(() => {
    const index = this.catalog.findIndex((item) => item.id === this.selectedItem()?.id);
    return String(Math.max(0, index) + 1).padStart(3, '0');
  });
  protected readonly stateSignature = computed(
    () =>
      `${this.componentId()} / ${this.scenario()} / ${this.theme()} / ${this.density()} / ${this.direction()} / ${this.locale()}`,
  );
  protected readonly matrixGroups = computed<readonly MatrixGroup[]>(() => {
    const query = this.catalogQuery().trim().toLocaleLowerCase();
    const filter = this.catalogFilter();

    return this.categories
      .filter((category) => filter === 'All' || filter === category)
      .map((category) => ({
        category,
        items: this.catalog.filter(
          (item) =>
            item.category === category &&
            (!query ||
              item.name.toLocaleLowerCase().includes(query) ||
              item.selector.toLocaleLowerCase().includes(query)),
        ),
      }))
      .filter((group) => group.items.length > 0);
  });
  protected readonly visibleCatalogCount = computed(() =>
    this.matrixGroups().reduce((total, group) => total + group.items.length, 0),
  );

  constructor() {
    const root = this.document.documentElement;
    root.setAttribute('data-krn-lab', '');

    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const requestedComponent = params.get('component');
      const nextComponent = this.catalog.some((item) => item.id === requestedComponent)
        ? (requestedComponent as string)
        : 'button';
      const requestedScenario = params.get('scenario');
      const requestedTheme = params.get('theme');
      const requestedDensity = params.get('density');
      const requestedDirection = params.get('direction');
      const requestedLocale = params.get('locale');

      this.componentId.set(nextComponent);
      this.scenario.set(
        includesValue(SCENARIOS, requestedScenario) ? requestedScenario : 'default',
      );
      this.theme.set(includesValue(THEMES, requestedTheme) ? requestedTheme : 'light');
      this.density.set(
        includesValue(DENSITIES, requestedDensity) ? requestedDensity : 'comfortable',
      );
      this.direction.set(
        includesValue(DIRECTIONS, requestedDirection) ? requestedDirection : 'ltr',
      );
      this.locale.set(includesValue(LOCALES, requestedLocale) ? requestedLocale : 'en-US');

      this.themeService.setTheme(this.theme());
      this.themeService.setDensity(this.density());
      root.dir = this.direction();
      root.lang = this.locale();
      this.title.setTitle(`${this.selectedItem()?.name ?? 'Component'} · Kern QA Lab`);
    });

    this.destroyRef.onDestroy(() => {
      root.removeAttribute('data-krn-lab');
    });
  }

  protected setComponent(event: Event): void {
    this.updateQuery({ component: (event.currentTarget as HTMLSelectElement).value });
  }

  protected setScenario(event: Event): void {
    this.updateQuery({ scenario: (event.currentTarget as HTMLSelectElement).value });
  }

  protected setTheme(event: Event): void {
    this.updateQuery({ theme: (event.currentTarget as HTMLSelectElement).value });
  }

  protected setDensity(event: Event): void {
    this.updateQuery({ density: (event.currentTarget as HTMLSelectElement).value });
  }

  protected setDirection(event: Event): void {
    this.updateQuery({ direction: (event.currentTarget as HTMLSelectElement).value });
  }

  protected setLocale(event: Event): void {
    const locale = (event.currentTarget as HTMLSelectElement).value;
    const tree = this.router.createUrlTree([], {
      relativeTo: this.route,
      queryParams: { locale },
      queryParamsHandling: 'merge',
    });
    const url = this.router.serializeUrl(tree);
    const view = this.document.defaultView;
    if (view) {
      view.location.assign(url);
      return;
    }
    void this.router.navigateByUrl(tree);
  }

  protected selectCatalogItem(id: string): void {
    this.updateQuery({ component: id });
    this.document.getElementById('specimen-stage')?.scrollIntoView({ block: 'start' });
  }

  protected setCatalogQuery(event: Event): void {
    this.catalogQuery.set((event.currentTarget as HTMLInputElement).value);
  }

  protected setCatalogFilter(event: Event): void {
    const value = (event.currentTarget as HTMLSelectElement).value;
    this.catalogFilter.set(
      value === 'All' || this.categories.includes(value as KernCategory)
        ? (value as CatalogFilter)
        : 'All',
    );
  }

  protected categoryCode(category: KernCategory): string {
    return String(this.categories.indexOf(category) + 1).padStart(2, '0');
  }

  private updateQuery(queryParams: Record<string, string>): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
    });
  }
}
