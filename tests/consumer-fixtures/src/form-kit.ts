import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnFormField, KrnHint, KrnLabel, KrnTextInput } from '@kern-ui/angular/kit';

@Component({
  selector: 'krn-consumer-root',
  imports: [KrnFormField, KrnHint, KrnLabel, KrnTextInput],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-form-field>
      <krn-label>Email</krn-label>
      <krn-text-input name="email" autocomplete="email" />
      <krn-hint>Use a work address</krn-hint>
    </krn-form-field>
  `,
})
class FormKitConsumer {}

void bootstrapApplication(FormKitConsumer);
