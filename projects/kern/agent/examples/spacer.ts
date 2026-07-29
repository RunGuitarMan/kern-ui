/**
 * Semantic layout spacer
 *
 * Reserve tokenized vertical space between independent regions.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnSpacer } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-spacer-agent-example',
  standalone: true,
  imports: [KrnSpacer],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p>Summary</p>
    <krn-spacer size="6" axis="vertical" />
    <p>Detailed report</p>
  `,
})
export class KernSpacerAgentExample {}

void bootstrapApplication(KernSpacerAgentExample);
