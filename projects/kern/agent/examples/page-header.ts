/**
 * Customer portfolio page header
 *
 * Pair required heading with page context and projected metadata.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnPageHeader } from '@kern-ui/angular/patterns';

@Component({
  selector: 'app-kern-page-header-agent-example',
  standalone: true,
  imports: [KrnPageHeader],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-page-header
      index="02"
      eyebrow="Customers"
      heading="Portfolio health"
      description="Review renewal risk and account ownership."
    >
      <span krnPageHeaderMeta>Updated 12 minutes ago</span>
    </krn-page-header>
  `,
})
export class KernPageHeaderAgentExample {}

void bootstrapApplication(KernPageHeaderAgentExample);
