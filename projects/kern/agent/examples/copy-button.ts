/**
 * Copy immutable record id
 *
 * Copy a visible domain identifier with explicit accessible feedback.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnCopyButton } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-copy-button-agent-example',
  standalone: true,
  imports: [KrnCopyButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-copy-button value="CUS-2048" ariaLabel="Copy customer id"> CUS-2048 </krn-copy-button>
  `,
})
export class KernCopyButtonAgentExample {}

void bootstrapApplication(KernCopyButtonAgentExample);
