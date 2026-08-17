import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { A11yModule, LiveAnnouncer } from '@angular/cdk/a11y';
import { KRN_PLATFORM, KrnIdService, KrnOverlayCoordinator } from '@kern-ui/angular/cdk';
import { KRN_TRANSLATIONS, krnFormatTranslation } from '@kern-ui/angular/core';
import type { KrnCommandItem } from './navigation.types';
import { krnResolvedLocale } from '../reactive-locale';

function validateCommandItems(items: readonly KrnCommandItem[]): readonly KrnCommandItem[] {
  const ids = new Set<string>();
  for (const item of items) {
    if (typeof item.id !== 'string' || item.id.trim().length === 0 || ids.has(item.id)) {
      throw new Error(
        `KrnCommandPalette requires non-empty unique item ids; received "${item.id}".`,
      );
    }
    ids.add(item.id);
  }
  return items;
}

function normalizeSearchText(value: string, locale: string | readonly string[]): string {
  try {
    return value.toLocaleLowerCase(locale);
  } catch {
    return value.toLocaleLowerCase();
  }
}

export interface KrnCommandPaletteLabels {
  readonly search: string;
  /** Backward-compatible template containing the `{query}` token. */
  readonly noResults: string;
  readonly formatNoResults?: (query: string) => string;
  readonly navigate: string;
  readonly select: string;
  readonly availableOne: string;
  /** Backward-compatible template containing the `{count}` token. */
  readonly availableMany: string;
  readonly formatAvailableMany?: (count: number) => string;
}

