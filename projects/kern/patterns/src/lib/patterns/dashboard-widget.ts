import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { KrnCard } from '@kern-ui/angular/kit';

@Component({
  selector: 'krn-dashboard-widget',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [KrnCard],
  host: {
    role: 'region',
    '[attr.aria-label]': 'resolvedHeading()',
  },
  templateUrl: './dashboard-widget.html',
  styleUrl: './dashboard-widget.css',
})
export class KrnDashboardWidget {
  readonly eyebrow = input('');
  readonly heading = input.required<string>();
  protected readonly resolvedEyebrow = computed(() => this.normalizeText(this.eyebrow()));
  protected readonly resolvedHeading = computed(() => {
    const heading = this.normalizeText(this.heading());
    if (!heading) {
      throw new Error('KrnDashboardWidget: heading must be a non-empty string.');
    }

    return heading;
  });

  private normalizeText(value: string): string {
    return typeof value === 'string' ? value.trim() : '';
  }
}
