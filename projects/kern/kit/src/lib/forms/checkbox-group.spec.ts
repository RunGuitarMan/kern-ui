import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { KrnCheckbox, KrnCheckboxGroup } from './selection-controls';

@Component({
  imports: [KrnCheckbox, KrnCheckboxGroup],
  template: `
    <krn-checkbox-group [value]="value()" (valueChange)="value.set($event)">
      <krn-checkbox value="audit">Audit</krn-checkbox>
      <krn-checkbox value="billing">Billing</krn-checkbox>
    </krn-checkbox-group>
  `,
})
class StandaloneCheckboxGroupHost {
  readonly value = signal<readonly string[]>(['audit', 'audit']);
}

@Component({
  imports: [KrnCheckbox, KrnCheckboxGroup, ReactiveFormsModule],
  template: `
    <krn-checkbox-group [value]="standaloneValue()" [formControl]="control">
      <krn-checkbox value="audit">Audit</krn-checkbox>
      <krn-checkbox value="billing">Billing</krn-checkbox>
    </krn-checkbox-group>
  `,
})
class AngularOwnedCheckboxGroupHost {
  readonly standaloneValue = signal<readonly string[]>(['audit']);
  readonly control = new FormControl<readonly string[]>(['billing'], {
    nonNullable: true,
  });
}

@Component({
  imports: [KrnCheckbox, KrnCheckboxGroup, ReactiveFormsModule],
  template: `
    <krn-checkbox-group [formControl]="control">
      <krn-checkbox value="audit">Audit</krn-checkbox>
    </krn-checkbox-group>
  `,
})
class TouchedCheckboxGroupHost {
  readonly control = new FormControl<readonly string[]>([], { nonNullable: true });
}

@Component({
  imports: [KrnCheckbox, KrnCheckboxGroup],
  template: `
    <krn-checkbox-group
      id="features"
      label="Features"
      ariaLabelledBy="external-label"
      ariaDescribedBy="external-hint"
      describedBy="legacy-hint"
    >
      <krn-checkbox disabled value="audit">Audit</krn-checkbox>
      <krn-checkbox value="billing">Billing</krn-checkbox>
    </krn-checkbox-group>
  `,
})
class AccessibleCheckboxGroupHost {}

describe('KrnCheckboxGroup', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('owns a normalized standalone value and suppresses no-op emissions', async () => {
    const fixture = TestBed.createComponent(StandaloneCheckboxGroupHost);
    await fixture.whenStable();
    const group = fixture.debugElement.children[0]!.componentInstance as KrnCheckboxGroup;
    const valueChange = vi.fn();
    group.valueChange.subscribe(valueChange);
    const inputs = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>('input'),
    ];

    expect(inputs.map((input) => input.checked)).toEqual([true, false]);
    inputs[0]!.dispatchEvent(new Event('change', { bubbles: true }));
    await fixture.whenStable();
    expect(valueChange).not.toHaveBeenCalled();

    inputs[1]!.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.value()).toEqual(['audit', 'billing']);
    expect(valueChange).toHaveBeenCalledOnce();
  });

  it('keeps Angular Forms as owner when value APIs are mixed', async () => {
    const fixture = TestBed.createComponent(AngularOwnedCheckboxGroupHost);
    await fixture.whenStable();
    const host = fixture.componentInstance;
    const inputs = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>('input'),
    ];

    expect(inputs.map((input) => input.checked)).toEqual([false, true]);
    host.standaloneValue.set(['audit']);
    await fixture.whenStable();
    expect(inputs.map((input) => input.checked)).toEqual([false, true]);
  });

  it('changes value before marking the group touched on child blur', async () => {
    const fixture = TestBed.createComponent(TouchedCheckboxGroupHost);
    await fixture.whenStable();
    const control = fixture.componentInstance.control;
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    input.focus();
    input.click();
    await fixture.whenStable();
    expect(control.value).toEqual(['audit']);
    expect(control.dirty).toBe(true);
    expect(control.touched).toBe(false);

    input.blur();
    await fixture.whenStable();
    expect(control.touched).toBe(true);
  });

  it('composes group ARIA references and focuses the first enabled native option', async () => {
    const fixture = TestBed.createComponent(AccessibleCheckboxGroupHost);
    await fixture.whenStable();
    const group = fixture.debugElement.children[0]!.componentInstance as KrnCheckboxGroup;
    const fieldset = fixture.nativeElement.querySelector('fieldset') as HTMLFieldSetElement;
    const inputs = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>('input'),
    ];

    expect(fieldset.getAttribute('aria-labelledby')).toBe('external-label');
    expect(fieldset.getAttribute('aria-describedby')).toBe('legacy-hint external-hint');
    expect(fieldset.hasAttribute('aria-label')).toBe(false);
    expect(fieldset.querySelector('legend')?.textContent?.trim()).toBe('Features');

    group.focus();
    expect(document.activeElement).toBe(inputs[1]);
  });
});
