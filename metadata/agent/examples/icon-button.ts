/**
 * Accessible icon-only action
 *
 * Keep the accessible name and native action semantics on the icon-only button host.
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
  template: ` <button krnIconButton type="button" aria-label="Add team member">+</button> `,
})
export class KernIconButtonAgentExample {}

void bootstrapApplication(KernIconButtonAgentExample);
