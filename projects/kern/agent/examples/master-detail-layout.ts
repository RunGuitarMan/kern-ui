/**
 * Controlled customer master-detail layout
 *
 * Keep compact detail visibility synchronized with route or selection state.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnMasterDetailLayout } from '@kern-ui/angular/patterns';

@Component({
  selector: 'app-kern-master-detail-layout-agent-example',
  standalone: true,
  imports: [KrnMasterDetailLayout],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-master-detail-layout
      masterLabel="Customers"
      detailLabel="Customer details"
      [(detailOpen)]="detailOpen"
    >
      <section krnMaster>
        <button type="button" (click)="detailOpen = true">Acme Europe</button>
      </section>
      <section krnDetail>
        <h2>Acme Europe</h2>
        <button type="button" (click)="detailOpen = false">Back to customers</button>
      </section>
    </krn-master-detail-layout>
  `,
})
export class KernMasterDetailLayoutAgentExample {
  detailOpen = false;
}

void bootstrapApplication(KernMasterDetailLayoutAgentExample);
