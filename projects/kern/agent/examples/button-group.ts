/**
 * Grouped review actions
 *
 * Present independent native actions as one labeled visual group.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnButton, KrnButtonGroup } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-button-group-agent-example',
  standalone: true,
  imports: [KrnButtonGroup, KrnButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div krnButtonGroup aria-label="Review actions">
      <button krnButton type="button" variant="outline">Request changes</button>
      <button krnButton type="button">Approve</button>
    </div>
  `,
})
export class KernButtonGroupAgentExample {}

void bootstrapApplication(KernButtonGroupAgentExample);
