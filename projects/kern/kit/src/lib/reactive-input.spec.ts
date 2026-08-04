import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KrnI18n, provideKrn } from '@kern-ui/angular/core';

import { KrnList } from './data-display/list';
import { KrnProgressBar } from './feedback/progress';
import { KrnPasswordInput } from './forms/text-inputs';
import { KrnSidebar } from './layout/app-shell';
import { KrnPagination } from './navigation/pagination';

@Component({
  imports: [KrnList, KrnProgressBar, KrnPasswordInput, KrnSidebar, KrnPagination],
  template: `
    <krn-list data-testid="list-default" />
    <krn-list data-testid="list-explicit" ariaLabel="Pinned list" />

    <krn-progress-bar data-testid="progress-default" />
    <krn-progress-bar data-testid="progress-explicit" ariaLabel="Pinned progress" />

    <krn-password-input data-testid="password-default" />
    <krn-password-input data-testid="password-explicit" showLabel="Pinned show" />

    <krn-sidebar data-testid="sidebar-default" />
    <krn-sidebar data-testid="sidebar-explicit" ariaLabel="Pinned navigation" />

    <krn-pagination data-testid="pagination-default" [pageSize]="1" [totalItems]="2" />
    <krn-pagination
      data-testid="pagination-explicit"
      previousLabel="Pinned previous"
      [pageSize]="1"
      [totalItems]="2"
    />
  `,
})
class ReactiveTranslationDefaultsHost {}

describe('reactive translation input defaults', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('updates inherited labels without replacing explicit component inputs', async () => {
    TestBed.configureTestingModule({
      imports: [ReactiveTranslationDefaultsHost],
      providers: [provideKrn()],
    });
    const fixture = TestBed.createComponent(ReactiveTranslationDefaultsHost);
    await fixture.whenStable();

    TestBed.inject(KrnI18n).setTranslations({
      dataDisplay: { list: 'Reactive list' },
      feedback: { progress: 'Reactive progress' },
      forms: { showPassword: 'Reactive show password' },
      layout: { secondaryNavigation: 'Reactive navigation' },
      navigation: { previous: 'Reactive previous' },
    });
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const byTestId = (value: string): HTMLElement =>
      element.querySelector<HTMLElement>(`[data-testid="${value}"]`)!;

    expect(byTestId('list-default').getAttribute('aria-label')).toBe('Reactive list');
    expect(byTestId('list-explicit').getAttribute('aria-label')).toBe('Pinned list');

    expect(byTestId('progress-default').getAttribute('aria-label')).toBe('Reactive progress');
    expect(byTestId('progress-explicit').getAttribute('aria-label')).toBe('Pinned progress');

    expect(byTestId('password-default').querySelector('button')?.getAttribute('aria-label')).toBe(
      'Reactive show password',
    );
    expect(byTestId('password-explicit').querySelector('button')?.getAttribute('aria-label')).toBe(
      'Pinned show',
    );

    expect(byTestId('sidebar-default').querySelector('aside')?.getAttribute('aria-label')).toBe(
      'Reactive navigation',
    );
    expect(byTestId('sidebar-explicit').querySelector('aside')?.getAttribute('aria-label')).toBe(
      'Pinned navigation',
    );

    expect(
      byTestId('pagination-default').querySelector('.direction-label')?.textContent?.trim(),
    ).toBe('Reactive previous');
    expect(
      byTestId('pagination-explicit').querySelector('.direction-label')?.textContent?.trim(),
    ).toBe('Pinned previous');
  });
});
