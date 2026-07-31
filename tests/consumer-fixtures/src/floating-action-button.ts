import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import {
  KrnFloatingActionButton,
  provideKrnFloatingActionButtonOptions,
} from '@kern-ui/angular/kit';

@Component({
  selector: 'krn-consumer-root',
  imports: [KrnFloatingActionButton],
  providers: [
    provideKrnFloatingActionButtonOptions({
      extended: false,
      size: 'md',
      variant: 'soft',
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button krnFab type="button">
      <span krnFabIcon>+</span>
      Create customer
    </button>
  `,
})
class FloatingActionButtonConsumer {}

void bootstrapApplication(FloatingActionButtonConsumer);
