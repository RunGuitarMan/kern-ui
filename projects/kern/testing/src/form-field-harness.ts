import { ContentContainerComponentHarness, HarnessPredicate } from '@angular/cdk/testing';
import type { BaseHarnessFilters, TestElement } from '@angular/cdk/testing';
import type { KrnHarnessText } from './harness-utilities';
import { allText, booleanAttributeValue, optionalText, textMatches } from './harness-utilities';

export interface KrnFormFieldHarnessFilters extends BaseHarnessFilters {
  readonly label?: KrnHarnessText;
  readonly hint?: KrnHarnessText;
  readonly error?: KrnHarnessText;
  readonly state?: string;
  readonly disabled?: boolean;
  readonly readonly?: boolean;
  readonly invalid?: boolean;
  readonly pending?: boolean;
  readonly required?: boolean;
}

/**
 * Harness for `krn-form-field`, including projected controls and descriptions.
 *
 * @publicApi
 */
export class KrnFormFieldHarness extends ContentContainerComponentHarness {
  static readonly hostSelector = 'krn-form-field';

  static with(options: KrnFormFieldHarnessFilters = {}): HarnessPredicate<KrnFormFieldHarness> {
    return new HarnessPredicate(KrnFormFieldHarness, options)
      .addOption('label', options.label, (harness, value) =>
        textMatches(harness.getLabelText(), value),
      )
      .addOption('hint', options.hint, (harness, value) =>
        textMatches(harness.getHintText(), value),
      )
      .addOption('error', options.error, (harness, value) =>
        textMatches(harness.getErrorText(), value),
      )
      .addOption(
        'state',
        options.state,
        async (harness, value) => (await harness.getState()) === value,
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
        'pending',
        options.pending,
        async (harness, value) => (await harness.isPending()) === value,
      )
      .addOption(
        'required',
        options.required,
        async (harness, value) => (await harness.isRequired()) === value,
      );
  }

  private readonly label = this.locatorForOptional('.krn-field-heading .krn-label');
  private readonly hints = this.locatorForAll('.krn-message:not(.krn-message--error)');
  private readonly errors = this.locatorForAll('.krn-message--error');
  private readonly control = this.locatorForOptional(
    '.krn-field-control [data-krn-form-field-control]',
  );

  async getLabelText(): Promise<string | null> {
    return optionalText(this.label(), { exclude: '.krn-required' });
  }

  async getHintTexts(): Promise<readonly string[]> {
    return allText(this.hints());
  }

  async getHintText(): Promise<string | null> {
    const hints = await this.getHintTexts();
    return hints.length ? hints.join(' ') : null;
  }

  async getErrorTexts(): Promise<readonly string[]> {
    return allText(this.errors(), { exclude: '.krn-message__mark' });
  }

  async getErrorText(): Promise<string | null> {
    const errors = await this.getErrorTexts();
    return errors.length ? errors.join(' ') : null;
  }

  async getState(): Promise<string | null> {
    return (await this.host()).getAttribute('data-state');
  }

  async isDisabled(): Promise<boolean> {
    return booleanAttributeValue(await (await this.host()).getAttribute('data-disabled'));
  }

  async isReadonly(): Promise<boolean> {
    return booleanAttributeValue(await (await this.host()).getAttribute('data-readonly'));
  }

  async isInvalid(): Promise<boolean> {
    return booleanAttributeValue(await (await this.host()).getAttribute('data-invalid'));
  }

  async isPending(): Promise<boolean> {
    return (await this.getState()) === 'pending';
  }

  async isRequired(): Promise<boolean> {
    return booleanAttributeValue(await (await this.host()).getAttribute('data-required'));
  }

  async isValid(): Promise<boolean> {
    return booleanAttributeValue(await (await this.host()).getAttribute('data-valid'));
  }

  async getControl(): Promise<TestElement | null> {
    return this.control();
  }

  async getControlId(): Promise<string | null> {
    const control = await this.control();
    if (control) {
      const id = await control.getAttribute('id');
      if (id) {
        return id;
      }
    }
    const label = await this.label();
    return label ? label.getAttribute('for') : null;
  }

  async getControlDescribedBy(): Promise<readonly string[]> {
    const control = await this.control();
    const value = await control?.getAttribute('aria-describedby');
    return value?.split(/\s+/).filter(Boolean) ?? [];
  }
}
