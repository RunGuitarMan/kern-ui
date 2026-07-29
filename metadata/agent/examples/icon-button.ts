/**
 * Accessible icon-only action
 *
 * Provide a stable accessible name for an icon-only control.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnIconButton } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-icon-button-agent-example',
  standalone: true,
  imports: [KrnIconButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <krn-icon-button ariaLabel="Add team member">+</krn-icon-button> `,
})
export class KernIconButtonAgentExample {}

void bootstrapApplication(KernIconButtonAgentExample);
