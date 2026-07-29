import { ComponentHarness, HarnessPredicate, TestKey } from '@angular/cdk/testing';
import type {
  BaseHarnessFilters,
  ComponentHarnessConstructor,
  TestElement,
} from '@angular/cdk/testing';
import type { KrnHarnessText } from './harness-utilities';
import { booleanAttributeValue, textMatches } from './harness-utilities';
import {
  KrnSelectHarness,
  KrnSelectOptionHarness,
  type KrnSelectHarnessFilters,
  type KrnSelectOptionHarnessFilters,
} from './select-harness';

export interface KrnEditableComboboxHarnessFilters extends BaseHarnessFilters {
  readonly value?: KrnHarnessText;
  readonly ariaLabel?: KrnHarnessText;
  readonly disabled?: boolean;
  readonly open?: boolean;
}

/** Harness for `krn-multi-select`. */
export class KrnMultiSelectHarness extends KrnSelectHarness {
  static override readonly hostSelector: string = 'krn-multi-select';

  static override with(
    options: KrnSelectHarnessFilters = {},
  ): HarnessPredicate<KrnMultiSelectHarness> {
    return new HarnessPredicate(KrnMultiSelectHarness, options)
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

  private readonly tokens = this.locatorForAll('.krn-token');

  override async getValueText(): Promise<string | null> {
    const tokens = await this.getVisibleTokenTexts();
    return tokens.length > 0 ? tokens.join(', ') : null;
  }

  async getVisibleTokenTexts(): Promise<readonly string[]> {
    return Promise.all((await this.tokens()).map((token) => token.text()));
  }

  async getSelectedTexts(): Promise<readonly string[]> {
    const options = await this.getOptions({ selected: true });
    return Promise.all(options.map((option) => option.getText()));
  }

  async toggleOption(filters: KrnSelectOptionHarnessFilters): Promise<void> {
    await this.selectOption(filters);
  }
}

/** Shared harness contract for editable comboboxes. */
export abstract class KrnEditableComboboxHarness extends ComponentHarness {
  private readonly input = this.locatorFor('input[role="combobox"]');
  private readonly toggle = this.locatorFor('.krn-combobox-toggle');

  protected static predicate<T extends KrnEditableComboboxHarness>(
    harnessType: ComponentHarnessConstructor<T>,
    options: KrnEditableComboboxHarnessFilters,
  ): HarnessPredicate<T> {
    return new HarnessPredicate(harnessType, options)
      .addOption('value', options.value, (harness, value) => textMatches(harness.getValue(), value))
      .addOption('ariaLabel', options.ariaLabel, (harness, value) =>
        textMatches(harness.getAriaLabel(), value),
      )
      .addOption(
        'disabled',
        options.disabled,
        async (harness, value) => (await harness.isDisabled()) === value,
      )
      .addOption(
        'open',
        options.open,
        async (harness, value) => (await harness.isOpen()) === value,
      );
  }

  async getValue(): Promise<string | null> {
    return (await this.input()).getProperty<string>('value');
  }

  async getAriaLabel(): Promise<string | null> {
    return (await this.input()).getAttribute('aria-label');
  }

  async isDisabled(): Promise<boolean> {
    return (await this.input()).getProperty<boolean>('disabled');
  }

  async isReadonly(): Promise<boolean> {
    return booleanAttributeValue(await (await this.input()).getAttribute('aria-readonly'));
  }

  async isOpen(): Promise<boolean> {
    return booleanAttributeValue(await (await this.input()).getAttribute('aria-expanded'));
  }

  async setValue(value: string): Promise<void> {
    const input = await this.input();
    await input.setInputValue(value);
    await input.dispatchEvent('input');
  }

  async open(): Promise<void> {
    if (!(await this.isOpen())) {
      await (await this.toggle()).click();
    }
  }

  async close(): Promise<void> {
    if (await this.isOpen()) {
      await (await this.input()).sendKeys(TestKey.ESCAPE);
    }
  }

  async getOptions(
    filters: KrnSelectOptionHarnessFilters = {},
  ): Promise<readonly KrnSelectOptionHarness[]> {
    await this.open();
    return this.locatorForAll(KrnSelectOptionHarness.with(filters))();
  }

  async selectOption(filters: KrnSelectOptionHarnessFilters): Promise<void> {
    const option = (await this.getOptions(filters))[0];
    if (!option) {
      throw new Error('Could not find a KERN combobox option matching the supplied filters.');
    }
    await option.click();
  }

  async getInput(): Promise<TestElement> {
    return this.input();
  }

  async getPlaceholder(): Promise<string | null> {
    return (await this.input()).getAttribute('placeholder');
  }
}

/** Harness for constrained `krn-combobox`. */
export class KrnComboboxHarness extends KrnEditableComboboxHarness {
  static readonly hostSelector = 'krn-combobox';

  static with(
    options: KrnEditableComboboxHarnessFilters = {},
  ): HarnessPredicate<KrnComboboxHarness> {
    return this.predicate(KrnComboboxHarness, options);
  }
}

/** Harness for free-text `krn-autocomplete`. */
export class KrnAutocompleteHarness extends KrnEditableComboboxHarness {
  static readonly hostSelector = 'krn-autocomplete';

  static with(
    options: KrnEditableComboboxHarnessFilters = {},
  ): HarnessPredicate<KrnAutocompleteHarness> {
    return this.predicate(KrnAutocompleteHarness, options);
  }
}
