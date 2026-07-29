/**
 * Typed review notes
 *
 * Edit long-form review notes through a non-nullable control.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnTextarea } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-textarea-agent-example',
  standalone: true,
  imports: [KrnTextarea, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-textarea id="review-notes" ariaLabel="Review notes" [rows]="5" [formControl]="control" />
  `,
})
export class KernTextareaAgentExample {
  readonly control = new FormControl<string>('Renewal approved pending legal review.', {
    nonNullable: true,
  });
}

void bootstrapApplication(KernTextareaAgentExample);
