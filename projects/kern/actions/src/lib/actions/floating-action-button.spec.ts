import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideKrn } from '@kern-ui/angular/core';
import { KrnFloatingActionButton } from './button';
import {
  KRN_FLOATING_ACTION_BUTTON_DEFAULT_OPTIONS,
  KRN_FLOATING_ACTION_BUTTON_OPTIONS,
  provideKrnFloatingActionButtonOptions,
} from './floating-action-button-options';

@Component({
  imports: [KrnFloatingActionButton],
  template: `
    <button
      krnFab
      aria-describedby="create-help"
      form="create-form"
      name="intent"
      type="submit"
      value="create"
    >
      <span krnFabIcon>+</span>
      Create workspace
    </button>
    <form id="create-form"></form>
    <p id="create-help">Creates a workspace from the current template.</p>
  `,
})
class NativeFloatingActionHost {}

@Component({
  imports: [KrnFloatingActionButton],
  template: `
    <form (submit)="onSubmit($event)">
      <button krnFab type="submit" [loading]="loading()" (click)="clicks.update(increment)">
        <span krnFabIcon>+</span>
        Create workspace
      </button>
    </form>
  `,
})
class LoadingFloatingActionHost {
  readonly loading = signal(true);
  readonly clicks = signal(0);
  readonly submits = signal(0);
  readonly increment = (value: number): number => value + 1;

  onSubmit(event: SubmitEvent): void {
    event.preventDefault();
    this.submits.update(this.increment);
  }
}

@Component({
  selector: 'krn-fab-options-child',
  imports: [KrnFloatingActionButton],
  providers: [provideKrnFloatingActionButtonOptions({ tone: 'danger' })],
  template: `
    <button krnFab data-testid="child">
      <span krnFabIcon>!</span>
      Remove workspace
    </button>
  `,
})
class FloatingActionOptionsChild {}

@Component({
  imports: [FloatingActionOptionsChild, KrnFloatingActionButton],
  providers: [
    provideKrnFloatingActionButtonOptions({
      extended: false,
      size: 'md',
      variant: 'soft',
    }),
  ],
  template: `
    <button krnFab data-testid="parent">
      <span krnFabIcon>+</span>
      Create
    </button>
    <button krnFab data-testid="override" extended size="sm" tone="success">
      <span krnFabIcon>✓</span>
      Approve
    </button>
    <krn-fab-options-child />
  `,
})
class FloatingActionOptionsHost {}

@Component({
  imports: [KrnFloatingActionButton],
  providers: [provideKrnFloatingActionButtonOptions({ loadingLabel: 'Scoped copy…' })],
  template: `
    <button krnFab loading data-testid="scoped">Scoped</button>
    <button krnFab loading loadingLabel="Instance copy…" data-testid="instance">Instance</button>
    <button krnFab loading loadingLabel="" data-testid="silent">Silent</button>
  `,
})
class FloatingActionLoadingCopyHost {}

@Component({
  imports: [KrnFloatingActionButton],
  template: `
    <button
      krnFab
      [attr.aria-disabled]="ariaDisabled()"
      [loading]="loading()"
      data-testid="dynamic"
    >
      Dynamic action
    </button>
    <button krnFab aria-disabled="true" data-testid="static">Static action</button>
  `,
})
class FloatingActionAriaDisabledHost {
  readonly ariaDisabled = signal<string | null>('false');
  readonly loading = signal(false);
}

