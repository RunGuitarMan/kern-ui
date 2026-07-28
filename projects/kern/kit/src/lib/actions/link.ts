import { booleanAttribute, ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type KrnLinkTarget = '_self' | '_blank' | '_parent' | '_top';

@Component({
  selector: 'krn-link',
  template: `
    <a
      class="krn-link"
      [attr.aria-disabled]="disabled()"
      [attr.aria-label]="ariaLabel() || null"
      [attr.download]="download() || null"
      [attr.href]="disabled() ? null : href()"
      [attr.rel]="safeRel()"
      [attr.target]="target()"
      [attr.tabindex]="disabled() ? -1 : null"
      (click)="activate($event)"
    >
      <ng-content />
    </a>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnLink {
  readonly href = input.required<string>();
  readonly target = input<KrnLinkTarget>('_self');
  readonly rel = input('');
  readonly download = input('');
  readonly ariaLabel = input('');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly activated = output<MouseEvent>();

  protected safeRel(): string | null {
    if (this.target() !== '_blank') {
      return this.rel() || null;
    }
    const values = new Set(this.rel().split(/\s+/).filter(Boolean));
    values.add('noopener');
    values.add('noreferrer');
    return [...values].join(' ');
  }

  protected activate(event: MouseEvent): void {
    if (this.disabled()) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    this.activated.emit(event);
  }
}
