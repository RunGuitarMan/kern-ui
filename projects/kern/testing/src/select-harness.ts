import { ComponentHarness, HarnessPredicate, TestKey } from '@angular/cdk/testing';
import type { BaseHarnessFilters, TestElement } from '@angular/cdk/testing';
import type { KrnHarnessText } from './harness-utilities';
import { booleanAttributeValue, optionalText, textMatches } from './harness-utilities';

export interface KrnSelectHarnessFilters extends BaseHarnessFilters {
  readonly value?: KrnHarnessText;
  readonly ariaLabel?: KrnHarnessText;
  readonly disabled?: boolean;
  readonly open?: boolean;
  readonly required?: boolean;
  readonly invalid?: boolean;
}

export interface KrnSelectOptionHarnessFilters extends BaseHarnessFilters {
  readonly text?: KrnHarnessText;
  readonly disabled?: boolean;
  readonly selected?: boolean;
}

/** @publicApi */
export class KrnSelectOptionHarness extends ComponentHarness {
  static readonly hostSelector = '.krn-option[role="option"]';

  static with(
    options: KrnSelectOptionHarnessFilters = {},
  ): HarnessPredicate<KrnSelectOptionHarness> {
    return new HarnessPredicate(KrnSelectOptionHarness, options)
      .addOption('text', options.text, (harness, value) => textMatches(harness.getText(), value))
      .addOption(
        'disabled',
        options.disabled,
        async (harness, value) => (await harness.isDisabled()) === value,
      )
      .addOption(
        'selected',
        options.selected,
        async (harness, value) => (await harness.isSelected()) === value,
      );
  }

  async getText(): Promise<string> {
    return (await this.host()).text({ exclude: '.krn-option__check' });
  }

  async isDisabled(): Promise<boolean> {
    return booleanAttributeValue(await (await this.host()).getAttribute('aria-disabled'));
  }

  async isSelected(): Promise<boolean> {
    return booleanAttributeValue(await (await this.host()).getAttribute('aria-selected'));
  }

  async click(): Promise<void> {
    await (await this.host()).click();
  }
}

/**
 * Harness for `krn-select`.
 *
 * @publicApi
 */
export class KrnSelectHarness extends ComponentHarness {
  static readonly hostSelector: string = 'krn-select';

  static with(options: KrnSelectHarnessFilters = {}): HarnessPredicate<KrnSelectHarness> {
    return new HarnessPredicate(KrnSelectHarness, options)
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
      .addOption('open', options.open, async (harness, value) => (await harness.isOpen()) === value)
      .addOption(
        'required',
        options.required,
        async (harness, value) => (await harness.isRequired()) === value,
      )
      .addOption(
        'invalid',
        options.invalid,
        async (harness, value) => (await harness.isInvalid()) === value,
      );
  }

  private readonly trigger = this.locatorFor('.krn-select-trigger');
  private readonly value = this.locatorForOptional('.krn-select-value');
  private readonly placeholder = this.locatorForOptional('.krn-select-placeholder');

  async getValueText(): Promise<string | null> {
    return optionalText(this.value());
  }

  async getPlaceholderText(): Promise<string | null> {
    return optionalText(this.placeholder());
  }

  async getAriaLabel(): Promise<string | null> {
    return (await this.trigger()).getAttribute('aria-label');
  }

  async getId(): Promise<string | null> {
    return (await this.trigger()).getAttribute('id');
  }

  async isOpen(): Promise<boolean> {
    return booleanAttributeValue(await (await this.trigger()).getAttribute('aria-expanded'));
  }

  async isDisabled(): Promise<boolean> {
    return (await this.trigger()).getProperty<boolean>('disabled');
  }

  async isReadonly(): Promise<boolean> {
    return booleanAttributeValue(await (await this.trigger()).getAttribute('aria-readonly'));
  }

  async isRequired(): Promise<boolean> {
    return booleanAttributeValue(await (await this.trigger()).getAttribute('aria-required'));
  }

  async isInvalid(): Promise<boolean> {
    return booleanAttributeValue(await (await this.trigger()).getAttribute('aria-invalid'));
  }

  async open(): Promise<void> {
    if (!(await this.isOpen())) {
      await (await this.trigger()).click();
    }
  }

  async close(): Promise<void> {
    if (await this.isOpen()) {
      await (await this.trigger()).sendKeys(TestKey.ESCAPE);
    }
  }

  async getOptions(
    filters: KrnSelectOptionHarnessFilters = {},
  ): Promise<readonly KrnSelectOptionHarness[]> {
    if (!(await this.isOpen())) {
      await this.open();
    }
    return this.locatorForAll(KrnSelectOptionHarness.with(filters))();
  }

  async getOptionTexts(): Promise<readonly string[]> {
    return Promise.all((await this.getOptions()).map((option) => option.getText()));
  }

  async selectOption(filters: KrnSelectOptionHarnessFilters): Promise<void> {
    if (!(await this.isOpen())) {
      await this.open();
    }
    const option = await this.locatorForOptional(KrnSelectOptionHarness.with(filters))();
    if (!option) {
      throw new Error('Could not find a KERN select option matching the supplied filters.');
    }
    await option.click();
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
