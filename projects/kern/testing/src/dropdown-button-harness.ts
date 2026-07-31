import { ComponentHarness, HarnessPredicate, TestKey } from '@angular/cdk/testing';
import type { BaseHarnessFilters, TestElement } from '@angular/cdk/testing';
import type { KrnHarnessText } from './harness-utilities';
import { booleanAttributeValue, textMatches } from './harness-utilities';

export interface KrnDropdownButtonHarnessFilters extends BaseHarnessFilters {
  readonly accessibleName?: KrnHarnessText;
  readonly text?: KrnHarnessText;
  readonly open?: boolean;
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly size?: string;
  readonly variant?: string;
  readonly tone?: string;
  readonly menuAlign?: string;
}

/**
 * Harness for `krn-dropdown-button` and its connected ARIA menu.
 *
 * The trigger lives under the component host while the menu is rendered in a
 * document-level CDK overlay, so menu lookup follows the public
 * `aria-controls` relationship instead of relying on overlay DOM order.
 *
 * @publicApi
 */
export class KrnDropdownButtonHarness extends ComponentHarness {
  static readonly hostSelector = 'krn-dropdown-button';

  static with(
    options: KrnDropdownButtonHarnessFilters = {},
  ): HarnessPredicate<KrnDropdownButtonHarness> {
    return new HarnessPredicate(KrnDropdownButtonHarness, options)
      .addOption('accessibleName', options.accessibleName, (harness, value) =>
        textMatches(harness.getAccessibleName(), value),
      )
      .addOption('text', options.text, (harness, value) => textMatches(harness.getText(), value))
      .addOption('open', options.open, async (harness, value) => (await harness.isOpen()) === value)
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
        'size',
        options.size,
        async (harness, value) => (await harness.getSize()) === value,
      )
      .addOption(
        'variant',
        options.variant,
        async (harness, value) => (await harness.getVariant()) === value,
      )
      .addOption(
        'tone',
        options.tone,
        async (harness, value) => (await harness.getTone()) === value,
      )
      .addOption(
        'menuAlign',
        options.menuAlign,
        async (harness, value) => (await harness.getMenuAlign()) === value,
      );
  }

  private readonly trigger = this.locatorFor('button[krnButton][aria-haspopup="menu"]');

  async getAccessibleName(): Promise<string> {
    const trigger = await this.trigger();
    return (await trigger.getAttribute('aria-label'))?.trim() || this.getText();
  }

  async getText(): Promise<string> {
    return (await this.trigger()).text({
      exclude: '.krn-action__icon, .krn-action__status',
    });
  }

  async getMenuId(): Promise<string> {
    const id = await (await this.trigger()).getAttribute('aria-controls');
    if (!id) {
      throw new Error('KrnDropdownButton trigger does not expose aria-controls.');
    }
    return id;
  }

  async isOpen(): Promise<boolean> {
    return (await (await this.trigger()).getAttribute('aria-expanded')) === 'true';
  }

  async isDisabled(): Promise<boolean> {
    return (await this.trigger()).getProperty<boolean>('disabled');
  }

  async isLoading(): Promise<boolean> {
    return booleanAttributeValue(await (await this.trigger()).getAttribute('data-loading'));
  }

  async getSize(): Promise<string | null> {
    return (await this.trigger()).getAttribute('data-size');
  }

  async getVariant(): Promise<string | null> {
    return (await this.trigger()).getAttribute('data-variant');
  }

  async getTone(): Promise<string | null> {
    return (await this.trigger()).getAttribute('data-tone');
  }

  async getMenuAlign(): Promise<string | null> {
    return (await this.host()).getAttribute('data-menu-align');
  }

  async getMenu(): Promise<TestElement | null> {
    const id = await this.getMenuId();
    return this.documentRootLocatorFactory().locatorForOptional(`#${id}[role="menu"]`)();
  }

  async getMenuItems(): Promise<readonly TestElement[]> {
    const id = await this.getMenuId();
    return this.documentRootLocatorFactory().locatorForAll(
      `#${id} :is([role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"])`,
    )();
  }

  async open(): Promise<void> {
    if (!(await this.isOpen())) {
      await (await this.trigger()).click();
      await this.forceStabilize();
    }
  }

  async close(): Promise<void> {
    if (await this.isOpen()) {
      const menu = await this.getMenu();
      if (menu) {
        await menu.sendKeys(TestKey.ESCAPE);
      } else {
        await (await this.trigger()).click();
      }
      await this.forceStabilize();
    }
  }

  async clickItem(index: number): Promise<void> {
    const items = await this.getMenuItems();
    const item = items[index];
    if (!item) {
      throw new Error(`KrnDropdownButton menu item ${index} does not exist.`);
    }
    await item.click();
    await this.forceStabilize();
  }

  async focus(): Promise<void> {
    await (await this.trigger()).focus();
  }

  async isFocused(): Promise<boolean> {
    return (await this.trigger()).isFocused();
  }

  async getTrigger(): Promise<TestElement> {
    return this.trigger();
  }
}
