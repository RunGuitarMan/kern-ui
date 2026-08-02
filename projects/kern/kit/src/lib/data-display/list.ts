import { ChangeDetectionStrategy, Component, booleanAttribute, inject, input } from '@angular/core';
import { KRN_TRANSLATIONS } from '@kern-ui/angular/core';

@Component({
  selector: 'krn-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.role]': 'role()',
    '[attr.aria-label]': 'ariaLabel()',
  },
  template: `<ng-content />`,
  styles: `
    :host {
      display: grid;
      overflow: clip;
      border: 1px solid var(--krn-color-border-subtle, #e0e3e7);
      border-radius: var(--krn-radius-surface, 0.75rem);
      background: var(--krn-color-surface, #fff);
    }
  `,
})
export class KrnList {
  private readonly translations = inject(KRN_TRANSLATIONS);
  readonly role = input<'list' | 'listbox'>('list');
  readonly ariaLabel = input(this.translations.dataDisplay.list);
}

@Component({
  selector: 'krn-list-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'listitem',
    '[attr.data-selected]': 'selected() ? "" : null',
  },
  template: `
    <ng-content select="[krnListLeading]" />
    <span class="content">
      @if (heading()) {
        <strong>{{ heading() }}</strong>
      }
      <ng-content />
    </span>
    <ng-content select="[krnListTrailing]" />
  `,
  styles: `
    :host {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      align-items: center;
      gap: var(--krn-space-3, 0.75rem);
      min-block-size: var(--krn-data-row-size, 2.75rem);
      padding: var(--krn-space-3, 0.75rem) var(--krn-space-4, 1rem);
      color: var(--krn-color-text, #252932);
    }
    :host + :host {
      border-block-start: 1px solid var(--krn-color-border-subtle, #e0e3e7);
    }
    :host([data-selected]) {
      box-shadow: inset 3px 0 0 var(--krn-color-brand-solid, #4f6feb);
      background: var(--krn-color-brand-surface, #fff0e8);
    }
    .content {
      display: grid;
      min-inline-size: 0;
      gap: 0.125rem;
      overflow-wrap: anywhere;
    }
  `,
})
export class KrnListItem {
  readonly heading = input('');
  readonly selected = input(false, { transform: booleanAttribute });
}
