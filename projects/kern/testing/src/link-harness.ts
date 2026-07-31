import { ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';
import type { BaseHarnessFilters, TestElement } from '@angular/cdk/testing';
import type { KrnHarnessText } from './harness-utilities';
import { textMatches } from './harness-utilities';

export interface KrnLinkHarnessFilters extends BaseHarnessFilters {
  /** Matches the native anchor text. */
  readonly text?: KrnHarnessText;
  /** Matches the accessible label exposed by the native anchor. */
  readonly ariaLabel?: KrnHarnessText;
  /** Matches the native `aria-labelledby` reference list. */
  readonly ariaLabelledBy?: KrnHarnessText;
  /** Matches the serialized native href rather than an absolute DOM property URL. */
  readonly href?: KrnHarnessText;
  readonly target?: KrnHarnessText;
  readonly rel?: KrnHarnessText;
  readonly download?: KrnHarnessText;
  readonly hasHref?: boolean;
}

/**
 * Harness for the native `a[krnLink]` host.
 *
 * Consumers should prefer this API over querying KERN presentation classes.
 *
 * @publicApi
 */
export class KrnLinkHarness extends ComponentHarness {
  static readonly hostSelector = 'a[krnLink]';

  static with(options: KrnLinkHarnessFilters = {}): HarnessPredicate<KrnLinkHarness> {
    return new HarnessPredicate(KrnLinkHarness, options)
      .addOption('text', options.text, (harness, value) => textMatches(harness.getText(), value))
      .addOption('ariaLabel', options.ariaLabel, (harness, value) =>
        textMatches(harness.getAriaLabel(), value),
      )
      .addOption('ariaLabelledBy', options.ariaLabelledBy, (harness, value) =>
        textMatches(harness.getAriaLabelledBy(), value),
      )
      .addOption('href', options.href, (harness, value) => textMatches(harness.getHref(), value))
      .addOption('target', options.target, (harness, value) =>
        textMatches(harness.getTarget(), value),
      )
      .addOption('rel', options.rel, (harness, value) => textMatches(harness.getRel(), value))
      .addOption('download', options.download, (harness, value) =>
        textMatches(harness.getDownload(), value),
      )
      .addOption(
        'hasHref',
        options.hasHref,
        async (harness, value) => (await harness.hasHref()) === value,
      );
  }

  async getText(): Promise<string> {
    return (await this.host()).text();
  }

  async getAriaLabel(): Promise<string | null> {
    return (await this.host()).getAttribute('aria-label');
  }

  async getAriaLabelledBy(): Promise<string | null> {
    return (await this.host()).getAttribute('aria-labelledby');
  }

  async getHref(): Promise<string | null> {
    return (await this.host()).getAttribute('href');
  }

  async hasHref(): Promise<boolean> {
    return (await this.getHref()) !== null;
  }

  async getTarget(): Promise<string | null> {
    return (await this.host()).getAttribute('target');
  }

  async getRel(): Promise<string | null> {
    return (await this.host()).getAttribute('rel');
  }

  async getDownload(): Promise<string | null> {
    return (await this.host()).getAttribute('download');
  }

  async getReferrerPolicy(): Promise<string | null> {
    return (await this.host()).getAttribute('referrerpolicy');
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

  async getNativeLink(): Promise<TestElement> {
    return this.host();
  }
}
