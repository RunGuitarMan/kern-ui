/**
 * Controlled blocking save state
 *
 * Keep existing content perceivable while a blocking operation is active.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnLoadingOverlay } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-loading-overlay-agent-example',
  standalone: true,
  imports: [KrnLoadingOverlay],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-loading-overlay [active]="saving" [blocking]="true" label="Saving customer">
      <section>
        <h2>Customer profile</h2>
        <button type="button" (click)="saving = !saving">Toggle save state</button>
      </section>
    </krn-loading-overlay>
  `,
})
export class KernLoadingOverlayAgentExample {
  saving = false;
}

void bootstrapApplication(KernLoadingOverlayAgentExample);
