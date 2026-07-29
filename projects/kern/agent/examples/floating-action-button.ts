/**
 * Create-record floating action
 *
 * Expose a single high-priority creation action on compact layouts.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnFloatingActionButton } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-floating-action-button-agent-example',
  standalone: true,
  imports: [KrnFloatingActionButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-floating-action-button ariaLabel="Create customer" [extended]="true">
      <span krnFabIcon aria-hidden="true">+</span>
      Create customer
    </krn-floating-action-button>
  `,
})
export class KernFloatingActionButtonAgentExample {}

void bootstrapApplication(KernFloatingActionButtonAgentExample);
