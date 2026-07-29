/**
 * Main-content skip link
 *
 * Give keyboard users a direct route past repeated navigation.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnSkipLink } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-skip-link-agent-example',
  standalone: true,
  imports: [KrnSkipLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-skip-link targetId="main-content" label="Skip to account details" />
    <main id="main-content" tabindex="-1">Account details</main>
  `,
})
export class KernSkipLinkAgentExample {}

void bootstrapApplication(KernSkipLinkAgentExample);
