import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KrnSlider } from './range-controls';

@Component({
  imports: [KrnSlider],
  template: `
    <krn-slider
      id="risk"
      label="Risk"
      name="risk-level"
      tabindex="3"
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
class SliderHost {
  readonly disabled = signal(false);
  readonly max = signal(20);
  readonly min = signal(-10);
  readonly readOnly = signal(false);
  readonly step = signal(5);
  readonly value = signal(5);
  readonly slider = viewChild.required(KrnSlider);
  readonly formatValue = (value: number): string => `${value} points`;
}

describe('KrnSlider', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('normalizes its native range contract and keeps progress finite and bounded', async () => {
    const fixture = TestBed.createComponent(SliderHost);
    await fixture.whenStable();
    const host = fixture.componentInstance;
    const range = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const root = fixture.nativeElement.querySelector('.krn-slider') as HTMLElement;

    expect(range.min).toBe('-10');
    expect(range.max).toBe('20');
    expect(range.step).toBe('5');
    expect(range.value).toBe('5');
    expect(root.style.getPropertyValue('--krn-slider-progress')).toBe('50%');

    host.min.set(10);
    host.max.set(5);
    host.step.set(0);
    await fixture.whenStable();

    expect(range.min).toBe('10');
    expect(range.max).toBe('10');
    expect(range.step).toBe('1');
    expect(range.value).toBe('10');
    expect(root.style.getPropertyValue('--krn-slider-progress')).toBe('0%');
  });

  it('emits only accepted user changes and prevents readonly interactions', async () => {
    const fixture = TestBed.createComponent(SliderHost);
    await fixture.whenStable();
    const host = fixture.componentInstance;
    const component = host.slider();
    const range = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const valueChange = vi.fn();
    component.valueChange.subscribe(valueChange);
    const view = range.ownerDocument.defaultView!;

    range.value = '5';
    range.dispatchEvent(new view.Event('input', { bubbles: true }));
    expect(valueChange).not.toHaveBeenCalled();

    range.value = '10';
    range.dispatchEvent(new view.Event('input', { bubbles: true }));
    expect(host.value()).toBe(10);
    expect(valueChange).toHaveBeenCalledOnce();
    expect(valueChange).toHaveBeenLastCalledWith(10);

    host.readOnly.set(true);
    await fixture.whenStable();
    const keydown = new view.KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'ArrowRight',
    });
    range.dispatchEvent(keydown);
    expect(keydown.defaultPrevented).toBe(true);

    const pointerdown = new view.MouseEvent('pointerdown', {
      bubbles: true,
      button: 0,
      cancelable: true,
    });
    range.dispatchEvent(pointerdown);
    expect(pointerdown.defaultPrevented).toBe(true);
    expect(range.ownerDocument.activeElement).toBe(range);

    range.value = '15';
    range.dispatchEvent(new view.Event('input', { bubbles: true }));
    expect(range.value).toBe('10');
    expect(host.value()).toBe(10);
    expect(valueChange).toHaveBeenCalledOnce();
  });

  it('forwards native form and focus contracts with an accessible formatted value', async () => {
    const fixture = TestBed.createComponent(SliderHost);
    await fixture.whenStable();
    const host = fixture.componentInstance;
    const component = host.slider();
    const range = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const output = fixture.nativeElement.querySelector('output') as HTMLOutputElement;

    expect(range.name).toBe('risk-level');
    expect(range.tabIndex).toBe(3);
    expect(range.getAttribute('aria-labelledby')).toBe('risk-label');
    expect(range.getAttribute('aria-valuetext')).toBe('5 points');
    expect(output.getAttribute('for')).toBe('risk');
    expect(output.textContent).toBe('5 points');

    component.focus({ preventScroll: true });
    expect(range.ownerDocument.activeElement).toBe(range);
    component.blur();
    expect(range.ownerDocument.activeElement).not.toBe(range);

    host.disabled.set(true);
    await fixture.whenStable();
    expect(range.disabled).toBe(true);
    expect(range.tabIndex).toBe(-1);
  });
});
