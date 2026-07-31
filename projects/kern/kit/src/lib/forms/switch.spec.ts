import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { KrnSwitch } from './selection-controls';

@Component({
  imports: [KrnSwitch],
  template: `
    <krn-switch
      [checked]="checked()"
      [readonly]="readOnly()"
      (checkedChange)="acceptChange($event)"
    >
      Product updates
    </krn-switch>
  `,
})
class StandaloneSwitchHost {
  readonly checked = signal(true);
  readonly readOnly = signal(false);
  readonly changes: boolean[] = [];

  acceptChange(checked: boolean): void {
    this.changes.push(checked);
    this.checked.set(checked);
  }
}

@Component({
  imports: [KrnSwitch, ReactiveFormsModule],
  template: `<krn-switch [checked]="standaloneChecked()" [formControl]="control">
    Audit alerts
  </krn-switch>`,
})
class AngularOwnedSwitchHost {
  readonly standaloneChecked = signal(true);
  readonly control = new FormControl(false, { nonNullable: true });
}

describe('KrnSwitch', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('owns standalone checked state and emits only accepted changes', async () => {
    const fixture = TestBed.createComponent(StandaloneSwitchHost);
    await fixture.whenStable();
    const host = fixture.componentInstance;
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    expect(input.checked).toBe(true);
    input.click();
    await fixture.whenStable();
    expect(host.checked()).toBe(false);
    expect(host.changes).toEqual([false]);

    input.dispatchEvent(new Event('change', { bubbles: true }));
    await fixture.whenStable();
    expect(host.changes).toEqual([false]);

    host.readOnly.set(true);
    await fixture.whenStable();
    input.click();
    await fixture.whenStable();
    expect(input.checked).toBe(false);
    expect(host.changes).toEqual([false]);
    expect(input.getAttribute('aria-disabled')).toBe('true');
  });

  it('keeps Angular Forms as owner and marks touched only on blur', async () => {
    const fixture = TestBed.createComponent(AngularOwnedSwitchHost);
    await fixture.whenStable();
    const host = fixture.componentInstance;
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    expect(input.checked).toBe(false);
    host.standaloneChecked.set(false);
    await fixture.whenStable();
    host.standaloneChecked.set(true);
    await fixture.whenStable();
    expect(input.checked).toBe(false);

    input.focus();
    input.click();
    await fixture.whenStable();
    expect(host.control.value).toBe(true);
    expect(host.control.dirty).toBe(true);
    expect(host.control.touched).toBe(false);

    input.blur();
    await fixture.whenStable();
    expect(host.control.touched).toBe(true);
  });

  it('keeps the native input as the only focus target and composes accessible references', async () => {
    const fixture = TestBed.createComponent(KrnSwitch);
    fixture.componentRef.setInput('id', 'audit-alerts');
    fixture.componentRef.setInput('ariaLabelledBy', 'external-label');
    fixture.componentRef.setInput('ariaDescribedBy', 'external-hint');
    fixture.componentRef.setInput('description', 'Sent after policy changes');
    fixture.componentRef.setInput('tabindex', -1);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    const input = host.querySelector('input') as HTMLInputElement;

    expect(host.hasAttribute('id')).toBe(false);
    expect(host.hasAttribute('tabindex')).toBe(false);
    expect(input.id).toBe('audit-alerts');
    expect(input.tabIndex).toBe(-1);
    expect(input.getAttribute('role')).toBe('switch');
    expect(input.getAttribute('aria-labelledby')).toBe('external-label audit-alerts-label');
    expect(input.getAttribute('aria-describedby')).toBe('external-hint audit-alerts-description');
    expect(input.hasAttribute('aria-label')).toBe(false);

    fixture.componentInstance.focus();
    expect(document.activeElement).toBe(input);
    fixture.componentInstance.blur();
    expect(document.activeElement).not.toBe(input);
  });
});
