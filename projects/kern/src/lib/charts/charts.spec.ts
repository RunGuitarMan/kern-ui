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

    expect(fixture.componentInstance.linePoints()).toHaveLength(3);
    expect(fixture.componentInstance.linePath()).toContain('M');
    expect(fixture.componentInstance.accessibleSummary()).toContain('Feb: 24');
    expect((fixture.nativeElement as HTMLElement).querySelector('svg')?.getAttribute('role')).toBe(
      'img',
    );
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('.mark-hit-area')).toHaveLength(
      3,
    );
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

    expect(fixture.componentInstance.total()).toBe(100);
    expect(fixture.componentInstance.donutSegments()[1]?.percent).toBe(75);
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
});
