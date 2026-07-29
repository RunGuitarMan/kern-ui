/**
 * Accessible abbreviated-action tooltip
 *
 * Supplement an already named control with concise hover and focus guidance.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnTooltip } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-tooltip-agent-example',
  standalone: true,
  imports: [KrnTooltip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      aria-label="Download audit report"
      krnTooltip="Download audit report"
      krnTooltipPosition="below"
    >
      ↓
    </button>
  `,
})
export class KernTooltipAgentExample {}

void bootstrapApplication(KernTooltipAgentExample);
