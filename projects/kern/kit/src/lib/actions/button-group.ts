import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  input,
  Renderer2,
} from '@angular/core';
import type { KrnOrientation } from './action-types';
import { KRN_BUTTON_GROUP_OPTIONS } from './button-group-options';

@Component({
  selector: 'div[krnButtonGroup], krn-button-group',
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
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly options = inject(KRN_BUTTON_GROUP_OPTIONS);
  private readonly renderer = inject(Renderer2);
  private legacyAriaLabelOwned = false;

  /** Changes the visual layout axis without altering native document-order keyboard behavior. */
  readonly orientation = input<KrnOrientation>(this.options.orientation);
  /** Joins adjacent action borders and radii without coordinating child state or activation. */
  readonly connected = input(this.options.connected, { transform: booleanAttribute });

  /**
   * Deprecated compatibility bridge for a native accessible-name attribute.
   *
   * @deprecated Set native `aria-label` or `aria-labelledby` on the group host.
   * This bridge exists only for the legacy `<krn-button-group>` API.
   */
  readonly ariaLabel = input<string | null | undefined>(undefined);

  private readonly syncLegacyAriaLabel = effect(() => {
    const ariaLabel = this.ariaLabel();
    const host = this.elementRef.nativeElement;

    if (ariaLabel === undefined) {
      if (this.legacyAriaLabelOwned) {
        this.renderer.removeAttribute(host, 'aria-label');
        this.legacyAriaLabelOwned = false;
      }
      return;
    }

    this.legacyAriaLabelOwned = true;
    if (ariaLabel) {
      this.renderer.setAttribute(host, 'aria-label', ariaLabel);
    } else {
      this.renderer.removeAttribute(host, 'aria-label');
    }
  });
}
