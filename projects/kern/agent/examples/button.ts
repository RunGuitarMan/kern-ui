/**
 * Primary save action
 *
 * Render an explicit form action with semantic hierarchy.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnButton } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-button-agent-example',
  standalone: true,
  imports: [KrnButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <krn-button type="submit" variant="solid" tone="brand">Save changes</krn-button> `,
})
export class KernButtonAgentExample {}

void bootstrapApplication(KernButtonAgentExample);
