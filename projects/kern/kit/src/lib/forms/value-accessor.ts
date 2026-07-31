import type { Provider, Signal, Type, WritableSignal } from '@angular/core';
import {
  computed,
  DestroyRef,
  ElementRef,
  effect,
  forwardRef,
  inject,
  isDevMode,
  signal,
  untracked,
} from '@angular/core';
import type {
  AbstractControl,
  ControlValueAccessor,
  ValidationErrors,
  Validator,
} from '@angular/forms';
import { NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators } from '@angular/forms';
import type { KrnFormFieldController } from './form-field';
import { KRN_FORM_FIELD, createKrnId } from './form-field';

interface KrnAngularControlState {
  control: AbstractControl | null;
  readonly invalid: WritableSignal<boolean>;
  readonly required: WritableSignal<boolean>;
  readonly disabled: WritableSignal<boolean>;
  readonly pending: WritableSignal<boolean>;
  readonly valid: WritableSignal<boolean>;
  readonly touched: WritableSignal<boolean>;
  readonly dirty: WritableSignal<boolean>;
  eventSubscription: { unsubscribe(): void } | null;
}

const angularControlStates = new WeakMap<object, KrnAngularControlState>();

function angularControlState(owner: object): KrnAngularControlState {
  const state = angularControlStates.get(owner);
  if (!state) {
    throw new Error('KERN form control state must be initialized before a11y bindings.');
  }
  return state;
}

export function provideKrnFormControl(type: () => Type<unknown>): Provider[] {
  return [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(type),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(type),
      multi: true,
    },
  ];
}

/**
 * Base ControlValueAccessor and Validator contract for custom KERN form controls.
 *
 * @publicApi
 * @experimental
 */
export abstract class KrnValueAccessor<T, TControl = T> implements ControlValueAccessor, Validator {
  protected readonly controlValue: WritableSignal<T>;
  protected readonly formDisabled = signal(false);
  private readonly valueOwnerState = signal<'angular' | 'internal' | 'standalone'>('internal');
  protected readonly valueOwner = this.valueOwnerState.asReadonly();
  private readonly accessorDestroyRef = inject(DestroyRef);
  private readonly initialValue: T;
  private onChange: (value: TControl) => void = () => undefined;
  private onTouched: () => void = () => undefined;
  private onValidatorChange: () => void = () => undefined;
  private mixedOwnershipReported = false;

  protected constructor(initialValue: T) {
    this.initialValue = initialValue;
    this.controlValue = signal(initialValue);
    const state: KrnAngularControlState = {
      control: null,
      invalid: signal(false),
      required: signal(false),
      disabled: signal(false),
      pending: signal(false),
      valid: signal(false),
      touched: signal(false),
      dirty: signal(false),
      eventSubscription: null,
    };
    angularControlStates.set(this, state);
    this.accessorDestroyRef.onDestroy(() => {
      state.eventSubscription?.unsubscribe();
      angularControlStates.delete(this);
    });
  }

  writeValue(value: unknown): void {
    this.claimAngularOwnership();
    this.controlValue.set(this.fromControlValue(value as TControl | null | undefined));
  }

  registerOnChange(fn: (value: TControl) => void): void {
    this.claimAngularOwnership();
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.claimAngularOwnership();
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.claimAngularOwnership();
    this.formDisabled.set(disabled);
  }

  validate(control: AbstractControl): ValidationErrors | null {
    const state = this.bindAngularControl(control);
    const errors = this.validateValue(control.value);
    state.invalid.set(Boolean(control.invalid || errors));
    return errors;
  }

  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  /**
   * Converts an Angular Forms value into the component's view-value domain.
   *
   * Override together with `toControlValue` when the form model and the rendered component use
   * different value types. Existing controls can continue overriding `normalizeIncomingValue`.
   */
  protected fromControlValue(value: TControl | null | undefined): T {
    return this.normalizeIncomingValue(value);
  }

  /**
   * Converts a committed view value into the Angular Forms value domain.
   */
  protected toControlValue(value: T): TControl {
    return value as unknown as TControl;
  }

  protected normalizeIncomingValue(value: unknown): T {
    return (value ?? this.initialValue) as T;
  }

