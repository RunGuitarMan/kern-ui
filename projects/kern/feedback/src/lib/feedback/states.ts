import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
  output,
} from '@angular/core';
import { KRN_TRANSLATIONS } from '@kern-ui/angular/core';
import { krnInputFallback } from '@kern-ui/angular/core';
import type { KrnFeedbackTone } from './feedback.types';

export type KrnStateKind = 'empty' | 'error' | 'success';

@Component({
  selector: 'krn-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './empty-state.html',
  styleUrl: './empty-state.css',
})
export class KrnEmptyState {
  protected readonly translations = inject(KRN_TRANSLATIONS);
  /** Selects the state meaning, default visual, status role, title, and recommended tone. */
  readonly kind = input<KrnStateKind>('empty');
  readonly title = input<string | undefined>();
  protected readonly resolvedTitle = krnInputFallback(this.title, () => this.defaultTitle());
  readonly description = input('');
  readonly tone = input<KrnFeedbackTone | undefined>();
  protected readonly resolvedTone = computed<KrnFeedbackTone>(
    () => this.tone() ?? this.defaultTone(),
  );

  protected stateKind(): KrnStateKind {
    return this.kind();
  }

  protected defaultTitle(): string {
    switch (this.kind()) {
      case 'error':
        return this.translations.feedback.errorStateTitle;
      case 'success':
        return this.translations.feedback.successStateTitle;
      default:
        return this.translations.feedback.emptyStateTitle;
    }
  }

  private defaultTone(): KrnFeedbackTone {
    switch (this.kind()) {
      case 'error':
        return 'danger';
      case 'success':
        return 'success';
      default:
        return 'neutral';
    }
  }
}

/** @deprecated Use `KrnEmptyState` with `kind="error"`. */
@Component({
  selector: 'krn-error-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './empty-state.html',
  styleUrl: './empty-state.css',
})
export class KrnErrorState extends KrnEmptyState {
  override readonly kind = input<KrnStateKind>('error');
  override readonly tone = input<KrnFeedbackTone | undefined>('danger');
}

/** @deprecated Use `KrnEmptyState` with `kind="success"`. */
@Component({
  selector: 'krn-success-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './empty-state.html',
  styleUrl: './empty-state.css',
})
export class KrnSuccessState extends KrnEmptyState {
  override readonly kind = input<KrnStateKind>('success');
  override readonly tone = input<KrnFeedbackTone | undefined>('success');
}

@Component({
  selector: 'krn-confirmation, krn-confirmation-pattern',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './confirmation.html',
  styleUrl: './confirmation.css',
})
export class KrnConfirmation {
  private readonly translations = inject(KRN_TRANSLATIONS);
  readonly confirming = model(false);
  readonly requestLabel = input<string | undefined>();
  protected readonly resolvedRequestLabel = krnInputFallback(
    this.requestLabel,
    () => this.translations.feedback.delete,
  );
  readonly prompt = input<string | undefined>();
  protected readonly resolvedPrompt = krnInputFallback(
    this.prompt,
    () => this.translations.feedback.confirmPrompt,
  );
  readonly confirmLabel = input<string | undefined>();
  protected readonly resolvedConfirmLabel = krnInputFallback(
    this.confirmLabel,
    () => this.translations.feedback.confirm,
  );
  readonly cancelLabel = input<string | undefined>();
  protected readonly resolvedCancelLabel = krnInputFallback(
    this.cancelLabel,
    () => this.translations.feedback.cancel,
  );
  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  protected confirm(): void {
    this.confirming.set(false);
    this.confirmed.emit();
  }

  protected cancel(): void {
    this.confirming.set(false);
    this.cancelled.emit();
  }
}

export { KrnConfirmation as KrnConfirmationPattern };
