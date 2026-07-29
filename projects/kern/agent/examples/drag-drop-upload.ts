/**
 * Typed evidence drop zone
 *
 * Bind immutable uploaded files while retaining an accessible browse action.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnDragDropUpload } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-drag-drop-upload-agent-example',
  standalone: true,
  imports: [KrnDragDropUpload, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-drag-drop-upload
      label="Audit evidence"
      description="Drop files or choose from your device"
      [multiple]="true"
      [formControl]="control"
    />
  `,
})
export class KernDragDropUploadAgentExample {
  readonly control = new FormControl<readonly File[]>([], { nonNullable: true });
}

void bootstrapApplication(KernDragDropUploadAgentExample);
