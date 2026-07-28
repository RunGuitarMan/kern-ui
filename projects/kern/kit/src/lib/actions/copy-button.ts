import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { KRN_PLATFORM, type KrnScheduledHandle } from '@kern-ui/angular/cdk';
import { KRN_TRANSLATIONS } from '@kern-ui/angular/core';
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
      @if (state() === 'copied') {
        {{ copiedLabel() }}
      } @else if (state() === 'error') {
        {{ errorLabel() }}
      }
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnCopyButton {
  private readonly platform = inject(KRN_PLATFORM);
  private readonly destroyRef = inject(DestroyRef);
  private readonly translations = inject(KRN_TRANSLATIONS);
  private resetTimer: KrnScheduledHandle | undefined;

  readonly value = input.required<string>();
  readonly ariaLabel = input(this.translations.actions.copyToClipboard);
  readonly copiedLabel = input(this.translations.actions.copied);
  readonly errorLabel = input(this.translations.actions.copyFailed);
  readonly size = input<KrnSize>('md');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly copied = output<string>();
  readonly copyError = output<unknown>();
  protected readonly state = signal<KrnCopyState>('idle');

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.platform.cancelScheduled(this.resetTimer ?? null);
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
    const clipboard = this.platform.window?.navigator.clipboard;
    if (!clipboard) {
      throw new Error('The asynchronous Clipboard API is unavailable in this rendering context.');
    }
    await clipboard.writeText(value);
  }

  private scheduleReset(): void {
    if (this.resetTimer !== undefined) {
      this.platform.cancelScheduled(this.resetTimer);
    }
    this.resetTimer =
      this.platform.schedule(() => {
        this.resetTimer = undefined;
        this.state.set('idle');
      }, 1800) ?? undefined;
  }
}
