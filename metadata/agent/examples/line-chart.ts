/**
 * Typed monthly revenue line chart
 *
 * Provide stable datum identity and explicit accessible chart context.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnLineChart, type KrnChartDatum } from '@kern-ui/angular/addon-charts';

@Component({
  selector: 'app-kern-line-chart-agent-example',
  standalone: true,
  imports: [KrnLineChart],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-line-chart
      title="Monthly recurring revenue"
      description="Revenue for the current quarter"
      [data]="revenue"
    />
  `,
})
export class KernLineChartAgentExample {
  readonly revenue: readonly KrnChartDatum[] = [
    { id: 'jul', label: 'July', value: 1420000 },
    { id: 'aug', label: 'August', value: 1570000 },
    { id: 'sep', label: 'September', value: 1800000 },
  ];
}

void bootstrapApplication(KernLineChartAgentExample);
