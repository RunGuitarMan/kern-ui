/**
 * Copyable API request example
 *
 * Render a complete short code sample with language metadata.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnCodeBlock } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-code-block-agent-example',
  standalone: true,
  imports: [KrnCodeBlock],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-code-block
      language="typescript"
      languageLabel="TypeScript"
      [code]="sourceCode"
      [(copied)]="copied"
    />
  `,
})
export class KernCodeBlockAgentExample {
  readonly sourceCode = "const customer = await client.customers.get('cus-2048');";

  copied = false;
}

void bootstrapApplication(KernCodeBlockAgentExample);