@Component({
  selector: 'krn-command-palette',
  standalone: true,
  imports: [A11yModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './command-palette.html',
  styleUrl: './command-palette.css',
})
export class KrnCommandPalette {
  private readonly platform = inject(KRN_PLATFORM);
  private readonly ids = inject(KrnIdService);
  private readonly announcer = inject(LiveAnnouncer);
  private readonly overlayCoordinator = inject(KrnOverlayCoordinator);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly translations = inject(KRN_TRANSLATIONS);
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  private readonly options = viewChildren<ElementRef<HTMLButtonElement>>('option');
  readonly items = input<readonly KrnCommandItem[], readonly KrnCommandItem[]>([], {
    transform: validateCommandItems,
  });
  readonly open = model(false);
  readonly query = model('');
  readonly title = input<string | undefined>();
  readonly description = input('');
  readonly placeholder = input<string | undefined>();
  readonly resultsLabel = input<string | undefined>();
  readonly closeShortcut = input<string | undefined>();
  readonly locale = input<string | string[] | undefined>();
  private readonly resolvedLocale = krnResolvedLocale(this.locale);
  readonly labels = input<Partial<KrnCommandPaletteLabels>>({});
  readonly selected = output<KrnCommandItem>();
  readonly closed = output<'escape' | 'outside' | 'selection'>();
  protected readonly activeIndex = signal(0);
  private readonly instanceId = this.ids.next('command-palette');
  private readonly overlayId = `${this.instanceId}-overlay`;
  protected readonly headingId = `${this.instanceId}-heading`;
  protected readonly descriptionId = `${this.instanceId}-description`;
  protected readonly resultsId = `${this.instanceId}-results`;
  protected readonly resolvedTitle = computed(
    () => this.title()?.trim() || this.translations.navigation.commandPalette.trim(),
  );
  protected readonly resolvedDescription = computed(() => this.description()?.trim() || null);
  protected readonly resolvedPlaceholder = computed(
    () =>
      this.placeholder()?.trim() || this.translations.navigation.searchCommandsPlaceholder.trim(),
  );
  protected readonly resolvedResultsLabel = computed(
    () => this.resultsLabel()?.trim() || this.translations.navigation.commands.trim(),
  );
  protected readonly resolvedCloseShortcut = computed(
    () => this.closeShortcut()?.trim() || this.translations.navigation.escapeShortcut.trim(),
  );
  protected readonly resolvedLabels = computed<KrnCommandPaletteLabels>(() => {
    const overrides = this.labels();
    return {
      search: this.translations.navigation.commandSearch,
      noResults: this.translations.navigation.noCommandResults,
      formatNoResults:
        overrides.noResults !== undefined && overrides.formatNoResults === undefined
          ? undefined
          : this.translations.navigation.formatNoCommandResults,
      navigate: this.translations.navigation.commandNavigate,
      select: this.translations.navigation.commandSelect,
      availableOne: this.translations.navigation.commandAvailableOne,
      availableMany: this.translations.navigation.commandAvailableMany,
      formatAvailableMany:
        overrides.availableMany !== undefined && overrides.formatAvailableMany === undefined
          ? undefined
          : this.translations.navigation.formatCommandAvailableMany,
      ...overrides,
    };
  });
  protected readonly noResultsMessage = computed(() =>
    krnFormatTranslation(
      this.resolvedLabels().noResults,
      { query: this.query() },
      this.resolvedLabels().formatNoResults,
      this.query(),
    ),
  );
  protected readonly filteredItems = computed(() => {
    const locale = this.resolvedLocale();
    const query = normalizeSearchText(this.query().trim(), locale);
    if (!query) return this.items().filter((item) => !item.disabled);
    return this.items().filter((item) => {
      if (item.disabled) return false;
      const haystack = [item.label, item.description, item.group, ...(item.keywords ?? [])]
        .filter(Boolean)
        .join(' ');
      return normalizeSearchText(haystack, locale).includes(query);
    });
  });
  protected readonly activeItemId = computed(() => {
    const item = this.filteredItems()[this.activeIndex()];
    return item ? this.optionId(item) : null;
  });

  constructor() {
    effect((onCleanup) => {
      if (!this.open() || !this.platform.isBrowser) return;
      this.overlayCoordinator.activate(this.overlayId, this.host.nativeElement, null, () =>
        this.close('escape'),
      );
      this.activeIndex.set(0);
      const focus = (): void => {
        const panel = this.panel()?.nativeElement;
        if (panel && this.overlayCoordinator.isTop(this.overlayId)) {
          this.overlayCoordinator.focusInitial(panel, 'input[type="search"]');
        }
      };
      const focusTimer = this.platform.schedule(focus);
      if (focusTimer === null) focus();
      onCleanup(() => {
        this.platform.cancelScheduled(focusTimer);
        this.overlayCoordinator.deactivate(this.overlayId);
      });
    });
    effect(() => {
      const count = this.filteredItems().length;
      const current = this.activeIndex();
      const normalized = count === 0 ? 0 : Math.min(Math.max(0, Math.trunc(current)), count - 1);
      if (current !== normalized) this.activeIndex.set(normalized);
    });
    effect(() => {
      const count = this.filteredItems().length;
      if (this.open())
        void this.announcer.announce(
          count === 1
            ? this.resolvedLabels().availableOne
            : krnFormatTranslation(
                this.resolvedLabels().availableMany,
                { count },
                this.resolvedLabels().formatAvailableMany,
                count,
              ),
          'polite',
        );
    });
  }

  protected optionId(item: KrnCommandItem): string {
    return this.ids.fromKey('command-option', `${this.instanceId}:${item.id}`);
  }

  protected setQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
    this.setActiveIndex(0);
  }

  protected choose(item: KrnCommandItem): void {
    this.selected.emit(item);
    if (item.href && this.platform.isBrowser) this.platform.window?.location.assign(item.href);
    this.close('selection');
  }

  protected close(reason: 'escape' | 'outside' | 'selection'): void {
    this.open.set(false);
    this.closed.emit(reason);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const items = this.filteredItems();
    if (event.key === 'Enter' && items[this.activeIndex()]) {
      event.preventDefault();
      this.choose(items[this.activeIndex()]);
      return;
    }
    const delta = event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0;
    if (!delta || items.length === 0) return;
    event.preventDefault();
    this.setActiveIndex((this.activeIndex() + delta + items.length) % items.length);
  }

  private setActiveIndex(index: number): void {
    this.activeIndex.set(index);
    this.platform.queueMicrotask(() => {
      this.options()[index]?.nativeElement.scrollIntoView?.({ block: 'nearest' });
    });
  }
}
