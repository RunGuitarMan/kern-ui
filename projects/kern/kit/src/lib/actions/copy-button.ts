import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  numberAttribute,
  output,
  signal,
} from '@angular/core';
import { KRN_CLIPBOARD_WRITER, KRN_PLATFORM, type KrnScheduledHandle } from '@kern-ui/angular/cdk';
import { KRN_COPY_LABELS } from '@kern-ui/angular/i18n';
import type { KrnActionVariant, KrnSize, KrnTone } from './action-types';
import { KrnButton } from './button';
import { KRN_COPY_BUTTON_DEFAULT_OPTIONS, KRN_COPY_BUTTON_OPTIONS } from './copy-button-options';

/**
 * Settled visual feedback exposed by `KrnCopyButton`.
 *
 * Pending work intentionally remains a separate boolean so this published
 * union stays backward compatible.
 */
export type KrnCopyState = 'idle' | 'copied' | 'error';

@Component({
  selector: 'krn-copy-button',
  imports: [KrnButton],
  host: {
    class: 'krn-copy-button',
    '[attr.data-pending]': 'pending()',
    '[attr.data-size]': 'size()',
    '[attr.data-state]': 'state()',
    '[attr.data-tone]': 'tone()',
    '[attr.data-variant]': 'variant()',
  },
  template: `
    <button
      krnButton
      [attr.aria-label]="ariaLabel() || null"
      [disabled]="disabled()"
      [loading]="pending()"
      loadingLabel=""
      [size]="size()"
      [tone]="tone()"
      [variant]="variant()"
      (click)="copy()"
    >
      <span class="krn-copy-labels">
        <span class="krn-copy-label">
          <ng-content>{{ copyLabel() }}</ng-content>
        </span>
        <span class="krn-copy-indicator" [attr.data-state]="state()" aria-hidden="true">
          @if (state() === 'copied') {
            ✓
          } @else if (state() === 'error') {
            !
          }
        </span>
      </span>
    </button>
    <span class="krn-copy-status" role="status" aria-atomic="true" aria-live="polite">
      @if (pending()) {
        {{ copyingLabel() }}
      } @else if (state() === 'copied') {
        {{ copiedLabel() }}
      } @else if (state() === 'error') {
        {{ errorLabel() }}
      }
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnCopyButton {
  private readonly clipboard = inject(KRN_CLIPBOARD_WRITER);
  private readonly platform = inject(KRN_PLATFORM);
  private readonly destroyRef = inject(DestroyRef);
  private readonly options = inject(KRN_COPY_BUTTON_OPTIONS);
  private readonly labels = inject(KRN_COPY_LABELS);
  private resetTimer: KrnScheduledHandle | undefined;
  private activeAttempt = 0;

  /** Exact text captured once at activation and written to the clipboard. */
  readonly value = input.required<string>();
  /**
   * Optional accessible-name override for the inner native button.
   *
   * Leave empty to derive the name from the visible action label. When set,
   * include that visible label in the override.
   */
  readonly ariaLabel = input('');
  /** Localized visible fallback used only when no action label is projected. */
  readonly copyLabel = input(this.labels.copy);
  /** Loading announcement while the asynchronous write is in flight. */
  readonly copyingLabel = input(this.labels.copying);
  /** Success announcement paired with the visible success indicator. */
  readonly copiedLabel = input(this.labels.copied);
  /** Failure announcement paired with the visible error indicator. */
  readonly errorLabel = input(this.labels.failed);
  readonly size = input<KrnSize>(this.options.size);
  readonly variant = input<KrnActionVariant>(this.options.variant);
  readonly tone = input<KrnTone>(this.options.tone);
  /**
   * Milliseconds before settled feedback returns to idle.
   *
   * Invalid or negative values fall back to the library default.
   */
  readonly feedbackDuration = input(this.options.feedbackDuration, {
    transform: numberAttribute,
  });
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Emits the exact captured value only after the clipboard writer confirms success. */
  readonly copied = output<string>();
  /** Emits the original writer failure without masking or replacing its identity. */
  readonly copyError = output<unknown>();
  protected readonly state = signal<KrnCopyState>('idle');
  protected readonly pending = signal(false);

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.activeAttempt += 1;
      this.cancelReset();
    });
  }

  /**
   * Starts one copy attempt. While it is pending, repeated mouse or keyboard
   * activations are ignored and the native button remains focusable.
   */
  protected async copy(): Promise<void> {
    if (this.disabled() || this.pending()) {
      return;
    }

    const value = this.value();
    const attempt = ++this.activeAttempt;
    this.cancelReset();
    this.state.set('idle');
    this.pending.set(true);

    try {
      let outcome: { readonly copied: true } | { readonly copied: false; readonly error: unknown };
      try {
        await this.clipboard.writeText(value);
        outcome = { copied: true };
      } catch (error: unknown) {
        outcome = { copied: false, error };
      }

      if (!this.isCurrentAttempt(attempt)) {
        return;
      }

      // Terminal outputs observe a settled control. Clearing pending before
      // state/output also prevents overlapping loading and result live copy.
      this.pending.set(false);

      if (outcome.copied) {
        this.state.set('copied');
        try {
          this.copied.emit(value);
        } finally {
          if (this.isCurrentAttempt(attempt)) {
            this.scheduleReset();
          }
        }
      } else {
        this.state.set('error');
        try {
          this.copyError.emit(outcome.error);
        } finally {
          if (this.isCurrentAttempt(attempt)) {
            this.scheduleReset();
          }
        }
      }
    } finally {
      if (this.isCurrentAttempt(attempt)) {
        this.pending.set(false);
      }
    }
  }

  private isCurrentAttempt(attempt: number): boolean {
    return !this.destroyRef.destroyed && this.activeAttempt === attempt;
  }

  private cancelReset(): void {
    if (this.resetTimer === undefined) {
      return;
    }

    this.platform.cancelScheduled(this.resetTimer);
    this.resetTimer = undefined;
  }

  private scheduleReset(): void {
    const configuredDuration = this.feedbackDuration();
    const duration =
      Number.isFinite(configuredDuration) && configuredDuration >= 0
        ? configuredDuration
        : KRN_COPY_BUTTON_DEFAULT_OPTIONS.feedbackDuration;
    const attempt = this.activeAttempt;
    const handle = this.platform.schedule(() => {
      if (!this.isCurrentAttempt(attempt)) {
        return;
      }

      this.resetTimer = undefined;
      this.state.set('idle');
    }, duration);

    if (handle === null) {
      if (this.isCurrentAttempt(attempt)) {
        this.state.set('idle');
      }
      return;
    }

    this.resetTimer = handle;
  }
}
