import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { AbstractControl } from '@angular/forms';
import {
  FormControl,
  FormsModule,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  NgModel,
  ReactiveFormsModule,
} from '@angular/forms';
import { By } from '@angular/platform-browser';
import { provideKrnFormControl, useKrnControlA11y, useKrnFormControl } from './value-accessor';

@Component({
  selector: 'krn-missing-form-adapter-test',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class MissingFormAdapterFixture {
  private readonly formControl = useKrnFormControl(this, '');

  readValue(): string {
    return this.formControl.controlValue();
  }
}

@Component({
  selector: 'krn-missing-a11y-adapter-test',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class MissingA11yAdapterFixture {
  readonly id = input('');
  readonly invalid = input(false);
  readonly a11y = useKrnControlA11y(this, this.id, this.invalid, 'missing-adapter');
}

@Component({
  selector: 'krn-form-adapter-ancestor-test',
  imports: [MissingFormAdapterFixture],
  providers: [...provideKrnFormControl()],
  template: '<krn-missing-form-adapter-test />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class FormAdapterAncestorFixture {}

@Component({
  selector: 'krn-a11y-adapter-ancestor-test',
  imports: [MissingA11yAdapterFixture],
  providers: [...provideKrnFormControl()],
  template: '<krn-missing-a11y-adapter-test />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class A11yAdapterAncestorFixture {}

@Component({
  selector: 'krn-value-accessor-test',
  providers: [...provideKrnFormControl()],
  template: `
    <input
      [disabled]="formDisabled()"
      [value]="controlValue()"
      (blur)="touchFromUser()"
      (input)="updateFromUser($event)"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class TestValueAccessor {
  readonly value = input<string | undefined>(undefined);
  readonly valueChange = output<string>();

  private readonly formControl = useKrnFormControl(this, '');
  protected readonly controlValue = this.formControl.controlValue;
  protected readonly formDisabled = this.formControl.formDisabled;
  readonly writeValue = this.formControl.writeValue;
  readonly registerOnChange = this.formControl.registerOnChange;
  readonly registerOnTouched = this.formControl.registerOnTouched;
  readonly setDisabledState = this.formControl.setDisabledState;
  readonly validate = this.formControl.validate;
  readonly registerOnValidatorChange = this.formControl.registerOnValidatorChange;

  constructor() {
    this.formControl.bindStandaloneValue(this.value);
  }

  readValue(): string {
    return this.controlValue();
  }

  readOwner(): 'angular' | 'internal' | 'standalone' {
    return this.formControl.valueOwner();
  }

  userCommit(value: string): boolean {
    const committed = this.formControl.commitUserValue(value);
    if (committed) {
      this.valueChange.emit(value);
    }
    return committed;
  }

  forceCommit(value: string): void {
    this.formControl.commitValue(value);
  }

  protected updateFromUser(event: Event): void {
    this.userCommit((event.target as HTMLInputElement).value);
  }

  protected touchFromUser(): void {
    this.formControl.touch();
  }
}

@Component({
  selector: 'krn-comparable-value-accessor-test',
  providers: [...provideKrnFormControl()],
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ComparableValueAccessor {
  private readonly formControl = useKrnFormControl(this, [] as readonly string[], {
    valuesEqual: (current, next) => this.valuesEqual(current, next),
  });
  readonly writeValue = this.formControl.writeValue;
  readonly registerOnChange = this.formControl.registerOnChange;

  readValue(): readonly string[] {
    return this.formControl.controlValue();
  }

  userCommit(value: readonly string[]): boolean {
    return this.formControl.commitUserValue(value);
  }

  private valuesEqual(current: readonly string[], next: readonly string[]): boolean {
    return (
      current.length === next.length &&
      current.every((value, index) => Object.is(value, next[index]))
    );
  }
}

@Component({
  selector: 'krn-transformed-value-accessor-test',
  providers: [...provideKrnFormControl()],
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class TransformedValueAccessor {
  private readonly formControl = useKrnFormControl<number, string>(this, 0, {
    fromControlValue: (value) => this.fromControlValue(value),
    toControlValue: (value) => this.toControlValue(value),
  });
  readonly writeValue = this.formControl.writeValue;
  readonly registerOnChange = this.formControl.registerOnChange;

  readValue(): number {
    return this.formControl.controlValue();
  }

  userCommit(value: number): boolean {
    return this.formControl.commitUserValue(value);
  }

  private fromControlValue(value: string | null | undefined): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private toControlValue(value: number): string {
    return `${value}`;
  }
}

function testAccessor(fixture: {
  debugElement: {
    query(predicate: ReturnType<typeof By.directive>): { componentInstance: unknown };
  };
}): TestValueAccessor {
  return fixture.debugElement.query(By.directive(TestValueAccessor))
    .componentInstance as TestValueAccessor;
}

describe('KRN form-control composition ownership contract', () => {
  it('fails fast instead of borrowing an ancestor adapter when the component provider is missing', () => {
    expect(() => TestBed.createComponent(FormAdapterAncestorFixture)).toThrow(
      /KRN_FORM_CONTROL_ADAPTER|No provider/i,
    );
    expect(() => TestBed.createComponent(A11yAdapterAncestorFixture)).toThrow(
      /KRN_FORM_CONTROL_ADAPTER|No provider/i,
    );
  });

  it('silently follows a standalone owner and emits only accepted user commits', async () => {
    @Component({
      selector: 'krn-standalone-value-host-test',
      imports: [TestValueAccessor],
      template: `
        <krn-value-accessor-test [value]="value()" (valueChange)="changes.push($event)" />
      `,
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class StandaloneValueHost {
      readonly value = signal('alpha');
      readonly changes: string[] = [];
    }

    const fixture = TestBed.createComponent(StandaloneValueHost);
    await fixture.whenStable();
    const accessor = testAccessor(fixture);

    expect(accessor.readOwner()).toBe('standalone');
    expect(accessor.readValue()).toBe('alpha');
    expect(fixture.componentInstance.changes).toEqual([]);

    fixture.componentInstance.value.set('beta');
    await fixture.whenStable();
    expect(accessor.readValue()).toBe('beta');
    expect(fixture.componentInstance.changes).toEqual([]);

    expect(accessor.userCommit('gamma')).toBe(true);
    expect(accessor.readValue()).toBe('gamma');
    expect(fixture.componentInstance.changes).toEqual(['gamma']);
  });

  it('keeps writeValue silent and preserves the explicit always-notify commit path', () => {
    const fixture = TestBed.createComponent(TestValueAccessor);
    const accessor = fixture.componentInstance;
    const onChange = vi.fn();
    const valueChange = vi.fn();
    accessor.registerOnChange(onChange);
    accessor.valueChange.subscribe(valueChange);

    accessor.writeValue('external');
    expect(accessor.readValue()).toBe('external');
    expect(accessor.readOwner()).toBe('angular');
    expect(onChange).not.toHaveBeenCalled();
    expect(valueChange).not.toHaveBeenCalled();

    accessor.forceCommit('external');
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenLastCalledWith('external');
  });

  it('supports typed control-to-view and view-to-control transformations', () => {
    const fixture = TestBed.createComponent(TransformedValueAccessor);
    const accessor = fixture.componentInstance;
    const onChange = vi.fn();
    accessor.registerOnChange(onChange);

    accessor.writeValue('42');
    expect(accessor.readValue()).toBe(42);
    expect(onChange).not.toHaveBeenCalled();

    expect(accessor.userCommit(43)).toBe(true);
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenLastCalledWith('43');
  });

  it('uses the component comparator to suppress equivalent user commits', () => {
    const fixture = TestBed.createComponent(ComparableValueAccessor);
    const accessor = fixture.componentInstance;
    const onChange = vi.fn();
    accessor.registerOnChange(onChange);
    accessor.writeValue(['alpha']);

    expect(accessor.userCommit(['alpha'])).toBe(false);
    expect(onChange).not.toHaveBeenCalled();

    expect(accessor.userCommit(['alpha', 'beta'])).toBe(true);
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenLastCalledWith(['alpha', 'beta']);
  });

  it('allows a reentrant Angular write to replace the optimistic user view', () => {
    const fixture = TestBed.createComponent(TestValueAccessor);
    const accessor = fixture.componentInstance;
    accessor.writeValue('initial');
    accessor.registerOnChange((value) => accessor.writeValue(value.toUpperCase()));

    expect(accessor.userCommit('next')).toBe(true);
    expect(accessor.readValue()).toBe('NEXT');
    expect(accessor.readOwner()).toBe('angular');
  });

  it('lets Angular Forms own mixed bindings and reports the conflict once in dev mode', async () => {
    @Component({
      selector: 'krn-mixed-value-host-test',
      imports: [ReactiveFormsModule, TestValueAccessor],
      template: ` <krn-value-accessor-test [formControl]="control" [value]="standalone()" /> `,
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class MixedValueHost {
      readonly control = new FormControl('angular', { nonNullable: true });
      readonly standalone = signal('standalone');
    }

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fixture = TestBed.createComponent(MixedValueHost);
    await fixture.whenStable();
    const accessor = testAccessor(fixture);

    expect(accessor.readOwner()).toBe('angular');
    expect(accessor.readValue()).toBe('angular');

    fixture.componentInstance.standalone.set('late standalone');
    await fixture.whenStable();
    expect(accessor.readValue()).toBe('angular');

    const ownershipWarnings = warn.mock.calls.filter(([message]) =>
      String(message).includes('both a standalone value binding and Angular Forms'),
    );
    expect(ownershipWarnings).toHaveLength(1);
    warn.mockRestore();
  });
});

describe('KRN form-control composition Angular Forms contract', () => {
  it('registers one shared adapter instead of the component instance', () => {
    const fixture = TestBed.createComponent(TestValueAccessor);
    const accessors = fixture.debugElement.injector.get(NG_VALUE_ACCESSOR);
    const validators = fixture.debugElement.injector.get(NG_VALIDATORS);

    expect(accessors).toHaveLength(1);
    expect(validators).toHaveLength(1);
    expect(accessors[0]).toBe(validators[0]);
    expect(accessors[0]).not.toBe(fixture.componentInstance);
  });

  it('handles reactive reset, nullable values, and disabled state', async () => {
    @Component({
      selector: 'krn-reactive-value-host-test',
      imports: [ReactiveFormsModule, TestValueAccessor],
      template: `<krn-value-accessor-test [formControl]="control" />`,
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class ReactiveValueHost {
      readonly control = new FormControl<string | null>('initial');
    }

    const fixture = TestBed.createComponent(ReactiveValueHost);
    await fixture.whenStable();
    const accessor = testAccessor(fixture);
    const native = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    expect(accessor.readValue()).toBe('initial');
    expect(accessor.readOwner()).toBe('angular');

    fixture.componentInstance.control.reset(null);
    await fixture.whenStable();
    expect(accessor.readValue()).toBe('');

    fixture.componentInstance.control.disable();
    await fixture.whenStable();
    expect(native.disabled).toBe(true);

    fixture.componentInstance.control.enable();
    await fixture.whenStable();
    expect(native.disabled).toBe(false);
  });

  it('round-trips through template-driven ngModel without requiring NgControl', async () => {
    @Component({
      selector: 'krn-template-value-host-test',
      imports: [FormsModule, TestValueAccessor],
      template: `<krn-value-accessor-test [(ngModel)]="value" />`,
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class TemplateValueHost {
      value = 'initial';
    }

    const fixture = TestBed.createComponent(TemplateValueHost);
    await fixture.whenStable();
    const native = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const model = fixture.debugElement.query(By.directive(NgModel)).injector.get(NgModel);

    expect(native.value).toBe('initial');
    native.value = 'updated';
    native.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(fixture.componentInstance.value).toBe('updated');
    native.dispatchEvent(new Event('blur'));
    await fixture.whenStable();
    expect(model.touched).toBe(true);
  });

  it('defers updateOn blur values until the accessor is touched', async () => {
    @Component({
      selector: 'krn-blur-value-host-test',
      imports: [ReactiveFormsModule, TestValueAccessor],
      template: `<krn-value-accessor-test [formControl]="control" />`,
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class BlurValueHost {
      readonly control = new FormControl('initial', {
        nonNullable: true,
        updateOn: 'blur',
      });
    }

    const fixture = TestBed.createComponent(BlurValueHost);
    await fixture.whenStable();
    const accessor = testAccessor(fixture);
    const native = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    native.value = 'pending';
    native.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(accessor.readValue()).toBe('pending');
    expect(fixture.componentInstance.control.value).toBe('initial');
    expect(fixture.componentInstance.control.touched).toBe(false);

    native.dispatchEvent(new Event('blur'));
    await fixture.whenStable();
    expect(fixture.componentInstance.control.value).toBe('pending');
    expect(fixture.componentInstance.control.touched).toBe(true);
  });

  it('unsubscribes from the bound Angular control when destroyed', () => {
    const unsubscribe = vi.fn();
    const fixture = TestBed.createComponent(TestValueAccessor);
    const control = {
      value: '',
      invalid: false,
      hasValidator: () => false,
      statusChanges: {
        subscribe: () => ({ unsubscribe }),
      },
    } as unknown as AbstractControl;

    fixture.componentInstance.validate(control);
    fixture.destroy();

    expect(unsubscribe).toHaveBeenCalledOnce();
  });
});
