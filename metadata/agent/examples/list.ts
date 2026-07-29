/**
 * Selected customer list
 *
 * Compose semantic list items and expose current selection.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnList, KrnListItem } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-list-agent-example',
  standalone: true,
  imports: [KrnList, KrnListItem],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-list role="listbox" ariaLabel="Customers">
      <krn-list-item heading="Acme Europe" [selected]="true"> Enterprise · Healthy </krn-list-item>
      <krn-list-item heading="Globex">Commercial · Review needed</krn-list-item>
    </krn-list>
  `,
})
export class KernListAgentExample {}

void bootstrapApplication(KernListAgentExample);
