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
    <button krnFab type="button">
      <span krnFabIcon>+</span>
      Create customer
    </button>
  `,
})
export class KernFloatingActionButtonAgentExample {}

void bootstrapApplication(KernFloatingActionButtonAgentExample);
