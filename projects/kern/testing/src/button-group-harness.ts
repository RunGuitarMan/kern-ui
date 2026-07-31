import { ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';
import type { BaseHarnessFilters } from '@angular/cdk/testing';
import {
  KrnButtonHarness,
  type KrnButtonHarnessFilters,
  KrnIconButtonHarness,
  type KrnIconButtonHarnessFilters,
} from './button-harness';
import type { KrnHarnessText } from './harness-utilities';
import { booleanAttributeValue, textMatches } from './harness-utilities';

export interface KrnButtonGroupHarnessFilters extends BaseHarnessFilters {
  /** Matches the native `aria-label` value on the group host. */
  readonly ariaLabel?: KrnHarnessText;
  /** Matches the native `aria-labelledby` reference list on the group host. */
  readonly ariaLabelledBy?: KrnHarnessText;
  /** Matches the name resolved from `aria-labelledby` or `aria-label`. */
  readonly accessibleName?: KrnHarnessText;
  readonly orientation?: string;
  readonly connected?: boolean;
}

/**
 * Makes the CDK create an existing child harness only for elements matched by
 * a selector relative to the current group host.
 */
class KrnDirectChildHarnessPredicate<T extends ComponentHarness> extends HarnessPredicate<T> {
  constructor(
    private readonly directChildSelector: string,
    predicate: HarnessPredicate<T>,
  ) {
    super(predicate.harnessType, {});
    this.add(
      predicate.getDescription() || 'matches the requested child harness filters',
      (harness) => predicate.evaluate(harness),
    );
  }

  override getSelector(): string {
    return this.directChildSelector;
  }
}

/**
 * Harness for the canonical `div[krnButtonGroup]` host and its legacy element alias.
 *
 * Button Group is a stateless semantic and layout container. Selection belongs
 * to Toggle Group or Segmented Control, so this harness intentionally exposes
 * no value, pressed, or selection API.
 *
 * @publicApi
 */
export class KrnButtonGroupHarness extends ComponentHarness {
  static readonly hostSelector = 'div[krnButtonGroup], krn-button-group';

  static with(options: KrnButtonGroupHarnessFilters = {}): HarnessPredicate<KrnButtonGroupHarness> {
    return new HarnessPredicate(KrnButtonGroupHarness, options)
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
        'connected',
        options.connected,
        async (harness, value) => (await harness.isConnected()) === value,
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
    return (await this.host()).getAttribute('data-orientation');
  }

  async isConnected(): Promise<boolean> {
    return booleanAttributeValue(await (await this.host()).getAttribute('data-connected'));
  }

  async getButtons(filters: KrnButtonHarnessFilters = {}): Promise<readonly KrnButtonHarness[]> {
    return this.locatorForAll(
      new KrnDirectChildHarnessPredicate(
        ':scope > button[krnButton]',
        KrnButtonHarness.with(filters),
      ),
    )();
  }

  async getIconButtons(
    filters: KrnIconButtonHarnessFilters = {},
  ): Promise<readonly KrnIconButtonHarness[]> {
    return this.locatorForAll(
      new KrnDirectChildHarnessPredicate(
        ':scope > button[krnIconButton]',
        KrnIconButtonHarness.with(filters),
      ),
    )();
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
