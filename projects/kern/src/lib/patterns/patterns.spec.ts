import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { KrnLoginForm, KrnMultiStepForm } from './form-patterns';
import { KrnGlobalSearch, KrnUserMenu } from './product-patterns';

describe('Kern product patterns', () => {
  it('filters and chooses a global-search result', async () => {
    await TestBed.configureTestingModule({ imports: [KrnGlobalSearch] }).compileComponents();
    const fixture = TestBed.createComponent(KrnGlobalSearch);
    fixture.componentRef.setInput('results', [
      { id: 'button', label: 'Button', keywords: ['action'] },
      { id: 'dialog', label: 'Dialog', keywords: ['overlay'] },
    ]);
    fixture.componentInstance.query.set('action');
    await fixture.whenStable();

    expect(fixture.componentInstance.filteredResults()[0]?.id).toBe('button');
    fixture.componentInstance.choose(fixture.componentInstance.filteredResults()[0]!);
    expect(fixture.componentInstance.query()).toBe('Button');
    expect(fixture.componentInstance.open()).toBe(false);
  });

  it('opens the user menu, moves focus to its first action, and closes on selection', async () => {
    @Component({
      imports: [KrnUserMenu],
      template: `
        <krn-user-menu name="Avery Cole">
          <button role="menuitem" type="button">Profile</button>
          <button role="menuitem" type="button">Sign out</button>
        </krn-user-menu>
      `,
    })
    class UserMenuHost {}

    const fixture = TestBed.createComponent(UserMenuHost);
    await fixture.whenStable();
    const trigger = fixture.nativeElement.querySelector('.trigger') as HTMLButtonElement;
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    await fixture.whenStable();
    await new Promise<void>((resolve) => queueMicrotask(resolve));

    const firstAction = fixture.nativeElement.querySelector(
      '[role="menuitem"]',
    ) as HTMLButtonElement;
    expect(firstAction).not.toBeNull();
    expect(document.activeElement).toBe(firstAction);

    firstAction.click();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[role="menu"]')).toBeNull();
  });

  it('emits only valid typed login credentials', async () => {
    await TestBed.configureTestingModule({ imports: [KrnLoginForm] }).compileComponents();
    const fixture = TestBed.createComponent(KrnLoginForm);
    const submitted: unknown[] = [];
    fixture.componentInstance.submitted.subscribe((value) => submitted.push(value));
    fixture.componentInstance.form.setValue({
      email: 'person@example.com',
      password: 'strong-password',
      remember: true,
    });
    fixture.componentInstance.submit();

    expect(submitted).toEqual([
      { email: 'person@example.com', password: 'strong-password', remember: true },
    ]);
  });

  it('prevents advancing an invalid multi-step form', async () => {
    await TestBed.configureTestingModule({ imports: [KrnMultiStepForm] }).compileComponents();
    const fixture = TestBed.createComponent(KrnMultiStepForm);
    fixture.componentRef.setInput('steps', [
      { id: 'account', label: 'Account', valid: false },
      { id: 'profile', label: 'Profile', valid: true },
    ]);
    await fixture.whenStable();

    fixture.componentInstance.next();
    expect(fixture.componentInstance.current()).toBe(0);
    fixture.componentRef.setInput('steps', [
      { id: 'account', label: 'Account', valid: true },
      { id: 'profile', label: 'Profile', valid: true },
    ]);
    fixture.componentInstance.next();
    expect(fixture.componentInstance.current()).toBe(1);
  });
});
