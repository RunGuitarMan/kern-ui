/**
 * Typed regional revenue bar chart
 *
 * Compare categorical values using stable typed data.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnBarChart, type KrnChartDatum } from '@kern-ui/angular/addon-charts';

@Component({
  selector: 'app-kern-bar-chart-agent-example',
  standalone: true,
  imports: [KrnBarChart],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-bar-chart
      title="Revenue by region"
      description="Annual recurring revenue"
      [data]="revenue"
    />
  `,
})
export class KernBarChartAgentExample {
  readonly revenue: readonly KrnChartDatum[] = [
    { id: 'emea', label: 'EMEA', value: 1800000 },
    { id: 'amer', label: 'Americas', value: 1450000 },
    { id: 'apac', label: 'APAC', value: 980000 },
  ];
}

void bootstrapApplication(KernBarChartAgentExample);
