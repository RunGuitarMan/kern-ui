import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'krn-responsive-media',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'krn-responsive-media',
    '[style.aspect-ratio]': 'aspectRatio()',
  },
  templateUrl: './responsive-media.html',
  styleUrl: './responsive-media.css',
})
export class KrnResponsiveMedia {
  readonly aspectRatio = input('16 / 9');
}
