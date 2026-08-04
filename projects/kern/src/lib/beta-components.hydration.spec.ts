import { Component, computed, signal } from '@angular/core';
import { bootstrapApplication, provideClientHydration } from '@angular/platform-browser';
import { provideServerRendering, renderApplication } from '@angular/platform-server';
import { KrnBarChart, KrnDonutChart, KrnLineChart } from '@kern-ui/angular/addon-charts';
import { KrnDataGrid, type KrnDataColumn, type KrnDataGridMode } from '@kern-ui/angular/addon-grid';
import {
  KrnAutocomplete,
  KrnColorPicker,
  KrnCombobox,
  KrnCommandPalette,
  KrnDatePicker,
  KrnDateRangePicker,
  KrnMultiSelect,
  KrnSelect,
  KrnTimePicker,
  KrnTree,
  KrnTreeNavigation,
  type KrnCommandItem,
  type KrnTreeNavigationItem,
  type KrnTreeNode,
} from '@kern-ui/angular/kit';

interface HydrationRow {
  readonly id: number;
  readonly name: string;
}

@Component({
  selector: 'krn-beta-hydration-host',
  imports: [
    KrnAutocomplete,
    KrnBarChart,
    KrnColorPicker,
    KrnCombobox,
    KrnCommandPalette,
    KrnDataGrid,
    KrnDatePicker,
    KrnDateRangePicker,
    KrnDonutChart,
    KrnLineChart,
    KrnMultiSelect,
    KrnSelect,
    KrnTimePicker,
    KrnTree,
    KrnTreeNavigation,
  ],
  template: `
    <krn-autocomplete data-hydration="autocomplete" [options]="options()" [value]="selected()" />
    <krn-combobox data-hydration="combobox" [options]="options()" [value]="selected()" />
    <krn-select data-hydration="select" [options]="options()" [value]="selected()" />
    <krn-multi-select
      data-hydration="multi-select"
      [options]="options()"
      [value]="selectedValues()"
    />
    <krn-date-picker data-hydration="date-picker" />
    <krn-date-range-picker data-hydration="date-range-picker" />
    <krn-time-picker data-hydration="time-picker" value="09:30" />
    <krn-color-picker data-hydration="color-picker" value="#4666da" />

    <krn-data-grid
      data-hydration="data-grid"
      [columns]="columns"
      [data]="rows()"
      [filterable]="false"
      [mode]="gridMode"
      [resizable]="false"
      [rowIdentity]="rowIdentity"
    />
    <krn-data-table
      data-hydration="data-table"
      [columns]="columns"
      [data]="rows()"
      [filterable]="false"
      [mode]="gridMode"
      [resizable]="false"
      [rowIdentity]="rowIdentity"
    />

    <krn-line-chart data-hydration="line-chart" title="Line" [data]="chartData()" />
    <krn-bar-chart data-hydration="bar-chart" title="Bar" [data]="chartData()" />
    <krn-donut-chart data-hydration="donut-chart" title="Donut" [data]="chartData()" />

    <krn-tree
      data-hydration="tree"
      ariaLabel="Hydration tree"
      [expanded]="treeExpanded"
      [nodes]="treeNodes"
      selected="tree-child"
    />
    <krn-tree-navigation
      data-hydration="tree-navigation"
      ariaLabel="Hydration navigation"
      [expandedIds]="treeNavigationExpanded"
      [items]="treeNavigationItems"
      selectedId="navigation-child"
    />
    <krn-command-palette
      data-hydration="command-palette"
      title="Hydration commands"
      [items]="commandItems"
      [open]="true"
      [query]="commandQuery()"
    />
  `,
})
class BetaHydrationHost {
  readonly options = signal<readonly { value: string; label: string }[]>([
    { value: 'alpha', label: 'Alpha' },
    { value: 'beta', label: 'Beta' },
  ]);
  readonly selected = signal('alpha');
  readonly selectedValues = computed(() => [this.selected()]);
  readonly rows = signal<readonly HydrationRow[]>([{ id: 1, name: 'Alpha row' }]);
  readonly columns: readonly KrnDataColumn<HydrationRow>[] = [{ key: 'name', label: 'Name' }];
  readonly gridMode: KrnDataGridMode = { kind: 'client', pagination: false };
  readonly rowIdentity = (row: HydrationRow): number => row.id;
  readonly chartData = signal([
    { id: 'q1', label: 'Q1', value: 12 },
    { id: 'q2', label: 'Q2', value: 18 },
  ]);
  readonly treeNodes: readonly KrnTreeNode[] = [
    {
      id: 'tree-root',
      label: 'Tree root',
      children: [{ id: 'tree-child', label: 'Tree child' }],
    },
  ];
  readonly treeExpanded: ReadonlySet<string> = new Set(['tree-root']);
  readonly treeNavigationItems: readonly KrnTreeNavigationItem[] = [
    {
      id: 'navigation-root',
      label: 'Navigation root',
      children: [{ id: 'navigation-child', label: 'Navigation child' }],
    },
  ];
  readonly treeNavigationExpanded: readonly string[] = ['navigation-root'];
  readonly commandItems: readonly KrnCommandItem[] = [
    { id: 'overview', label: 'Open overview' },
    { id: 'hydrated-command', label: 'Hydrated command' },
  ];
  readonly commandQuery = signal('');
}

