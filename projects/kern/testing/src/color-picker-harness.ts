import { ComponentHarness, HarnessPredicate, TestKey } from '@angular/cdk/testing';
import type { BaseHarnessFilters, TestElement } from '@angular/cdk/testing';
import type { KrnHarnessText } from './harness-utilities';
import { booleanAttributeValue, optionalText, textMatches } from './harness-utilities';

export interface KrnColorPickerHarnessFilters extends BaseHarnessFilters {
  readonly value?: KrnHarnessText;
  readonly ariaLabel?: KrnHarnessText;
  readonly disabled?: boolean;
  readonly readonly?: boolean;
  readonly invalid?: boolean;
  readonly open?: boolean;
}

export interface KrnColorPresetHarnessFilters extends BaseHarnessFilters {
  readonly ariaLabel?: KrnHarnessText;
  readonly selected?: boolean;
  readonly disabled?: boolean;
}

/** Harness for a color preset exposed inside `krn-color-picker`. */
export class KrnColorPresetHarness extends ComponentHarness {
  static readonly hostSelector = '.krn-color-swatches button';

  static with(options: KrnColorPresetHarnessFilters = {}): HarnessPredicate<KrnColorPresetHarness> {
    return new HarnessPredicate(KrnColorPresetHarness, options)
      .addOption('ariaLabel', options.ariaLabel, (harness, value) =>
        textMatches(harness.getAriaLabel(), value),
      )
      .addOption(
        'selected',
        options.selected,
        async (harness, value) => (await harness.isSelected()) === value,
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

  async isSelected(): Promise<boolean> {
    return booleanAttributeValue(await (await this.host()).getAttribute('aria-pressed'));
  }

  async isDisabled(): Promise<boolean> {
    return (await this.host()).getProperty<boolean>('disabled');
  }

  async click(): Promise<void> {
    await (await this.host()).click();
  }
}

/**
 * Harness for `krn-color-picker`.
 *
 * @publicApi
 */
export class KrnColorPickerHarness extends ComponentHarness {
  static readonly hostSelector = 'krn-color-picker';

  static with(options: KrnColorPickerHarnessFilters = {}): HarnessPredicate<KrnColorPickerHarness> {
    return new HarnessPredicate(KrnColorPickerHarness, options)
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
        'readonly',
        options.readonly,
        async (harness, value) => (await harness.isReadonly()) === value,
      )
      .addOption(
        'invalid',
        options.invalid,
        async (harness, value) => (await harness.isInvalid()) === value,
      )
      .addOption(
        'open',
        options.open,
        async (harness, value) => (await harness.isOpen()) === value,
      );
  }

  private readonly shell = this.locatorFor('.krn-control-shell');
  private readonly trigger = this.locatorFor('.krn-picker__trigger');
  private readonly triggerValue = this.locatorFor('.krn-color-trigger__value');
  private readonly textInput = this.locatorForOptional('.krn-color-text');
  private readonly hueInput = this.locatorForOptional('.krn-color-range--hue');
  private readonly saturationInput = this.locatorForOptional(
    '.krn-color-range:not(.krn-color-range--hue)',
  );
  private readonly status = this.locatorForOptional('.krn-color-status');
  private readonly doneButton = this.locatorForOptional('.krn-picker__footer button');

  async getValueText(): Promise<string> {
    return (await this.triggerValue()).text();
  }

  async getAriaLabel(): Promise<string | null> {
    return (await this.trigger()).getAttribute('aria-label');
  }

  async isDisabled(): Promise<boolean> {
    return (await this.trigger()).getProperty<boolean>('disabled');
  }

  async isReadonly(): Promise<boolean> {
    return booleanAttributeValue(await (await this.shell()).getAttribute('data-readonly'));
  }

  async isInvalid(): Promise<boolean> {
    return booleanAttributeValue(await (await this.trigger()).getAttribute('aria-invalid'));
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

  async getPresets(
    filters: KrnColorPresetHarnessFilters = {},
  ): Promise<readonly KrnColorPresetHarness[]> {
    await this.open();
    return this.locatorForAll(KrnColorPresetHarness.with(filters))();
  }

  async selectPreset(filters: KrnColorPresetHarnessFilters): Promise<void> {
    const preset = (await this.getPresets(filters))[0];
    if (!preset) {
      throw new Error('Could not find a KERN color preset matching the supplied filters.');
    }
    await preset.click();
  }

  async getTextValue(): Promise<string> {
    await this.open();
    const input = await this.textInput();
    if (!input) throw new Error('The KERN color-picker text input is not available.');
    return input.getProperty<string>('value');
  }

  async setValue(value: string): Promise<void> {
    await this.open();
    const input = await this.textInput();
    if (!input) throw new Error('The KERN color-picker text input is not available.');
    await input.setInputValue(value);
    await input.dispatchEvent('input');
  }

  async getHue(): Promise<number> {
    await this.open();
    const input = await this.hueInput();
    if (!input) throw new Error('The KERN color-picker hue input is not available.');
    return input.getProperty<number>('valueAsNumber');
  }

  async setHue(value: number): Promise<void> {
    if (!Number.isInteger(value) || value < 0 || value > 359) {
      throw new Error(`Color-picker hue must be an integer from 0 to 359; received ${value}.`);
    }
    await this.open();
    const input = await this.hueInput();
    if (!input) throw new Error('The KERN color-picker hue input is not available.');
    await input.setInputValue(String(value));
    await input.dispatchEvent('input');
  }

  async getSaturation(): Promise<number> {
    await this.open();
    const input = await this.saturationInput();
    if (!input) throw new Error('The KERN color-picker saturation input is not available.');
    return input.getProperty<number>('valueAsNumber');
  }

  async setSaturation(value: number): Promise<void> {
    if (!Number.isInteger(value) || value < 0 || value > 100) {
      throw new Error(
        `Color-picker saturation must be an integer from 0 to 100; received ${value}.`,
      );
    }
    await this.open();
    const input = await this.saturationInput();
    if (!input) throw new Error('The KERN color-picker saturation input is not available.');
    await input.setInputValue(String(value));
    await input.dispatchEvent('input');
  }

  async getStatusText(): Promise<string | null> {
    await this.open();
    return optionalText(this.status());
  }

  async finish(): Promise<void> {
    await this.open();
    const button = await this.doneButton();
    if (!button) throw new Error('The KERN color-picker completion button is not available.');
    if (await button.getProperty<boolean>('disabled')) {
      throw new Error('The KERN color-picker cannot finish while its current value is invalid.');
    }
    await button.click();
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
