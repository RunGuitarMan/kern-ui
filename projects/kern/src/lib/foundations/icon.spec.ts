import { TestBed } from '@angular/core/testing';

import { KrnIcon } from './icon';

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
});
