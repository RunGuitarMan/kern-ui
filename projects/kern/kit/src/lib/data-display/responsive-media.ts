import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'krn-responsive-media',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'krn-responsive-media',
    '[style.aspect-ratio]': 'aspectRatio()',
  },
  template: `<ng-content />`,
  styles: `
    :host {
      position: relative;
      display: block;
      min-inline-size: 0;
      overflow: clip;
      border-radius: var(--krn-radius-surface, 0.75rem);
      background: var(--krn-color-surface-raised, #f2f3f5);
    }
  `,
})
export class KrnResponsiveMedia {
  readonly aspectRatio = input('16 / 9');
}