  /**
   * Normalizes a declarative standalone value without claiming Angular Forms ownership.
   */
  protected normalizeStandaloneValue(value: T): T {
    return this.normalizeIncomingValue(value);
  }

  /**
   * Binds an optional declarative value source to this accessor.
   *
   * `undefined` means that no standalone owner is present. Once Angular Forms registers the
   * accessor it remains the deterministic owner and later standalone writes are ignored.
   * Incoming writes are always silent: they never call `onChange`, touch the control, or emit a
   * component output.
   */
  protected bindStandaloneValue(value: Signal<T | undefined>): void {
    effect(() => {
      const next = value();
      if (next === undefined) {
        return;
      }

      const owner = untracked(this.valueOwner);
      if (owner === 'angular') {
        this.reportMixedOwnership();
        return;
      }

      if (owner !== 'standalone') {
        this.valueOwnerState.set('standalone');
      }
      this.controlValue.set(this.normalizeStandaloneValue(next));
    });
  }

  protected validateValue(_value: unknown): ValidationErrors | null {
    return null;
  }

  protected watchValidationInputs(...dependencies: readonly Signal<unknown>[]): void {
    effect(() => {
      for (const dependency of dependencies) {
        dependency();
      }
      this.onValidatorChange();
    });
  }

  protected commitValue(value: T): void {
    this.controlValue.set(value);
    this.onChange(this.toControlValue(value));
  }

  /**
   * Commits one user-originated value when it differs from the rendered value.
   *
   * The boolean result lets a concrete component emit its existing public output only for an
   * accepted change. The legacy `commitValue` method deliberately keeps its historical
   * always-notify behavior until concrete controls migrate one by one.
   */
  protected commitUserValue(value: T): boolean {
    if (this.valuesEqual(this.controlValue(), value)) {
      return false;
    }

    this.controlValue.set(value);
    this.onChange(this.toControlValue(value));
    return true;
  }

  /**
   * Equality policy for user commits. Reference-valued controls can override this with their
   * domain identity contract.
   */
  protected valuesEqual(current: T, next: T): boolean {
    return Object.is(current, next);
  }

  protected touch(): void {
    this.onTouched();
  }

  private bindAngularControl(control: AbstractControl): KrnAngularControlState {
    const state = angularControlState(this);
    if (state.control !== control) {
      state.eventSubscription?.unsubscribe();
      state.control = control;
      state.eventSubscription = (control.events ?? control.statusChanges).subscribe(() => {
        this.syncAngularControlState(control, state);
      });
    }
    this.syncAngularControlState(control, state);
    return state;
  }

  private syncAngularControlState(control: AbstractControl, state: KrnAngularControlState): void {
    if (state.control !== control) {
      return;
    }
    state.invalid.set(Boolean(control.invalid));
    state.disabled.set(control.disabled);
    state.pending.set(control.pending);
    state.valid.set(control.valid);
    state.touched.set(control.touched);
    state.dirty.set(control.dirty);
    state.required.set(
      control.hasValidator(Validators.required) || control.hasValidator(Validators.requiredTrue),
    );
  }

  private claimAngularOwnership(): void {
    const owner = this.valueOwnerState();
    if (owner === 'standalone') {
      this.reportMixedOwnership();
    }
    if (owner !== 'angular') {
      this.valueOwnerState.set('angular');
    }
  }

  private reportMixedOwnership(): void {
    if (!isDevMode() || this.mixedOwnershipReported) {
      return;
    }
    this.mixedOwnershipReported = true;
    console.warn(
      'KERN form control received both a standalone value binding and Angular Forms. ' +
        'Angular Forms owns the value; standalone writes are ignored.',
    );
  }
}

export interface KrnControlA11y {
  readonly id: Signal<string>;
  readonly describedBy: Signal<string | null>;
  readonly labelledBy: Signal<string | null>;
  readonly invalid: Signal<boolean>;
  readonly required: Signal<boolean>;
  readonly disabled: Signal<boolean>;
  readonly readOnly: Signal<boolean>;
  readonly isFormFieldControl: Signal<boolean>;
  readonly field: KrnFormFieldController | null;
}

export interface KrnControlStateInputs {
  readonly required?: Signal<boolean>;
  readonly disabled?: Signal<boolean>;
  readonly readOnly?: Signal<boolean>;
  readonly inheritField?: boolean;
  readonly labelStrategy?: 'native' | 'group';
}

