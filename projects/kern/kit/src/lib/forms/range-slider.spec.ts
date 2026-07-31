import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { KrnRangeValue } from './form-types';
import { KrnRangeSlider } from './range-controls';

@Component({
  imports: [KrnRangeSlider],
  template: `
    <krn-range-slider
      id="price-range"
      label="Price range"
      tabindex="4"
      [disabled]="disabled()"
      [max]="max()"
      [min]="min()"
      [readonly]="readOnly()"
      [step]="step()"
      [value]="value()"
      [valueFormatter]="formatValue"
      (valueChange)="value.set($event)"
    />
  `,
})
class RangeSliderHost {
  readonly disabled = signal(false);
  readonly max = signal(100);
  readonly min = signal(0);
  readonly readOnly = signal(false);
  readonly step = signal(5);
  readonly value = signal<KrnRangeValue>({ start: 20, end: 80 });
  readonly slider = viewChild.required(KrnRangeSlider);
  readonly formatValue = (value: number): string => `${value} units`;
}

describe('KrnRangeSlider', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('owns a standalone range and emits only accepted structural changes', async () => {
    const fixture = TestBed.createComponent(RangeSliderHost);
    await fixture.whenStable();
    const host = fixture.componentInstance;
    const component = host.slider();
    const inputs = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>('input'),
    ];
    const output = fixture.nativeElement.querySelector('output') as HTMLOutputElement;
    const valueChange = vi.fn();
    component.valueChange.subscribe(valueChange);
    const view = inputs[0]!.ownerDocument.defaultView!;

    expect(inputs.map((input) => input.value)).toEqual(['20', '80']);
    expect(inputs.map((input) => input.tabIndex)).toEqual([4, 4]);
    expect(inputs.map((input) => input.getAttribute('aria-valuetext'))).toEqual([
      '20 units',
      '80 units',
    ]);
    expect(output.textContent).toContain('20 units – 80 units');

    inputs[0]!.value = '20';
    inputs[0]!.dispatchEvent(new view.Event('input', { bubbles: true }));
    expect(valueChange).not.toHaveBeenCalled();

    inputs[0]!.value = '35';
    inputs[0]!.dispatchEvent(new view.Event('input', { bubbles: true }));
    expect(host.value()).toEqual({ start: 35, end: 80 });
    expect(valueChange).toHaveBeenCalledOnce();

    inputs[0]!.dispatchEvent(new view.Event('input', { bubbles: true }));
    expect(valueChange).toHaveBeenCalledOnce();

    host.disabled.set(true);
    await fixture.whenStable();
    expect(inputs.map((input) => input.tabIndex)).toEqual([-1, -1]);
  });

  it('normalizes invalid constraints and preserves exponential-step pointer precision', async () => {
    const fixture = TestBed.createComponent(RangeSliderHost);
    const host = fixture.componentInstance;
    host.min.set(10);
    host.max.set(5);
    host.step.set(0);
    await fixture.whenStable();
    const component = host.slider();
    const group = fixture.nativeElement.querySelector('.krn-range-pair') as HTMLElement;
    const surface = fixture.nativeElement.querySelector('.krn-dual-range') as HTMLElement;
    const inputs = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>('input'),
    ];

    expect(inputs.map((input) => [input.min, input.max, input.step, input.value])).toEqual([
      ['10', '10', '1', '10'],
      ['10', '10', '1', '10'],
    ]);
    expect(group.style.getPropertyValue('--krn-range-start')).toBe('0%');
    expect(group.style.getPropertyValue('--krn-range-end')).toBe('0%');

    host.min.set(0);
    host.max.set(0.000001);
    host.step.set(0.0000001);
    host.value.set({ start: 0, end: 0.000001 });
    await fixture.whenStable();
    const valueChange = vi.fn();
    component.valueChange.subscribe(valueChange);
    vi.spyOn(surface, 'getBoundingClientRect').mockReturnValue({
      bottom: 32,
      height: 32,
      left: 0,
      right: 200,
      top: 0,
      width: 200,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    const view = surface.ownerDocument.defaultView!;

    surface.dispatchEvent(
      new view.MouseEvent('pointerdown', {
        bubbles: true,
        button: 0,
        cancelable: true,
        clientX: 100,
      }),
    );
    await fixture.whenStable();
    expect(host.value()).toEqual({ start: 0, end: 0.0000005 });
    expect(valueChange).toHaveBeenLastCalledWith({ start: 0, end: 0.0000005 });
    expect(group.style.getPropertyValue('--krn-range-end')).toBe('50%');
  });

  it('keeps readonly thumbs focusable while preventing keyboard, pointer, and input changes', async () => {
    const fixture = TestBed.createComponent(RangeSliderHost);
    await fixture.whenStable();
    const host = fixture.componentInstance;
    const component = host.slider();
    const surface = fixture.nativeElement.querySelector('.krn-dual-range') as HTMLElement;
    const inputs = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>('input'),
    ];
    const valueChange = vi.fn();
    component.valueChange.subscribe(valueChange);
    const view = surface.ownerDocument.defaultView!;
    vi.spyOn(surface, 'getBoundingClientRect').mockReturnValue({
      bottom: 32,
      height: 32,
      left: 0,
      right: 200,
      top: 0,
      width: 200,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    host.readOnly.set(true);
    await fixture.whenStable();
    const keydown = new view.KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'ArrowRight',
    });
    inputs[0]!.dispatchEvent(keydown);
    expect(keydown.defaultPrevented).toBe(true);

    const pointerdown = new view.MouseEvent('pointerdown', {
      bubbles: true,
      button: 0,
      cancelable: true,
      clientX: 160,
    });
    surface.dispatchEvent(pointerdown);
    expect(pointerdown.defaultPrevented).toBe(true);
    expect(surface.ownerDocument.activeElement).toBe(inputs[1]);
    expect(surface.getAttribute('data-dragging')).toBe('false');

    inputs[0]!.value = '45';
    inputs[0]!.dispatchEvent(new view.Event('input', { bubbles: true }));
    expect(inputs[0]!.value).toBe('20');
    expect(host.value()).toEqual({ start: 20, end: 80 });
    expect(valueChange).not.toHaveBeenCalled();

    host.readOnly.set(false);
    await fixture.whenStable();
    const secondaryPointer = new view.MouseEvent('pointerdown', {
      bubbles: true,
      button: 2,
      cancelable: true,
      clientX: 40,
    });
    surface.dispatchEvent(secondaryPointer);
    expect(secondaryPointer.defaultPrevented).toBe(false);
    expect(valueChange).not.toHaveBeenCalled();
  });

  it('touches only after focus leaves both thumbs and forwards public focus methods', async () => {
    const fixture = TestBed.createComponent(KrnRangeSlider);
    fixture.componentInstance.writeValue({ start: 20, end: 80 });
    const touched = vi.fn();
    fixture.componentInstance.registerOnTouched(touched);
    await fixture.whenStable();
    const component = fixture.componentInstance;
    const inputs = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>('input'),
    ];
    const surface = fixture.nativeElement.querySelector('.krn-dual-range') as HTMLElement;
    const view = surface.ownerDocument.defaultView!;
    vi.spyOn(surface, 'getBoundingClientRect').mockReturnValue({
      bottom: 32,
      height: 32,
      left: 0,
      right: 200,
      top: 0,
      width: 200,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    component.focus({ preventScroll: true });
    expect(inputs[0]!.ownerDocument.activeElement).toBe(inputs[1]);

    inputs[0]!.focus();
    inputs[1]!.focus();
    expect(touched).not.toHaveBeenCalled();

    surface.dispatchEvent(
      new view.MouseEvent('pointerdown', {
        bubbles: true,
        button: 0,
        cancelable: true,
        clientX: 160,
      }),
    );
    surface.dispatchEvent(
      new view.MouseEvent('pointerup', {
        bubbles: true,
        button: 0,
        cancelable: true,
        clientX: 160,
      }),
    );
    expect(touched).not.toHaveBeenCalled();

    component.blur();
    expect(inputs[0]!.ownerDocument.activeElement).not.toBe(inputs[1]);
    expect(touched).toHaveBeenCalledOnce();
  });
});
