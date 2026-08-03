import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { KrnIcon, KrnIconRegistry, provideKrnIcons } from './icon';

describe('KrnIcon', () => {
  it('renders built-in paths as a decorative SVG by default', () => {
    const fixture = TestBed.createComponent(KrnIcon);
    fixture.componentRef.setInput('name', 'check');
    fixture.detectChanges();

    const svg = fixture.nativeElement.querySelector('svg') as SVGElement;
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.querySelectorAll('path')).toHaveLength(1);
  });

  it('uses an accessible image name when a label is provided', () => {
    const fixture = TestBed.createComponent(KrnIcon);
    fixture.componentRef.setInput('name', 'search');
    fixture.componentRef.setInput('label', 'Search');
    fixture.detectChanges();

    const svg = fixture.nativeElement.querySelector('svg') as SVGElement;
    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.getAttribute('aria-label')).toBe('Search');
    expect(svg.getAttribute('aria-hidden')).toBeNull();
  });

  it('updates an existing icon after late registry registration', () => {
    const fixture = TestBed.createComponent(KrnIcon);
    const registry = TestBed.inject(KrnIconRegistry);
    fixture.componentRef.setInput('name', 'late-icon');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('path')).toBeNull();

    registry.register({ name: 'late-icon', paths: ['M1 1h2'] });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('path')?.getAttribute('d')).toBe('M1 1h2');
  });

  it('resolves feature-scoped icon definitions without mutating the root registry', () => {
    TestBed.configureTestingModule({
      providers: [...provideKrnIcons({ name: 'application-icon', paths: ['M1 1h3'] })],
    });

    @Component({
      imports: [KrnIcon],
      providers: [...provideKrnIcons({ name: 'feature-icon', paths: ['M2 2h4'] })],
      template: `
        <krn-icon name="application-icon" />
        <krn-icon name="feature-icon" />
        <krn-icon name="late-application-icon" />
      `,
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class FeatureIconHost {}

    const fixture = TestBed.createComponent(FeatureIconHost);
    fixture.detectChanges();

    const paths = fixture.nativeElement.querySelectorAll('path') as NodeListOf<SVGPathElement>;
    expect([...paths].map((path) => path.getAttribute('d'))).toEqual(['M1 1h3', 'M2 2h4']);

    const root = TestBed.inject(KrnIconRegistry);
    expect(root.resolve('feature-icon')).toBeUndefined();

    root.register({ name: 'late-application-icon', paths: ['M3 3h5'] });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('path')[2]?.getAttribute('d')).toBe('M3 3h5');
  });
});
