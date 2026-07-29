/**
 * Typed native region select
 *
 * Use native select semantics with the same typed option contract.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnNativeSelect, type KrnSelectOption } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-native-select-agent-example',
  standalone: true,
  imports: [KrnNativeSelect, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-native-select ariaLabel="Data region" [options]="regionOptions" [formControl]="control" />
  `,
})
export class KernNativeSelectAgentExample {
  readonly control = new FormControl<string | null>('eu-central', { nonNullable: true });

  readonly regionOptions: readonly KrnSelectOption<string>[] = [
    { value: 'eu-central', label: 'EU Central' },
    { value: 'us-east', label: 'US East' },
  ];
}

void bootstrapApplication(KernNativeSelectAgentExample);
