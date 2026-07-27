import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';

import type { KrnLayoutSpace, KrnResponsiveBreakpoint} from './layout.types';
import { krnCssLength } from './layout.types';

@Component({
  selector: 'krn-divider',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="krn-divider" role="separator" [attr.aria-orientation]="orientation()">
      <span class="krn-divider__line" aria-hidden="true"></span>
      @if (label()) {
        <span class="krn-divider__label">{{ label() }}</span>
        <span class="krn-divider__line" aria-hidden="true"></span>
      }
    </div>
  `,
  host: {
    '[style.--krn-divider-inset]': 'resolvedInset()',
    '[attr.data-orientation]': 'orientation()',
  },
  styles: `
    :host {
      display: block;
      min-inline-size: 0;
      padding-inline: var(--krn-divider-inset);
      color: var(--krn-color-text-muted);
    }

    .krn-divider {
      display: flex;
      align-items: center;
      gap: var(--krn-space-3);
      min-inline-size: 0;
    }

    .krn-divider__line {
      flex: 1 1 auto;
      block-size: 1px;
      background: var(--krn-color-border);
    }

    .krn-divider__label {
      flex: 0 1 auto;
      min-inline-size: 0;
      color: var(--krn-color-text-muted);
      font-size: var(--krn-font-size-xs);
      font-weight: var(--krn-font-weight-medium);
      line-height: var(--krn-line-height-tight);
      letter-spacing: var(--krn-letter-spacing-wide);
      text-transform: uppercase;
      overflow-wrap: anywhere;
    }

    :host([data-orientation='vertical']) {
      display: inline-block;
      block-size: 100%;
      min-block-size: var(--krn-space-4);
      padding-inline: 0;
      padding-block: var(--krn-divider-inset);
    }

    :host([data-orientation='vertical']) .krn-divider {
      block-size: 100%;
      flex-direction: column;
    }

    :host([data-orientation='vertical']) .krn-divider__line {
      inline-size: 1px;
      block-size: auto;
    }

    :host([data-orientation='vertical']) .krn-divider__label {
      writing-mode: vertical-rl;
    }

    @media (forced-colors: active) {
      .krn-divider__line {
        background: CanvasText;
      }
    }
  `,
})
export class KrnDivider {
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
  readonly inset = input<KrnLayoutSpace>('0');
  readonly label = input<string | null>(null);

  protected readonly resolvedInset = computed(() => krnCssLength(this.inset(), '0'));
}

@Component({
  selector: 'krn-aspect-ratio',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `<div class="krn-aspect-ratio__content"><ng-content /></div>`,
  host: {
    '[style.--krn-aspect-ratio]': 'resolvedRatio()',
    '[attr.data-fit]': 'fit()',
  },
  styles: `
    krn-aspect-ratio {
      position: relative;
      display: block;
      min-inline-size: 0;
      aspect-ratio: var(--krn-aspect-ratio);
      overflow: clip;
      border-radius: inherit;
      background: var(--krn-color-surface-sunken);
    }

    krn-aspect-ratio > .krn-aspect-ratio__content {
      position: absolute;
      inset: 0;
      min-inline-size: 0;
      min-block-size: 0;
    }

    krn-aspect-ratio > .krn-aspect-ratio__content > :is(img, video, iframe, canvas, svg) {
      inline-size: 100%;
      block-size: 100%;
      object-fit: var(--krn-aspect-fit);
    }

    krn-aspect-ratio[data-fit='cover'] {
      --krn-aspect-fit: cover;
    }
    krn-aspect-ratio[data-fit='contain'] {
      --krn-aspect-fit: contain;
    }
    krn-aspect-ratio[data-fit='fill'] {
      --krn-aspect-fit: fill;
    }
    krn-aspect-ratio[data-fit='none'] {
      --krn-aspect-fit: none;
    }
  `,
})
export class KrnAspectRatio {
  readonly ratio = input<number | string>(16 / 9);
  readonly fit = input<'cover' | 'contain' | 'fill' | 'none'>('cover');

  protected readonly resolvedRatio = computed(() => {
    const ratio = this.ratio();
    if (typeof ratio === 'number') {
      return Number.isFinite(ratio) && ratio > 0 ? `${ratio}` : '16 / 9';
    }
    const normalized = ratio.trim();
    return /^(\d+(?:\.\d+)?)\s*(?:\/|:)\s*(\d+(?:\.\d+)?)$/.test(normalized)
      ? normalized.replace(':', ' / ')
      : '16 / 9';
  });
}

@Component({
  selector: 'krn-scroll-area',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="krn-scroll-area__viewport"
      [attr.tabindex]="keyboardAccessible() ? 0 : null"
      [attr.role]="ariaLabel() ? 'region' : null"
      [attr.aria-label]="ariaLabel() || null"
    >
      <div class="krn-scroll-area__content"><ng-content /></div>
    </div>
  `,
  host: {
    '[style.--krn-scroll-max-block]': 'resolvedMaxBlockSize()',
    '[style.--krn-scroll-max-inline]': 'resolvedMaxInlineSize()',
    '[attr.data-axis]': 'axis()',
    '[attr.data-scrollbar]': 'scrollbar()',
  },
  styles: `
    :host {
      position: relative;
      display: block;
      min-inline-size: 0;
      min-block-size: 0;
      max-inline-size: var(--krn-scroll-max-inline);
      max-block-size: var(--krn-scroll-max-block);
      overflow: clip;
      border-radius: inherit;
      isolation: isolate;
    }

    .krn-scroll-area__viewport {
      box-sizing: border-box;
      max-inline-size: inherit;
      max-block-size: inherit;
      border-radius: inherit;
      overscroll-behavior: contain;
      scrollbar-color: var(--krn-color-border-strong) transparent;
      scrollbar-width: thin;
      background-color: var(--krn-color-surface);
      background:
        linear-gradient(var(--krn-color-surface) 30%, transparent) center top,
        linear-gradient(transparent, var(--krn-color-surface) 70%) center bottom,
        radial-gradient(
            farthest-side at 50% 0,
            color-mix(in oklch, var(--krn-color-text) 16%, transparent),
            transparent
          )
          center top,
        radial-gradient(
            farthest-side at 50% 100%,
            color-mix(in oklch, var(--krn-color-text) 16%, transparent),
            transparent
          )
          center bottom;
      background-repeat: no-repeat;
      background-size:
        100% 2rem,
        100% 2rem,
        100% 0.5rem,
        100% 0.5rem;
      background-attachment: local, local, scroll, scroll;
    }

    .krn-scroll-area__viewport::-webkit-scrollbar {
      inline-size: 0.625rem;
      block-size: 0.625rem;
    }

    .krn-scroll-area__viewport::-webkit-scrollbar-track {
      margin-block: var(--krn-space-1);
      background: transparent;
    }

    .krn-scroll-area__viewport::-webkit-scrollbar-thumb {
      border: 0.1875rem solid transparent;
      border-radius: var(--krn-radius-full);
      background: var(--krn-color-border-strong);
      background-clip: padding-box;
    }

    :host([data-axis='vertical']) .krn-scroll-area__viewport {
      overflow-y: auto;
      overflow-x: clip;
    }

    :host([data-axis='horizontal']) .krn-scroll-area__viewport {
      overflow-x: auto;
      overflow-y: clip;
      background:
        linear-gradient(90deg, var(--krn-color-surface) 30%, transparent) left center,
        linear-gradient(270deg, var(--krn-color-surface) 30%, transparent) right center,
        radial-gradient(
            farthest-side at 0 50%,
            color-mix(in oklch, var(--krn-color-text) 16%, transparent),
            transparent
          )
          left center,
        radial-gradient(
            farthest-side at 100% 50%,
            color-mix(in oklch, var(--krn-color-text) 16%, transparent),
            transparent
          )
          right center;
      background-repeat: no-repeat;
      background-size:
        2rem 100%,
        2rem 100%,
        0.5rem 100%,
        0.5rem 100%;
      background-attachment: local, local, scroll, scroll;
    }

    :host([data-axis='both']) .krn-scroll-area__viewport {
      overflow: auto;
    }

    :host([data-scrollbar='hidden']) .krn-scroll-area__viewport {
      scrollbar-width: none;
    }
    :host([data-scrollbar='hidden']) .krn-scroll-area__viewport::-webkit-scrollbar {
      display: none;
    }

    :host([data-scrollbar='stable']) .krn-scroll-area__viewport {
      scrollbar-gutter: stable both-edges;
    }

    .krn-scroll-area__content {
      min-inline-size: min-content;
    }

    :host([data-axis='vertical']) .krn-scroll-area__content {
      min-inline-size: 0;
    }

    @media (forced-colors: active) {
      .krn-scroll-area__viewport {
        background: Canvas;
      }
    }
  `,
})
export class KrnScrollArea {
  readonly axis = input<'vertical' | 'horizontal' | 'both'>('vertical');
  readonly maxBlockSize = input<KrnLayoutSpace>('100%');
  readonly maxInlineSize = input<KrnLayoutSpace>('100%');
  readonly keyboardAccessible = input(true, { transform: booleanAttribute });
  readonly ariaLabel = input<string | null>('Scrollable content');
  readonly scrollbar = input<'auto' | 'stable' | 'hidden'>('auto');

