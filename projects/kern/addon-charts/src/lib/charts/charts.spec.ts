import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { KrnChart, type KrnChartLabels } from './charts';

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
    expect(element.querySelector('svg')?.getAttribute('role')).toBe('group');
    expect(
      element.querySelector('svg [role="button"][data-chart-index]')?.getAttribute('aria-label'),
    ).toBe('Jan: 12');
    expect(element.querySelector('svg [role="graphics-symbol"]')).toBeNull();
    expect(element.querySelector('[role="img"]')).toBeNull();
    expect(element.querySelectorAll('.mark-hit-area')).toHaveLength(3);

    (element.querySelector('.data-toggle') as HTMLButtonElement | null)?.click();
    fixture.detectChanges();
    expect(element.querySelector('table caption')?.textContent).toContain('Revenue');
    expect(element.querySelectorAll('tbody tr')).toHaveLength(3);
  });

  it('normalizes visible copy and links the data disclosure to its table', async () => {
    await TestBed.configureTestingModule({ imports: [KrnChart] }).compileComponents();
    const fixture = TestBed.createComponent(KrnChart);
    fixture.componentRef.setInput('title', '  Revenue  ');
    fixture.componentRef.setInput('type', 'donut');
    fixture.componentRef.setInput('palette', ['', 'rebeccapurple']);
    fixture.componentRef.setInput('valueFormatter', () => '   ');
    fixture.componentRef.setInput('percentFormatter', () => '');
    fixture.componentRef.setInput('data', [
      { id: 'jan', label: '  January  ', value: 12, description: '   ' },
    ]);
    fixture.detectChanges();
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('figcaption strong')?.textContent?.trim()).toBe('Revenue');
    expect(element.querySelector('.legend span')?.textContent?.trim()).toBe('January');
    expect(element.querySelector('.legend strong')?.textContent?.trim()).toBe('100%');
    expect(
      (element.querySelector('.legend i') as HTMLElement).style.getPropertyValue('--_series-color'),
    ).toBe('rebeccapurple');

    const toggle = element.querySelector<HTMLButtonElement>('.data-toggle');
    expect(toggle?.hasAttribute('aria-controls')).toBe(false);
    toggle?.click();
    fixture.detectChanges();
    const controlledId = toggle?.getAttribute('aria-controls');
    expect(controlledId).toBeTruthy();
    expect(element.querySelector('.table-scroll')?.id).toBe(controlledId);
    expect(element.querySelector('caption')?.textContent).toContain('Revenue');
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
    expect(element.querySelectorAll('.legend strong')[1]?.textContent).toContain('75%');
  });

  it('preserves the legacy percent-of-total label template', async () => {
    await TestBed.configureTestingModule({ imports: [KrnChart] }).compileComponents();
    const fixture = TestBed.createComponent(KrnChart);
    fixture.componentRef.setInput('title', 'Mix');
    fixture.componentRef.setInput('type', 'donut');
    fixture.componentRef.setInput('data', [{ label: 'A', value: 25 }]);
    const legacyLabels = {
      percentOfTotal: '{value} vom Gesamtwert',
    } satisfies Partial<KrnChartLabels>;
    fixture.componentRef.setInput('labels', legacyLabels);
    fixture.detectChanges();
    await fixture.whenStable();

    const segment = (fixture.nativeElement as HTMLElement).querySelector(
      '.legend button',
    ) as HTMLButtonElement | null;
    segment?.dispatchEvent(new FocusEvent('focus'));
    fixture.detectChanges();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector('.chart-tooltip small')?.textContent,
    ).toContain('100% vom Gesamtwert');

    const formatterLabels = {
      percentOfTotal: 'ignored {value}',
      formatPercentOfTotal: (value: string) => `${value} typed formatter`,
    } satisfies Partial<KrnChartLabels>;
    fixture.componentRef.setInput('labels', formatterLabels);
    fixture.detectChanges();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector('.chart-tooltip small')?.textContent,
    ).toContain('100% typed formatter');
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

    const segment = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>(
      '.legend button',
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

  it('uses roving focus and ARIA button activation for line and bar marks', async () => {
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

    const activation = new KeyboardEvent('keydown', {
      key: ' ',
      bubbles: true,
      cancelable: true,
    });
    points[2]?.dispatchEvent(activation);
    fixture.detectChanges();
    expect(activation.defaultPrevented).toBe(true);
    expect(fixture.componentInstance.activeIndex()).toBe(2);
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

  it('renders an explicit empty state and bounds the accessible summary', async () => {
    await TestBed.configureTestingModule({ imports: [KrnChart] }).compileComponents();
    const fixture = TestBed.createComponent(KrnChart);
    fixture.componentRef.setInput('title', 'Long series');
    fixture.componentRef.setInput(
      'data',
      Array.from({ length: 20 }, (_, index) => ({
        id: index,
        label: `Point ${index + 1}`,
        value: index + 1,
      })),
    );
    fixture.componentRef.setInput('summaryItemLimit', 3);
    fixture.detectChanges();
    await fixture.whenStable();

    const summary = (fixture.nativeElement as HTMLElement)
      .querySelector('svg')
      ?.getAttribute('aria-label');
    expect(summary).toContain('Point 1');
    expect(summary).toContain('17 more data points');
    expect(summary).not.toContain('Point 4');

    fixture.componentRef.setInput('data', []);
    fixture.detectChanges();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('.empty-chart')?.textContent?.trim(),
    ).toBe('No chart data');
    expect((fixture.nativeElement as HTMLElement).querySelector('svg')).toBeNull();
  });

  it('validates datum identity and numeric values at the public boundary', async () => {
    await TestBed.configureTestingModule({ imports: [KrnChart] }).compileComponents();
    const fixture = TestBed.createComponent(KrnChart);
    fixture.componentRef.setInput('title', 'Invalid');
    fixture.componentRef.setInput('data', [
      { id: 'duplicate', label: 'A', value: 1 },
      { id: 'duplicate', label: 'B', value: 2 },
    ]);
    expect(() => fixture.detectChanges()).toThrowError(/identities must be unique/);

    const nonFinite = TestBed.createComponent(KrnChart);
    nonFinite.componentRef.setInput('title', 'Invalid');
    nonFinite.componentRef.setInput('data', [{ label: 'A', value: Number.NaN }]);
    expect(() => nonFinite.detectChanges()).toThrowError(/finite numeric value/);

    const negative = TestBed.createComponent(KrnChart);
    negative.componentRef.setInput('title', 'Invalid');
    negative.componentRef.setInput('negativeValuePolicy', 'reject');
    negative.componentRef.setInput('data', [{ label: 'A', value: -1 }]);
    expect(() => negative.detectChanges()).toThrowError(/negativeValuePolicy is "reject"/);

    for (const identity of [Number.NaN, Number.POSITIVE_INFINITY, '   ']) {
      const invalidIdentity = TestBed.createComponent(KrnChart);
      invalidIdentity.componentRef.setInput('title', 'Invalid');
      invalidIdentity.componentRef.setInput('datumIdentity', () => identity);
      invalidIdentity.componentRef.setInput('data', [{ label: 'A', value: 1 }]);
      expect(() => invalidIdentity.detectChanges()).toThrowError(/invalid identity/);
    }

    const invalidTitle = TestBed.createComponent(KrnChart);
    invalidTitle.componentRef.setInput('title', '   ');
    invalidTitle.componentRef.setInput('data', [{ label: 'A', value: 1 }]);
    expect(() => invalidTitle.detectChanges()).toThrowError(/non-empty title/);

    const invalidType = TestBed.createComponent(KrnChart);
    invalidType.componentRef.setInput('title', 'Invalid');
    invalidType.componentRef.setInput('type', 'pie');
    invalidType.componentRef.setInput('data', [{ label: 'A', value: 1 }]);
    expect(() => invalidType.detectChanges()).toThrowError(/type must be/);
  });

  it('clamps negative values without mutating the consumer data', async () => {
    await TestBed.configureTestingModule({ imports: [KrnChart] }).compileComponents();
    const data = [
      { id: 'loss', label: 'Loss', value: -15 },
      { id: 'gain', label: 'Gain', value: 25 },
    ] as const;
    const fixture = TestBed.createComponent(KrnChart);
    fixture.componentRef.setInput('title', 'Balance');
    fixture.componentRef.setInput('type', 'donut');
    fixture.componentRef.setInput('data', data);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector('.donut-total')?.textContent?.trim(),
    ).toBe('25');
    expect(data[0].value).toBe(-15);
  });

  it('preserves the active datum by stable identity across immutable reordering', async () => {
    await TestBed.configureTestingModule({ imports: [KrnChart] }).compileComponents();
    const fixture = TestBed.createComponent(KrnChart);
    fixture.componentRef.setInput('title', 'Stable series');
    fixture.componentRef.setInput('data', [
      { id: 'a', label: 'Alpha', value: 10 },
      { id: 'b', label: 'Beta', value: 20 },
    ]);
    fixture.detectChanges();
    await fixture.whenStable();

    const beta = (fixture.nativeElement as HTMLElement).querySelectorAll<SVGGElement>('.point')[1];
    beta?.dispatchEvent(new FocusEvent('focus'));
    fixture.detectChanges();
    expect(fixture.componentInstance.activeIndex()).toBe(1);

    fixture.componentRef.setInput('data', [
      { id: 'b', label: 'Beta', value: 24 },
      { id: 'a', label: 'Alpha', value: 12 },
    ]);
    fixture.detectChanges();
    await fixture.whenStable();

    const points = (fixture.nativeElement as HTMLElement).querySelectorAll<SVGGElement>('.point');
    expect(fixture.componentInstance.activeIndex()).toBe(0);
    expect(points[0]).toBe(beta);
    expect(points[0]?.getAttribute('aria-label')).toContain('Beta');
    expect(points[0]?.hasAttribute('data-active')).toBe(true);
  });

  it('keeps keyboard focus active when the pointer leaves the same datum', async () => {
    vi.useFakeTimers();
    try {
      await TestBed.configureTestingModule({ imports: [KrnChart] }).compileComponents();
      const fixture = TestBed.createComponent(KrnChart);
      fixture.componentRef.setInput('title', 'Focus and pointer');
      fixture.componentRef.setInput('data', [
        { id: 'a', label: 'Alpha', value: 10 },
        { id: 'b', label: 'Beta', value: 20 },
      ]);
      fixture.detectChanges();
      await fixture.whenStable();

      const alpha = (fixture.nativeElement as HTMLElement).querySelector<SVGGElement>('.point');
      alpha?.dispatchEvent(new MouseEvent('mouseenter'));
      alpha?.dispatchEvent(new FocusEvent('focus'));
      alpha?.dispatchEvent(new MouseEvent('mouseleave'));
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(200);
      fixture.detectChanges();

      expect(fixture.componentInstance.activeIndex()).toBe(0);
      expect(
        (fixture.nativeElement as HTMLElement).querySelector('.chart-tooltip')?.textContent,
      ).toContain('Alpha');

      alpha?.dispatchEvent(new FocusEvent('blur'));
      await vi.advanceTimersByTimeAsync(110);
      fixture.detectChanges();
      expect(fixture.componentInstance.activeIndex()).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('keeps pointer hover active when keyboard focus leaves the same datum', async () => {
    vi.useFakeTimers();
    try {
      await TestBed.configureTestingModule({ imports: [KrnChart] }).compileComponents();
      const fixture = TestBed.createComponent(KrnChart);
      fixture.componentRef.setInput('title', 'Pointer and focus');
      fixture.componentRef.setInput('data', [
        { id: 'a', label: 'Alpha', value: 10 },
        { id: 'b', label: 'Beta', value: 20 },
      ]);
      fixture.detectChanges();
      await fixture.whenStable();

      const alpha = (fixture.nativeElement as HTMLElement).querySelector<SVGGElement>('.point');
      alpha?.dispatchEvent(new MouseEvent('mouseenter'));
      alpha?.dispatchEvent(new FocusEvent('focus'));
      alpha?.dispatchEvent(new FocusEvent('blur'));
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(200);
      fixture.detectChanges();

      expect(fixture.componentInstance.activeIndex()).toBe(0);

      alpha?.dispatchEvent(new MouseEvent('mouseleave'));
      await vi.advanceTimersByTimeAsync(110);
      fixture.detectChanges();
      expect(fixture.componentInstance.activeIndex()).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('tracks pointer and keyboard focus by independent stable datum keys', async () => {
    vi.useFakeTimers();
    try {
      await TestBed.configureTestingModule({ imports: [KrnChart] }).compileComponents();
      const fixture = TestBed.createComponent(KrnChart);
      fixture.componentRef.setInput('title', 'Independent interactions');
      fixture.componentRef.setInput('data', [
        { id: 'a', label: 'Alpha', value: 10 },
        { id: 'b', label: 'Beta', value: 20 },
      ]);
      fixture.detectChanges();
      await fixture.whenStable();

      const points = (fixture.nativeElement as HTMLElement).querySelectorAll<SVGGElement>('.point');
      points[1]?.dispatchEvent(new MouseEvent('mouseenter'));
      points[0]?.dispatchEvent(new FocusEvent('focus'));
      fixture.detectChanges();
      expect(fixture.componentInstance.activeIndex()).toBe(0);

      points[1]?.dispatchEvent(new MouseEvent('mouseleave'));
      await vi.advanceTimersByTimeAsync(200);
      fixture.detectChanges();
      expect(fixture.componentInstance.activeIndex()).toBe(0);

      points[1]?.dispatchEvent(new MouseEvent('mouseenter'));
      points[0]?.dispatchEvent(new FocusEvent('blur'));
      fixture.detectChanges();
      expect(fixture.componentInstance.activeIndex()).toBe(1);
      expect(
        (fixture.nativeElement as HTMLElement).querySelector('.chart-tooltip')?.textContent,
      ).toContain('Beta');
    } finally {
      vi.useRealTimers();
    }
  });

  it('clears a pending pointer disclosure by datum key after immutable reordering', async () => {
    vi.useFakeTimers();
    try {
      await TestBed.configureTestingModule({ imports: [KrnChart] }).compileComponents();
      const fixture = TestBed.createComponent(KrnChart);
      fixture.componentRef.setInput('title', 'Reordered pointer state');
      fixture.componentRef.setInput('data', [
        { id: 'a', label: 'Alpha', value: 10 },
        { id: 'b', label: 'Beta', value: 20 },
      ]);
      fixture.detectChanges();
      await fixture.whenStable();

      const beta = (fixture.nativeElement as HTMLElement).querySelectorAll<SVGGElement>(
        '.point',
      )[1];
      beta?.dispatchEvent(new MouseEvent('mouseenter'));
      beta?.dispatchEvent(new MouseEvent('mouseleave'));

      fixture.componentRef.setInput('data', [
        { id: 'b', label: 'Beta', value: 24 },
        { id: 'a', label: 'Alpha', value: 12 },
      ]);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(fixture.componentInstance.activeIndex()).toBe(0);

      await vi.advanceTimersByTimeAsync(110);
      fixture.detectChanges();
      expect(fixture.componentInstance.activeIndex()).toBeNull();
      expect((fixture.nativeElement as HTMLElement).querySelector('.chart-tooltip')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});
