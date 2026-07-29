/**
 * Responsive summary grid
 *
 * Lay out metric cards with a minimum usable column width.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnGrid } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-grid-agent-example',
  standalone: true,
  imports: [KrnGrid],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-grid columns="auto" minColumnWidth="14rem" gap="4">
      <article>Revenue: €1.8M</article>
      <article>Renewals: 42</article>
      <article>Risk accounts: 3</article>
    </krn-grid>
  `,
})
export class KernGridAgentExample {}

void bootstrapApplication(KernGridAgentExample);
