/**
 * Customer metadata description list
 *
 * Compose semantic term-value pairs with dedicated items.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnDescriptionItem, KrnDescriptionList } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-description-list-agent-example',
  standalone: true,
  imports: [KrnDescriptionList, KrnDescriptionItem],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-description-list>
      <krn-description-item term="Account owner">Ada Lovelace</krn-description-item>
      <krn-description-item term="Renewal date">15 October 2026</krn-description-item>
    </krn-description-list>
  `,
})
export class KernDescriptionListAgentExample {}

void bootstrapApplication(KernDescriptionListAgentExample);