  protected readonly resolvedMaxBlockSize = computed(() =>
    krnCssLength(this.maxBlockSize(), '100%'),
  );
  protected readonly resolvedMaxInlineSize = computed(() =>
    krnCssLength(this.maxInlineSize(), '100%'),
  );
}

type KrnResponsiveDisplay = 'block' | 'inline' | 'contents' | 'flex' | 'grid';

@Component({
  selector: 'krn-show, krn-responsive-show-hide',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  host: {
    '[style.--krn-responsive-display]': 'display()',
    '[attr.data-from]': 'from()',
    '[attr.data-until]': 'until()',
  },
  styles: `
    :host {
      display: var(--krn-responsive-display);
    }

    @media (width < 36rem) {
      :host([data-from='sm']),
      :host([data-from='md']),
      :host([data-from='lg']),
      :host([data-from='xl']) {
        display: none;
      }
    }
    @media (36rem <= width < 48rem) {
      :host([data-from='md']),
      :host([data-from='lg']),
      :host([data-from='xl']) {
        display: none;
      }
    }
    @media (48rem <= width < 64rem) {
      :host([data-from='lg']),
      :host([data-from='xl']) {
        display: none;
      }
    }
    @media (64rem <= width < 80rem) {
      :host([data-from='xl']) {
        display: none;
      }
    }

    @media (width >= 36rem) {
      :host([data-until='sm']) {
        display: none;
      }
    }
    @media (width >= 48rem) {
      :host([data-until='md']) {
        display: none;
      }
    }
    @media (width >= 64rem) {
      :host([data-until='lg']) {
        display: none;
      }
    }
    @media (width >= 80rem) {
      :host([data-until='xl']) {
        display: none;
      }
    }
  `,
})
export class KrnShow {
  readonly from = input<KrnResponsiveBreakpoint>('none');
  readonly until = input<KrnResponsiveBreakpoint>('none');
  readonly display = input<KrnResponsiveDisplay>('block');
}