const hydrationProbes = [
  '[data-hydration="autocomplete"] input',
  '[data-hydration="combobox"] input',
  '[data-hydration="select"] button',
  '[data-hydration="multi-select"] button',
  '[data-hydration="date-picker"] button',
  '[data-hydration="date-range-picker"] button',
  '[data-hydration="time-picker"] button',
  '[data-hydration="color-picker"] button',
  '[data-hydration="data-grid"] [role="grid"]',
  '[data-hydration="data-table"] [role="grid"]',
  '[data-hydration="line-chart"] svg',
  '[data-hydration="bar-chart"] svg',
  '[data-hydration="donut-chart"] svg',
  '[data-hydration="tree"] [data-tree-item="tree-child"]',
  '[data-hydration="tree-navigation"] [data-tree-item="navigation-child"]',
  '[data-hydration="command-palette"] input',
] as const;

describe('beta component hydration gate', () => {
  it('reuses lifecycle-listed non-modal beta DOM and keeps it reactive', async () => {
    const dateNow = vi.spyOn(Date, 'now').mockReturnValue(Date.UTC(2026, 2, 15, 12));
    const resolvedOptions = new Intl.DateTimeFormat().resolvedOptions();
    const resolvedOptionsSpy = vi
      .spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions')
      .mockReturnValue({ ...resolvedOptions, timeZone: 'Pacific/Kiritimati' });
    const html = await renderApplication(
      (context) =>
        bootstrapApplication(
          BetaHydrationHost,
          { providers: [provideClientHydration(), provideServerRendering()] },
          context,
        ),
      {
        document:
          '<!doctype html><html><body><krn-beta-hydration-host></krn-beta-hydration-host></body></html>',
        url: 'https://kern.example/beta-hydration',
        allowedHosts: ['kern.example'],
      },
    );
    dateNow.mockReturnValue(Date.UTC(2026, 3, 20, 12));
    resolvedOptionsSpy.mockReturnValue({ ...resolvedOptions, timeZone: 'America/Adak' });
    const serverDocument = new DOMParser().parseFromString(html, 'text/html');
    const originalHead = document.head.innerHTML;
    const originalBody = document.body.innerHTML;
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    let application: Awaited<ReturnType<typeof bootstrapApplication>> | undefined;

    try {
      document.head.innerHTML = serverDocument.head.innerHTML;
      document.body.innerHTML = serverDocument.body.innerHTML;
      const serverNodes = hydrationProbes.map((selector) => document.querySelector(selector));
      expect(serverNodes.every(Boolean)).toBe(true);

      application = await bootstrapApplication(BetaHydrationHost, {
        providers: [provideClientHydration()],
      });
      await application.whenStable();

      hydrationProbes.forEach((selector, index) => {
        expect(document.querySelector(selector)).toBe(serverNodes[index]);
      });
      expect([...consoleWarn.mock.calls, ...consoleError.mock.calls].flat().join(' ')).not.toMatch(
        /NG05\d{2}/u,
      );

      (
        document.querySelector(
          '[data-hydration="date-picker"] .krn-picker__trigger',
        ) as HTMLButtonElement
      ).click();
      await application.whenStable();
      const pickerToday = document.querySelector<HTMLElement>(
        '[data-hydration="date-picker"] [data-today="true"]',
      );
      expect(pickerToday?.dataset['date']).toBe('2026-04-20');

      (
        document.querySelector(
          '[data-hydration="date-range-picker"] .krn-picker__trigger',
        ) as HTMLButtonElement
      ).click();
      await application.whenStable();
      const rangeToday = document.querySelector<HTMLElement>(
        '[data-hydration="date-range-picker"] [data-today="true"]',
      );
      expect(rangeToday?.dataset['date']).toBe(pickerToday?.dataset['date']);

      const instance = application.components[0]?.instance as BetaHydrationHost;
      instance.selected.set('beta');
      instance.rows.update((rows) => [...rows, { id: 2, name: 'Hydrated row' }]);
      instance.commandQuery.set('hydrated');
      await application.whenStable();

      expect(
        (document.querySelector('[data-hydration="combobox"] input') as HTMLInputElement).value,
      ).toBe('Beta');
      expect(document.querySelector('[data-hydration="data-grid"]')?.textContent).toContain(
        'Hydrated row',
      );
      (
        document.querySelector('[data-hydration="line-chart"] .data-toggle') as HTMLButtonElement
      ).click();
      await application.whenStable();
      expect(document.querySelector('[data-hydration="line-chart"] table')).not.toBeNull();
      expect(
        Array.from(
          document.querySelectorAll('[data-hydration="command-palette"] [role="option"]'),
        ).map((option) => option.textContent?.trim()),
      ).toEqual(['Hydrated command']);
    } finally {
      application?.destroy();
      consoleWarn.mockRestore();
      consoleError.mockRestore();
      resolvedOptionsSpy.mockRestore();
      dateNow.mockRestore();
      document.head.innerHTML = originalHead;
      document.body.innerHTML = originalBody;
    }
  });
});
