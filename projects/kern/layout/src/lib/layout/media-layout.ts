import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';

import { KRN_TRANSLATIONS } from '@kern-ui/angular/core';
import type { KrnLayoutSpace, KrnResponsiveBreakpoint } from './layout.types';
import { krnCssLength } from './layout.types';

@Component({
  selector: 'krn-divider',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './divider.html',
  host: {
    '[style.--krn-divider-inset]': 'resolvedInset()',
    '[attr.data-orientation]': 'resolvedOrientation()',
  },
  styleUrl: './divider.css',
})
export class KrnDivider {
  /** Sets the separator and visual line orientation. Invalid runtime values fall back to horizontal. */
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');

  /** Insets both ends of the divider along its length using a spacing token, pixels, or CSS length. */
  readonly inset = input<KrnLayoutSpace>('0');

  /** Adds a visible label and uses its trimmed text as the separator's accessible name. */
  readonly label = input<string | null>(null);

  protected readonly resolvedOrientation = computed<'horizontal' | 'vertical'>(() =>
    this.orientation() === 'vertical' ? 'vertical' : 'horizontal',
  );
  protected readonly resolvedLabel = computed(() => this.label()?.trim() || null);
  protected readonly resolvedInset = computed(() => krnCssLength(this.inset(), '0'));
}

@Component({
  selector: 'krn-aspect-ratio',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  templateUrl: './aspect-ratio.html',
  host: {
    '[style.--krn-aspect-ratio]': 'resolvedRatio()',
    '[attr.data-fit]': 'resolvedFit()',
  },
  styleUrl: './aspect-ratio.css',
})
export class KrnAspectRatio {
  /** Sets a positive width-to-height ratio as a number, `16 / 9`, or `16:9`. */
  readonly ratio = input<number | string>(16 / 9);

  /** Controls how direct projected media fills the ratio box. Invalid runtime values use cover. */
  readonly fit = input<'cover' | 'contain' | 'fill' | 'none'>('cover');

  protected readonly resolvedFit = computed<'cover' | 'contain' | 'fill' | 'none'>(() => {
    const fit = this.fit();
    return fit === 'contain' || fit === 'fill' || fit === 'none' ? fit : 'cover';
  });
  protected readonly resolvedRatio = computed(() => {
    const ratio = this.ratio();
    if (typeof ratio === 'number') {
      return Number.isFinite(ratio) && ratio > 0 ? `${ratio}` : '16 / 9';
    }
    const normalized = ratio.trim();
    const match = /^(\d+(?:\.\d+)?)\s*(?:\/|:)\s*(\d+(?:\.\d+)?)$/.exec(normalized);
    if (!match) return '16 / 9';

    const inline = Number(match[1]);
    const block = Number(match[2]);
    return Number.isFinite(inline) && inline > 0 && Number.isFinite(block) && block > 0
      ? `${inline} / ${block}`
      : '16 / 9';
  });
}

@Component({
  selector: 'krn-scroll-area',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './scroll-area.html',
  host: {
    '[style.--krn-scroll-max-block]': 'resolvedMaxBlockSize()',
    '[style.--krn-scroll-max-inline]': 'resolvedMaxInlineSize()',
    '[attr.data-axis]': 'resolvedAxis()',
    '[attr.data-scrollbar]': 'resolvedScrollbar()',
  },
  styleUrl: './scroll-area.css',
})
export class KrnScrollArea {
  private readonly translations = inject(KRN_TRANSLATIONS);

  /** Selects the scrollable axis. Invalid runtime values fall back to vertical. */
  readonly axis = input<'vertical' | 'horizontal' | 'both'>('vertical');
  readonly maxBlockSize = input<KrnLayoutSpace>('100%');
  readonly maxInlineSize = input<KrnLayoutSpace>('100%');

  /** Keeps the native viewport keyboard-scrollable when enabled. */
  readonly keyboardAccessible = input(true, { transform: booleanAttribute });

  /** Names the scrollable region. Blank values omit the region role and accessible name. */
  readonly ariaLabel = input<string | null | undefined>();

