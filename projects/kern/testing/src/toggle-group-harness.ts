import { ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';
import type { BaseHarnessFilters } from '@angular/cdk/testing';
import { KrnToggleButtonHarness, type KrnToggleButtonHarnessFilters } from './button-harness';
import type { KrnHarnessText } from './harness-utilities';
import { booleanAttributeValue, textMatches } from './harness-utilities';

export interface KrnToggleGroupHarnessFilters extends BaseHarnessFilters {
  /** Matches the native `aria-label` value on the toolbar host. */
  readonly ariaLabel?: KrnHarnessText;
  /** Matches the native `aria-labelledby` reference list on the toolbar host. */
  readonly ariaLabelledBy?: KrnHarnessText;
  /** Matches the name resolved from `aria-labelledby` or `aria-label`. */
  readonly accessibleName?: KrnHarnessText;
  readonly orientation?: string;
  readonly multiple?: boolean;
  readonly disabled?: boolean;
}

class KrnDirectToggleHarnessPredicate extends HarnessPredicate<KrnToggleButtonHarness> {
  constructor(predicate: HarnessPredicate<KrnToggleButtonHarness>) {
    super(predicate.harnessType, {});
    this.add(
      predicate.getDescription() || 'matches the requested toggle-button filters',
      (harness) => predicate.evaluate(harness),
    );
  }

  override getSelector(): string {
    return ':scope > button[krnToggleButton]';
  }
}

/**
 * Harness for the canonical `div[krnToggleGroup]` toolbar and its legacy element alias.
 *
 * It exposes effective pressed values and direct native toggle children without
 * coupling tests to the private item-registration or roving-focus implementation.
 *
 * @publicApi
 */
export class KrnToggleGroupHarness extends ComponentHarness {
  static readonly hostSelector = 'div[krnToggleGroup], krn-toggle-group';

  static with(options: KrnToggleGroupHarnessFilters = {}): HarnessPredicate<KrnToggleGroupHarness> {
    return new HarnessPredicate(KrnToggleGroupHarness, options)
      .addOption('ariaLabel', options.ariaLabel, (harness, value) =>
        textMatches(harness.getAriaLabel(), value),
      )
      .addOption('ariaLabelledBy', options.ariaLabelledBy, (harness, value) =>
        textMatches(harness.getAriaLabelledBy(), value),
      )
      .addOption('accessibleName', options.accessibleName, (harness, value) =>
        textMatches(harness.getAccessibleName(), value),
      )
      .addOption(
        'orientation',
        options.orientation,
        async (harness, value) => (await harness.getOrientation()) === value,
      )
      .addOption(
        'multiple',
        options.multiple,
        async (harness, value) => (await harness.isMultiple()) === value,
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

  async getAriaLabelledBy(): Promise<string | null> {
    return (await this.host()).getAttribute('aria-labelledby');
  }

  async getAccessibleName(): Promise<string> {
    const labelledBy = await this.getAriaLabelledByText();
    return labelledBy || (await this.getAriaLabel())?.trim() || '';
  }

  async getOrientation(): Promise<string | null> {
    return (await this.host()).getAttribute('aria-orientation');
  }

  async isMultiple(): Promise<boolean> {
    return booleanAttributeValue(await (await this.host()).getAttribute('data-multiple'));
  }

  async isDisabled(): Promise<boolean> {
    return booleanAttributeValue(await (await this.host()).getAttribute('aria-disabled'));
  }

  async getToggleButtons(
    filters: KrnToggleButtonHarnessFilters = {},
  ): Promise<readonly KrnToggleButtonHarness[]> {
    return this.locatorForAll(
      new KrnDirectToggleHarnessPredicate(KrnToggleButtonHarness.with(filters)),
    )();
  }

  async getValues(): Promise<readonly string[]> {
    const pressed = await this.getToggleButtons({ pressed: true });
    return Promise.all(pressed.map((button) => button.getValue()));
  }

  private async getAriaLabelledByText(): Promise<string> {
    const labelledBy = await this.getAriaLabelledBy();
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
