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
import { NgTemplateOutlet } from '@angular/common';
import { KRN_TRANSLATIONS, krnFormatTranslation } from '@kern-ui/angular/core';

type PageToken = number | 'ellipsis';

@Component({
  selector: 'krn-pagination',
  standalone: true,
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pagination.html',
  styleUrl: './pagination.css',
})
export class KrnPagination {
  private readonly translations = inject(KRN_TRANSLATIONS);
  readonly totalItems = input(0, { transform: numberAttribute });
  readonly pageSize = input(20, { transform: numberAttribute });
  readonly siblingCount = input(1, { transform: numberAttribute });
  readonly page = model(1);
  readonly ariaLabel = input<string | undefined>();
  readonly previousLabel = input<string | undefined>();
  readonly nextLabel = input<string | undefined>();
  /** Backward-compatible `{page}` template. */
  readonly pageLabel = input<string | undefined>();
  /** Typed alternative to `pageLabel` for locale-specific grammar. */
  readonly pageLabelFormatter = input<((page: number) => string) | undefined>(undefined);
  readonly emptyLabel = input<string | undefined>();
  /** Backward-compatible `{start}`, `{end}`, and `{total}` template. */
  readonly rangeLabel = input<string | undefined>();
  /** Typed alternative to `rangeLabel` for locale-specific grammar. */
  readonly rangeLabelFormatter = input<
    ((start: number, end: number, total: number) => string) | undefined
  >(undefined);
  protected readonly safeTotalItems = computed(() => {
    const total = this.totalItems();
    return Number.isFinite(total) ? Math.max(0, Math.trunc(total)) : 0;
  });
  protected readonly safePageSize = computed(() => {
    const pageSize = this.pageSize();
    return Number.isFinite(pageSize) && pageSize > 0 ? Math.max(1, Math.trunc(pageSize)) : 20;
  });
  protected readonly safeSiblingCount = computed(() => {
    const siblingCount = this.siblingCount();
    return Number.isFinite(siblingCount) ? Math.min(10, Math.max(0, Math.trunc(siblingCount))) : 1;
  });
  protected readonly resolvedAriaLabel = computed(
    () => this.ariaLabel()?.trim() || this.translations.navigation.pagination.trim() || null,
  );
  protected readonly resolvedPreviousLabel = computed(
    () => this.previousLabel()?.trim() || this.translations.navigation.previous.trim(),
  );
  protected readonly resolvedNextLabel = computed(
    () => this.nextLabel()?.trim() || this.translations.navigation.next.trim(),
  );
  protected readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.safeTotalItems() / this.safePageSize())),
  );
  protected readonly currentPage = computed(() => {
    const requested = this.page();
    const page = Number.isFinite(requested) ? Math.trunc(requested) : 1;
    return Math.min(Math.max(1, page), this.pageCount());
  });
  protected readonly summary = computed(() => {
    const total = this.safeTotalItems();
    if (total === 0) {
      return this.emptyLabel()?.trim() || this.translations.navigation.noResults.trim();
    }
    const start = (this.currentPage() - 1) * this.safePageSize() + 1;
    const end = Math.min(total, this.currentPage() * this.safePageSize());
    const inputRangeLabel = this.rangeLabel();
    const rangeLabel = inputRangeLabel ?? this.translations.navigation.resultRangeLabel;
    const formatted = krnFormatTranslation(
      rangeLabel,
      { start, end, total },
      this.rangeLabelFormatter() ??
        (inputRangeLabel === undefined
          ? this.translations.navigation.formatResultRangeLabel
          : undefined),
      start,
      end,
      total,
    );
    return (
      formatted.trim() ||
      krnFormatTranslation(
        this.translations.navigation.resultRangeLabel,
        { start, end, total },
        this.translations.navigation.formatResultRangeLabel,
        start,
        end,
        total,
      )
    );
  });
  protected readonly pageTokens = computed<readonly PageToken[]>(() => {
    const total = this.pageCount();
    const current = this.currentPage();
    const sibling = this.safeSiblingCount();
    const visibleSlotCount = sibling * 2 + 5;

    if (total <= visibleSlotCount) {
      return Array.from({ length: total }, (_, index) => index + 1);
    }

    const edgePageCount = sibling * 2 + 3;
    if (current <= sibling + 2) {
      return [...Array.from({ length: edgePageCount }, (_, index) => index + 1), 'ellipsis', total];
    }

    if (current >= total - sibling - 1) {
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
  protected readonly mobilePageTokens = computed<readonly PageToken[]>(() => {
    const total = this.pageCount();
    const current = this.currentPage();
    if (total <= 5) return Array.from({ length: total }, (_, index) => index + 1);
    if (current <= 3) return [1, 2, 3, 'ellipsis', total];
    if (current >= total - 2) return [1, 'ellipsis', total - 2, total - 1, total];
    return [1, 'ellipsis', current, 'ellipsis', total];
  });

  constructor() {
    effect(() => {
      const clamped = this.currentPage();
      if (!Object.is(clamped, this.page())) this.page.set(clamped);
    });
  }

  protected goTo(value: number): void {
    const requested = Number.isFinite(value) ? Math.trunc(value) : 1;
    const next = Math.min(Math.max(1, requested), this.pageCount());
    if (next === this.currentPage()) return;
    this.page.set(next);
  }

  protected pageAriaLabel(page: number): string {
    const inputPageLabel = this.pageLabel();
    const pageLabel = inputPageLabel ?? this.translations.navigation.pageLabel;
    const formatted = krnFormatTranslation(
      pageLabel,
      { page },
      this.pageLabelFormatter() ??
        (inputPageLabel === undefined ? this.translations.navigation.formatPageLabel : undefined),
      page,
    );
    return (
      formatted.trim() ||
      krnFormatTranslation(
        this.translations.navigation.pageLabel,
        { page },
        this.translations.navigation.formatPageLabel,
        page,
      )
    );
  }
}
