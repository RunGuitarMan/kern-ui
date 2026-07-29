/**
 * Typed contract upload
 *
 * Bind an immutable file list with accepted document formats.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnFileUpload } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-file-upload-agent-example',
  standalone: true,
  imports: [KrnFileUpload, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-file-upload
      label="Signed contract"
      description="PDF, up to 10 MB"
      accept=".pdf,application/pdf"
      [maxSize]="10485760"
      [formControl]="control"
    />
  `,
})
export class KernFileUploadAgentExample {
  readonly control = new FormControl<readonly File[]>([], { nonNullable: true });
}

void bootstrapApplication(KernFileUploadAgentExample);
