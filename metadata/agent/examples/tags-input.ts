/**
 * Typed account tags
 *
 * Bind an immutable tag array and provide an explicit creation label.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnTagsInput } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-tags-input-agent-example',
  standalone: true,
  imports: [KrnTagsInput, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-tags-input label="Account tags" placeholder="Add a tag" [formControl]="control" />
  `,
})
export class KernTagsInputAgentExample {
  readonly control = new FormControl<readonly string[]>(['enterprise', 'renewal-q3'], {
    nonNullable: true,
  });
}

void bootstrapApplication(KernTagsInputAgentExample);
