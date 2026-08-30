import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

import type {
  KrnLayoutAlignment,
  KrnLayoutAxis,
  KrnLayoutJustification,
  KrnLayoutSpace,
} from './layout.types';
import { krnCssLength } from './layout.types';

@Component({
  selector: 'krn-stack',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './stack.html',
  host: {
    '[style.--krn-stack-gap]': 'resolvedGap()',
    '[attr.data-align]': 'align()',
    '[attr.data-justify]': 'justify()',
  },
  styleUrl: './stack.css',
})
export class KrnStack {
  /** Logical spacing between adjacent projected children. */
  readonly gap = input<KrnLayoutSpace>('4');
  /** Cross-axis alignment of projected children. */
  readonly align = input<KrnLayoutAlignment>('stretch');
  /** Distribution of projected children along the block axis. */
  readonly justify = input<KrnLayoutJustification>('start');

  protected readonly resolvedGap = computed(() => krnCssLength(this.gap(), 'var(--krn-space-4)'));
}

@Component({
  selector: 'krn-inline',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './inline.html',
  host: {
    '[style.--krn-inline-gap]': 'resolvedGap()',
    '[attr.data-align]': 'align()',
    '[attr.data-justify]': 'justify()',
    '[attr.data-wrap]': 'wrap() ? "" : null',
  },
  styleUrl: './inline.css',
})
export class KrnInline {
  /** Logical spacing between adjacent projected children and wrapped flex lines. */
  readonly gap = input<KrnLayoutSpace>('3');
  /** Cross-axis alignment of projected children within each flex line. */
  readonly align = input<KrnLayoutAlignment>('center');
  /** Distribution of projected children along the inline axis. */
  readonly justify = input<KrnLayoutJustification>('start');
  /** Allows projected children to continue on additional flex lines. */
  readonly wrap = input(false, { transform: booleanAttribute });

  protected readonly resolvedGap = computed(() => krnCssLength(this.gap(), 'var(--krn-space-3)'));
}

@Component({
  selector: 'krn-cluster',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cluster.html',
  host: {
    '[style.--krn-cluster-row-gap]': 'resolvedRowGap()',
    '[style.--krn-cluster-column-gap]': 'resolvedColumnGap()',
    '[attr.data-align]': 'align()',
    '[attr.data-justify]': 'justify()',
  },
  styleUrl: './cluster.css',
})
export class KrnCluster {
  /** Default logical spacing between projected children and wrapped flex lines. */
  readonly gap = input<KrnLayoutSpace>('2');
  /** Optional spacing override between wrapped flex lines. */
  readonly rowGap = input<KrnLayoutSpace | null>(null);
  /** Optional spacing override between adjacent children within each flex line. */
  readonly columnGap = input<KrnLayoutSpace | null>(null);
  /** Cross-axis alignment of projected children within each flex line. */
  readonly align = input<KrnLayoutAlignment>('center');
  /** Distribution of projected children along the inline axis. */
  readonly justify = input<KrnLayoutJustification>('start');

  protected readonly resolvedGap = computed(() => krnCssLength(this.gap(), 'var(--krn-space-2)'));
  protected readonly resolvedRowGap = computed(() =>
    krnCssLength(this.rowGap(), this.resolvedGap()),
  );
  protected readonly resolvedColumnGap = computed(() =>
    krnCssLength(this.columnGap(), this.resolvedGap()),
  );
}

@Component({
  selector: 'krn-spacer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './spacer.html',
  host: {
    'aria-hidden': 'true',
    '[style.--krn-spacer-size]': 'resolvedSize()',
    '[attr.data-axis]': 'axis()',
  },
  styleUrl: './spacer.css',
})
export class KrnSpacer {
  /** Fixed logical length reserved by the spacer. */
  readonly size = input<KrnLayoutSpace>('4');
  /** Axis receiving space: horizontal maps to inline and vertical maps to block. */
  readonly axis = input<KrnLayoutAxis>('vertical');

  protected readonly resolvedSize = computed(() => krnCssLength(this.size(), 'var(--krn-space-4)'));
}
