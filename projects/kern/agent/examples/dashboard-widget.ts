/**
 * Revenue dashboard widget
 *
 * Compose required heading, body and a supporting footer.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnDashboardWidget } from '@kern-ui/angular/patterns';

@Component({
  selector: 'app-kern-dashboard-widget-agent-example',
  standalone: true,
  imports: [KrnDashboardWidget],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-dashboard-widget eyebrow="Portfolio" heading="Annual recurring revenue">
      <strong>€1.8M</strong>
      <span krnWidgetFooter>+8.4% year over year</span>
    </krn-dashboard-widget>
  `,
})
export class KernDashboardWidgetAgentExample {}

void bootstrapApplication(KernDashboardWidgetAgentExample);
