/**
 * Named account-owner avatar
 *
 * Provide initials fallback and meaningful alternative text.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnAvatar } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-avatar-agent-example',
  standalone: true,
  imports: [KrnAvatar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-avatar name="Ada Lovelace" alt="Ada Lovelace, account owner" status="online" />
  `,
})
export class KernAvatarAgentExample {}

void bootstrapApplication(KernAvatarAgentExample);
