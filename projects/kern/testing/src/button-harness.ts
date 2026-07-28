import { ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';
import type { BaseHarnessFilters, TestElement } from '@angular/cdk/testing';
import type { KrnHarnessText } from './harness-utilities';
import { booleanAttributeValue, textMatches } from './harness-utilities';

export interface KrnButtonHarnessFilters extends BaseHarnessFilters {
  /** Matches the projected button label. */
  readonly text?: KrnHarnessText;
  /** Matches the accessible label exposed by the native button. */
  readonly ariaLabel?: KrnHarnessText;
  readonly variant?: string;
  readonly tone?: string;
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly pressed?: boolean | null;
}

/**
 * Harness for `krn-button`.
 *
 * Consumers should prefer this API over querying KERN's internal DOM or CSS classes.
 *
 * @publicApi
 */
export class KrnButtonHarness extends ComponentHarness {
  static readonly hostSelector = 'krn-button';

  static with(options: KrnButtonHarnessFilters = {}): HarnessPredicate<KrnButtonHarness> {
    return new HarnessPredicate(KrnButtonHarness, options)
      .addOption('text', options.text, (harness, value) => textMatches(harness.getText(), value))
      .addOption('ariaLabel', options.ariaLabel, (harness, value) =>
        textMatches(harness.getAriaLabel(), value),
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
        'pressed',
        options.pressed,
        async (harness, value) => (await harness.isPressed()) === value,
      );
  }

  private readonly button = this.locatorFor('button');

  async getText(): Promise<string> {
    return (await this.button()).text({ exclude: '.krn-action__icon' });
  }

  async getAriaLabel(): Promise<string | null> {
    return (await this.button()).getAttribute('aria-label');
  }

  async getVariant(): Promise<string | null> {
    return (await this.button()).getAttribute('data-variant');
  }

  async getTone(): Promise<string | null> {
    return (await this.button()).getAttribute('data-tone');
  }

  async getSize(): Promise<string | null> {
    return (await this.button()).getAttribute('data-size');
  }

  async getType(): Promise<string | null> {
    return (await this.button()).getAttribute('type');
  }

  async getName(): Promise<string | null> {
    return (await this.button()).getAttribute('name');
  }

  async getValue(): Promise<string> {
    return (await this.button()).getProperty<string>('value');
  }

  async isDisabled(): Promise<boolean> {
    return (await this.button()).getProperty<boolean>('disabled');
  }

  async isLoading(): Promise<boolean> {
    return booleanAttributeValue(await (await this.button()).getAttribute('data-loading'));
  }

  async isPressed(): Promise<boolean | null> {
    const value = await (await this.button()).getAttribute('aria-pressed');
    return value === null ? null : value === 'true';
  }

  async click(): Promise<void> {
    await (await this.button()).click();
  }

  async focus(): Promise<void> {
    await (await this.button()).focus();
  }

  async isFocused(): Promise<boolean> {
    return (await this.button()).isFocused();
  }

  async getNativeButton(): Promise<TestElement> {
    return this.button();
  }
}
