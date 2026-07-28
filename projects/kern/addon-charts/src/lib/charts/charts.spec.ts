import { TestBed } from '@angular/core/testing';

import { KrnChart } from './charts';

describe('KrnChart', () => {
  it('creates readable line geometry and a source-data summary', async () => {
    await TestBed.configureTestingModule({ imports: [KrnChart] }).compileComponents();
    const fixture = TestBed.createComponent(KrnChart);
    fixture.componentRef.setInput('title', 'Revenue');
    fixture.componentRef.setInput('data', [
      { label: 'Jan', value: 12 },
      { label: 'Feb', value: 24 },
      { label: 'Mar', value: 18 },
    ]);
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('.point')).toHaveLength(3);
    expect(element.querySelector('.line')?.getAttribute('d')).toContain('M');
    expect(element.querySelector('svg')?.getAttribute('aria-label')).toContain('Feb: 24');
    expect(element.querySelector('svg')?.getAttribute('role')).toBe('img');
    expect(element.querySelectorAll('.mark-hit-area')).toHaveLength(3);
  });

  it('calculates donut shares without mutating data', async () => {
    await TestBed.configureTestingModule({ imports: [KrnChart] }).compileComponents();
    const fixture = TestBed.createComponent(KrnChart);
    fixture.componentRef.setInput('title', 'Mix');
    fixture.componentRef.setInput('type', 'donut');
    fixture.componentRef.setInput('data', [
      { label: 'A', value: 25 },
      { label: 'B', value: 75 },
    ]);
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.donut-total')?.textContent?.trim()).toBe('100');
    expect(element.querySelectorAll('.donut-hit-area')[1]?.getAttribute('aria-label')).toContain(
      '75%',
    );
  });

  it('discloses the active line datum on pointer and keyboard interaction', async () => {
    await TestBed.configureTestingModule({ imports: [KrnChart] }).compileComponents();
    const fixture = TestBed.createComponent(KrnChart);
    fixture.componentRef.setInput('title', 'Active users');
    fixture.componentRef.setInput('data', [
      { label: 'Monday', value: 120 },
      { label: 'Tuesday', value: 168, description: 'Peak day' },
    ]);
    fixture.detectChanges();
    await fixture.whenStable();

    const points = (fixture.nativeElement as HTMLElement).querySelectorAll<SVGGElement>('.point');
    points[1]?.dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();

    const tooltip = (fixture.nativeElement as HTMLElement).querySelector('.chart-tooltip');
    expect(fixture.componentInstance.activeIndex()).toBe(1);
    expect(tooltip?.textContent).toContain('Tuesday');
    expect(tooltip?.textContent).toContain('168');
    expect(tooltip?.textContent).toContain('Peak day');

    points[1]?.dispatchEvent(new MouseEvent('mouseleave'));
    fixture.detectChanges();
    expect(fixture.componentInstance.activeIndex()).toBe(1);
    await new Promise((resolve) => setTimeout(resolve, 130));
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('.chart-tooltip')).toBeNull();
  });

  it('supports focus disclosure for donut segments and mirrors it in the legend', async () => {
    await TestBed.configureTestingModule({ imports: [KrnChart] }).compileComponents();
    const fixture = TestBed.createComponent(KrnChart);
    fixture.componentRef.setInput('title', 'Plan mix');
    fixture.componentRef.setInput('type', 'donut');
    fixture.componentRef.setInput('data', [
      { label: 'Starter', value: 30 },
      { label: 'Scale', value: 70 },
    ]);
    fixture.detectChanges();
    await fixture.whenStable();

    const segment = (fixture.nativeElement as HTMLElement).querySelectorAll<SVGCircleElement>(
      '.donut-hit-area',
    )[1];
    segment?.dispatchEvent(new FocusEvent('focus'));
    fixture.detectChanges();

    expect(fixture.componentInstance.activeIndex()).toBe(1);
    expect(
      (fixture.nativeElement as HTMLElement)
        .querySelectorAll('.legend li')[1]
        ?.hasAttribute('data-active'),
    ).toBe(true);
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('.chart-tooltip')?.textContent,
    ).toContain('70');
  });

  it('uses roving focus for line and bar marks', async () => {
    await TestBed.configureTestingModule({ imports: [KrnChart] }).compileComponents();
    const fixture = TestBed.createComponent(KrnChart);
    fixture.componentRef.setInput('title', 'Revenue');
    fixture.componentRef.setInput('data', [
      { label: 'Jan', value: 12 },
      { label: 'Feb', value: 24 },
      { label: 'Mar', value: 18 },
    ]);
    fixture.detectChanges();
    await fixture.whenStable();

    const points = (fixture.nativeElement as HTMLElement).querySelectorAll<SVGGElement>('.point');
    expect(points[0]?.getAttribute('tabindex')).toBe('0');
    expect(points[1]?.getAttribute('tabindex')).toBe('-1');

    points[0]?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();

    expect(fixture.componentInstance.activeIndex()).toBe(1);
    expect(points[1]?.getAttribute('tabindex')).toBe('0');
    expect(document.activeElement).toBe(points[1]);
  });

  it('localizes generated labels and values without changing the data contract', async () => {
    await TestBed.configureTestingModule({ imports: [KrnChart] }).compileComponents();
    const fixture = TestBed.createComponent(KrnChart);
    fixture.componentRef.setInput('title', 'Umsatz');
    fixture.componentRef.setInput('data', [{ label: 'Januar', value: 1234.5 }]);
    fixture.componentRef.setInput('locale', 'de-DE');
    fixture.componentRef.setInput('tableVisible', true);
    fixture.componentRef.setInput('labels', {
      hideData: 'Daten ausblenden',
      sourceData: 'Quelldaten',
      labelColumn: 'Monat',
      valueColumn: 'Wert',
      shareColumn: 'Anteil',
    });
    fixture.detectChanges();
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.data-toggle')?.textContent).toContain('Daten ausblenden');
    expect(element.querySelector('caption')?.textContent).toContain('Quelldaten');
    expect(
      [...element.querySelectorAll('thead th')].map((cell) => cell.textContent?.trim()),
    ).toEqual(['Monat', 'Wert', 'Anteil']);
    expect(element.querySelector('tbody td')?.textContent?.trim()).toBe('1.234,5');
  });
});