  /** Controls native scrollbar visibility and gutter allocation. */
  readonly scrollbar = input<'auto' | 'stable' | 'hidden'>('auto');

  protected readonly resolvedAxis = computed<'vertical' | 'horizontal' | 'both'>(() => {
    const axis = this.axis();
    return axis === 'horizontal' || axis === 'both' ? axis : 'vertical';
  });
  protected readonly resolvedScrollbar = computed<'auto' | 'stable' | 'hidden'>(() => {
    const scrollbar = this.scrollbar();
    return scrollbar === 'stable' || scrollbar === 'hidden' ? scrollbar : 'auto';
  });
  protected readonly resolvedAriaLabel = computed(() => {
    const inputLabel = this.ariaLabel();
    const label =
      inputLabel === undefined ? this.translations.layout.scrollableContent : inputLabel;
    return label?.trim() || null;
  });
  protected readonly resolvedMaxBlockSize = computed(() =>
    krnCssLength(this.maxBlockSize(), '100%'),
  );
  protected readonly resolvedMaxInlineSize = computed(() =>
    krnCssLength(this.maxInlineSize(), '100%'),
  );
}

export type KrnResponsiveDisplay = 'block' | 'inline' | 'contents' | 'flex' | 'grid';

@Component({
  selector: 'krn-show, krn-responsive-show-hide',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './show.html',
  host: {
    '[style.--krn-responsive-display]': 'resolvedDisplay()',
    '[attr.data-from]': 'resolvedFrom()',
    '[attr.data-until]': 'resolvedUntil()',
  },
  styleUrl: './show.css',
})
export class KrnShow {
  /** Shows content at this viewport width and above. */
  readonly from = input<KrnResponsiveBreakpoint>('none');

  /** Shows content below this viewport width. */
  readonly until = input<KrnResponsiveBreakpoint>('none');

  /** Restores this display mode while the component is visible. */
  readonly display = input<KrnResponsiveDisplay>('block');

  protected readonly resolvedFrom = computed<KrnResponsiveBreakpoint>(() => {
    const from = this.from();
    return from === 'sm' || from === 'md' || from === 'lg' || from === 'xl' ? from : 'none';
  });
  protected readonly resolvedUntil = computed<KrnResponsiveBreakpoint>(() => {
    const until = this.until();
    return until === 'sm' || until === 'md' || until === 'lg' || until === 'xl' ? until : 'none';
  });
  protected readonly resolvedDisplay = computed<KrnResponsiveDisplay>(() => {
    const display = this.display();
    return display === 'inline' ||
      display === 'contents' ||
      display === 'flex' ||
      display === 'grid'
      ? display
      : 'block';
  });
}

@Component({
  selector: 'krn-hide',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hide.html',
  host: {
    '[style.--krn-responsive-display]': 'resolvedDisplay()',
    '[attr.data-from]': 'resolvedFrom()',
    '[attr.data-until]': 'resolvedUntil()',
  },
  styleUrl: './hide.css',
})
export class KrnHide {
  /** Hides content at this viewport width and above. */
  readonly from = input<KrnResponsiveBreakpoint>('none');

  /** Hides content below this viewport width. */
  readonly until = input<KrnResponsiveBreakpoint>('none');

  /** Restores this display mode while the component is visible. */
  readonly display = input<KrnResponsiveDisplay>('block');

  protected readonly resolvedFrom = computed<KrnResponsiveBreakpoint>(() => {
    const from = this.from();
    return from === 'sm' || from === 'md' || from === 'lg' || from === 'xl' ? from : 'none';
  });
  protected readonly resolvedUntil = computed<KrnResponsiveBreakpoint>(() => {
    const until = this.until();
    return until === 'sm' || until === 'md' || until === 'lg' || until === 'xl' ? until : 'none';
  });
  protected readonly resolvedDisplay = computed<KrnResponsiveDisplay>(() => {
    const display = this.display();
    return display === 'inline' ||
      display === 'contents' ||
      display === 'flex' ||
      display === 'grid'
      ? display
      : 'block';
  });
}

export { KrnShow as KrnResponsiveShowHide };
