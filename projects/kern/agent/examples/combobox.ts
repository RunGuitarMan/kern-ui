/**
 * Typed editable owner combobox
 *
 * Offer typed suggestions for an application-owned text value.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnCombobox, type KrnSelectOption } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-combobox-agent-example',
  standalone: true,
  imports: [KrnCombobox, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-combobox
      ariaLabel="Escalation owner"
      [options]="ownerOptions"
      [formControl]="control"
      [(open)]="open"
    />
  `,
})
export class KernComboboxAgentExample {
  readonly control = new FormControl<string>('Platform team', { nonNullable: true });

  readonly ownerOptions: readonly KrnSelectOption<string>[] = [
    { value: 'Platform team', label: 'Platform team' },
    { value: 'Security team', label: 'Security team' },
  ];

  open = false;
}

void bootstrapApplication(KernComboboxAgentExample);
