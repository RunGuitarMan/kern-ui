import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  numberAttribute,
} from '@angular/core';

import type { KrnLayoutAlignment, KrnLayoutSpace } from './layout.types';
import { krnCssLength } from './layout.types';

function gridColumnsAttribute(value: unknown): number | 'auto' {
  if (value === null || value === undefined || value === '' || value === 'auto') {
    return 'auto';
  }
  const columns = numberAttribute(value);
  return Number.isFinite(columns) ? columns : 'auto';
}

@Component({
  selector: 'krn-grid',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './grid.html',
  host: {
    '[style.--krn-grid-gap]': 'resolvedGap()',
    '[style.--krn-grid-min]': 'resolvedMinColumnWidth()',
    '[style.--krn-grid-columns]': 'resolvedColumns()',
    '[attr.data-align]': 'align()',
    '[attr.data-mode]': 'columns() === "auto" ? "fluid" : "fixed"',
    '[attr.data-responsive]': 'responsive() ? "" : null',
  },
  styleUrl: './grid.css',
})
export class KrnGrid {
  /** Fixed column count clamped to 1–12, or `auto` for fluid auto-fit columns. */
  readonly columns = input<number | 'auto', unknown>('auto', {
    transform: gridColumnsAttribute,
  });
  /** Minimum fluid column width used when columns is `auto`. */
  readonly minColumnWidth = input<KrnLayoutSpace>('16rem');
  /** Logical spacing between rows and columns. */
  readonly gap = input<KrnLayoutSpace>('4');
  /** Block-axis alignment of items within their grid areas. */
  readonly align = input<KrnLayoutAlignment>('stretch');
  /** Collapses fixed columns below the component-owned 36rem container boundary. */
  readonly responsive = input(true, { transform: booleanAttribute });

  protected readonly resolvedColumns = computed(() => {
    const columns = this.columns();
    return columns === 'auto' ? 1 : Math.max(1, Math.min(12, Math.round(columns)));
  });
  protected readonly resolvedMinColumnWidth = computed(() =>
    krnCssLength(this.minColumnWidth(), '16rem'),
  );
  protected readonly resolvedGap = computed(() => krnCssLength(this.gap(), 'var(--krn-space-4)'));
}
