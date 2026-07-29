/**
 * Interactive customer summary card
 *
 * Compose heading, action and footer without hiding semantic content.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnCard } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-card-agent-example',
  standalone: true,
  imports: [KrnCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-card eyebrow="Enterprise" heading="Acme Europe" [interactive]="true">
      <button krnCardAction type="button">Open account</button>
      <p>Renewal: 15 October · Owner: Ada Lovelace</p>
      <small krnCardFooter>Updated 12 minutes ago</small>
    </krn-card>
  `,
})
export class KernCardAgentExample {}

void bootstrapApplication(KernCardAgentExample);
