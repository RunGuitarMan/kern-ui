import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KRN_CLIPBOARD_WRITER, type KrnClipboardWriter } from '@kern-ui/angular/cdk';
import { KRN_COPY_LABELS, type KrnCopyLabels } from '@kern-ui/angular/i18n';
import { KrnCopyButton, provideKrnCopyButtonOptions } from '@kern-ui/angular/kit';

const clipboardWriter: KrnClipboardWriter = Object.freeze({
  writeText: async (_value: string): Promise<void> => undefined,
});

const copyLabels: Readonly<KrnCopyLabels> = Object.freeze({
  copy: 'Copy customer id',
  copying: 'Copying customer id…',
  copied: 'Customer id copied',
  failed: 'Customer id copy failed',
});

@Component({
  selector: 'krn-consumer-root',
  imports: [KrnCopyButton],
  providers: [
    { provide: KRN_CLIPBOARD_WRITER, useValue: clipboardWriter },
    { provide: KRN_COPY_LABELS, useValue: copyLabels },
    provideKrnCopyButtonOptions({
      feedbackDuration: 2400,
      size: 'sm',
      tone: 'brand',
      variant: 'soft',
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-copy-button
      value="CUS-2048"
      (copied)="recordSuccess($event)"
      (copyError)="recordFailure($event)"
    >
      Copy customer id
    </krn-copy-button>
    <output>{{ lastCopyResult }}</output>
  `,
})
class CopyButtonConsumer {
  protected lastCopyResult = 'No copy result';

  protected recordSuccess(value: string): void {
    this.lastCopyResult = `Copied ${value}`;
  }

  protected recordFailure(error: unknown): void {
    this.lastCopyResult = error instanceof Error ? error.message : 'Unknown copy failure';
  }
}

void bootstrapApplication(CopyButtonConsumer);
