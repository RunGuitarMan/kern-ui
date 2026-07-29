/**
 * Master and supporting content
 *
 * Compose a responsive primary and secondary column.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnSplitLayout } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-split-layout-agent-example',
  standalone: true,
  imports: [KrnSplitLayout],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-split-layout ratio="2fr 1fr" collapseAt="md">
      <main krnSplitPrimary>
        <h1>Account health</h1>
        <p>Primary analysis and recent activity.</p>
      </main>
      <aside krnSplitSecondary>Owner and renewal details</aside>
    </krn-split-layout>
  `,
})
export class KernSplitLayoutAgentExample {}

void bootstrapApplication(KernSplitLayoutAgentExample);
