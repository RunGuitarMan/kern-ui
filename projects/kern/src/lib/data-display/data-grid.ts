import { ScrollingModule } from '@angular/cdk/scrolling';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  inject,
  input,
  model,
  signal,
} from '@angular/core';

export interface KrnDataColumn<T extends Record<string, unknown>> {
  readonly key: Extract<keyof T, string>;
  readonly label: string;
  readonly sortable?: boolean;
  readonly width?: number;
  readonly minWidth?: number;
  readonly maxWidth?: number;
  readonly align?: 'start' | 'center' | 'end';
  readonly priority?: 'primary' | 'secondary' | 'tertiary';
  readonly format?: (value: T[Extract<keyof T, string>], row: T) => string;
}

type RowKey = string | number;
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'krn-data-grid, krn-data-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ScrollingModule],
  host: {
    '[attr.aria-busy]': 'loading()',
    '[attr.data-compact]': 'compact() ? "" : null',
  },
  template: `
    <section class="grid-shell" [attr.aria-label]="ariaLabel()">
      @if (filterable()) {
        <div class="toolbar">
          <label>
            <span class="sr-only">Filter {{ ariaLabel() }}</span>
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              [value]="filter()"
              [placeholder]="filterPlaceholder()"
              (input)="setFilter($event)"
            />
          </label>
          <span class="result-count" aria-live="polite">{{ processed().length }} rows</span>
        </div>
      }

      @if (error()) {
        <div class="state error" role="alert">
          <strong>Could not load data</strong>
          <span>{{ error() }}</span>
        </div>
      } @else if (loading()) {
        <div class="loading" role="status" aria-label="Loading data">
          @for (row of loadingRows; track row) {
            <span></span>
          }
        </div>
      } @else if (!processed().length) {
        <div class="state" role="status">
          <strong>{{ emptyLabel() }}</strong>
          @if (filter()) {
            <button type="button" (click)="filter.set('')">Clear filter</button>
          }
        </div>
      } @else if (virtualize()) {
        <div class="virtual-grid" role="grid" [attr.aria-rowcount]="processed().length + 1">
          <div class="virtual-header" role="row">
            @if (selectable()) {
              <div role="columnheader" class="selection-cell">
                <input
                  type="checkbox"
                  aria-label="Select all visible rows"
                  [checked]="allVisibleSelected()"
                  [indeterminate]="someVisibleSelected()"
                  (change)="toggleAllVisible()"
                />
              </div>
            }
            @for (column of columns(); track column.key; let columnIndex = $index) {
              <div
                role="columnheader"
                [attr.aria-sort]="ariaSort(column)"
                [style.inline-size.px]="columnWidth(column)"
                [attr.data-priority]="column.priority ?? 'secondary'"
              >
                @if (column.sortable) {
                  <button type="button" (click)="sort(column)">
                    {{ column.label }}
                    <span aria-hidden="true">{{ sortMark(column) }}</span>
                  </button>
                } @else {
                  {{ column.label }}
                }
              </div>
            }
          </div>
          <cdk-virtual-scroll-viewport
            [itemSize]="rowHeight()"
            [style.block-size.px]="viewportHeight()"
            [minBufferPx]="rowHeight() * 5"
            [maxBufferPx]="rowHeight() * 10"
          >
            <div
              *cdkVirtualFor="let row of processed(); let rowIndex = index; trackBy: trackRow"
              class="virtual-row"
              role="row"
              [attr.aria-rowindex]="rowIndex + 2"
              [attr.aria-selected]="isSelected(row, rowIndex)"
            >
              @if (selectable()) {
                <div role="gridcell" class="selection-cell">
                  <input
                    type="checkbox"
                    [checked]="isSelected(row, rowIndex)"
                    [attr.aria-label]="'Select row ' + (rowIndex + 1)"
                    (change)="toggleRow(row, rowIndex)"
                  />
                </div>
              }
              @for (column of columns(); track column.key; let columnIndex = $index) {
                <div
                  role="gridcell"
                  [style.inline-size.px]="columnWidth(column)"
                  [attr.data-align]="column.align ?? 'start'"
                  [attr.data-priority]="column.priority ?? 'secondary'"
                  [attr.tabindex]="activeCell().row === rowIndex && activeCell().column === columnIndex ? 0 : -1"
                  [attr.data-cell]="rowIndex + '-' + columnIndex"
                  (focus)="activeCell.set({ row: rowIndex, column: columnIndex })"
                  (keydown)="onCellKeydown($event, rowIndex, columnIndex, processed().length)"
                >
                  {{ cell(row, column) }}
                </div>
              }
            </div>
          </cdk-virtual-scroll-viewport>
        </div>
      } @else {
        <div class="table-scroll" tabindex="0" aria-label="Scrollable data table">
          <table>
            <thead>
              <tr>
                @if (selectable()) {
                  <th class="selection-cell">
                    <input
                      type="checkbox"
                      aria-label="Select all rows on this page"
                      [checked]="allVisibleSelected()"
                      [indeterminate]="someVisibleSelected()"
                      (change)="toggleAllVisible()"
                    />
                  </th>
                }
                @if (expandable()) {
                  <th class="expand-cell"><span class="sr-only">Expand</span></th>
                }
                @for (column of columns(); track column.key; let columnIndex = $index) {
                  <th
                    scope="col"
                    [attr.aria-sort]="ariaSort(column)"
                    [style.inline-size.px]="columnWidth(column)"
                    [attr.data-align]="column.align ?? 'start'"
                    [attr.data-priority]="column.priority ?? 'secondary'"
                  >
                    @if (column.sortable) {
                      <button type="button" (click)="sort(column)">
                        {{ column.label }}
                        <span aria-hidden="true">{{ sortMark(column) }}</span>
                      </button>
                    } @else {
                      {{ column.label }}
                    }
                    @if (resizable()) {
                      <span
                        class="resize-handle"
                        role="separator"
                        aria-orientation="vertical"
                        [attr.aria-label]="'Resize ' + column.label"
                        [attr.aria-valuemin]="column.minWidth ?? 96"
                        [attr.aria-valuemax]="column.maxWidth ?? 960"
                        [attr.aria-valuenow]="columnWidth(column)"
                        [attr.aria-valuetext]="columnWidth(column) + ' pixels'"
                        [attr.tabindex]="0"
                        (pointerdown)="startResize($event, column)"
                        (pointermove)="resize($event, column)"
                        (pointerup)="endResize($event)"
                        (keydown)="resizeWithKeyboard($event, column)"
                      ></span>
                    }
                  </th>
                }
              </tr>
            </thead>
            <tbody>
              @for (row of pageRows(); track rowKey(row, $index); let rowIndex = $index) {
                <tr [attr.data-selected]="isSelected(row, rowIndex) ? '' : null">
                  @if (selectable()) {
                    <td class="selection-cell">
                      <input
                        type="checkbox"
                        [checked]="isSelected(row, rowIndex)"
                        [attr.aria-label]="'Select row ' + (rowOffset() + rowIndex + 1)"
                        (change)="toggleRow(row, rowIndex)"
                      />
                    </td>
                  }
                  @if (expandable()) {
                    <td class="expand-cell">
                      <button
                        type="button"
                        [attr.aria-label]="isExpanded(row, rowIndex) ? 'Collapse row' : 'Expand row'"
                        [attr.aria-expanded]="isExpanded(row, rowIndex)"
                        (click)="toggleExpanded(row, rowIndex)"
                      >
                        <span aria-hidden="true">{{ isExpanded(row, rowIndex) ? '−' : '+' }}</span>
                      </button>
                    </td>
                  }
                  @for (column of columns(); track column.key; let columnIndex = $index) {
                    <td
                      [attr.data-align]="column.align ?? 'start'"
                      [attr.data-priority]="column.priority ?? 'secondary'"
                      [attr.tabindex]="activeCell().row === rowIndex && activeCell().column === columnIndex ? 0 : -1"
                      [attr.data-cell]="rowIndex + '-' + columnIndex"
                      (focus)="activeCell.set({ row: rowIndex, column: columnIndex })"
                      (keydown)="onCellKeydown($event, rowIndex, columnIndex, pageRows().length)"
                    >
                      {{ cell(row, column) }}
                    </td>
                  }
                </tr>
                @if (expandable() && isExpanded(row, rowIndex)) {
                  <tr class="detail-row">
                    <td [attr.colspan]="columns().length + (selectable() ? 1 : 0) + 1">
                      {{ expandedContent()(row) }}
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      }

      @if (!virtualize() && pagination() && processed().length) {
        <div class="pagination" aria-label="Table pagination">
          <span>{{ pageStart() }}–{{ pageEnd() }} of {{ processed().length }}</span>
          <div>
            <button type="button" [disabled]="page() === 1" (click)="page.update(previousPage)">Previous</button>
            <button type="button" [disabled]="page() >= pageCount()" (click)="page.update(nextPage)">Next</button>
          </div>
        </div>
      }
    </section>
  `,
  styles: `
    :host {
      display: block;
      min-inline-size: 0;
      container: krn-data-grid / inline-size;
      color: var(--krn-color-text, #252932);
      font: var(--krn-font-body-sm, 500 0.8125rem/1.25rem sans-serif);
    }
    .grid-shell {
      overflow: clip;
      border: 1px solid var(--krn-color-border-subtle, #e0e3e7);
      border-radius: var(--krn-radius-surface, 0.75rem);
      background: var(--krn-color-surface, #fff);
    }
    .toolbar,
    .pagination {
      display: flex;
      min-block-size: 3rem;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding-inline: 0.75rem;
    }
    .toolbar {
      border-block-end: 1px solid var(--krn-color-border-subtle, #e0e3e7);
    }
    .toolbar label {
      display: flex;
      flex: 1;
      align-items: center;
      gap: 0.5rem;
      max-inline-size: 22rem;
    }
    .toolbar input {
      inline-size: 100%;
      min-block-size: 2rem;
      border: 0;
      color: inherit;
      background: transparent;
      font: inherit;
    }
    .toolbar input:focus-visible {
      border-radius: 0.25rem;
      outline: var(--krn-focus-ring, 2px solid #4f6feb);
      outline-offset: 2px;
    }
    .result-count,
    .pagination {
      color: var(--krn-color-text-muted, #626a76);
      font-variant-numeric: tabular-nums;
    }
    .table-scroll {
      max-inline-size: 100%;
      overflow: auto;
      outline: none;
    }
    .table-scroll:focus-visible {
      box-shadow: inset 0 0 0 2px var(--krn-color-focus, #4f6feb);
    }
    table {
      inline-size: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }
    th,
    td {
      position: relative;
      block-size: var(--krn-data-row-size, 2.75rem);
      padding: 0.625rem 0.75rem;
      border-block-end: 1px solid var(--krn-color-border-subtle, #e0e3e7);
      overflow: hidden;
      text-align: start;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    th {
      position: sticky;
      z-index: 2;
      inset-block-start: 0;
      color: var(--krn-color-text-muted, #626a76);
      background: var(--krn-color-surface-raised, #f2f3f5);
      font-weight: 650;
    }
    th button,
    .expand-cell button,
    .pagination button,
    .state button {
      border: 0;
      color: inherit;
      background: transparent;
      font: inherit;
      cursor: pointer;
    }
    th > button {
      display: flex;
      inline-size: 100%;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      text-align: start;
    }
    button:focus-visible,
    [role='gridcell']:focus-visible,
    td:focus-visible {
      border-radius: 0.25rem;
      outline: var(--krn-focus-ring, 2px solid #4f6feb);
      outline-offset: -3px;
    }
    tr[data-selected] td,
    .virtual-row[aria-selected='true'] {
      background: var(--krn-color-brand-surface, #fff0e8);
    }
    [data-align='center'] {
      text-align: center;
    }
    [data-align='end'] {
      text-align: end;
      font-variant-numeric: tabular-nums;
    }
    .selection-cell,
    .expand-cell {
      inline-size: 2.75rem;
      text-align: center;
    }
    .selection-cell input {
      inline-size: 1rem;
      block-size: 1rem;
      accent-color: var(--krn-color-brand-solid, #4f6feb);
    }
    .resize-handle {
      position: absolute;
      inset-block: 0;
      inset-inline-end: -0.25rem;
      inline-size: 0.5rem;
      cursor: col-resize;
      touch-action: none;
    }
    .resize-handle::after {
      position: absolute;
      inset-block: 0.375rem;
      inset-inline-start: 0.25rem;
      inline-size: 1px;
      background: var(--krn-color-border, #cdd1d7);
      content: '';
    }
    .resize-handle:focus-visible::after {
      inline-size: 2px;
      background: var(--krn-color-focus, #4f6feb);
    }
    .detail-row td {
      padding: 1rem 3.5rem;
      color: var(--krn-color-text-muted, #626a76);
      background: var(--krn-color-surface-raised, #f2f3f5);
      white-space: normal;
    }
    .pagination {
      border-block-start: 1px solid var(--krn-color-border-subtle, #e0e3e7);
    }
    .pagination div {
      display: flex;
      gap: 0.375rem;
    }
    .pagination button {
      min-block-size: 2rem;
      padding-inline: 0.625rem;
      border: 1px solid var(--krn-color-border, #cdd1d7);
      border-radius: var(--krn-radius-control, 0.375rem);
      background: var(--krn-color-surface, #fff);
    }
    .pagination button:disabled {
      opacity: var(--krn-opacity-disabled, 0.48);
      cursor: not-allowed;
    }
    .state {
      display: grid;
      min-block-size: 12rem;
      place-content: center;
      gap: 0.5rem;
      padding: 2rem;
      color: var(--krn-color-text-muted, #626a76);
      text-align: center;
    }
    .state strong {
      color: var(--krn-color-text, #252932);
    }
    .state button {
      color: var(--krn-color-brand-text, #1d4ed8);
      text-decoration: underline;
    }
    .error strong {
      color: var(--krn-color-danger-text, #a02d2d);
    }
    .loading {
      display: grid;
      gap: 1px;
      background: var(--krn-color-border-subtle, #e0e3e7);
    }
    .loading span {
      block-size: var(--krn-data-row-size, 2.75rem);
      background:
        linear-gradient(
            90deg,
            transparent,
            color-mix(in srgb, var(--krn-color-surface, #fff), #9199a5 15%),
            transparent
          )
          0 0 / 16rem 100% no-repeat,
        var(--krn-color-surface, #fff);
      animation: scan 1.4s linear infinite;
    }
    .virtual-grid {
      min-inline-size: max-content;
    }
    .virtual-header,
    .virtual-row {
      display: flex;
      min-inline-size: max-content;
    }
    .virtual-header {
      position: sticky;
      z-index: 2;
      inset-block-start: 0;
      background: var(--krn-color-surface-raised, #f2f3f5);
      font-weight: 650;
    }
    .virtual-header > *,
    .virtual-row > * {
      flex: 0 0 auto;
      block-size: var(--krn-data-row-size, 2.75rem);
      padding: 0.625rem 0.75rem;
      border-block-end: 1px solid var(--krn-color-border-subtle, #e0e3e7);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    @keyframes scan {
      to {
        background-position-x: calc(100% + 16rem);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .loading span {
        animation: none;
      }
    }
    @container krn-data-grid (max-width: 38rem) {
      [data-priority='tertiary'] {
        display: none;
      }
    }
    @container krn-data-grid (max-width: 28rem) {
      [data-priority='secondary'] {
        display: none;
      }
      .toolbar,
      .pagination {
        align-items: stretch;
        flex-direction: column;
        padding-block: 0.625rem;
      }
    }
    .sr-only {
      position: absolute;
      inline-size: 1px;
      block-size: 1px;
      overflow: hidden;
      clip-path: inset(50%);
    }
  `,
})
export class KrnDataGrid<T extends Record<string, unknown>> {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly data = input.required<readonly T[]>();
  readonly columns = input.required<readonly KrnDataColumn<T>[]>();
  readonly ariaLabel = input('Data grid');
  readonly rowIdentity = input<(row: T, index: number) => RowKey>((_row, index) => index);
  readonly loading = input(false, { transform: booleanAttribute });
  readonly error = input('');
  readonly emptyLabel = input('No data to display');
  readonly filterable = input(true, { transform: booleanAttribute });
  readonly filterPlaceholder = input('Filter rows…');
  readonly selectable = input(false, { transform: booleanAttribute });
  readonly expandable = input(false, { transform: booleanAttribute });
  readonly expandedContent = input<(row: T) => string>(() => '');
  readonly resizable = input(true, { transform: booleanAttribute });
  readonly pagination = input(true, { transform: booleanAttribute });
  readonly compact = input(false, { transform: booleanAttribute });
  readonly virtualize = input(false, { transform: booleanAttribute });
  readonly viewportHeight = input(360);
  readonly pageSize = input(10);
  readonly rowHeight = computed(() => (this.compact() ? 36 : 44));

