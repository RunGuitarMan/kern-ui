import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideKrn } from '@kern-ui/angular/core';
import { KrnIconButton } from './icon-button';
import {
  KRN_ICON_BUTTON_DEFAULT_OPTIONS,
  KRN_ICON_BUTTON_OPTIONS,
  provideKrnIconButtonOptions,
} from './icon-button-options';

@Component({
  imports: [KrnIconButton],
  template: `
    <form id="owner-form"></form>
    <span id="archive-label">Archive workspace</span>
    <p id="archive-help">Moves the workspace into the archive.</p>
    <button
      krnIconButton
      aria-describedby="archive-help"
      aria-labelledby="archive-label"
      aria-pressed="true"
      form="owner-form"
      name="intent"
      type="submit"
      value="archive"
    >
      ×
    </button>
  `,
})
class NativeIconButtonHost {}

@Component({
  imports: [KrnIconButton],
  template: `
    <form (submit)="onSubmit($event)">
      <button
        krnIconButton
        aria-label="Save workspace"
        type="submit"
        [loading]="loading()"
        (click)="clickCount.update(increment)"
      >
        ↓
      </button>
    </form>
  `,
})
class LoadingIconButtonHost {
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
  imports: [KrnIconButton],
  template: `
    <button
      krnIconButton
      aria-label="Save"
      [attr.aria-disabled]="ariaDisabled()"
      [loading]="loading()"
    >
      ✓
    </button>
  `,
})
class IconButtonAriaOwnershipHost {
  readonly ariaDisabled = signal<string | null>('false');
  readonly loading = signal(true);
}

@Component({
  selector: 'krn-icon-button-child-options',
  imports: [KrnIconButton],
  providers: [provideKrnIconButtonOptions({ tone: 'danger' })],
  template: `<button krnIconButton aria-label="Delete" data-testid="child">×</button>`,
})
class ChildOptionsHost {}

@Component({
  imports: [KrnIconButton, ChildOptionsHost],
  providers: [provideKrnIconButtonOptions({ size: 'lg', variant: 'outline' })],
  template: `
    <button krnIconButton aria-label="Parent" data-testid="parent">↑</button>
    <button krnIconButton aria-label="Override" data-testid="override" size="sm" tone="brand">
      ↓
    </button>
    <krn-icon-button-child-options />
  `,
})
class ParentOptionsHost {}

@Component({
  imports: [KrnIconButton],
  providers: [provideKrnIconButtonOptions({ loadingLabel: 'Scoped copy…' })],
  template: `
    <button krnIconButton aria-label="Scoped" loading data-testid="scoped">↑</button>
    <button
      krnIconButton
      aria-label="Instance"
      loading
      loadingLabel="Instance copy…"
      data-testid="instance"
    >
      ↓
    </button>
    <button krnIconButton aria-label="Silent" loading loadingLabel="" data-testid="silent">
      ×
    </button>
  `,
})
class LoadingCopyOptionsHost {}

