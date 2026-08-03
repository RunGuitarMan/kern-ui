import { booleanAttribute, ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import type { KrnOrientation } from './action-types';
import { KRN_BUTTON_GROUP_OPTIONS } from './button-group-options';

@Component({
  selector: 'div[krnButtonGroup]',
  host: {
    class: 'krn-action-group krn-button-group',
    role: 'group',
    '[attr.data-connected]': 'connected() ? "true" : null',
    '[attr.data-orientation]': 'orientation()',
  },
  template: `<ng-content />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnButtonGroup {
  private readonly options = inject(KRN_BUTTON_GROUP_OPTIONS);

  /** Changes the visual layout axis without altering native document-order keyboard behavior. */
  readonly orientation = input<KrnOrientation>(this.options.orientation);
  /** Joins adjacent action borders and radii without coordinating child state or activation. */
  readonly connected = input(this.options.connected, { transform: booleanAttribute });
}
