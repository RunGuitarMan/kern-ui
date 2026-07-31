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
  template: `<ng-content />`,
  host: {
    '[style.--krn-container-max]': 'resolvedMaxWidth()',
    '[style.--krn-container-gutter]': 'resolvedGutter()',
    '[attr.data-size]': 'size()',
    '[attr.data-align]': 'align()',
  },
  styles: `
    :host {
      display: block;
      box-sizing: border-box;
      inline-size: 100%;
      max-inline-size: var(--krn-container-max);
      min-inline-size: 0;
      padding-inline: var(--krn-container-gutter);
    }

    :host([hidden]) {
      display: none;
    }

    :host([data-align='center']) {
      margin-inline: auto;
    }

    :host([data-align='start']) {
      margin-inline-end: auto;
    }

    :host([data-align='end']) {
      margin-inline-start: auto;
    }
  `,
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
  template: `<div class="krn-center__inner"><ng-content /></div>`,
  host: {
    '[style.--krn-center-max]': 'resolvedMaxWidth()',
    '[style.--krn-center-gutter]': 'resolvedGutter()',
    '[attr.data-intrinsic]': 'intrinsic() ? "" : null',
  },
  styles: `
    :host {
      display: block;
      box-sizing: border-box;
      inline-size: 100%;
      max-inline-size: var(--krn-center-max);
      min-inline-size: 0;
      margin-inline: auto;
      padding-inline: var(--krn-center-gutter);
    }

    :host([hidden]) {
      display: none;
    }

    .krn-center__inner {
      inline-size: 100%;
      min-inline-size: 0;
    }

    :host([data-intrinsic]) .krn-center__inner {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
  `,
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
