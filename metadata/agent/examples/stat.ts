/**
 * Revenue metric
 *
 * Pair a formatted value with label, trend and supporting detail.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnStat } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-stat-agent-example',
  standalone: true,
  imports: [KrnStat],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-stat
      label="Annual recurring revenue"
      value="€1.8M"
      detail="+8.4% year over year"
      trend="up"
    />
  `,
})
export class KernStatAgentExample {}

void bootstrapApplication(KernStatAgentExample);
