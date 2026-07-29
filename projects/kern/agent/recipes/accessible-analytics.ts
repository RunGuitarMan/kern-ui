import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import {
  KrnBarChart,
  KrnDonutChart,
  KrnLineChart,
  type KrnChartDatum,
  type KrnChartDatumIdentity,
} from '@kern-ui/angular/addon-charts';

@Component({
  selector: 'app-kern-accessible-analytics-recipe',
  standalone: true,
  imports: [KrnBarChart, KrnDonutChart, KrnLineChart],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-line-chart
      title="Quarterly recurring revenue"
      description="Revenue in millions of euros"
      negativeValuePolicy="reject"
      [data]="revenue"
      [datumIdentity]="datumIdentity"
      [summaryItemLimit]="4"
    />
    <krn-bar-chart
      title="Open risk by team"
      description="Weighted open risk score"
      [data]="risk"
      [datumIdentity]="datumIdentity"
    />
    <krn-donut-chart
      title="Customers by plan"
      description="Current active customer distribution"
      [data]="plans"
      [datumIdentity]="datumIdentity"
    />

    <table>
      <caption>
        Exact quarterly recurring revenue
      </caption>
      <thead>
        <tr>
          <th scope="col">Quarter</th>
          <th scope="col">Revenue</th>
        </tr>
      </thead>
      <tbody>
        @for (datum of revenue; track datum.id) {
          <tr>
            <th scope="row">{{ datum.label }}</th>
            <td>{{ datum.value }}</td>
          </tr>
        }
      </tbody>
    </table>
  `,
})
export class KernAccessibleAnalyticsRecipe {
  readonly datumIdentity: KrnChartDatumIdentity = (datum) => datum.id ?? datum.label;
  readonly revenue: readonly KrnChartDatum[] = [
    { id: '2026-q1', label: 'Q1', value: 4.2 },
    { id: '2026-q2', label: 'Q2', value: 5.7 },
    { id: '2026-q3', label: 'Q3', value: 6.1 },
  ];
  readonly risk: readonly KrnChartDatum[] = [
    { id: 'platform', label: 'Platform', value: 18 },
    { id: 'security', label: 'Security', value: 31 },
  ];
  readonly plans: readonly KrnChartDatum[] = [
    { id: 'team', label: 'Team', value: 420 },
    { id: 'enterprise', label: 'Enterprise', value: 180 },
  ];
}

void bootstrapApplication(KernAccessibleAnalyticsRecipe);
