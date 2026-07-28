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
import {
  KrnAlert,
  KrnAvatar,
  KrnBadge,
  KrnBreadcrumbs,
  KrnButton,
  KrnButtonGroup,
  KrnCard,
  KrnCheckbox,
  KrnChip,
  KrnConfirmation,
  KrnDataGrid,
  KrnDivider,
  KrnFloatingActionButton,
  KrnFormField,
  KrnGlobalSearch,
  KrnGrid,
  KrnIconButton,
  KrnNativeSelect,
  KrnPageHeader,
  KrnPagination,
  KrnProgressBar,
  KrnSkeleton,
  KrnSpinner,
  KrnStack,
  KrnStat,
  KrnSwitch,
  KrnTabs,
  KrnTextInput,
  KrnThemeService,
  type KrnBreadcrumbItem,
  type KrnDataColumn,
  type KrnDensity,
  type KrnSelectOption,
  type KrnTabItem,
  type KrnTheme,
} from '@kern-ui/angular';

type LabTheme = Exclude<KrnTheme, 'system'>;
type LabDirection = 'ltr' | 'rtl';
type LabScenario = 'default' | 'states' | 'stress' | 'virtual';
type CatalogFilter = 'All' | KernCategory;

interface LabRecord extends Record<string, unknown> {
  readonly id: number;
  readonly service: string;
  readonly owner: string;
  readonly state: string;
  readonly latency: number;
}

interface MatrixGroup {
  readonly category: KernCategory;
  readonly items: readonly KernCatalogItem[];
}

const THEMES: readonly LabTheme[] = ['light', 'dark', 'high-contrast'];
const DENSITIES: readonly KrnDensity[] = ['compact', 'comfortable', 'spacious'];
const DIRECTIONS: readonly LabDirection[] = ['ltr', 'rtl'];
const SCENARIOS: readonly LabScenario[] = ['default', 'states', 'stress', 'virtual'];

function includesValue<T extends string>(values: readonly T[], value: string | null): value is T {
  return value !== null && values.includes(value as T);
}

@Component({
  selector: 'klab-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    KrnAlert,
    KrnAvatar,
    KrnBadge,
    KrnBreadcrumbs,
    KrnButton,
    KrnButtonGroup,
    KrnCard,
    KrnCheckbox,
    KrnChip,
    KrnConfirmation,
    KrnDataGrid,
    KrnDivider,
    KrnFloatingActionButton,
    KrnFormField,
    KrnGlobalSearch,
    KrnGrid,
    KrnIconButton,
    KrnNativeSelect,
    KrnPageHeader,
    KrnPagination,
    KrnProgressBar,
    KrnSkeleton,
    KrnSpinner,
    KrnStack,
    KrnStat,
    KrnSwitch,
    KrnTabs,
    KrnTextInput,
  ],
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

  protected readonly componentId = signal('button');
  protected readonly scenario = signal<LabScenario>('default');
  protected readonly theme = signal<LabTheme>('light');
  protected readonly density = signal<KrnDensity>('comfortable');
  protected readonly direction = signal<LabDirection>('ltr');
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
      `${this.componentId()} / ${this.scenario()} / ${this.theme()} / ${this.density()} / ${this.direction()}`,
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
  protected readonly specimenCopy = computed(() =>
    this.scenario() === 'stress'
      ? 'A deliberately long specimen label that verifies wrapping, narrow containers, bidirectional layout, and resilient overflow without losing the action hierarchy'
      : 'Publish configuration',
  );

  protected readonly breadcrumbs: readonly KrnBreadcrumbItem[] = [
    { label: 'Kern', href: '#catalog-matrix' },
    { label: 'QA lab', href: '#specimen-stage' },
    { label: 'Current specimen', current: true },
  ];
  protected readonly tabs: readonly KrnTabItem[] = [
    { id: 'overview', label: 'Overview', badge: 8 },
    { id: 'signals', label: 'Signals', badge: 24 },
    { id: 'policy', label: 'Policy' },
    { id: 'archive', label: 'Archive', disabled: true },
  ];
  protected readonly selectOptions: readonly KrnSelectOption<string>[] = [
    { value: 'starter', label: 'Starter' },
    { value: 'team', label: 'Team', description: 'For collaborative product teams' },
    { value: 'scale', label: 'Scale', description: 'Advanced controls and governance' },
  ];
  protected readonly searchResults = [
    {
      id: 'northstar',
      label: 'Northstar',
      description: 'Operations workspace',
      group: 'Workspace',
    },
    {
      id: 'fieldnote',
      label: 'Fieldnote',
      description: 'Research project',
      group: 'Project',
    },
    {
      id: 'orchard',
      label: 'Orchard',
      description: 'Customer success workspace',
      group: 'Workspace',
    },
  ] as const;
  protected readonly records: readonly LabRecord[] = [
    { id: 1, service: 'Identity', owner: 'M. Chen', state: 'Healthy', latency: 84 },
    { id: 2, service: 'Billing', owner: 'R. Singh', state: 'Review', latency: 128 },
    { id: 3, service: 'Events', owner: 'A. Cole', state: 'Healthy', latency: 67 },
    { id: 4, service: 'Exports', owner: 'N. Costa', state: 'Healthy', latency: 92 },
  ];
  protected readonly recordColumns: readonly KrnDataColumn<LabRecord>[] = [
    { key: 'service', label: 'Service', sortable: true, priority: 'primary', width: 160 },
    { key: 'owner', label: 'Owner', sortable: true, priority: 'secondary', width: 120 },
    { key: 'state', label: 'State', sortable: true, priority: 'secondary', width: 112 },
    {
      key: 'latency',
      label: 'Latency · ms',
      sortable: true,
      align: 'end',
      priority: 'primary',
      width: 112,
    },
  ];
  protected readonly rowIdentity = (row: LabRecord): number => row.id;
  protected readonly virtualGridMode = { kind: 'virtual' } as const;

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

      this.themeService.setTheme(this.theme());
      this.themeService.setDensity(this.density());
      root.dir = this.direction();
      root.lang = 'en';
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