  readonly filter = model('');
  readonly page = model(1);
  readonly selected = model<ReadonlySet<RowKey>>(new Set<RowKey>());
  readonly expanded = model<ReadonlySet<RowKey>>(new Set<RowKey>());
  readonly sortKey = model<string>('');
  readonly sortDirection = model<SortDirection>('asc');
  readonly activeCell = signal({ row: 0, column: 0 });
  readonly widths = signal<Readonly<Record<string, number>>>({});

  readonly processed = computed(() => {
    const query = this.filter().trim().toLocaleLowerCase();
    let result = query
      ? this.data().filter((row) =>
          this.columns().some((column) => this.cell(row, column).toLocaleLowerCase().includes(query)),
        )
      : [...this.data()];
    const key = this.sortKey();
    if (key) {
      const direction = this.sortDirection() === 'asc' ? 1 : -1;
      result = result.sort((left, right) => {
        const leftValue = left[key];
        const rightValue = right[key];
        return String(leftValue ?? '').localeCompare(String(rightValue ?? ''), undefined, {
          numeric: true,
          sensitivity: 'base',
        }) * direction;
      });
    }
    return result;
  });

  readonly pageCount = computed(() => Math.max(1, Math.ceil(this.processed().length / this.pageSize())));
  readonly rowOffset = computed(() => (Math.min(this.page(), this.pageCount()) - 1) * this.pageSize());
  readonly pageRows = computed(() =>
    this.pagination()
      ? this.processed().slice(this.rowOffset(), this.rowOffset() + this.pageSize())
      : this.processed(),
  );
  readonly visibleRows = computed(() => (this.virtualize() ? this.processed() : this.pageRows()));
  readonly pageStart = computed(() => (this.processed().length ? this.rowOffset() + 1 : 0));
  readonly pageEnd = computed(() => Math.min(this.rowOffset() + this.pageRows().length, this.processed().length));
  readonly allVisibleSelected = computed(
    () =>
      this.visibleRows().length > 0 &&
      this.visibleRows().every((row, index) => this.selected().has(this.rowKey(row, index))),
  );
  readonly someVisibleSelected = computed(
    () =>
      !this.allVisibleSelected() &&
      this.visibleRows().some((row, index) => this.selected().has(this.rowKey(row, index))),
  );

