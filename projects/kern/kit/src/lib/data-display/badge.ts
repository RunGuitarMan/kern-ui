import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  inject,
  input,
  model,
  output,
} from '@angular/core';
import { KRN_TRANSLATIONS } from '@kern-ui/angular/core';
import { krnInputFallback } from '../reactive-input';

export type KrnDisplayTone = 'neutral' | 'brand' | 'info' | 'success' | 'warning' | 'danger';

@Component({
  selector: 'krn-badge, krn-status-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-tone]': 'tone()',
    '[attr.data-status]': 'status() ? "" : null',
  },
  templateUrl: './badge.html',
  styleUrl: './badge.css',
})
export class KrnBadge {
  readonly tone = input<KrnDisplayTone>('neutral');
  readonly status = input(false, { transform: booleanAttribute });
}

@Component({
  selector: 'krn-chip, krn-tag',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  host: {
    '[attr.data-selected]': 'selected() ? "" : null',
    '[attr.data-disabled]': 'disabled() ? "" : null',
  },
  templateUrl: './chip.html',
  styleUrl: './chip.css',
})
export class KrnChip {
  protected readonly translations = inject(KRN_TRANSLATIONS);
  readonly selected = model(false);
  readonly interactive = input(false, { transform: booleanAttribute });
  readonly removable = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly accessibleLabel = input<string | undefined>();
  protected readonly resolvedAccessibleLabel = krnInputFallback(
    this.accessibleLabel,
    () => this.translations.dataDisplay.tag,
  );
  readonly remove = output<void>();

  protected toggle(): void {
    if (!this.disabled()) this.selected.update((value) => !value);
  }
}
