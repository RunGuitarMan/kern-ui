/**
 * External audit documentation link
 *
 * Render a semantic link with safe external navigation metadata.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnLink } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-link-agent-example',
  standalone: true,
  imports: [KrnLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-link href="https://example.com/audit-policy" target="_blank" rel="noopener noreferrer">
      Audit policy
    </krn-link>
  `,
})
export class KernLinkAgentExample {}

void bootstrapApplication(KernLinkAgentExample);
