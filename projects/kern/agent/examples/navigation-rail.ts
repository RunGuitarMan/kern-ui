/**
 * Expandable navigation rail
 *
 * Expose compact navigation while preserving controlled expansion.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnNavigationRail } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-navigation-rail-agent-example',
  standalone: true,
  imports: [KrnNavigationRail],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-navigation-rail [(expanded)]="expanded" ariaLabel="Primary navigation">
      <strong krnRailHeader>AC</strong>
      <nav aria-label="Primary">Home · Tasks · Reports</nav>
      <button krnRailFooter type="button">Help</button>
    </krn-navigation-rail>
  `,
})
export class KernNavigationRailAgentExample {
  expanded = false;
}

void bootstrapApplication(KernNavigationRailAgentExample);
