import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnToggleButton, provideKrnToggleButtonOptions } from '@kern-ui/angular/kit';

@Component({
  selector: 'krn-consumer-root',
  imports: [KrnToggleButton],
  providers: [
    provideKrnToggleButtonOptions({
      pressedTone: 'success',
      unpressedVariant: 'outline',
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button krnToggleButton type="button" value="watch" [(pressed)]="watching">
      Watch changes
    </button>
  `,
})
class ToggleButtonConsumer {
  watching = false;
}

void bootstrapApplication(ToggleButtonConsumer);
