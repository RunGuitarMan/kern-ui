/**
 * Typed multi-owner selection
 *
 * Own a readonly selection array and controlled popup state.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnMultiSelect, type KrnSelectOption } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-multi-select-agent-example',
  standalone: true,
  imports: [KrnMultiSelect, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-multi-select
      ariaLabel="Reviewers"
      [options]="reviewerOptions"
      [formControl]="control"
      [(open)]="open"
    />
  `,
})
export class KernMultiSelectAgentExample {
  readonly control = new FormControl<readonly string[]>(['reviewer-security'], {
    nonNullable: true,
  });

  readonly reviewerOptions: readonly KrnSelectOption<string>[] = [
    { value: 'reviewer-security', label: 'Security team' },
    { value: 'reviewer-legal', label: 'Legal team' },
    { value: 'reviewer-finance', label: 'Finance team' },
  ];

  open = false;
}

void bootstrapApplication(KernMultiSelectAgentExample);
