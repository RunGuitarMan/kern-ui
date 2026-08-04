import { ComponentHarness } from '@angular/cdk/testing';

/** Harness for `krn-toast-viewport`. */
export class KrnToastViewportHarness extends ComponentHarness {
  static readonly hostSelector = 'krn-toast, krn-toast-viewport, krn-snackbar';

  private readonly toasts = this.locatorForAll('.toast');
  private readonly messages = this.locatorForAll('.toast .copy p');

  async getMessages(): Promise<readonly string[]> {
    return Promise.all((await this.messages()).map((message) => message.text()));
  }

  async getCount(): Promise<number> {
    return (await this.toasts()).length;
  }

  async dismiss(index = 0): Promise<void> {
    const dismissButtons = await this.locatorForAll('.toast .dismiss')();
    const button = dismissButtons[index];
    if (!button) throw new Error(`Toast ${index} does not expose a dismiss action.`);
    await button.click();
  }

  async clearAll(): Promise<void> {
    const button = await this.locatorForOptional('.stack-controls .clear')();
    if (button) {
      await button.click();
      return;
    }
    const dismiss = await this.locatorForOptional('.toast .dismiss')();
    if (dismiss) {
      await dismiss.click();
      return;
    }
    if ((await this.getCount()) > 0) {
      throw new Error('The remaining KERN toast does not expose a dismiss action.');
    }
  }
}
