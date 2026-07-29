/**
 * Account health meter
 *
 * Communicate a bounded value with visible label and thresholds.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnMeter } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-meter-agent-example',
  standalone: true,
  imports: [KrnMeter],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-meter label="Account health" [value]="82" [min]="0" [max]="100" [low]="40" [high]="75" />
  `,
})
export class KernMeterAgentExample {}

void bootstrapApplication(KernMeterAgentExample);
