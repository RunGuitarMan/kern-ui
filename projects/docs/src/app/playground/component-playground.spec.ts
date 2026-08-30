import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { KERN_CATALOG, type KernCatalogItem } from '@kern-ui/showcase';

import { PreviewFixtureEn } from './component-playground';

function catalogItem(id: string): KernCatalogItem {
  const item = KERN_CATALOG.find((candidate) => candidate.id === id);
  if (!item) throw new Error(`Missing catalog item "${id}".`);
  return item;
}

describe('component playground teaching states', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PreviewFixtureEn],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('renders the Text Input filled story as a real input value', async () => {
    const fixture = TestBed.createComponent(PreviewFixtureEn);
    fixture.componentRef.setInput('item', catalogItem('text-input'));
    fixture.componentRef.setInput('scenario', 'default');
    fixture.componentRef.setInput('state', 'filled');
    fixture.componentRef.setInput('args', {});
    fixture.componentRef.setInput('resetRevision', 0);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('krn-text-input[data-specimen-target]')).not.toBeNull();
    expect(element.querySelector<HTMLInputElement>('krn-text-input input')?.value).toBe(
      'Acme Europe',
    );
    expect(element.querySelector('[data-applied-control="value"]')?.textContent).toContain(
      'Acme Europe',
    );
  });

  it('marks the actual Text Input control as the focus-visible target', async () => {
    const fixture = TestBed.createComponent(PreviewFixtureEn);
    fixture.componentRef.setInput('item', catalogItem('text-input'));
    fixture.componentRef.setInput('scenario', 'default');
    fixture.componentRef.setInput('state', 'focus-visible');
    fixture.componentRef.setInput('args', {});
    fixture.componentRef.setInput('resetRevision', 0);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('krn-text-input[data-specimen-target]')).not.toBeNull();
    expect(
      element.querySelector('krn-text-input input[data-specimen-focus-target]'),
    ).not.toBeNull();
    expect(element.querySelector('.form-surface[data-specimen-focus-target]')).toBeNull();
  });

  it('labels a noninteractive target as a static example', async () => {
    const fixture = TestBed.createComponent(PreviewFixtureEn);
    fixture.componentRef.setInput('item', catalogItem('header'));
    fixture.componentRef.setInput('scenario', 'default');
    fixture.componentRef.setInput('state', 'default');
    fixture.componentRef.setInput('args', {});
    fixture.componentRef.setInput('resetRevision', 0);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const indicator = (fixture.nativeElement as HTMLElement).querySelector(
      '.live-indicator[data-interactive="false"]',
    );
    expect(indicator?.textContent).toContain('Static example');
  });
});
