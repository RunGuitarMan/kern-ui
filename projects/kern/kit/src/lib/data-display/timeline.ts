import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { KRN_TRANSLATIONS } from '@kern-ui/angular/core';
import { krnInputFallback } from '../reactive-input';

@Component({
  selector: 'krn-timeline',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'list',
    '[attr.aria-label]': 'resolvedAriaLabel()',
  },
  templateUrl: './timeline.html',
  styleUrl: './timeline.css',
})
export class KrnTimeline {
  private readonly translations = inject(KRN_TRANSLATIONS);
  readonly ariaLabel = input<string | undefined>();
  protected readonly resolvedAriaLabel = krnInputFallback(
    this.ariaLabel,
    () => this.translations.dataDisplay.timeline,
  );
}

@Component({
  selector: 'krn-timeline-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'listitem',
  },
  templateUrl: './timeline-item.html',
  styleUrl: './timeline-item.css',
})
export class KrnTimelineItem {
  readonly heading = input.required<string>();
  readonly time = input('');
}
