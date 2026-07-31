import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnLink } from '@kern-ui/angular/kit';

@Component({
  selector: 'krn-consumer-root',
  imports: [KrnLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a
      krnLink
      href="https://example.com/audit-policy"
      referrerpolicy="no-referrer"
      rel="noopener noreferrer"
      target="_blank"
    >
      Audit policy
    </a>
  `,
})
class LinkConsumer {}

void bootstrapApplication(LinkConsumer);
