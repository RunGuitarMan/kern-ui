import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import type { KrnActionVariant, KrnButtonType, KrnSize, KrnTone } from './action-types';

@Component({
  selector: 'krn-button',
  template: `
    <button
      class="krn-action"
      [attr.aria-busy]="loading() || null"
      [attr.aria-label]="ariaLabel() || null"
      [attr.aria-pressed]="pressed() ?? null"
      [attr.data-loading]="loading()"
      [attr.data-size]="size()"
      [attr.data-tone]="tone()"
      [attr.data-variant]="variant()"
      [disabled]="isDisabled()"
      [name]="name() || ''"
      [type]="type()"
      [value]="value()"
      (click)="activate($event)"
    >
      <span class="krn-action__icon" aria-hidden="true">
        <ng-content select="[krnLeadingIcon]" />
      </span>
      <span class="krn-action__label"><ng-content /></span>
      <span class="krn-action__icon" aria-hidden="true">
        <ng-content select="[krnTrailingIcon]" />
      </span>
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnButton {
  readonly size = input<KrnSize>('md');
  readonly variant = input<KrnActionVariant>('solid');
  readonly tone = input<KrnTone>('brand');
  readonly type = input<KrnButtonType>('button');
  readonly name = input('');
  readonly value = input('');
  readonly ariaLabel = input('');
  readonly loading = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly pressed = input<boolean | undefined>(undefined, {
    transform: (value: unknown) =>
      value === undefined || value === null ? undefined : booleanAttribute(value),
  });
  readonly activated = output<MouseEvent>();

  protected readonly isDisabled = computed(() => this.disabled() || this.loading());
  protected activate(event: MouseEvent): void {
    if (this.isDisabled()) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    this.activated.emit(event);
  }
}

@Component({
  selector: 'krn-icon-button',
  template: `
    <button
      class="krn-action krn-icon-action"
      [attr.aria-busy]="loading() || null"
      [attr.aria-label]="ariaLabel()"
      [attr.aria-pressed]="pressed() ?? null"
      [attr.data-loading]="loading()"
      [attr.data-size]="size()"
      [attr.data-tone]="tone()"
      [attr.data-variant]="variant()"
      [disabled]="isDisabled()"
      [type]="type()"
      (click)="activate($event)"
    >
      <span class="krn-action__icon" aria-hidden="true"><ng-content /></span>
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnIconButton {
  readonly ariaLabel = input.required<string>();
  readonly size = input<KrnSize>('md');
  readonly variant = input<KrnActionVariant>('ghost');
  readonly tone = input<KrnTone>('neutral');
  readonly type = input<KrnButtonType>('button');
  readonly loading = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly pressed = input<boolean | undefined>(undefined, {
    transform: (value: unknown) =>
      value === undefined || value === null ? undefined : booleanAttribute(value),
  });
  readonly activated = output<MouseEvent>();

  protected readonly isDisabled = computed(() => this.disabled() || this.loading());

  protected activate(event: MouseEvent): void {
    if (this.isDisabled()) {
      event.preventDefault();
      return;
    }
    this.activated.emit(event);
  }
}

@Component({
  selector: 'krn-floating-action-button',
  template: `
    <button
      class="krn-action krn-fab"
      [attr.aria-busy]="loading() || null"
      [attr.aria-label]="ariaLabel() || null"
      [attr.data-loading]="loading()"
      [attr.data-size]="size()"
      [attr.data-tone]="tone()"
      [attr.data-variant]="variant()"
      [disabled]="isDisabled()"
      type="button"
      (click)="activate($event)"
    >
      <span class="krn-action__icon" aria-hidden="true">
        <ng-content select="[krnFabIcon]" />
      </span>
      @if (extended()) {
        <span class="krn-action__label"><ng-content /></span>
      }
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnFloatingActionButton {
  readonly ariaLabel = input.required<string>();
  readonly size = input<KrnSize>('lg');
  readonly variant = input<KrnActionVariant>('solid');
  readonly tone = input<KrnTone>('brand');
  readonly extended = input(true, { transform: booleanAttribute });
  readonly loading = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly activated = output<MouseEvent>();

  protected readonly isDisabled = computed(() => this.disabled() || this.loading());

  protected activate(event: MouseEvent): void {
    if (!this.isDisabled()) {
      this.activated.emit(event);
    }
  }
}
