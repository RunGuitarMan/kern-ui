import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'krn-description-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  styles: `
    :host {
      display: block;
      margin: 0;
      border-block-start: 1px solid var(--krn-color-border-subtle, #e0e3e7);
    }
  `,
})
export class KrnDescriptionList {}

@Component({
  selector: 'krn-description-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dl>
      <dt>{{ term() }}</dt>
      <dd><ng-content /></dd>
    </dl>
  `,
  styles: `
    :host {
      display: block;
      border-block-end: 1px solid var(--krn-color-border-subtle, #e0e3e7);
    }
    dl {
      display: grid;
      grid-template-columns: minmax(7rem, 0.45fr) minmax(0, 1fr);
      gap: 0;
      margin: 0;
    }
    dt,
    dd {
      margin: 0;
      padding-block: var(--krn-space-3, 0.75rem);
    }
    dt {
      color: var(--krn-color-text-muted, #626a76);
      font-weight: 600;
    }
    dd {
      min-inline-size: 0;
      overflow-wrap: anywhere;
      color: var(--krn-color-text, #252932);
    }
    @container (max-width: 28rem) {
      dl {
        grid-template-columns: 1fr;
      }
      dt {
        padding-block-end: 0.125rem;
      }
      dd {
        padding-block-start: 0;
      }
    }
  `,
})
export class KrnDescriptionItem {
  readonly term = input.required<string>();
}
