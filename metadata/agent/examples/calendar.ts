/**
 * Controlled renewal calendar
 *
 * Own ISO date, active month and focus state with stable disabled dates.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnCalendar } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-calendar-agent-example',
  standalone: true,
  imports: [KrnCalendar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-calendar
      ariaLabel="Renewal calendar"
      locale="en-GB"
      today="2026-07-29"
      [disabledDates]="disabledDates"
      [(value)]="selectedDate"
      [(activeMonth)]="activeMonth"
      [(focusedDate)]="focusedDate"
    />
  `,
})
export class KernCalendarAgentExample {
  selectedDate = '2026-08-14';

  activeMonth = '2026-08';

  focusedDate = '2026-08-14';

  readonly disabledDates: ReadonlySet<string> = new Set(['2026-08-16']);
}

void bootstrapApplication(KernCalendarAgentExample);
