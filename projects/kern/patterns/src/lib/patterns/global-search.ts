import {
  ChangeDetectionStrategy,
  Component,
  type ElementRef,
  computed,
  effect,
  inject,
  input,
  model,
  numberAttribute,
  output,
  viewChild,
} from '@angular/core';
import { KRN_PLATFORM, KrnIdService, krnIsNode } from '@kern-ui/angular/cdk';
import { KRN_LOCALE, KRN_TRANSLATIONS } from '@kern-ui/angular/core';
import { krnReadI18nValue } from '@kern-ui/angular/i18n';
import type { KrnSearchResult } from './product-types';

@Component({
  selector: 'krn-global-search',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(focusout)': 'onFocusOut($event)',
  },
  template: `
    <div class="searchbox">
      <span aria-hidden="true">⌕</span>
      <input
        #searchInput
        type="search"
        role="combobox"
        aria-autocomplete="list"
        [attr.aria-label]="resolvedAriaLabel()"
        [attr.aria-expanded]="popupVisible()"
        [attr.aria-controls]="popupVisible() ? resolvedResultsId() : null"
        [attr.aria-activedescendant]="popupVisible() ? activeResultId() : null"
        [value]="query()"
        [placeholder]="placeholder()"
        (input)="onInput($event)"
        (focus)="open.set(true)"
        (keydown)="onKeydown($event)"
      />
      @if (query()) {
        <button type="button" [attr.aria-label]="resolvedClearLabel()" (click)="clear()">×</button>
      }
    </div>
    @if (popupVisible()) {
      <div
        class="results"
        [id]="resolvedResultsId()"
        role="listbox"
        [attr.aria-label]="resolvedResultsLabel()"
      >
        @if (filteredResults().length) {
          @for (result of filteredResults(); track result.id; let index = $index) {
            <button
              type="button"
              role="option"
              [id]="resultOptionId(result.id)"
              [attr.aria-selected]="index === activeIndex()"
              tabindex="-1"
              (pointerenter)="activeIndex.set(index)"
              (pointerdown)="$event.preventDefault()"
              (click)="choose(result)"
            >
              <span>
                <strong>{{ result.label }}</strong>
                @if (result.description) {
                  <small>{{ result.description }}</small>
                }
              </span>
              @if (result.group) {
                <em>{{ result.group }}</em>
              }
            </button>
          }
        } @else {
          <p role="status">{{ resolvedEmptyResultsLabel() }}</p>
        }
      </div>
    }
  `,
  styles: `
    :host {
      position: relative;
      display: block;
      inline-size: min(100%, 38rem);
      color: var(--krn-color-text, #252932);
    }
    :host([hidden]) {
      display: none;
    }
    .searchbox {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      min-block-size: var(--krn-control-size, 2.5rem);
      align-items: center;
      gap: 0.625rem;
      padding-inline: 0.75rem;
      border: 1px solid var(--krn-color-border, #cdd1d7);
      border-radius: var(--krn-radius-control, 0.375rem);
      background: var(--krn-color-surface, #fff);
    }
    .searchbox:focus-within {
      border-color: var(--krn-color-focus, #4f6feb);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--krn-color-focus, #4f6feb), transparent 78%);
    }
    input {
      min-inline-size: 0;
      border: 0;
      outline: 0;
      color: inherit;
      background: transparent;
      font: inherit;
    }
    .searchbox button {
      display: grid;
      min-inline-size: 2rem;
      min-block-size: 2rem;
      place-content: center;
      border: 0;
      color: var(--krn-color-text-muted, #626a76);
      background: transparent;
      font-size: 1.125rem;
      cursor: pointer;
    }
    .results {
      position: absolute;
      z-index: var(--krn-z-dropdown, 500);
      inset-block-start: calc(100% + 0.375rem);
      inset-inline: 0;
      display: grid;
      max-block-size: 24rem;
      overflow: auto;
      padding: 0.375rem;
      border: 1px solid var(--krn-color-border, #cdd1d7);
      border-radius: var(--krn-radius-overlay, 0.75rem);
      background: var(--krn-color-surface-overlay, #fff);
      box-shadow: var(--krn-shadow-overlay, 0 12px 32px rgb(20 24 32 / 0.14));
    }
    .results button {
      display: flex;
      min-block-size: 3rem;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.5rem 0.625rem;
      border: 0;
      border-radius: var(--krn-radius-control, 0.375rem);
      color: inherit;
      background: transparent;
      font: inherit;
      text-align: start;
      cursor: pointer;
    }
    .results button[aria-selected='true'] {
      border-inline-start: 3px solid var(--krn-color-brand-solid, #4f6feb);
      background: var(--krn-color-brand-surface, #fff0e8);
    }
    .results button:not([aria-selected='true']) {
      border-inline-start: 3px solid transparent;
    }
    .results span {
      display: grid;
      min-inline-size: 0;
    }
    .results small,
    .results em {
      color: var(--krn-color-text-muted, #626a76);
      font-size: 0.75rem;
      font-style: normal;
      overflow-wrap: anywhere;
    }
    .results p {
      padding: 1rem;
      color: var(--krn-color-text-muted, #626a76);
      text-align: center;
    }
    @media (pointer: coarse) {
      .searchbox button {
        min-inline-size: 2.75rem;
        min-block-size: 2.75rem;
      }
    }
    @media (forced-colors: active) {
      .searchbox,
      .results {
        border-color: CanvasText;
      }
      .results button[aria-selected='true'] {
        border-inline-start-color: Highlight;
        color: HighlightText;
        background: Highlight;
        forced-color-adjust: none;
      }
      .results button[aria-selected='true'] small,
      .results button[aria-selected='true'] em {
        color: inherit;
      }
    }
  `,
})
export class KrnGlobalSearch {
  private readonly ids = inject(KrnIdService);
  private readonly generatedResultsId = this.ids.next('global-search-results');
  private readonly inheritedLocale = inject(KRN_LOCALE);
  private readonly locale = computed(() => krnReadI18nValue(this.inheritedLocale));
  private readonly platform = inject(KRN_PLATFORM);
  private readonly translations = inject(KRN_TRANSLATIONS);
  private readonly searchInput = viewChild.required<ElementRef<HTMLInputElement>>('searchInput');
  readonly ariaLabel = input<typeof this.translations.patterns.globalSearch | undefined>();
  readonly placeholder = input<typeof this.translations.patterns.searchPlaceholder | undefined>();
  readonly clearLabel = input<typeof this.translations.patterns.clearSearch | undefined>();
  readonly resultsLabel = input<typeof this.translations.patterns.resultLabel | undefined>();
  readonly emptyResultsLabel = input<
    typeof this.translations.patterns.noSearchResults | undefined
  >();
  readonly results = input<readonly KrnSearchResult[]>([]);
  readonly maxResults = input(8, { transform: numberAttribute });
  readonly resultsId = input(this.generatedResultsId);
  readonly query = model('');
  readonly open = model(false);
  readonly activeIndex = model(0);
  readonly resultSelected = output<KrnSearchResult>();
  protected readonly resolvedAriaLabel = computed(() =>
    this.requiredLabel(this.ariaLabel(), this.translations.patterns.globalSearch, 'Global search'),
  );
  protected readonly resolvedClearLabel = computed(() =>
    this.requiredLabel(this.clearLabel(), this.translations.patterns.clearSearch, 'Clear search'),
  );
  protected readonly resolvedResultsId = computed(() =>
    this.validDomId(
      this.requiredLabel(this.resultsId(), this.generatedResultsId, this.generatedResultsId),
    ),
  );
  protected readonly validatedResults = computed(() => {
    const ids = new Set<string>();
    for (const [index, result] of this.results().entries()) {
      const id = typeof result.id === 'string' ? result.id.trim() : '';
      if (!id || ids.has(id)) {
        throw new Error(
          `KrnGlobalSearch requires non-empty unique result ids; received "${String(result.id)}" at index ${index}.`,
        );
      }
      ids.add(id);
      if (typeof result.label !== 'string' || !result.label.trim()) {
        throw new Error(`KrnGlobalSearch result "${result.id}" requires a non-empty label.`);
      }
      if (
        result.keywords !== undefined &&
        (!Array.isArray(result.keywords) ||
          result.keywords.some((keyword) => typeof keyword !== 'string' || !keyword.trim()))
      ) {
        throw new Error(
          `KrnGlobalSearch result "${result.id}" keywords must be non-empty strings.`,
        );
      }
    }
    return this.results();
  });
  protected readonly validatedMaxResults = computed(() => {
    const maximum = this.maxResults();
    if (!Number.isSafeInteger(maximum) || maximum < 1) {
      throw new RangeError('KrnGlobalSearch maxResults must be a positive safe integer.');
    }
    return maximum;
  });
  protected readonly popupVisible = computed(() => this.open() && Boolean(this.query().trim()));
  protected readonly filteredResults = computed(() => {
    const results = this.validatedResults();
    const maximum = this.validatedMaxResults();
    const query = this.query().trim().toLocaleLowerCase(this.locale());
    if (!query) return [];
    return results
      .filter((result) =>
        [result.label, result.description ?? '', ...(result.keywords ?? [])]
          .join(' ')
          .toLocaleLowerCase(this.locale())
          .includes(query),
      )
      .slice(0, maximum);
  });
  protected readonly activeResultId = computed(() => {
    const result = this.filteredResults()[this.activeIndex()];
    return result ? this.resultOptionId(result.id) : null;
  });
  protected readonly resolvedResultsLabel = computed(() => {
    const label = this.resolvedAriaLabel();
    const formatter = this.resultsLabel();
    const translatedFormatter = this.translations.patterns.resultLabel;
    const formatted = typeof formatter === 'function' ? formatter(label) : '';
    const translated = typeof translatedFormatter === 'function' ? translatedFormatter(label) : '';

    return formatted.trim() || translated.trim() || `${label} results`;
  });
  protected readonly resolvedEmptyResultsLabel = computed(() => {
    const query = this.query().trim();
    const formatter = this.emptyResultsLabel();
    const translatedFormatter = this.translations.patterns.noSearchResults;
    const formatted = typeof formatter === 'function' ? formatter(query) : '';
    const translated = typeof translatedFormatter === 'function' ? translatedFormatter(query) : '';

    return formatted.trim() || translated.trim() || `No results for ${query}`;
  });
  private readonly resultsIdGuard = effect(() => {
    this.resolvedResultsId();
  });
  private readonly activeIndexGuard = effect(() => {
    const length = this.filteredResults().length;
    const index = this.activeIndex();
    const normalizedIndex = Number.isFinite(index) ? Math.trunc(index) : 0;
    const nextIndex = length ? Math.min(Math.max(normalizedIndex, 0), length - 1) : 0;

    if (index !== nextIndex) {
      this.activeIndex.set(nextIndex);
    }
  });
  protected resultOptionId(id: string): string {
    return this.ids.fromKey(this.resolvedResultsId(), id);
  }

