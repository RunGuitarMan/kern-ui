import type { Signal, WritableSignal} from '@angular/core';
import { computed, inject, signal } from '@angular/core';
import type { ControlValueAccessor } from '@angular/forms';
import type { KrnFormFieldController} from './form-field';
import { KRN_FORM_FIELD, createKrnId } from './form-field';

export abstract class KrnValueAccessor<T> implements ControlValueAccessor {
  protected readonly controlValue: WritableSignal<T>;
  protected readonly formDisabled = signal(false);
  private readonly initialValue: T;
  private onChange: (value: T) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  protected constructor(initialValue: T) {
    this.initialValue = initialValue;
    this.controlValue = signal(initialValue);
  }

  writeValue(value: unknown): void {
    this.controlValue.set(this.normalizeIncomingValue(value));
  }

  registerOnChange(fn: (value: T) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.formDisabled.set(disabled);
  }

  protected normalizeIncomingValue(value: unknown): T {
    return (value ?? this.initialValue) as T;
  }

  protected commitValue(value: T): void {
    this.controlValue.set(value);
    this.onChange(value);
  }

  protected touch(): void {
    this.onTouched();
  }
}

export interface KrnControlA11y {
  readonly id: Signal<string>;
  readonly describedBy: Signal<string | null>;
  readonly invalid: Signal<boolean>;
  readonly field: KrnFormFieldController | null;
}

export function useKrnControlA11y(
  explicitId: Signal<string>,
  ownInvalid: Signal<boolean>,
  prefix: string,
): KrnControlA11y {
  const field = inject(KRN_FORM_FIELD, { optional: true });
  const generatedId = createKrnId(prefix);

  return {
    id: computed(() => explicitId() || field?.controlId() || generatedId),
    describedBy: computed(() => field?.describedBy() || null),
    invalid: computed(() => ownInvalid() || Boolean(field?.invalid())),
    field,
  };
}
