/**
 * Typed portfolio mix donut chart
 *
 * Show part-to-whole values with stable typed datum identity.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnDonutChart, type KrnChartDatum } from '@kern-ui/angular/addon-charts';

@Component({
  selector: 'app-kern-donut-chart-agent-example',
  standalone: true,
  imports: [KrnDonutChart],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-donut-chart
      title="Portfolio by segment"
      description="Customer count by commercial segment"
      [data]="segments"
    />
  `,
})
export class KernDonutChartAgentExample {
  readonly segments: readonly KrnChartDatum[] = [
    { id: 'enterprise', label: 'Enterprise', value: 48 },
    { id: 'commercial', label: 'Commercial', value: 36 },
    { id: 'startup', label: 'Startup', value: 16 },
  ];
}

void bootstrapApplication(KernDonutChartAgentExample);
