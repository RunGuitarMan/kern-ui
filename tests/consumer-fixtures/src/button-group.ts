import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnButton, KrnButtonGroup, KrnIconButton } from '@kern-ui/angular/kit';

@Component({
  selector: 'krn-consumer-root',
  imports: [KrnButtonGroup, KrnButton, KrnIconButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div krnButtonGroup connected aria-label="Review actions">
      <button krnButton type="button">Request changes</button>
      <button krnButton type="button">Approve</button>
      <button krnIconButton type="button" aria-label="More review actions">•••</button>
    </div>
  `,
})
class ButtonGroupConsumer {}

void bootstrapApplication(ButtonGroupConsumer);
