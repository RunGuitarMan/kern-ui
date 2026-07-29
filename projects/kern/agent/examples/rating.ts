/**
 * Controlled customer rating
 *
 * Keep the selected numeric rating in application state.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnRating } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-rating-agent-example',
  standalone: true,
  imports: [KrnRating],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <krn-rating ariaLabel="Customer satisfaction" [max]="5" [(value)]="rating" /> `,
})
export class KernRatingAgentExample {
  rating = 4;
}

void bootstrapApplication(KernRatingAgentExample);
