import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { KrnCheckbox } from './selection-controls';

@Component({
  imports: [KrnCheckbox],
  template: `
    <krn-checkbox [checked]="checked()" (checkedChange)="checked.set($event)">
      Receive policy updates
    </krn-checkbox>
  `,
})
class StandaloneCheckboxHost {
  readonly checked = signal(true);
}

@Component({
  imports: [KrnCheckbox, ReactiveFormsModule],
  template: `<krn-checkbox [checked]="standaloneChecked()" [formControl]="control">
    Confirm policy
  </krn-checkbox>`,
})
class AngularOwnedCheckboxHost {
  readonly standaloneChecked = signal(true);
  readonly control = new FormControl(false, { nonNullable: true });
}

@Component({
  imports: [KrnCheckbox, ReactiveFormsModule],
  template: `<krn-checkbox [formControl]="control">Automatic renewal</krn-checkbox>`,
})
class NullableCheckboxHost {
  readonly control = new FormControl<boolean | null>(null);
}

describe('KrnCheckbox', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('supports standalone checked ownership and emits only accepted user changes', async () => {
    const fixture = TestBed.createComponent(StandaloneCheckboxHost);
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    expect(input.checked).toBe(true);
    input.click();
    await fixture.whenStable();

    expect(fixture.componentInstance.checked()).toBe(false);
    expect(input.checked).toBe(false);
  });

  it('keeps Angular Forms as owner when checked APIs are mixed', async () => {
    const fixture = TestBed.createComponent(AngularOwnedCheckboxHost);
    await fixture.whenStable();
    const host = fixture.componentInstance;
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    expect(input.checked).toBe(false);
    host.standaloneChecked.set(false);
    await fixture.whenStable();
    host.standaloneChecked.set(true);
    await fixture.whenStable();
    expect(input.checked).toBe(false);

    input.click();
    await fixture.whenStable();
    expect(host.control.value).toBe(true);
  });

  it('uses a nullable Angular Forms value as the canonical indeterminate state', async () => {
    const fixture = TestBed.createComponent(NullableCheckboxHost);
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    expect(input.checked).toBe(false);
    expect(input.indeterminate).toBe(true);
    expect(input.getAttribute('aria-checked')).toBe('mixed');

    input.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.control.value).toBe(true);
    expect(input.indeterminate).toBe(false);
    expect(input.hasAttribute('aria-checked')).toBe(false);
  });

  it('clears indeterminate on an accepted click and restores it in readonly state', async () => {
    const fixture = TestBed.createComponent(KrnCheckbox);
    const checkedChange = vi.fn();
    const indeterminateChange = vi.fn();
    fixture.componentInstance.checkedChange.subscribe(checkedChange);
    fixture.componentInstance.indeterminateChange.subscribe(indeterminateChange);
    fixture.componentRef.setInput('indeterminate', true);
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    expect(input.indeterminate).toBe(true);
    input.click();
    await fixture.whenStable();
    expect(input.checked).toBe(true);
    expect(input.indeterminate).toBe(false);
    expect(checkedChange).toHaveBeenCalledOnce();
    expect(indeterminateChange).toHaveBeenCalledWith(false);

    fixture.componentRef.setInput('indeterminate', false);
    await fixture.whenStable();
    fixture.componentRef.setInput('indeterminate', true);
    fixture.componentRef.setInput('readonly', true);
    await fixture.whenStable();
    input.click();
    await fixture.whenStable();
    expect(input.checked).toBe(true);
    expect(input.indeterminate).toBe(true);
    expect(checkedChange).toHaveBeenCalledOnce();
  });

  it('keeps the native input as the only focus target and composes accessible references', async () => {
    const fixture = TestBed.createComponent(KrnCheckbox);
    fixture.componentRef.setInput('id', 'policy');
    fixture.componentRef.setInput('ariaLabelledBy', 'external-label');
    fixture.componentRef.setInput('ariaDescribedBy', 'external-hint');
    fixture.componentRef.setInput('description', 'Required for audit notifications');
    fixture.componentRef.setInput('tabindex', -1);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    const input = host.querySelector('input') as HTMLInputElement;

    expect(host.hasAttribute('tabindex')).toBe(false);
    expect(input.tabIndex).toBe(-1);
    expect(input.getAttribute('aria-labelledby')).toBe('external-label policy-label');
    expect(input.getAttribute('aria-describedby')).toBe('external-hint policy-description');
    expect(input.hasAttribute('aria-label')).toBe(false);

    fixture.componentInstance.focus();
    expect(document.activeElement).toBe(input);
    fixture.componentInstance.blur();
    expect(document.activeElement).not.toBe(input);
  });
});
