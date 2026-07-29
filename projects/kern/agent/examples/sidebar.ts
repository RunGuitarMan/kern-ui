/**
 * Collapsible workspace sidebar
 *
 * Keep sidebar collapse state application-owned.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnSidebar } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-sidebar-agent-example',
  standalone: true,
  imports: [KrnSidebar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-sidebar [(collapsed)]="collapsed" ariaLabel="Workspace navigation">
      <strong krnSidebarHeader>Workspace</strong>
      <nav aria-label="Sections">Overview · Members · Audit log</nav>
      <small krnSidebarFooter>Acme Europe</small>
    </krn-sidebar>
  `,
})
export class KernSidebarAgentExample {
  collapsed = false;
}

void bootstrapApplication(KernSidebarAgentExample);
