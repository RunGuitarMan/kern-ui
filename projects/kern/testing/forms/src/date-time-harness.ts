import { ComponentHarness, HarnessPredicate, TestKey } from '@angular/cdk/testing';
import type {
  BaseHarnessFilters,
  ComponentHarnessConstructor,
  TestElement,
} from '@angular/cdk/testing';
import { KrnCalendarCellHarness } from '@kern-ui/angular/testing/data-display';
import type { KrnCalendarCellHarnessFilters } from '@kern-ui/angular/testing/data-display';
import type { KrnHarnessText } from './harness-utilities';
import { booleanAttributeValue, textMatches } from './harness-utilities';

export interface KrnPickerHarnessFilters extends BaseHarnessFilters {
  readonly value?: KrnHarnessText;
  readonly ariaLabel?: KrnHarnessText;
  readonly disabled?: boolean;
  readonly open?: boolean;
}

/** Shared harness contract for popup date and time controls. */
export abstract class KrnPickerHarness extends ComponentHarness {
  protected readonly trigger = this.locatorFor('.krn-picker__trigger');

  protected static predicate<T extends KrnPickerHarness>(
    harnessType: ComponentHarnessConstructor<T>,
    options: KrnPickerHarnessFilters,
  ): HarnessPredicate<T> {
    return new HarnessPredicate(harnessType, options)
      .addOption('value', options.value, (harness, value) =>
        textMatches(harness.getValueText(), value),
      )
      .addOption('ariaLabel', options.ariaLabel, (harness, value) =>
        textMatches(harness.getAriaLabel(), value),
      )
      .addOption(
        'disabled',
        options.disabled,
        async (harness, value) => (await harness.isDisabled()) === value,
      )
      .addOption(
        'open',
        options.open,
        async (harness, value) => (await harness.isOpen()) === value,
      );
  }

  async getValueText(): Promise<string> {
    return (await this.trigger()).text();
  }

  async getAriaLabel(): Promise<string | null> {
    return (await this.trigger()).getAttribute('aria-label');
  }

  async isDisabled(): Promise<boolean> {
    return (await this.trigger()).getProperty<boolean>('disabled');
  }

  async isOpen(): Promise<boolean> {
    return booleanAttributeValue(await (await this.trigger()).getAttribute('aria-expanded'));
  }

  async open(): Promise<void> {
    if (!(await this.isOpen())) await (await this.trigger()).click();
  }

  async close(): Promise<void> {
    if (await this.isOpen()) await (await this.trigger()).sendKeys(TestKey.ESCAPE);
  }

  async getTrigger(): Promise<TestElement> {
    return this.trigger();
  }
}

abstract class KrnCalendarPickerHarness extends KrnPickerHarness {
  async getCells(
    filters: KrnCalendarCellHarnessFilters = {},
  ): Promise<readonly KrnCalendarCellHarness[]> {
    await this.open();
    return this.locatorForAll(KrnCalendarCellHarness.with(filters))();
  }

  async selectDate(date: string): Promise<void> {
    const cell = (await this.getCells({ date }))[0];
    if (!cell) throw new Error(`Could not find date-picker date "${date}".`);
    await cell.click();
  }
}

/** Harness for `krn-date-picker`. */
export class KrnDatePickerHarness extends KrnCalendarPickerHarness {
  static readonly hostSelector = 'krn-date-picker';

  static with(options: KrnPickerHarnessFilters = {}): HarnessPredicate<KrnDatePickerHarness> {
    return this.predicate(KrnDatePickerHarness, options);
  }
}

/** Harness for `krn-date-range-picker`. */
export class KrnDateRangePickerHarness extends KrnCalendarPickerHarness {
  static readonly hostSelector = 'krn-date-range-picker';

  static with(options: KrnPickerHarnessFilters = {}): HarnessPredicate<KrnDateRangePickerHarness> {
    return this.predicate(KrnDateRangePickerHarness, options);
  }
}

/** Harness for `krn-time-picker`. */
export class KrnTimePickerHarness extends KrnPickerHarness {
  static readonly hostSelector = 'krn-time-picker';

  static with(options: KrnPickerHarnessFilters = {}): HarnessPredicate<KrnTimePickerHarness> {
    return this.predicate(KrnTimePickerHarness, options);
  }

  private readonly parts = this.locatorForAll('input[role="spinbutton"]');

  async setTime(hour: number, minute: number): Promise<void> {
    if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
      throw new Error(`Time picker hour must be an integer from 0 to 23; received ${hour}.`);
    }
    if (!Number.isInteger(minute) || minute < 0 || minute > 59) {
      throw new Error(`Time picker minute must be an integer from 0 to 59; received ${minute}.`);
    }
    await this.open();
    const [hourInput, minuteInput] = await this.parts();
    if (!hourInput || !minuteInput) throw new Error('Time picker inputs are not available.');
    await hourInput.setInputValue(String(hour).padStart(2, '0'));
    await hourInput.dispatchEvent('input');
    await minuteInput.setInputValue(String(minute).padStart(2, '0'));
    await minuteInput.dispatchEvent('input');
    await minuteInput.sendKeys(TestKey.ENTER);
    if (await this.isOpen()) {
      throw new Error(
        `Time picker did not accept ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}.`,
      );
    }
  }

  async getHourInput(): Promise<TestElement> {
    await this.open();
    const hour = (await this.parts())[0];
    if (!hour) throw new Error('Time picker hour input is not available.');
    return hour;
  }
}
