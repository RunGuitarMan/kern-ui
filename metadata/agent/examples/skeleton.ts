/**
 * Stable customer-card placeholder
 *
 * Reserve the final content geometry while data loads.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnSkeleton } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-skeleton-agent-example',
  standalone: true,
  imports: [KrnSkeleton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section aria-label="Loading customer summary">
      <krn-skeleton width="40%" height="1.25rem" shape="text" />
      <krn-skeleton width="100%" height="4rem" shape="rectangle" />
    </section>
  `,
})
export class KernSkeletonAgentExample {}

void bootstrapApplication(KernSkeletonAgentExample);
