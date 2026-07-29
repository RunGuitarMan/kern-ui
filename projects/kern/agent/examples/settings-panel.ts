/**
 * Controlled settings panel
 *
 * Own panel visibility and compose persistent action controls.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnSettingsPanel } from '@kern-ui/angular/patterns';

@Component({
  selector: 'app-kern-settings-panel-agent-example',
  standalone: true,
  imports: [KrnSettingsPanel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" (click)="open = true">Open settings</button>
    <krn-settings-panel heading="Report settings" [(open)]="open">
      <p>Choose visible metrics and reporting period.</p>
      <button krnSettingsActions type="button" (click)="open = false">Apply</button>
    </krn-settings-panel>
  `,
})
export class KernSettingsPanelAgentExample {
  open = false;
}

void bootstrapApplication(KernSettingsPanelAgentExample);
