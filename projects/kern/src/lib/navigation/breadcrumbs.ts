import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import type { KrnBreadcrumbItem } from './navigation.types';

interface VisibleBreadcrumb extends KrnBreadcrumbItem {
  readonly ellipsis?: true;
}

@Component({
  selector: 'krn-breadcrumbs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="breadcrumbs" [attr.aria-label]="ariaLabel()">
      <ol>
        @for (item of visibleItems(); track $index; let last = $last) {
          <li>
            @if (item.ellipsis) {
              <button type="button" class="ellipsis" (click)="expanded.set(true)" aria-label="Show all breadcrumb items">
                <span aria-hidden="true">•••</span>
              </button>
            } @else if (item.current || last) {
              <span class="current" aria-current="page">{{ item.label }}</span>
            } @else if (item.href && !item.disabled) {
              <a [href]="item.href" (click)="itemActivated.emit(item)">{{ item.label }}</a>
            } @else {
              <span [attr.aria-disabled]="item.disabled || null">{{ item.label }}</span>
            }
            @if (!last) {
              <span class="separator" aria-hidden="true">{{ separator() }}</span>
            }
          </li>
        }
      </ol>
    </nav>
  `,
  styles: `
    :host{display:block;min-inline-size:0}.breadcrumbs{color:var(--krn-color-text-muted);font-size:var(--krn-font-size-sm);line-height:var(--krn-line-height-body)}ol{display:flex;align-items:center;gap:var(--krn-space-1);min-inline-size:0;margin:0;padding:0;list-style:none;overflow-x:auto;scrollbar-width:thin}li{display:flex;align-items:center;min-inline-size:0;white-space:nowrap}a,button{color:inherit;font:inherit}a{text-decoration-thickness:var(--krn-border-width-1);text-underline-offset:var(--krn-space-1)}a:hover{color:var(--krn-color-text)}a:focus-visible,button:focus-visible{outline:var(--krn-focus-ring-width) solid var(--krn-color-focus);outline-offset:var(--krn-focus-ring-offset);border-radius:var(--krn-radius-xs)}.current{max-inline-size:24ch;overflow:hidden;color:var(--krn-color-text);font-weight:var(--krn-font-weight-semibold);text-overflow:ellipsis}.separator{margin-inline:var(--krn-space-1);color:var(--krn-color-text-subtle)}.ellipsis{display:grid;min-inline-size:var(--krn-control-height-sm);min-block-size:var(--krn-control-height-sm);padding:0;border:0;border-radius:var(--krn-radius-sm);background:transparent;place-items:center;cursor:pointer}.ellipsis:hover{background:var(--krn-color-surface-subtle);color:var(--krn-color-text)}
  `,
})
export class KrnBreadcrumbs {
  protected readonly ellipsis: VisibleBreadcrumb = { label: 'More', ellipsis: true };
  readonly items = input<readonly KrnBreadcrumbItem[]>([]);
  readonly maxItems = input(5);
  readonly separator = input('/');
  readonly ariaLabel = input('Breadcrumb');
  readonly itemActivated = output<KrnBreadcrumbItem>();
  protected readonly expanded = signal(false);
  protected readonly visibleItems = computed<readonly VisibleBreadcrumb[]>(() => {
    const items = this.items();
    if (this.expanded() || this.maxItems() < 3 || items.length <= this.maxItems()) {
      return items;
    }
    const tailCount = Math.max(1, this.maxItems() - 2);
    return [items[0], this.ellipsis, ...items.slice(-tailCount)];
  });
}
