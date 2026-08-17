import { NgTemplateOutlet } from '@angular/common';
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import type { AfterViewChecked, TemplateRef } from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  NgZone,
  afterEveryRender,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  model,
  numberAttribute,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { filter, take } from 'rxjs';
import type { Subscription } from 'rxjs';
import { KRN_PLATFORM } from '@kern-ui/angular/cdk';
import { KRN_LOCALE, KRN_TRANSLATIONS } from '@kern-ui/angular/core';
import type { KrnDataGridTranslations } from '@kern-ui/angular/core';
import { krnReadI18nValue } from '@kern-ui/angular/i18n';

export type KrnDataRowKey = string | number;
export type KrnDataSortDirection = 'asc' | 'desc';
export type KrnDataColumnPin = 'start' | 'end';

export interface KrnDataCellContext<T> {
  readonly $implicit: unknown;
  readonly value: unknown;
  readonly row: T;
  readonly column: KrnDataColumn<T>;
  readonly rowIndex: number;
}

export interface KrnDataHeaderContext<T> {
  readonly $implicit: KrnDataColumn<T>;
  readonly column: KrnDataColumn<T>;
  readonly columnIndex: number;
}

export interface KrnDataRowContext<T> {
  readonly $implicit: T;
  readonly row: T;
  readonly rowIndex: number;
}

export interface KrnDataColumnOptions<T, V = unknown> {
  readonly label: string;
  readonly sortable?: boolean;
  readonly width?: number;
  readonly minWidth?: number;
  readonly maxWidth?: number;
  readonly align?: 'start' | 'center' | 'end';
  readonly priority?: 'primary' | 'secondary' | 'tertiary';
  /**
   * Keeps the column at the logical start or end edge while the grid scrolls horizontally.
   *
   * Pinned columns are partitioned around unpinned columns without mutating the supplied array.
   * Logical edges make the same configuration work in both LTR and RTL documents.
   */
  readonly pinned?: KrnDataColumnPin;
  readonly sortValue?: (row: T) => unknown;
  readonly filterValue?: (row: T) => unknown;
  readonly compare?: (left: unknown, right: unknown, leftRow: T, rightRow: T) => number;
  readonly format?: (value: V, row: T) => string;
  readonly cellTemplate?: TemplateRef<KrnDataCellContext<T>>;
  readonly headerTemplate?: TemplateRef<KrnDataHeaderContext<T>>;
}

export type KrnDataPropertyColumn<T> = T extends object
  ? {
      [K in Extract<keyof T, string>]: KrnDataColumnOptions<T, T[K]> & {
        /** Property key used as the stable column identifier and default accessor. */
        readonly key: K;
        readonly accessor?: undefined;
      };
    }[Extract<keyof T, string>]
  : never;

export type KrnDataComputedColumn<T> = KrnDataColumnOptions<T, unknown> & {
  /** Stable identifier and value accessor for a computed column. */
  readonly key: string;
  readonly accessor: (row: T) => unknown;
};

export type KrnDataColumn<T> = KrnDataPropertyColumn<T> | KrnDataComputedColumn<T>;

export interface KrnDataGridClientMode {
  readonly kind: 'client';
  readonly pagination?: boolean;
}

export interface KrnDataGridControlledMode {
  readonly kind: 'controlled';
  readonly totalRows: number;
}

/**
 * Fixed-height virtualization supports the same selection, sorting, filtering, and resize
 * contracts as the client grid. Row expansion is intentionally unsupported and is enforced at
 * runtime because `expandable` is a separate component input.
 */
export interface KrnDataGridVirtualMode {
  readonly kind: 'virtual';
}

export type KrnDataGridMode =
  KrnDataGridClientMode | KrnDataGridControlledMode | KrnDataGridVirtualMode;

export interface KrnDataGridQuery {
  readonly filter: string;
  readonly page: number;
  readonly pageSize: number;
  readonly sortKey: string;
  readonly sortDirection: KrnDataSortDirection;
}

export type KrnDataFilterPredicate<T> = (
  row: T,
  query: string,
  columns: readonly KrnDataColumn<T>[],
) => boolean;

interface KrnDataGridCellPosition {
  readonly row: number;
  readonly column: number;
}

type KrnDataGridActionElement = Element & {
  readonly tabIndex: number;
  focus(options?: FocusOptions): void;
};

interface KrnDataRowOccurrence<T> {
  readonly row: T;
  readonly key: KrnDataRowKey;
  readonly sourceIndex: number;
}

const GRID_CELL_SELECTOR = '[data-cell]';
const GRID_CELL_ACTION_SELECTOR = [
  'a[href]',
  'button',
  'input:not([type="hidden"])',
  'select',
  'textarea',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]',
].join(',');

