import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  input,
  model,
  output,
} from '@angular/core';
import { DOCUMENT, Location, isPlatformBrowser } from '@angular/common';
import type { KrnNavigationItem, KrnTocItem } from './navigation.types';

@Component({
  selector: 'krn-bottom-navigation',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="bottom-nav" [attr.aria-label]="ariaLabel()">
      @for (item of items(); track item.id) {
        @if (item.href && !item.disabled) {
          <a
            [href]="item.href"
            [attr.aria-current]="value() === item.id ? 'page' : null"
            (click)="select(item)"
          >
            @if (item.icon) {
              <span class="icon" aria-hidden="true">{{ item.icon }}</span>
            }
            <span>{{ item.label }}</span>
            @if (item.badge !== undefined) {
              <span class="badge">{{ item.badge }}</span>
            }
          </a>
        } @else {
          <button
            type="button"
            [disabled]="item.disabled"
            [attr.aria-current]="value() === item.id ? 'page' : null"
            (click)="select(item)"
          >
            @if (item.icon) {
              <span class="icon" aria-hidden="true">{{ item.icon }}</span>
            }
            <span>{{ item.label }}</span>
            @if (item.badge !== undefined) {
              <span class="badge">{{ item.badge }}</span>
            }
          </button>
        }
      }
    </nav>
  `,
  styles: `
    :host{display:block}.bottom-nav{display:grid;grid-template-columns:repeat(var(--krn-bottom-nav-count,4),minmax(0,1fr));padding:var(--krn-space-1);border-block-start:var(--krn-border-width-1) solid var(--krn-color-border);background:var(--krn-color-surface)}.bottom-nav :is(a,button){position:relative;display:grid;justify-items:center;gap:var(--krn-space-1);min-inline-size:0;min-block-size:var(--krn-touch-target-min);padding:var(--krn-space-2);border:0;border-radius:var(--krn-radius-sm);background:transparent;color:var(--krn-color-text-muted);font:inherit;font-size:var(--krn-font-size-xs);line-height:var(--krn-line-height-tight);text-decoration:none;cursor:pointer}.bottom-nav :is(a,button):hover{background:var(--krn-color-surface-subtle);color:var(--krn-color-text)}.bottom-nav [aria-current=page]{color:var(--krn-color-primary);font-weight:var(--krn-font-weight-semibold)}.bottom-nav [aria-current=page]::before{position:absolute;inset-block-start:0;inline-size:var(--krn-space-4);block-size:calc(var(--krn-border-width-1) * 2);background:var(--krn-color-primary);content:""}.bottom-nav :is(a,button):focus-visible{outline:var(--krn-focus-ring-width) solid var(--krn-color-focus);outline-offset:calc(var(--krn-focus-ring-offset) * -1)}.bottom-nav button:disabled{color:var(--krn-color-text-disabled);cursor:not-allowed}.icon{font-size:var(--krn-icon-size-md)}.badge{position:absolute;inset-block-start:var(--krn-space-1);inset-inline-start:calc(50% + var(--krn-space-2));min-inline-size:var(--krn-space-4);padding-inline:var(--krn-space-1);border-radius:var(--krn-radius-full);background:var(--krn-color-danger);color:var(--krn-color-on-danger);font-variant-numeric:tabular-nums}
  `,
  host: {
    '[style.--krn-bottom-nav-count]': 'items().length',
  },
})
export class KrnBottomNavigation {
  readonly items = input<readonly KrnNavigationItem[]>([]);
  readonly value = model<string | null>(null);
  readonly ariaLabel = input('Primary');
  readonly itemSelected = output<KrnNavigationItem>();

  protected select(item: KrnNavigationItem): void {
    if (item.disabled) return;
    this.value.set(item.id);
    this.itemSelected.emit(item);
  }
}

@Component({
  selector: 'krn-table-of-contents',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="toc" [attr.aria-label]="ariaLabel()">
      <p class="title">{{ title() }}</p>
      <ol>
        @for (item of items(); track item.id) {
          <li [style.--toc-level]="item.level ?? 2">
            <a
              [href]="'#' + item.id"
              [attr.aria-current]="activeId() === item.id ? 'location' : null"
              (click)="activeId.set(item.id); itemActivated.emit(item)"
              >{{ item.label }}</a
            >
          </li>
        }
      </ol>
    </nav>
  `,
  styles: `
    :host{display:block}.toc{border-inline-start:var(--krn-border-width-1) solid var(--krn-color-border);padding-inline-start:var(--krn-space-4)}.title{margin:0 0 var(--krn-space-3);color:var(--krn-color-text);font-size:var(--krn-font-size-sm);font-weight:var(--krn-font-weight-semibold)}ol{display:grid;gap:var(--krn-space-1);margin:0;padding:0;list-style:none}li{padding-inline-start:calc((var(--toc-level) - 2) * var(--krn-space-3))}a{position:relative;display:block;padding-block:var(--krn-space-1);color:var(--krn-color-text-muted);font-size:var(--krn-font-size-sm);line-height:var(--krn-line-height-body);text-decoration:none}a::before{position:absolute;inset-block:var(--krn-space-1);inset-inline-start:calc((var(--krn-space-4) + var(--krn-border-width-1)) * -1);inline-size:calc(var(--krn-border-width-1) * 2);background:transparent;content:""}a:hover{color:var(--krn-color-text)}a[aria-current=location]{color:var(--krn-color-text);font-weight:var(--krn-font-weight-medium)}a[aria-current=location]::before{background:var(--krn-color-primary)}a:focus-visible{outline:var(--krn-focus-ring-width) solid var(--krn-color-focus);outline-offset:var(--krn-focus-ring-offset);border-radius:var(--krn-radius-xs)}
  `,
})
export class KrnTableOfContents {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  readonly items = input<readonly KrnTocItem[]>([]);
  readonly activeId = model<string | null>(null);
  readonly observe = input(true);
  readonly title = input('On this page');
  readonly ariaLabel = input('Table of contents');
  readonly itemActivated = output<KrnTocItem>();

