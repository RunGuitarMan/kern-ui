import type { Provider } from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  Injectable,
  InjectionToken,
  input,
  signal,
} from '@angular/core';

export interface KrnIconDefinition {
  readonly name: string;
  readonly paths: readonly string[];
  readonly viewBox?: string;
  readonly fill?: 'none' | 'currentColor';
}

export const KRN_BUILT_IN_ICONS = [
  {
    name: 'menu',
    paths: ['M4 7h16M4 12h16M4 17h16'],
  },
  {
    name: 'close',
    paths: ['m6 6 12 12M18 6 6 18'],
  },
  {
    name: 'chevron-left',
    paths: ['m15 18-6-6 6-6'],
  },
  {
    name: 'chevron-right',
    paths: ['m9 18 6-6-6-6'],
  },
  {
    name: 'chevron-down',
    paths: ['m6 9 6 6 6-6'],
  },
  {
    name: 'check',
    paths: ['m5 12 4 4L19 6'],
  },
  {
    name: 'plus',
    paths: ['M12 5v14M5 12h14'],
  },
  {
    name: 'minus',
    paths: ['M5 12h14'],
  },
  {
    name: 'search',
    paths: ['M21 21l-4.35-4.35', 'M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14Z'],
  },
  {
    name: 'settings',
    paths: [
      'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z',
      'M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21h-4v-.08A1.7 1.7 0 0 0 8.97 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.52-1.03H3v-4h.08A1.7 1.7 0 0 0 4.6 8.97a1.7 1.7 0 0 0-.34-1.88l-.06-.06L7.03 4.2l.06.06A1.7 1.7 0 0 0 8.97 4.6 1.7 1.7 0 0 0 10 3.08V3h4v.08a1.7 1.7 0 0 0 1.03 1.52 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06a1.7 1.7 0 0 0-.34 1.88A1.7 1.7 0 0 0 20.92 10H21v4h-.08A1.7 1.7 0 0 0 19.4 15Z',
    ],
  },
] as const satisfies readonly KrnIconDefinition[];

export type KrnBuiltInIconName = (typeof KRN_BUILT_IN_ICONS)[number]['name'];
export type KrnIconName = KrnBuiltInIconName | (string & Record<never, never>);
export type KrnIconSize = 'sm' | 'md' | 'lg' | number;

export const KRN_ICONS = new InjectionToken<readonly (readonly KrnIconDefinition[])[]>('KRN_ICONS');

export function provideKrnIcons(...icons: readonly KrnIconDefinition[]): readonly Provider[] {
  return [
    { provide: KRN_ICONS, useValue: icons, multi: true },
    // A registry belongs to the same injector as its icon definitions. This
    // keeps lazy features and embedded applications from mutating the root
    // registry just to install a local icon set.
    KrnIconRegistry,
  ];
}

@Injectable({ providedIn: 'root' })
export class KrnIconRegistry {
  readonly #definitions = signal<ReadonlyMap<string, KrnIconDefinition>>(new Map());
  readonly #parent = inject(KrnIconRegistry, { optional: true, skipSelf: true });

  constructor() {
    const definitions = new Map<string, KrnIconDefinition>();
    if (!this.#parent) {
      for (const icon of KRN_BUILT_IN_ICONS) {
        definitions.set(icon.name, icon);
      }
    }
    for (const group of inject(KRN_ICONS, { optional: true }) ?? []) {
      for (const icon of group) {
        definitions.set(icon.name, icon);
      }
    }
    this.#definitions.set(definitions);
  }

  register(...icons: readonly KrnIconDefinition[]): void {
    const definitions = new Map(this.#definitions());
    for (const icon of icons) {
      definitions.set(icon.name, icon);
    }
    this.#definitions.set(definitions);
  }

  resolve(name: string): KrnIconDefinition | undefined {
    return this.#definitions().get(name) ?? this.#parent?.resolve(name);
  }
}

@Component({
  selector: 'krn-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './icon.html',
  host: {
    '[style.--krn-icon-size]': 'resolvedSize()',
    '[attr.data-icon]': 'name()',
    '[attr.data-missing]': 'definition() ? null : ""',
  },
  styleUrl: './icon.css',
})
export class KrnIcon {
  private readonly registry = inject(KrnIconRegistry);

  readonly name = input.required<KrnIconName>();
  readonly size = input<KrnIconSize>('md');
  readonly label = input<string | null>(null);

  protected readonly definition = computed(() => this.registry.resolve(this.name()));
  protected readonly resolvedSize = computed(() => {
    const size = this.size();
    return typeof size === 'number' ? `${Math.max(1, size)}px` : `var(--krn-icon-size-${size})`;
  });
}
