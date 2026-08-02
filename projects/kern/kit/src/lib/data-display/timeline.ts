import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { KRN_TRANSLATIONS } from '@kern-ui/angular/core';

@Component({
  selector: 'krn-timeline',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'list',
    '[attr.aria-label]': 'ariaLabel()',
  },
  template: `<ng-content />`,
  styles: `
    :host {
      display: grid;
    }
  `,
})
export class KrnTimeline {
  private readonly translations = inject(KRN_TRANSLATIONS);
  readonly ariaLabel = input(this.translations.dataDisplay.timeline);
}

@Component({
  selector: 'krn-timeline-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'listitem',
  },
  template: `
    <span class="rail" aria-hidden="true"><i></i></span>
    <div>
      <div class="meta">{{ time() }}</div>
      <strong>{{ heading() }}</strong>
      <div class="body"><ng-content /></div>
    </div>
  `,
  styles: `
    :host {
      display: grid;
      grid-template-columns: 1rem minmax(0, 1fr);
      gap: 0.75rem;
      min-block-size: 4rem;
      color: var(--krn-color-text, #252932);
    }
    .rail {
      position: relative;
      display: flex;
      justify-content: center;
    }
    .rail::after {
      position: absolute;
      inset-block: 0.75rem 0;
      inline-size: 1px;
      background: var(--krn-color-border, #cdd1d7);
      content: '';
    }
    i {
      position: relative;
      z-index: 1;
      inline-size: 0.625rem;
      block-size: 0.625rem;
      margin-block-start: 0.25rem;
      border: 2px solid var(--krn-color-brand-solid, #4f6feb);
      border-radius: 50%;
      background: var(--krn-color-canvas, #faf9f7);
    }
    .meta {
      color: var(--krn-color-text-muted, #626a76);
      font-size: 0.75rem;
      font-variant-numeric: tabular-nums;
    }
    .body {
      margin-block-start: 0.25rem;
      color: var(--krn-color-text-muted, #626a76);
    }
  `,
})
export class KrnTimelineItem {
  readonly heading = input.required<string>();
  readonly time = input('');
}
