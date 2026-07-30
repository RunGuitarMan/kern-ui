import { OverlayContainer } from '@angular/cdk/overlay';
import { Component, signal, viewChild } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import type { Type } from '@angular/core';
import { provideKrn } from '@kern-ui/angular/core';
import { KrnDropdownButton } from '../actions/dropdown-button';
import { KrnAlert } from './alert';
import { KrnHoverCard, KrnPopover, KrnTooltip } from './hint-overlays';
import { KrnDialog } from './modal-overlays';
import { KrnAlertDialog, KrnBottomSheet, KrnDrawer } from './modal-overlays';
import {
  KrnCircularProgress,
  KrnLoadingOverlay,
  KrnProgressBar,
  KrnSkeleton,
  KrnSpinner,
} from './progress';
import { KrnConfirmation, KrnEmptyState, KrnErrorState, KrnSuccessState } from './states';
import { KrnToastService, KrnToastViewport } from './toast';

function inertAncestor(element: Element | null): HTMLElement | null {
  let current = element instanceof HTMLElement ? element : (element?.parentElement ?? null);
  while (current) {
    if (current.inert === true) return current;
    current = current.parentElement;
  }
  return null;
}

describe('Kern feedback', () => {
  it('exposes hint, overlay, progress, state and confirmation primitives', () => {
    expect([
      KrnTooltip,
      KrnPopover,
      KrnHoverCard,
      KrnAlertDialog,
      KrnDrawer,
      KrnBottomSheet,
      KrnCircularProgress,
      KrnSpinner,
      KrnSkeleton,
      KrnLoadingOverlay,
      KrnEmptyState,
      KrnErrorState,
      KrnSuccessState,
      KrnConfirmation,
    ]).toHaveLength(14);
  });

  it('uses assertive alert semantics for destructive feedback and can dismiss it', async () => {
    const fixture = await create(KrnAlert, {
      tone: 'danger',
      title: 'Upload failed',
      dismissible: true,
    });
    const alert = fixture.nativeElement.querySelector('[role="alert"]');
    expect(alert?.getAttribute('aria-live')).toBe('assertive');
    (fixture.nativeElement.querySelector('.dismiss') as HTMLButtonElement | null)?.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.alert')).toBeNull();
  });

  it('publishes and removes toast records through the service', async () => {
    await TestBed.configureTestingModule({ imports: [KrnToastViewport] }).compileComponents();
    const fixture = TestBed.createComponent(KrnToastViewport);
    const service = TestBed.inject(KrnToastService);
    service.show('Preferences saved', { tone: 'success', duration: 0 });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="status"]')?.textContent).toContain(
      'Preferences saved',
    );
    (fixture.nativeElement.querySelector('.dismiss') as HTMLButtonElement | null)?.click();
    fixture.detectChanges();
    expect(service.toasts()).toHaveLength(0);
  });

  it('keeps duplicate toasts individually dismissible', async () => {
    await TestBed.configureTestingModule({ imports: [KrnToastViewport] }).compileComponents();
    const fixture = TestBed.createComponent(KrnToastViewport);
    const service = TestBed.inject(KrnToastService);
    service.show('Build completed', { title: 'Ready', tone: 'success', duration: 0 });
    service.show('Build completed', { title: 'Ready', tone: 'success', duration: 0 });
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('.toast')).toHaveLength(2);
    const dismissButtons = element.querySelectorAll<HTMLButtonElement>('.dismiss');
    dismissButtons[0]?.click();
    fixture.detectChanges();
    expect(service.toasts()).toHaveLength(1);
    expect(element.querySelectorAll('.toast')).toHaveLength(1);
  });

  it('bounds a large toast stack and offers review and clear-all controls', async () => {
    await TestBed.configureTestingModule({ imports: [KrnToastViewport] }).compileComponents();
    const fixture = TestBed.createComponent(KrnToastViewport);
    fixture.componentRef.setInput('maxVisible', 2);
    const service = TestBed.inject(KrnToastService);
    for (let index = 1; index <= 6; index += 1) {
      service.show(`Notification ${index}`, { duration: 0 });
    }
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('.toast')).toHaveLength(2);
    const review = element.querySelector('.review') as HTMLButtonElement | null;
    expect(review?.textContent).toContain('4 earlier');
    review?.click();
    fixture.detectChanges();
    expect(element.querySelectorAll('.toast')).toHaveLength(6);

    (element.querySelector('.clear') as HTMLButtonElement | null)?.click();
    fixture.detectChanges();
    expect(service.toasts()).toHaveLength(0);
  });

  it('keeps actionable toasts persistent unless a duration is explicitly provided', async () => {
    vi.useFakeTimers();
    try {
      await TestBed.configureTestingModule({ imports: [KrnToastViewport] }).compileComponents();
      const service = TestBed.inject(KrnToastService);
      service.show('Deployment is ready', {
        actionLabel: 'Open',
        action: () => undefined,
      });

      await vi.advanceTimersByTimeAsync(30_000);
      expect(service.toasts()).toHaveLength(1);
      expect(service.toasts()[0]?.duration).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('pauses toast timeout while pointer or keyboard focus is interacting with it', async () => {
    vi.useFakeTimers();
    try {
      await TestBed.configureTestingModule({ imports: [KrnToastViewport] }).compileComponents();
      const service = TestBed.inject(KrnToastService);
      const id = service.show('Saved', { duration: 1_000 });

      await vi.advanceTimersByTimeAsync(400);
      service.pause(id, 'pointer');
      service.pause(id, 'focus');
      await vi.advanceTimersByTimeAsync(2_000);
      expect(service.toasts()).toHaveLength(1);

      service.resume(id, 'pointer');
      await vi.advanceTimersByTimeAsync(1_000);
      expect(service.toasts()).toHaveLength(1);

      service.resume(id, 'focus');
      await vi.advanceTimersByTimeAsync(599);
      expect(service.toasts()).toHaveLength(1);
      await vi.advanceTimersByTimeAsync(1);
      expect(service.toasts()).toHaveLength(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('clamps determinate progress and exposes the value to assistive technology', async () => {
    const fixture = await create(KrnProgressBar, {
      value: 140,
      max: 100,
      ariaLabel: 'Import progress',
    });
    expect(fixture.nativeElement.getAttribute('aria-valuenow')).toBe('100');
    expect(fixture.nativeElement.getAttribute('aria-label')).toBe('Import progress');
    expect(
      (fixture.nativeElement.querySelector('.indicator') as HTMLElement | null)?.style.inlineSize,
    ).toBe('100%');
  });

  it('removes projected controls from keyboard and accessibility navigation while blocking', async () => {
    const fixture = await create(KrnLoadingOverlay, {
      active: true,
      blocking: true,
    });
    const content = fixture.nativeElement.querySelector('.loading-content') as HTMLElement;
    expect(content.getAttribute('inert')).toBe('');
    expect(content.getAttribute('aria-hidden')).toBe('true');

    fixture.componentRef.setInput('blocking', false);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(content.hasAttribute('inert')).toBe(false);
    expect(content.hasAttribute('aria-hidden')).toBe(false);

    fixture.componentRef.setInput('blocking', true);
    fixture.componentRef.setInput('active', false);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(content.hasAttribute('inert')).toBe(false);
    expect(content.hasAttribute('aria-hidden')).toBe(false);
  });

  it('renders distinct semantic fallback visuals for empty, error, and success states', async () => {
    await TestBed.configureTestingModule({
      imports: [KrnEmptyState, KrnErrorState, KrnSuccessState],
    }).compileComponents();
    const empty = TestBed.createComponent(KrnEmptyState);
    const error = TestBed.createComponent(KrnErrorState);
    const success = TestBed.createComponent(KrnSuccessState);
    empty.detectChanges();
    error.detectChanges();
    success.detectChanges();
    await Promise.all([empty.whenStable(), error.whenStable(), success.whenStable()]);

    expect(empty.nativeElement.querySelector('.state')?.getAttribute('data-kind')).toBe('empty');
    expect(error.nativeElement.querySelector('.state')?.getAttribute('data-kind')).toBe('error');
    expect(success.nativeElement.querySelector('.state')?.getAttribute('data-kind')).toBe(
      'success',
    );
    expect(empty.nativeElement.querySelector('.default-visual path')?.getAttribute('d')).not.toBe(
      error.nativeElement.querySelector('.default-visual path')?.getAttribute('d'),
    );
  });

  it('treats popover as a non-modal disclosure and restores focus on Escape', async () => {
    await TestBed.configureTestingModule({ imports: [KrnPopover] }).compileComponents();
    const fixture = TestBed.createComponent(KrnPopover);
    document.body.append(fixture.nativeElement);
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector('.origin') as HTMLButtonElement;
    trigger.focus();
    trigger.click();
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise<void>((resolve) => queueMicrotask(resolve));

    const panel = document.querySelector('.popover') as HTMLElement;
    expect(panel.getAttribute('role')).toBe('region');
    expect(panel.hasAttribute('aria-modal')).toBe(false);
    expect(trigger.getAttribute('aria-controls')).toBe(panel.id);
    expect(document.activeElement).toBe(panel);

    const escape = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    panel.dispatchEvent(escape);
    fixture.detectChanges();
    await new Promise<void>((resolve) => queueMicrotask(resolve));
    expect(escape.defaultPrevented).toBe(true);
    expect(document.querySelector('.popover')).toBeNull();
    expect(document.activeElement).toBe(trigger);

    fixture.destroy();
    fixture.nativeElement.remove();
  });

  it('exposes hover-card as a described preview without moving focus into it', async () => {
    await TestBed.configureTestingModule({ imports: [KrnHoverCard] }).compileComponents();
    const fixture = TestBed.createComponent(KrnHoverCard);
    fixture.componentRef.setInput('openDelay', 0);
    document.body.append(fixture.nativeElement);
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector('.origin') as HTMLButtonElement;
    trigger.focus();
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();

    const preview = document.querySelector('.hover-card') as HTMLElement;
    expect(preview.getAttribute('role')).toBe('tooltip');
    expect(trigger.getAttribute('aria-describedby')).toBe(preview.id);
    expect(document.activeElement).toBe(trigger);

    const escape = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    trigger.dispatchEvent(escape);
    fixture.detectChanges();
    expect(escape.defaultPrevented).toBe(true);
    expect(document.querySelector('.hover-card')).toBeNull();

    fixture.destroy();
    fixture.nativeElement.remove();
  });

  it('closes a dialog on Escape and restores controlled state', async () => {
    const fixture = await create(KrnDialog, { open: true, title: 'Edit profile' });
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeTruthy();

    const alreadyHandled = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    alreadyHandled.preventDefault();
    document.dispatchEvent(alreadyHandled);
    fixture.detectChanges();
    expect(fixture.componentInstance.open()).toBe(true);

    const escape = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    document.dispatchEvent(escape);
    fixture.detectChanges();
    expect(escape.defaultPrevented).toBe(true);
    expect(fixture.componentInstance.open()).toBe(false);
  });

  it('reuses one inert dialog surface across repeated open and close cycles', async () => {
    const fixture = await create(KrnDialog, { open: true, title: 'Edit profile' });
    const initialBackdrop = fixture.nativeElement.querySelector('.backdrop') as HTMLElement;

    (fixture.nativeElement.querySelector('.close') as HTMLButtonElement).click();
    fixture.detectChanges();

    const closedBackdrop = fixture.nativeElement.querySelector('.backdrop') as HTMLElement;
    const closedSurface = closedBackdrop.querySelector('.surface') as HTMLElement;
    expect(closedBackdrop).toBe(initialBackdrop);
    expect(closedBackdrop.dataset['state']).toBe('closed');
    expect(closedBackdrop.hasAttribute('hidden')).toBe(true);
    expect(closedBackdrop.hasAttribute('inert')).toBe(true);
    expect(closedBackdrop.getAttribute('aria-hidden')).toBe('true');
    expect(closedSurface.hasAttribute('aria-modal')).toBe(false);

    fixture.componentInstance.open.set(true);
    fixture.detectChanges();

    const reopenedBackdrop = fixture.nativeElement.querySelector('.backdrop') as HTMLElement;
    expect(reopenedBackdrop).toBe(initialBackdrop);
    expect(reopenedBackdrop.dataset['state']).toBe('open');
    expect(reopenedBackdrop.hasAttribute('hidden')).toBe(false);
    expect(reopenedBackdrop.hasAttribute('inert')).toBe(false);
    expect(reopenedBackdrop.hasAttribute('aria-hidden')).toBe(false);
  });

  it('keeps only a nested Kern CDK overlay interactive inside a modal', async () => {
    @Component({
      imports: [KrnDialog, KrnDropdownButton],
      template: `
        <krn-dropdown-button #background class="background-trigger">
          <span krnLabel>Background actions</span>
          <button krnMenu role="menuitem" class="background-item">Background archive</button>
        </krn-dropdown-button>
        @if (showLateBackground()) {
          <krn-dropdown-button #lateBackground class="late-background-trigger">
            <span krnLabel>Late background actions</span>
            <button krnMenu role="menuitem" class="late-background-item">Late archive</button>
          </krn-dropdown-button>
        }
        <krn-dialog title="Edit profile" [(open)]="dialogOpen">
          <krn-dropdown-button class="nested-trigger">
            <span krnLabel>Actions</span>
            <button krnMenu role="menuitem" class="nested-item">Archive</button>
          </krn-dropdown-button>
        </krn-dialog>
      `,
    })
    class NestedOverlayHost {
      readonly dialogOpen = signal(false);
      readonly background = viewChild.required<KrnDropdownButton>('background');
      readonly lateBackground = viewChild<KrnDropdownButton>('lateBackground');
      readonly showLateBackground = signal(false);
    }

    await TestBed.configureTestingModule({ imports: [NestedOverlayHost] }).compileComponents();
    const overlayContainer = TestBed.inject(OverlayContainer).getContainerElement();
    const fixture = TestBed.createComponent(NestedOverlayHost);
    document.body.append(fixture.nativeElement);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.background().open.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise<void>((resolve) => queueMicrotask(resolve));
    const backgroundMenuItem = overlayContainer.querySelector('.background-item') as HTMLElement;
    const backgroundPane = backgroundMenuItem.closest('.cdk-overlay-pane') as HTMLElement;
    expect(backgroundPane.hasAttribute('inert')).toBe(false);

    fixture.componentInstance.dialogOpen.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).querySelector('[role="dialog"]')).not.toBeNull();
    expect(overlayContainer.hasAttribute('inert')).toBe(false);
    expect(backgroundPane.isConnected).toBe(true);
    const preExistingBackgroundBranch = inertAncestor(backgroundPane);
    expect(preExistingBackgroundBranch).not.toBeNull();
    expect(preExistingBackgroundBranch?.getAttribute('aria-hidden')).toBe('true');

    fixture.componentInstance.showLateBackground.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.componentInstance.lateBackground()?.open.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise<void>((resolve) => queueMicrotask(resolve));

    const lateBackgroundPane = overlayContainer
      .querySelector('.late-background-item')
      ?.closest<HTMLElement>('.cdk-overlay-pane');
    expect(inertAncestor(lateBackgroundPane ?? null)).not.toBeNull();

    const trigger = fixture.nativeElement.querySelector(
      '.nested-trigger .krn-action',
    ) as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise<void>((resolve) => queueMicrotask(resolve));

    const menu =
      overlayContainer.querySelector('.nested-item')?.closest<HTMLElement>('[role="menu"]') ?? null;
    expect(menu).not.toBeNull();
    expect(inertAncestor(menu)).toBeNull();
    expect(inertAncestor(lateBackgroundPane ?? null)).not.toBeNull();

    const escape = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    menu?.dispatchEvent(escape);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(escape.defaultPrevented).toBe(true);
    expect(overlayContainer.querySelector('.nested-item')).toBeNull();
    expect(overlayContainer.querySelector('.background-item')).not.toBeNull();
    expect(overlayContainer.querySelector('.late-background-item')).not.toBeNull();
    expect(fixture.componentInstance.dialogOpen()).toBe(true);

    fixture.componentInstance.dialogOpen.set(false);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(inertAncestor(lateBackgroundPane ?? null)).toBeNull();

    fixture.destroy();
    fixture.nativeElement.remove();
  });

  it('keeps a custom overlay-host branch usable without exposing its foreign panes', async () => {
    @Component({
      imports: [KrnDialog, KrnDropdownButton],
      template: `
        <div data-modal-overlay-host>
          <span data-overlay-background>Background overlay content</span>
        </div>
        <krn-dialog title="Edit profile" [(open)]="dialogOpen">
          <krn-dropdown-button>
            <span krnLabel>Actions</span>
            <button krnMenu role="menuitem">Archive</button>
          </krn-dropdown-button>
        </krn-dialog>
      `,
    })
    class CustomOverlayHost {
      readonly dialogOpen = signal(false);
    }

    await TestBed.configureTestingModule({
      imports: [CustomOverlayHost],
      providers: [
        provideKrn({
          overlayHost: '[data-modal-overlay-host]',
          persistPreferences: false,
        }),
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(CustomOverlayHost);
    document.body.append(fixture.nativeElement);
    fixture.detectChanges();

    const customHost = fixture.nativeElement.querySelector(
      '[data-modal-overlay-host]',
    ) as HTMLElement;
    const background = customHost.querySelector('[data-overlay-background]') as HTMLElement;
    const overlayContainer = TestBed.inject(OverlayContainer).getContainerElement();
    const foreignPane = document.createElement('div');
    foreignPane.classList.add('cdk-overlay-pane');
    const backgroundKernPane = document.createElement('div');
    backgroundKernPane.classList.add('cdk-overlay-pane', 'krn-overlay-pane');
    overlayContainer.append(foreignPane, backgroundKernPane);
    expect(overlayContainer.parentElement).toBe(customHost);

    fixture.componentInstance.dialogOpen.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(customHost.hasAttribute('inert')).toBe(false);
    expect(background.inert).toBe(true);
    expect(foreignPane.inert).toBe(true);
    expect(backgroundKernPane.inert).toBe(true);

    (fixture.nativeElement.querySelector('.krn-action') as HTMLButtonElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise<void>((resolve) => queueMicrotask(resolve));

    const menu = overlayContainer.querySelector('[role="menu"]') as HTMLElement;
    expect(inertAncestor(menu)).toBeNull();
    expect(foreignPane.inert).toBe(true);
    expect(backgroundKernPane.inert).toBe(true);

    const escape = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    menu.dispatchEvent(escape);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(escape.defaultPrevented).toBe(true);
    expect(overlayContainer.querySelector('[role="menu"]')).toBeNull();
    expect(fixture.componentInstance.dialogOpen()).toBe(true);

    fixture.destroy();
    fixture.nativeElement.remove();
  });

  it('links modal descriptions and supports an explicit initial-focus policy', async () => {
    await TestBed.configureTestingModule({ imports: [KrnDialog] }).compileComponents();
    const fixture = TestBed.createComponent(KrnDialog);
    document.body.append(fixture.nativeElement);
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('title', 'Edit profile');
    fixture.componentRef.setInput('description', 'Changes affect every workspace.');
    fixture.componentRef.setInput('initialFocus', 'surface');
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve));

    const panel = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    const description = fixture.nativeElement.querySelector('.description') as HTMLElement;
    expect(panel.getAttribute('aria-describedby')).toBe(description.id);
    expect(document.activeElement).toBe(panel);

    fixture.destroy();
    fixture.nativeElement.remove();
  });

  it('restores a pointer opener when the browser does not focus buttons on click', async () => {
    await TestBed.configureTestingModule({ imports: [KrnDialog] }).compileComponents();
    const fixture = TestBed.createComponent(KrnDialog);
    const trigger = document.createElement('button');
    trigger.textContent = 'Open dialog';
    document.body.append(trigger, fixture.nativeElement);
    trigger.dispatchEvent(new Event('pointerdown', { bubbles: true }));

    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('title', 'Edit profile');
    fixture.detectChanges();
    await fixture.whenStable();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    await new Promise<void>((resolve) => queueMicrotask(resolve));

    expect(document.activeElement).toBe(trigger);
    fixture.destroy();
    trigger.remove();
    fixture.nativeElement.remove();
  });

  it('keeps only the top modal interactive and restores the shared scroll lock', async () => {
    await TestBed.configureTestingModule({ imports: [KrnDialog] }).compileComponents();
    const first = TestBed.createComponent(KrnDialog);
    const second = TestBed.createComponent(KrnDialog);
    const background = document.createElement('button');
    background.textContent = 'Open dialog';
    document.body.append(background, first.nativeElement, second.nativeElement);
    background.focus();
    const previousOverflow = document.body.style.overflow;

    first.componentRef.setInput('open', true);
    first.componentRef.setInput('title', 'First');
    first.detectChanges();
    await first.whenStable();
    expect(background.inert).toBe(true);
    expect(document.body.style.overflow).toBe('hidden');

    second.componentRef.setInput('open', true);
    second.componentRef.setInput('title', 'Second');
    second.detectChanges();
    await second.whenStable();
    expect(first.nativeElement.inert).toBe(true);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    second.detectChanges();
    expect(second.componentInstance.open()).toBe(false);
    expect(first.componentInstance.open()).toBe(true);
    expect(first.nativeElement.inert).toBe(false);
    expect(background.inert).toBe(true);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    first.detectChanges();
    expect(first.componentInstance.open()).toBe(false);
    expect(background.inert).toBe(false);
    expect(document.body.style.overflow).toBe(previousOverflow);
    await new Promise<void>((resolve) => queueMicrotask(resolve));
    expect(document.activeElement).toBe(background);

    first.destroy();
    second.destroy();
    background.remove();
    first.nativeElement.remove();
    second.nativeElement.remove();
  });

  it('keeps a closing drawer present only for its exit animation', async () => {
    vi.stubGlobal(
      'matchMedia',
      (query: string): MediaQueryList =>
        ({
          matches: false,
          media: query,
          onchange: null,
          addListener: () => undefined,
          removeListener: () => undefined,
          addEventListener: () => undefined,
          removeEventListener: () => undefined,
          dispatchEvent: () => true,
        }) as MediaQueryList,
    );
    const fixture = await create(KrnDrawer, { open: true, title: 'Workspace settings' });
    const closeReasons: string[] = [];
    fixture.componentInstance.closed.subscribe((reason) => closeReasons.push(reason));

    (fixture.nativeElement.querySelector('.close') as HTMLButtonElement).click();
    fixture.detectChanges();

    const closingBackdrop = fixture.nativeElement.querySelector('.backdrop') as HTMLElement;
    expect(fixture.componentInstance.open()).toBe(false);
    expect(closeReasons).toEqual(['action']);
    expect(closingBackdrop.dataset['state']).toBe('closing');
    expect(closingBackdrop.getAttribute('aria-hidden')).toBe('true');
    expect(closingBackdrop.hasAttribute('inert')).toBe(true);

    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    const reopenedBackdrop = fixture.nativeElement.querySelector('.backdrop') as HTMLElement;
    expect(reopenedBackdrop.dataset['state']).toBe('open');
    expect(reopenedBackdrop.hasAttribute('aria-hidden')).toBe(false);
    expect(reopenedBackdrop.hasAttribute('inert')).toBe(false);

    (fixture.nativeElement.querySelector('.close') as HTMLButtonElement).click();
    fixture.detectChanges();
    const exitEvent = new Event('transitionend');
    Object.defineProperty(exitEvent, 'propertyName', { value: 'opacity' });
    reopenedBackdrop.dispatchEvent(exitEvent);
    fixture.detectChanges();
    expect(closeReasons).toEqual(['action', 'action']);
    expect(fixture.nativeElement.querySelector('.backdrop')).toBeNull();
    vi.unstubAllGlobals();
  });

  it('removes a closing drawer immediately when reduced motion is requested', async () => {
    vi.stubGlobal(
      'matchMedia',
      (query: string): MediaQueryList =>
        ({
          matches: true,
          media: query,
          onchange: null,
          addListener: () => undefined,
          removeListener: () => undefined,
          addEventListener: () => undefined,
          removeEventListener: () => undefined,
          dispatchEvent: () => true,
        }) as MediaQueryList,
    );
    const fixture = await create(KrnDrawer, { open: true, title: 'Workspace settings' });

    (fixture.nativeElement.querySelector('.close') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(fixture.componentInstance.open()).toBe(false);
    expect(fixture.nativeElement.querySelector('.backdrop')).toBeNull();
    vi.unstubAllGlobals();
  });

  it('keeps full motion when the application explicitly overrides the system preference', async () => {
    vi.stubGlobal(
      'matchMedia',
      (query: string): MediaQueryList =>
        ({
          matches: true,
          media: query,
          onchange: null,
          addListener: () => undefined,
          removeListener: () => undefined,
          addEventListener: () => undefined,
          removeEventListener: () => undefined,
          dispatchEvent: () => true,
        }) as MediaQueryList,
    );
    const root = document.documentElement;
    const previous = root.getAttribute('data-krn-motion');
    root.setAttribute('data-krn-motion', 'full');
    const fixture = await create(KrnDrawer, { open: true, title: 'Workspace settings' });

    (fixture.nativeElement.querySelector('.close') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(fixture.componentInstance.open()).toBe(false);
    expect(fixture.nativeElement.querySelector('.backdrop')?.getAttribute('data-state')).toBe(
      'closing',
    );

    fixture.destroy();
    if (previous === null) root.removeAttribute('data-krn-motion');
    else root.setAttribute('data-krn-motion', previous);
    vi.unstubAllGlobals();
  });
});

async function create<T>(
  component: Type<T>,
  inputs: Record<string, unknown>,
): Promise<ComponentFixture<T>> {
  await TestBed.configureTestingModule({ imports: [component] }).compileComponents();
  const fixture = TestBed.createComponent(component);
  Object.entries(inputs).forEach(([name, value]) => fixture.componentRef.setInput(name, value));
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture;
}
