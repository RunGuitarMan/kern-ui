import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'krn-responsive-media',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
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
    :host ::ng-deep :is(img, video, iframe, svg) {
      display: block;
      inline-size: 100%;
      block-size: 100%;
      object-fit: var(--krn-media-fit, cover);
    }
  `,
})
export class KrnResponsiveMedia {
  readonly aspectRatio = input('16 / 9');
}
