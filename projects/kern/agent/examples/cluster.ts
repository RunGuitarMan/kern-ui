/**
 * Wrapping metadata cluster
 *
 * Wrap independent metadata items without manual margins.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnCluster } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-cluster-agent-example',
  standalone: true,
  imports: [KrnCluster],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-cluster gap="2">
      <span>Owner: Platform</span>
      <span>Region: EU</span>
      <span>Status: Healthy</span>
    </krn-cluster>
  `,
})
export class KernClusterAgentExample {}

void bootstrapApplication(KernClusterAgentExample);
