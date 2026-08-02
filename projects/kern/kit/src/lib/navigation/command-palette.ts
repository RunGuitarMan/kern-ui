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
import { KRN_LOCALE, KRN_TRANSLATIONS, krnFormatTranslation } from '@kern-ui/angular/core';
import type { KrnCommandItem } from './navigation.types';

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
  template: `
    @if (open()) {
      <div class="backdrop" (pointerdown)="close('outside')">
        <section
          #panel
          class="palette"
          role="dialog"
          aria-modal="true"
          [attr.aria-labelledby]="headingId"
          [attr.aria-describedby]="resolvedDescription() ? descriptionId : null"
          cdkTrapFocus
          [cdkTrapFocusAutoCapture]="true"
          (pointerdown)="$event.stopPropagation()"
          (keydown)="onKeydown($event)"
        >
          <h2 [id]="headingId">{{ resolvedTitle() }}</h2>
          @if (resolvedDescription(); as dialogDescription) {
            <p class="visually-hidden" [id]="descriptionId">{{ dialogDescription }}</p>
          }
          <label class="search">
            <span class="visually-hidden">{{ resolvedLabels().search }}</span>
            <span class="search-icon" aria-hidden="true"></span>
            <input
              type="search"
              autocomplete="off"
              role="combobox"
              aria-autocomplete="list"
              [attr.aria-expanded]="open()"
              [placeholder]="resolvedPlaceholder()"
              [value]="query()"
              [attr.aria-controls]="resultsId"
              [attr.aria-activedescendant]="activeItemId()"
              (input)="setQuery($event)"
            />
            <kbd>{{ resolvedCloseShortcut() }}</kbd>
          </label>
          <div
            class="results"
            [id]="resultsId"
            role="listbox"
            [attr.aria-label]="resolvedResultsLabel()"
          >
            @for (item of filteredItems(); track item.id; let index = $index) {
              <button
                #option
                type="button"
                role="option"
                [id]="optionId(item)"
                [attr.aria-selected]="index === activeIndex()"
                tabindex="-1"
                (click)="choose(item)"
                (pointerenter)="activeIndex.set(index)"
              >
                <span class="command-copy">
                  <strong>{{ item.label }}</strong>
                  @if (item.description) {
                    <span>{{ item.description }}</span>
                  }
                </span>
                @if (item.shortcut) {
                  <kbd>{{ item.shortcut }}</kbd>
                }
              </button>
            } @empty {
              <div class="empty">
                <span aria-hidden="true">∅</span>
                <p>{{ noResultsMessage() }}</p>
              </div>
            }
          </div>
          <footer>
            <span><kbd>↑</kbd><kbd>↓</kbd> {{ resolvedLabels().navigate }}</span
            ><span><kbd>↵</kbd> {{ resolvedLabels().select }}</span>
          </footer>
        </section>
      </div>
    }
  `,
  styles: `
    :host {
      display: contents;
    }
    :host([hidden]) {
      display: none;
    }
    .backdrop {
      position: fixed;
      z-index: var(--krn-z-modal);
      inset: 0;
      display: grid;
      align-items: start;
      justify-items: center;
      padding: clamp(var(--krn-space-4), 10vh, var(--krn-space-16)) var(--krn-space-4);
      background: var(--krn-color-backdrop);
    }
    .palette {
      display: grid;
      inline-size: min(42rem, 100%);
      max-block-size: min(38rem, calc(100dvh - var(--krn-space-8)));
      overflow: hidden;
      border: var(--krn-border-width-1) solid var(--krn-color-border);
      border-radius: var(--krn-radius-lg);
      color: var(--krn-color-text);
      background: var(--krn-color-surface-raised);
      box-shadow: var(--krn-shadow-overlay);
    }
    h2 {
      margin: 0;
      padding: var(--krn-space-4) var(--krn-space-5) 0;
      font-size: var(--krn-font-size-sm);
      font-weight: var(--krn-font-weight-medium);
    }
    .search {
      display: flex;
      align-items: center;
      gap: var(--krn-space-3);
      padding: var(--krn-space-3) var(--krn-space-5);
      border-block-end: var(--krn-border-width-1) solid var(--krn-color-border);
      color: var(--krn-color-text-muted);
    }
    .search-icon {
      position: relative;
      inline-size: 1rem;
      block-size: 1rem;
      flex: 0 0 1rem;
      border: 1.75px solid currentColor;
      border-radius: 50%;
      color: var(--krn-color-text-muted);
    }
    .search-icon::after {
      position: absolute;
      inline-size: 0.4rem;
      block-size: 1.75px;
      inset-inline-end: -0.3rem;
      inset-block-end: -0.12rem;
      border-radius: var(--krn-radius-full);
      background: currentColor;
      rotate: 45deg;
      transform-origin: center;
      content: '';
    }
    input {
      min-inline-size: 0;
      flex: 1;
      border: 0;
      outline: 0;
      color: var(--krn-color-text);
      background: transparent;
      font: inherit;
      font-size: var(--krn-font-size-lg);
    }
    input::placeholder {
      color: var(--krn-color-text-subtle);
    }
    kbd {
      padding: var(--krn-space-0-5) var(--krn-space-1);
      border: var(--krn-border-width-1) solid var(--krn-color-border);
      border-radius: var(--krn-radius-xs);
      color: var(--krn-color-text-muted);
      background: var(--krn-color-surface-sunken);
      font: inherit;
      font-size: var(--krn-font-size-xs);
    }
    .results {
      display: grid;
      gap: var(--krn-space-1);
      overflow-y: auto;
      padding: var(--krn-space-2);
    }
    .results button {
      display: flex;
      min-block-size: var(--krn-control-height-lg);
      align-items: center;
      justify-content: space-between;
      gap: var(--krn-space-4);
      padding: var(--krn-space-2) var(--krn-space-3);
      border: 0;
      border-inline-start: calc(var(--krn-border-width-1) * 2) solid transparent;
      border-radius: var(--krn-radius-sm);
      color: var(--krn-color-text);
      background: transparent;
      font: inherit;
      text-align: start;
      cursor: pointer;
    }
    .results button:hover {
      background: color-mix(in oklch, var(--krn-color-surface-subtle) 68%, transparent);
    }
    .results button[aria-selected='true'] {
      border-inline-start-color: var(--krn-color-primary);
      background: var(--krn-color-surface-subtle);
    }
    .results button:focus-visible {
      outline: var(--krn-focus-ring-width) solid var(--krn-color-focus);
      outline-offset: calc(var(--krn-focus-ring-offset) * -1);
    }
    .command-copy {
      display: grid;
      min-inline-size: 0;
      gap: var(--krn-space-0-5);
    }
    .command-copy :is(strong, span) {
      overflow-wrap: anywhere;
    }
    .command-copy strong {
      font-weight: var(--krn-font-weight-medium);
    }
    .command-copy span {
      color: var(--krn-color-text-muted);
      font-size: var(--krn-font-size-sm);
    }
    .empty {
      display: grid;
      justify-items: center;
      gap: var(--krn-space-2);
      padding: var(--krn-space-8);
      color: var(--krn-color-text-muted);
      text-align: center;
    }
    .empty p {
      margin: 0;
    }
    footer {
      display: flex;
      flex-wrap: wrap;
      gap: var(--krn-space-4);
      padding: var(--krn-space-2) var(--krn-space-4);
      border-block-start: var(--krn-border-width-1) solid var(--krn-color-border);
      color: var(--krn-color-text-subtle);
      font-size: var(--krn-font-size-xs);
    }
    footer span {
      display: flex;
      align-items: center;
      gap: var(--krn-space-1);
    }
    .visually-hidden {
      position: absolute;
      inline-size: 1px;
      block-size: 1px;
      margin: -1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }
    @media (prefers-reduced-motion: no-preference) {
      .palette {
        animation: krn-command-enter var(--krn-motion-duration-enter) var(--krn-motion-ease-enter);
      }
    }
    :host-context(html[data-krn-motion='full']) .palette {
      animation: krn-command-enter var(--krn-motion-duration-enter) var(--krn-motion-ease-enter);
    }
    @keyframes krn-command-enter {
      from {
        opacity: 0;
        transform: translateY(calc(var(--krn-space-2) * -1));
      }
      to {
        opacity: 1;
        transform: none;
      }
    }
    @media (max-width: 30rem) {
      .backdrop {
        padding: var(--krn-space-3);
        padding-block-end: max(var(--krn-space-3), env(safe-area-inset-bottom));
      }
      .palette {
        max-block-size: calc(100dvh - var(--krn-space-6));
      }
      footer {
        display: none;
      }
    }
    @media (forced-colors: active) {
      .palette,
      .search,
      footer,
      kbd {
        border-color: CanvasText;
      }
      .results button[aria-selected='true'] {
        border-inline-start-color: Highlight;
      }
      .results button:focus-visible {
        outline-color: Highlight;
      }
    }
  `,
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
  readonly title = input(this.translations.navigation.commandPalette);
  readonly description = input('');
  readonly placeholder = input(this.translations.navigation.searchCommandsPlaceholder);
  readonly resultsLabel = input(this.translations.navigation.commands);
  readonly closeShortcut = input(this.translations.navigation.escapeShortcut);
  readonly locale = input<string | string[]>(inject(KRN_LOCALE));
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
    const locale = this.locale();
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
