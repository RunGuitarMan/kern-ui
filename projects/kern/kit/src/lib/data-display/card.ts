import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';

@Component({
  selector: 'krn-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-interactive]': 'interactive() ? "" : null',
    '[attr.tabindex]': 'interactive() ? 0 : null',
  },
  templateUrl: './card.html',
  styleUrl: './card.css',
})
export class KrnCard {
  readonly eyebrow = input('');
  readonly heading = input('');
  readonly interactive = input(false, { transform: booleanAttribute });
}

@Component({
  selector: 'krn-stat',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-trend]': 'trend()',
  },
  templateUrl: './stat.html',
  styleUrl: './stat.css',
})
export class KrnStat {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly detail = input('');
  readonly trend = input<'up' | 'down' | 'flat'>('flat');
}
