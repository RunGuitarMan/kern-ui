import { ChangeDetectionStrategy, Component, computed, effect, input, model, output } from '@angular/core';

type PageToken = number | 'ellipsis';

@Component({
  selector: 'krn-pagination',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="pagination" [attr.aria-label]="ariaLabel()">
      <button type="button" class="direction" [disabled]="currentPage() <= 1" (click)="goTo(currentPage() - 1)">
        <span aria-hidden="true">←</span><span class="direction-label">{{ previousLabel() }}</span>
      </button>
      <ol>
        @for (token of pageTokens(); track $index) {
          <li>
            @if (token === 'ellipsis') {
              <span class="ellipsis" aria-hidden="true">…</span>
            } @else {
              <button
                type="button"
                [attr.aria-label]="'Page ' + token"
                [attr.aria-current]="currentPage() === token ? 'page' : null"
                (click)="goTo(token)"
              >
                {{ token }}
              </button>
            }
          </li>
        }
      </ol>
      <button type="button" class="direction" [disabled]="currentPage() >= pageCount()" (click)="goTo(currentPage() + 1)">
        <span class="direction-label">{{ nextLabel() }}</span><span aria-hidden="true">→</span>
      </button>
      <p class="summary" aria-live="polite">{{ summary() }}</p>
    </nav>
  `,
  styles: `
    :host{display:block}.pagination{display:flex;align-items:center;gap:var(--krn-space-2);min-inline-size:0}ol{display:flex;align-items:center;gap:var(--krn-space-1);margin:0;padding:0;list-style:none}button,.ellipsis{display:inline-grid;min-inline-size:var(--krn-control-height-sm);min-block-size:var(--krn-control-height-sm);padding-inline:var(--krn-space-2);border:var(--krn-border-width-1) solid transparent;border-radius:var(--krn-radius-sm);place-items:center;background:transparent;color:var(--krn-color-text-muted);font:inherit;font-variant-numeric:tabular-nums}button{cursor:pointer}button:hover:not(:disabled){border-color:var(--krn-color-border);background:var(--krn-color-surface-subtle);color:var(--krn-color-text)}button[aria-current=page]{border-color:var(--krn-color-primary);background:var(--krn-color-surface);color:var(--krn-color-text);font-weight:var(--krn-font-weight-semibold)}button:focus-visible{outline:var(--krn-focus-ring-width) solid var(--krn-color-focus);outline-offset:var(--krn-focus-ring-offset)}button:disabled{color:var(--krn-color-text-disabled);cursor:not-allowed}.direction{display:inline-flex;gap:var(--krn-space-2)}.summary{position:absolute;inline-size:1px;block-size:1px;margin:-1px;padding:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap}@media(max-width:35rem){ol li:not(:first-child):not(:last-child){display:none}.direction-label{position:absolute;inline-size:1px;block-size:1px;overflow:hidden;clip-path:inset(50%)}}
  `,
})
export class KrnPagination {
  readonly totalItems = input(0);
  readonly pageSize = input(20);
  readonly siblingCount = input(1);
  readonly page = model(1);
  readonly ariaLabel = input('Pagination');
  readonly previousLabel = input('Previous');
  readonly nextLabel = input('Next');
  readonly pageChanged = output<number>();
  protected readonly safePageSize = computed(() => Math.max(1, this.pageSize()));
  readonly pageCount = computed(() => Math.max(1, Math.ceil(this.totalItems() / this.safePageSize())));
  readonly currentPage = computed(() => Math.min(Math.max(1, this.page()), this.pageCount()));
  protected readonly summary = computed(() => {
    const total = this.totalItems();
    if (total === 0) return 'No results';
    const start = (this.currentPage() - 1) * this.safePageSize() + 1;
    const end = Math.min(total, this.currentPage() * this.safePageSize());
    return `Showing ${start} to ${end} of ${total}`;
  });
  protected readonly pageTokens = computed<readonly PageToken[]>(() => {
    const total = this.pageCount();
    const current = this.currentPage();
    const sibling = Math.max(0, this.siblingCount());
    const included = new Set([1, total]);
    for (let value = current - sibling; value <= current + sibling; value += 1) {
      if (value > 1 && value < total) included.add(value);
    }
    const values = [...included].sort((a, b) => a - b);
    const result: PageToken[] = [];
    values.forEach((value, index) => {
      if (index > 0 && value - values[index - 1] > 1) result.push('ellipsis');
      result.push(value);
    });
    return result;
  });

  constructor() {
    effect(() => {
      const clamped = this.currentPage();
      if (clamped !== this.page()) this.page.set(clamped);
    });
  }

  protected goTo(value: number): void {
    const next = Math.min(Math.max(1, value), this.pageCount());
    if (next === this.currentPage()) return;
    this.page.set(next);
    this.pageChanged.emit(next);
  }
}
