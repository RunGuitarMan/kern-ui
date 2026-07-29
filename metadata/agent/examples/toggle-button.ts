/**
 * Controlled formatting toggle
 *
 * Keep the pressed state in application-owned state.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnToggleButton } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-toggle-button-agent-example',
  standalone: true,
  imports: [KrnToggleButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <krn-toggle-button value="bold" [(pressed)]="boldEnabled">Bold</krn-toggle-button> `,
})
export class KernToggleButtonAgentExample {
  boldEnabled = false;
}

void bootstrapApplication(KernToggleButtonAgentExample);
