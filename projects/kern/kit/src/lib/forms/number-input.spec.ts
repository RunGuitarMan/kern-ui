import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { provideKrn } from '@kern-ui/angular/core';
import { KrnNumberInput } from './text-inputs';

@Component({
  imports: [KrnNumberInput, ReactiveFormsModule],
  template: `
    <krn-number-input
      required
      [formControl]="control"
      [max]="10"
      [min]="1"
      [value]="standaloneValue()"
    />
  `,
})
class AngularOwnedNumberHost {
  readonly standaloneValue = signal<number | null>(7);
  readonly control = new FormControl<number | null>(5);
}

describe('KrnNumberInput', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideKrn()],
    });
  });

  afterEach(() => TestBed.resetTestingModule());

  it('keeps Angular Forms as owner and validates manual values without clamping them', async () => {
    const fixture = TestBed.createComponent(AngularOwnedNumberHost);
    await fixture.whenStable();
    const host = fixture.componentInstance;
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    expect(input.valueAsNumber).toBe(5);
    host.standaloneValue.set(8);
    await fixture.whenStable();
    expect(input.valueAsNumber).toBe(5);

    input.value = '12';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    expect(host.control.value).toBe(12);
    expect(input.value).toBe('12');
    expect(host.control.errors).toEqual({ max: { max: 10, actual: 12 } });

    input.value = '-2';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    expect(host.control.value).toBe(-2);
    expect(input.value).toBe('-2');
    expect(host.control.errors).toEqual({ min: { min: 1, actual: -2 } });

    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    expect(host.control.value).toBeNull();
    expect(host.control.errors).toEqual({ required: true });
  });

  it('steps precisely, keeps focus, and disables controls at numeric bounds', async () => {
    const fixture = TestBed.createComponent(KrnNumberInput);
    const valueChange = vi.fn();
    fixture.componentInstance.valueChange.subscribe(valueChange);
    fixture.componentRef.setInput('id', 'quantity');
    fixture.componentRef.setInput('max', 0.3);
    fixture.componentRef.setInput('min', 0.1);
    fixture.componentRef.setInput('step', 0.2);
    fixture.componentRef.setInput('value', 0.1);
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    const [increase, decrease] = buttons;

    fixture.componentInstance.focus();
    increase.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0 }));
    increase.click();
    await fixture.whenStable();

    expect(input.valueAsNumber).toBe(0.3);
    expect(input.ownerDocument.activeElement).toBe(input);
    expect(increase.disabled).toBe(true);
    expect(increase.tabIndex).toBe(-1);
    expect(increase.getAttribute('aria-controls')).toBe('quantity');
    expect(decrease.getAttribute('aria-controls')).toBe('quantity');
    expect(valueChange).toHaveBeenLastCalledWith(0.3);

    increase.click();
    expect(valueChange).toHaveBeenCalledTimes(1);

    decrease.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0 }));
    decrease.click();
    await fixture.whenStable();
    expect(input.valueAsNumber).toBe(0.1);
    expect(decrease.disabled).toBe(true);
    expect(valueChange).toHaveBeenLastCalledWith(0.1);

    fixture.componentRef.setInput('max', undefined);
    fixture.componentRef.setInput('min', undefined);
    fixture.componentRef.setInput('step', 1e-15);
    fixture.componentRef.setInput('value', 1);
    await fixture.whenStable();
    expect(increase.disabled).toBe(false);

    increase.click();
    await fixture.whenStable();
    expect(input.valueAsNumber).toBe(1.000000000000001);
    expect(valueChange).toHaveBeenLastCalledWith(1.000000000000001);
  });

  it('deduplicates repeated native number input events', async () => {
    const fixture = TestBed.createComponent(KrnNumberInput);
    const onChange = vi.fn();
    const valueChange = vi.fn();
    fixture.componentInstance.registerOnChange(onChange);
    fixture.componentInstance.valueChange.subscribe(valueChange);
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    input.value = '1.5';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('input', { bubbles: true }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith(1.5);
    expect(valueChange).toHaveBeenCalledTimes(1);
  });

  it('composes ARIA references and normalizes optional numeric attributes', async () => {
    const fixture = TestBed.createComponent(KrnNumberInput);
    fixture.componentRef.setInput('ariaLabel', 'Fallback quantity');
    fixture.componentRef.setInput('ariaLabelledBy', 'quantity-label quantity-label');
    fixture.componentRef.setInput('ariaDescribedBy', 'hint-one hint-two hint-one');
    fixture.componentRef.setInput('autocomplete', '');
    fixture.componentRef.setInput('max', Number.POSITIVE_INFINITY);
    fixture.componentRef.setInput('min', 'invalid');
    fixture.componentRef.setInput('step', 0);
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    expect(input.getAttribute('aria-label')).toBeNull();
    expect(input.getAttribute('aria-labelledby')).toBe('quantity-label');
    expect(input.getAttribute('aria-describedby')).toBe('hint-one hint-two');
    expect(input.hasAttribute('autocomplete')).toBe(false);
    expect(input.hasAttribute('max')).toBe(false);
    expect(input.hasAttribute('min')).toBe(false);
    expect(input.getAttribute('inputmode')).toBe('decimal');
    expect(input.getAttribute('step')).toBe('1');
  });

  it('exposes native focus and blur methods and focuses from its shell', async () => {
    const fixture = TestBed.createComponent(KrnNumberInput);
    fixture.componentRef.setInput('value', 42);
    await fixture.whenStable();
    const shell = fixture.nativeElement.querySelector('.krn-control-shell') as HTMLElement;
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    shell.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0 }));
    expect(input.ownerDocument.activeElement).toBe(input);

    fixture.componentInstance.blur();
    expect(input.ownerDocument.activeElement).not.toBe(input);
  });
});
