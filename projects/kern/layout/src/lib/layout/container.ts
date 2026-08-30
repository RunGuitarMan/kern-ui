import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

import type { KrnLayoutSpace } from './layout.types';
import { krnCssLength } from './layout.types';

export type KrnContainerSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

@Component({
  selector: 'krn-container',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './container.html',
  host: {
    '[style.--krn-container-max]': 'resolvedMaxWidth()',
    '[style.--krn-container-gutter]': 'resolvedGutter()',
    '[attr.data-size]': 'size()',
    '[attr.data-align]': 'align()',
  },
  styleUrl: './container.css',
})
export class KrnContainer {
  readonly size = input<KrnContainerSize>('lg');
  readonly maxWidth = input<KrnLayoutSpace | null>(null);
  readonly gutter = input<KrnLayoutSpace>('4');
  readonly align = input<'start' | 'center' | 'end'>('center');

  protected readonly resolvedMaxWidth = computed(() => {
    const size = this.size();
    const fallback = size === 'full' ? '100%' : `var(--krn-container-${size})`;
    const explicit = this.maxWidth();
    return explicit === null ? fallback : krnCssLength(explicit, fallback);
  });
  protected readonly resolvedGutter = computed(() =>
    krnCssLength(this.gutter(), 'var(--krn-space-4)'),
  );
}

@Component({
  selector: 'krn-center',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './center.html',
  host: {
    '[style.--krn-center-max]': 'resolvedMaxWidth()',
    '[style.--krn-center-gutter]': 'resolvedGutter()',
    '[attr.data-intrinsic]': 'intrinsic() ? "" : null',
  },
  styleUrl: './center.css',
})
export class KrnCenter {
  /** Maximum outer inline size as a container token, CSS length, or `full`. */
  readonly maxWidth = input<KrnLayoutSpace>('md');
  /** Logical inline padding kept inside the maximum width. */
  readonly gutters = input<KrnLayoutSpace>('4');
  /** Centers projected children on the inline axis without changing text alignment. */
  readonly intrinsic = input(false, { transform: booleanAttribute });

  protected readonly resolvedMaxWidth = computed(() => {
    const max = this.maxWidth();
    if (max === 'full') {
      return '100%';
    }
    if (typeof max === 'string' && ['sm', 'md', 'lg', 'xl'].includes(max)) {
      return `var(--krn-container-${max})`;
    }
    return krnCssLength(max, 'var(--krn-container-md)');
  });
  protected readonly resolvedGutter = computed(() =>
    krnCssLength(this.gutters(), 'var(--krn-space-4)'),
  );
}
