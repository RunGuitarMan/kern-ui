import { ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';
import type { BaseHarnessFilters, TestElement } from '@angular/cdk/testing';
import type { KrnHarnessText } from './harness-utilities';
import { booleanAttributeValue, textMatches } from './harness-utilities';

export interface KrnFileUploadHarnessFilters extends BaseHarnessFilters {
  readonly label?: KrnHarnessText;
  readonly accept?: KrnHarnessText;
  readonly multiple?: boolean;
  readonly disabled?: boolean;
  readonly readonly?: boolean;
}

export interface KrnDropUploadHarnessFilters extends KrnFileUploadHarnessFilters {
  readonly dropLabel?: KrnHarnessText;
}

/** Shared harness contract for file upload controls. */
export abstract class KrnUploadHarness extends ComponentHarness {
  private readonly root = this.locatorFor('.krn-upload');
  private readonly input = this.locatorFor('input[type="file"]');
  private readonly button = this.locatorFor('.krn-upload__button');
  private readonly files = this.locatorForAll('.krn-file-name');

  async getLabel(): Promise<string> {
    return (await this.button()).text();
  }

  async getAccept(): Promise<string | null> {
    return (await this.input()).getAttribute('accept');
  }

  async isMultiple(): Promise<boolean> {
    return (await this.input()).getProperty<boolean>('multiple');
  }

  async isDisabled(): Promise<boolean> {
    return booleanAttributeValue(await (await this.root()).getAttribute('data-disabled'));
  }

  async isReadonly(): Promise<boolean> {
    return booleanAttributeValue(await (await this.root()).getAttribute('data-readonly'));
  }

  async getFileNames(): Promise<readonly string[]> {
    return Promise.all((await this.files()).map((file) => file.text()));
  }

  async removeFile(index = 0): Promise<void> {
    const buttons = await this.locatorForAll('.krn-file-list .krn-inline-action')();
    const button = buttons[index];
    if (!button) throw new Error(`Uploaded file ${index} does not expose a remove action.`);
    await button.click();
  }

  async getNativeInput(): Promise<TestElement> {
    return this.input();
  }

  async focus(): Promise<void> {
    await (await this.button()).focus();
  }

  async isFocused(): Promise<boolean> {
    return (await this.button()).isFocused();
  }
}

/** Harness for `krn-file-upload`. */
export class KrnFileUploadHarness extends KrnUploadHarness {
  static readonly hostSelector = 'krn-file-upload';

  static with(options: KrnFileUploadHarnessFilters = {}): HarnessPredicate<KrnFileUploadHarness> {
    return new HarnessPredicate(KrnFileUploadHarness, options)
      .addOption('label', options.label, (harness, value) => textMatches(harness.getLabel(), value))
      .addOption('accept', options.accept, (harness, value) =>
        textMatches(harness.getAccept(), value),
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
      )
      .addOption(
        'readonly',
        options.readonly,
        async (harness, value) => (await harness.isReadonly()) === value,
      );
  }
}

/** Harness for `krn-drop-upload` and its documented alias. */
export class KrnDropUploadHarness extends KrnUploadHarness {
  static readonly hostSelector = 'krn-drop-upload, krn-drag-drop-upload';

  static with(options: KrnDropUploadHarnessFilters = {}): HarnessPredicate<KrnDropUploadHarness> {
    return new HarnessPredicate(KrnDropUploadHarness, options)
      .addOption('label', options.label, (harness, value) => textMatches(harness.getLabel(), value))
      .addOption('dropLabel', options.dropLabel, (harness, value) =>
        textMatches(harness.getDropLabel(), value),
      )
      .addOption('accept', options.accept, (harness, value) =>
        textMatches(harness.getAccept(), value),
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
      )
      .addOption(
        'readonly',
        options.readonly,
        async (harness, value) => (await harness.isReadonly()) === value,
      );
  }

  async getDropLabel(): Promise<string> {
    return (await this.locatorFor('.krn-upload > strong')()).text();
  }
}
