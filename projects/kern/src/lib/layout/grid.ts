import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import type { KrnLayoutAlignment, KrnLayoutSpace} from './layout.types';
import { krnCssLength } from './layout.types';

@Component({
  selector: 'krn-grid',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  host: {
    '[style.--krn-grid-gap]': 'resolvedGap()',
    '[style.--krn-grid-min]': 'resolvedMinColumnWidth()',
    '[style.--krn-grid-columns]': 'resolvedColumns()',
    '[attr.data-align]': 'align()',
    '[attr.data-mode]': 'columns() === "auto" ? "fluid" : "fixed"',
  },
  styles: `
    :host {
      display: grid;
      min-inline-size: 0;
      gap: var(--krn-grid-gap);
      align-items: var(--krn-grid-align, stretch);
      grid-template-columns: repeat(auto-fit, minmax(min(100%, var(--krn-grid-min)), 1fr));
    }

    :host([data-mode='fixed']) {
      grid-template-columns: repeat(var(--krn-grid-columns), minmax(0, 1fr));
    }

    :host([data-align='start']) {
      --krn-grid-align: start;
    }
    :host([data-align='center']) {
      --krn-grid-align: center;
    }
    :host([data-align='end']) {
      --krn-grid-align: end;
    }
    :host([data-align='stretch']) {
      --krn-grid-align: stretch;
    }
    :host([data-align='baseline']) {
      --krn-grid-align: baseline;
    }

    @media (max-width: 36rem) {
      :host([data-mode='fixed']) {
        grid-template-columns: minmax(0, 1fr);
      }
    }
  `,
})
export class KrnGrid {
  readonly columns = input<number | 'auto'>('auto');
  readonly minColumnWidth = input<KrnLayoutSpace>('16rem');
  readonly gap = input<KrnLayoutSpace>('4');
  readonly align = input<KrnLayoutAlignment>('stretch');

  protected readonly resolvedColumns = computed(() => {
    const columns = this.columns();
    return columns === 'auto' ? 1 : Math.max(1, Math.min(12, Math.round(columns)));
  });
  protected readonly resolvedMinColumnWidth = computed(() =>
    krnCssLength(this.minColumnWidth(), '16rem'),
  );
  protected readonly resolvedGap = computed(() => krnCssLength(this.gap(), 'var(--krn-space-4)'));
}