  readonly loadingRows = [0, 1, 2, 3, 4];
  readonly previousPage = (value: number): number => Math.max(1, value - 1);
  readonly nextPage = (value: number): number => Math.min(this.pageCount(), value + 1);
  readonly trackRow = (index: number, row: T): RowKey => this.rowKey(row, index);

  private resizeState:
    | { readonly pointerId: number; readonly startX: number; readonly startWidth: number; readonly key: string }
    | undefined;

  cell(row: T, column: KrnDataColumn<T>): string {
    const value = row[column.key];
    return column.format ? column.format(value, row) : String(value ?? '—');
  }

  setFilter(event: Event): void {
    this.filter.set((event.currentTarget as HTMLInputElement).value);
    this.page.set(1);
  }

  sort(column: KrnDataColumn<T>): void {
    if (!column.sortable) return;
    if (this.sortKey() === column.key) {
      this.sortDirection.update((direction) => (direction === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortKey.set(column.key);
      this.sortDirection.set('asc');
    }
  }

  ariaSort(column: KrnDataColumn<T>): 'ascending' | 'descending' | 'none' | null {
    if (!column.sortable) return null;
    if (this.sortKey() !== column.key) return 'none';
    return this.sortDirection() === 'asc' ? 'ascending' : 'descending';
  }

  sortMark(column: KrnDataColumn<T>): string {
    if (this.sortKey() !== column.key) return '↕';
    return this.sortDirection() === 'asc' ? '↑' : '↓';
  }

  rowKey(row: T, localIndex: number): RowKey {
    return this.rowIdentity()(row, this.rowOffset() + localIndex);
  }

  isSelected(row: T, index: number): boolean {
    return this.selected().has(this.rowKey(row, index));
  }

  toggleRow(row: T, index: number): void {
    this.toggleSet(this.selected, this.rowKey(row, index));
  }

  toggleAllVisible(): void {
    const next = new Set(this.selected());
    const allSelected = this.allVisibleSelected();
    this.visibleRows().forEach((row, index) => {
      const key = this.rowKey(row, index);
      if (allSelected) next.delete(key);
      else next.add(key);
    });
    this.selected.set(next);
  }

  isExpanded(row: T, index: number): boolean {
    return this.expanded().has(this.rowKey(row, index));
  }

  toggleExpanded(row: T, index: number): void {
    this.toggleSet(this.expanded, this.rowKey(row, index));
  }

  columnWidth(column: KrnDataColumn<T>): number {
    return this.widths()[column.key] ?? column.width ?? 180;
  }

  startResize(event: PointerEvent, column: KrnDataColumn<T>): void {
    const target = event.currentTarget as HTMLElement;
    target.setPointerCapture(event.pointerId);
    this.resizeState = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startWidth: this.columnWidth(column),
      key: column.key,
    };
  }

  resize(event: PointerEvent, column: KrnDataColumn<T>): void {
    const state = this.resizeState;
    if (!state || state.pointerId !== event.pointerId || state.key !== column.key) return;
    const direction = this.isRtl() ? -1 : 1;
    this.setColumnWidth(column, state.startWidth + (event.clientX - state.startX) * direction);
  }

  endResize(event: PointerEvent): void {
    const target = event.currentTarget as HTMLElement;
    if (target.hasPointerCapture(event.pointerId)) target.releasePointerCapture(event.pointerId);
    this.resizeState = undefined;
  }

  resizeWithKeyboard(event: KeyboardEvent, column: KrnDataColumn<T>): void {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const rtl = this.isRtl();
    const direction = event.key === 'ArrowRight' ? 1 : -1;
    this.setColumnWidth(column, this.columnWidth(column) + direction * (rtl ? -10 : 10));
  }

  onCellKeydown(event: KeyboardEvent, row: number, column: number, rowCount: number): void {
    let nextRow = row;
    let nextColumn = column;
    if (event.key === 'ArrowRight') nextColumn += 1;
    else if (event.key === 'ArrowLeft') nextColumn -= 1;
    else if (event.key === 'ArrowDown') nextRow += 1;
    else if (event.key === 'ArrowUp') nextRow -= 1;
    else if (event.key === 'Home') nextColumn = 0;
    else if (event.key === 'End') nextColumn = this.columns().length - 1;
    else return;

    event.preventDefault();
    nextRow = Math.max(0, Math.min(rowCount - 1, nextRow));
    nextColumn = Math.max(0, Math.min(this.columns().length - 1, nextColumn));
    this.activeCell.set({ row: nextRow, column: nextColumn });
    const selector = `[data-cell="${nextRow}-${nextColumn}"]`;
    queueMicrotask(() => this.host.nativeElement.querySelector<HTMLElement>(selector)?.focus());
  }

  private setColumnWidth(column: KrnDataColumn<T>, width: number): void {
    const minimum = column.minWidth ?? 96;
    const maximum = Math.max(minimum, column.maxWidth ?? 960);
    const nextWidth = Math.min(maximum, Math.max(minimum, Math.round(width)));
    this.widths.update((current) => ({ ...current, [column.key]: nextWidth }));
  }

  private isRtl(): boolean {
    const element = this.host.nativeElement;
    return element.ownerDocument.defaultView?.getComputedStyle(element).direction === 'rtl';
  }

  private toggleSet(target: { set(value: ReadonlySet<RowKey>): void; (): ReadonlySet<RowKey> }, key: RowKey): void {
    const next = new Set(target());
    if (next.has(key)) next.delete(key);
    else next.add(key);
    target.set(next);
  }
}

export { KrnDataGrid as KrnDataTable };
