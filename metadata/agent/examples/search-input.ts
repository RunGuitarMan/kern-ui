/**
 * Typed customer search
 *
 * Own search query state in a non-nullable reactive form control.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnSearchInput } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-search-input-agent-example',
  standalone: true,
  imports: [KrnSearchInput, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-search-input
      id="customer-search"
      ariaLabel="Search customers"
      placeholder="Name, owner or account id"
      [formControl]="control"
    />
  `,
})
export class KernSearchInputAgentExample {
  readonly control = new FormControl<string>('', { nonNullable: true });
}

void bootstrapApplication(KernSearchInputAgentExample);
