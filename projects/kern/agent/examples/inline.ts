/**
 * Inline action row
 *
 * Align related actions with predictable wrapping.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnInline } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-inline-agent-example',
  standalone: true,
  imports: [KrnInline],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-inline gap="2" justify="end" [wrap]="true">
      <button type="button">Cancel</button>
      <button type="button">Save changes</button>
    </krn-inline>
  `,
})
export class KernInlineAgentExample {}

void bootstrapApplication(KernInlineAgentExample);
