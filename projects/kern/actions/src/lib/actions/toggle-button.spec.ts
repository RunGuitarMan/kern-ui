import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KrnToggleButton } from './toggle-button';
import {
  KRN_TOGGLE_BUTTON_DEFAULT_OPTIONS,
  KRN_TOGGLE_BUTTON_OPTIONS,
  provideKrnToggleButtonOptions,
} from './toggle-button-options';

@Component({
  imports: [KrnToggleButton],
  template: `
    <form id="format-form"></form>
    <span id="bold-label">Bold text</span>
    <span id="bold-help">Applies bold formatting to the current selection.</span>
    <button
      krnToggleButton
      aria-describedby="bold-help"
      aria-labelledby="bold-label"
      form="format-form"
      name="format"
      value="bold"
    >
      <span krnLeadingIcon>B</span>
      Bold
      <span krnTrailingIcon>⌘B</span>
    </button>
  `,
})
class NativeToggleButtonHost {}

@Component({
  imports: [KrnToggleButton],
  template: `
    <button
      krnToggleButton
      [attr.aria-pressed]="competingAriaPressed()"
      [disabled]="disabled()"
      [pressed]="pressed()"
      [value]="value()"
      (click)="clicks.update(increment)"
      (pressedChange)="pressedChanges.update(increment)"
    >
      Watch changes
    </button>
  `,
})
class ControlledToggleButtonHost {
  readonly competingAriaPressed = signal<string | null>('false');
  readonly disabled = signal(false);
  readonly pressed = signal(false);
  readonly value = signal('watch');
  readonly clicks = signal(0);
  readonly pressedChanges = signal(0);
  readonly increment = (value: number): number => value + 1;
}

@Component({
  selector: 'krn-toggle-options-child',
  imports: [KrnToggleButton],
  providers: [
    provideKrnToggleButtonOptions({
      pressedTone: 'danger',
      unpressedTone: 'warning',
    }),
  ],
  template: `<button krnToggleButton value="child" [pressed]="true">Child</button>`,
})
class ToggleButtonOptionsChild {}

@Component({
  imports: [KrnToggleButton, ToggleButtonOptionsChild],
  providers: [
    provideKrnToggleButtonOptions({
      pressedVariant: 'solid',
      size: 'lg',
      unpressedVariant: 'outline',
    }),
  ],
  template: `
    <button krnToggleButton data-testid="parent" value="parent">Parent</button>
    <button
      krnToggleButton
      data-testid="override"
      [pressed]="true"
      pressedTone="success"
      pressedVariant="soft"
      size="sm"
      value="override"
    >
      Override
    </button>
    <krn-toggle-options-child />
  `,
})
class ToggleButtonOptionsHost {}

