/**
 * Typed account autocomplete
 *
 * Provide explicit suggestions and controlled popup state.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnAutocomplete, type KrnSelectOption } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-autocomplete-agent-example',
  standalone: true,
  imports: [KrnAutocomplete, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-autocomplete
      ariaLabel="Customer account"
      [options]="accountOptions"
      [formControl]="control"
      [(open)]="open"
    />
  `,
})
export class KernAutocompleteAgentExample {
  readonly control = new FormControl<string>('Acme Europe', { nonNullable: true });

  readonly accountOptions: readonly KrnSelectOption<string>[] = [
    { value: 'Acme Europe', label: 'Acme Europe' },
    { value: 'Acme North America', label: 'Acme North America' },
  ];

  open = false;
}

void bootstrapApplication(KernAutocompleteAgentExample);