describe('KrnIconButton', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('enhances one native button and leaves its form and ARIA contract intact', async () => {
    const fixture = TestBed.createComponent(NativeIconButtonHost);
    await fixture.whenStable();

    const button = fixture.nativeElement.querySelector(
      'button[krnIconButton]',
    ) as HTMLButtonElement;

    expect(fixture.nativeElement.querySelector('krn-icon-button')).toBeNull();
    expect(button.querySelector('button')).toBeNull();
    expect(button.type).toBe('submit');
    expect(button.name).toBe('intent');
    expect(button.value).toBe('archive');
    expect(button.form?.id).toBe('owner-form');
    expect(button.getAttribute('aria-labelledby')).toBe('archive-label');
    expect(button.getAttribute('aria-describedby')).toBe('archive-help');
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(button.querySelector('.krn-action__icon')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('defaults to type=button while preserving explicit native button types', async () => {
    @Component({
      imports: [KrnIconButton],
      template: `
        <button krnIconButton aria-label="Default" data-testid="default">·</button>
        <button krnIconButton aria-label="Submit" data-testid="submit" type="submit">·</button>
        <button krnIconButton aria-label="Reset" data-testid="reset" type="reset">·</button>
      `,
    })
    class IconButtonTypesHost {}

    const fixture = TestBed.createComponent(IconButtonTypesHost);
    await fixture.whenStable();
    const find = (id: string): HTMLButtonElement =>
      fixture.nativeElement.querySelector(`[data-testid="${id}"]`) as HTMLButtonElement;

    expect(find('default').type).toBe('button');
    expect(find('submit').type).toBe('submit');
    expect(find('reset').type).toBe('reset');
  });

  it('keeps loading focusable and blocks consumer click and implicit form submit', async () => {
    const fixture = TestBed.createComponent(LoadingIconButtonHost);
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
    expect(fixture.componentInstance.clickCount()).toBe(0);
    expect(fixture.componentInstance.submitCount()).toBe(0);

    fixture.componentInstance.loading.set(false);
    await fixture.whenStable();
    button.click();
    await fixture.whenStable();

    expect(button.getAttribute('aria-disabled')).toBeNull();
    expect(button.querySelector('[role="status"]')?.textContent?.trim()).toBe('');
    expect(fixture.componentInstance.clickCount()).toBe(1);
    expect(fixture.componentInstance.submitCount()).toBe(1);
  });

  it('owns aria-disabled deterministically for every loading check', async () => {
    const fixture = TestBed.createComponent(IconButtonAriaOwnershipHost);
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    expect(button.getAttribute('aria-disabled')).toBe('true');

    fixture.componentInstance.ariaDisabled.set(null);
    await fixture.whenStable();
    expect(button.getAttribute('aria-disabled')).toBe('true');

    fixture.componentInstance.ariaDisabled.set('true');
    await fixture.whenStable();
    expect(button.getAttribute('aria-disabled')).toBe('true');

    fixture.componentInstance.loading.set(false);
    await fixture.whenStable();
    expect(button.getAttribute('aria-disabled')).toBeNull();
  });

  it('keeps one live status mounted and derives its copy from provideKrn translations', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideKrn({
          persistPreferences: false,
          translations: {
            feedback: {
              loadingInProgress: 'Archivage…',
            },
          },
        }),
      ],
    });
    const fixture = TestBed.createComponent(LoadingIconButtonHost);
    fixture.componentInstance.loading.set(false);
    await fixture.whenStable();

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    const status = button.querySelector('[role="status"]') as HTMLElement;
    expect(status.textContent?.trim()).toBe('');

    fixture.componentInstance.loading.set(true);
    await fixture.whenStable();

    expect(button.querySelectorAll('[role="status"]')).toHaveLength(1);
    expect(button.querySelector('[role="status"]')).toBe(status);
    expect(status.textContent).toContain('Archivage…');
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
      imports: [KrnIconButton],
      template: `
        <button krnIconButton aria-label="Disabled" disabled (click)="clicks.update(increment)">
          ×
        </button>
      `,
    })
    class DisabledIconButtonHost {
      readonly clicks = signal(0);
      readonly increment = (value: number): number => value + 1;
    }

    const fixture = TestBed.createComponent(DisabledIconButtonHost);
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
      tone: 'neutral',
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
    expect(Object.isFrozen(TestBed.inject(KRN_ICON_BUTTON_OPTIONS))).toBe(true);
    expect(KRN_ICON_BUTTON_DEFAULT_OPTIONS).toEqual({
      size: 'md',
      tone: 'neutral',
      variant: 'ghost',
    });
  });

  it('does not expose proxy inputs or an activation output for native semantics', () => {
    const fixture = TestBed.createComponent(KrnIconButton);
    const instance = fixture.componentInstance as object;

    expect('ariaLabel' in instance).toBe(false);
    expect('type' in instance).toBe(false);
    expect('disabled' in instance).toBe(false);
    expect('pressed' in instance).toBe(false);
    expect('activated' in instance).toBe(false);
  });
});
