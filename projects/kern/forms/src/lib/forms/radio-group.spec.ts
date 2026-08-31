import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { KrnRadio, KrnRadioGroup } from './selection-controls';

@Component({
  imports: [KrnRadio, KrnRadioGroup],
  template: `
    <krn-radio-group [value]="value()" (valueChange)="value.set($event)">
      <krn-radio value="monthly">Monthly</krn-radio>
      <krn-radio value="annual">Annual</krn-radio>
    </krn-radio-group>
  `,
})
class StandaloneRadioGroupHost {
  readonly value = signal<string | null>('annual');
  readonly group = viewChild.required(KrnRadioGroup);
}

@Component({
  imports: [KrnRadio, KrnRadioGroup, ReactiveFormsModule],
  template: `
    <krn-radio-group [value]="standaloneValue()" [formControl]="control">
      <krn-radio value="monthly">Monthly</krn-radio>
      <krn-radio value="annual">Annual</krn-radio>
    </krn-radio-group>
  `,
})
class AngularOwnedRadioGroupHost {
  readonly standaloneValue = signal<string | null>('monthly');
  readonly control = new FormControl<string | null>('annual');
}

@Component({
  imports: [KrnRadio, KrnRadioGroup],
  template: `
    <krn-radio-group
      id="plans"
      label="Plans"
      ariaLabelledBy="external-label"
      ariaDescribedBy="external-hint"
      describedBy="legacy-hint"
      [value]="value()"
    >
      <krn-radio disabled value="starter">Starter</krn-radio>
      <krn-radio value="pro">Pro</krn-radio>
      <krn-radio value="enterprise">Enterprise</krn-radio>
    </krn-radio-group>
  `,
})
class AccessibleRadioGroupHost {
  readonly value = signal<string | null>('enterprise');
  readonly group = viewChild.required(KrnRadioGroup);
}

describe('KrnRadioGroup', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('owns a standalone value and suppresses no-op emissions', async () => {
    const fixture = TestBed.createComponent(StandaloneRadioGroupHost);
    fixture.detectChanges();
    await fixture.whenStable();
    const group = fixture.componentInstance.group();
    const valueChange = vi.fn();
    group.valueChange.subscribe(valueChange);
    const inputs = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>(
        'input[type="radio"]',
      ),
    ];

    expect(inputs.map((input) => input.checked)).toEqual([false, true]);
    const { Event } = inputs[1]!.ownerDocument.defaultView!;
    inputs[1]!.dispatchEvent(new Event('change', { bubbles: true }));
    await fixture.whenStable();
    expect(valueChange).not.toHaveBeenCalled();

    inputs[0]!.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.value()).toBe('monthly');
    expect(valueChange).toHaveBeenCalledOnce();
  });

  it('keeps Angular Forms as owner when value APIs are mixed', async () => {
    const fixture = TestBed.createComponent(AngularOwnedRadioGroupHost);
    fixture.detectChanges();
    await fixture.whenStable();
    const host = fixture.componentInstance;
    const inputs = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>(
        'input[type="radio"]',
      ),
    ];

    expect(inputs.map((input) => input.checked)).toEqual([false, true]);
    host.standaloneValue.set(null);
    await fixture.whenStable();
    host.standaloneValue.set('monthly');
    await fixture.whenStable();
    expect(inputs.map((input) => input.checked)).toEqual([false, true]);
    expect(host.control.value).toBe('annual');
  });

  it('composes group ARIA references and focuses selected then first available option', async () => {
    const fixture = TestBed.createComponent(AccessibleRadioGroupHost);
    fixture.detectChanges();
    await fixture.whenStable();
    const group = fixture.componentInstance.group();
    const fieldset = fixture.nativeElement.querySelector('fieldset') as HTMLFieldSetElement;
    const inputs = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>(
        'input[type="radio"]',
      ),
    ];

    expect(fieldset.id).toBe('plans');
    expect(fieldset.getAttribute('role')).toBe('radiogroup');
    expect(fieldset.getAttribute('aria-labelledby')).toBe('external-label plans-legend');
    expect(fieldset.getAttribute('aria-describedby')).toBe('legacy-hint external-hint');
    expect(fieldset.hasAttribute('aria-label')).toBe(false);
    expect(fieldset.querySelector('legend')?.textContent?.trim()).toBe('Plans');

    group.focus();
    expect(inputs[2]!.ownerDocument.activeElement).toBe(inputs[2]);

    fixture.componentInstance.value.set(null);
    await fixture.whenStable();
    group.focus();
    expect(inputs[1]!.ownerDocument.activeElement).toBe(inputs[1]);
  });
});
