import { ComponentHarness, HarnessPredicate, TestKey } from '@angular/cdk/testing';
import type { BaseHarnessFilters } from '@angular/cdk/testing';
import type { KrnHarnessText } from './harness-utilities';
import { booleanAttributeValue, textMatches } from './harness-utilities';

export interface KrnJsonNodeHarnessFilters extends BaseHarnessFilters {
  readonly path?: string;
  readonly text?: KrnHarnessText;
  readonly expanded?: boolean;
}

export class KrnJsonNodeHarness extends ComponentHarness {
  static readonly hostSelector = 'krn-json-view [role="treeitem"]';

  static with(options: KrnJsonNodeHarnessFilters = {}): HarnessPredicate<KrnJsonNodeHarness> {
    return new HarnessPredicate(KrnJsonNodeHarness, options)
      .addOption(
        'path',
        options.path,
        async (harness, value) => (await harness.getPath()) === value,
      )
      .addOption('text', options.text, (harness, value) => textMatches(harness.getText(), value))
      .addOption(
        'expanded',
        options.expanded,
        async (harness, value) => (await harness.isExpanded()) === value,
      );
  }

  async getPath(): Promise<string | null> {
    return (await this.host()).getAttribute('data-json-path');
  }

  async getText(): Promise<string> {
    return (await this.host()).text({ exclude: '[aria-hidden="true"]' });
  }

  async isExpanded(): Promise<boolean | null> {
    const value = await (await this.host()).getAttribute('aria-expanded');
    return value === null ? null : booleanAttributeValue(value);
  }

  async toggle(): Promise<void> {
    await (await this.host()).sendKeys(TestKey.ENTER);
  }
}

export class KrnJsonViewHarness extends ComponentHarness {
  static readonly hostSelector = 'krn-json-view';

  async getNodes(filters: KrnJsonNodeHarnessFilters = {}): Promise<readonly KrnJsonNodeHarness[]> {
    return this.locatorForAll(KrnJsonNodeHarness.with(filters))();
  }
}
