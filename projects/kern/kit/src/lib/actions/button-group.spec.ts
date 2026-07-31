import { Component, signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';
import { KrnButton } from './button';
import { KrnButtonGroup } from './button-group';
import {
  KRN_BUTTON_GROUP_DEFAULT_OPTIONS,
  KRN_BUTTON_GROUP_OPTIONS,
  provideKrnButtonGroupOptions,
} from './button-group-options';
import { KrnIconButton } from './icon-button';

@Component({
  imports: [KrnButton, KrnButtonGroup, KrnIconButton],
  template: `
    <span id="review-actions-label">Review actions</span>
    <p id="review-actions-help">Choose an independent review command.</p>
    <div
      krnButtonGroup
      aria-labelledby="review-actions-label"
      aria-describedby="review-actions-help"
      data-testid="canonical"
    >
      <button krnButton type="button">Comment</button>
      <button krnIconButton aria-label="More review actions">···</button>
    </div>
  `,
})
class NativeGroupHost {}

@Component({
  imports: [KrnButtonGroup],
  template: `
    <div
      krnButtonGroup
      data-testid="native"
      [attr.aria-label]="nativeLabel()"
      [orientation]="orientation()"
      [connected]="connected()"
    ></div>
    <krn-button-group data-testid="legacy" [ariaLabel]="legacyLabel()" />
  `,
})
class DynamicGroupHost {
  readonly nativeLabel = signal('Native actions');
  readonly legacyLabel = signal<string | undefined>('Legacy actions');
  readonly orientation = signal<'horizontal' | 'vertical'>('horizontal');
  readonly connected = signal(false);
}

@Component({
  selector: 'krn-button-group-child-options',
  imports: [KrnButtonGroup],
  providers: [provideKrnButtonGroupOptions({ connected: false })],
  template: `<div krnButtonGroup data-testid="child"></div>`,
})
class ChildOptionsHost {}

@Component({
  imports: [ChildOptionsHost, KrnButtonGroup],
  providers: [provideKrnButtonGroupOptions({ orientation: 'vertical', connected: true })],
  template: `
    <div krnButtonGroup data-testid="parent"></div>
    <div krnButtonGroup data-testid="override" orientation="horizontal" connected="false"></div>
    <krn-button-group-child-options />
  `,
})
class ParentOptionsHost {}

@Component({
  imports: [KrnButton, KrnButtonGroup, KrnIconButton],
  template: `
    <form (submit)="onSubmit($event)">
      <div krnButtonGroup aria-label="Document actions">
        <button krnButton data-testid="save" type="submit" (click)="saveClicks.update(increment)">
          Save
        </button>
        <button
          krnButton
          data-testid="loading"
          type="button"
          loading
          (click)="loadingClicks.update(increment)"
        >
          Publish
        </button>
        <button
          krnIconButton
          aria-label="Delete"
          data-testid="disabled"
          disabled
          (click)="disabledClicks.update(increment)"
        >
          ×
        </button>
      </div>
    </form>
  `,
})
class ActionOwnershipHost {
  readonly saveClicks = signal(0);
  readonly loadingClicks = signal(0);
  readonly disabledClicks = signal(0);
  readonly submits = signal(0);
  readonly increment = (value: number): number => value + 1;

  onSubmit(event: SubmitEvent): void {
    event.preventDefault();
    this.submits.update(this.increment);
  }
}

describe('KrnButtonGroup', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('enhances a native group host without adding an interactive wrapper', async () => {
    const fixture = TestBed.createComponent(NativeGroupHost);
    await fixture.whenStable();
    const group = fixture.nativeElement.querySelector('div[krnButtonGroup]') as HTMLDivElement;

    expect(fixture.nativeElement.querySelector('krn-button-group')).toBeNull();
    expect(group.classList.contains('krn-action-group')).toBe(true);
    expect(group.classList.contains('krn-button-group')).toBe(true);
    expect(group.getAttribute('role')).toBe('group');
    expect(group.getAttribute('tabindex')).toBeNull();
    expect(group.getAttribute('aria-labelledby')).toBe('review-actions-label');
    expect(group.getAttribute('aria-describedby')).toBe('review-actions-help');
    expect(group.getAttribute('aria-label')).toBeNull();
    expect(group.dataset).toMatchObject({ orientation: 'horizontal' });
    expect(group.hasAttribute('data-connected')).toBe(false);
    expect(group.querySelectorAll(':scope > button')).toHaveLength(2);
    expect(group.querySelector('button button')).toBeNull();
  });

  it('preserves native naming and keeps a dynamic compatibility bridge for ariaLabel', async () => {
    const fixture = TestBed.createComponent(DynamicGroupHost);
    await fixture.whenStable();
    const host = fixture.componentInstance;
    const native = fixture.nativeElement.querySelector('[data-testid="native"]') as HTMLElement;
    const legacy = fixture.nativeElement.querySelector('[data-testid="legacy"]') as HTMLElement;

    expect(native.getAttribute('aria-label')).toBe('Native actions');
    expect(legacy.getAttribute('aria-label')).toBe('Legacy actions');

    host.nativeLabel.set('Updated native actions');
    host.legacyLabel.set('');
    host.orientation.set('vertical');
    host.connected.set(true);
    await fixture.whenStable();

    expect(native.getAttribute('aria-label')).toBe('Updated native actions');
    expect(native.dataset).toMatchObject({ connected: 'true', orientation: 'vertical' });
    expect(legacy.getAttribute('aria-label')).toBeNull();

    host.legacyLabel.set(undefined);
    await fixture.whenStable();
    expect(legacy.getAttribute('aria-label')).toBeNull();
  });

  it('inherits immutable scoped layout defaults and lets instances override them', async () => {
    const fixture = TestBed.createComponent(ParentOptionsHost);
    await fixture.whenStable();
    const find = (id: string): HTMLElement =>
      fixture.nativeElement.querySelector(`[data-testid="${id}"]`) as HTMLElement;

    expect(find('parent').dataset).toMatchObject({
      connected: 'true',
      orientation: 'vertical',
    });
    expect(find('child').dataset['orientation']).toBe('vertical');
    expect(find('child').hasAttribute('data-connected')).toBe(false);
    expect(find('override').dataset['orientation']).toBe('horizontal');
    expect(find('override').hasAttribute('data-connected')).toBe(false);
    expect(Object.isFrozen(TestBed.inject(KRN_BUTTON_GROUP_OPTIONS))).toBe(true);
    expect(KRN_BUTTON_GROUP_DEFAULT_OPTIONS).toEqual({
      orientation: 'horizontal',
      connected: false,
    });
  });

  it('leaves activation, form, loading, and disabled behavior with each child action', async () => {
    const fixture = TestBed.createComponent(ActionOwnershipHost);
    await fixture.whenStable();
    const find = (id: string): HTMLButtonElement =>
      fixture.nativeElement.querySelector(`[data-testid="${id}"]`) as HTMLButtonElement;

    find('save').click();
    find('loading').click();
    find('disabled').click();
    await fixture.whenStable();

    expect(fixture.componentInstance.saveClicks()).toBe(1);
    expect(fixture.componentInstance.submits()).toBe(1);
    expect(fixture.componentInstance.loadingClicks()).toBe(0);
    expect(fixture.componentInstance.disabledClicks()).toBe(0);
    expect(find('loading').disabled).toBe(false);
    expect(find('loading').getAttribute('aria-disabled')).toBe('true');
    expect(find('disabled').disabled).toBe(true);
  });

  it('keeps native Tab order and does not intercept arrow keys or own selection state', async () => {
    const fixture = TestBed.createComponent(NativeGroupHost);
    await fixture.whenStable();
    const group = fixture.nativeElement.querySelector('div[krnButtonGroup]') as HTMLElement;
    const first = group.querySelector('button') as HTMLButtonElement;
    first.focus();
    const event = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'ArrowRight',
    });

    first.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(first);
    expect(group.querySelector('[aria-pressed]')).toBeNull();
    const instance = fixture.debugElement.query(By.directive(KrnButtonGroup))
      .componentInstance as object;
    expect('disabled' in instance).toBe(false);
    expect('loading' in instance).toBe(false);
    expect('values' in instance).toBe(false);
  });
});
