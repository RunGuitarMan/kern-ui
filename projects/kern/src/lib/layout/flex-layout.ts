import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

import type {
  KrnLayoutAlignment,
  KrnLayoutJustification,
  KrnLayoutSpace} from './layout.types';
import {
  krnCssLength,
} from './layout.types';

@Component({
  selector: 'krn-stack',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  host: {
    '[style.--krn-stack-gap]': 'resolvedGap()',
    '[attr.data-align]': 'align()',
    '[attr.data-justify]': 'justify()',
  },
  styles: `
    :host {
      display: flex;
      min-inline-size: 0;
      flex-direction: column;
      gap: var(--krn-stack-gap);
      align-items: var(--krn-stack-align, stretch);
      justify-content: var(--krn-stack-justify, flex-start);
    }

    :host([data-align='start']) {
      --krn-stack-align: flex-start;
    }
    :host([data-align='center']) {
      --krn-stack-align: center;
    }
    :host([data-align='end']) {
      --krn-stack-align: flex-end;
    }
    :host([data-align='baseline']) {
      --krn-stack-align: baseline;
    }
    :host([data-align='stretch']) {
      --krn-stack-align: stretch;
    }
    :host([data-justify='start']) {
      --krn-stack-justify: flex-start;
    }
    :host([data-justify='center']) {
      --krn-stack-justify: center;
    }
    :host([data-justify='end']) {
      --krn-stack-justify: flex-end;
    }
    :host([data-justify='space-between']) {
      --krn-stack-justify: space-between;
    }
    :host([data-justify='space-around']) {
      --krn-stack-justify: space-around;
    }
    :host([data-justify='space-evenly']) {
      --krn-stack-justify: space-evenly;
    }
  `,
})
export class KrnStack {
  readonly gap = input<KrnLayoutSpace>('4');
  readonly align = input<KrnLayoutAlignment>('stretch');
  readonly justify = input<KrnLayoutJustification>('start');

  protected readonly resolvedGap = computed(() => krnCssLength(this.gap(), 'var(--krn-space-4)'));
}

@Component({
  selector: 'krn-inline',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  host: {
    '[style.--krn-inline-gap]': 'resolvedGap()',
    '[attr.data-align]': 'align()',
    '[attr.data-justify]': 'justify()',
    '[attr.data-wrap]': 'wrap() ? "" : null',
  },
  styles: `
    :host {
      display: flex;
      min-inline-size: 0;
      flex-direction: row;
      flex-wrap: nowrap;
      gap: var(--krn-inline-gap);
      align-items: var(--krn-inline-align, center);
      justify-content: var(--krn-inline-justify, flex-start);
    }

    :host([data-wrap]) {
      flex-wrap: wrap;
    }
    :host([data-align='start']) {
      --krn-inline-align: flex-start;
    }
    :host([data-align='center']) {
      --krn-inline-align: center;
    }
    :host([data-align='end']) {
      --krn-inline-align: flex-end;
    }
    :host([data-align='stretch']) {
      --krn-inline-align: stretch;
    }
    :host([data-align='baseline']) {
      --krn-inline-align: baseline;
    }
    :host([data-justify='start']) {
      --krn-inline-justify: flex-start;
    }
    :host([data-justify='center']) {
      --krn-inline-justify: center;
    }
    :host([data-justify='end']) {
      --krn-inline-justify: flex-end;
    }
    :host([data-justify='space-between']) {
      --krn-inline-justify: space-between;
    }
    :host([data-justify='space-around']) {
      --krn-inline-justify: space-around;
    }
    :host([data-justify='space-evenly']) {
      --krn-inline-justify: space-evenly;
    }
  `,
})
export class KrnInline {
  readonly gap = input<KrnLayoutSpace>('3');
  readonly align = input<KrnLayoutAlignment>('center');
  readonly justify = input<KrnLayoutJustification>('start');
  readonly wrap = input(false, { transform: booleanAttribute });

  protected readonly resolvedGap = computed(() => krnCssLength(this.gap(), 'var(--krn-space-3)'));
}

@Component({
  selector: 'krn-cluster',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  host: {
    '[style.--krn-cluster-row-gap]': 'resolvedRowGap()',
    '[style.--krn-cluster-column-gap]': 'resolvedColumnGap()',
    '[attr.data-align]': 'align()',
    '[attr.data-justify]': 'justify()',
  },
  styles: `
    :host {
      display: flex;
      min-inline-size: 0;
      flex-wrap: wrap;
      row-gap: var(--krn-cluster-row-gap);
      column-gap: var(--krn-cluster-column-gap);
      align-items: var(--krn-cluster-align, center);
      justify-content: var(--krn-cluster-justify, flex-start);
    }

    :host([data-align='start']) {
      --krn-cluster-align: flex-start;
    }
    :host([data-align='center']) {
      --krn-cluster-align: center;
    }
    :host([data-align='end']) {
      --krn-cluster-align: flex-end;
    }
    :host([data-align='stretch']) {
      --krn-cluster-align: stretch;
    }
    :host([data-align='baseline']) {
      --krn-cluster-align: baseline;
    }
    :host([data-justify='start']) {
      --krn-cluster-justify: flex-start;
    }
    :host([data-justify='center']) {
      --krn-cluster-justify: center;
    }
    :host([data-justify='end']) {
      --krn-cluster-justify: flex-end;
    }
    :host([data-justify='space-between']) {
      --krn-cluster-justify: space-between;
    }
    :host([data-justify='space-around']) {
      --krn-cluster-justify: space-around;
    }
    :host([data-justify='space-evenly']) {
      --krn-cluster-justify: space-evenly;
    }
  `,
})
export class KrnCluster {
  readonly gap = input<KrnLayoutSpace>('2');
  readonly rowGap = input<KrnLayoutSpace | null>(null);
  readonly columnGap = input<KrnLayoutSpace | null>(null);
  readonly align = input<KrnLayoutAlignment>('center');
  readonly justify = input<KrnLayoutJustification>('start');

  protected readonly resolvedRowGap = computed(() =>
    krnCssLength(this.rowGap() ?? this.gap(), 'var(--krn-space-2)'),
  );
  protected readonly resolvedColumnGap = computed(() =>
    krnCssLength(this.columnGap() ?? this.gap(), 'var(--krn-space-2)'),
  );
}

@Component({
  selector: 'krn-spacer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ``,
  host: {
    'aria-hidden': 'true',
    '[style.--krn-spacer-size]': 'resolvedSize()',
    '[attr.data-axis]': 'axis()',
  },
  styles: `
    :host {
      display: block;
      flex: 0 0 auto;
      pointer-events: none;
    }

    :host([data-axis='horizontal']) {
      inline-size: var(--krn-spacer-size);
      block-size: 1px;
    }

    :host([data-axis='vertical']) {
      inline-size: 1px;
      block-size: var(--krn-spacer-size);
    }
  `,
})
export class KrnSpacer {
  readonly size = input<KrnLayoutSpace>('4');
  readonly axis = input<'horizontal' | 'vertical'>('vertical');

  protected readonly resolvedSize = computed(() => krnCssLength(this.size(), 'var(--krn-space-4)'));
}
