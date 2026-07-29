/**
 * Customer list row
 *
 * Compose leading identity, text and trailing metadata.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnListItem } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-list-item-agent-example',
  standalone: true,
  imports: [KrnListItem],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-list-item heading="Acme Europe" [selected]="true">
      <span krnListLeading aria-hidden="true">AC</span>
      Enterprise account
      <span krnListTrailing>Healthy</span>
    </krn-list-item>
  `,
})
export class KernListItemAgentExample {}

void bootstrapApplication(KernListItemAgentExample);
