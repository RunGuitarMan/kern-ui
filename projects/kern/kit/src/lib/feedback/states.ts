import { ChangeDetectionStrategy, Component, inject, input, model, output } from '@angular/core';
import { KRN_TRANSLATIONS } from '@kern-ui/angular/core';
import { krnInputFallback } from '../reactive-input';
import type { KrnFeedbackTone } from './feedback.types';

@Component({
  selector: 'krn-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './empty-state.html',
  styleUrl: './empty-state.css',
})
export class KrnEmptyState {
  protected readonly translations = inject(KRN_TRANSLATIONS);
  readonly title = input<string | undefined>();
  protected readonly resolvedTitle = krnInputFallback(this.title, () => this.defaultTitle());
  readonly description = input('');
  readonly tone = input<KrnFeedbackTone>('neutral');

  protected stateKind(): 'empty' | 'error' | 'success' {
    return 'empty';
  }

  protected defaultTitle(): string {
    return this.translations.feedback.emptyStateTitle;
  }
}

@Component({
  selector: 'krn-error-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './error-state.html',
  styleUrl: './error-state.css',
})
export class KrnErrorState extends KrnEmptyState {
  override readonly tone = input<KrnFeedbackTone>('danger');

  protected override stateKind(): 'empty' | 'error' | 'success' {
    return 'error';
  }

  protected override defaultTitle(): string {
    return this.translations.feedback.errorStateTitle;
  }
}

@Component({
  selector: 'krn-success-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './success-state.html',
  styleUrl: './success-state.css',
})
export class KrnSuccessState extends KrnEmptyState {
  override readonly tone = input<KrnFeedbackTone>('success');

  protected override stateKind(): 'empty' | 'error' | 'success' {
    return 'success';
  }

  protected override defaultTitle(): string {
    return this.translations.feedback.successStateTitle;
  }
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
