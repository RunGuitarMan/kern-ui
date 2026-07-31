/**
 * Multi-select view controls
 *
 * Control a set of pressed view options by stable string values.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnToggleButton, KrnToggleGroup } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-toggle-group-agent-example',
  standalone: true,
  imports: [KrnToggleGroup, KrnToggleButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      krnToggleGroup
      aria-label="Visible dashboard layers"
      [multiple]="true"
      [(values)]="visibleLayers"
    >
      <button krnToggleButton value="targets">Targets</button>
      <button krnToggleButton value="forecast">Forecast</button>
    </div>
  `,
})
export class KernToggleGroupAgentExample {
  visibleLayers: readonly string[] = ['targets'];
}

void bootstrapApplication(KernToggleGroupAgentExample);
