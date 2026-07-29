/**
 * Grouped review actions
 *
 * Present closely related actions as one labeled control group.
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
    <krn-button-group ariaLabel="Review actions">
      <krn-button variant="outline">Request changes</krn-button>
      <krn-button>Approve</krn-button>
    </krn-button-group>
  `,
})
export class KernButtonGroupAgentExample {}

void bootstrapApplication(KernButtonGroupAgentExample);
