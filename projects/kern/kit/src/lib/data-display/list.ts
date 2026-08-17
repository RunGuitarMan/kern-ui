import { ChangeDetectionStrategy, Component, booleanAttribute, inject, input } from '@angular/core';
import { KRN_TRANSLATIONS } from '@kern-ui/angular/core';
import { krnInputFallback } from '../reactive-input';

@Component({
  selector: 'krn-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.role]': 'role()',
    '[attr.aria-label]': 'resolvedAriaLabel()',
  },
  templateUrl: './list.html',
  styleUrl: './list.css',
})
export class KrnList {
  private readonly translations = inject(KRN_TRANSLATIONS);
  readonly role = input<'list' | 'listbox'>('list');
  readonly ariaLabel = input<string | undefined>();
  protected readonly resolvedAriaLabel = krnInputFallback(
    this.ariaLabel,
    () => this.translations.dataDisplay.list,
  );
}

@Component({
  selector: 'krn-list-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'listitem',
    '[attr.data-selected]': 'selected() ? "" : null',
  },
  templateUrl: './list-item.html',
  styleUrl: './list-item.css',
})
export class KrnListItem {
  readonly heading = input('');
  readonly selected = input(false, { transform: booleanAttribute });
}
