/**
 * Mobile application navigation
 *
 * Compose touch-friendly primary destinations under one accessible label.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnMobileNavigation } from '@kern-ui/angular/patterns';

@Component({
  selector: 'app-kern-mobile-navigation-agent-example',
  standalone: true,
  imports: [KrnMobileNavigation],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-mobile-navigation ariaLabel="Primary mobile navigation">
      <a href="/home">Home</a>
      <a href="/tasks">Tasks</a>
      <a href="/account">Account</a>
    </krn-mobile-navigation>
  `,
})
export class KernMobileNavigationAgentExample {}

void bootstrapApplication(KernMobileNavigationAgentExample);
