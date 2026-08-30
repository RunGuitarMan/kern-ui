import { InteractivityChecker } from '@angular/cdk/a11y';
import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { KRN_PLATFORM } from '@kern-ui/angular/cdk';
import { KrnAppShell } from './app-shell';

@Component({
  imports: [KrnAppShell],
  template: `
    <span id="workspace-navigation-title">Workspace navigation</span>
    <span id="workspace-navigation-help">Choose a workspace section.</span>
    <button class="external-navigation-trigger" type="button">Open custom navigation</button>
    <krn-app-shell
      mobileNavigationLabelledBy="workspace-navigation-title"
      mobileNavigationDescribedBy="workspace-navigation-help"
      mobileNavigationInitialFocus=".primary-navigation-action"
      [mobileNavigation]="mobileNavigation()"
    >
      <nav krnAppSidebar>
        <button class="primary-navigation-action" type="button">Projects</button>
      </nav>
      <p>Workspace content</p>
    </krn-app-shell>
  `,
})
class MobileAppShellHost {
  readonly shell = viewChild.required(KrnAppShell);
  readonly mobileNavigation = signal<'auto' | 'hidden'>('auto');
}

const mediaQuery = (matches: boolean): MediaQueryList =>
  ({
    matches,
    media: '(max-width: 48rem)',
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => true,
  }) as MediaQueryList;

describe('KrnAppShell', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('canonicalizes confirmed desktop open requests and exposes programmatic main focus', async () => {
    const defaultPlatform = TestBed.inject(KRN_PLATFORM);
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [KrnAppShell],
      providers: [
        {
          provide: KRN_PLATFORM,
          useValue: { ...defaultPlatform, matchMedia: () => mediaQuery(false) },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(KrnAppShell);
    document.body.append(fixture.nativeElement);
    fixture.componentRef.setInput('mobileNavigationOpen', true);
    await fixture.whenStable();
    const component = fixture.componentInstance;
    const main = fixture.nativeElement.querySelector('main') as HTMLElement;

    expect(component.mobileNavigationOpen()).toBe(false);
    component.openMobileNavigation();
    expect(component.mobileNavigationOpen()).toBe(false);

    component.focusMain({ preventScroll: true });
    expect(document.activeElement).toBe(main);

    fixture.destroy();
    fixture.nativeElement.remove();
  });

  it('preserves controlled open state when the responsive viewport is unknown on SSR', async () => {
    const defaultPlatform = TestBed.inject(KRN_PLATFORM);
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [KrnAppShell],
      providers: [
        {
          provide: KRN_PLATFORM,
          useValue: {
            ...defaultPlatform,
            isBrowser: false,
            matchMedia: () => null,
            window: null,
          },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(KrnAppShell);
    fixture.componentRef.setInput('mobileNavigationOpen', true);
    await fixture.whenStable();

    expect(fixture.componentInstance.mobileNavigationOpen()).toBe(true);
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
  });

  it('composes dialog semantics, honors initial focus, and rejects hidden open state', async () => {
    const defaultPlatform = TestBed.inject(KRN_PLATFORM);
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [MobileAppShellHost],
      providers: [
        {
          provide: KRN_PLATFORM,
          useValue: { ...defaultPlatform, matchMedia: () => mediaQuery(true) },
        },
        {
          provide: InteractivityChecker,
          useValue: {
            isFocusable: (element: HTMLElement) =>
              !element.hasAttribute('disabled') && element.tabIndex >= 0,
          },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(MobileAppShellHost);
    document.body.append(fixture.nativeElement);
    fixture.detectChanges();
    const component = fixture.componentInstance.shell();
    const trigger = fixture.nativeElement.querySelector(
      '.krn-shell__mobile-trigger',
    ) as HTMLButtonElement;
    const dialog = fixture.nativeElement.querySelector('.krn-shell__navigation') as HTMLElement;
    const primaryAction = fixture.nativeElement.querySelector(
      '.primary-navigation-action',
    ) as HTMLButtonElement;
    const externalTrigger = fixture.nativeElement.querySelector(
      '.external-navigation-trigger',
    ) as HTMLButtonElement;

    trigger.focus();
    component.openMobileNavigation();
    fixture.detectChanges();
    await new Promise<void>((resolve) => queueMicrotask(resolve));

    expect(component.mobileNavigationOpen()).toBe(true);
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
    expect(dialog.getAttribute('role')).toBe('dialog');
    expect(dialog.getAttribute('aria-label')).toBeNull();
    expect(dialog.getAttribute('aria-labelledby')).toBe('workspace-navigation-title');
    expect(dialog.getAttribute('aria-describedby')).toBe('workspace-navigation-help');
    expect(document.activeElement).toBe(primaryAction);

    component.toggleMobileNavigation();
    fixture.detectChanges();
    await new Promise<void>((resolve) => queueMicrotask(resolve));
    expect(component.mobileNavigationOpen()).toBe(false);
    expect(document.activeElement).toBe(trigger);

    externalTrigger.focus();
    component.openMobileNavigation();
    fixture.detectChanges();
    await new Promise<void>((resolve) => queueMicrotask(resolve));
    expect(document.activeElement).toBe(primaryAction);

    component.closeMobileNavigation();
    fixture.detectChanges();
    await new Promise<void>((resolve) => queueMicrotask(resolve));
    expect(document.activeElement).toBe(externalTrigger);

    document.body.tabIndex = -1;
    document.body.focus();
    expect(document.activeElement).toBe(document.body);
    component.openMobileNavigation();
    fixture.detectChanges();
    await new Promise<void>((resolve) => queueMicrotask(resolve));
    component.closeMobileNavigation();
    fixture.detectChanges();
    await new Promise<void>((resolve) => queueMicrotask(resolve));
    expect(document.activeElement).toBe(trigger);
    document.body.removeAttribute('tabindex');

    fixture.componentInstance.mobileNavigation.set('hidden');
    await fixture.whenStable();
    component.openMobileNavigation();
    expect(component.mobileNavigationOpen()).toBe(false);

    fixture.destroy();
    fixture.nativeElement.remove();
  });
});
