/**
 * Persistent field guidance
 *
 * Provide concise guidance that can be referenced by a control.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnHint } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-hint-agent-example',
  standalone: true,
  imports: [KrnHint],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <krn-hint id="cost-center-hint">Use the six-digit finance code.</krn-hint> `,
})
export class KernHintAgentExample {}

void bootstrapApplication(KernHintAgentExample);
