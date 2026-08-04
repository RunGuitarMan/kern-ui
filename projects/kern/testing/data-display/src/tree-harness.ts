import { ComponentHarness, HarnessPredicate, TestKey } from '@angular/cdk/testing';
import type { BaseHarnessFilters } from '@angular/cdk/testing';
import type { KrnHarnessText } from './harness-utilities';
import { booleanAttributeValue, textMatches } from './harness-utilities';

export interface KrnCompositeItemHarnessFilters extends BaseHarnessFilters {
  readonly text?: KrnHarnessText;
  readonly selected?: boolean;
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly error?: boolean;
}

/** Harness for tree and tree-navigation items. */
export class KrnTreeItemHarness extends ComponentHarness {
  static readonly hostSelector = '[role="treeitem"]';

  static with(options: KrnCompositeItemHarnessFilters = {}): HarnessPredicate<KrnTreeItemHarness> {
    return new HarnessPredicate(KrnTreeItemHarness, options)
      .addOption('text', options.text, (harness, value) => textMatches(harness.getText(), value))
      .addOption(
        'selected',
        options.selected,
        async (harness, value) => (await harness.isSelected()) === value,
      )
      .addOption(
        'disabled',
        options.disabled,
        async (harness, value) => (await harness.isDisabled()) === value,
      )
      .addOption(
        'loading',
        options.loading,
        async (harness, value) => (await harness.isLoading()) === value,
      )
      .addOption(
        'error',
        options.error,
        async (harness, value) => (await harness.hasError()) === value,
      );
  }

  async getText(): Promise<string> {
    return (await this.host()).text({ exclude: '.node-state, [aria-hidden="true"]' });
  }

  async getId(): Promise<string | null> {
    return (await this.host()).getAttribute('data-tree-item');
  }

  async getLevel(): Promise<number | null> {
    const value = await (await this.host()).getAttribute('aria-level');
    return value === null ? null : Number(value);
  }

  async isExpanded(): Promise<boolean | null> {
    const value = await (await this.host()).getAttribute('aria-expanded');
    return value === null ? null : booleanAttributeValue(value);
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

  async isLoading(): Promise<boolean> {
    return booleanAttributeValue(await (await this.host()).getAttribute('aria-busy'));
  }

  async hasError(): Promise<boolean> {
    return booleanAttributeValue(await (await this.host()).getAttribute('aria-invalid'));
  }

  async click(): Promise<void> {
    await (await this.host()).click();
  }

  async expand(): Promise<void> {
    if ((await this.isExpanded()) === false) {
      await (await this.host()).sendKeys(TestKey.RIGHT_ARROW);
    }
  }

  async collapse(): Promise<void> {
    if (await this.isExpanded()) {
      await (await this.host()).sendKeys(TestKey.LEFT_ARROW);
    }
  }
}

/** Harness for `krn-tree`. */
export class KrnTreeHarness extends ComponentHarness {
  static readonly hostSelector = 'krn-tree';

  async getItems(
    filters: KrnCompositeItemHarnessFilters = {},
  ): Promise<readonly KrnTreeItemHarness[]> {
    return this.locatorForAll(KrnTreeItemHarness.with(filters))();
  }

  async selectItem(filters: KrnCompositeItemHarnessFilters): Promise<void> {
    const item = (await this.getItems(filters))[0];
    if (!item) throw new Error('Could not find a KERN tree item matching the supplied filters.');
    await item.click();
  }
}