  protected onInput(event: Event): void {
    this.query.set((event.currentTarget as HTMLInputElement).value);
    this.activeIndex.set(0);
    this.open.set(true);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const results = this.filteredResults();
    if (event.key === 'ArrowDown') {
      if (results.length) {
        event.preventDefault();
        this.open.set(true);
        this.activeIndex.update((index) => Math.min(results.length - 1, index + 1));
      }
    } else if (event.key === 'ArrowUp') {
      if (results.length) {
        event.preventDefault();
        this.open.set(true);
        this.activeIndex.update((index) => Math.max(0, index - 1));
      }
    } else if (event.key === 'Enter') {
      const result = results[this.activeIndex()];
      if (result) {
        event.preventDefault();
        this.choose(result);
      }
    } else if (event.key === 'Escape') {
      if (this.open()) {
        event.preventDefault();
        this.open.set(false);
      }
    }
  }

  protected onFocusOut(event: FocusEvent): void {
    if (
      !krnIsNode(this.platform, event.relatedTarget) ||
      !krnIsNode(this.platform, event.currentTarget) ||
      !(event.currentTarget as Node).contains(event.relatedTarget)
    ) {
      this.open.set(false);
    }
  }

  protected choose(result: KrnSearchResult): void {
    this.query.set(result.label);
    this.open.set(false);
    this.resultSelected.emit(result);
  }

  protected clear(): void {
    this.query.set('');
    this.open.set(false);
    this.activeIndex.set(0);
    this.searchInput().nativeElement.focus({ preventScroll: true });
  }

  private requiredLabel(value: string | undefined, fallback: string, hardFallback: string): string {
    const normalized = typeof value === 'string' ? value.trim() : '';
    const normalizedFallback = typeof fallback === 'string' ? fallback.trim() : '';
    return normalized || normalizedFallback || hardFallback;
  }

  private validDomId(value: string): string {
    if (/\s/u.test(value)) {
      throw new Error('KrnGlobalSearch resultsId must be a single non-whitespace DOM id token.');
    }

    return value;
  }
}
