import { Injectable, computed, effect, inject, signal } from '@angular/core';
import type { KernApiRow, KernCatalogItem } from '@kern-ui/showcase';
import type {
  KernCatalogIndexItem,
  KernCategory,
  KernComponentStatus,
} from '@kern-ui/showcase/catalog-index';

import { DocsPreferences } from './preferences';
import { RU_SHELL_TERMS, RU_SHELL_TEXT } from './docs-i18n-shell-ru';

type RussianDocsPack = typeof import('./docs-i18n-ru');

const EN_STATUS_DESCRIPTIONS: Readonly<Record<KernComponentStatus, string>> = Object.freeze({
  stable: 'Supported contract; the documented compatibility policy applies.',
  beta: 'Available for controlled production evaluation; the contract may still be refined.',
  experimental: 'Early contract that may change in a pre-1.0 minor release.',
  recipe: 'An adaptable composition rather than a sealed primitive.',
  deprecated: 'Temporarily supported with a documented replacement.',
});

@Injectable({ providedIn: 'root' })
export class DocsI18n {
  private readonly prefs = inject(DocsPreferences);
  private readonly russianPack = signal<RussianDocsPack | null>(null);
  private loadingRussianPack: Promise<void> | null = null;
  readonly russian = computed(() => this.prefs.locale() === 'ru-RU');

  constructor() {
    effect(() => {
      if (this.russian()) void this.loadRussianPack();
    });
  }

  t(key: string, english: string): string {
    return this.tFor(this.prefs.locale(), key, english);
  }

  tFor(locale: string, key: string, english: string): string {
    if (locale !== 'ru-RU') return english;
    return RU_SHELL_TEXT[key] ?? this.packFor(locale)?.RU_TEXT[key] ?? english;
  }

  term(value: string): string {
    return this.termFor(this.prefs.locale(), value);
  }

  termFor(locale: string, value: string): string {
    if (locale !== 'ru-RU') return value;
    return RU_SHELL_TERMS[value] ?? this.packFor(locale)?.RU_TERMS[value] ?? value;
  }

  category(category: KernCategory): string {
    if (!this.russian()) return category;
    return this.russianPack()?.RU_CATEGORIES[category] ?? category;
  }

  componentName(item: Pick<KernCatalogIndexItem, 'id' | 'name'>): string {
    return this.componentNameFor(this.prefs.locale(), item);
  }

  componentNameFor(locale: string, item: Pick<KernCatalogIndexItem, 'id' | 'name'>): string {
    if (locale !== 'ru-RU') return item.name;
    return this.packFor(locale)?.RU_COMPONENT_NAMES[item.id] ?? item.name;
  }

  status(status: KernComponentStatus): string {
    if (!this.russian()) return status;
    return this.russianPack()?.RU_STATUS[status] ?? status;
  }

  statusDescription(status: KernComponentStatus): string {
    if (!this.russian()) return EN_STATUS_DESCRIPTIONS[status];
    return this.russianPack()?.RU_STATUS_DESCRIPTIONS[status] ?? EN_STATUS_DESCRIPTIONS[status];
  }

  catalogItem(item: KernCatalogItem): KernCatalogItem {
    return this.catalogItemFor(this.prefs.locale(), item);
  }

  catalogItemFor(locale: string, item: KernCatalogItem): KernCatalogItem {
    if (locale !== 'ru-RU') return item;
    const pack = this.packFor(locale);
    if (!pack) return item;
    const name = pack.RU_COMPONENT_NAMES[item.id] ?? item.name;
    return {
      ...item,
      name,
      summary: `${name}. ${pack.RU_SUMMARY[item.category]}`,
      keyboard: pack.RU_KEYBOARD[item.category],
      accessibility: pack.RU_ACCESSIBILITY[item.category],
      api: item.api.map((row) => ({ ...row, description: this.apiDescriptionFor(locale, row) })),
      do: pack.RU_DO[item.category],
      dont: pack.RU_DONT[item.category],
    };
  }

  apiDescription(row: Pick<KernApiRow, 'name' | 'kind' | 'description'>): string {
    return this.apiDescriptionFor(this.prefs.locale(), row);
  }

  apiDescriptionFor(
    locale: string,
    row: Pick<KernApiRow, 'name' | 'kind' | 'description'>,
  ): string {
    if (locale !== 'ru-RU') return row.description;
    const pack = this.packFor(locale);
    const explicit = pack?.RU_API_DESCRIPTIONS[row.name];
    if (explicit) return explicit;
    if (!pack) return row.description;
    if (row.kind === 'model') {
      return `Управляемое состояние ${row.name} с соответствующим событием ${row.name}Change.`;
    }
    if (row.kind === 'output') return `Отправляется при завершении действия ${row.name}.`;
    return `Настраивает контракт ${row.name} компонента.`;
  }

  prepare(locale: string): Promise<void> {
    return locale === 'ru-RU' ? this.loadRussianPack() : Promise.resolve();
  }

  private loadRussianPack(): Promise<void> {
    if (this.russianPack()) return Promise.resolve();
    this.loadingRussianPack ??= import('./docs-i18n-ru').then((pack) => {
      this.russianPack.set(pack);
    });
    return this.loadingRussianPack;
  }

  private packFor(locale: string): RussianDocsPack | null {
    if (locale === 'ru-RU' && !this.russianPack()) void this.loadRussianPack();
    return this.russianPack();
  }
}