@Component({
  selector: 'krn-hide',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  host: {
    '[style.--krn-responsive-display]': 'display()',
    '[attr.data-from]': 'from()',
    '[attr.data-until]': 'until()',
  },
  styles: `
    :host {
      display: var(--krn-responsive-display);
    }

    @media (width >= 36rem) {
      :host([data-from='sm']) {
        display: none;
      }
    }
    @media (width >= 48rem) {
      :host([data-from='md']) {
        display: none;
      }
    }
    @media (width >= 64rem) {
      :host([data-from='lg']) {
        display: none;
      }
    }
    @media (width >= 80rem) {
      :host([data-from='xl']) {
        display: none;
      }
    }

    @media (width < 36rem) {
      :host([data-until='sm']) {
        display: none;
      }
    }
    @media (width < 48rem) {
      :host([data-until='md']) {
        display: none;
      }
    }
    @media (width < 64rem) {
      :host([data-until='lg']) {
        display: none;
      }
    }
    @media (width < 80rem) {
      :host([data-until='xl']) {
        display: none;
      }
    }
  `,
})
export class KrnHide {
  readonly from = input<KrnResponsiveBreakpoint>('none');
  readonly until = input<KrnResponsiveBreakpoint>('none');
  readonly display = input<KrnResponsiveDisplay>('block');
}

export { KrnShow as KrnResponsiveShowHide };
