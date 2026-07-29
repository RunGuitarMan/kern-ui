import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication, provideClientHydration } from '@angular/platform-browser';
import { provideKrn } from '@kern-ui/angular/core';
import { KrnAppShell, KrnCalendar, KrnDialog } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-hydration-recipe',
  standalone: true,
  imports: [KrnAppShell, KrnCalendar, KrnDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-app-shell>
      <header krnAppHeader>Renewals</header>
      <nav krnAppSidebar aria-label="Renewal navigation">Calendar · Accounts</nav>
      <main>
        <h1>Renewal calendar</h1>
        <krn-calendar
          ariaLabel="Renewal dates"
          today="2026-07-29"
          locale="en-GB"
          [(value)]="selectedDate"
          [(activeMonth)]="activeMonth"
          [(focusedDate)]="focusedDate"
        />
        <button type="button" (click)="dialogOpen = true">Review selected date</button>
        <krn-dialog
          title="Review renewal"
          [description]="'Selected date: ' + selectedDate"
          [(open)]="dialogOpen"
        >
          <p>{{ selectedDate }}</p>
        </krn-dialog>
      </main>
    </krn-app-shell>
  `,
})
export class KernHydrationRecipe {
  selectedDate = '2026-08-14';
  activeMonth = '2026-08';
  focusedDate = '2026-08-14';
  dialogOpen = false;
}

void bootstrapApplication(KernHydrationRecipe, {
  providers: [
    provideClientHydration(),
    provideKrn({
      locale: 'en-GB',
      direction: 'ltr',
      overlayHost: 'body',
    }),
  ],
});
