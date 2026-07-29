/**
 * Account preview hover card
 *
 * Provide supplemental preview content through the component-owned focusable trigger.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnHoverCard } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-hover-card-agent-example',
  standalone: true,
  imports: [KrnHoverCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-hover-card ariaLabel="Acme Europe preview">
      <span krnHoverCardTrigger>Acme Europe</span>
      <strong>Acme Europe</strong>
      <p>Enterprise · Renewal 15 October</p>
    </krn-hover-card>
  `,
})
export class KernHoverCardAgentExample {}

void bootstrapApplication(KernHoverCardAgentExample);
