import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import type { Type } from '@angular/core';
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

  it('closes a dialog on Escape and restores controlled state', async () => {
    const fixture = await create(KrnDialog, { open: true, title: 'Edit profile' });
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeTruthy();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.open()).toBe(false);
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
