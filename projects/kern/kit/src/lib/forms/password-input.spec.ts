import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { KrnI18n, provideKrn } from '@kern-ui/angular/core';
import { KrnPasswordInput } from './text-inputs';

@Component({
  imports: [KrnPasswordInput, ReactiveFormsModule],
  template: `
    <krn-password-input
      ariaLabel="Password"
      [maxLength]="6"
      [minLength]="3"
      [value]="standaloneValue()"
      [formControl]="control"
    />
  `,
})
class AngularOwnedPasswordHost {
  readonly standaloneValue = signal('Standalone');
  readonly control = new FormControl('Valid', { nonNullable: true });
}

describe('KrnPasswordInput', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideKrn()],
    });
  });

  afterEach(() => TestBed.resetTestingModule());

  it('keeps Angular Forms as value owner and validates both password length bounds', async () => {
    const fixture = TestBed.createComponent(AngularOwnedPasswordHost);
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const host = fixture.componentInstance;

    expect(input.value).toBe('Valid');

    host.standaloneValue.set('Ignored');
    await fixture.whenStable();
    expect(input.value).toBe('Valid');

    host.control.setValue('x');
    await fixture.whenStable();
    expect(host.control.errors).toEqual({
      minlength: { requiredLength: 3, actualLength: 1 },
    });

    host.control.setValue('Too long');
    await fixture.whenStable();
    expect(input.value).toBe('Too long');
    expect(host.control.errors).toEqual({
      maxlength: { requiredLength: 6, actualLength: 8 },
    });
  });

  it('reveals the password without stealing pointer focus or touching the control', async () => {
    const fixture = TestBed.createComponent(KrnPasswordInput);
    const touched = vi.fn();
    fixture.componentInstance.registerOnTouched(touched);
    fixture.componentRef.setInput('id', 'account-password');
    fixture.componentRef.setInput('value', 'secret');
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const toggle = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    fixture.componentInstance.focus();
    const { MouseEvent } = toggle.ownerDocument.defaultView!;
    toggle.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0 }));
    toggle.click();
    await fixture.whenStable();

    expect(input.type).toBe('text');
    expect(input.ownerDocument.activeElement).toBe(input);
    expect(toggle.getAttribute('aria-controls')).toBe('account-password');
    expect(toggle.getAttribute('aria-label')).toBe(
      TestBed.inject(KrnI18n).translations().forms.hidePassword,
    );
    expect(toggle.hasAttribute('aria-pressed')).toBe(false);
    expect(touched).not.toHaveBeenCalled();

    toggle.click();
    await fixture.whenStable();
    expect(input.type).toBe('password');
    expect(toggle.getAttribute('aria-label')).toBe(
      TestBed.inject(KrnI18n).translations().forms.showPassword,
    );
    expect(toggle.hasAttribute('aria-pressed')).toBe(false);
  });

  it('buffers IME composition and preserves complete Unicode values', async () => {
    const fixture = TestBed.createComponent(KrnPasswordInput);
    const onChange = vi.fn();
    const valueChange = vi.fn();
    fixture.componentInstance.registerOnChange(onChange);
    fixture.componentInstance.valueChange.subscribe(valueChange);
    fixture.componentRef.setInput('maxLength', 1);
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    const { Event } = input.ownerDocument.defaultView!;
    input.dispatchEvent(new Event('compositionstart', { bubbles: true }));
    input.value = 'に';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(onChange).not.toHaveBeenCalled();

    input.value = '😀';
    input.dispatchEvent(new Event('compositionend', { bubbles: true }));
    input.dispatchEvent(new Event('input', { bubbles: true }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith('😀');
    expect(valueChange).toHaveBeenCalledTimes(1);
    expect(valueChange).toHaveBeenLastCalledWith('😀');
  });

  it('composes ARIA references and applies password-safe native defaults', async () => {
    const fixture = TestBed.createComponent(KrnPasswordInput);
    fixture.componentRef.setInput('ariaLabel', 'Fallback label');
    fixture.componentRef.setInput('ariaLabelledBy', 'visible-label visible-label');
    fixture.componentRef.setInput('ariaDescribedBy', 'hint-one hint-two hint-one');
    fixture.componentRef.setInput('minLength', 'invalid');
    fixture.componentRef.setInput('maxLength', -1);
    fixture.componentRef.setInput('autocomplete', '');
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    expect(input.getAttribute('aria-label')).toBeNull();
    expect(input.getAttribute('aria-labelledby')).toBe('visible-label');
    expect(input.getAttribute('aria-describedby')).toBe('hint-one hint-two');
    expect(input.hasAttribute('minlength')).toBe(false);
    expect(input.hasAttribute('maxlength')).toBe(false);
    expect(input.hasAttribute('autocomplete')).toBe(false);
    expect(input.getAttribute('autocapitalize')).toBe('none');
    expect(input.getAttribute('spellcheck')).toBe('false');
  });

  it('exposes native focus and selection methods and focuses from its shell', async () => {
    const fixture = TestBed.createComponent(KrnPasswordInput);
    fixture.componentRef.setInput('value', 'secret');
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const shell = fixture.nativeElement.querySelector('.krn-control-shell') as HTMLElement;

    const { MouseEvent } = shell.ownerDocument.defaultView!;
    shell.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0 }));
    expect(input.ownerDocument.activeElement).toBe(input);

    fixture.componentInstance.select();
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe('secret'.length);

    fixture.componentInstance.blur();
    expect(input.ownerDocument.activeElement).not.toBe(input);
  });
});
