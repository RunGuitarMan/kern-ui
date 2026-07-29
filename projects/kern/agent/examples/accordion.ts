/**
 * Account policy accordion
 *
 * Group independently controlled disclosures under one accessible label.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnAccordion, KrnDisclosure } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-accordion-agent-example',
  standalone: true,
  imports: [KrnAccordion, KrnDisclosure],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-accordion ariaLabel="Account policies">
      <krn-disclosure heading="Data residency" [(open)]="dataResidencyOpen">
        Customer data is stored in the EU Central region.
      </krn-disclosure>
      <krn-disclosure heading="Retention"
        >Audit records are retained for seven years.</krn-disclosure
      >
    </krn-accordion>
  `,
})
export class KernAccordionAgentExample {
  dataResidencyOpen = true;
}

void bootstrapApplication(KernAccordionAgentExample);
