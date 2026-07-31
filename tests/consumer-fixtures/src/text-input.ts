import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnTextInput } from '@kern-ui/angular';

@Component({
  selector: 'krn-consumer-root',
  imports: [KrnTextInput],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<krn-text-input id="email" name="email" autocomplete="email" />`,
})
class TextInputConsumer {}

void bootstrapApplication(TextInputConsumer);
