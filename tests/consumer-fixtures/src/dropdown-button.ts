import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnDropdownButton, provideKrnMenuButtonOptions } from '@kern-ui/angular/kit';

@Component({
  selector: 'krn-consumer-root',
  imports: [KrnDropdownButton],
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
    <krn-dropdown-button [(open)]="open">
      <span krnLabel>Customer actions</span>
      <button krnMenu type="button" (click)="select('Assign owner')">Assign owner</button>
      <button krnMenu type="button" (click)="select('Archive customer')">Archive customer</button>
    </krn-dropdown-button>
    <output>{{ lastAction() }}</output>
  `,
})
class DropdownButtonConsumer {
  protected readonly open = signal(false);
  protected readonly lastAction = signal('No action selected');

  protected select(action: string): void {
    this.lastAction.set(action);
  }
}

void bootstrapApplication(DropdownButtonConsumer);
