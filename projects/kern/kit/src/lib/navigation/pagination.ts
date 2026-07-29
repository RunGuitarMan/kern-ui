import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  model,
  numberAttribute,
} from '@angular/core';
import { KRN_TRANSLATIONS, krnFormatTranslation } from '@kern-ui/angular/core';

type PageToken = number | 'ellipsis';

@Component({
  selector: 'krn-pagination',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="pagination" [attr.aria-label]="ariaLabel()">
      <button
        type="button"
        class="direction"
        [disabled]="currentPage() <= 1"
        (click)="goTo(currentPage() - 1)"
      >
        <span aria-hidden="true">←</span><span class="direction-label">{{ previousLabel() }}</span>
      </button>
      <ol [attr.data-mobile-window]="pageTokens().length > mobileSlotCount ? '' : null">
        @for (token of pageTokens(); track $index) {
          <li
            [attr.data-current]="token !== 'ellipsis' && currentPage() === token ? '' : null"
            [attr.data-mobile-visible]="mobileVisibleIndexes().has($index) ? '' : null"
          >
            @if (token === 'ellipsis') {
              <span class="ellipsis" aria-hidden="true">…</span>
            } @else {
              <button
                type="button"
                [attr.aria-label]="pageAriaLabel(token)"
                [attr.aria-current]="currentPage() === token ? 'page' : null"
                (click)="goTo(token)"
              >
                {{ token }}
              </button>
            }
          </li>
        }
      </ol>
      <button
        type="button"
        class="direction"
        [disabled]="currentPage() >= pageCount()"
        (click)="goTo(currentPage() + 1)"
      >
        <span class="direction-label">{{ nextLabel() }}</span
        ><span aria-hidden="true">→</span>
      </button>
      <p class="summary" aria-live="polite">{{ summary() }}</p>
    </nav>
  `,
  styles: `
    :host {
      display: block;
    }
    .pagination {
      display: flex;
      min-inline-size: 0;
      align-items: center;
      gap: var(--krn-space-2);
    }
    ol {
      display: grid;
      grid-auto-columns: var(--krn-control-height-sm);
      grid-auto-flow: column;
      align-items: center;
      gap: var(--krn-space-1);
      margin: 0;
      padding: 0;
      list-style: none;
    }
    button,
    .ellipsis {
      display: inline-grid;
      inline-size: var(--krn-control-height-sm);
      min-block-size: var(--krn-control-height-sm);
      padding: 0;
      border: var(--krn-border-width-1) solid transparent;
      border-radius: var(--krn-radius-sm);
      place-items: center;
      color: var(--krn-color-text-muted);
      background: transparent;
      font: inherit;
      font-variant-numeric: tabular-nums;
    }
    button {
      cursor: pointer;
    }
    button:hover:not(:disabled) {
      border-color: var(--krn-color-border);
      color: var(--krn-color-text);
      background: var(--krn-color-surface-subtle);
    }
    button[aria-current='page'] {
      border-color: var(--krn-color-primary);
      color: var(--krn-color-text);
      background: var(--krn-color-surface);
      font-weight: var(--krn-font-weight-semibold);
    }
    button:focus-visible {
      outline: var(--krn-focus-ring-width) solid var(--krn-color-focus);
      outline-offset: var(--krn-focus-ring-offset);
    }
    button:disabled {
      color: var(--krn-color-text-disabled);
      cursor: not-allowed;
    }
    .direction {
      display: inline-flex;
      inline-size: auto;
      gap: var(--krn-space-2);
      padding-inline: var(--krn-space-2);
    }
    .summary {
      position: absolute;
      inline-size: 1px;
      block-size: 1px;
      margin: -1px;
      padding: 0;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }
    :host-context([dir='rtl']) .direction > span[aria-hidden='true'] {
      transform: scaleX(-1);
    }
    @media (max-width: 35rem) {
      ol[data-mobile-window] {
        grid-template-columns: repeat(5, var(--krn-control-height-sm));
      }
      ol[data-mobile-window] li:not([data-mobile-visible]) {
        display: none;
      }
      .direction-label {
        position: absolute;
        inline-size: 1px;
        block-size: 1px;
        overflow: hidden;
        clip-path: inset(50%);
      }
    }
  `,
})
export class KrnPagination {
  private readonly translations = inject(KRN_TRANSLATIONS);
  protected readonly mobileSlotCount = 5;
  readonly totalItems = input(0, { transform: numberAttribute });
  readonly pageSize = input(20, { transform: numberAttribute });
  readonly siblingCount = input(1, { transform: numberAttribute });
  readonly page = model(1);
  readonly ariaLabel = input(this.translations.navigation.pagination);
  readonly previousLabel = input(this.translations.navigation.previous);
  readonly nextLabel = input(this.translations.navigation.next);
  /** Backward-compatible `{page}` template. */
  readonly pageLabel = input(this.translations.navigation.pageLabel);
  /** Typed alternative to `pageLabel` for locale-specific grammar. */
  readonly pageLabelFormatter = input<((page: number) => string) | undefined>(undefined);
  readonly emptyLabel = input(this.translations.navigation.noResults);
  /** Backward-compatible `{start}`, `{end}`, and `{total}` template. */
  readonly rangeLabel = input(this.translations.navigation.resultRangeLabel);
  /** Typed alternative to `rangeLabel` for locale-specific grammar. */
  readonly rangeLabelFormatter = input<
    ((start: number, end: number, total: number) => string) | undefined
  >(undefined);
  protected readonly safePageSize = computed(() => Math.max(1, this.pageSize()));
  protected readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.totalItems() / this.safePageSize())),
  );
  protected readonly currentPage = computed(() =>
    Math.min(Math.max(1, this.page()), this.pageCount()),
  );
  protected readonly summary = computed(() => {
    const total = this.totalItems();
    if (total === 0) return this.emptyLabel();
    const start = (this.currentPage() - 1) * this.safePageSize() + 1;
    const end = Math.min(total, this.currentPage() * this.safePageSize());
    return krnFormatTranslation(
      this.rangeLabel(),
      { start, end, total },
      this.rangeLabelFormatter() ??
        (this.rangeLabel() === this.translations.navigation.resultRangeLabel
          ? this.translations.navigation.formatResultRangeLabel
          : undefined),
      start,
      end,
      total,
    );
  });
  protected readonly pageTokens = computed<readonly PageToken[]>(() => {
    const total = this.pageCount();
    const current = this.currentPage();
    const sibling = Math.max(0, this.siblingCount());
    const visibleSlotCount = sibling * 2 + 5;

    if (total <= visibleSlotCount) {
      return Array.from({ length: total }, (_, index) => index + 1);
    }

    const edgePageCount = sibling * 2 + 3;
    if (current <= sibling + 3) {
      return [...Array.from({ length: edgePageCount }, (_, index) => index + 1), 'ellipsis', total];
    }

    if (current >= total - sibling - 2) {
      const firstTrailingPage = total - edgePageCount + 1;
      return [
        1,
        'ellipsis',
        ...Array.from({ length: edgePageCount }, (_, index) => firstTrailingPage + index),
      ];
    }

    return [
      1,
      'ellipsis',
      ...Array.from({ length: sibling * 2 + 1 }, (_, index) => current - sibling + index),
      'ellipsis',
      total,
    ];
  });
  protected readonly mobileVisibleIndexes = computed<ReadonlySet<number>>(() => {
    const tokens = this.pageTokens();
    if (tokens.length <= this.mobileSlotCount) {
      return new Set(tokens.map((_, index) => index));
    }

    const lastIndex = tokens.length - 1;
    const currentIndex = tokens.findIndex((token) => token === this.currentPage());
    const visible = new Set<number>([0, lastIndex, Math.max(0, currentIndex)]);
    const candidates = Array.from(
      { length: Math.max(0, tokens.length - 2) },
      (_, index) => index + 1,
    )
      .filter((index) => !visible.has(index))
      .sort((left, right) => {
        const distance = Math.abs(left - currentIndex) - Math.abs(right - currentIndex);
        return distance || left - right;
      });

    for (const index of candidates) {
      if (visible.size >= this.mobileSlotCount) break;
      visible.add(index);
    }
    return visible;
  });

  constructor() {
    effect(() => {
      const clamped = this.currentPage();
      if (clamped !== this.page()) this.page.set(clamped);
    });
  }

  protected goTo(value: number): void {
    const next = Math.min(Math.max(1, value), this.pageCount());
    if (next === this.currentPage()) return;
    this.page.set(next);
  }

  protected pageAriaLabel(page: number): string {
    return krnFormatTranslation(
      this.pageLabel(),
      { page },
      this.pageLabelFormatter() ??
        (this.pageLabel() === this.translations.navigation.pageLabel
          ? this.translations.navigation.formatPageLabel
          : undefined),
      page,
    );
  }
}