describe('KrnToggleButton', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('enhances one native button and preserves native form and ARIA relationships', async () => {
    const fixture = TestBed.createComponent(NativeToggleButtonHost);
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector(
      'button[krnToggleButton]',
    ) as HTMLButtonElement;

    expect(fixture.nativeElement.querySelector('krn-toggle-button')).toBeNull();
    expect(button.querySelector('button')).toBeNull();
    expect(button.type).toBe('button');
    expect(button.name).toBe('format');
    expect(button.value).toBe('bold');
    expect(button.form?.id).toBe('format-form');
    expect(button.getAttribute('aria-labelledby')).toBe('bold-label');
    expect(button.getAttribute('aria-describedby')).toBe('bold-help');
    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(button.dataset).toMatchObject({
      pressed: 'false',
      size: 'md',
      tone: 'neutral',
      variant: 'ghost',
    });
    expect(button.querySelectorAll('.krn-action__icon')).toHaveLength(2);
    expect(
      [...button.querySelectorAll('.krn-action__icon')].every(
        (icon) => icon.getAttribute('aria-hidden') === 'true',
      ),
    ).toBe(true);
    expect(button.querySelector('.krn-action__label')?.textContent).toContain('Bold');
  });

  it('uses the pressed model as the single standalone state event', async () => {
    const fixture = TestBed.createComponent(KrnToggleButton);
    fixture.componentRef.setInput('value', 'bold');
    const pressedChange = vi.fn();
    fixture.componentInstance.pressed.subscribe(pressedChange);
    await fixture.whenStable();
    const button = fixture.nativeElement as HTMLButtonElement;

    button.click();
    await fixture.whenStable();

    expect(fixture.componentInstance.pressed()).toBe(true);
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(button.dataset).toMatchObject({
      pressed: 'true',
      tone: 'brand',
      variant: 'soft',
    });
    expect(pressedChange).toHaveBeenCalledTimes(1);
    expect(pressedChange).toHaveBeenLastCalledWith(true);

    button.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.pressed()).toBe(false);
    expect(pressedChange).toHaveBeenCalledTimes(2);
    expect(pressedChange).toHaveBeenLastCalledWith(false);
  });

  it('keeps component-owned aria-pressed deterministic across competing attributes', async () => {
    const fixture = TestBed.createComponent(ControlledToggleButtonHost);
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    expect(button.getAttribute('aria-pressed')).toBe('false');

    fixture.componentInstance.pressed.set(true);
    fixture.componentInstance.competingAriaPressed.set(null);
    await fixture.whenStable();
    expect(button.getAttribute('aria-pressed')).toBe('true');

    fixture.componentInstance.competingAriaPressed.set('false');
    await fixture.whenStable();
    expect(button.getAttribute('aria-pressed')).toBe('true');

    fixture.componentInstance.competingAriaPressed.set('mixed');
    await fixture.whenStable();
    expect(button.getAttribute('aria-pressed')).toBe('true');

    fixture.componentInstance.pressed.set(false);
    fixture.componentInstance.competingAriaPressed.set('true');
    fixture.componentInstance.value.set('pin');
    await fixture.whenStable();
    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(button.getAttribute('value')).toBe('pin');
    expect(button.value).toBe('pin');
  });

  it('uses native disabled behavior and does not emit or activate while disabled', async () => {
    const fixture = TestBed.createComponent(ControlledToggleButtonHost);
    fixture.componentInstance.disabled.set(true);
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    button.click();
    await fixture.whenStable();

    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(fixture.componentInstance.clicks()).toBe(0);
    expect(fixture.componentInstance.pressedChanges()).toBe(0);
  });

  it('defaults to type=button while preserving an explicit native submit type', async () => {
    @Component({
      imports: [KrnToggleButton],
      template: `
        <form (submit)="onSubmit($event)">
          <button krnToggleButton value="default">Default</button>
          <button krnToggleButton type="submit" value="submit">Submit</button>
        </form>
      `,
    })
    class ToggleButtonTypeHost {
      readonly submits = signal(0);

      onSubmit(event: SubmitEvent): void {
        event.preventDefault();
        this.submits.update((count) => count + 1);
      }
    }

    const fixture = TestBed.createComponent(ToggleButtonTypeHost);
    await fixture.whenStable();
    const buttons = fixture.nativeElement.querySelectorAll(
      'button',
    ) as NodeListOf<HTMLButtonElement>;

    expect(buttons[0]?.type).toBe('button');
    expect(buttons[1]?.type).toBe('submit');

    buttons[0]?.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.submits()).toBe(0);

    buttons[1]?.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.submits()).toBe(1);
  });

  it('resolves immutable scoped defaults and explicit state appearance overrides', async () => {
    const fixture = TestBed.createComponent(ToggleButtonOptionsHost);
    await fixture.whenStable();
    const find = (id: string): HTMLButtonElement =>
      fixture.nativeElement.querySelector(`[data-testid="${id}"]`) as HTMLButtonElement;
    const child = fixture.nativeElement.querySelector(
      'krn-toggle-options-child button',
    ) as HTMLButtonElement;

    expect(find('parent').dataset).toMatchObject({
      size: 'lg',
      tone: 'neutral',
      variant: 'outline',
    });
    expect(find('override').dataset).toMatchObject({
      size: 'sm',
      tone: 'success',
      variant: 'soft',
    });
    expect(child.dataset).toMatchObject({
      size: 'lg',
      tone: 'danger',
      variant: 'solid',
    });
    expect(KRN_TOGGLE_BUTTON_DEFAULT_OPTIONS).toEqual({
      size: 'md',
      pressedVariant: 'soft',
      pressedTone: 'brand',
      unpressedVariant: 'ghost',
      unpressedTone: 'neutral',
    });
    expect(Object.isFrozen(KRN_TOGGLE_BUTTON_DEFAULT_OPTIONS)).toBe(true);
    expect(Object.isFrozen(TestBed.inject(KRN_TOGGLE_BUTTON_OPTIONS))).toBe(true);
  });
});
