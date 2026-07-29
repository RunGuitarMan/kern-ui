import { ComponentHarness, HarnessPredicate, TestKey } from '@angular/cdk/testing';
import type { BaseHarnessFilters, TestElement } from '@angular/cdk/testing';
import type { KrnHarnessText } from './harness-utilities';
import { booleanAttributeValue, optionalText, textMatches } from './harness-utilities';

export interface KrnCommandPaletteHarnessFilters extends BaseHarnessFilters {
  readonly title?: KrnHarnessText;
  readonly query?: KrnHarnessText;
  readonly open?: boolean;
  readonly resultCount?: number;
}

export interface KrnCommandPaletteOptionHarnessFilters extends BaseHarnessFilters {
  readonly label?: KrnHarnessText;
  readonly selected?: boolean;
}

/** Harness for a command-palette result option. */
export class KrnCommandPaletteOptionHarness extends ComponentHarness {
  static readonly hostSelector = '[role="listbox"] > [role="option"]';

  static with(
    options: KrnCommandPaletteOptionHarnessFilters = {},
  ): HarnessPredicate<KrnCommandPaletteOptionHarness> {
    return new HarnessPredicate(KrnCommandPaletteOptionHarness, options)
      .addOption('label', options.label, (harness, value) =>
        textMatches(harness.getLabelText(), value),
      )
      .addOption(
        'selected',
        options.selected,
        async (harness, value) => (await harness.isSelected()) === value,
      );
  }

  private readonly label = this.locatorFor('.command-copy > strong');
  private readonly description = this.locatorForOptional('.command-copy > span');
  private readonly shortcut = this.locatorForOptional('kbd');

  async getId(): Promise<string | null> {
    return (await this.host()).getAttribute('id');
  }

  async getLabelText(): Promise<string> {
    return (await this.label()).text();
  }

  async getDescriptionText(): Promise<string | null> {
    return optionalText(this.description());
  }

  async getShortcutText(): Promise<string | null> {
    return optionalText(this.shortcut());
  }

  async isSelected(): Promise<boolean> {
    return booleanAttributeValue(await (await this.host()).getAttribute('aria-selected'));
  }

  async click(): Promise<void> {
    await (await this.host()).click();
  }
}

/**
 * Harness for `krn-command-palette`.
 *
 * Opening the palette remains an application concern because the component has
 * no visual trigger of its own. Once open, this harness owns all palette
 * interactions.
 *
 * @publicApi
 */
export class KrnCommandPaletteHarness extends ComponentHarness {
  static readonly hostSelector = 'krn-command-palette';

  static with(
    options: KrnCommandPaletteHarnessFilters = {},
  ): HarnessPredicate<KrnCommandPaletteHarness> {
    return new HarnessPredicate(KrnCommandPaletteHarness, options)
      .addOption('title', options.title, (harness, value) =>
        textMatches(harness.getTitleText(), value),
      )
      .addOption('query', options.query, (harness, value) => textMatches(harness.getQuery(), value))
      .addOption('open', options.open, async (harness, value) => (await harness.isOpen()) === value)
      .addOption(
        'resultCount',
        options.resultCount,
        async (harness, value) => (await harness.getResultCount()) === value,
      );
  }

  private readonly dialog = this.locatorForOptional('[role="dialog"]');
  private readonly title = this.locatorForOptional('[role="dialog"] > h2');
  private readonly description = this.locatorForOptional('[role="dialog"] > p');
  private readonly search = this.locatorForOptional('input[role="combobox"]');
  private readonly empty = this.locatorForOptional('.empty > p');

  async isOpen(): Promise<boolean> {
    return (await this.dialog()) !== null;
  }

  async getTitleText(): Promise<string | null> {
    return optionalText(this.title());
  }

  async getDescriptionText(): Promise<string | null> {
    return optionalText(this.description());
  }

  async getQuery(): Promise<string | null> {
    const input = await this.search();
    return input ? input.getProperty<string>('value') : null;
  }

  async getPlaceholder(): Promise<string | null> {
    return (await this.search())?.getAttribute('placeholder') ?? null;
  }

  async setQuery(value: string): Promise<void> {
    const input = await this.requireSearch();
    await input.setInputValue(value);
    await input.dispatchEvent('input');
  }

  async getOptions(
    filters: KrnCommandPaletteOptionHarnessFilters = {},
  ): Promise<readonly KrnCommandPaletteOptionHarness[]> {
    return this.locatorForAll(KrnCommandPaletteOptionHarness.with(filters))();
  }

  async getResultCount(): Promise<number> {
    return (await this.getOptions()).length;
  }

  async getResultLabels(): Promise<readonly string[]> {
    return Promise.all((await this.getOptions()).map((option) => option.getLabelText()));
  }

  async getActiveOption(): Promise<KrnCommandPaletteOptionHarness | null> {
    return this.locatorForOptional(KrnCommandPaletteOptionHarness.with({ selected: true }))();
  }

  async selectOption(filters: KrnCommandPaletteOptionHarnessFilters): Promise<void> {
    const option = (await this.getOptions(filters))[0];
    if (!option) {
      throw new Error('Could not find a KERN command matching the supplied filters.');
    }
    await option.click();
  }

  async getEmptyText(): Promise<string | null> {
    return optionalText(this.empty());
  }

  async sendKeys(...keys: (string | TestKey)[]): Promise<void> {
    await (await this.requireSearch()).sendKeys(...keys);
  }

  async close(): Promise<void> {
    if (await this.isOpen()) await this.sendKeys(TestKey.ESCAPE);
  }

  async getSearchInput(): Promise<TestElement> {
    return this.requireSearch();
  }

  private async requireSearch(): Promise<TestElement> {
    const input = await this.search();
    if (!input) {
      throw new Error(
        'The KERN command palette is closed. Open it through the application trigger first.',
      );
    }
    return input;
  }
}
