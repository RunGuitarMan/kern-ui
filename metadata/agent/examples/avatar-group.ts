/**
 * Account team avatar group
 *
 * Compose named avatars under one accessible group label.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnAvatar, KrnAvatarGroup } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-avatar-group-agent-example',
  standalone: true,
  imports: [KrnAvatarGroup, KrnAvatar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-avatar-group ariaLabel="Account team">
      <krn-avatar name="Ada Lovelace" alt="Ada Lovelace" />
      <krn-avatar name="Grace Hopper" alt="Grace Hopper" />
      <krn-avatar name="Margaret Hamilton" alt="Margaret Hamilton" />
    </krn-avatar-group>
  `,
})
export class KernAvatarGroupAgentExample {}

void bootstrapApplication(KernAvatarGroupAgentExample);
