/**
 * Typed editable profile form
 *
 * Supply typed initial profile state and consume typed save output.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnProfileForm, type KrnProfileValue } from '@kern-ui/angular/patterns';

@Component({
  selector: 'app-kern-profile-form-agent-example',
  standalone: true,
  imports: [KrnProfileForm],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-profile-form
      [value]="profile"
      [timezones]="timezones"
      [saving]="saving"
      (saved)="save($event)"
    />
  `,
})
export class KernProfileFormAgentExample {
  profile: KrnProfileValue = {
    name: 'Ada Lovelace',
    role: 'Platform administrator',
    bio: 'Owns customer-platform operations.',
    timezone: 'Europe/London',
  };

  readonly timezones: readonly { readonly value: string; readonly label: string }[] = [
    { value: 'Europe/London', label: 'London' },
    { value: 'Europe/Berlin', label: 'Berlin' },
  ];

  saving = false;

  save(value: KrnProfileValue): void {
    this.profile = value;
    this.saving = true;
  }
}

void bootstrapApplication(KernProfileFormAgentExample);
