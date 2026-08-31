import { ComponentHarness, HarnessPredicate, TestKey } from '@angular/cdk/testing';
import type { BaseHarnessFilters } from '@angular/cdk/testing';
import type { KrnHarnessText } from './harness-utilities';
import { booleanAttributeValue, textMatches } from './harness-utilities';

export interface KrnJsonNodeHarnessFilters extends BaseHarnessFilters {
  readonly path?: string;
  readonly text?: KrnHarnessText;
  readonly expanded?: boolean;
}

export interface KrnJsonViewHarnessFilters extends BaseHarnessFilters {
  readonly ariaLabel?: KrnHarnessText;
  readonly nodeCount?: number;
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
    const host = await this.host();
    await host.click();
    await host.sendKeys(TestKey.ENTER);
  }
}

export class KrnJsonViewHarness extends ComponentHarness {
  static readonly hostSelector = 'krn-json-view';

  static with(options: KrnJsonViewHarnessFilters = {}): HarnessPredicate<KrnJsonViewHarness> {
    return new HarnessPredicate(KrnJsonViewHarness, options)
      .addOption('ariaLabel', options.ariaLabel, (harness, value) =>
        textMatches(harness.getAriaLabel(), value),
      )
      .addOption(
        'nodeCount',
        options.nodeCount,
        async (harness, value) => (await harness.getNodes()).length === value,
      );
  }

  private readonly tree = this.locatorFor('[role="tree"]');

  async getAriaLabel(): Promise<string | null> {
    return (await this.tree()).getAttribute('aria-label');
  }

  async getNodes(filters: KrnJsonNodeHarnessFilters = {}): Promise<readonly KrnJsonNodeHarness[]> {
    return this.locatorForAll(KrnJsonNodeHarness.with(filters))();
  }
}
