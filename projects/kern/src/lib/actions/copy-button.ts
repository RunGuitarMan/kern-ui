import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { KrnButton } from './button';
import type { KrnSize } from './action-types';

export type KrnCopyState = 'idle' | 'copied' | 'error';

@Component({
  selector: 'krn-copy-button',
  imports: [KrnButton],
  template: `
    <krn-button
      variant="outline"
      tone="neutral"
      [ariaLabel]="ariaLabel()"
      [disabled]="disabled()"
      [size]="size()"
      (activated)="copy()"
    >
      @if (state() === 'copied') {
        {{ copiedLabel() }}
      } @else {
        <ng-content />
      }
    </krn-button>
    <span class="krn-copy-status" aria-live="polite">
      @if (state() === 'error') {
        {{ errorLabel() }}
      }
    </span>
  `,
  styleUrl: './actions.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnCopyButton {
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private resetTimer: number | undefined;

  readonly value = input.required<string>();
  readonly ariaLabel = input('Copy to clipboard');
  readonly copiedLabel = input('Copied');
  readonly errorLabel = input('Could not copy');
  readonly size = input<KrnSize>('md');
  readonly disabled = input(false);
  readonly copied = output<string>();
  readonly copyError = output<unknown>();
  readonly state = signal<KrnCopyState>('idle');

  constructor() {
    this.destroyRef.onDestroy(() => {
      const view = this.document.defaultView;
      if (view && this.resetTimer !== undefined) {
        view.clearTimeout(this.resetTimer);
      }
    });
  }

  protected async copy(): Promise<void> {
    if (this.disabled()) {
      return;
    }

    try {
      await this.writeClipboard(this.value());
      this.state.set('copied');
      this.copied.emit(this.value());
      this.scheduleReset();
    } catch (error: unknown) {
      this.state.set('error');
      this.copyError.emit(error);
      this.scheduleReset();
    }
  }

  private async writeClipboard(value: string): Promise<void> {
    const clipboard = this.document.defaultView?.navigator.clipboard;
    if (!clipboard) {
      throw new Error('The asynchronous Clipboard API is unavailable in this rendering context.');
    }
    await clipboard.writeText(value);
  }

  private scheduleReset(): void {
    const view = this.document.defaultView;
    if (!view) {
      return;
    }
    if (this.resetTimer !== undefined) {
      view.clearTimeout(this.resetTimer);
    }
    this.resetTimer = view.setTimeout(() => this.state.set('idle'), 1800);
  }
}
