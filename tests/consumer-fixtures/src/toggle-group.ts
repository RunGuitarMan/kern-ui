import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import {
  KrnToggleButton,
  KrnToggleGroup,
  provideKrnToggleGroupOptions,
} from '@kern-ui/angular/kit';

@Component({
  selector: 'krn-consumer-root',
  imports: [KrnToggleButton, KrnToggleGroup],
  providers: [
    provideKrnToggleGroupOptions({
      multiple: true,
      orientation: 'vertical',
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div krnToggleGroup aria-label="Visible dashboard layers" [(values)]="visibleLayers">
      <button krnToggleButton value="targets">Targets</button>
      <button krnToggleButton value="forecast">Forecast</button>
    </div>
  `,
})
class ToggleGroupConsumer {
  visibleLayers: readonly string[] = ['targets'];
}

void bootstrapApplication(ToggleGroupConsumer);
