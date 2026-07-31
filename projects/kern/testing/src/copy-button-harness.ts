import { ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';
import type { BaseHarnessFilters, TestElement } from '@angular/cdk/testing';
import type { KrnHarnessText } from './harness-utilities';
import { booleanAttributeValue, textMatches } from './harness-utilities';

export interface KrnCopyButtonHarnessFilters extends BaseHarnessFilters {
  /** Matches the accessible name exposed by the inner native button. */
  readonly accessibleName?: KrnHarnessText;
  /** Matches the visible label of the inner native button. */
  readonly text?: KrnHarnessText;
  readonly state?: string;
  readonly size?: string;
  readonly variant?: string;
  readonly tone?: string;
  readonly disabled?: boolean;
  readonly pending?: boolean;
}

/**
 * Harness for `krn-copy-button`.
 *
 * State and appearance are read from the custom-element host while focus and
 * activation are delegated to its inner native button.
 *
 * @publicApi
 */
export class KrnCopyButtonHarness extends ComponentHarness {
  static readonly hostSelector = 'krn-copy-button';

  static with(options: KrnCopyButtonHarnessFilters = {}): HarnessPredicate<KrnCopyButtonHarness> {
    return new HarnessPredicate(KrnCopyButtonHarness, options)
      .addOption('accessibleName', options.accessibleName, (harness, value) =>
        textMatches(harness.getAccessibleName(), value),
      )
      .addOption('text', options.text, (harness, value) => textMatches(harness.getText(), value))
      .addOption(
        'state',
        options.state,
        async (harness, value) => (await harness.getState()) === value,
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
        'disabled',
        options.disabled,
        async (harness, value) => (await harness.isDisabled()) === value,
      )
      .addOption(
        'pending',
        options.pending,
        async (harness, value) => (await harness.isPending()) === value,
      );
  }

  private readonly nativeButton = this.locatorFor('button[krnButton]');
  private readonly feedback = this.locatorFor('.krn-copy-status');

  async getAccessibleName(): Promise<string> {
    const button = await this.nativeButton();
    const labelledBy = await button.getAttribute('aria-labelledby');
    const labelledByText = await this.getAriaLabelledByText(labelledBy);

    return labelledByText || (await button.getAttribute('aria-label'))?.trim() || this.getText();
  }

  async getText(): Promise<string> {
    return (await this.nativeButton()).text({
      exclude: '.krn-action__icon, .krn-action__status, .krn-copy-indicator',
    });
  }

  async getState(): Promise<string | null> {
    return (await this.host()).getAttribute('data-state');
  }

  async getFeedbackText(): Promise<string> {
    return (await this.feedback()).text();
  }

  async getSize(): Promise<string | null> {
    return (await this.host()).getAttribute('data-size');
  }

  async getVariant(): Promise<string | null> {
    return (await this.host()).getAttribute('data-variant');
  }

  async getTone(): Promise<string | null> {
    return (await this.host()).getAttribute('data-tone');
  }

  async isDisabled(): Promise<boolean> {
    return (await this.nativeButton()).getProperty<boolean>('disabled');
  }

  async isPending(): Promise<boolean> {
    return booleanAttributeValue(await (await this.host()).getAttribute('data-pending'));
  }

  async click(): Promise<void> {
    await (await this.nativeButton()).click();
  }

  async focus(): Promise<void> {
    await (await this.nativeButton()).focus();
  }

  async isFocused(): Promise<boolean> {
    return (await this.nativeButton()).isFocused();
  }

  async getNativeButton(): Promise<TestElement> {
    return this.nativeButton();
  }

  private async getAriaLabelledByText(labelledBy: string | null): Promise<string> {
    const ids = labelledBy?.trim().split(/\s+/).filter(Boolean) ?? [];
    if (ids.length === 0) {
      return '';
    }

    const labelledElements = await this.documentRootLocatorFactory().locatorForAll('[id]')();
    const entries = await Promise.all(
      labelledElements.map(
        async (element) => [await element.getAttribute('id'), await element.text()] as const,
      ),
    );
    const textById = new Map(
      entries.filter((entry): entry is readonly [string, string] => entry[0] !== null),
    );

    return ids
      .map((id) => textById.get(id) ?? '')
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
