import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { KrnRadio, KrnRadioGroup } from './selection-controls';

@Component({
  imports: [KrnRadio],
  template: `
    <krn-radio checked id="free-plan" name="plan" value="free" (selected)="selections.push($event)">
      Free
    </krn-radio>
    <krn-radio id="pro-plan" name="plan" value="pro" (selected)="selections.push($event)">
      Pro
    </krn-radio>
  `,
})
class StandaloneRadioHost {
  readonly selections: string[] = [];
}

@Component({
  imports: [KrnRadio, KrnRadioGroup, ReactiveFormsModule],
  template: `
    <krn-radio-group [formControl]="control" [readonly]="readOnly()">
      <krn-radio value="monthly">Monthly</krn-radio>
      <krn-radio value="annual" (selected)="selections.push($event)">Annual</krn-radio>
    </krn-radio-group>
  `,
})
class RadioGroupHost {
  readonly control = new FormControl<string | null>('monthly');
  readonly readOnly = signal(true);
  readonly selections: string[] = [];
}

describe('KrnRadio', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('supports standalone checked state and native name exclusivity', async () => {
    const fixture = TestBed.createComponent(StandaloneRadioHost);
    await fixture.whenStable();
    const inputs = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>(
        'input[type="radio"]',
      ),
    ];

    expect(inputs.map((input) => input.checked)).toEqual([true, false]);
    inputs[1]!.click();
    await fixture.whenStable();

    expect(inputs.map((input) => input.checked)).toEqual([false, true]);
    expect(fixture.componentInstance.selections).toEqual(['pro']);

    inputs[0]!.click();
    await fixture.whenStable();
    expect(inputs.map((input) => input.checked)).toEqual([true, false]);
    expect(fixture.componentInstance.selections).toEqual(['pro', 'free']);

    inputs[0]!.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.selections).toEqual(['pro', 'free']);

    inputs[1]!.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.selections).toEqual(['pro', 'free', 'pro']);
  });

  it('preserves group selection when readonly and marks touched only on blur', async () => {
    const fixture = TestBed.createComponent(RadioGroupHost);
    await fixture.whenStable();
    const inputs = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>(
        'input[type="radio"]',
      ),
    ];

    inputs[1]!.click();
    await fixture.whenStable();
    expect(inputs.map((input) => input.checked)).toEqual([true, false]);
    expect(fixture.componentInstance.control.value).toBe('monthly');
    expect(fixture.componentInstance.selections).toEqual([]);

    fixture.componentInstance.readOnly.set(false);
    await fixture.whenStable();
    inputs[1]!.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.control.value).toBe('annual');
    expect(fixture.componentInstance.control.dirty).toBe(true);
    expect(fixture.componentInstance.control.touched).toBe(false);
    expect(fixture.componentInstance.selections).toEqual(['annual']);

    inputs[1]!.focus();
    inputs[1]!.blur();
    await fixture.whenStable();
    expect(fixture.componentInstance.control.touched).toBe(true);
  });

  it('keeps the native input as the only focus target and composes accessible references', async () => {
    const fixture = TestBed.createComponent(KrnRadio);
    fixture.componentRef.setInput('value', 'enterprise');
    fixture.componentRef.setInput('id', 'enterprise-plan');
    fixture.componentRef.setInput('ariaLabelledBy', 'external-label');
    fixture.componentRef.setInput('ariaDescribedBy', 'external-hint');
    fixture.componentRef.setInput('description', 'Includes audit exports');
    fixture.componentRef.setInput('tabindex', -1);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    const input = host.querySelector('input') as HTMLInputElement;

    expect(host.hasAttribute('id')).toBe(false);
    expect(host.hasAttribute('tabindex')).toBe(false);
    expect(input.id).toBe('enterprise-plan');
    expect(input.tabIndex).toBe(-1);
    expect(input.getAttribute('aria-labelledby')).toBe('external-label enterprise-plan-label');
    expect(input.getAttribute('aria-describedby')).toBe(
      'external-hint enterprise-plan-description',
    );
    expect(input.hasAttribute('aria-label')).toBe(false);

    fixture.componentInstance.focus();
    expect(document.activeElement).toBe(input);
    fixture.componentInstance.blur();
    expect(document.activeElement).not.toBe(input);
  });
});
