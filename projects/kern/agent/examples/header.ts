/**
 * Application header
 *
 * Arrange product identity, page context and account actions.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnHeader } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-header-agent-example',
  standalone: true,
  imports: [KrnHeader],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-header sticky>
      <strong krnHeaderStart>KERN Console</strong>
      <span>Production</span>
      <button krnHeaderEnd type="button">Account</button>
    </krn-header>
  `,
})
export class KernHeaderAgentExample {}

void bootstrapApplication(KernHeaderAgentExample);
