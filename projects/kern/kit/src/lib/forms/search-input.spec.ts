import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { provideKrn } from '@kern-ui/angular/core';
import { KrnSearchInput } from './text-inputs';

@Component({
  imports: [KrnSearchInput, ReactiveFormsModule],
  template: `
    <krn-search-input
      required
      [formControl]="control"
      [maxLength]="6"
      [minLength]="3"
      [value]="standaloneValue()"
    />
  `,
})
class AngularOwnedSearchHost {
  readonly standaloneValue = signal('Standalone');
  readonly control = new FormControl('Find', { nonNullable: true });
}

describe('KrnSearchInput', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideKrn()],
    });
  });

  afterEach(() => TestBed.resetTestingModule());

  it('keeps Angular Forms as value owner and validates search constraints', async () => {
    const fixture = TestBed.createComponent(AngularOwnedSearchHost);
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const host = fixture.componentInstance;

    expect(input.value).toBe('Find');
    expect(input.required).toBe(true);

    host.standaloneValue.set('Ignored');
    await fixture.whenStable();
    expect(input.value).toBe('Find');

    host.control.setValue('');
    await fixture.whenStable();
    expect(host.control.errors).toMatchObject({ required: true });

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

  it('buffers IME input and only submits a completed query', async () => {
    const fixture = TestBed.createComponent(KrnSearchInput);
    const onChange = vi.fn();
    const valueChange = vi.fn();
    const submitted = vi.fn();
    fixture.componentInstance.registerOnChange(onChange);
    fixture.componentInstance.valueChange.subscribe(valueChange);
    fixture.componentInstance.searchSubmitted.subscribe(submitted);
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    input.dispatchEvent(new Event('compositionstart', { bubbles: true }));
    input.value = '東';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, isComposing: true, key: 'Enter' }),
    );

    expect(onChange).not.toHaveBeenCalled();
    expect(submitted).not.toHaveBeenCalled();

    input.value = '東京';
    input.dispatchEvent(new Event('compositionend', { bubbles: true }));
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith('東京');
    expect(valueChange).toHaveBeenCalledTimes(1);
    expect(submitted).toHaveBeenCalledTimes(1);
    expect(submitted).toHaveBeenLastCalledWith('東京');
  });

  it('clears without submitting and keeps the search input focused', async () => {
    const fixture = TestBed.createComponent(KrnSearchInput);
    const onChange = vi.fn();
    const valueChange = vi.fn();
    const submitted = vi.fn();
    fixture.componentInstance.registerOnChange(onChange);
    fixture.componentInstance.valueChange.subscribe(valueChange);
    fixture.componentInstance.searchSubmitted.subscribe(submitted);
    fixture.componentRef.setInput('id', 'workspace-search');
    fixture.componentInstance.writeValue('navigation');
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const clear = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    fixture.componentInstance.focus();
    clear.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0 }));
    expect(clear.tabIndex).toBe(-1);
    expect(clear.getAttribute('aria-controls')).toBe('workspace-search');
    clear.click();
    await fixture.whenStable();

    expect(input.value).toBe('');
    expect(input.ownerDocument.activeElement).toBe(input);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith('');
    expect(valueChange).toHaveBeenCalledTimes(1);
    expect(submitted).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
  });

  it('composes ARIA references and normalizes optional native attributes', async () => {
    const fixture = TestBed.createComponent(KrnSearchInput);
    fixture.componentRef.setInput('ariaLabel', 'Fallback search');
    fixture.componentRef.setInput('ariaLabelledBy', 'search-label search-label');
    fixture.componentRef.setInput('ariaDescribedBy', 'hint-one hint-two hint-one');
    fixture.componentRef.setInput('autocomplete', '');
    fixture.componentRef.setInput('enterKeyHint', '');
    fixture.componentRef.setInput('maxLength', -1);
    fixture.componentRef.setInput('minLength', 'invalid');
    fixture.componentRef.setInput('spellcheck', false);
    await fixture.whenStable();
    const shell = fixture.nativeElement.querySelector('.krn-control-shell') as HTMLElement;
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    expect(shell.hasAttribute('role')).toBe(false);
    expect(input.type).toBe('search');
    expect(input.getAttribute('aria-label')).toBeNull();
    expect(input.getAttribute('aria-labelledby')).toBe('search-label');
    expect(input.getAttribute('aria-describedby')).toBe('hint-one hint-two');
    expect(input.hasAttribute('autocomplete')).toBe(false);
    expect(input.hasAttribute('enterkeyhint')).toBe(false);
    expect(input.hasAttribute('maxlength')).toBe(false);
    expect(input.hasAttribute('minlength')).toBe(false);
    expect(input.getAttribute('spellcheck')).toBe('false');
  });

  it('exposes native focus and selection methods and focuses from its shell', async () => {
    const fixture = TestBed.createComponent(KrnSearchInput);
    fixture.componentRef.setInput('value', 'navigation');
    await fixture.whenStable();
    const shell = fixture.nativeElement.querySelector('.krn-control-shell') as HTMLElement;
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    shell.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0 }));
    expect(input.ownerDocument.activeElement).toBe(input);

    fixture.componentInstance.select();
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe('navigation'.length);

    fixture.componentInstance.blur();
    expect(input.ownerDocument.activeElement).not.toBe(input);
  });
});