export function useKrnControlA11y(
  owner: object,
  explicitId: Signal<string>,
  ownInvalid: Signal<boolean>,
  prefix: string,
  state: KrnControlStateInputs = {},
): KrnControlA11y {
  const injectedField = inject(KRN_FORM_FIELD, { optional: true });
  const field = state.inheritField === false ? null : injectedField;
  const generatedId = createKrnId(prefix);
  const destroyRef = inject(DestroyRef);
  const elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  const angular = angularControlState(owner);
  const controlRequired = computed(() => Boolean(state.required?.() || angular.required()));
  const controlDisabled = computed(() => Boolean(state.disabled?.() || angular.disabled()));
  const controlReadOnly = computed(() => Boolean(state.readOnly?.()));
  const controlInteracted = computed(() => angular.touched() || angular.dirty());
  const controlInvalid = computed(
    () => !controlDisabled() && (ownInvalid() || (angular.invalid() && controlInteracted())),
  );
  const id = computed(() => explicitId() || generatedId);
  const registration = {
    element: elementRef.nativeElement,
    id,
    labelStrategy: state.labelStrategy ?? 'native',
    invalid: controlInvalid,
    required: controlRequired,
    disabled: controlDisabled,
    readOnly: controlReadOnly,
    pending: angular.pending,
    valid: angular.valid,
    touched: angular.touched,
    dirty: angular.dirty,
  } as const;
  const isFormFieldControl = computed(() => (field ? field.isPrimaryControl(registration) : false));

  if (field) {
    destroyRef.onDestroy(field.registerControl(registration));
  }

  return {
    id,
    describedBy: computed(() => (isFormFieldControl() ? field?.describedBy() || null : null)),
    labelledBy: computed(() => (isFormFieldControl() ? field?.labelledBy() || null : null)),
    invalid: computed(
      () => controlInvalid() || (isFormFieldControl() && Boolean(field?.invalid())),
    ),
    required: controlRequired,
    disabled: controlDisabled,
    readOnly: controlReadOnly,
    isFormFieldControl,
    field,
  };
}

export const requiredError = (value: unknown, required: boolean): ValidationErrors | null => {
  if (!required) {
    return null;
  }
  const empty =
    value === null ||
    value === undefined ||
    value === '' ||
    (Array.isArray(value) && value.length === 0);
  return empty ? { required: true } : null;
};

export const requiredTrueError = (value: unknown, required: boolean): ValidationErrors | null =>
  required && value !== true ? { required: true } : null;

export const minLengthError = (
  value: unknown,
  requiredLength: number | undefined,
): ValidationErrors | null => {
  if (requiredLength === undefined || value === null || value === undefined || value === '') {
    return null;
  }
  const actualLength = typeof value === 'string' || Array.isArray(value) ? value.length : 0;
  return actualLength < requiredLength ? { minlength: { requiredLength, actualLength } } : null;
};

export const maxLengthError = (
  value: unknown,
  requiredLength: number | undefined,
): ValidationErrors | null => {
  if (requiredLength === undefined || value === null || value === undefined) {
    return null;
  }
  const actualLength = typeof value === 'string' || Array.isArray(value) ? value.length : 0;
  return actualLength > requiredLength ? { maxlength: { requiredLength, actualLength } } : null;
};

export const minError = (value: unknown, minimum: number | undefined): ValidationErrors | null => {
  if (minimum === undefined || value === null || value === undefined || value === '') {
    return null;
  }
  const actual = Number(value);
  return Number.isFinite(actual) && actual < minimum ? { min: { min: minimum, actual } } : null;
};

export const maxError = (value: unknown, maximum: number | undefined): ValidationErrors | null => {
  if (maximum === undefined || value === null || value === undefined || value === '') {
    return null;
  }
  const actual = Number(value);
  return Number.isFinite(actual) && actual > maximum ? { max: { max: maximum, actual } } : null;
};

export const mergeValidationErrors = (
  ...errors: readonly (ValidationErrors | null)[]
): ValidationErrors | null => {
  const merged = Object.assign({}, ...errors.filter((error) => error !== null));
  return Object.keys(merged).length > 0 ? merged : null;
};
