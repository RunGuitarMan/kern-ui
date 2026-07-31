import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnSplitButton, provideKrnMenuButtonOptions } from '@kern-ui/angular/kit';

@Component({
  selector: 'krn-consumer-root',
  imports: [KrnSplitButton],
  providers: [
    provideKrnMenuButtonOptions({
      matchTriggerWidth: true,
      menuAlign: 'start',
      menuOffset: 6,
      size: 'sm',
      tone: 'neutral',
      variant: 'outline',
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-split-button
      [(open)]="open"
      menuLabel="Open customer publishing options"
      (primaryAction)="publish('Publish customer')"
    >
      <span krnLabel>Publish customer</span>
      <button krnMenu type="button" (click)="publish('Schedule customer')">
        Schedule customer
      </button>
      <button krnMenu type="button" (click)="publish('Save customer draft')">
        Save customer draft
      </button>
    </krn-split-button>
    <output>{{ lastAction() }}</output>
  `,
})
class SplitButtonConsumer {
  protected readonly open = signal(false);
  protected readonly lastAction = signal('No publishing action selected');

  protected publish(action: string): void {
    this.lastAction.set(action);
  }
}

void bootstrapApplication(SplitButtonConsumer);
