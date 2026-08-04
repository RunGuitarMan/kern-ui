import { ComponentHarness, TestKey } from '@angular/cdk/testing';
import { KrnTreeItemHarness } from '@kern-ui/angular/testing/data-display';
import type { KrnCompositeItemHarnessFilters } from '@kern-ui/angular/testing/data-display';
import type { KrnHarnessText } from './harness-utilities';
import { booleanAttributeValue, textMatches } from './harness-utilities';

/** Harness for `krn-tree-navigation`. */
export class KrnTreeNavigationHarness extends ComponentHarness {
  static readonly hostSelector = 'krn-tree-navigation';

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
