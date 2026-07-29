/**
 * Controlled user action menu
 *
 * Own menu disclosure state and provide a visible signed-in identity.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnUserMenu } from '@kern-ui/angular/patterns';

@Component({
  selector: 'app-kern-user-menu-agent-example',
  standalone: true,
  imports: [KrnUserMenu],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-user-menu name="Ada Lovelace" detail="Platform administrator" [(open)]="open">
      <span krnUserAvatar aria-hidden="true">AL</span>
      <button role="menuitem" type="button">Profile</button>
      <button role="menuitem" type="button">Sign out</button>
    </krn-user-menu>
  `,
})
export class KernUserMenuAgentExample {
  open = false;
}

void bootstrapApplication(KernUserMenuAgentExample);