@Component({
  selector: 'krn-data-grid, krn-data-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, ScrollingModule],
  host: {
    '[attr.aria-busy]': 'loading()',
    '[attr.data-compact]': 'compact() ? "" : null',
  },
  templateUrl: './data-grid.html',
  styleUrl: './data-grid.css',
})
export class KrnDataGrid<T> implements AfterViewChecked {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly ngZone = inject(NgZone);
  private readonly platform = inject(KRN_PLATFORM);
  private readonly inheritedLocale = inject(KRN_LOCALE);
  private readonly locale = computed(() => krnReadI18nValue(this.inheritedLocale));
  private readonly translations = inject(KRN_TRANSLATIONS);
  private readonly collator = computed(
    () =>
      new Intl.Collator(this.locale(), {
        numeric: true,
        sensitivity: 'base',
        usage: 'sort',
      }),
  );
  private readonly viewport = viewChild(CdkVirtualScrollViewport);
  private virtualFocusSubscription: Subscription | null = null;
  private virtualRowResizeObserver: ResizeObserver | null = null;
  private observedVirtualRow: HTMLElement | null = null;
  private virtualGridResizeObserver: ResizeObserver | null = null;
  private observedVirtualGrid: HTMLElement | null = null;
  private virtualPinnedFrame: number | null = null;
  private readonly handleVirtualGridScroll = (): void => {
    if (this.observedVirtualGrid) this.scheduleVirtualPinnedAlignment(this.observedVirtualGrid);
  };
  private readonly measuredVirtualRowHeight = signal<number | null>(null);
  private columnResizeObserver: ResizeObserver | null = null;
  private readonly observedColumnHeaders = new Set<HTMLElement>();
  private readonly measuredColumnWidths = signal<Readonly<Record<string, number>>>({});
  private readonly managedTabIndexes = new Map<KrnDataGridActionElement, string | null>();
  private readonly effectiveMode = computed<KrnDataGridMode>(() => {
    const mode = this.mode();
    if (mode.kind === 'virtual' && this.expandable()) {
      throw new Error(
        'KrnDataGrid virtual mode uses fixed-height rows and does not support row expansion. Disable `expandable` or use client/controlled mode.',
      );
    }
    return mode;
  });
  private readonly sourceRows = computed<readonly KrnDataRowOccurrence<T>[]>(() => {
    const firstIndexByKey = new Map<KrnDataRowKey, number>();
    return this.data().map((row, sourceIndex) => {
      const key = this.rowIdentity()(row, sourceIndex);
      const firstIndex = firstIndexByKey.get(key);
      if (firstIndex !== undefined) {
        throw new Error(
          `KrnDataGrid requires unique row identities; received duplicate "${key}" at source indexes ${firstIndex} and ${sourceIndex}.`,
        );
      }
      firstIndexByKey.set(key, sourceIndex);
      return { row, key, sourceIndex };
    });
  });
  private readonly validatedColumns = computed(() => {
    const keys = new Set<string>();
    if (this.columns().length === 0) {
      throw new Error('KrnDataGrid requires at least one column.');
    }
    for (const column of this.columns()) {
      if (typeof column.key !== 'string' || column.key.trim().length === 0) {
        throw new Error('KrnDataGrid requires every column to have a non-empty string key.');
      }
      if (keys.has(column.key)) {
        throw new Error(`KrnDataGrid requires unique column keys; received "${column.key}" twice.`);
      }
      if (column.pinned !== undefined && column.pinned !== 'start' && column.pinned !== 'end') {
        throw new Error(
          `KrnDataGrid column "${column.key}" has an invalid pinned edge "${String(column.pinned)}". Use "start", "end", or omit pinned.`,
        );
      }
      keys.add(column.key);
    }
    return this.columns();
  });

  readonly data = input.required<readonly T[]>();
  readonly columns = input.required<readonly KrnDataColumn<T>[]>();
  readonly rowIdentity = input.required<(row: T, index: number) => KrnDataRowKey>();
  readonly mode = input<KrnDataGridMode>({ kind: 'client', pagination: true });
  readonly labels = input<Partial<KrnDataGridTranslations>>({});
  readonly ariaLabel = input<string | undefined>();
  protected readonly resolvedAriaLabel = computed(
    () => this.ariaLabel() ?? this.translations.dataGrid.ariaLabel,
  );
  readonly loading = input(false, { transform: booleanAttribute });
  readonly error = input('');
  readonly emptyLabel = input<string | undefined>();
  protected readonly resolvedEmptyLabel = computed(
    () => this.emptyLabel() ?? this.translations.dataGrid.empty,
  );
  readonly filterable = input(true, { transform: booleanAttribute });
  readonly filterPlaceholder = input<string | undefined>();
  protected readonly resolvedFilterPlaceholder = computed(
    () => this.filterPlaceholder() ?? this.translations.dataGrid.filterPlaceholder,
  );
  readonly filterPredicate = input<KrnDataFilterPredicate<T> | null>(null);
  readonly selectable = input(false, { transform: booleanAttribute });
  readonly expandable = input(false, { transform: booleanAttribute });
  readonly expandedContent = input<(row: T) => string>(() => '');
  readonly expandedTemplate = input<TemplateRef<KrnDataRowContext<T>> | null>(null);
  readonly defaultCellTemplate = input<TemplateRef<KrnDataCellContext<T>> | null>(null);
  readonly defaultHeaderTemplate = input<TemplateRef<KrnDataHeaderContext<T>> | null>(null);
  readonly resizable = input(true, { transform: booleanAttribute });
  readonly compact = input(false, { transform: booleanAttribute });
  readonly viewportHeight = input(360, { transform: numberAttribute });
  readonly pageSize = input(10, { transform: numberAttribute });
  readonly columnChooser = input(false, { transform: booleanAttribute });
  protected readonly copy = computed(() => {
    const fallback = this.translations.dataGrid;
    const copy = {
      ...fallback,
      ariaLabel: this.resolvedAriaLabel(),
      empty: this.resolvedEmptyLabel(),
      filterPlaceholder: this.resolvedFilterPlaceholder(),
      ...this.labels(),
    };
    return {
      ...copy,
      ariaLabel: copy.ariaLabel?.trim() || fallback.ariaLabel,
      empty: copy.empty?.trim() || fallback.empty,
    };
  });

  readonly filter = model('');
  readonly page = model(1);
  readonly selected = model<ReadonlySet<KrnDataRowKey>>(new Set<KrnDataRowKey>());
  readonly expanded = model<ReadonlySet<KrnDataRowKey>>(new Set<KrnDataRowKey>());
  readonly hiddenColumnKeys = model<ReadonlySet<string>>(new Set<string>());
  readonly sortKey = model<string>('');
  readonly sortDirection = model<KrnDataSortDirection>('asc');
  readonly queryChange = output<KrnDataGridQuery>();
  protected readonly activeCell = signal<KrnDataGridCellPosition>({ row: 0, column: 0 });
  protected readonly actionCell = signal<KrnDataGridCellPosition | null>(null);
  protected readonly widths = signal<Readonly<Record<string, number>>>({});

