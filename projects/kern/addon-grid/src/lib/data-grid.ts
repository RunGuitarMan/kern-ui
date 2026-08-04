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
  template: `
    <section class="grid-shell" [attr.aria-label]="copy().ariaLabel">
      @if (filterable() || columnChooser()) {
        <div class="toolbar">
          @if (filterable()) {
            <label>
              <span class="sr-only">{{ copy().filterLabel(copy().ariaLabel) }}</span>
              <span aria-hidden="true">⌕</span>
              <input
                type="search"
                [value]="filter()"
                [placeholder]="copy().filterPlaceholder"
                (input)="setFilter($event)"
              />
            </label>
          }
          <span class="result-count" aria-live="polite">{{
            copy().rowCount(totalRowCount())
          }}</span>
          @if (columnChooser() && columns().length > 1) {
            <details class="column-chooser">
              <summary>{{ copy().columns }}</summary>
              <div>
                @for (column of columns(); track column.key) {
                  <label>
                    <input
                      type="checkbox"
                      [checked]="isColumnVisible(column.key)"
                      [disabled]="isColumnVisible(column.key) && visibleColumns().length === 1"
                      (change)="setColumnVisible(column.key, $event)"
                    />
                    <span>{{ columnLabel(column) }}</span>
                  </label>
                }
              </div>
            </details>
          }
        </div>
      }

      @if (error()) {
        <div class="state error" role="alert">
          <strong>{{ copy().errorTitle }}</strong>
          <span>{{ error() }}</span>
        </div>
      } @else if (loading()) {
        <div class="loading" role="status" [attr.aria-label]="copy().loading">
          @for (row of loadingRows; track row) {
            <span></span>
          }
        </div>
      } @else if (!processed().length) {
        <div class="state" role="status">
          <strong>{{ copy().empty }}</strong>
          @if (filter()) {
            <button type="button" (click)="clearFilter()">{{ copy().clearFilter }}</button>
          }
        </div>
      } @else if (isVirtual()) {
        <div
          class="virtual-grid"
          role="grid"
          [attr.aria-label]="copy().ariaLabel"
          [attr.aria-rowcount]="processed().length + 1"
          [attr.aria-colcount]="gridColumnCount()"
          [attr.aria-multiselectable]="selectable() ? 'true' : null"
          (focusout)="onGridFocusOut($event)"
        >
          <div #virtualRowMeasure class="virtual-row-measure" aria-hidden="true"></div>
          <div class="virtual-header" role="row" aria-rowindex="1">
            @if (selectable()) {
              <div
                role="columnheader"
                class="selection-cell"
                aria-colindex="1"
                [attr.data-pinned]="hasPinnedStartColumns() ? 'start' : null"
                [style.inset-inline-start]="hasPinnedStartColumns() ? utilityColumnOffset(0) : null"
                [attr.tabindex]="
                  focusCellPosition().row === -1 && focusCellPosition().column === 0 ? 0 : -1
                "
                data-cell="-1-0"
                [attr.data-action-mode]="isActionCell(-1, 0) ? '' : null"
                (focusin)="onCellFocusIn($event, -1, 0)"
                (pointerdown)="onCellPointerDown($event, -1, 0)"
                (keydown)="onCellKeydown($event, -1, 0, processed().length)"
              >
                <input
                  type="checkbox"
                  data-grid-action
                  [attr.tabindex]="isActionCell(-1, 0) ? 0 : -1"
                  [attr.aria-label]="copy().selectAllVisible"
                  [checked]="allVisibleSelected()"
                  [indeterminate]="someVisibleSelected()"
                  (change)="toggleAllVisible()"
                />
              </div>
            }
            @for (column of visibleColumns(); track column.key; let columnIndex = $index) {
              <div
                role="columnheader"
                [attr.aria-colindex]="dataColumnOffset() + columnIndex + 1"
                [attr.aria-sort]="ariaSort(column)"
                [attr.data-column-key]="column.key"
                [style.inline-size.px]="columnWidth(column)"
                [attr.data-pinned]="column.pinned ?? null"
                [attr.data-pin-boundary]="columnPinBoundary(column)"
                [style.inset-inline-start]="columnPinnedStart(column)"
                [style.inset-inline-end]="columnPinnedEnd(column)"
                [attr.data-align]="column.align ?? 'start'"
                [attr.data-priority]="column.priority ?? 'secondary'"
                [attr.tabindex]="
                  focusCellPosition().row === -1 &&
                  focusCellPosition().column === dataColumnOffset() + columnIndex
                    ? 0
                    : -1
                "
                [attr.data-cell]="'-1-' + (dataColumnOffset() + columnIndex)"
                [attr.data-action-mode]="
                  isActionCell(-1, dataColumnOffset() + columnIndex) ? '' : null
                "
                (focusin)="onCellFocusIn($event, -1, dataColumnOffset() + columnIndex)"
                (pointerdown)="onCellPointerDown($event, -1, dataColumnOffset() + columnIndex)"
                (keydown)="
                  onCellKeydown($event, -1, dataColumnOffset() + columnIndex, processed().length)
                "
              >
                @if (column.sortable) {
                  <button
                    type="button"
                    data-grid-action
                    [attr.tabindex]="isActionCell(-1, dataColumnOffset() + columnIndex) ? 0 : -1"
                    (click)="sort(column)"
                  >
                    @if (resolveHeaderTemplate(column); as headerTemplate) {
                      <ng-container
                        [ngTemplateOutlet]="headerTemplate"
                        [ngTemplateOutletContext]="headerContext(column, columnIndex)"
                      />
                    } @else {
                      {{ columnLabel(column) }}
                    }
                    <span aria-hidden="true">{{ sortMark(column) }}</span>
                  </button>
                } @else {
                  @if (resolveHeaderTemplate(column); as headerTemplate) {
                    <ng-container
                      [ngTemplateOutlet]="headerTemplate"
                      [ngTemplateOutletContext]="headerContext(column, columnIndex)"
                    />
                  } @else {
                    {{ columnLabel(column) }}
                  }
                }
                @if (resizable()) {
                  <span
                    class="resize-handle"
                    role="separator"
                    data-grid-action
                    aria-orientation="vertical"
                    [attr.aria-label]="copy().resizeColumn(columnLabel(column))"
                    [attr.aria-valuemin]="columnMinWidth(column)"
                    [attr.aria-valuemax]="columnMaxWidth(column)"
                    [attr.aria-valuenow]="columnWidth(column)"
                    [attr.aria-valuetext]="copy().widthInPixels(columnWidth(column))"
                    [attr.tabindex]="isActionCell(-1, dataColumnOffset() + columnIndex) ? 0 : -1"
                    (pointerdown)="startResize($event, column)"
                    (pointermove)="resize($event, column)"
                    (pointerup)="endResize($event)"
                    (keydown)="resizeWithKeyboard($event, column)"
                  ></span>
                }
              </div>
            }
          </div>
          <cdk-virtual-scroll-viewport
            #viewport
            tabindex="-1"
            [itemSize]="rowHeight()"
            [attr.data-item-size]="rowHeight()"
            [style.block-size.px]="normalizedViewportHeight()"
            [minBufferPx]="rowHeight() * 5"
            [maxBufferPx]="rowHeight() * 10"
          >
            <div
              *cdkVirtualFor="
                let occurrence of processed();
                let rowIndex = index;
                trackBy: trackRow
              "
              class="virtual-row"
              role="row"
              [attr.aria-rowindex]="rowIndex + 2"
              [attr.aria-selected]="selectable() ? isSelected(occurrence) : null"
            >
              @if (selectable()) {
                <div
                  role="gridcell"
                  class="selection-cell"
                  aria-colindex="1"
                  [attr.data-pinned]="hasPinnedStartColumns() ? 'start' : null"
                  [attr.tabindex]="
                    focusCellPosition().row === rowIndex && focusCellPosition().column === 0
                      ? 0
                      : -1
                  "
                  [attr.data-cell]="rowIndex + '-0'"
                  [attr.data-action-mode]="isActionCell(rowIndex, 0) ? '' : null"
                  (focusin)="onCellFocusIn($event, rowIndex, 0)"
                  (pointerdown)="onCellPointerDown($event, rowIndex, 0)"
                  (keydown)="onCellKeydown($event, rowIndex, 0, processed().length)"
                >
                  <input
                    type="checkbox"
                    data-grid-action
                    [attr.tabindex]="isActionCell(rowIndex, 0) ? 0 : -1"
                    [checked]="isSelected(occurrence)"
                    [attr.aria-label]="copy().selectRow(rowIndex + 1)"
                    (change)="toggleRow(occurrence)"
                  />
                </div>
              }
              @for (column of visibleColumns(); track column.key; let columnIndex = $index) {
                <div
                  role="gridcell"
                  [attr.aria-colindex]="dataColumnOffset() + columnIndex + 1"
                  [style.inline-size.px]="columnWidth(column)"
                  [attr.data-pinned]="column.pinned ?? null"
                  [attr.data-pin-boundary]="columnPinBoundary(column)"
                  [attr.data-align]="column.align ?? 'start'"
                  [attr.data-priority]="column.priority ?? 'secondary'"
                  [attr.tabindex]="
                    focusCellPosition().row === rowIndex &&
                    focusCellPosition().column === dataColumnOffset() + columnIndex
                      ? 0
                      : -1
                  "
                  [attr.data-cell]="rowIndex + '-' + (dataColumnOffset() + columnIndex)"
                  [attr.data-action-mode]="
                    isActionCell(rowIndex, dataColumnOffset() + columnIndex) ? '' : null
                  "
                  (focusin)="onCellFocusIn($event, rowIndex, dataColumnOffset() + columnIndex)"
                  (pointerdown)="
                    onCellPointerDown($event, rowIndex, dataColumnOffset() + columnIndex)
                  "
                  (keydown)="
                    onCellKeydown(
                      $event,
                      rowIndex,
                      dataColumnOffset() + columnIndex,
                      processed().length
                    )
                  "
                >
                  @if (resolveCellTemplate(column); as cellTemplate) {
                    <ng-container
                      [ngTemplateOutlet]="cellTemplate"
                      [ngTemplateOutletContext]="cellContext(occurrence.row, column, rowIndex)"
                    />
                  } @else {
                    {{ cellText(occurrence.row, column) }}
                  }
                </div>
              }
            </div>
          </cdk-virtual-scroll-viewport>
        </div>
      } @else {
        <div class="table-scroll">
          <table
            role="grid"
            [attr.aria-label]="copy().ariaLabel"
            [attr.aria-rowcount]="totalRowCount() + 1"
            [attr.aria-colcount]="gridColumnCount()"
            [attr.aria-multiselectable]="selectable() ? 'true' : null"
            (focusout)="onGridFocusOut($event)"
          >
            <thead>
              <tr role="row" aria-rowindex="1">
                @if (selectable()) {
                  <th
                    role="columnheader"
                    class="selection-cell"
                    aria-colindex="1"
                    [attr.data-pinned]="hasPinnedStartColumns() ? 'start' : null"
                    [style.inset-inline-start]="
                      hasPinnedStartColumns() ? utilityColumnOffset(0) : null
                    "
                    [attr.tabindex]="
                      focusCellPosition().row === -1 && focusCellPosition().column === 0 ? 0 : -1
                    "
                    data-cell="-1-0"
                    [attr.data-action-mode]="isActionCell(-1, 0) ? '' : null"
                    (focusin)="onCellFocusIn($event, -1, 0)"
                    (pointerdown)="onCellPointerDown($event, -1, 0)"
                    (keydown)="onCellKeydown($event, -1, 0, pageRows().length)"
                  >
                    <input
                      type="checkbox"
                      data-grid-action
                      [attr.tabindex]="isActionCell(-1, 0) ? 0 : -1"
                      [attr.aria-label]="copy().selectAllPage"
                      [checked]="allVisibleSelected()"
                      [indeterminate]="someVisibleSelected()"
                      (change)="toggleAllVisible()"
                    />
                  </th>
                }
                @if (expandable()) {
                  <th
                    role="columnheader"
                    class="expand-cell"
                    [attr.aria-colindex]="(selectable() ? 1 : 0) + 1"
                    [attr.data-pinned]="hasPinnedStartColumns() ? 'start' : null"
                    [style.inset-inline-start]="
                      hasPinnedStartColumns() ? utilityColumnOffset(selectable() ? 1 : 0) : null
                    "
                    [attr.tabindex]="
                      focusCellPosition().row === -1 &&
                      focusCellPosition().column === (selectable() ? 1 : 0)
                        ? 0
                        : -1
                    "
                    [attr.data-cell]="'-1-' + (selectable() ? 1 : 0)"
                    [attr.data-action-mode]="isActionCell(-1, selectable() ? 1 : 0) ? '' : null"
                    (focusin)="onCellFocusIn($event, -1, selectable() ? 1 : 0)"
                    (pointerdown)="onCellPointerDown($event, -1, selectable() ? 1 : 0)"
                    (keydown)="onCellKeydown($event, -1, selectable() ? 1 : 0, pageRows().length)"
                  >
                    <span class="sr-only">{{ copy().expand }}</span>
                  </th>
                }
                @for (column of visibleColumns(); track column.key; let columnIndex = $index) {
                  <th
                    scope="col"
                    role="columnheader"
                    [attr.aria-colindex]="dataColumnOffset() + columnIndex + 1"
                    [attr.aria-sort]="ariaSort(column)"
                    [attr.data-column-key]="column.key"
                    [style.inline-size.px]="columnWidth(column)"
                    [attr.data-pinned]="column.pinned ?? null"
                    [attr.data-pin-boundary]="columnPinBoundary(column)"
                    [style.inset-inline-start]="columnPinnedStart(column)"
                    [style.inset-inline-end]="columnPinnedEnd(column)"
                    [attr.data-align]="column.align ?? 'start'"
                    [attr.data-priority]="column.priority ?? 'secondary'"
                    [attr.tabindex]="
                      focusCellPosition().row === -1 &&
                      focusCellPosition().column === dataColumnOffset() + columnIndex
                        ? 0
                        : -1
                    "
                    [attr.data-cell]="'-1-' + (dataColumnOffset() + columnIndex)"
                    [attr.data-action-mode]="
                      isActionCell(-1, dataColumnOffset() + columnIndex) ? '' : null
                    "
                    (focusin)="onCellFocusIn($event, -1, dataColumnOffset() + columnIndex)"
                    (pointerdown)="onCellPointerDown($event, -1, dataColumnOffset() + columnIndex)"
                    (keydown)="
                      onCellKeydown($event, -1, dataColumnOffset() + columnIndex, pageRows().length)
                    "
                  >
                    @if (column.sortable) {
                      <button
                        type="button"
                        data-grid-action
                        [attr.tabindex]="
                          isActionCell(-1, dataColumnOffset() + columnIndex) ? 0 : -1
                        "
                        (click)="sort(column)"
                      >
                        @if (resolveHeaderTemplate(column); as headerTemplate) {
                          <ng-container
                            [ngTemplateOutlet]="headerTemplate"
                            [ngTemplateOutletContext]="headerContext(column, columnIndex)"
                          />
                        } @else {
                          {{ columnLabel(column) }}
                        }
                        <span aria-hidden="true">{{ sortMark(column) }}</span>
                      </button>
                    } @else {
                      @if (resolveHeaderTemplate(column); as headerTemplate) {
                        <ng-container
                          [ngTemplateOutlet]="headerTemplate"
                          [ngTemplateOutletContext]="headerContext(column, columnIndex)"
                        />
                      } @else {
                        {{ columnLabel(column) }}
                      }
                    }
                    @if (resizable()) {
                      <span
                        class="resize-handle"
                        role="separator"
                        data-grid-action
                        aria-orientation="vertical"
                        [attr.aria-label]="copy().resizeColumn(columnLabel(column))"
                        [attr.aria-valuemin]="columnMinWidth(column)"
                        [attr.aria-valuemax]="columnMaxWidth(column)"
                        [attr.aria-valuenow]="columnWidth(column)"
                        [attr.aria-valuetext]="copy().widthInPixels(columnWidth(column))"
                        [attr.tabindex]="
                          isActionCell(-1, dataColumnOffset() + columnIndex) ? 0 : -1
                        "
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
              @for (occurrence of pageRows(); track occurrence.key; let rowIndex = $index) {
                <tr
                  role="row"
                  [attr.aria-rowindex]="rowOffset() + rowIndex + 2"
                  [attr.aria-selected]="selectable() ? isSelected(occurrence) : null"
                  [attr.data-selected]="isSelected(occurrence) ? '' : null"
                >
                  @if (selectable()) {
                    <td
                      role="gridcell"
                      class="selection-cell"
                      aria-colindex="1"
                      [attr.data-pinned]="hasPinnedStartColumns() ? 'start' : null"
                      [style.inset-inline-start]="
                        hasPinnedStartColumns() ? utilityColumnOffset(0) : null
                      "
                      [attr.tabindex]="
                        focusCellPosition().row === rowIndex && focusCellPosition().column === 0
                          ? 0
                          : -1
                      "
                      [attr.data-cell]="rowIndex + '-0'"
                      [attr.data-action-mode]="isActionCell(rowIndex, 0) ? '' : null"
                      (focusin)="onCellFocusIn($event, rowIndex, 0)"
                      (pointerdown)="onCellPointerDown($event, rowIndex, 0)"
                      (keydown)="onCellKeydown($event, rowIndex, 0, pageRows().length)"
                    >
                      <input
                        type="checkbox"
                        data-grid-action
                        [attr.tabindex]="isActionCell(rowIndex, 0) ? 0 : -1"
                        [checked]="isSelected(occurrence)"
                        [attr.aria-label]="copy().selectRow(rowOffset() + rowIndex + 1)"
                        (change)="toggleRow(occurrence)"
                      />
                    </td>
                  }
                  @if (expandable()) {
                    <td
                      role="gridcell"
                      class="expand-cell"
                      [attr.aria-colindex]="(selectable() ? 1 : 0) + 1"
                      [attr.data-pinned]="hasPinnedStartColumns() ? 'start' : null"
                      [style.inset-inline-start]="
                        hasPinnedStartColumns() ? utilityColumnOffset(selectable() ? 1 : 0) : null
                      "
                      [attr.tabindex]="
                        focusCellPosition().row === rowIndex &&
                        focusCellPosition().column === (selectable() ? 1 : 0)
                          ? 0
                          : -1
                      "
                      [attr.data-cell]="rowIndex + '-' + (selectable() ? 1 : 0)"
                      [attr.data-action-mode]="
                        isActionCell(rowIndex, selectable() ? 1 : 0) ? '' : null
                      "
                      (focusin)="onCellFocusIn($event, rowIndex, selectable() ? 1 : 0)"
                      (pointerdown)="onCellPointerDown($event, rowIndex, selectable() ? 1 : 0)"
                      (keydown)="
                        onCellKeydown($event, rowIndex, selectable() ? 1 : 0, pageRows().length)
                      "
                    >
                      <button
                        type="button"
                        data-grid-action
                        [attr.tabindex]="isActionCell(rowIndex, selectable() ? 1 : 0) ? 0 : -1"
                        [attr.aria-label]="
                          isExpanded(occurrence) ? copy().collapseRow : copy().expandRow
                        "
                        [attr.aria-expanded]="isExpanded(occurrence)"
                        (click)="toggleExpanded(occurrence)"
                      >
                        <span aria-hidden="true">{{ isExpanded(occurrence) ? '−' : '+' }}</span>
                      </button>
                    </td>
                  }
                  @for (column of visibleColumns(); track column.key; let columnIndex = $index) {
                    <td
                      role="gridcell"
                      [attr.aria-colindex]="dataColumnOffset() + columnIndex + 1"
                      [style.inline-size.px]="columnWidth(column)"
                      [attr.data-pinned]="column.pinned ?? null"
                      [attr.data-pin-boundary]="columnPinBoundary(column)"
                      [style.inset-inline-start]="columnPinnedStart(column)"
                      [style.inset-inline-end]="columnPinnedEnd(column)"
                      [attr.data-align]="column.align ?? 'start'"
                      [attr.data-priority]="column.priority ?? 'secondary'"
                      [attr.tabindex]="
                        focusCellPosition().row === rowIndex &&
                        focusCellPosition().column === dataColumnOffset() + columnIndex
                          ? 0
                          : -1
                      "
                      [attr.data-cell]="rowIndex + '-' + (dataColumnOffset() + columnIndex)"
                      [attr.data-action-mode]="
                        isActionCell(rowIndex, dataColumnOffset() + columnIndex) ? '' : null
                      "
                      (focusin)="onCellFocusIn($event, rowIndex, dataColumnOffset() + columnIndex)"
                      (pointerdown)="
                        onCellPointerDown($event, rowIndex, dataColumnOffset() + columnIndex)
                      "
                      (keydown)="
                        onCellKeydown(
                          $event,
                          rowIndex,
                          dataColumnOffset() + columnIndex,
                          pageRows().length
                        )
                      "
                    >
                      @if (resolveCellTemplate(column); as cellTemplate) {
                        <ng-container
                          [ngTemplateOutlet]="cellTemplate"
                          [ngTemplateOutletContext]="
                            cellContext(occurrence.row, column, rowOffset() + rowIndex)
                          "
                        />
                      } @else {
                        {{ cellText(occurrence.row, column) }}
                      }
                    </td>
                  }
                </tr>
                @if (expandable() && isExpanded(occurrence)) {
                  <tr class="detail-row" role="presentation">
                    <td role="presentation" [attr.colspan]="gridColumnCount()">
                      @if (expandedTemplate(); as detailTemplate) {
                        <ng-container
                          [ngTemplateOutlet]="detailTemplate"
                          [ngTemplateOutletContext]="
                            rowContext(occurrence.row, rowOffset() + rowIndex)
                          "
                        />
                      } @else {
                        {{ expandedContent()(occurrence.row) }}
                      }
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      }

      @if (!isVirtual() && usesPagination() && totalRowCount()) {
        <div class="pagination" [attr.aria-label]="copy().pagination">
          <span>{{ copy().pageRange(pageStart(), pageEnd(), totalRowCount()) }}</span>
          <div>
            <button
              type="button"
              [disabled]="currentPage() === 1"
              (click)="goToPage(currentPage() - 1)"
            >
              {{ copy().previousPage }}
            </button>
            <button
              type="button"
              [disabled]="currentPage() >= pageCount()"
              (click)="goToPage(currentPage() + 1)"
            >
              {{ copy().nextPage }}
            </button>
          </div>
        </div>
      }
    </section>
  `,
  styles: `
    :host {
      --krn-data-utility-column-size: 2.75rem;

      display: block;
      min-inline-size: 0;
      container: krn-data-grid / inline-size;
      color: var(--krn-color-text, #252932);
      font: var(--krn-font-body-sm, 500 0.8125rem/1.25rem sans-serif);
    }
    :host([hidden]) {
      display: none;
    }
    :host([data-compact]) {
      --krn-data-row-size: 2.25rem;
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
      min-block-size: var(--krn-control-height-lg);
      align-items: center;
      justify-content: space-between;
      gap: var(--krn-density-gap);
      padding-inline: var(--krn-control-padding-inline);
    }
    .toolbar {
      border-block-end: 1px solid var(--krn-color-border-subtle, #e0e3e7);
    }
    .toolbar > label {
      display: flex;
      flex: 1;
      align-items: center;
      gap: var(--krn-density-gap);
      max-inline-size: 22rem;
    }
    .toolbar > label input {
      inline-size: 100%;
      min-block-size: var(--krn-control-height-sm);
      border: 0;
      color: inherit;
      background: transparent;
      font: inherit;
    }
    .toolbar > label input:focus-visible {
      border-radius: 0.25rem;
      outline: var(--krn-focus-ring, 2px solid #4f6feb);
      outline-offset: 2px;
    }
    .result-count,
    .pagination {
      color: var(--krn-color-text-muted, #626a76);
      font-variant-numeric: tabular-nums;
    }
    .column-chooser {
      flex: 0 0 auto;
    }
    .column-chooser summary {
      min-block-size: var(--krn-control-height-sm);
      padding-block: var(--krn-density-cell-padding-block);
      padding-inline: var(--krn-density-cell-padding-inline);
      border: 1px solid var(--krn-color-border, #cdd1d7);
      border-radius: var(--krn-radius-control, 0.375rem);
      background: var(--krn-color-surface, #fff);
      cursor: pointer;
      list-style: none;
    }
    .column-chooser summary::-webkit-details-marker {
      display: none;
    }
    .column-chooser summary:focus-visible {
      outline: var(--krn-focus-ring, 2px solid #4f6feb);
      outline-offset: 2px;
    }
    .column-chooser > div {
      display: grid;
      min-inline-size: 12rem;
      gap: var(--krn-space-1);
      margin-block-start: 0.375rem;
      padding: var(--krn-density-cell-padding-block);
      border: 1px solid var(--krn-color-border, #cdd1d7);
      border-radius: var(--krn-radius-md, 0.5rem);
      box-shadow: var(--krn-shadow-overlay, 0 18px 44px rgb(0 0 0 / 18%));
      background: var(--krn-color-surface-raised, #fff);
    }
    .column-chooser label {
      display: flex;
      align-items: center;
      gap: var(--krn-density-gap);
      min-block-size: var(--krn-control-height-sm);
      padding-inline: var(--krn-density-cell-padding-inline);
    }
    .table-scroll {
      max-inline-size: 100%;
      overflow: auto;
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
      padding-block: var(--krn-density-cell-padding-block);
      padding-inline: var(--krn-density-cell-padding-inline);
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
    .virtual-header button,
    .expand-cell button,
    .pagination button,
    .state button {
      border: 0;
      color: inherit;
      background: transparent;
      font: inherit;
      cursor: pointer;
    }
    th > button,
    .virtual-header [role='columnheader'] > button {
      display: flex;
      inline-size: 100%;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      text-align: start;
    }
    button:focus-visible,
    [role='columnheader']:focus-visible,
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
    [data-pinned] {
      position: sticky;
      z-index: 1;
    }
    th[data-pinned],
    .virtual-header > [data-pinned] {
      z-index: 3;
      background: var(--krn-color-surface-raised, #f2f3f5);
    }
    td[data-pinned],
    .virtual-row > [data-pinned] {
      background: var(--krn-color-surface, #fff);
    }
    tr[data-selected] td[data-pinned],
    .virtual-row[aria-selected='true'] > [data-pinned] {
      background: var(--krn-color-brand-surface, #fff0e8);
    }
    [data-pin-boundary='start'] {
      border-inline-end: 1px solid var(--krn-color-border, #cdd1d7);
    }
    [data-pin-boundary='end'] {
      border-inline-start: 1px solid var(--krn-color-border, #cdd1d7);
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
      inline-size: var(--krn-data-utility-column-size);
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
      min-block-size: var(--krn-control-height-sm);
      padding-inline: var(--krn-control-padding-inline);
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
      animation: scan var(--krn-motion-duration-feedback) linear
        var(--krn-motion-iteration-continuous);
    }
    .virtual-grid {
      position: relative;
      display: grid;
      grid-template-columns: minmax(100%, max-content);
      max-inline-size: 100%;
      overflow: auto;
    }
    .virtual-grid > cdk-virtual-scroll-viewport {
      inline-size: 100%;
      max-inline-size: none;
      overflow-x: hidden;
    }
    .virtual-row-measure {
      position: absolute;
      inset: 0 auto auto 0;
      visibility: hidden;
      inline-size: 0;
      block-size: var(--krn-data-row-size, 2.75rem);
      pointer-events: none;
    }
    .virtual-header,
    .virtual-row {
      display: flex;
      min-inline-size: max-content;
      block-size: var(--krn-data-row-size, 2.75rem);
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
      position: relative;
      flex: 0 0 auto;
      block-size: 100%;
      padding-block: var(--krn-density-cell-padding-block);
      padding-inline: var(--krn-density-cell-padding-inline);
      border-block-end: 1px solid var(--krn-color-border-subtle, #e0e3e7);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .virtual-header > [data-pinned] {
      position: sticky;
    }
    .virtual-row > [data-pinned] {
      position: relative;
    }
    .virtual-row > [data-pinned='start'] {
      transform: translateX(var(--krn-virtual-pin-start-translate, 0px));
    }
    .virtual-row > [data-pinned='end'] {
      transform: translateX(var(--krn-virtual-pin-end-translate, 0px));
    }
    .virtual-header > .selection-cell,
    .virtual-row > .selection-cell {
      flex-basis: var(--krn-data-utility-column-size);
    }
    [data-cell][data-action-mode] {
      box-shadow: inset 0 0 0 1px var(--krn-color-focus, #4f6feb);
    }
    @keyframes scan {
      to {
        background-position-x: calc(100% + 16rem);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      :host-context(html:not([data-krn-motion='full'])) .loading span {
        animation: none;
      }
    }
    @media (forced-colors: active) {
      .grid-shell,
      .column-chooser summary,
      .column-chooser > div,
      .pagination button,
      th,
      td,
      .virtual-header > *,
      .virtual-row > * {
        border-color: CanvasText;
      }
      button:focus-visible,
      [role='columnheader']:focus-visible,
      [role='gridcell']:focus-visible,
      td:focus-visible,
      [data-cell][data-action-mode] {
        outline-color: Highlight;
      }
      tr[data-selected] td,
      .virtual-row[aria-selected='true'] {
        outline: var(--krn-border-width-1, 1px) solid Highlight;
        outline-offset: -1px;
      }
      .loading span {
        background: Canvas;
        animation: none;
      }
    }
    @container krn-data-grid (max-width: 28rem) {
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
