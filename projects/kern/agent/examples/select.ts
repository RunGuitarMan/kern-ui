/**
 * Typed owner select
 *
 * Supply stable typed options and controlled overlay state.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnSelect, type KrnSelectOption } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-select-agent-example',
  standalone: true,
  imports: [KrnSelect, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-select
      ariaLabel="Account owner"
      [options]="ownerOptions"
      [formControl]="control"
      [(open)]="open"
    />
  `,
})
export class KernSelectAgentExample {
  readonly control = new FormControl<string | null>('owner-ada', { nonNullable: true });

  readonly ownerOptions: readonly KrnSelectOption<string>[] = [
    { value: 'owner-ada', label: 'Ada Lovelace' },
    { value: 'owner-grace', label: 'Grace Hopper' },
  ];

  open = false;
}

void bootstrapApplication(KernSelectAgentExample);