  protected readonly rowHeight = computed(
    () => this.measuredVirtualRowHeight() ?? (this.compact() ? 36 : 44),
  );
  protected readonly normalizedViewportHeight = computed(() =>
    this.positiveInteger(this.viewportHeight(), 360),
  );
  protected readonly normalizedPageSize = computed(() => this.positiveInteger(this.pageSize(), 10));
  protected readonly isVirtual = computed(() => this.effectiveMode().kind === 'virtual');
  protected readonly isControlled = computed(() => this.effectiveMode().kind === 'controlled');
  protected readonly usesPagination = computed(() => {
    const mode = this.effectiveMode();
    return mode.kind === 'controlled' || (mode.kind === 'client' && (mode.pagination ?? true));
  });
  private readonly normalizedHiddenColumnKeys = computed(() => {
    const columns = this.validatedColumns();
    const knownKeys = new Set(columns.map((column) => column.key));
    const hidden = new Set([...this.hiddenColumnKeys()].filter((key) => knownKeys.has(key)));
    if (hidden.size === columns.length) hidden.delete(columns[0]!.key);
    return hidden;
  });
  protected readonly visibleColumns = computed(() => {
    const hidden = this.normalizedHiddenColumnKeys();
    const visible = this.validatedColumns().filter((column) => !hidden.has(column.key));
    return [
      ...visible.filter((column) => column.pinned === 'start'),
      ...visible.filter((column) => column.pinned === undefined),
      ...visible.filter((column) => column.pinned === 'end'),
    ];
  });
  protected readonly hasPinnedStartColumns = computed(() =>
    this.visibleColumns().some((column) => column.pinned === 'start'),
  );
  private readonly pinnedBoundaryKeys = computed(() => {
    const columns = this.visibleColumns();
    return {
      start: [...columns].reverse().find((column) => column.pinned === 'start')?.key,
      end: columns.find((column) => column.pinned === 'end')?.key,
    };
  });
  private readonly pinnedColumnOffsets = computed(() => {
    const start = new Map<string, number>();
    const end = new Map<string, number>();
    let startOffset = 0;
    let endOffset = 0;

    for (const column of this.visibleColumns()) {
      if (column.pinned !== 'start') continue;
      start.set(column.key, startOffset);
      startOffset += this.pinnedColumnWidth(column);
    }
    for (const column of [...this.visibleColumns()].reverse()) {
      if (column.pinned !== 'end') continue;
      end.set(column.key, endOffset);
      endOffset += this.pinnedColumnWidth(column);
    }

    return { start, end };
  });
  protected readonly dataColumnOffset = computed(
    () => Number(this.selectable()) + Number(this.expandable()),
  );
  protected readonly gridColumnCount = computed(
    () => this.dataColumnOffset() + this.visibleColumns().length,
  );

  protected readonly processed = computed(() => {
    const columns = this.validatedColumns();
    const sourceRows = this.sourceRows();
    if (this.isControlled()) return [...sourceRows];

    const query = this.normalizeForSearch(this.filter().trim());
    const predicate = this.filterPredicate();
    let result = query
      ? sourceRows.filter(({ row }) =>
          predicate
            ? predicate(row, query, columns)
            : columns.some((column) =>
                String(column.filterValue?.(row) ?? this.value(row, column) ?? '')
                  .toLocaleLowerCase(this.locale())
                  .includes(query),
              ),
        )
      : [...sourceRows];

    const key = this.sortKey();
    const column = key ? columns.find((candidate) => candidate.key === key) : undefined;
    if (column) {
      const direction = this.sortDirection() === 'asc' ? 1 : -1;
      result = result.sort((leftOccurrence, rightOccurrence) => {
        const left = leftOccurrence.row;
        const right = rightOccurrence.row;
        const leftValue = column.sortValue?.(left) ?? this.value(left, column);
        const rightValue = column.sortValue?.(right) ?? this.value(right, column);
        const comparison = column.compare
          ? column.compare(leftValue, rightValue, left, right)
          : this.collator().compare(String(leftValue ?? ''), String(rightValue ?? ''));
        return comparison === 0
          ? leftOccurrence.sourceIndex - rightOccurrence.sourceIndex
          : comparison * direction;
      });
    }
    return result;
  });

  private normalizeForSearch(value: string): string {
    return value.toLocaleLowerCase(this.locale());
  }

