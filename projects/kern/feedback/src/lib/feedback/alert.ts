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
import { krnInputFallback } from '@kern-ui/angular/core';
import type { KrnFeedbackTone } from './feedback.types';

export type KrnAlertAppearance = 'subtle' | 'outline' | 'contrast';
export type KrnAlertPlacement = 'inline' | 'banner';

@Component({
  selector: 'krn-alert',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-placement]': 'placement()' },
  templateUrl: './alert.html',
  styleUrl: './alert.css',
})
export class KrnAlert {
  private readonly translations = inject(KRN_TRANSLATIONS);
  readonly tone = input<KrnFeedbackTone>('info');
  /** Selects the alert surface treatment without changing its semantic tone. */
  readonly appearance = input<KrnAlertAppearance>('subtle');
  /** Places the message inline or stretches it into a page-level banner treatment. */
  readonly placement = input<KrnAlertPlacement>('inline');
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

/** @deprecated Use `KrnAlert` with `placement="banner"`. */
@Component({
  selector: 'krn-banner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-banner]': 'true',
    '[attr.data-placement]': 'placement()',
  },
  templateUrl: './alert.html',
  styleUrl: './alert.css',
})
export class KrnBanner extends KrnAlert {
  override readonly placement = input<KrnAlertPlacement>('banner');
}
