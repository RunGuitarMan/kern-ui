import { ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';
import type {
  BaseHarnessFilters,
  ComponentHarnessConstructor,
  TestElement,
  TestKey,
} from '@angular/cdk/testing';
import type { KrnHarnessText } from './harness-utilities';
import { booleanAttributeValue, optionalText, textMatches } from './harness-utilities';

export interface KrnChartHarnessFilters extends BaseHarnessFilters {
  /** Matches the visible chart title. */
  readonly title?: KrnHarnessText;
  readonly type?: 'line' | 'bar' | 'donut';
  readonly empty?: boolean;
  readonly tableVisible?: boolean;
}

export interface KrnChartDatumHarnessFilters extends BaseHarnessFilters {
  /** Matches the datum's accessible label. */
  readonly label?: KrnHarnessText;
  readonly active?: boolean;
}

/** Harness for an interactive line point, bar, or donut legend entry. */
export class KrnChartDatumHarness extends ComponentHarness {
  static readonly hostSelector = [
    '.point[role="button"][data-chart-index]',
    '.bar[role="button"][data-chart-index]',
    '.legend button',
  ].join(', ');

  static with(options: KrnChartDatumHarnessFilters = {}): HarnessPredicate<KrnChartDatumHarness> {
    return new HarnessPredicate(KrnChartDatumHarness, options)
      .addOption('label', options.label, (harness, value) =>
        textMatches(harness.getAccessibleLabel(), value),
      )
      .addOption(
        'active',
        options.active,
        async (harness, value) => (await harness.isActive()) === value,
      );
  }

  private readonly legendLabel = this.locatorForOptional('span');
  private readonly legendValue = this.locatorForOptional('strong');

  async getAccessibleLabel(): Promise<string | null> {
    const host = await this.host();
    return (await host.getAttribute('aria-label')) ?? optionalText(this.legendLabel());
  }

  async getValueText(): Promise<string | null> {
    return optionalText(this.legendValue());
  }

  async getIndex(): Promise<number | null> {
    const value = await (await this.host()).getAttribute('data-chart-index');
    return value === null ? null : Number(value);
  }

  async isActive(): Promise<boolean> {
    return booleanAttributeValue(await (await this.host()).getAttribute('data-active'));
  }

  async click(): Promise<void> {
    await (await this.host()).click();
  }

  async focus(): Promise<void> {
    await (await this.host()).focus();
  }

  async isFocused(): Promise<boolean> {
    return (await this.host()).isFocused();
  }

  async sendKeys(...keys: (string | TestKey)[]): Promise<void> {
    await (await this.host()).sendKeys(...keys);
  }
}

/** Harness for a row in the optional accessible chart data table. */
export class KrnChartTableRowHarness extends ComponentHarness {
  static readonly hostSelector = 'tbody > tr';

  private readonly label = this.locatorFor('th[scope="row"]');
  private readonly cells = this.locatorForAll('td');

  async getLabelText(): Promise<string> {
    return (await this.label()).text();
  }

  async getValueText(): Promise<string> {
    const value = (await this.cells())[0];
    if (!value) throw new Error('The KERN chart data row does not expose a value cell.');
    return value.text();
  }

  async getShareText(): Promise<string> {
    const share = (await this.cells())[1];
    if (!share) throw new Error('The KERN chart data row does not expose a share cell.');
    return share.text();
  }
}

function addChartFilters<T extends KrnChartHarness>(
  harnessType: ComponentHarnessConstructor<T>,
  options: KrnChartHarnessFilters,
): HarnessPredicate<T> {
  return new HarnessPredicate(harnessType, options)
    .addOption('title', options.title, (harness, value) =>
      textMatches(harness.getTitleText(), value),
    )
    .addOption('type', options.type, async (harness, value) => (await harness.getType()) === value)
    .addOption(
      'empty',
      options.empty,
      async (harness, value) => (await harness.isEmpty()) === value,
    )
    .addOption(
      'tableVisible',
      options.tableVisible,
      async (harness, value) => (await harness.isTableVisible()) === value,
    );
}

/**
 * Harness for `krn-chart`.
 *
 * The same consumer-facing methods are available on the typed line, bar, and
 * donut wrapper harnesses below.
 *
 * @publicApi
 */
export class KrnChartHarness extends ComponentHarness {
  static readonly hostSelector: string = 'krn-chart';

  static with(options: KrnChartHarnessFilters = {}): HarnessPredicate<KrnChartHarness> {
    return addChartFilters(KrnChartHarness, options);
  }

  private readonly nestedChart = this.locatorForOptional('krn-chart');
  private readonly title = this.locatorFor('figcaption > span > strong');
  private readonly description = this.locatorForOptional('figcaption > span > span');
  private readonly dataToggle = this.locatorFor('.data-toggle');
  private readonly emptyState = this.locatorForOptional('.empty-chart[role="status"]');
  private readonly summary = this.locatorForOptional('svg[role="group"]');
  private readonly table = this.locatorForOptional('table');
  private readonly tableCaption = this.locatorForOptional('table > caption');

  protected async getChartHost(): Promise<TestElement> {
    return (await this.nestedChart()) ?? this.host();
  }

  async getType(): Promise<'line' | 'bar' | 'donut' | null> {
    const type = await (await this.getChartHost()).getAttribute('data-type');
    return type === 'line' || type === 'bar' || type === 'donut' ? type : null;
  }

  async getTitleText(): Promise<string> {
    return (await this.title()).text();
  }

  async getDescriptionText(): Promise<string | null> {
    return optionalText(this.description());
  }

  async getAccessibleSummary(): Promise<string | null> {
    return (await this.summary())?.getAttribute('aria-label') ?? null;
  }

  async isEmpty(): Promise<boolean> {
    return (await this.emptyState()) !== null;
  }

  async getEmptyText(): Promise<string | null> {
    return optionalText(this.emptyState());
  }

  async isTableVisible(): Promise<boolean> {
    return (
      booleanAttributeValue(await (await this.dataToggle()).getAttribute('aria-expanded')) &&
      (await this.table()) !== null
    );
  }

  async showTable(): Promise<void> {
    if (!(await this.isTableVisible())) await (await this.dataToggle()).click();
  }

  async hideTable(): Promise<void> {
    if (await this.isTableVisible()) await (await this.dataToggle()).click();
  }

  async getTableCaption(): Promise<string | null> {
    return optionalText(this.tableCaption());
  }

  async getTableRows(): Promise<readonly KrnChartTableRowHarness[]> {
    await this.showTable();
    return this.locatorForAll(KrnChartTableRowHarness)();
  }

  async getData(
    filters: KrnChartDatumHarnessFilters = {},
  ): Promise<readonly KrnChartDatumHarness[]> {
    return this.locatorForAll(KrnChartDatumHarness.with(filters))();
  }

  async activateDatum(filters: KrnChartDatumHarnessFilters): Promise<void> {
    const datum = (await this.getData(filters))[0];
    if (!datum) throw new Error('Could not find a KERN chart datum matching the supplied filters.');
    await datum.click();
  }

  async getActiveDatum(): Promise<KrnChartDatumHarness | null> {
    return this.locatorForOptional(KrnChartDatumHarness.with({ active: true }))();
  }
}

/** Harness for `krn-line-chart`. */
export class KrnLineChartHarness extends KrnChartHarness {
  static override readonly hostSelector: string = 'krn-line-chart';

  static override with(
    options: KrnChartHarnessFilters = {},
  ): HarnessPredicate<KrnLineChartHarness> {
    return addChartFilters(KrnLineChartHarness, options);
  }
}

/** Harness for `krn-bar-chart`. */
export class KrnBarChartHarness extends KrnChartHarness {
  static override readonly hostSelector: string = 'krn-bar-chart';

  static override with(options: KrnChartHarnessFilters = {}): HarnessPredicate<KrnBarChartHarness> {
    return addChartFilters(KrnBarChartHarness, options);
  }
}

/** Harness for `krn-donut-chart`. */
export class KrnDonutChartHarness extends KrnChartHarness {
  static override readonly hostSelector: string = 'krn-donut-chart';

  static override with(
    options: KrnChartHarnessFilters = {},
  ): HarnessPredicate<KrnDonutChartHarness> {
    return addChartFilters(KrnDonutChartHarness, options);
  }
}
