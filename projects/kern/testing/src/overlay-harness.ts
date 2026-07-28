import { ContentContainerComponentHarness, HarnessPredicate } from '@angular/cdk/testing';
import type { BaseHarnessFilters, TestElement } from '@angular/cdk/testing';
import type { KrnHarnessText } from './harness-utilities';
import { allText, optionalText, textMatches } from './harness-utilities';

export interface KrnOverlayHarnessFilters extends BaseHarnessFilters {
  readonly title?: KrnHarnessText;
  readonly ariaLabel?: KrnHarnessText;
  readonly role?: 'dialog' | 'alertdialog';
  readonly open?: boolean;
}

/**
 * Shared test contract for KERN's modal surfaces.
 *
 * @publicApi
 */
export abstract class KrnOverlayHarness extends ContentContainerComponentHarness {
  private readonly backdrop = this.locatorForOptional('.backdrop');
  private readonly panel = this.locatorForOptional('.surface');
  private readonly title = this.locatorForOptional('.surface h2');
  private readonly description = this.locatorForOptional('.surface .description');
  private readonly body = this.locatorForOptional('.surface .body');
  private readonly closeButton = this.locatorForOptional('.surface .close');
  private readonly actions = this.locatorForAll('.surface footer [krnDialogAction]');

  async isOpen(): Promise<boolean> {
    const backdrop = await this.backdrop();
    return (
      backdrop !== null &&
      (await backdrop.getAttribute('data-state')) === 'open' &&
      (await backdrop.getAttribute('aria-hidden')) !== 'true'
    );
  }

  async isClosing(): Promise<boolean> {
    const backdrop = await this.backdrop();
    return backdrop !== null && (await backdrop.getAttribute('data-state')) === 'closing';
  }

  async getRole(): Promise<string | null> {
    return (await this.panel())?.getAttribute('role') ?? null;
  }

  async getAriaLabel(): Promise<string | null> {
    return (await this.panel())?.getAttribute('aria-label') ?? null;
  }

  async getTitleText(): Promise<string | null> {
    return optionalText(this.title());
  }

  async getDescriptionText(): Promise<string | null> {
    return optionalText(this.description());
  }

  async getBodyText(): Promise<string | null> {
    return optionalText(this.body());
  }

  async getPosition(): Promise<string | null> {
    return (await this.backdrop())?.getAttribute('data-position') ?? null;
  }

  async getActionTexts(): Promise<readonly string[]> {
    return allText(this.actions());
  }

  async getActions(): Promise<readonly TestElement[]> {
    return this.actions();
  }

  async getPanel(): Promise<TestElement | null> {
    return this.panel();
  }

  async close(): Promise<void> {
    const button = await this.closeButton();
    if (!button) {
      throw new Error('The KERN overlay does not expose a close button.');
    }
    await button.click();
  }

  async clickBackdrop(): Promise<void> {
    const backdrop = await this.backdrop();
    if (!backdrop) {
      throw new Error('The KERN overlay is not rendered.');
    }
    await backdrop.click('center');
  }

  async focus(): Promise<void> {
    const panel = await this.panel();
    if (!panel) {
      throw new Error('The KERN overlay is not open.');
    }
    await panel.focus();
  }

  async isFocused(): Promise<boolean> {
    return (await this.panel())?.isFocused() ?? false;
  }
}

function addOverlayFilters<T extends KrnOverlayHarness>(
  predicate: HarnessPredicate<T>,
  options: KrnOverlayHarnessFilters,
): HarnessPredicate<T> {
  return predicate
    .addOption('title', options.title, (harness, value) =>
      textMatches(harness.getTitleText(), value),
    )
    .addOption('ariaLabel', options.ariaLabel, (harness, value) =>
      textMatches(harness.getAriaLabel(), value),
    )
    .addOption('role', options.role, async (harness, value) => (await harness.getRole()) === value)
    .addOption('open', options.open, async (harness, value) => (await harness.isOpen()) === value);
}

export class KrnDialogHarness extends KrnOverlayHarness {
  static readonly hostSelector = 'krn-dialog';

  static with(options: KrnOverlayHarnessFilters = {}): HarnessPredicate<KrnDialogHarness> {
    return addOverlayFilters(new HarnessPredicate(KrnDialogHarness, options), options);
  }
}

export class KrnAlertDialogHarness extends KrnOverlayHarness {
  static readonly hostSelector = 'krn-alert-dialog';

  static with(options: KrnOverlayHarnessFilters = {}): HarnessPredicate<KrnAlertDialogHarness> {
    return addOverlayFilters(new HarnessPredicate(KrnAlertDialogHarness, options), options);
  }
}

export class KrnDrawerHarness extends KrnOverlayHarness {
  static readonly hostSelector = 'krn-drawer';

  static with(options: KrnOverlayHarnessFilters = {}): HarnessPredicate<KrnDrawerHarness> {
    return addOverlayFilters(new HarnessPredicate(KrnDrawerHarness, options), options);
  }
}

export class KrnBottomSheetHarness extends KrnOverlayHarness {
  static readonly hostSelector = 'krn-bottom-sheet';

  static with(options: KrnOverlayHarnessFilters = {}): HarnessPredicate<KrnBottomSheetHarness> {
    return addOverlayFilters(new HarnessPredicate(KrnBottomSheetHarness, options), options);
  }
}
