/**
 * Inline archive confirmation
 *
 * Use a reversible inline confirmation for a local record action.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnConfirmationPattern } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-confirmation-pattern-agent-example',
  standalone: true,
  imports: [KrnConfirmationPattern],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-confirmation-pattern
      requestLabel="Archive customer"
      prompt="Archive Acme Europe?"
      confirmLabel="Archive"
      [(confirming)]="confirming"
    />
  `,
})
export class KernConfirmationPatternAgentExample {
  confirming = false;
}

void bootstrapApplication(KernConfirmationPatternAgentExample);
