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

abstract class KrnTreeLikeHarness extends ComponentHarness {
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

/** Harness for `krn-tree`. */
export class KrnTreeHarness extends KrnTreeLikeHarness {
  static readonly hostSelector = 'krn-tree';
}

/** Harness for `krn-tree-navigation`. */
export class KrnTreeNavigationHarness extends KrnTreeLikeHarness {
  static readonly hostSelector = 'krn-tree-navigation';
}

/** Harness for `krn-menu`. */
export class KrnMenuHarness extends ComponentHarness {
  static readonly hostSelector = 'krn-menu';

  private readonly trigger = this.locatorFor('.trigger');

  async isOpen(): Promise<boolean> {
    return booleanAttributeValue(await (await this.trigger()).getAttribute('aria-expanded'));
  }

  async open(): Promise<void> {
    if (!(await this.isOpen())) await (await this.trigger()).click();
  }

  async close(): Promise<void> {
    if (!(await this.isOpen())) return;
    const panel = await this.documentRootLocatorFactory().locatorForOptional(
      '.menu-panel[role="menu"]',
    )();
    if (!panel) throw new Error('Open KERN menu panel is not available.');
    await panel.sendKeys(TestKey.ESCAPE);
  }

  async getItemTexts(): Promise<readonly string[]> {
    await this.open();
    const items = await this.documentRootLocatorFactory().locatorForAll('[role="menuitem"]')();
    return Promise.all(items.map((item) => item.text({ exclude: 'kbd' })));
  }

  async clickItem(text: KrnHarnessText): Promise<void> {
    await this.open();
    const items = await this.documentRootLocatorFactory().locatorForAll('[role="menuitem"]')();
    for (const item of items) {
      if (await textMatches(item.text({ exclude: 'kbd' }), text)) {
        await item.click();
        return;
      }
    }
    throw new Error('Could not find a KERN menu item matching the supplied text.');
  }
}

/** Harness for `krn-tabs` and `krn-vertical-tabs`. */
export class KrnTabsHarness extends ComponentHarness {
  static readonly hostSelector = 'krn-tabs, krn-vertical-tabs';

  private readonly tabs = this.locatorForAll('[role="tab"]');

  async getTabTexts(): Promise<readonly string[]> {
    return Promise.all((await this.tabs()).map((tab) => tab.text({ exclude: '.badge' })));
  }

  async getSelectedTabText(): Promise<string | null> {
    const selected = await this.locatorForOptional('[role="tab"][aria-selected="true"]')();
    return selected ? selected.text({ exclude: '.badge' }) : null;
  }

  async selectTab(text: KrnHarnessText): Promise<void> {
    for (const tab of await this.tabs()) {
      if (await textMatches(tab.text({ exclude: '.badge' }), text)) {
        await tab.click();
        return;
      }
    }
    throw new Error('Could not find a KERN tab matching the supplied text.');
  }
}
