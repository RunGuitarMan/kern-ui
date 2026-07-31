/**
 * Primary save action
 *
 * Render an explicit form action with scoped visual and loading-copy defaults.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnButton, provideKrnButtonOptions } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-button-agent-example',
  standalone: true,
  imports: [KrnButton],
  providers: [
    provideKrnButtonOptions({
      size: 'lg',
      loadingLabel: 'Saving workspace…',
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form (submit)="saving = true; $event.preventDefault()">
      <button krnButton type="submit" [loading]="saving">Save changes</button>
    </form>
  `,
})
export class KernButtonAgentExample {
  saving = false;
}

void bootstrapApplication(KernButtonAgentExample);
