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
  template: `
    <krn-card [eyebrow]="resolvedEyebrow()" [heading]="resolvedHeading()">
      <ng-content />
      <div class="footer" krnCardFooter><ng-content select="[krnWidgetFooter]" /></div>
    </krn-card>
  `,
  styles: `
    :host,
    krn-card {
      display: block;
      block-size: 100%;
      min-inline-size: 0;
    }
    :host([hidden]) {
      display: none;
    }
    krn-card {
      display: flex;
      flex-direction: column;
      overflow-wrap: anywhere;
    }
    .footer {
      margin-block-start: auto;
      padding-block-start: var(--krn-space-4, 1rem);
    }
    .footer:empty {
      display: none;
    }
    @media (forced-colors: active) {
      krn-card {
        border-color: CanvasText;
      }
    }
  `,
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
