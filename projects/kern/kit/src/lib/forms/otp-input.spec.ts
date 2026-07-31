import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KrnFormField } from './form-field';
import { KrnOtpInput } from './otp-tags';

@Component({
  imports: [KrnFormField, KrnOtpInput],
  template: `
    <span id="external-code-label">External verification label</span>
    <span id="external-code-help">Use the code from the message.</span>
    <krn-form-field label="Verification code" hint="Enter every character.">
      <krn-verification-code
        id="verification"
        ariaDescribedBy="external-code-help"
        ariaLabelledBy="external-code-label"
        [disabled]="disabled()"
        [length]="4"
        [readonly]="readOnly()"
        [required]="true"
        tabindex="4"
        [value]="value()"
        (valueChange)="value.set($event)"
      />
    </krn-form-field>
  `,
})
class OtpHost {
  readonly disabled = signal(false);
  readonly readOnly = signal(false);
  readonly value = signal('12');
  readonly otp = viewChild.required(KrnOtpInput);
}

const nativeInput = (root: HTMLElement): HTMLInputElement => {
  const input = root.querySelector<HTMLInputElement>('.krn-otp__input');
  if (!input) {
    throw new Error('Expected the OTP native input.');
  }
  return input;
};

const rectangle = (left: number, top: number): DOMRect =>
  ({
    bottom: top + 40,
    height: 40,
    left,
    right: left + 40,
    top,
    width: 40,
    x: left,
    y: top,
    toJSON: () => ({}),
  }) as DOMRect;

describe('KrnOtpInput', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('owns a standalone value silently and emits one accepted completion', async () => {
    const fixture = TestBed.createComponent(OtpHost);
    await fixture.whenStable();
    const component = fixture.componentInstance.otp();
    const valueChange = vi.fn();
    const completed = vi.fn();
    component.valueChange.subscribe(valueChange);
    component.completed.subscribe(completed);
    const input = nativeInput(fixture.nativeElement);

    expect(input.value).toBe('12');
    fixture.componentInstance.value.set('34');
    await fixture.whenStable();
    expect(input.value).toBe('34');
    expect(valueChange).not.toHaveBeenCalled();

    input.value = '34a56';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    expect(input.value).toBe('3456');
    expect(fixture.componentInstance.value()).toBe('3456');
    expect(valueChange).toHaveBeenCalledOnce();
    expect(valueChange).toHaveBeenCalledWith('3456');
    expect(completed).toHaveBeenCalledOnce();
    expect(completed).toHaveBeenCalledWith('3456');

    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(valueChange).toHaveBeenCalledOnce();
    expect(completed).toHaveBeenCalledOnce();
  });

  it('uses one native focus target and composes external and Form Field semantics', async () => {
    const fixture = TestBed.createComponent(OtpHost);
    await fixture.whenStable();
    const component = fixture.componentInstance.otp();
    const input = nativeInput(fixture.nativeElement);
    const slots = fixture.nativeElement.querySelectorAll('.krn-otp__slot');

    expect(fixture.nativeElement.querySelectorAll('input')).toHaveLength(1);
    expect(slots).toHaveLength(4);
    expect(input.id).toBe('verification');
    expect(input.getAttribute('aria-labelledby')).toBe(
      'external-code-label verification-field-label',
    );
    expect(input.getAttribute('aria-describedby')).toBe('external-code-help verification-hint');
    expect(input.required).toBe(true);
    expect(input.tabIndex).toBe(4);
    expect(input.inputMode).toBe('numeric');

    component.focus({ preventScroll: true });
    expect(input.ownerDocument.activeElement).toBe(input);
    component.blur();
    expect(input.ownerDocument.activeElement).not.toBe(input);
  });

  it('restores the caret from the sanitized prefix', async () => {
    const fixture = TestBed.createComponent(KrnOtpInput);
    fixture.componentRef.setInput('length', 4);
    await fixture.whenStable();
    const input = nativeInput(fixture.nativeElement);

    input.value = '1a2';
    input.setSelectionRange(2, 2);
    input.dispatchEvent(new Event('input', { bubbles: true }));

    expect(input.value).toBe('12');
    expect(input.selectionStart).toBe(1);
    expect(input.selectionEnd).toBe(1);
  });

  it('selects a wrapped RTL slot from its actual geometry', async () => {
    const fixture = TestBed.createComponent(KrnOtpInput);
    fixture.componentRef.setInput('length', 4);
    fixture.componentInstance.writeValue('1234');
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const input = nativeInput(root);
    const slots = [...root.querySelectorAll<HTMLElement>('.krn-otp__slot')];
    const positions = [rectangle(50, 0), rectangle(0, 0), rectangle(50, 50), rectangle(0, 50)];
    slots.forEach((slot, index) => {
      vi.spyOn(slot, 'getBoundingClientRect').mockReturnValue(positions[index]!);
    });

    root.querySelector<HTMLElement>('.krn-otp')?.dispatchEvent(
      new MouseEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        clientX: 20,
        clientY: 70,
      }),
    );
    await fixture.whenStable();

    expect(input.selectionStart).toBe(3);
    expect(input.selectionEnd).toBe(4);
    expect(slots[3]?.hasAttribute('data-active')).toBe(true);
  });

  it('preserves readonly focusability, disables native interaction, and reports blur as touched', async () => {
    const fixture = TestBed.createComponent(KrnOtpInput);
    await fixture.whenStable();
    const touched = vi.fn();
    fixture.componentInstance.registerOnTouched(touched);
    fixture.componentRef.setInput('readonly', true);
    await fixture.whenStable();
    const input = nativeInput(fixture.nativeElement);

    expect(input.readOnly).toBe(true);
    expect(input.disabled).toBe(false);
    fixture.componentInstance.focus();
    fixture.componentInstance.blur();
    expect(touched).toHaveBeenCalledOnce();

    fixture.componentRef.setInput('disabled', true);
    await fixture.whenStable();
    expect(input.disabled).toBe(true);
    expect(input.tabIndex).toBe(-1);
  });
});
