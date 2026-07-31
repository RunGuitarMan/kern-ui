/**
 * Copy immutable record id
 *
 * Copy an explicit domain identifier, localize its accessible context, and consume confirmed outcomes.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnCopyButton, provideKrnCopyButtonOptions } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-copy-button-agent-example',
  standalone: true,
  imports: [KrnCopyButton],
  providers: [
    provideKrnCopyButtonOptions({
      size: 'sm',
      feedbackDuration: 2400,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-copy-button
      [value]="customerId"
      (copied)="lastResult = 'Copied ' + $event"
      (copyError)="lastResult = 'Customer id copy failed'"
    >
      Copy customer id {{ customerId }}
    </krn-copy-button>
    <output>{{ lastResult }}</output>
  `,
})
export class KernCopyButtonAgentExample {
  readonly customerId = 'CUS-2048';

  lastResult = '';
}

void bootstrapApplication(KernCopyButtonAgentExample);
