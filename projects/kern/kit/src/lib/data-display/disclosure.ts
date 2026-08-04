import { ChangeDetectionStrategy, Component, inject, input, model } from '@angular/core';
import { KRN_TRANSLATIONS } from '@kern-ui/angular/core';
import { krnInputFallback } from '../reactive-input';

@Component({
  selector: 'krn-disclosure',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <details [open]="open()" (toggle)="onToggle($event)">
      <summary>
        <span>{{ heading() }}</span>
        <span class="indicator" aria-hidden="true"></span>
      </summary>
      <div class="panel"><ng-content /></div>
    </details>
  `,
  styles: `
    :host {
      display: block;
      border-block-end: 1px solid var(--krn-color-border-subtle, #e0e3e7);
    }
    details {
      interpolate-size: allow-keywords;
    }
    summary {
      display: flex;
      min-block-size: var(--krn-control-size, 2.5rem);
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.75rem 0.375rem;
      border-radius: var(--krn-radius-control, 0.375rem);
      color: var(--krn-color-text, #252932);
      font-weight: 620;
      cursor: pointer;
      list-style: none;
      transition:
        color var(--krn-motion-duration-selection),
        background var(--krn-motion-duration-selection);
    }
    summary::-webkit-details-marker {
      display: none;
    }
    summary:focus-visible {
      outline: var(--krn-focus-ring, 2px solid #4f6feb);
      outline-offset: 3px;
    }
    summary:hover {
      background: color-mix(in oklch, var(--krn-color-surface-subtle, #f3f4f6) 74%, transparent);
    }
    .indicator {
      inline-size: 0.5rem;
      block-size: 0.5rem;
      border-inline-end: 1.5px solid currentColor;
      border-block-end: 1.5px solid currentColor;
      rotate: 45deg;
      transition: rotate var(--krn-motion-duration-selection);
    }
    details[open] .indicator {
      rotate: 225deg;
    }
    .panel {
      padding: 0 var(--krn-space-4, 1rem) 1rem;
      color: var(--krn-color-text-muted, #626a76);
    }
    @supports selector(details::details-content) {
      details::details-content {
        block-size: 0;
        overflow: clip;
        opacity: 0;
        transition:
          block-size var(--krn-motion-duration-selection) var(--krn-motion-ease-standard, ease),
          opacity var(--krn-motion-duration-selection) var(--krn-motion-ease-standard, ease);
      }
      details[open]::details-content {
        block-size: auto;
        opacity: 1;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      :host-context(html:not([data-krn-motion='full'])) summary,
      :host-context(html:not([data-krn-motion='full'])) .indicator,
      :host-context(html:not([data-krn-motion='full'])) details::details-content {
        transition: none;
      }
    }
  `,
})
export class KrnDisclosure {
  readonly heading = input.required<string>();
  readonly open = model(false);

  protected onToggle(event: Event): void {
    this.open.set((event.currentTarget as HTMLDetailsElement).open);
  }
}

@Component({
  selector: 'krn-accordion',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'group',
    '[attr.aria-label]': 'resolvedAriaLabel()',
  },
  template: `<ng-content />`,
  styles: `
    :host {
      display: block;
      border-block-start: 1px solid var(--krn-color-border-subtle, #e0e3e7);
    }
  `,
})
export class KrnAccordion {
  private readonly translations = inject(KRN_TRANSLATIONS);
  readonly ariaLabel = input<string | undefined>();
  protected readonly resolvedAriaLabel = krnInputFallback(
    this.ariaLabel,
    () => this.translations.dataDisplay.accordion,
  );
}
