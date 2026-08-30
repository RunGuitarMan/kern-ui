import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { KrnTextInput } from './text-inputs';

@Component({
  imports: [KrnTextInput],
  template: `
    <krn-text-input ariaLabel="Amount" value="120">
      <span krnPrefix>$</span>
    </krn-text-input>
  `,
})
class AffixedTextInputHost {}

@Component({
  imports: [KrnTextInput, ReactiveFormsModule],
  template: `<krn-text-input [value]="standaloneValue()" [formControl]="control" />`,
})
class AngularOwnedTextInputHost {
  readonly standaloneValue = signal('Standalone');
  readonly control = new FormControl('Angular', { nonNullable: true });
}

describe('KrnTextInput', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('supports deterministic standalone value ownership and emits only accepted changes', async () => {
    const fixture = TestBed.createComponent(KrnTextInput);
    const valueChange = vi.fn();
    fixture.componentInstance.valueChange.subscribe(valueChange);
    fixture.componentRef.setInput('value', 'Initial');
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    expect(input.value).toBe('Initial');

    input.dispatchEvent(new input.ownerDocument.defaultView!.Event('input'));
    input.value = 'Updated';
    input.dispatchEvent(new input.ownerDocument.defaultView!.Event('input'));
    await fixture.whenStable();

    expect(valueChange).toHaveBeenCalledTimes(1);
    expect(valueChange).toHaveBeenLastCalledWith('Updated');

    fixture.componentRef.setInput('value', 'External');
    await fixture.whenStable();
    expect(input.value).toBe('External');
  });

  it('keeps Angular Forms as the deterministic owner when value APIs are mixed', async () => {
    const fixture = TestBed.createComponent(AngularOwnedTextInputHost);
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    expect(input.value).toBe('Angular');

    fixture.componentInstance.standaloneValue.set('Ignored');
    await fixture.whenStable();
    expect(input.value).toBe('Angular');

    fixture.componentInstance.control.setValue('Model update');
    await fixture.whenStable();
    expect(input.value).toBe('Model update');
  });

  it('buffers IME composition and avoids the trailing duplicate input event', async () => {
    const fixture = TestBed.createComponent(KrnTextInput);
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

  it('merges explicit ARIA references, ignores invalid limits, and exposes native focus methods', async () => {
    const fixture = TestBed.createComponent(KrnTextInput);
    fixture.componentRef.setInput('ariaLabel', 'Fallback label');
    fixture.componentRef.setInput('ariaLabelledBy', 'visible-label visible-label');
    fixture.componentRef.setInput('ariaDescribedBy', 'hint-one hint-two hint-one');
    fixture.componentRef.setInput('maxLength', 'not-a-number');
    fixture.componentRef.setInput('value', 'Selectable');
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    expect(input.getAttribute('aria-label')).toBeNull();
    expect(input.getAttribute('aria-labelledby')).toBe('visible-label');
    expect(input.getAttribute('aria-describedby')).toBe('hint-one hint-two');
    expect(input.hasAttribute('maxlength')).toBe(false);

    fixture.componentInstance.focus();
    fixture.componentInstance.select();
    expect(input.ownerDocument.activeElement).toBe(input);
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe('Selectable'.length);

    fixture.componentInstance.blur();
    expect(input.ownerDocument.activeElement).not.toBe(input);
  });

  it('focuses the input from a non-interactive affix', async () => {
    const fixture = TestBed.createComponent(AffixedTextInputHost);
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const prefix = fixture.nativeElement.querySelector('[krnPrefix]') as HTMLElement;

    const { MouseEvent } = prefix.ownerDocument.defaultView!;
    prefix.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0 }));

    expect(input.ownerDocument.activeElement).toBe(input);
  });
});
