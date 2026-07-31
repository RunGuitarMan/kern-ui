import { ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';
import type { BaseHarnessFilters, TestElement } from '@angular/cdk/testing';
import type { KrnHarnessText } from './harness-utilities';
import { booleanAttributeValue, textMatches } from './harness-utilities';

export interface KrnButtonHarnessFilters extends BaseHarnessFilters {
  /** Matches the projected button label. */
  readonly text?: KrnHarnessText;
  /** Matches the accessible label exposed by the native button. */
  readonly ariaLabel?: KrnHarnessText;
  /** Matches the native `aria-labelledby` reference list. */
  readonly ariaLabelledBy?: KrnHarnessText;
  readonly variant?: string;
  readonly tone?: string;
  readonly size?: string;
  readonly disabled?: boolean;
  readonly loading?: boolean;
}

export interface KrnIconButtonHarnessFilters extends BaseHarnessFilters {
  /** Matches the accessible label exposed by the native icon button. */
  readonly ariaLabel?: KrnHarnessText;
  /** Matches the native `aria-labelledby` reference list. */
  readonly ariaLabelledBy?: KrnHarnessText;
  /** Matches the name resolved from `aria-labelledby` or `aria-label`. */
  readonly accessibleName?: KrnHarnessText;
  readonly variant?: string;
  readonly tone?: string;
  readonly size?: string;
  readonly disabled?: boolean;
  readonly loading?: boolean;
}

export interface KrnFloatingActionButtonHarnessFilters extends BaseHarnessFilters {
  /** Matches the projected action label in both extended and compact modes. */
  readonly text?: KrnHarnessText;
  /** Matches the accessible label exposed by the native floating action. */
  readonly ariaLabel?: KrnHarnessText;
  /** Matches the native `aria-labelledby` reference list. */
  readonly ariaLabelledBy?: KrnHarnessText;
  /** Matches the name resolved from ARIA or the persistent projected label. */
  readonly accessibleName?: KrnHarnessText;
  readonly variant?: string;
  readonly tone?: string;
  readonly size?: string;
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly extended?: boolean;
}

export interface KrnToggleButtonHarnessFilters extends BaseHarnessFilters {
  /** Matches the projected toggle label. */
  readonly text?: KrnHarnessText;
  /** Matches the accessible label exposed by the native toggle button. */
  readonly ariaLabel?: KrnHarnessText;
  /** Matches the native `aria-labelledby` reference list. */
  readonly ariaLabelledBy?: KrnHarnessText;
  readonly value?: string;
  readonly pressed?: boolean;
  readonly variant?: string;
  readonly tone?: string;
  readonly size?: string;
  readonly disabled?: boolean;
}

interface KrnNativeActionFilterValues {
  readonly ariaLabel?: KrnHarnessText;
  readonly ariaLabelledBy?: KrnHarnessText;
  readonly variant?: string;
  readonly tone?: string;
  readonly size?: string;
  readonly disabled?: boolean;
  readonly loading?: boolean;
}

function addNativeActionOptions<T extends KrnNativeActionHarness>(
  predicate: HarnessPredicate<T>,
  options: KrnNativeActionFilterValues,
): HarnessPredicate<T> {
  return predicate
    .addOption('ariaLabel', options.ariaLabel, (harness, value) =>
      textMatches(harness.getAriaLabel(), value),
    )
    .addOption('ariaLabelledBy', options.ariaLabelledBy, (harness, value) =>
      textMatches(harness.getAriaLabelledBy(), value),
    )
    .addOption(
      'variant',
      options.variant,
      async (harness, value) => (await harness.getVariant()) === value,
    )
    .addOption('tone', options.tone, async (harness, value) => (await harness.getTone()) === value)
    .addOption('size', options.size, async (harness, value) => (await harness.getSize()) === value)
    .addOption(
      'disabled',
      options.disabled,
      async (harness, value) => (await harness.isDisabled()) === value,
    )
    .addOption(
      'loading',
      options.loading,
      async (harness, value) => (await harness.isLoading()) === value,
    );
}

abstract class KrnNativeActionHarness extends ComponentHarness {
  async getAriaLabel(): Promise<string | null> {
    return (await this.host()).getAttribute('aria-label');
  }

  async getAriaLabelledBy(): Promise<string | null> {
    return (await this.host()).getAttribute('aria-labelledby');
  }

  async getVariant(): Promise<string | null> {
    return (await this.host()).getAttribute('data-variant');
  }

  async getTone(): Promise<string | null> {
    return (await this.host()).getAttribute('data-tone');
  }

  async getSize(): Promise<string | null> {
    return (await this.host()).getAttribute('data-size');
  }

  async getType(): Promise<string | null> {
    return (await this.host()).getAttribute('type');
  }

  async getName(): Promise<string | null> {
    return (await this.host()).getAttribute('name');
  }

  async getValue(): Promise<string> {
    return (await this.host()).getProperty<string>('value');
  }

  async isDisabled(): Promise<boolean> {
    return (await this.host()).getProperty<boolean>('disabled');
  }

  async isLoading(): Promise<boolean> {
    return booleanAttributeValue(await (await this.host()).getAttribute('data-loading'));
  }

  async click(): Promise<void> {
    await (await this.host()).click();
  }

  async focus(): Promise<void> {
    await (await this.host()).focus();
  }

  async isFocused(): Promise<boolean> {
    return (await this.host()).isFocused();
  }

  async getNativeButton(): Promise<TestElement> {
    return this.host();
  }

  protected async getAriaLabelledByText(): Promise<string> {
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

/**
 * Harness for the native `button[krnButton]` host.
 *
 * Consumers should prefer this API over querying KERN's internal DOM or CSS classes.
 *
 * @publicApi
 */
export class KrnButtonHarness extends KrnNativeActionHarness {
  static readonly hostSelector = 'button[krnButton]';

  static with(options: KrnButtonHarnessFilters = {}): HarnessPredicate<KrnButtonHarness> {
    return addNativeActionOptions(
      new HarnessPredicate(KrnButtonHarness, options).addOption(
        'text',
        options.text,
        (harness, value) => textMatches(harness.getText(), value),
      ),
      options,
    );
  }

  async getText(): Promise<string> {
    return (await this.host()).text({
      exclude: '.krn-action__icon, .krn-action__status',
    });
  }
}

/**
 * Harness for the native `button[krnFab]` host.
 *
 * The projected label remains queryable in compact mode because visual collapse
 * must not remove the native button's accessible name.
 *
 * @publicApi
 */
export class KrnFloatingActionButtonHarness extends KrnNativeActionHarness {
  static readonly hostSelector = 'button[krnFab]';

  static with(
    options: KrnFloatingActionButtonHarnessFilters = {},
  ): HarnessPredicate<KrnFloatingActionButtonHarness> {
    return addNativeActionOptions(
      new HarnessPredicate(KrnFloatingActionButtonHarness, options)
        .addOption('text', options.text, (harness, value) => textMatches(harness.getText(), value))
        .addOption('accessibleName', options.accessibleName, (harness, value) =>
          textMatches(harness.getAccessibleName(), value),
        )
        .addOption(
          'extended',
          options.extended,
          async (harness, value) => (await harness.isExtended()) === value,
        ),
      options,
    );
  }

  async getText(): Promise<string> {
    return (await this.host()).text({
      exclude: '.krn-action__icon, .krn-action__status',
    });
  }

  async getAccessibleName(): Promise<string> {
    const labelledBy = await this.getAriaLabelledByText();
    return labelledBy || (await this.getAriaLabel())?.trim() || (await this.getText()).trim();
  }

  async isExtended(): Promise<boolean> {
    return booleanAttributeValue(await (await this.host()).getAttribute('data-extended'));
  }
}

/**
 * Harness for the native `button[krnToggleButton]` host.
 *
 * It exposes the effective standalone or group-owned pressed state without
 * coupling tests to KERN's projected label DOM.
 *
 * @publicApi
 */
export class KrnToggleButtonHarness extends KrnNativeActionHarness {
  static readonly hostSelector = 'button[krnToggleButton]';

  static with(
    options: KrnToggleButtonHarnessFilters = {},
  ): HarnessPredicate<KrnToggleButtonHarness> {
    return addNativeActionOptions(
      new HarnessPredicate(KrnToggleButtonHarness, options)
        .addOption('text', options.text, (harness, value) => textMatches(harness.getText(), value))
        .addOption(
          'value',
          options.value,
          async (harness, value) => (await harness.getValue()) === value,
        )
        .addOption(
          'pressed',
          options.pressed,
          async (harness, value) => (await harness.isPressed()) === value,
        ),
      options,
    );
  }

  async getText(): Promise<string> {
    return (await this.host()).text({
      exclude: '.krn-action__icon',
    });
  }

  async isPressed(): Promise<boolean> {
    return booleanAttributeValue(await (await this.host()).getAttribute('aria-pressed'));
  }
}

/**
 * Harness for the native `button[krnIconButton]` host.
 *
 * It intentionally exposes native button state instead of relying on KERN's internal icon DOM.
 *
 * @publicApi
 */
export class KrnIconButtonHarness extends KrnNativeActionHarness {
  static readonly hostSelector = 'button[krnIconButton]';

  static with(options: KrnIconButtonHarnessFilters = {}): HarnessPredicate<KrnIconButtonHarness> {
    return addNativeActionOptions(
      new HarnessPredicate(KrnIconButtonHarness, options).addOption(
        'accessibleName',
        options.accessibleName,
        (harness, value) => textMatches(harness.getAccessibleName(), value),
      ),
      options,
    );
  }

  async getAccessibleName(): Promise<string> {
    const labelledBy = await this.getAriaLabelledByText();
    return labelledBy || (await this.getAriaLabel())?.trim() || '';
  }
}
