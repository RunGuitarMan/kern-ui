import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideKrn } from '@kern-ui/angular/core';
import { KrnButton } from './button';
import {
  KRN_BUTTON_DEFAULT_OPTIONS,
  KRN_BUTTON_OPTIONS,
  provideKrnButtonOptions,
} from './button-options';

@Component({
  imports: [KrnButton],
  template: `
    <button
      krnButton
      aria-describedby="button-help"
      form="owner-form"
      name="intent"
      type="submit"
      value="publish"
    >
      <span krnLeadingIcon>↑</span>
      Publish changes
      <span krnTrailingIcon>→</span>
    </button>
    <form id="owner-form"></form>
    <p id="button-help">Publishes the current draft.</p>
  `,
})
class NativeButtonHost {}

@Component({
  imports: [KrnButton],
  template: `
    <form (submit)="onSubmit($event)">
      <button krnButton type="submit" [loading]="loading()" (click)="clickCount.update(increment)">
        Save
      </button>
    </form>
  `,
})
class LoadingButtonHost {
  readonly loading = signal(true);
  readonly clickCount = signal(0);
  readonly submitCount = signal(0);
  readonly increment = (value: number): number => value + 1;

  onSubmit(event: SubmitEvent): void {
    event.preventDefault();
    this.submitCount.update(this.increment);
  }
}

@Component({
  imports: [KrnButton],
  template: `
    <button
      krnButton
      [attr.aria-disabled]="ariaDisabled()"
      [loading]="loading()"
      data-testid="aria-owner"
    >
      Save
    </button>
  `,
})
class ButtonAriaOwnershipHost {
  readonly ariaDisabled = signal<string | null>('false');
  readonly loading = signal(true);
}

@Component({
  selector: 'krn-button-child-options',
  imports: [KrnButton],
  providers: [provideKrnButtonOptions({ tone: 'danger' })],
  template: `<button krnButton data-testid="child">Delete</button>`,
})
class ChildOptionsHost {}

@Component({
  imports: [KrnButton, ChildOptionsHost],
  providers: [provideKrnButtonOptions({ size: 'lg', variant: 'outline' })],
  template: `
    <button krnButton data-testid="parent">Parent</button>
    <button krnButton data-testid="override" size="sm" tone="brand">Override</button>
    <krn-button-child-options />
  `,
})
class ParentOptionsHost {}

@Component({
  imports: [KrnButton],
  providers: [provideKrnButtonOptions({ loadingLabel: 'Scoped copy…' })],
  template: `
    <button krnButton loading data-testid="scoped">Scoped</button>
    <button krnButton loading loadingLabel="Instance copy…" data-testid="instance">Instance</button>
    <button krnButton loading loadingLabel="" data-testid="silent">Silent</button>
  `,
})
class LoadingCopyOptionsHost {}

