import { ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';
import type { BaseHarnessFilters, TestElement } from '@angular/cdk/testing';
import type { KrnHarnessText } from './harness-utilities';
import { allText, booleanAttributeValue, optionalText, textMatches } from './harness-utilities';

const GRID_TEXT_EXCLUSIONS = '[aria-hidden="true"], .resize-handle, .sr-only';

export interface KrnDataGridHarnessFilters extends BaseHarnessFilters {
  readonly ariaLabel?: KrnHarnessText;
  readonly loading?: boolean;
  readonly empty?: boolean;
  readonly rowCount?: number;
}

export interface KrnDataGridHeaderHarnessFilters extends BaseHarnessFilters {
  readonly text?: KrnHarnessText;
  readonly sortable?: boolean;
}

export interface KrnDataGridRowHarnessFilters extends BaseHarnessFilters {
  readonly text?: KrnHarnessText;
  readonly selected?: boolean;
}

/** @publicApi */
export class KrnDataGridHeaderHarness extends ComponentHarness {
  static readonly hostSelector = [
    'thead th:not(.selection-cell):not(.expand-cell)',
    '.virtual-header [role="columnheader"]:not(.selection-cell)',
  ].join(', ');

  static with(
    options: KrnDataGridHeaderHarnessFilters = {},
  ): HarnessPredicate<KrnDataGridHeaderHarness> {
    return new HarnessPredicate(KrnDataGridHeaderHarness, options)
      .addOption('text', options.text, (harness, value) => textMatches(harness.getText(), value))
      .addOption(
        'sortable',
        options.sortable,
        async (harness, value) => (await harness.isSortable()) === value,
      );
  }

  private readonly sortButton = this.locatorForOptional('button');

  async getText(): Promise<string> {
    return (await this.host()).text({ exclude: GRID_TEXT_EXCLUSIONS });
  }

  async getSortDirection(): Promise<string | null> {
    return (await this.host()).getAttribute('aria-sort');
  }

  async isSortable(): Promise<boolean> {
    return (await this.sortButton()) !== null;
  }

  async sort(): Promise<void> {
    const button = await this.sortButton();
    if (!button) {
      throw new Error('The requested KERN data-grid column is not sortable.');
    }
    await button.click();
  }
}

/** @publicApi */
export class KrnDataGridRowHarness extends ComponentHarness {
  static readonly hostSelector = 'tbody > tr:not(.detail-row), .virtual-row[role="row"]';

  static with(options: KrnDataGridRowHarnessFilters = {}): HarnessPredicate<KrnDataGridRowHarness> {
    return new HarnessPredicate(KrnDataGridRowHarness, options)
      .addOption('text', options.text, (harness, value) => textMatches(harness.getText(), value))
      .addOption(
        'selected',
        options.selected,
        async (harness, value) => (await harness.isSelected()) === value,
      );
  }

  private readonly cells = this.locatorForAll(
    'td:not(.selection-cell):not(.expand-cell), [role="gridcell"]:not(.selection-cell)',
  );
  private readonly selection = this.locatorForOptional('.selection-cell input[type="checkbox"]');
  private readonly expansion = this.locatorForOptional('.expand-cell button');

  async getText(): Promise<string> {
    return (await this.host()).text({ exclude: GRID_TEXT_EXCLUSIONS });
  }

  async getCellTexts(): Promise<readonly string[]> {
    return allText(this.cells(), { exclude: GRID_TEXT_EXCLUSIONS });
  }

  async getCellText(columnIndex: number): Promise<string> {
    const cells = await this.cells();
    const cell = cells.at(columnIndex);
    if (!cell) {
      throw new Error(`KERN data-grid row has no visible cell at column index ${columnIndex}.`);
    }
    return cell.text({ exclude: GRID_TEXT_EXCLUSIONS });
  }

  async isSelected(): Promise<boolean> {
    const host = await this.host();
    return (
      (await host.getAttribute('data-selected')) !== null ||
      booleanAttributeValue(await host.getAttribute('aria-selected'))
    );
  }

  async toggleSelection(): Promise<void> {
    const checkbox = await this.selection();
    if (!checkbox) {
      throw new Error('The KERN data-grid row is not selectable.');
    }
    await checkbox.click();
  }

  async toggleExpanded(): Promise<void> {
    const button = await this.expansion();
    if (!button) {
      throw new Error('The KERN data-grid row is not expandable.');
    }
    await button.click();
  }
}

/**
 * Harness for both `krn-data-grid` and its `krn-data-table` alias.
 *
 * @publicApi
 */
export class KrnDataGridHarness extends ComponentHarness {
  static readonly hostSelector = 'krn-data-grid, krn-data-table';

  static with(options: KrnDataGridHarnessFilters = {}): HarnessPredicate<KrnDataGridHarness> {
    return new HarnessPredicate(KrnDataGridHarness, options)
      .addOption('ariaLabel', options.ariaLabel, (harness, value) =>
        textMatches(harness.getAriaLabel(), value),
      )
      .addOption(
        'loading',
        options.loading,
        async (harness, value) => (await harness.isLoading()) === value,
      )
      .addOption(
        'empty',
        options.empty,
        async (harness, value) => (await harness.isEmpty()) === value,
      )
      .addOption(
        'rowCount',
        options.rowCount,
        async (harness, value) => (await harness.getRowCount()) === value,
      );
  }

  private readonly shell = this.locatorFor('.grid-shell');
  private readonly filter = this.locatorForOptional('input[type="search"]');
  private readonly resultCount = this.locatorForOptional('.result-count');
  private readonly error = this.locatorForOptional('.state.error[role="alert"]');
  private readonly emptyState = this.locatorForOptional('.state:not(.error)[role="status"]');
  private readonly headers = this.locatorForAll(KrnDataGridHeaderHarness);
  private readonly rows = this.locatorForAll(KrnDataGridRowHarness);
  private readonly selectAll = this.locatorForOptional(
    'thead .selection-cell input[type="checkbox"], .virtual-header .selection-cell input[type="checkbox"]',
  );
  private readonly paginationRange = this.locatorForOptional('.pagination > span');
  private readonly previousPage = this.locatorForOptional('.pagination button:first-of-type');
  private readonly nextPage = this.locatorForOptional('.pagination button:last-of-type');
  private readonly virtualGrid = this.locatorForOptional('.virtual-grid');

  async getAriaLabel(): Promise<string | null> {
    return (await this.shell()).getAttribute('aria-label');
  }

  async isLoading(): Promise<boolean> {
    return booleanAttributeValue(await (await this.host()).getAttribute('aria-busy'));
  }

  async isEmpty(): Promise<boolean> {
    return (await this.emptyState()) !== null;
  }

  async getStateText(): Promise<string | null> {
    return optionalText(this.emptyState());
  }

  async getErrorText(): Promise<string | null> {
    return optionalText(this.error());
  }

  async getResultCountText(): Promise<string | null> {
    return optionalText(this.resultCount());
  }

  async getHeaders(
    filters: KrnDataGridHeaderHarnessFilters = {},
  ): Promise<readonly KrnDataGridHeaderHarness[]> {
    return this.locatorForAll(KrnDataGridHeaderHarness.with(filters))();
  }

  async getHeaderTexts(): Promise<readonly string[]> {
    return Promise.all((await this.headers()).map((header) => header.getText()));
  }

  async getRows(
    filters: KrnDataGridRowHarnessFilters = {},
  ): Promise<readonly KrnDataGridRowHarness[]> {
    return this.locatorForAll(KrnDataGridRowHarness.with(filters))();
  }

  async getRowCount(): Promise<number> {
    return (await this.rows()).length;
  }

  async getCellText(rowIndex: number, columnIndex: number): Promise<string> {
    const rows = await this.rows();
    const row = rows.at(rowIndex);
    if (!row) {
      throw new Error(`KERN data-grid has no visible row at index ${rowIndex}.`);
    }
    return row.getCellText(columnIndex);
  }

  async setFilter(value: string): Promise<void> {
    const input = await this.filter();
    if (!input) {
      throw new Error('Filtering is disabled for this KERN data grid.');
    }
    await input.setInputValue(value);
    await input.dispatchEvent('input');
  }

  async getFilterValue(): Promise<string | null> {
    const input = await this.filter();
    return input ? input.getProperty<string>('value') : null;
  }

  async sortByHeader(filters: KrnDataGridHeaderHarnessFilters): Promise<void> {
    const header = await this.locatorForOptional(KrnDataGridHeaderHarness.with(filters))();
    if (!header) {
      throw new Error('Could not find a KERN data-grid header matching the supplied filters.');
    }
    await header.sort();
  }

  async toggleSelectAll(): Promise<void> {
    const checkbox = await this.selectAll();
    if (!checkbox) {
      throw new Error('Selection is disabled for this KERN data grid.');
    }
    await checkbox.click();
  }

  async getPaginationRange(): Promise<string | null> {
    return optionalText(this.paginationRange());
  }

  async goToPreviousPage(): Promise<void> {
    const button = await this.previousPage();
    if (!button) {
      throw new Error('Pagination is disabled for this KERN data grid.');
    }
    await button.click();
  }

  async goToNextPage(): Promise<void> {
    const button = await this.nextPage();
    if (!button) {
      throw new Error('Pagination is disabled for this KERN data grid.');
    }
    await button.click();
  }

  async isVirtual(): Promise<boolean> {
    return (await this.virtualGrid()) !== null;
  }

  async getFilterInput(): Promise<TestElement | null> {
    return this.filter();
  }
}
