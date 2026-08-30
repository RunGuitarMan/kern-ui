import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import type { KrnLayoutSpace, KrnResponsiveBreakpoint } from './layout.types';
import { krnCssLength } from './layout.types';

export type KrnSplitRatio = '1:1' | '1:2' | '2:1' | 'golden' | (string & {});

@Component({
  selector: 'krn-split-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './split-layout.html',
  host: {
    '[style.--krn-split-columns]': 'resolvedColumns()',
    '[style.--krn-split-gap]': 'resolvedGap()',
    '[style.--krn-split-align]': 'align()',
    '[attr.data-collapse-at]': 'collapseAt()',
  },
  styleUrl: './split-layout.css',
})
export class KrnSplitLayout {
  /** Sets the relative primary-to-secondary track sizes. Accepts presets, `3:2`, or `3fr 2fr`. */
  readonly ratio = input<KrnSplitRatio>('1:1');

  /** Sets the space between the two panels using a spacing token, number of pixels, or CSS length. */
  readonly gap = input<KrnLayoutSpace>('6');

  /** Stacks the panels when the split layout's inline size reaches the selected breakpoint. */
  readonly collapseAt = input<KrnResponsiveBreakpoint>('md');

  /** Aligns the panels within the split layout's block axis. */
  readonly align = input<'start' | 'center' | 'end' | 'stretch'>('start');

  protected readonly resolvedColumns = computed(() => {
    const ratio = this.ratio().trim();
    if (ratio === '1:1') {
      return 'minmax(0, 1fr) minmax(0, 1fr)';
    }
    if (ratio === '1:2') {
      return 'minmax(0, 1fr) minmax(0, 2fr)';
    }
    if (ratio === '2:1') {
      return 'minmax(0, 2fr) minmax(0, 1fr)';
    }
    if (ratio === 'golden') {
      return 'minmax(0, 1.618fr) minmax(0, 1fr)';
    }

    const parsed =
      ratio.match(/^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/) ??
      ratio.match(/^(\d+(?:\.\d+)?)fr\s+(\d+(?:\.\d+)?)fr$/);
    return parsed
      ? `minmax(0, ${parsed[1]}fr) minmax(0, ${parsed[2]}fr)`
      : 'minmax(0, 1fr) minmax(0, 1fr)';
  });
  protected readonly resolvedGap = computed(() => krnCssLength(this.gap(), 'var(--krn-space-6)'));
}