  constructor() {
    effect((onCleanup) => {
      const items = this.items();
      if (!this.observe() || !isPlatformBrowser(this.platformId) || typeof IntersectionObserver === 'undefined') return;
      const observer = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
          if (visible?.target.id) this.activeId.set(visible.target.id);
        },
        { rootMargin: '-15% 0px -70%', threshold: [0, 1] },
      );
      items.forEach((item) => {
        const element = this.document.getElementById(item.id);
        if (element) observer.observe(element);
      });
      onCleanup(() => observer.disconnect());
    });
  }
}

@Component({
  selector: 'krn-back-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (href()) {
      <a [href]="href()" (click)="activated.emit()"><span aria-hidden="true">←</span><span>{{ label() }}</span></a>
    } @else {
      <button type="button" (click)="goBack()"><span aria-hidden="true">←</span><span>{{ label() }}</span></button>
    }
  `,
  styles: `
    :host{display:inline-block}:is(a,button){display:inline-flex;align-items:center;gap:var(--krn-space-2);min-block-size:var(--krn-control-height-sm);padding-inline:var(--krn-space-2);border:0;border-radius:var(--krn-radius-sm);background:transparent;color:var(--krn-color-text-muted);font:inherit;font-weight:var(--krn-font-weight-medium);text-decoration:none;cursor:pointer}:is(a,button):hover{background:var(--krn-color-surface-subtle);color:var(--krn-color-text)}:is(a,button):focus-visible{outline:var(--krn-focus-ring-width) solid var(--krn-color-focus);outline-offset:var(--krn-focus-ring-offset)}
  `,
})
export class KrnBackButton {
  private readonly location = inject(Location);
  readonly href = input<string | null>(null);
  readonly label = input('Back');
  readonly activated = output<void>();

  protected goBack(): void {
    this.activated.emit();
    this.location.back();
  }
}

@Component({
  selector: 'krn-skip-link',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<a class="skip-link" [href]="'#' + targetId()">{{ label() }}</a>`,
  styles: `
    .skip-link{position:fixed;z-index:var(--krn-z-toast);inset-block-start:var(--krn-space-3);inset-inline-start:var(--krn-space-3);padding:var(--krn-space-2) var(--krn-space-4);border:var(--krn-border-width-1) solid var(--krn-color-border-strong);border-radius:var(--krn-radius-sm);box-shadow:var(--krn-shadow-md);background:var(--krn-color-surface-inverse);color:var(--krn-color-text-inverse);font-weight:var(--krn-font-weight-semibold);text-decoration:none;transform:translateY(calc(-100% - var(--krn-space-6)));transition:transform var(--krn-motion-duration-fast) var(--krn-motion-ease-enter)}.skip-link:focus{outline:var(--krn-focus-ring-width) solid var(--krn-color-focus);outline-offset:var(--krn-focus-ring-offset);transform:translateY(0)}@media(prefers-reduced-motion:reduce){.skip-link{transition:none}}
  `,
})
export class KrnSkipLink {
  readonly targetId = input('main-content');
  readonly label = input('Skip to main content');
}
