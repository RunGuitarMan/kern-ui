import { ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';
import type { BaseHarnessFilters, TestElement } from '@angular/cdk/testing';
import type { KrnHarnessText } from './harness-utilities';
import { booleanAttributeValue, textMatches } from './harness-utilities';

export interface KrnFormControlHarnessFilters extends BaseHarnessFilters {
  readonly value?: KrnHarnessText;
  readonly ariaLabel?: KrnHarnessText;
  readonly placeholder?: KrnHarnessText;
  readonly disabled?: boolean;
  readonly readonly?: boolean;
  readonly required?: boolean;
  readonly invalid?: boolean;
}

/**
 * Harness for KERN's native text-like controls.
 *
 * It covers text, password, search and number inputs as well as textareas while
 * preserving a single interaction contract for consumer tests.
 *
 * @publicApi
 */
export class KrnFormControlHarness extends ComponentHarness {
  static readonly hostSelector = [
    'krn-text-input',
    'krn-textarea',
    'krn-password-input',
    'krn-search-input',
    'krn-number-input',
  ].join(', ');

  static with(options: KrnFormControlHarnessFilters = {}): HarnessPredicate<KrnFormControlHarness> {
    return new HarnessPredicate(KrnFormControlHarness, options)
      .addOption('value', options.value, (harness, value) => textMatches(harness.getValue(), value))
      .addOption('ariaLabel', options.ariaLabel, (harness, value) =>
        textMatches(harness.getAriaLabel(), value),
      )
      .addOption('placeholder', options.placeholder, (harness, value) =>
        textMatches(harness.getPlaceholder(), value),
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

  private readonly control = this.locatorFor('input, textarea');

  async getValue(): Promise<string> {
    return (await this.control()).getProperty<string>('value');
  }

  async setValue(value: string): Promise<void> {
    const control = await this.control();
    await control.setInputValue(value);
    await control.dispatchEvent('input');
  }

  async getId(): Promise<string | null> {
    return (await this.control()).getAttribute('id');
  }

  async getAriaLabel(): Promise<string | null> {
    return (await this.control()).getAttribute('aria-label');
  }

  async getPlaceholder(): Promise<string | null> {
    return (await this.control()).getAttribute('placeholder');
  }

  async getInputType(): Promise<string | null> {
    const control = await this.control();
    if ((await control.getProperty<string>('tagName')).toLowerCase() === 'textarea') {
      return null;
    }
    return control.getAttribute('type');
  }

  async getDescribedBy(): Promise<readonly string[]> {
    const value = await (await this.control()).getAttribute('aria-describedby');
    return value?.split(/\s+/).filter(Boolean) ?? [];
  }

  async isDisabled(): Promise<boolean> {
    return (await this.control()).getProperty<boolean>('disabled');
  }

  async isReadonly(): Promise<boolean> {
    return (await this.control()).getProperty<boolean>('readOnly');
  }

  async isRequired(): Promise<boolean> {
    return (await this.control()).getProperty<boolean>('required');
  }

  async isInvalid(): Promise<boolean> {
    return booleanAttributeValue(await (await this.control()).getAttribute('aria-invalid'));
  }

  async focus(): Promise<void> {
    await (await this.control()).focus();
  }

  async blur(): Promise<void> {
    await (await this.control()).blur();
  }

  async isFocused(): Promise<boolean> {
    return (await this.control()).isFocused();
  }

  async getNativeControl(): Promise<TestElement> {
    return this.control();
  }
}
