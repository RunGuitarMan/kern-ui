import { ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';
import type { BaseHarnessFilters } from '@angular/cdk/testing';
import { booleanAttributeValue } from './harness-utilities';

export interface KrnCalendarCellHarnessFilters extends BaseHarnessFilters {
  readonly date?: string;
  readonly selected?: boolean;
  readonly disabled?: boolean;
}

/** Harness for a calendar grid cell. */
export class KrnCalendarCellHarness extends ComponentHarness {
  static readonly hostSelector = '[role="gridcell"][data-date]';

  static with(
    options: KrnCalendarCellHarnessFilters = {},
  ): HarnessPredicate<KrnCalendarCellHarness> {
    return new HarnessPredicate(KrnCalendarCellHarness, options)
      .addOption(
        'date',
        options.date,
        async (harness, value) => (await harness.getDate()) === value,
      )
      .addOption(
        'selected',
        options.selected,
        async (harness, value) => (await harness.isSelected()) === value,
      )
      .addOption(
        'disabled',
        options.disabled,
        async (harness, value) => (await harness.isDisabled()) === value,
      );
  }

  async getDate(): Promise<string | null> {
    return (await this.host()).getAttribute('data-date');
  }

  async getLabel(): Promise<string | null> {
    return (await this.host()).getAttribute('aria-label');
  }

  async isSelected(): Promise<boolean> {
    return booleanAttributeValue(await (await this.host()).getAttribute('aria-selected'));
  }

  async isDisabled(): Promise<boolean> {
    const host = await this.host();
    return (
      (await host.getProperty<boolean>('disabled')) ||
      booleanAttributeValue(await host.getAttribute('aria-disabled'))
    );
  }

  async click(): Promise<void> {
    await (await this.host()).click();
  }
}

/** Harness for `krn-calendar`. */
export class KrnCalendarHarness extends ComponentHarness {
  static readonly hostSelector = 'krn-calendar';

  private readonly grid = this.locatorFor('[role="grid"]');

  async getMonthLabel(): Promise<string | null> {
    return (await this.grid()).getAttribute('aria-label');
  }

  async getCells(
    filters: KrnCalendarCellHarnessFilters = {},
  ): Promise<readonly KrnCalendarCellHarness[]> {
    return this.locatorForAll(KrnCalendarCellHarness.with(filters))();
  }

  async selectDate(date: string): Promise<void> {
    const cell = (await this.getCells({ date }))[0];
    if (!cell) throw new Error(`Could not find calendar date "${date}".`);
    await cell.click();
  }

  async goToPreviousMonth(): Promise<void> {
    await (await this.locatorFor('.header > button:first-of-type')()).click();
  }

  async goToNextMonth(): Promise<void> {
    await (await this.locatorFor('.header > button:last-of-type')()).click();
  }
}
