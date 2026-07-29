/**
 * Responsive application shell
 *
 * Compose header, navigation and main content with controlled mobile navigation.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnAppShell } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-app-shell-agent-example',
  standalone: true,
  imports: [KrnAppShell],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-app-shell [(mobileNavigationOpen)]="navigationOpen">
      <header krnAppHeader>Operations workspace</header>
      <nav krnAppSidebar aria-label="Workspace">Overview · Reports · Settings</nav>
      <main>
        <h1>Overview</h1>
        <p>Quarterly operating summary.</p>
      </main>
    </krn-app-shell>
  `,
})
export class KernAppShellAgentExample {
  navigationOpen = false;
}

void bootstrapApplication(KernAppShellAgentExample);
