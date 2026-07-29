/**
 * Labeled section divider
 *
 * Separate two form sections with visible context.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnDivider } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-divider-agent-example',
  standalone: true,
  imports: [KrnDivider],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <krn-divider label="Advanced settings" /> `,
})
export class KernDividerAgentExample {}

void bootstrapApplication(KernDividerAgentExample);
