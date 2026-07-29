/**
 * Controlled mobile primary navigation
 *
 * Use stable ids and owned selected destination.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnBottomNavigation, type KrnNavigationItem } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-bottom-navigation-agent-example',
  standalone: true,
  imports: [KrnBottomNavigation],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-bottom-navigation
      ariaLabel="Primary mobile navigation"
      [items]="items"
      [(value)]="selectedDestination"
    />
  `,
})
export class KernBottomNavigationAgentExample {
  readonly items: readonly KrnNavigationItem[] = [
    { id: 'home', label: 'Home', href: '/home' },
    { id: 'tasks', label: 'Tasks', href: '/tasks', badge: 3 },
    { id: 'account', label: 'Account', href: '/account' },
  ];

  selectedDestination: string | null = 'home';
}

void bootstrapApplication(KernBottomNavigationAgentExample);
