import { ComponentHarness, HarnessPredicate, TestKey } from '@angular/cdk/testing';
import type { BaseHarnessFilters, TestElement } from '@angular/cdk/testing';
import type { KrnHarnessText } from './harness-utilities';
import { booleanAttributeValue, textMatches } from './harness-utilities';

export interface KrnSplitButtonHarnessFilters extends BaseHarnessFilters {
  readonly primaryText?: KrnHarnessText;
  readonly menuAccessibleName?: KrnHarnessText;
  readonly open?: boolean;
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly size?: string;
  readonly variant?: string;
  readonly tone?: string;
  readonly menuAlign?: string;
}

/**
 * Harness for both native action segments of `krn-split-button` and its connected ARIA menu.
 *
 * Overlay lookup follows the menu trigger's public `aria-controls` relationship, so tests do not
 * depend on CDK overlay DOM order.
 *
 * @publicApi
 */
export class KrnSplitButtonHarness extends ComponentHarness {
  static readonly hostSelector = 'krn-split-button';

  static with(options: KrnSplitButtonHarnessFilters = {}): HarnessPredicate<KrnSplitButtonHarness> {
    return new HarnessPredicate(KrnSplitButtonHarness, options)
      .addOption('primaryText', options.primaryText, (harness, value) =>
        textMatches(harness.getPrimaryText(), value),
      )
      .addOption('menuAccessibleName', options.menuAccessibleName, (harness, value) =>
        textMatches(harness.getMenuAccessibleName(), value),
      )
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

  private readonly primary = this.locatorFor('button[krnButton].krn-split-button__primary');
  private readonly menuTrigger = this.locatorFor(
    'button[krnButton].krn-split-button__menu-trigger[aria-haspopup="menu"]',
  );

  async getPrimaryText(): Promise<string> {
    return (await this.primary()).text({
      exclude: '.krn-action__icon, .krn-action__status',
    });
  }

  async getPrimaryAccessibleName(): Promise<string> {
    const primary = await this.primary();
    return (await primary.getAttribute('aria-label'))?.trim() || this.getPrimaryText();
  }

  async getMenuAccessibleName(): Promise<string> {
    return (await (await this.menuTrigger()).getAttribute('aria-label'))?.trim() || '';
  }

  async getMenuId(): Promise<string> {
    const id = await (await this.menuTrigger()).getAttribute('aria-controls');
    if (!id) {
      throw new Error('KrnSplitButton menu trigger does not expose aria-controls.');
    }
    return id;
  }

  async isOpen(): Promise<boolean> {
    return (await (await this.menuTrigger()).getAttribute('aria-expanded')) === 'true';
  }

  async isDisabled(): Promise<boolean> {
    return (await this.primary()).getProperty<boolean>('disabled');
  }

  async isMenuDisabled(): Promise<boolean> {
    return (await this.menuTrigger()).getProperty<boolean>('disabled');
  }

  async isLoading(): Promise<boolean> {
    return booleanAttributeValue(await (await this.primary()).getAttribute('data-loading'));
  }

  async getSize(): Promise<string | null> {
    return (await this.primary()).getAttribute('data-size');
  }

  async getVariant(): Promise<string | null> {
    return (await this.primary()).getAttribute('data-variant');
  }

  async getTone(): Promise<string | null> {
    return (await this.primary()).getAttribute('data-tone');
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

  async clickPrimary(): Promise<void> {
    await (await this.primary()).click();
    await this.forceStabilize();
  }

  async open(): Promise<void> {
    if (!(await this.isOpen())) {
      await (await this.menuTrigger()).click();
      await this.forceStabilize();
    }
  }

  async close(): Promise<void> {
    if (await this.isOpen()) {
      const menu = await this.getMenu();
      if (menu) {
        await menu.sendKeys(TestKey.ESCAPE);
      } else {
        await (await this.menuTrigger()).click();
      }
      await this.forceStabilize();
    }
  }

  async clickItem(index: number): Promise<void> {
    const items = await this.getMenuItems();
    const item = items[index];
    if (!item) {
      throw new Error(`KrnSplitButton menu item ${index} does not exist.`);
    }
    await item.click();
    await this.forceStabilize();
  }

  async focusPrimary(): Promise<void> {
    await (await this.primary()).focus();
  }

  async isPrimaryFocused(): Promise<boolean> {
    return (await this.primary()).isFocused();
  }

  async focusMenuTrigger(): Promise<void> {
    await (await this.menuTrigger()).focus();
  }

  async isMenuTriggerFocused(): Promise<boolean> {
    return (await this.menuTrigger()).isFocused();
  }

  async getPrimary(): Promise<TestElement> {
    return this.primary();
  }

  async getMenuTrigger(): Promise<TestElement> {
    return this.menuTrigger();
  }
}
