import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { KrnAutocompleteMode, KrnOptionFilter } from './form-types';
import { KrnAutocomplete } from './select-controls';

const options = [
  { value: 'alpha', label: 'Alpha' },
  { value: 'beta', label: 'Beta' },
] as const;

@Component({
  imports: [KrnAutocomplete],
  template: `
    <krn-autocomplete
      [autocompleteMode]="mode()"
      [options]="options"
      [value]="value()"
      (valueChange)="value.set($event)"
    />
  `,
})
class AutocompleteHost {
  readonly mode = signal<KrnAutocompleteMode>('both');
  readonly options = options;
  readonly value = signal('alpha');
  readonly autocomplete = viewChild.required(KrnAutocomplete);
}

describe('KrnAutocomplete', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('keeps free text controlled without duplicate semantic commits', async () => {
    const fixture = TestBed.createComponent(AutocompleteHost);
    fixture.detectChanges();
    await fixture.whenStable();
    const host = fixture.componentInstance;
    const autocomplete = host.autocomplete();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const queryChange = vi.fn();
    const valueChange = vi.fn();
    autocomplete.queryChange.subscribe(queryChange);
    autocomplete.valueChange.subscribe(valueChange);

    expect(input.value).toBe('Alpha');
    input.focus();
    input.value = 'alpha';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    expect(queryChange).toHaveBeenLastCalledWith('alpha');
    expect(valueChange).not.toHaveBeenCalled();

    input.blur();
    await fixture.whenStable();
    expect(input.value).toBe('Alpha');
    expect(host.value()).toBe('alpha');
    expect(valueChange).not.toHaveBeenCalled();

    input.focus();
    input.value = 'Custom account';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(host.value()).toBe('Custom account');
    expect(valueChange).toHaveBeenCalledOnce();
    expect(valueChange).toHaveBeenCalledWith('Custom account');
  });

  it('implements inline and none modes without exposing a list popup', async () => {
    const fixture = TestBed.createComponent(AutocompleteHost);
    fixture.componentInstance.mode.set('inline');
    fixture.componentInstance.value.set('');
    fixture.detectChanges();
    await fixture.whenStable();
    const host = fixture.componentInstance;
    const autocomplete = host.autocomplete();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const optionSelected = vi.fn();
    autocomplete.optionSelected.subscribe(optionSelected);
    const typeInlinePrefix = async (): Promise<void> => {
      input.value = 'Al';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await fixture.whenStable();
    };

    expect(input.getAttribute('aria-autocomplete')).toBe('inline');
    expect(fixture.nativeElement.querySelector('.krn-combobox-toggle')).toBeNull();
    input.focus();
    input.click();
    await fixture.whenStable();
    expect(input.value).toBe('');
    expect(autocomplete.open()).toBe(false);
    expect(fixture.nativeElement.querySelector('[role="listbox"]')).toBeNull();

    await typeInlinePrefix();
    expect(host.value()).toBe('Al');
    expect(input.value).toBe('Alpha');
    expect(input.selectionStart).toBe(2);
    expect(input.selectionEnd).toBe(5);
    expect(autocomplete.open()).toBe(false);
    for (const key of ['ArrowLeft', 'Home']) {
      const event = new KeyboardEvent('keydown', {
        key,
        bubbles: true,
        cancelable: true,
      });
      input.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(false);
    }
    for (const key of ['ArrowRight', 'End']) {
      const keydown = new KeyboardEvent('keydown', {
        key,
        bubbles: true,
        cancelable: true,
      });
      input.dispatchEvent(keydown);
      expect(keydown.defaultPrevented).toBe(false);
      input.setSelectionRange(input.value.length, input.value.length);
      input.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }));
      await fixture.whenStable();
      expect(host.value()).toBe('alpha');
      expect(input.value).toBe('Alpha');
      await typeInlinePrefix();
    }
    const enter = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true,
    });
    input.dispatchEvent(enter);
    await fixture.whenStable();
    expect(enter.defaultPrevented).toBe(false);
    expect(host.value()).toBe('alpha');
    expect(input.value).toBe('Alpha');
    expect(optionSelected).toHaveBeenCalledTimes(3);
    expect(optionSelected).toHaveBeenLastCalledWith(options[0]);

    optionSelected.mockClear();
    input.value = 'Custom account';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    input.value = 'Alpha';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    expect(host.value()).toBe('Alpha');
    input.setSelectionRange(input.value.length, input.value.length);
    input.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowRight', bubbles: true }));
    await fixture.whenStable();
    expect(host.value()).toBe('Alpha');
    expect(optionSelected).not.toHaveBeenCalled();

    host.mode.set('none');
    await fixture.whenStable();
    expect(input.getAttribute('aria-autocomplete')).toBe('none');
    input.value = 'B';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    expect(input.value).toBe('B');
    expect(fixture.nativeElement.querySelector('[role="listbox"]')).toBeNull();

    autocomplete.open.set(true);
    await fixture.whenStable();
    expect(autocomplete.open()).toBe(false);
  });

  it('derives inline completion only from effective filtered options', async () => {
    const fixture = TestBed.createComponent(KrnAutocomplete);
    const betaOnly: KrnOptionFilter<string> = (option) => option.value === 'beta';
    fixture.componentRef.setInput('options', options);
    fixture.componentRef.setInput('optionFilter', betaOnly);
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    input.focus();
    input.value = 'B';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    expect(input.getAttribute('aria-autocomplete')).toBe('both');
    expect(input.value).toBe('Beta');

    input.value = 'A';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    expect(input.getAttribute('aria-autocomplete')).toBe('both');
    expect(input.value).toBe('A');
    const renderedOptions = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('[role="option"]'),
    ];
    expect(renderedOptions).toHaveLength(1);
    expect(renderedOptions[0]?.textContent).toContain('Beta');
  });
});