  protected readonly totalRowCount = computed(() => {
    const mode = this.effectiveMode();
    return mode.kind === 'controlled'
      ? Math.max(0, Number.isFinite(mode.totalRows) ? Math.floor(mode.totalRows) : 0)
      : this.processed().length;
  });
  protected readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.totalRowCount() / this.normalizedPageSize())),
  );
  protected readonly currentPage = computed(() => {
    const page = Number.isFinite(this.page()) ? Math.floor(this.page()) : 1;
    return Math.max(1, Math.min(page, this.pageCount()));
  });
  protected readonly rowOffset = computed(
    () => (this.currentPage() - 1) * this.normalizedPageSize(),
  );
  protected readonly pageRows = computed(() => {
    if (this.isControlled()) return this.processed();
    return this.usesPagination()
      ? this.processed().slice(this.rowOffset(), this.rowOffset() + this.normalizedPageSize())
      : this.processed();
  });
  protected readonly visibleRows = computed(() =>
    this.isVirtual() ? this.processed() : this.pageRows(),
  );
  protected readonly focusCellPosition = computed(() => ({
    row: Math.max(-1, Math.min(this.activeCell().row, this.visibleRows().length - 1)),
    column: Math.max(0, Math.min(this.activeCell().column, this.gridColumnCount() - 1)),
  }));
  protected readonly pageStart = computed(() =>
    this.pageRows().length ? this.rowOffset() + 1 : 0,
  );
  protected readonly pageEnd = computed(() =>
    Math.min(this.rowOffset() + this.pageRows().length, this.totalRowCount()),
  );
  protected readonly allVisibleSelected = computed(
    () =>
      this.visibleRows().length > 0 &&
      this.visibleRows().every((occurrence) => this.selected().has(occurrence.key)),
  );
  protected readonly someVisibleSelected = computed(
    () =>
      !this.allVisibleSelected() &&
      this.visibleRows().some((occurrence) => this.selected().has(occurrence.key)),
  );

  protected readonly loadingRows = [0, 1, 2, 3, 4];
  protected readonly trackRow = (
    _index: number,
    occurrence: KrnDataRowOccurrence<T>,
  ): KrnDataRowKey => occurrence.key;

  private resizeState:
    | {
        readonly pointerId: number;
        readonly startX: number;
        readonly startWidth: number;
        readonly key: string;
      }
    | undefined;

  constructor() {
    effect(() => {
      const page = this.currentPage();
      if (!Object.is(this.page(), page)) this.page.set(page);

      const hidden = this.hiddenColumnKeys();
      const normalizedHidden = this.normalizedHiddenColumnKeys();
      if (
        hidden.size !== normalizedHidden.size ||
        [...hidden].some((key) => !normalizedHidden.has(key))
      ) {
        this.hiddenColumnKeys.set(new Set(normalizedHidden));
      }
    });
    afterEveryRender({
      mixedReadWrite: () => {
        this.syncVirtualRowMeasurement();
        this.syncPinnedColumnMeasurements();
        this.syncVirtualPinnedAlignment();
      },
    });
    this.destroyRef.onDestroy(() => {
      this.virtualFocusSubscription?.unsubscribe();
      this.virtualRowResizeObserver?.disconnect();
      this.virtualGridResizeObserver?.disconnect();
      this.observedVirtualGrid?.removeEventListener('scroll', this.handleVirtualGridScroll);
      this.platform.cancelAnimationFrame(this.virtualPinnedFrame);
      this.columnResizeObserver?.disconnect();
      this.restoreManagedTabIndexes();
    });
  }

  ngAfterViewChecked(): void {
    this.syncManagedTabStops();
  }

  protected value(row: T, column: KrnDataColumn<T>): unknown {
    return column.accessor
      ? column.accessor(row)
      : (row as unknown as Record<string, unknown>)[column.key];
  }

  protected cellText(row: T, column: KrnDataColumn<T>): string {
    const value = this.value(row, column);
    return column.format
      ? (column.format as (cellValue: unknown, currentRow: T) => string)(value, row)
      : String(value ?? '—');
  }

  protected columnLabel(column: KrnDataColumn<T>): string {
    return column.label?.trim() || column.key;
  }

  protected resolveCellTemplate(
    column: KrnDataColumn<T>,
  ): TemplateRef<KrnDataCellContext<T>> | null {
    return column.cellTemplate ?? this.defaultCellTemplate();
  }

  protected resolveHeaderTemplate(
    column: KrnDataColumn<T>,
  ): TemplateRef<KrnDataHeaderContext<T>> | null {
    return column.headerTemplate ?? this.defaultHeaderTemplate();
  }

  protected cellContext(row: T, column: KrnDataColumn<T>, rowIndex: number): KrnDataCellContext<T> {
    const value = this.value(row, column);
    return { $implicit: value, value, row, column, rowIndex };
  }

  protected headerContext(column: KrnDataColumn<T>, columnIndex: number): KrnDataHeaderContext<T> {
    return { $implicit: column, column, columnIndex };
  }

  protected rowContext(row: T, rowIndex: number): KrnDataRowContext<T> {
    return { $implicit: row, row, rowIndex };
  }

  protected setFilter(event: Event): void {
    this.filter.set((event.currentTarget as HTMLInputElement).value);
    this.page.set(1);
    this.emitQuery();
  }

  protected clearFilter(): void {
    this.filter.set('');
    this.page.set(1);
    this.emitQuery();
  }

  protected sort(column: KrnDataColumn<T>): void {
    if (!column.sortable) return;
    if (this.sortKey() === column.key) {
      this.sortDirection.update((direction) => (direction === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortKey.set(column.key);
      this.sortDirection.set('asc');
    }
    this.emitQuery();
  }

  protected goToPage(page: number): void {
    this.page.set(Math.max(1, Math.min(this.pageCount(), page)));
    this.emitQuery();
  }

  protected ariaSort(column: KrnDataColumn<T>): 'ascending' | 'descending' | 'none' | null {
    if (!column.sortable) return null;
    if (this.sortKey() !== column.key) return 'none';
    return this.sortDirection() === 'asc' ? 'ascending' : 'descending';
  }

  protected sortMark(column: KrnDataColumn<T>): string {
    if (this.sortKey() !== column.key) return '↕';
    return this.sortDirection() === 'asc' ? '↑' : '↓';
  }

  protected isSelected(occurrence: KrnDataRowOccurrence<T>): boolean {
    return this.selected().has(occurrence.key);
  }

  protected toggleRow(occurrence: KrnDataRowOccurrence<T>): void {
    this.toggleSet(this.selected, occurrence.key);
  }

  protected toggleAllVisible(): void {
    const next = new Set(this.selected());
    const allSelected = this.allVisibleSelected();
    this.visibleRows().forEach((occurrence) => {
      if (allSelected) next.delete(occurrence.key);
      else next.add(occurrence.key);
    });
    this.selected.set(next);
  }

  protected isExpanded(occurrence: KrnDataRowOccurrence<T>): boolean {
    return this.expanded().has(occurrence.key);
  }

  protected toggleExpanded(occurrence: KrnDataRowOccurrence<T>): void {
    this.toggleSet(this.expanded, occurrence.key);
  }

  protected isColumnVisible(key: string): boolean {
    return !this.normalizedHiddenColumnKeys().has(key);
  }

  protected setColumnVisible(key: string, event: Event): void {
    const visible = (event.currentTarget as HTMLInputElement).checked;
    if (!visible && this.visibleColumns().length === 1) return;
    const hidden = new Set(this.normalizedHiddenColumnKeys());
    if (visible) hidden.delete(key);
    else hidden.add(key);
    this.hiddenColumnKeys.set(hidden);
    this.activeCell.update((cell) => ({
      ...cell,
      column: Math.min(cell.column, Math.max(0, this.gridColumnCount() - 1)),
    }));
  }

  protected columnWidth(column: KrnDataColumn<T>): number {
    const minimum = this.columnMinWidth(column);
    const maximum = this.columnMaxWidth(column);
    const requested = this.widths()[column.key] ?? column.width ?? 180;
    const width = Number.isFinite(requested) ? requested : 180;
    return Math.min(maximum, Math.max(minimum, Math.round(width)));
  }

  protected columnMinWidth(column: KrnDataColumn<T>): number {
    return this.positiveInteger(column.minWidth, 96);
  }

  protected columnMaxWidth(column: KrnDataColumn<T>): number {
    return Math.max(this.columnMinWidth(column), this.positiveInteger(column.maxWidth, 960));
  }

  private pinnedColumnWidth(column: KrnDataColumn<T>): number {
    return this.measuredColumnWidths()[column.key] ?? this.columnWidth(column);
  }

  protected utilityColumnOffset(index: number): string {
    return index === 0 ? '0px' : `calc(${index} * var(--krn-data-utility-column-size, 2.75rem))`;
  }

  protected columnPinnedStart(column: KrnDataColumn<T>): string | null {
    if (column.pinned !== 'start') return null;
    const offset = this.pinnedColumnOffsets().start.get(column.key) ?? 0;
    const utilityColumns = this.dataColumnOffset();
    if (!utilityColumns) return `${offset}px`;
    const utilityOffset = `${utilityColumns} * var(--krn-data-utility-column-size, 2.75rem)`;
    return offset ? `calc(${utilityOffset} + ${offset}px)` : `calc(${utilityOffset})`;
  }

  protected columnPinnedEnd(column: KrnDataColumn<T>): string | null {
    if (column.pinned !== 'end') return null;
    return `${this.pinnedColumnOffsets().end.get(column.key) ?? 0}px`;
  }

  protected columnPinBoundary(column: KrnDataColumn<T>): KrnDataColumnPin | null {
    if (column.pinned === 'start' && this.pinnedBoundaryKeys().start === column.key) return 'start';
    if (column.pinned === 'end' && this.pinnedBoundaryKeys().end === column.key) return 'end';
    return null;
  }

  protected startResize(event: PointerEvent, column: KrnDataColumn<T>): void {
    const target = event.currentTarget as HTMLElement;
    target.setPointerCapture(event.pointerId);
    this.resizeState = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startWidth: this.columnWidth(column),
      key: column.key,
    };
  }

  protected resize(event: PointerEvent, column: KrnDataColumn<T>): void {
    const state = this.resizeState;
    if (!state || state.pointerId !== event.pointerId || state.key !== column.key) return;
    const direction = this.isRtl() ? -1 : 1;
    this.setColumnWidth(column, state.startWidth + (event.clientX - state.startX) * direction);
  }

  protected endResize(event: PointerEvent): void {
    const target = event.currentTarget as HTMLElement;
    if (target.hasPointerCapture(event.pointerId)) target.releasePointerCapture(event.pointerId);
    this.resizeState = undefined;
  }

  protected resizeWithKeyboard(event: KeyboardEvent, column: KrnDataColumn<T>): void {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const rtl = this.isRtl();
    const direction = event.key === 'ArrowRight' ? 1 : -1;
    this.setColumnWidth(column, this.columnWidth(column) + direction * (rtl ? -10 : 10));
  }

  protected isActionCell(row: number, column: number): boolean {
    const actionCell = this.actionCell();
    return actionCell?.row === row && actionCell.column === column;
  }

  protected onCellFocusIn(event: FocusEvent, row: number, column: number): void {
    this.activeCell.set({ row, column });
    const cell = this.eventCell(event, row, column);
    if (!cell) return;

    if (this.findActionTarget(cell, event.target)) {
      this.enterActionMode(cell, row, column, false);
    } else if (event.target === cell && this.actionCell()) {
      this.exitActionMode();
    }
  }

  protected onCellPointerDown(event: PointerEvent, row: number, column: number): void {
    const cell = this.eventCell(event, row, column);
    if (cell && this.findActionTarget(cell, event.target)) {
      this.enterActionMode(cell, row, column, false);
    }
  }

  protected onGridFocusOut(event: FocusEvent): void {
    const actionCell = this.actionCell();
    if (!actionCell) return;
    const grid = this.asHTMLElement(event.currentTarget);
    const next = event.relatedTarget;
    const NodeConstructor = this.platform.window?.Node;
    const cell = grid?.querySelector<HTMLElement>(
      `[data-cell="${actionCell.row}-${actionCell.column}"]`,
    );
    if (!cell || !NodeConstructor || !(next instanceof NodeConstructor) || !cell.contains(next)) {
      this.exitActionMode();
    }
  }

  protected onCellKeydown(
    event: KeyboardEvent,
    row: number,
    column: number,
    rowCount: number,
  ): void {
    const cell = this.eventCell(event, row, column);
    if (cell && event.target !== cell) {
      this.onActionKeydown(event, cell);
      return;
    }

    if ((event.key === 'Enter' || event.key === 'F2') && cell) {
      if (this.enterActionMode(cell, row, column, true)) {
        event.preventDefault();
        event.stopPropagation();
      }
      return;
    }

    if (event.key === 'Tab') return;

    let nextRow = row;
    let nextColumn = column;
    const horizontalDirection = this.isRtl() ? -1 : 1;
    if (event.key === 'ArrowRight') nextColumn += horizontalDirection;
    else if (event.key === 'ArrowLeft') nextColumn -= horizontalDirection;
    else if (event.key === 'ArrowDown') nextRow += 1;
    else if (event.key === 'ArrowUp') nextRow -= 1;
    else if (event.key === 'PageDown')
      nextRow += Math.max(1, Math.floor(this.normalizedViewportHeight() / this.rowHeight()));
    else if (event.key === 'PageUp')
      nextRow -= Math.max(1, Math.floor(this.normalizedViewportHeight() / this.rowHeight()));
    else if (event.key === 'Home' && event.ctrlKey) {
      nextRow = -1;
      nextColumn = 0;
    } else if (event.key === 'End' && event.ctrlKey) {
      nextRow = rowCount - 1;
      nextColumn = this.gridColumnCount() - 1;
    } else if (event.key === 'Home') nextColumn = 0;
    else if (event.key === 'End') nextColumn = this.gridColumnCount() - 1;
    else return;

    event.preventDefault();
    nextRow = Math.max(-1, Math.min(rowCount - 1, nextRow));
    nextColumn = Math.max(0, Math.min(this.gridColumnCount() - 1, nextColumn));
    this.activeCell.set({ row: nextRow, column: nextColumn });
    this.focusCell(nextRow, nextColumn);
  }

  private onActionKeydown(event: KeyboardEvent, cell: HTMLElement): void {
    if (event.key === 'Escape' || event.key === 'F2') {
      event.preventDefault();
      event.stopPropagation();
      this.exitActionMode();
      cell.focus({ preventScroll: true });
      return;
    }

    if (event.key !== 'Tab') return;

    const actions = this.actionableDescendants(cell);
    const target = this.asElement(event.target);
    const currentIndex = actions.findIndex(
      (action) => action === target || (target ? action.contains(target) : false),
    );
    const direction = event.shiftKey ? -1 : 1;
    const nextAction = actions[currentIndex + direction];
    if (nextAction) {
      event.preventDefault();
      event.stopPropagation();
      nextAction.focus({ preventScroll: true });
      return;
    }

    if (direction < 0) {
      event.preventDefault();
      event.stopPropagation();
      this.exitActionMode();
      cell.focus({ preventScroll: true });
      return;
    }

    this.platform.queueMicrotask(() => this.exitActionMode());
  }

  private enterActionMode(
    cell: HTMLElement,
    row: number,
    column: number,
    focusFirst: boolean,
  ): boolean {
    const actions = this.actionableDescendants(cell);
    if (!actions.length) return false;

    this.actionCell.set({ row, column });
    this.syncManagedTabStops();
    if (focusFirst) {
      this.platform.queueMicrotask(() => actions[0]?.focus({ preventScroll: true }));
    }
    return true;
  }

  private exitActionMode(): void {
    if (!this.actionCell()) return;
    this.actionCell.set(null);
    this.syncManagedTabStops();
  }

  private syncManagedTabStops(): void {
    const cells = [...this.host.nativeElement.querySelectorAll<HTMLElement>(GRID_CELL_SELECTOR)];
    const liveActions = new Set<KrnDataGridActionElement>();
    const actionCell = this.actionCell();
    let actionCellRendered = actionCell === null;

    for (const cell of cells) {
      const position = this.cellPosition(cell);
      const inActionMode =
        position !== null &&
        actionCell?.row === position.row &&
        actionCell.column === position.column;
      if (inActionMode) actionCellRendered = true;

      for (const action of this.actionableDescendants(cell)) {
        liveActions.add(action);
        if (!action.hasAttribute('data-grid-action')) {
          this.setManagedTabIndex(action, inActionMode);
        }
      }
    }

    for (const [action, originalTabIndex] of this.managedTabIndexes) {
      if (liveActions.has(action)) continue;
      this.restoreTabIndex(action, originalTabIndex);
      this.managedTabIndexes.delete(action);
    }

    if (!actionCellRendered) {
      this.actionCell.set(null);
    }
  }

  private actionableDescendants(cell: HTMLElement): readonly KrnDataGridActionElement[] {
    return [...cell.querySelectorAll<KrnDataGridActionElement>(GRID_CELL_ACTION_SELECTOR)].filter(
      (element) => {
        if (element.closest<HTMLElement>(GRID_CELL_SELECTOR) !== cell) return false;
        if (
          element.hasAttribute('disabled') ||
          element.getAttribute('aria-disabled') === 'true' ||
          ('hidden' in element && element.hidden === true) ||
          element.closest('[inert]')
        ) {
          return false;
        }
        if (element.hasAttribute('data-grid-action')) return true;
        if (this.managedTabIndexes.has(element)) return true;
        if (element.tabIndex < 0) return false;

        this.managedTabIndexes.set(element, element.getAttribute('tabindex'));
        return true;
      },
    );
  }

  private findActionTarget(
    cell: HTMLElement,
    target: EventTarget | null,
  ): KrnDataGridActionElement | null {
    const element = this.asElement(target);
    const action = element?.closest<KrnDataGridActionElement>(GRID_CELL_ACTION_SELECTOR) ?? null;
    return action && this.actionableDescendants(cell).includes(action) ? action : null;
  }

  private setManagedTabIndex(element: KrnDataGridActionElement, enabled: boolean): void {
    const originalTabIndex = this.managedTabIndexes.get(element);
    if (originalTabIndex === undefined && !this.managedTabIndexes.has(element)) return;

    if (enabled) {
      this.restoreTabIndex(element, originalTabIndex ?? null);
    } else if (element.getAttribute('tabindex') !== '-1') {
      element.setAttribute('tabindex', '-1');
    }
  }

  private restoreManagedTabIndexes(): void {
    for (const [element, originalTabIndex] of this.managedTabIndexes) {
      this.restoreTabIndex(element, originalTabIndex);
    }
    this.managedTabIndexes.clear();
  }

  private restoreTabIndex(
    element: KrnDataGridActionElement,
    originalTabIndex: string | null,
  ): void {
    if (originalTabIndex === null) {
      element.removeAttribute('tabindex');
    } else if (element.getAttribute('tabindex') !== originalTabIndex) {
      element.setAttribute('tabindex', originalTabIndex);
    }
  }

  private syncPinnedColumnMeasurements(): void {
    const hasPinnedColumns = this.visibleColumns().some((column) => column.pinned !== undefined);
    if (!hasPinnedColumns) {
      this.columnResizeObserver?.disconnect();
      this.columnResizeObserver = null;
      this.observedColumnHeaders.clear();
      if (Object.keys(this.measuredColumnWidths()).length) this.measuredColumnWidths.set({});
      return;
    }

    const headers = [
      ...this.host.nativeElement.querySelectorAll<HTMLElement>(
        '.virtual-header [data-column-key], thead [data-column-key]',
      ),
    ];
    const headersChanged =
      headers.length !== this.observedColumnHeaders.size ||
      headers.some((header) => !this.observedColumnHeaders.has(header));
    if (headersChanged) {
      this.columnResizeObserver?.disconnect();
      this.columnResizeObserver = null;
      this.observedColumnHeaders.clear();
      headers.forEach((header) => this.observedColumnHeaders.add(header));

      const ResizeObserverConstructor = this.platform.window?.ResizeObserver;
      if (ResizeObserverConstructor) {
        this.columnResizeObserver = new ResizeObserverConstructor(() =>
          this.measurePinnedColumnHeaders(),
        );
        headers.forEach((header) => this.columnResizeObserver?.observe(header));
      }
    }

    this.measurePinnedColumnHeaders();
  }

  private measurePinnedColumnHeaders(): void {
    const measured: Record<string, number> = {};
    for (const header of this.observedColumnHeaders) {
      const key = header.dataset['columnKey'];
      const width = header.getBoundingClientRect().width;
      if (!key || !Number.isFinite(width) || width < 1) continue;
      measured[key] = Math.round(width * 100) / 100;
    }

    const current = this.measuredColumnWidths();
    const keys = Object.keys(measured);
    if (
      keys.length === Object.keys(current).length &&
      keys.every((key) => Math.abs((current[key] ?? 0) - (measured[key] ?? 0)) < 0.25)
    ) {
      return;
    }
    this.measuredColumnWidths.set(measured);
  }

  private syncVirtualPinnedAlignment(): void {
    const grid = this.isVirtual()
      ? this.host.nativeElement.querySelector<HTMLElement>('.virtual-grid')
      : null;
    if (grid !== this.observedVirtualGrid) {
      this.observedVirtualGrid?.removeEventListener('scroll', this.handleVirtualGridScroll);
      this.virtualGridResizeObserver?.disconnect();
      this.virtualGridResizeObserver = null;
      this.platform.cancelAnimationFrame(this.virtualPinnedFrame);
      this.virtualPinnedFrame = null;
      this.observedVirtualGrid = grid;

      const ResizeObserverConstructor = this.platform.window?.ResizeObserver;
      if (grid) {
        this.ngZone.runOutsideAngular(() => {
          grid.addEventListener('scroll', this.handleVirtualGridScroll, { passive: true });
          if (ResizeObserverConstructor) {
            this.virtualGridResizeObserver = new ResizeObserverConstructor(() =>
              this.scheduleVirtualPinnedAlignment(grid),
            );
            this.virtualGridResizeObserver.observe(grid);
          }
        });
      }
    }

    if (grid) this.scheduleVirtualPinnedAlignment(grid);
  }

  private scheduleVirtualPinnedAlignment(grid: HTMLElement): void {
    if (this.virtualPinnedFrame !== null) return;

    const frame = this.ngZone.runOutsideAngular(() =>
      this.platform.requestAnimationFrame(() => {
        this.virtualPinnedFrame = null;
        if (grid === this.observedVirtualGrid) this.alignVirtualPinnedCells(grid);
      }),
    );
    if (frame === null) {
      this.alignVirtualPinnedCells(grid);
    } else {
      this.virtualPinnedFrame = frame;
    }
  }

  private alignVirtualPinnedCells(grid: HTMLElement): void {
    for (const edge of ['start', 'end'] as const) {
      const property = `--krn-virtual-pin-${edge}-translate`;
      const bodyCell = grid.querySelector<HTMLElement>(
        `.virtual-row > [data-pinned="${edge}"][data-cell]`,
      );
      const position = bodyCell ? this.cellPosition(bodyCell) : null;
      const headerCell = position
        ? grid.querySelector<HTMLElement>(`[data-cell="-1-${position.column}"]`)
        : null;
      if (!bodyCell || !headerCell) {
        grid.style.setProperty(property, '0px');
        continue;
      }

      const current = Number.parseFloat(grid.style.getPropertyValue(property)) || 0;
      const delta = headerCell.getBoundingClientRect().left - bodyCell.getBoundingClientRect().left;
      if (Math.abs(delta) < 0.25) continue;

      const next = Math.round((current + delta) * 100) / 100;
      grid.style.setProperty(property, `${next}px`);
    }
  }

  private syncVirtualRowMeasurement(): void {
    const row = this.isVirtual()
      ? this.host.nativeElement.querySelector<HTMLElement>('.virtual-row-measure')
      : null;
    if (row === this.observedVirtualRow) {
      if (row) this.measureVirtualRow(row);
      return;
    }

    this.virtualRowResizeObserver?.disconnect();
    this.virtualRowResizeObserver = null;
    this.observedVirtualRow = row;
    if (!row) {
      this.measuredVirtualRowHeight.set(null);
      return;
    }

    this.measureVirtualRow(row);
    const ResizeObserverConstructor = this.platform.window?.ResizeObserver;
    if (!ResizeObserverConstructor) return;

    this.virtualRowResizeObserver = new ResizeObserverConstructor(() => {
      if (this.observedVirtualRow) this.measureVirtualRow(this.observedVirtualRow);
    });
    this.virtualRowResizeObserver.observe(row);
  }

  private measureVirtualRow(row: HTMLElement): void {
    const measured = row.getBoundingClientRect().height;
    if (!Number.isFinite(measured) || measured < 1) return;

    const nextHeight = Math.round(measured * 100) / 100;
    if (Math.abs((this.measuredVirtualRowHeight() ?? 0) - nextHeight) < 0.25) return;

    this.measuredVirtualRowHeight.set(nextHeight);
    this.platform.queueMicrotask(() => this.viewport()?.checkViewportSize());
  }

  private eventCell(event: Event, row: number, column: number): HTMLElement | null {
    const currentTarget = this.asHTMLElement(event.currentTarget);
    return currentTarget?.matches(GRID_CELL_SELECTOR)
      ? currentTarget
      : this.host.nativeElement.querySelector<HTMLElement>(`[data-cell="${row}-${column}"]`);
  }

  private cellPosition(cell: HTMLElement): KrnDataGridCellPosition | null {
    const match = /^(-?\d+)-(\d+)$/.exec(cell.getAttribute('data-cell') ?? '');
    if (!match) return null;
    return { row: Number(match[1]), column: Number(match[2]) };
  }

  private asHTMLElement(target: EventTarget | null): HTMLElement | null {
    const HTMLElementConstructor = this.platform.window?.HTMLElement;
    return HTMLElementConstructor && target instanceof HTMLElementConstructor ? target : null;
  }

  private asElement(target: EventTarget | null): Element | null {
    const ElementConstructor = this.platform.window?.Element;
    return ElementConstructor && target instanceof ElementConstructor ? target : null;
  }

  private focusCell(row: number, column: number): void {
    const focus = (): void => {
      this.focusRenderedCell(
        this.host.nativeElement.querySelector<HTMLElement>(`[data-cell="${row}-${column}"]`),
        row,
        column,
      );
    };
    if (!this.isVirtual() || row < 0) {
      this.platform.queueMicrotask(focus);
      return;
    }

    const viewport = this.viewport();
    this.virtualFocusSubscription?.unsubscribe();
    const rendered = viewport?.renderedRangeStream
      .pipe(
        filter((range) => range.start <= row && row < range.end),
        take(1),
      )
      .subscribe(() =>
        this.platform.queueMicrotask(() => {
          focus();
          if (this.virtualFocusSubscription === rendered) this.virtualFocusSubscription = null;
        }),
      );
    this.virtualFocusSubscription = rendered ?? null;
    viewport?.scrollToIndex(row, 'auto');
    this.platform.queueMicrotask(() => {
      viewport?.checkViewportSize();
      const element = this.host.nativeElement.querySelector<HTMLElement>(
        `[data-cell="${row}-${column}"]`,
      );
      if (element) {
        this.virtualFocusSubscription?.unsubscribe();
        this.virtualFocusSubscription = null;
        this.focusRenderedCell(element, row, column);
      }
    });
  }

  private focusRenderedCell(cell: HTMLElement | null, row: number, column: number): void {
    if (!cell) return;

    cell.focus({ preventScroll: true });
    const inlineTarget =
      this.isVirtual() && row >= 0
        ? this.host.nativeElement.querySelector<HTMLElement>(`[data-cell="-1-${column}"]`)
        : cell;
    inlineTarget?.scrollIntoView?.({
      block: 'nearest',
      inline: 'nearest',
      container: 'nearest',
    } as ScrollIntoViewOptions);
  }

  private emitQuery(): void {
    this.queryChange.emit({
      filter: this.filter(),
      page: this.currentPage(),
      pageSize: this.normalizedPageSize(),
      sortKey: this.sortKey(),
      sortDirection: this.sortDirection(),
    });
  }

  private setColumnWidth(column: KrnDataColumn<T>, width: number): void {
    const minimum = this.columnMinWidth(column);
    const maximum = this.columnMaxWidth(column);
    const nextWidth = Math.min(maximum, Math.max(minimum, Math.round(width)));
    this.widths.update((current) => ({ ...current, [column.key]: nextWidth }));
  }

  private isRtl(): boolean {
    const element = this.host.nativeElement;
    return this.platform.window?.getComputedStyle(element).direction === 'rtl';
  }

  private positiveInteger(value: number | undefined, fallback: number): number {
    return typeof value === 'number' && Number.isFinite(value) && value > 0
      ? Math.max(1, Math.floor(value))
      : fallback;
  }

  private toggleSet(
    target: {
      set(value: ReadonlySet<KrnDataRowKey>): void;
      (): ReadonlySet<KrnDataRowKey>;
    },
    key: KrnDataRowKey,
  ): void {
    const next = new Set(target());
    if (next.has(key)) next.delete(key);
    else next.add(key);
    target.set(next);
  }
}

export { KrnDataGrid as KrnDataTable };