describe('KrnButton', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('enhances the native button instead of proxying its semantic contract', async () => {
    const fixture = TestBed.createComponent(NativeButtonHost);
    await fixture.whenStable();

    const button = fixture.nativeElement.querySelector('button[krnButton]') as HTMLButtonElement;

    expect(fixture.nativeElement.querySelector('krn-button')).toBeNull();
    expect(button.querySelector('button')).toBeNull();
    expect(button.type).toBe('submit');
    expect(button.name).toBe('intent');
    expect(button.value).toBe('publish');
    expect(button.form?.id).toBe('owner-form');
    expect(button.getAttribute('aria-describedby')).toBe('button-help');
    expect(button.querySelector('.krn-action__label')?.textContent).toContain('Publish changes');
    expect(button.querySelectorAll('.krn-action__icon')).toHaveLength(2);
  });

  it('defaults to type=button while preserving explicit native button types', async () => {
    @Component({
      imports: [KrnButton],
      template: `
        <button krnButton data-testid="default">Default</button>
        <button krnButton data-testid="submit" type="submit">Submit</button>
        <button krnButton data-testid="reset" type="reset">Reset</button>
      `,
    })
    class ButtonTypesHost {}

    const fixture = TestBed.createComponent(ButtonTypesHost);
    await fixture.whenStable();

    const find = (id: string): HTMLButtonElement =>
      fixture.nativeElement.querySelector(`[data-testid="${id}"]`) as HTMLButtonElement;

    expect(find('default').type).toBe('button');
    expect(find('submit').type).toBe('submit');
    expect(find('reset').type).toBe('reset');
  });

  it('keeps a loading action focusable and blocks consumer click and form submit', async () => {
    const fixture = TestBed.createComponent(LoadingButtonHost);
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    button.focus();
    button.click();
    await fixture.whenStable();

    expect(document.activeElement).toBe(button);
    expect(button.disabled).toBe(false);
    expect(button.getAttribute('aria-busy')).toBeNull();
    expect(button.getAttribute('aria-disabled')).toBe('true');
    expect(button.querySelector('[role="status"]')?.textContent).toContain('Loading');
    expect(fixture.componentInstance.clickCount()).toBe(0);
    expect(fixture.componentInstance.submitCount()).toBe(0);

    fixture.componentInstance.loading.set(false);
    await fixture.whenStable();
    button.click();
    await fixture.whenStable();

    expect(button.getAttribute('aria-busy')).toBeNull();
    expect(button.getAttribute('aria-disabled')).toBeNull();
    expect(button.querySelector('[role="status"]')?.textContent?.trim()).toBe('');
    expect(fixture.componentInstance.clickCount()).toBe(1);
    expect(fixture.componentInstance.submitCount()).toBe(1);
  });

  it('owns aria-disabled deterministically for every loading check', async () => {
    const fixture = TestBed.createComponent(ButtonAriaOwnershipHost);
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    expect(button.getAttribute('aria-disabled')).toBe('true');

    fixture.componentInstance.ariaDisabled.set(null);
    await fixture.whenStable();
    expect(button.getAttribute('aria-disabled')).toBe('true');

    fixture.componentInstance.ariaDisabled.set('false');
    await fixture.whenStable();
    expect(button.getAttribute('aria-disabled')).toBe('true');

    fixture.componentInstance.loading.set(false);
    await fixture.whenStable();
    expect(button.getAttribute('aria-disabled')).toBeNull();
  });

  it('keeps one live region mounted and derives its copy from provideKrn translations', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideKrn({
          persistPreferences: false,
          translations: {
            feedback: {
              loadingInProgress: 'Enregistrement…',
            },
          },
        }),
      ],
    });
    const fixture = TestBed.createComponent(LoadingButtonHost);
    fixture.componentInstance.loading.set(false);
    await fixture.whenStable();

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    const status = button.querySelector('[role="status"]') as HTMLElement;
    expect(status.textContent?.trim()).toBe('');

    fixture.componentInstance.loading.set(true);
    await fixture.whenStable();

    expect(button.querySelector('[role="status"]')).toBe(status);
    expect(status.textContent).toContain('Enregistrement…');
    expect(button.getAttribute('aria-disabled')).toBe('true');
    expect(button.getAttribute('aria-busy')).toBeNull();
  });

  it('resolves loading copy from application, scoped, and instance precedence', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideKrn({
          persistPreferences: false,
          translations: {
            feedback: {
              loadingInProgress: 'Application copy…',
            },
          },
        }),
      ],
    });
    const fixture = TestBed.createComponent(LoadingCopyOptionsHost);
    await fixture.whenStable();
    const statusText = (id: string): string =>
      (
        fixture.nativeElement.querySelector(`[data-testid="${id}"] [role="status"]`) as HTMLElement
      ).textContent?.trim() ?? '';

    expect(statusText('scoped')).toBe('Scoped copy…');
    expect(statusText('instance')).toBe('Instance copy…');
    expect(statusText('silent')).toBe('');
  });

  it('leaves native disabled ownership and activation behavior to the consumer', async () => {
    @Component({
      imports: [KrnButton],
      template: `<button krnButton disabled (click)="clicks.update(increment)">Disabled</button>`,
    })
    class DisabledButtonHost {
      readonly clicks = signal(0);
      readonly increment = (value: number): number => value + 1;
    }

    const fixture = TestBed.createComponent(DisabledButtonHost);
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();

    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-disabled')).toBeNull();
    expect(fixture.componentInstance.clicks()).toBe(0);
  });

  it('inherits immutable visual defaults by injector scope and allows instance overrides', async () => {
    const fixture = TestBed.createComponent(ParentOptionsHost);
    await fixture.whenStable();

    const button = (id: string): HTMLButtonElement =>
      fixture.nativeElement.querySelector(`[data-testid="${id}"]`) as HTMLButtonElement;

    expect(button('parent').dataset).toMatchObject({
      size: 'lg',
      tone: 'brand',
      variant: 'outline',
    });
    expect(button('child').dataset).toMatchObject({
      size: 'lg',
      tone: 'danger',
      variant: 'outline',
    });
    expect(button('override').dataset).toMatchObject({
      size: 'sm',
      tone: 'brand',
      variant: 'outline',
    });
    expect(Object.isFrozen(TestBed.inject(KRN_BUTTON_OPTIONS))).toBe(true);
    expect(KRN_BUTTON_DEFAULT_OPTIONS).toEqual({
      size: 'md',
      tone: 'brand',
      variant: 'solid',
    });
  });
});