describe('KrnFloatingActionButton', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('enhances one native button and preserves its form and ARIA semantics', async () => {
    const fixture = TestBed.createComponent(NativeFloatingActionHost);
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('button[krnFab]') as HTMLButtonElement;

    expect(fixture.nativeElement.querySelector('krn-floating-action-button')).toBeNull();
    expect(button.querySelector('button')).toBeNull();
    expect(button.type).toBe('submit');
    expect(button.name).toBe('intent');
    expect(button.value).toBe('create');
    expect(button.form?.id).toBe('create-form');
    expect(button.getAttribute('aria-describedby')).toBe('create-help');
    expect(button.dataset).toMatchObject({
      extended: 'true',
      loading: 'false',
      size: 'lg',
      tone: 'brand',
      variant: 'solid',
    });
    expect(button.querySelector('.krn-action__icon')?.getAttribute('aria-hidden')).toBe('true');
    expect(button.querySelector('.krn-action__label')?.textContent).toContain('Create workspace');
  });

  it('keeps the label mounted as the native accessible name in compact mode', async () => {
    @Component({
      imports: [KrnFloatingActionButton],
      template: `
        <button krnFab extended="false">
          <span krnFabIcon>+</span>
          Create customer
        </button>
      `,
    })
    class CompactFloatingActionHost {}

    const fixture = TestBed.createComponent(CompactFloatingActionHost);
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    const label = button.querySelector('.krn-action__label') as HTMLElement;

    expect(button.dataset['extended']).toBe('false');
    expect(label).not.toBeNull();
    expect(label.textContent?.trim()).toBe('Create customer');
    expect(label.hidden).toBe(false);
    expect(label.getAttribute('aria-hidden')).toBeNull();
  });

  it('defaults to type=button while preserving explicit native button types', async () => {
    @Component({
      imports: [KrnFloatingActionButton],
      template: `
        <button krnFab data-testid="default">Default</button>
        <button krnFab data-testid="submit" type="submit">Submit</button>
        <button krnFab data-testid="reset" type="reset">Reset</button>
      `,
    })
    class FloatingActionTypesHost {}

    const fixture = TestBed.createComponent(FloatingActionTypesHost);
    await fixture.whenStable();
    const find = (id: string): HTMLButtonElement =>
      fixture.nativeElement.querySelector(`[data-testid="${id}"]`) as HTMLButtonElement;

    expect(find('default').type).toBe('button');
    expect(find('submit').type).toBe('submit');
    expect(find('reset').type).toBe('reset');
  });

  it('keeps loading focusable and blocks consumer click and implicit form submit', async () => {
    const fixture = TestBed.createComponent(LoadingFloatingActionHost);
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    button.focus();
    button.click();
    await fixture.whenStable();

    expect(document.activeElement).toBe(button);
    expect(button.disabled).toBe(false);
    expect(button.getAttribute('aria-disabled')).toBe('true');
    expect(button.getAttribute('aria-busy')).toBeNull();
    expect(button.querySelector('[role="status"]')?.textContent).toContain('Loading');
    expect(fixture.componentInstance.clicks()).toBe(0);
    expect(fixture.componentInstance.submits()).toBe(0);

    fixture.componentInstance.loading.set(false);
    await fixture.whenStable();
    button.click();
    await fixture.whenStable();

    expect(button.getAttribute('aria-disabled')).toBeNull();
    expect(button.querySelector('[role="status"]')?.textContent?.trim()).toBe('');
    expect(fixture.componentInstance.clicks()).toBe(1);
    expect(fixture.componentInstance.submits()).toBe(1);
  });

  it('reserves aria-disabled as a deterministic derived loading state', async () => {
    const fixture = TestBed.createComponent(FloatingActionAriaDisabledHost);
    await fixture.whenStable();
    const dynamic = fixture.nativeElement.querySelector(
      '[data-testid="dynamic"]',
    ) as HTMLButtonElement;
    const staticButton = fixture.nativeElement.querySelector(
      '[data-testid="static"]',
    ) as HTMLButtonElement;

    expect(dynamic.getAttribute('aria-disabled')).toBeNull();
    expect(staticButton.getAttribute('aria-disabled')).toBeNull();

    fixture.componentInstance.loading.set(true);
    await fixture.whenStable();
    expect(dynamic.getAttribute('aria-disabled')).toBe('true');

    fixture.componentInstance.ariaDisabled.set(null);
    await fixture.whenStable();
    expect(dynamic.getAttribute('aria-disabled')).toBe('true');

    fixture.componentInstance.ariaDisabled.set('false');
    await fixture.whenStable();
    expect(dynamic.getAttribute('aria-disabled')).toBe('true');

    fixture.componentInstance.ariaDisabled.set('true');
    await fixture.whenStable();
    expect(dynamic.getAttribute('aria-disabled')).toBe('true');

    fixture.componentInstance.loading.set(false);
    await fixture.whenStable();
    expect(dynamic.getAttribute('aria-disabled')).toBeNull();
  });

  it('resolves loading copy from application, scope, and instance precedence', async () => {
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
    const fixture = TestBed.createComponent(FloatingActionLoadingCopyHost);
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
      imports: [KrnFloatingActionButton],
      template: `<button krnFab disabled (click)="clicks.update(increment)">Disabled</button>`,
    })
    class DisabledFloatingActionHost {
      readonly clicks = signal(0);
      readonly increment = (value: number): number => value + 1;
    }

    const fixture = TestBed.createComponent(DisabledFloatingActionHost);
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();

    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-disabled')).toBeNull();
    expect(fixture.componentInstance.clicks()).toBe(0);
  });

  it('inherits immutable scoped defaults and allows instance overrides', async () => {
    const fixture = TestBed.createComponent(FloatingActionOptionsHost);
    await fixture.whenStable();
    const button = (id: string): HTMLButtonElement =>
      fixture.nativeElement.querySelector(`[data-testid="${id}"]`) as HTMLButtonElement;

    expect(button('parent').dataset).toMatchObject({
      extended: 'false',
      size: 'md',
      tone: 'brand',
      variant: 'soft',
    });
    expect(button('child').dataset).toMatchObject({
      extended: 'false',
      size: 'md',
      tone: 'danger',
      variant: 'soft',
    });
    expect(button('override').dataset).toMatchObject({
      extended: 'true',
      size: 'sm',
      tone: 'success',
      variant: 'soft',
    });
    expect(Object.isFrozen(TestBed.inject(KRN_FLOATING_ACTION_BUTTON_OPTIONS))).toBe(true);
    expect(KRN_FLOATING_ACTION_BUTTON_DEFAULT_OPTIONS).toEqual({
      extended: true,
      size: 'lg',
      tone: 'brand',
      variant: 'solid',
    });
  });

  it('does not expose proxy inputs or an activation output for native semantics', () => {
    const fixture = TestBed.createComponent(KrnFloatingActionButton);
    const instance = fixture.componentInstance as object;

    expect('ariaLabel' in instance).toBe(false);
    expect('type' in instance).toBe(false);
    expect('disabled' in instance).toBe(false);
    expect('activated' in instance).toBe(false);
  });
});
