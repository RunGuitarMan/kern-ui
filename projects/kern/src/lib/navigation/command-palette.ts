import type { ElementRef } from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { A11yModule, LiveAnnouncer } from '@angular/cdk/a11y';
import { KrnOverlayCoordinator } from '../feedback/modal-overlays';
import type { KrnCommandItem } from './navigation.types';

let nextCommandPaletteId = 0;

@Component({
  selector: 'krn-command-palette',
  standalone: true,
  imports: [A11yModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (open()) {
      <div class="backdrop" (pointerdown)="close('outside')">
        <section
          class="palette"
          role="dialog"
          aria-modal="true"
          [attr.aria-labelledby]="headingId"
          cdkTrapFocus
          [cdkTrapFocusAutoCapture]="true"
          (pointerdown)="$event.stopPropagation()"
          (keydown)="onKeydown($event)"
        >
          <h2 [id]="headingId">{{ title() }}</h2>
          <label class="search">
            <span class="visually-hidden">Search commands</span>
            <span class="search-icon" aria-hidden="true"></span>
            <input
              #searchInput
              type="search"
              autocomplete="off"
              role="combobox"
              aria-autocomplete="list"
              [attr.aria-expanded]="open()"
              [placeholder]="placeholder()"
              [value]="query()"
              [attr.aria-controls]="resultsId"
              [attr.aria-activedescendant]="activeItemId()"
              (input)="setQuery($event)"
            />
            <kbd>{{ closeShortcut() }}</kbd>
          </label>
          <div class="results" [id]="resultsId" role="listbox" [attr.aria-label]="resultsLabel()">
            @for (item of filteredItems(); track item.id; let index = $index) {
              <button
                type="button"
                role="option"
                [id]="optionId(item)"
                [attr.aria-selected]="index === activeIndex()"
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
                <p>No commands match “{{ query() }}”</p>
              </div>
            }
          </div>
          <footer>
            <span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span><span><kbd>↵</kbd> Select</span>
          </footer>
        </section>
      </div>
    }
  `,
  styles: `
    :host {
      display: contents;
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
      background: var(--krn-color-surface-subtle);
      box-shadow: inset calc(var(--krn-border-width-1) * 2) 0 0 var(--krn-color-primary);
    }
    .results button:focus-visible {
      outline: var(--krn-focus-ring-width) solid var(--krn-color-focus);
      outline-offset: calc(var(--krn-focus-ring-offset) * -1);
    }
    .command-copy {
      display: grid;
      gap: var(--krn-space-0-5);
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
        animation: krn-command-enter var(--krn-motion-duration-normal) var(--krn-motion-ease-enter);
      }
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
  `,
})
export class KrnCommandPalette {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  private readonly announcer = inject(LiveAnnouncer);
  private readonly overlayCoordinator = inject(KrnOverlayCoordinator);
  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  readonly items = input<readonly KrnCommandItem[]>([]);
  readonly open = model(false);
  readonly query = model('');
  readonly title = input('Command palette');
  readonly placeholder = input('Search commands…');
  readonly resultsLabel = input('Commands');
  readonly closeShortcut = input('Esc');
  readonly selected = output<KrnCommandItem>();
  readonly closed = output<'escape' | 'outside' | 'selection'>();
  protected readonly activeIndex = signal(0);
  private readonly instanceId = ++nextCommandPaletteId;
  protected readonly headingId = `krn-command-heading-${this.instanceId}`;
  protected readonly resultsId = `krn-command-results-${this.instanceId}`;
  protected readonly filteredItems = computed(() => {
    const query = this.query().trim().toLocaleLowerCase();
    if (!query) return this.items().filter((item) => !item.disabled);
    return this.items().filter((item) => {
      if (item.disabled) return false;
      const haystack = [item.label, item.description, item.group, ...(item.keywords ?? [])]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase();
      return haystack.includes(query);
    });
  });
  protected readonly activeItemId = computed(() => {
    const item = this.filteredItems()[this.activeIndex()];
    return item ? this.optionId(item) : null;
  });

  constructor() {
    effect((onCleanup) => {
      if (!this.open() || !isPlatformBrowser(this.platformId)) return;
      const previousFocus =
        this.document.activeElement instanceof HTMLElement ? this.document.activeElement : null;
      const overlayId = `krn-command-overlay-${this.instanceId}`;
      this.overlayCoordinator.activate(overlayId);
      this.activeIndex.set(0);
      const focusTimer = setTimeout(() => this.searchInput()?.nativeElement.focus());
      onCleanup(() => {
        clearTimeout(focusTimer);
        this.overlayCoordinator.deactivate(overlayId);
        if (previousFocus?.isConnected) previousFocus.focus();
      });
    });
    effect(() => {
      const count = this.filteredItems().length;
      if (this.open())
        void this.announcer.announce(
          `${count} command${count === 1 ? '' : 's'} available`,
          'polite',
        );
    });
  }

  protected optionId(item: KrnCommandItem): string {
    return `krn-command-${item.id}`;
  }

  protected setQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
    this.activeIndex.set(0);
  }

  protected choose(item: KrnCommandItem): void {
    this.selected.emit(item);
    if (item.href && isPlatformBrowser(this.platformId))
      this.document.defaultView?.location.assign(item.href);
    this.close('selection');
  }

  protected close(reason: 'escape' | 'outside' | 'selection'): void {
    this.open.set(false);
    this.closed.emit(reason);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close('escape');
      return;
    }
    const items = this.filteredItems();
    if (event.key === 'Enter' && items[this.activeIndex()]) {
      event.preventDefault();
      this.choose(items[this.activeIndex()]);
      return;
    }
    const delta = event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0;
    if (!delta || items.length === 0) return;
    event.preventDefault();
    this.activeIndex.update((index) => (index + delta + items.length) % items.length);
  }
}
