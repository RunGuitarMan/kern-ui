import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { KRN_TRANSLATIONS } from '@kern-ui/angular/core';
import { krnInputFallback } from '../reactive-input';
import type { KrnFeedbackTone } from './feedback.types';

@Component({
  selector: 'krn-alert',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './alert.html',
  styleUrl: './alert.css',
})
export class KrnAlert {
  private readonly translations = inject(KRN_TRANSLATIONS);
  readonly tone = input<KrnFeedbackTone>('info');
  readonly title = input('');
  readonly icon = input('');
  readonly dismissible = input(false, { transform: booleanAttribute });
  readonly dismissLabel = input<string | undefined>();
  protected readonly resolvedDismissLabel = krnInputFallback(
    this.dismissLabel,
    () => this.translations.feedback.dismissMessage,
  );
  readonly closed = output<void>();
  protected readonly visible = signal(true);

  protected toneIcon(): string {
    return { neutral: '•', info: 'i', success: '✓', warning: '!', danger: '!' }[this.tone()];
  }

  protected dismiss(): void {
    this.visible.set(false);
    this.closed.emit();
  }
}

@Component({
  selector: 'krn-banner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-banner]': 'true' },
  templateUrl: './banner.html',
  styleUrl: './banner.css',
})
export class KrnBanner extends KrnAlert {}
