import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { KrnChart } from '@kern-ui/angular/addon-charts';
import {
  createKrnTranslations,
  KRN_TRANSLATIONS,
  provideKrnTranslationBridge,
} from '@kern-ui/angular/core';
import {
  KrnChip,
  KrnCopyButton,
  KrnPasswordInput,
  KrnProgressBar,
  KrnSlider,
} from '@kern-ui/angular/kit';
import { KrnLoginForm } from '@kern-ui/angular/patterns';

@Component({
  imports: [
    KrnChart,
    KrnChip,
    KrnCopyButton,
    KrnLoginForm,
    KrnPasswordInput,
    KrnProgressBar,
    KrnSlider,
  ],
  template: `
    <krn-copy-button value="sample" />
    <krn-password-input />
    <krn-slider />
    <krn-progress-bar />
    <krn-chip removable>Alpha</krn-chip>
    <krn-login-form />
    <krn-chart title="Revenue" [data]="chartData" />
  `,
})
class KrnTranslationHost {
  protected readonly chartData = [{ label: 'North', value: 42 }];
}

describe('Kern translations', () => {
  it('applies one translation contract across public component families', async () => {
    TestBed.configureTestingModule({
      imports: [KrnTranslationHost],
      providers: [
        {
          provide: KRN_TRANSLATIONS,
          useValue: createKrnTranslations({
            actions: { copyToClipboard: 'Localized copy' },
            chart: {
              viewData: 'Localized data',
              datumLabel: (label, value) => `${label} equals ${value}`,
              summary: (title, items) => `${title}: ${items.join('; ')}`,
            },
            dataDisplay: {
              tag: 'localized tag',
              removeItem: (label) => `Localized remove ${label}`,
            },
            feedback: { progress: 'Localized progress' },
            forms: {
              showPassword: 'Localized reveal',
              show: 'Reveal',
              value: 'Localized value',
            },
            patterns: {
              email: 'Localized email',
              signIn: 'Localized sign in',
            },
          }),
        },
        provideKrnTranslationBridge(),
      ],
    });

    const fixture = TestBed.createComponent(KrnTranslationHost);
    fixture.detectChanges();
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('krn-copy-button button')?.getAttribute('aria-label')).toBeNull();
    expect(element.querySelector('krn-copy-button .krn-copy-label')?.textContent?.trim()).toBe(
      'Localized copy',
    );
    expect(element.querySelector('krn-password-input button')?.getAttribute('aria-label')).toBe(
      'Localized reveal',
    );
    expect(element.querySelector('krn-slider input')?.getAttribute('aria-label')).toBe(
      'Localized value',
    );
    expect(element.querySelector('krn-progress-bar')?.getAttribute('aria-label')).toBe(
      'Localized progress',
    );
    expect(element.querySelector('krn-chip .remove')?.getAttribute('aria-label')).toBe(
      'Localized remove localized tag',
    );
    expect(element.querySelector('krn-login-form label')?.textContent).toContain('Localized email');
    expect(element.querySelector('krn-login-form .submit')?.textContent).toContain(
      'Localized sign in',
    );
    expect(element.querySelector('krn-chart .data-toggle')?.textContent).toContain(
      'Localized data',
    );
    expect(element.querySelector('krn-chart svg')?.getAttribute('aria-label')).toBe(
      'Revenue: North equals 42',
    );
  });

  it('bridges a nested complete registry into Copy Button leaf labels', async () => {
    @Component({
      imports: [KrnCopyButton],
      providers: [
        {
          provide: KRN_TRANSLATIONS,
          useValue: createKrnTranslations({
            actions: {
              copied: 'Bereich kopiert',
              copying: 'Bereich wird kopiert…',
              copyFailed: 'Bereich konnte nicht kopiert werden',
              copyToClipboard: 'Bereich kopieren',
            },
          }),
        },
        provideKrnTranslationBridge(),
      ],
      template: `<krn-copy-button value="nested" />`,
    })
    class NestedTranslationHost {}

    const fixture = TestBed.createComponent(NestedTranslationHost);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const button = element.querySelector('button') as HTMLButtonElement;
    const labels = Array.from(element.querySelectorAll<HTMLElement>('.krn-copy-label'), (label) =>
      label.textContent?.trim(),
    );

    expect(button.getAttribute('aria-label')).toBeNull();
    expect(button.querySelector('.krn-action__status')?.textContent?.trim()).toBe('');
    expect(labels).toEqual(['Bereich kopieren']);
  });
});
