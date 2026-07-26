import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

import type { KrnLayoutSpace, KrnResponsiveBreakpoint} from './layout.types';
import { krnCssLength } from './layout.types';

export type KrnSplitRatio = '1:1' | '1:2' | '2:1' | 'golden' | string;

@Component({
  selector: 'krn-split-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="krn-split">
      <div class="krn-split__primary">
        <ng-content select="[krnSplitPrimary]" />
      </div>
      <div class="krn-split__secondary">
        <ng-content select="[krnSplitSecondary]" />
      </div>
    </div>
  `,
  host: {
    '[style.--krn-split-columns]': 'resolvedColumns()',
    '[style.--krn-split-gap]': 'resolvedGap()',
    '[style.--krn-split-align]': 'align()',
    '[attr.data-collapse-at]': 'collapseAt()',
    '[attr.data-reverse-collapsed]': 'reverseCollapsed() ? "" : null',
  },
  styles: `
    :host {
      display: block;
      min-inline-size: 0;
      container: krn-split / inline-size;
    }

    .krn-split {
      display: grid;
      min-inline-size: 0;
      grid-template-columns: var(--krn-split-columns);
      gap: var(--krn-split-gap);
      align-items: var(--krn-split-align, start);
    }

    .krn-split__primary,
    .krn-split__secondary {
      min-inline-size: 0;
    }

    @container krn-split (width < 36rem) {
      :host([data-collapse-at='sm']) .krn-split {
        grid-template-columns: minmax(0, 1fr);
      }
      :host([data-collapse-at='sm'][data-reverse-collapsed]) .krn-split__primary {
        order: 2;
      }
    }

    @container krn-split (width < 48rem) {
      :host([data-collapse-at='md']) .krn-split {
        grid-template-columns: minmax(0, 1fr);
      }
      :host([data-collapse-at='md'][data-reverse-collapsed]) .krn-split__primary {
        order: 2;
      }
    }

    @container krn-split (width < 64rem) {
      :host([data-collapse-at='lg']) .krn-split {
        grid-template-columns: minmax(0, 1fr);
      }
      :host([data-collapse-at='lg'][data-reverse-collapsed]) .krn-split__primary {
        order: 2;
      }
    }
  `,
})
export class KrnSplitLayout {
  readonly ratio = input<KrnSplitRatio>('1:1');
  readonly gap = input<KrnLayoutSpace>('6');
  readonly collapseAt = input<KrnResponsiveBreakpoint>('md');
  readonly reverseCollapsed = input(false, { transform: booleanAttribute });
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

    const parsed = ratio.match(/^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/);
    return parsed
      ? `minmax(0, ${parsed[1]}fr) minmax(0, ${parsed[2]}fr)`
      : 'minmax(0, 1fr) minmax(0, 1fr)';
  });
  protected readonly resolvedGap = computed(() => krnCssLength(this.gap(), 'var(--krn-space-6)'));
}
