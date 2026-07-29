/**
 * Controlled responsive product shell
 *
 * Compose header, navigation and mobile fallback with owned disclosure state.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnResponsiveApplicationShell } from '@kern-ui/angular/patterns';

@Component({
  selector: 'app-kern-responsive-application-shell-agent-example',
  standalone: true,
  imports: [KrnResponsiveApplicationShell],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-responsive-application-shell mainId="main-content" [(navigationOpen)]="navigationOpen">
      <header krnAppHeader>
        <button type="button" (click)="navigationOpen = true">Open navigation</button>
        KERN Console
      </header>
      <nav krnAppNavigation aria-label="Primary">Customers · Reports · Settings</nav>
      <main id="main-content">
        <h1>Customer portfolio</h1>
      </main>
      <nav krnAppMobileNavigation aria-label="Mobile primary navigation">
        Home · Tasks · Account
      </nav>
    </krn-responsive-application-shell>
  `,
})
export class KernResponsiveApplicationShellAgentExample {
  navigationOpen = false;
}

void bootstrapApplication(KernResponsiveApplicationShellAgentExample);
