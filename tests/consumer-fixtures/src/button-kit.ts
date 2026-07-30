import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnButton } from '@kern-ui/angular/kit';

@Component({
  selector: 'krn-consumer-root',
  imports: [KrnButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<krn-button>Save</krn-button>`,
})
class ButtonKitConsumer {}

void bootstrapApplication(ButtonKitConsumer);
