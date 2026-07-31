import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { KrnLoginForm, KrnMultiStepForm, KrnProfileForm } from './form-patterns';
import { KrnGlobalSearch, KrnSettingsPanel, KrnUserMenu } from './product-patterns';

describe('Kern product patterns', () => {
  it('filters and chooses a global-search result', async () => {
    await TestBed.configureTestingModule({ imports: [KrnGlobalSearch] }).compileComponents();
    const fixture = TestBed.createComponent(KrnGlobalSearch);
    fixture.componentRef.setInput('results', [
      { id: 'button', label: 'Button', keywords: ['action'] },
      { id: 'dialog', label: 'Dialog', keywords: ['overlay'] },
    ]);
    fixture.componentInstance.query.set('action');
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    const option = fixture.nativeElement.querySelector('[role="option"]') as HTMLButtonElement;
    expect(option.textContent).toContain('Button');
    option.click();
    fixture.detectChanges();
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
    const menu = fixture.nativeElement.querySelector('[role="menu"]') as HTMLElement;
    expect(firstAction).not.toBeNull();
    expect(trigger.getAttribute('aria-controls')).toBe(menu.id);
    expect(document.activeElement).toBe(firstAction);

    firstAction.click();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[role="menu"]')).toBeNull();
  });

  it('normalizes the user-menu name and handles menuitem variants and disabled items', async () => {
    @Component({
      imports: [KrnUserMenu],
      template: `
        <krn-user-menu name="  Avery Cole  " menuAriaLabel="   ">
          <button
            role="menuitemradio"
            aria-checked="false"
            aria-disabled="true"
            type="button"
            (click)="disabledActions += 1"
          >
            Disabled workspace
          </button>
          <button role="menuitemcheckbox" aria-checked="false" type="button">Compact mode</button>
        </krn-user-menu>
      `,
    })
    class UserMenuVariantsHost {
      disabledActions = 0;
    }

    const fixture = TestBed.createComponent(UserMenuVariantsHost);
    await fixture.whenStable();
    const trigger = fixture.nativeElement.querySelector('.trigger') as HTMLButtonElement;
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    await fixture.whenStable();
    await new Promise<void>((resolve) => queueMicrotask(resolve));

    const element = fixture.nativeElement as HTMLElement;
    const menu = element.querySelector('[role="menu"]') as HTMLElement;
    const items = element.querySelectorAll<HTMLButtonElement>('[role^="menuitem"]');
    expect(trigger.querySelector('strong')?.textContent).toBe('Avery Cole');
    expect(menu.getAttribute('aria-label')?.trim()).toBeTruthy();
    expect([...items].map((item) => item.tabIndex)).toEqual([-1, -1]);
    expect(document.activeElement).toBe(items[1]);

    items[0]?.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.disabledActions).toBe(0);
    expect(fixture.nativeElement.querySelector('[role="menu"]')).not.toBeNull();

    const instance = fixture.debugElement.query(By.directive(KrnUserMenu))
      .componentInstance as KrnUserMenu;
    items[1]?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    await fixture.whenStable();
    expect(instance.open()).toBe(false);

    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    await fixture.whenStable();
    const reopenedItem = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '[role="menuitemcheckbox"]',
    );
    reopenedItem?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }),
    );
    await fixture.whenStable();
    expect(instance.open()).toBe(false);

    instance.open.set(true);
    fixture.detectChanges();
    trigger.focus();
    trigger.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );
    await fixture.whenStable();
    expect(instance.open()).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it('rejects an empty user-menu name', async () => {
    await TestBed.configureTestingModule({ imports: [KrnUserMenu] }).compileComponents();
    const fixture = TestBed.createComponent(KrnUserMenu);
    fixture.componentRef.setInput('name', '   ');
    expect(() => fixture.detectChanges()).toThrowError(/non-empty name/);
  });

  it('composes settings with the coordinated drawer contract', async () => {
    await TestBed.configureTestingModule({ imports: [KrnSettingsPanel] }).compileComponents();
    const fixture = TestBed.createComponent(KrnSettingsPanel);
    fixture.componentRef.setInput('heading', 'Workspace settings');
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    const title = fixture.nativeElement.querySelector('h2') as HTMLElement;
    expect(dialog).not.toBeNull();
    expect(title.textContent).toContain('Workspace settings');
    expect(dialog.getAttribute('aria-labelledby')).toBe(title.id);

    (fixture.nativeElement.querySelector('.close') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.open()).toBe(false);
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

  it('keeps pattern field ids instance-safe and reacts to validation inputs', async () => {
    await TestBed.configureTestingModule({
      imports: [KrnLoginForm, KrnProfileForm],
    }).compileComponents();
    const first = TestBed.createComponent(KrnLoginForm);
    const second = TestBed.createComponent(KrnLoginForm);
    first.componentRef.setInput('minimumPasswordLength', 16);
    first.componentRef.setInput('emailLabel', 'Work email');
    await Promise.all([first.whenStable(), second.whenStable()]);

    const firstEmail = first.nativeElement.querySelector('input[type="email"]') as HTMLInputElement;
    const secondEmail = second.nativeElement.querySelector(
      'input[type="email"]',
    ) as HTMLInputElement;
    expect(firstEmail.id).not.toBe(secondEmail.id);
    expect(
      first.nativeElement.querySelector(`label[for="${firstEmail.id}"]`)?.textContent,
    ).toContain('Work email');

    first.componentInstance.form.controls.password.setValue('short-password');
    await first.whenStable();
    expect(first.componentInstance.form.controls.password.hasError('minlength')).toBe(true);

    const profile = TestBed.createComponent(KrnProfileForm);
    profile.componentRef.setInput('bioMaxLength', 5);
    await profile.whenStable();
    profile.componentInstance.form.controls.bio.setValue('too long');
    expect(profile.componentInstance.form.controls.bio.hasError('maxlength')).toBe(true);
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
