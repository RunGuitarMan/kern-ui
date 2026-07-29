import { ComponentHarness, HarnessPredicate, TestKey } from '@angular/cdk/testing';
import type { BaseHarnessFilters, TestElement } from '@angular/cdk/testing';
import type { KrnHarnessText } from './harness-utilities';
import { booleanAttributeValue, textMatches } from './harness-utilities';

export interface KrnResizablePanelsHarnessFilters extends BaseHarnessFilters {
  readonly orientation?: 'horizontal' | 'vertical';
  readonly disabled?: boolean;
  readonly resizing?: boolean;
  readonly panelCount?: number;
}

export interface KrnResizablePanelHarnessFilters extends BaseHarnessFilters {
  readonly ariaLabel?: KrnHarnessText;
  readonly overflow?: 'auto' | 'visible' | 'clip';
  readonly size?: number;
}

export interface KrnResizeHandleHarnessFilters extends BaseHarnessFilters {
  readonly ariaLabel?: KrnHarnessText;
  readonly orientation?: 'horizontal' | 'vertical';
  readonly value?: number;
  readonly disabled?: boolean;
}

const numericAttribute = async (element: TestElement, name: string): Promise<number | null> => {
  const value = await element.getAttribute(name);
  if (value === null) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

/** Harness for `krn-resizable-panel`. */
export class KrnResizablePanelHarness extends ComponentHarness {
  static readonly hostSelector = 'krn-resizable-panel';

  static with(
    options: KrnResizablePanelHarnessFilters = {},
  ): HarnessPredicate<KrnResizablePanelHarness> {
    return new HarnessPredicate(KrnResizablePanelHarness, options)
      .addOption('ariaLabel', options.ariaLabel, (harness, value) =>
        textMatches(harness.getAriaLabel(), value),
      )
      .addOption(
        'overflow',
        options.overflow,
        async (harness, value) => (await harness.getOverflow()) === value,
      )
      .addOption(
        'size',
        options.size,
        async (harness, value) => Math.abs((await harness.getSize()) - value) < 0.001,
      );
  }

  async getId(): Promise<string | null> {
    return (await this.host()).getAttribute('id');
  }

  async getAriaLabel(): Promise<string | null> {
    return (await this.host()).getAttribute('aria-label');
  }

  async getOverflow(): Promise<'auto' | 'visible' | 'clip' | null> {
    const value = await (await this.host()).getAttribute('data-overflow');
    return value === 'auto' || value === 'visible' || value === 'clip' ? value : null;
  }

  async getSize(): Promise<number> {
    const host = await this.host();
    const computed = Number.parseFloat(await host.getCssValue('--krn-panel-size'));
    if (Number.isFinite(computed)) return computed;

    const style = (await host.getAttribute('style')) ?? '';
    const declared = /--krn-panel-size:\s*([\d.]+)%/.exec(style)?.[1];
    if (declared !== undefined) return Number(declared);
    throw new Error('The KERN resizable panel does not expose a managed percentage size.');
  }
}

/** Harness for `krn-resize-handle`. */
export class KrnResizeHandleHarness extends ComponentHarness {
  static readonly hostSelector = 'krn-resize-handle';

  static with(
    options: KrnResizeHandleHarnessFilters = {},
  ): HarnessPredicate<KrnResizeHandleHarness> {
    return new HarnessPredicate(KrnResizeHandleHarness, options)
      .addOption('ariaLabel', options.ariaLabel, (harness, value) =>
        textMatches(harness.getAriaLabel(), value),
      )
      .addOption(
        'orientation',
        options.orientation,
        async (harness, value) => (await harness.getOrientation()) === value,
      )
      .addOption(
        'value',
        options.value,
        async (harness, value) => (await harness.getValue()) === value,
      )
      .addOption(
        'disabled',
        options.disabled,
        async (harness, value) => (await harness.isDisabled()) === value,
      );
  }

  async getAriaLabel(): Promise<string | null> {
    return (await this.host()).getAttribute('aria-label');
  }

  async getOrientation(): Promise<'horizontal' | 'vertical' | null> {
    const value = await (await this.host()).getAttribute('aria-orientation');
    return value === 'horizontal' || value === 'vertical' ? value : null;
  }

  async getMinimum(): Promise<number | null> {
    return numericAttribute(await this.host(), 'aria-valuemin');
  }

  async getMaximum(): Promise<number | null> {
    return numericAttribute(await this.host(), 'aria-valuemax');
  }

  async getValue(): Promise<number | null> {
    return numericAttribute(await this.host(), 'aria-valuenow');
  }

  async getValueText(): Promise<string | null> {
    return (await this.host()).getAttribute('aria-valuetext');
  }

  async isDisabled(): Promise<boolean> {
    return booleanAttributeValue(await (await this.host()).getAttribute('aria-disabled'));
  }

  async sendKeys(...keys: (string | TestKey)[]): Promise<void> {
    await (await this.host()).sendKeys(...keys);
  }

  async moveTowardStart(): Promise<void> {
    await this.sendKeys(
      (await this.getOrientation()) === 'vertical' ? TestKey.UP_ARROW : TestKey.LEFT_ARROW,
    );
  }

  async moveTowardEnd(): Promise<void> {
    await this.sendKeys(
      (await this.getOrientation()) === 'vertical' ? TestKey.DOWN_ARROW : TestKey.RIGHT_ARROW,
    );
  }

  async setToMinimum(): Promise<void> {
    await this.sendKeys(TestKey.HOME);
  }

  async setToMaximum(): Promise<void> {
    await this.sendKeys(TestKey.END);
  }

  async reset(): Promise<void> {
    await this.sendKeys(TestKey.ENTER);
  }

  async focus(): Promise<void> {
    await (await this.host()).focus();
  }

  async isFocused(): Promise<boolean> {
    return (await this.host()).isFocused();
  }
}

/**
 * Harness for `krn-resizable-panels` and its panels and separator handles.
 *
 * @publicApi
 */
export class KrnResizablePanelsHarness extends ComponentHarness {
  static readonly hostSelector = 'krn-resizable-panels';

  static with(
    options: KrnResizablePanelsHarnessFilters = {},
  ): HarnessPredicate<KrnResizablePanelsHarness> {
    return new HarnessPredicate(KrnResizablePanelsHarness, options)
      .addOption(
        'orientation',
        options.orientation,
        async (harness, value) => (await harness.getOrientation()) === value,
      )
      .addOption(
        'disabled',
        options.disabled,
        async (harness, value) => (await harness.isDisabled()) === value,
      )
      .addOption(
        'resizing',
        options.resizing,
        async (harness, value) => (await harness.isResizing()) === value,
      )
      .addOption(
        'panelCount',
        options.panelCount,
        async (harness, value) => (await harness.getPanelCount()) === value,
      );
  }

  async getOrientation(): Promise<'horizontal' | 'vertical' | null> {
    const value = await (await this.host()).getAttribute('data-orientation');
    return value === 'horizontal' || value === 'vertical' ? value : null;
  }

  async isDisabled(): Promise<boolean> {
    return booleanAttributeValue(await (await this.host()).getAttribute('data-disabled'));
  }

  async isResizing(): Promise<boolean> {
    return booleanAttributeValue(await (await this.host()).getAttribute('data-resizing'));
  }

  async getPanels(
    filters: KrnResizablePanelHarnessFilters = {},
  ): Promise<readonly KrnResizablePanelHarness[]> {
    return this.locatorForAll(KrnResizablePanelHarness.with(filters))();
  }

  async getPanelCount(): Promise<number> {
    return (await this.getPanels()).length;
  }

  async getSizes(): Promise<readonly number[]> {
    return Promise.all((await this.getPanels()).map((panel) => panel.getSize()));
  }

  async getHandles(
    filters: KrnResizeHandleHarnessFilters = {},
  ): Promise<readonly KrnResizeHandleHarness[]> {
    return this.locatorForAll(KrnResizeHandleHarness.with(filters))();
  }
}
