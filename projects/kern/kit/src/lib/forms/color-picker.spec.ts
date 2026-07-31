import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { KrnColorPicker } from './date-time-controls';
import { KrnFormField } from './form-field';

@Component({
  imports: [KrnColorPicker, KrnFormField],
  template: `
    <span id="external-color-label">External color name</span>
    <span id="external-color-help">External color help.</span>
    <krn-form-field label="Brand color" hint="Use the approved palette.">
      <krn-color-picker
        id="brand-color"
        ariaDescribedBy="external-color-help"
        ariaLabelledBy="external-color-label"
        tabindex="3"
        [disabled]="disabled()"
        [open]="open()"
        [readonly]="readOnly()"
        [value]="value()"
        (openChange)="open.set($event)"
        (valueChange)="value.set($event)"
      />
    </krn-form-field>
  `,
})
class ColorPickerHost {
  readonly disabled = signal(false);
  readonly open = signal(true);
  readonly readOnly = signal(false);
  readonly value = signal('#FFFF00');
  readonly picker = viewChild.required(KrnColorPicker);
}

const triggerFor = (root: HTMLElement): HTMLButtonElement => {
  const trigger = root.querySelector<HTMLButtonElement>('.krn-picker__trigger');
  if (!trigger) {
    throw new Error('Expected the Color Picker trigger.');
  }
  return trigger;
};

describe('KrnColorPicker', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('owns a canonical standalone value, supports controlled open, and deduplicates commits', async () => {
    const fixture = TestBed.createComponent(ColorPickerHost);
    await fixture.whenStable();
    const host = fixture.componentInstance;
    const component = host.picker();
    const valueChange = vi.fn();
    component.valueChange.subscribe(valueChange);
    const input = fixture.nativeElement.querySelector('.krn-color-text') as HTMLInputElement;
    const view = input.ownerDocument.defaultView!;

    expect(input.value).toBe('#ffff00');
    expect(input.ownerDocument.activeElement).toBe(input);

    input.value = '#FFFF00';
    input.dispatchEvent(new view.Event('input', { bubbles: true }));
    await fixture.whenStable();
    expect(valueChange).not.toHaveBeenCalled();

    input.value = '#112233';
    input.dispatchEvent(new view.Event('input', { bubbles: true }));
    await fixture.whenStable();
    expect(host.value()).toBe('#112233');
    expect(valueChange).toHaveBeenCalledOnce();
    expect(valueChange).toHaveBeenLastCalledWith('#112233');

    host.value.set('#ABCDEF');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(input.value).toBe('#abcdef');
    expect(valueChange).toHaveBeenCalledOnce();

    host.open.set(false);
    await fixture.whenStable();
    expect(triggerFor(fixture.nativeElement).getAttribute('aria-expanded')).toBe('false');
  });

  it('composes FormField and external semantics and forwards tab and focus contracts', async () => {
    const fixture = TestBed.createComponent(ColorPickerHost);
    fixture.componentInstance.open.set(false);
    await fixture.whenStable();
    const host = fixture.componentInstance;
    const component = host.picker();
    const trigger = triggerFor(fixture.nativeElement);

    expect(trigger.getAttribute('aria-label')).toBeNull();
    expect(trigger.getAttribute('aria-labelledby')).toBe(
      'external-color-label brand-color-field-label',
    );
    expect(trigger.getAttribute('aria-describedby')).toBe('external-color-help brand-color-hint');
    expect(trigger.tabIndex).toBe(3);

    component.focus({ preventScroll: true });
    expect(trigger.ownerDocument.activeElement).toBe(trigger);
    component.blur();
    expect(trigger.ownerDocument.activeElement).not.toBe(trigger);

    host.readOnly.set(true);
    await fixture.whenStable();
    expect(trigger.disabled).toBe(false);
    expect(trigger.getAttribute('aria-disabled')).toBe('true');
    expect(trigger.tabIndex).toBe(3);

    host.disabled.set(true);
    await fixture.whenStable();
    expect(trigger.disabled).toBe(true);
    expect(trigger.tabIndex).toBe(-1);
  });

  it('exposes the complete HSL color space and uses perceptual preview contrast', async () => {
    const fixture = TestBed.createComponent(ColorPickerHost);
    await fixture.whenStable();
    const host = fixture.componentInstance;
    const component = host.picker();
    const valueChange = vi.fn();
    component.valueChange.subscribe(valueChange);
    const lightness = fixture.nativeElement.querySelector(
      '.krn-color-range--lightness',
    ) as HTMLInputElement;
    const preview = fixture.nativeElement.querySelector('.krn-color-preview') as HTMLElement;
    const view = lightness.ownerDocument.defaultView!;

    expect(lightness.valueAsNumber).toBe(50);
    expect(preview.style.color).toBe('rgb(0, 0, 0)');

    lightness.value = '25';
    lightness.dispatchEvent(new view.Event('input', { bubbles: true }));
    await fixture.whenStable();
    expect(host.value()).toBe('#808000');
    expect(valueChange).toHaveBeenCalledOnce();
    expect(valueChange).toHaveBeenLastCalledWith('#808000');

    host.value.set('#757575');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(preview.style.color).toBe('rgb(255, 255, 255)');

    host.value.set('#767676');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(preview.style.color).toBe('rgb(0, 0, 0)');

    host.value.set('#000080');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(preview.style.color).toBe('rgb(255, 255, 255)');
  });

  it('validates canonical six-digit hexadecimal colors', async () => {
    const fixture = TestBed.createComponent(KrnColorPicker);
    await fixture.whenStable();
    const component = fixture.componentInstance;

    expect(component.validate(new FormControl('#112233'))).toBeNull();
    expect(component.validate(new FormControl('#AABBCC'))).toBeNull();
    expect(component.validate(new FormControl('#123'))).toEqual({ color: true });
    expect(component.validate(new FormControl('112233'))).toEqual({ color: true });
  });

  it('touches only after focus leaves the trigger and color-panel composite', async () => {
    const fixture = TestBed.createComponent(KrnColorPicker);
    fixture.componentInstance.writeValue('#4666da');
    const touched = vi.fn();
    fixture.componentInstance.registerOnTouched(touched);
    await fixture.whenStable();
    const component = fixture.componentInstance;
    const trigger = triggerFor(fixture.nativeElement);
    const view = trigger.ownerDocument.defaultView!;

    component.focus();
    trigger.click();
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector('.krn-color-text') as HTMLInputElement;
    expect(input.ownerDocument.activeElement).toBe(input);
    expect(touched).not.toHaveBeenCalled();

    input.dispatchEvent(
      new view.KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        key: 'Escape',
      }),
    );
    await fixture.whenStable();
    expect(trigger.ownerDocument.activeElement).toBe(trigger);
    expect(touched).not.toHaveBeenCalled();

    component.blur();
    expect(trigger.ownerDocument.activeElement).not.toBe(trigger);
    expect(touched).toHaveBeenCalledOnce();
  });
});
