/**
 * Inspectable deployment payload
 *
 * Render structured JSON with accessible tree navigation and a highlighted field.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnJsonView } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-json-view-agent-example',
  standalone: true,
  imports: [KrnJsonView],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-json-view
      ariaLabel="Deployment payload"
      [data]="payload"
      [defaultExpandDepth]="2"
      highlightPattern="active"
    />
  `,
})
export class KernJsonViewAgentExample {
  readonly payload = {
    deployment: { id: 'dep_01KERN', active: true, replicas: 3 },
    region: 'eu-central',
    error: null,
  } as const;
}

void bootstrapApplication(KernJsonViewAgentExample);
