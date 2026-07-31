import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { KrnTextarea } from './text-inputs';

@Component({
  imports: [KrnTextarea, ReactiveFormsModule],
  template: `
    <krn-textarea
      ariaLabel="Summary"
      [maxLength]="4"
      [minLength]="2"
      [value]="standaloneValue()"
      [formControl]="control"
    />
  `,
})
class AngularOwnedTextareaHost {
  readonly standaloneValue = signal('Standalone');
  readonly control = new FormControl('Valid', { nonNullable: true });
}

describe('KrnTextarea', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    TestBed.resetTestingModule();
  });

  it('keeps Angular Forms as value owner and validates both length bounds without truncation', async () => {
    const fixture = TestBed.createComponent(AngularOwnedTextareaHost);
    await fixture.whenStable();
    const textarea = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
    const host = fixture.componentInstance;

    expect(textarea.value).toBe('Valid');

    host.standaloneValue.set('Ignored');
    await fixture.whenStable();
    expect(textarea.value).toBe('Valid');

    host.control.setValue('x');
    await fixture.whenStable();
    expect(textarea.value).toBe('x');
    expect(host.control.errors).toEqual({
      minlength: { requiredLength: 2, actualLength: 1 },
    });

    host.control.setValue('Longer');
    await fixture.whenStable();
    expect(textarea.value).toBe('Longer');
    expect(host.control.errors).toEqual({
      maxlength: { requiredLength: 4, actualLength: 6 },
    });
  });

  it('buffers IME composition and preserves complete Unicode values', async () => {
    const fixture = TestBed.createComponent(KrnTextarea);
    const onChange = vi.fn();
    const valueChange = vi.fn();
    fixture.componentInstance.registerOnChange(onChange);
    fixture.componentInstance.valueChange.subscribe(valueChange);
    fixture.componentRef.setInput('maxLength', 1);
    await fixture.whenStable();
    const textarea = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;

    textarea.dispatchEvent(new Event('compositionstart', { bubbles: true }));
    textarea.value = 'に';
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    expect(onChange).not.toHaveBeenCalled();

    textarea.value = '😀';
    textarea.dispatchEvent(new Event('compositionend', { bubbles: true }));
    textarea.dispatchEvent(new Event('input', { bubbles: true }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith('😀');
    expect(valueChange).toHaveBeenCalledTimes(1);
    expect(valueChange).toHaveBeenLastCalledWith('😀');
  });

  it('normalizes native constraints and composes explicit ARIA references', async () => {
    const fixture = TestBed.createComponent(KrnTextarea);
    fixture.componentRef.setInput('ariaLabel', 'Fallback label');
    fixture.componentRef.setInput('ariaLabelledBy', 'visible-label visible-label');
    fixture.componentRef.setInput('ariaDescribedBy', 'hint-one hint-two hint-one');
    fixture.componentRef.setInput('rows', 0);
    fixture.componentRef.setInput('minLength', 'invalid');
    fixture.componentRef.setInput('maxLength', -1);
    fixture.componentRef.setInput('spellcheck', false);
    await fixture.whenStable();
    const textarea = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;

    expect(textarea.getAttribute('aria-label')).toBeNull();
    expect(textarea.getAttribute('aria-labelledby')).toBe('visible-label');
    expect(textarea.getAttribute('aria-describedby')).toBe('hint-one hint-two');
    expect(textarea.rows).toBe(4);
    expect(textarea.hasAttribute('minlength')).toBe(false);
    expect(textarea.hasAttribute('maxlength')).toBe(false);
    expect(textarea.getAttribute('spellcheck')).toBe('false');
  });

  it('reacts to programmatic values when auto-resizing and restores native sizing when disabled', async () => {
    let resizeCallback: ResizeObserverCallback | undefined;
    const observe = vi.fn();
    const disconnect = vi.fn();
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: ResizeObserverCallback) {
          resizeCallback = callback;
        }

        observe = observe;
        disconnect = disconnect;
      },
    );
    const fixture = TestBed.createComponent(KrnTextarea);
    fixture.componentRef.setInput('autoResize', true);
    await fixture.whenStable();
    const textarea = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
    let scrollHeight = 120;
    Object.defineProperty(textarea, 'scrollHeight', {
      configurable: true,
      get: () => scrollHeight,
    });
    const resizeEntry = (width: number): ResizeObserverEntry =>
      ({ contentRect: { width }, target: textarea }) as unknown as ResizeObserverEntry;

    fixture.componentInstance.writeValue('A programmatic value');
    await fixture.whenStable();
    expect(textarea.style.height).toBe('120px');
    expect(observe).toHaveBeenCalledWith(textarea);

    scrollHeight = 180;
    resizeCallback?.([resizeEntry(320)], {} as ResizeObserver);
    expect(textarea.style.height).toBe('180px');

    scrollHeight = 220;
    resizeCallback?.([resizeEntry(320)], {} as ResizeObserver);
    expect(textarea.style.height).toBe('180px');

    resizeCallback?.([resizeEntry(240)], {} as ResizeObserver);
    expect(textarea.style.height).toBe('220px');

    fixture.componentRef.setInput('autoResize', false);
    await fixture.whenStable();
    expect(textarea.style.height).toBe('');
    expect(disconnect).toHaveBeenCalledOnce();
  });

  it('exposes native focus methods and focuses from its non-interactive shell', async () => {
    const fixture = TestBed.createComponent(KrnTextarea);
    fixture.componentRef.setInput('value', 'Initial');
    await fixture.whenStable();
    const textarea = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
    const shell = fixture.nativeElement.querySelector('.krn-control-shell') as HTMLElement;

    shell.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0 }));
    expect(textarea.ownerDocument.activeElement).toBe(textarea);

    const component = fixture.componentInstance;
    component.select();
    expect(textarea.selectionStart).toBe(0);
    expect(textarea.selectionEnd).toBe('Initial'.length);

    component.blur();
    expect(textarea.ownerDocument.activeElement).not.toBe(textarea);
  });
});
