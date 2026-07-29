import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  KrnAutocomplete,
  KrnBarChart,
  KrnButton,
  KrnCalendar,
  KrnChart,
  KrnColorPicker,
  KrnCombobox,
  KrnCommandPalette,
  KrnDataGrid,
  KrnDatePicker,
  KrnDateRangePicker,
  KrnDialog,
  KrnDonutChart,
  KrnDropUpload,
  KrnFileUpload,
  KrnFormField,
  KrnLineChart,
  KrnMenu,
  KrnMultiSelect,
  KrnResizablePanel,
  KrnResizablePanels,
  KrnResizeHandle,
  KrnSelect,
  KrnTabs,
  KrnTextInput,
  KrnTimePicker,
  KrnToastService,
  KrnToastViewport,
  KrnTree,
  KrnTreeNavigation,
} from '../../public-api';
import type {
  KrnDataColumn,
  KrnNavigationItem,
  KrnSelectOption,
  KrnTabItem,
  KrnTreeNavigationItem,
  KrnTreeNode,
} from '../../public-api';
import {
  KrnAutocompleteHarness,
  KrnBarChartHarness,
  KrnButtonHarness,
  KrnCalendarHarness,
  KrnChartHarness,
  KrnColorPickerHarness,
  KrnComboboxHarness,
  KrnCommandPaletteHarness,
  KrnDataGridHarness,
  KrnDatePickerHarness,
  KrnDateRangePickerHarness,
  KrnDialogHarness,
  KrnDonutChartHarness,
  KrnDropUploadHarness,
  KrnFileUploadHarness,
  KrnFormControlHarness,
  KrnFormFieldHarness,
  KrnLineChartHarness,
  KrnMenuHarness,
  KrnMultiSelectHarness,
  KrnResizablePanelsHarness,
  KrnSelectHarness,
  KrnTabsHarness,
  KrnTimePickerHarness,
  KrnToastViewportHarness,
  KrnTreeHarness,
  KrnTreeNavigationHarness,
} from '../../../testing/src/public-api';

interface HarnessDemoRow extends Record<string, unknown> {
  readonly id: number;
  readonly name: string;
  readonly seats: number;
}

@Component({
  imports: [KrnButton, KrnDataGrid, KrnDialog, KrnFormField, KrnSelect, KrnTextInput],
  template: `
    <krn-button
      ariaLabel="Save workspace"
      tone="brand"
      variant="outline"
      (activated)="recordActivation()"
    >
      Save changes
    </krn-button>

    <krn-form-field
      id="workspace-name"
      label="Workspace name"
      hint="Visible to every member"
      required
    >
      <krn-text-input />
    </krn-form-field>

    <krn-select ariaLabel="Plan" placeholder="Choose a plan" [options]="plans" />

    <krn-dialog
      title="Confirm migration"
      description="This operation updates every workspace."
      [(open)]="dialogOpen"
    >
      Review the migration summary.
      <button krnDialogAction type="button">Confirm</button>
    </krn-dialog>

    <krn-data-grid
      ariaLabel="Workspace plans"
      [columns]="columns"
      [data]="rows"
      expandable
      [pageSize]="2"
      [rowIdentity]="rowIdentity"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class HarnessDemo {
  readonly dialogOpen = signal(true);
  readonly activationCount = signal(0);
  readonly plans: readonly KrnSelectOption<string>[] = [
    { value: 'starter', label: 'Starter' },
    { value: 'enterprise', label: 'Enterprise' },
  ];
  readonly rows: readonly HarnessDemoRow[] = [
    { id: 1, name: 'Atlas', seats: 12 },
    { id: 2, name: 'Beacon', seats: 32 },
    { id: 3, name: 'Cirrus', seats: 8 },
  ];
  readonly columns: readonly KrnDataColumn<HarnessDemoRow>[] = [
    { key: 'name', label: 'Workspace', sortable: true },
    { key: 'seats', label: 'Seats', sortable: true, align: 'end' },
  ];
  readonly rowIdentity = (row: HarnessDemoRow): number => row.id;

  recordActivation(): void {
    this.activationCount.update((count) => count + 1);
  }
}

@Component({
  imports: [
    KrnAutocomplete,
    KrnCalendar,
    KrnCombobox,
    KrnDatePicker,
    KrnDateRangePicker,
    KrnDropUpload,
    KrnFileUpload,
    KrnMenu,
    KrnMultiSelect,
    KrnTabs,
    KrnTimePicker,
    KrnToastViewport,
    KrnTree,
    KrnTreeNavigation,
  ],
  template: `
    <krn-multi-select
      ariaLabel="Workspace members"
      placeholder="Choose members"
      [options]="people"
    />
    <krn-combobox ariaLabel="Deployment region" [options]="regions" />
    <krn-autocomplete ariaLabel="Custom tag" [options]="tags" />

    <krn-calendar today="2025-03-15" activeMonth="2025-03" [disabledDates]="disabledDates" />
    <krn-date-picker
      ariaLabel="Deployment date"
      today="2025-03-15"
      min="2025-03-01"
      max="2025-03-31"
    />
    <krn-date-range-picker
      ariaLabel="Reporting period"
      today="2025-03-15"
      min="2025-03-01"
      max="2025-03-31"
    />
    <krn-time-picker ariaLabel="Deployment time" />

    <krn-tree ariaLabel="Repository tree" [nodes]="treeNodes" />
    <krn-tree-navigation ariaLabel="Product areas" [items]="treeNavigationItems" />
    <krn-menu
      triggerLabel="Workspace actions"
      [items]="menuItems"
      (itemSelected)="selectedMenuItem.set($event.id)"
    />
    <krn-tabs ariaLabel="Workspace sections" [items]="tabItems" />

    <krn-toast-viewport />
    <krn-file-upload label="Attach logs" accept=".txt" multiple />
    <krn-drag-drop-upload label="Browse reports" accept=".pdf" />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ExtendedHarnessDemo {
  readonly selectedMenuItem = signal('');
  readonly disabledDates = new Set(['2025-03-19']);
  readonly people: readonly KrnSelectOption<string>[] = [
    { value: 'ada', label: 'Ada Lovelace' },
    { value: 'grace', label: 'Grace Hopper' },
    { value: 'linus', label: 'Linus Torvalds', disabled: true },
  ];
  readonly regions: readonly KrnSelectOption<string>[] = [
    { value: 'us-east', label: 'US East' },
    { value: 'eu-central', label: 'EU Central' },
  ];
  readonly tags: readonly KrnSelectOption<string>[] = [
    { value: 'critical', label: 'Critical' },
    { value: 'scheduled', label: 'Scheduled' },
  ];
  readonly treeNodes: readonly KrnTreeNode[] = [
    {
      id: 'platform',
      label: 'Platform',
      children: [{ id: 'runtime', label: 'Runtime' }],
    },
    { id: 'archive', label: 'Archive', disabled: true },
    { id: 'loading', label: 'Loading branch', childrenState: 'loading' },
    { id: 'failed', label: 'Failed branch', childrenState: 'error' },
  ];
  readonly treeNavigationItems: readonly KrnTreeNavigationItem[] = [
    {
      id: 'products',
      label: 'Products',
      children: [{ id: 'analytics', label: 'Analytics' }],
    },
    { id: 'settings', label: 'Settings' },
  ];
  readonly menuItems: readonly (KrnNavigationItem & { readonly shortcut?: string })[] = [
    { id: 'rename', label: 'Rename', shortcut: '⌘R' },
    { id: 'delete', label: 'Delete', disabled: true },
  ];
  readonly tabItems: readonly KrnTabItem[] = [
    { id: 'overview', label: 'Overview', badge: 3 },
    { id: 'activity', label: 'Activity' },
  ];
}

@Component({
  imports: [
    KrnBarChart,
    KrnChart,
    KrnColorPicker,
    KrnCommandPalette,
    KrnDonutChart,
    KrnLineChart,
    KrnResizablePanel,
    KrnResizablePanels,
    KrnResizeHandle,
  ],
  template: `
    <krn-chart title="Root trend" description="Monthly active workspaces" [data]="chartData" />
    <krn-line-chart title="Line trend" [data]="chartData" />
    <krn-bar-chart title="Bar trend" [data]="chartData" />
    <krn-donut-chart title="Donut mix" [data]="chartData" />

    <krn-color-picker pickerLabel="Brand color" />

    <krn-command-palette
      title="Workspace commands"
      description="Search all workspace actions"
      [items]="commands"
      [open]="commandOpen()"
      (openChange)="commandOpen.set($event)"
      (selected)="selectedCommand.set($event.id)"
      (closed)="closedReason.set($event)"
    />

    <krn-resizable-panels
      [disabled]="panelsDisabled()"
      [sizes]="panelSizes()"
      [step]="5"
      (sizesChange)="panelSizes.set($event)"
    >
      <krn-resizable-panel
        id="navigation-panel"
        ariaLabel="Workspace navigation"
        [minSize]="20"
        [maxSize]="80"
      >
        Navigation
      </krn-resizable-panel>
      <krn-resize-handle ariaLabel="Resize workspace panels" />
      <krn-resizable-panel
        id="content-panel"
        ariaLabel="Workspace content"
        [minSize]="10"
        [maxSize]="80"
      >
        Content
      </krn-resizable-panel>
    </krn-resizable-panels>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class AdvancedHarnessDemo {
  readonly chartData = [
    { id: 'jan', label: 'January', value: 12 },
    { id: 'feb', label: 'February', value: 18 },
    { id: 'mar', label: 'March', value: 15 },
  ] as const;
  readonly commands = [
    {
      id: 'overview',
      label: 'Open overview',
      description: 'Navigate to the workspace overview',
      shortcut: 'G O',
    },
    {
      id: 'deploy',
      label: 'Deploy workspace',
      description: 'Start a production deployment',
      keywords: ['release'],
    },
    { id: 'archive', label: 'Archive workspace', disabled: true },
    { id: 'settings', label: 'Open settings' },
  ] as const;
  readonly commandOpen = signal(true);
  readonly selectedCommand = signal('');
  readonly closedReason = signal('');
  readonly panelSizes = signal<readonly number[]>([35, 65]);
  readonly panelsDisabled = signal(false);
}

describe('@kern-ui/angular/testing', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdvancedHarnessDemo, ExtendedHarnessDemo, HarnessDemo],
    }).compileComponents();
  });

  it('drives buttons and supports stable predicates', async () => {
    const fixture = TestBed.createComponent(HarnessDemo);
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const button = await loader.getHarness(
      KrnButtonHarness.with({
        text: 'Save changes',
        ariaLabel: 'Save workspace',
        variant: 'outline',
        disabled: false,
      }),
    );

    expect(await button.getTone()).toBe('brand');
    expect(await button.isLoading()).toBe(false);
    await button.click();
    expect(fixture.componentInstance.activationCount()).toBe(1);
  });

  it('reads form-field state and its projected control contract', async () => {
    const fixture = TestBed.createComponent(HarnessDemo);
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const field = await loader.getHarness(
      KrnFormFieldHarness.with({
        label: 'Workspace name',
        hint: 'Visible to every member',
        required: true,
        invalid: false,
      }),
    );

    expect(await field.getControlId()).toBe('workspace-name');
    expect(await field.getHintTexts()).toEqual(['Visible to every member']);
    expect(await field.getControlDescribedBy()).toEqual(['workspace-name-hint']);

    const control = await loader.getHarness(
      KrnFormControlHarness.with({
        ancestor: 'krn-form-field',
        required: true,
        invalid: false,
      }),
    );
    await control.setValue('Enterprise workspace');
    expect(await control.getValue()).toBe('Enterprise workspace');
    expect(await control.getDescribedBy()).toEqual(['workspace-name-hint']);
  });

  it('opens and selects options through the select harness', async () => {
    const fixture = TestBed.createComponent(HarnessDemo);
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const select = await loader.getHarness(
      KrnSelectHarness.with({
        ariaLabel: 'Plan',
        open: false,
        disabled: false,
      }),
    );

    expect(await select.getPlaceholderText()).toBe('Choose a plan');
    expect(await select.getOptionTexts()).toEqual(['Starter', 'Enterprise']);
    await select.selectOption({ text: 'Enterprise' });
    expect(await select.getValueText()).toBe('Enterprise');
    expect(await select.isOpen()).toBe(false);
  });

  it('reads and closes modal overlays without exposing internal DOM', async () => {
    const fixture = TestBed.createComponent(HarnessDemo);
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const dialog = await loader.getHarness(
      KrnDialogHarness.with({
        title: 'Confirm migration',
        role: 'dialog',
        open: true,
      }),
    );

    expect(await dialog.getDescriptionText()).toBe('This operation updates every workspace.');
    expect(await dialog.getActionTexts()).toEqual(['Confirm']);
    await dialog.close();
    expect(await dialog.isOpen()).toBe(false);
    expect(fixture.componentInstance.dialogOpen()).toBe(false);
  });

  it('filters, sorts, and pages data grids through semantic rows and headers', async () => {
    const fixture = TestBed.createComponent(HarnessDemo);
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const grid = await loader.getHarness(
      KrnDataGridHarness.with({
        ariaLabel: 'Workspace plans',
        loading: false,
        rowCount: 2,
      }),
    );

    expect(await grid.getHeaderTexts()).toEqual(['Workspace', 'Seats']);
    expect(await grid.getRows().then((rows) => rows[0]?.getCellTexts())).toEqual(['Atlas', '12']);
    expect(await grid.getCellText(0, 0)).toBe('Atlas');
    expect(await grid.getPaginationRange()).toBe('1–2 of 3');

    await grid.sortByHeader({ text: 'Seats', sortable: true });
    expect(await grid.getCellText(0, 0)).toBe('Cirrus');
    expect(await grid.getCellText(0, 1)).toBe('8');

    await grid.setFilter('Cirrus');
    expect(await grid.getRowCount()).toBe(1);
    expect(await grid.getCellText(0, 0)).toBe('Cirrus');
  });

  it('drives multi-select, combobox, and autocomplete contracts', async () => {
    const fixture = TestBed.createComponent(ExtendedHarnessDemo);
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const multiSelect = await loader.getHarness(
      KrnMultiSelectHarness.with({
        ariaLabel: 'Workspace members',
        open: false,
      }),
    );

    expect(await multiSelect.getPlaceholderText()).toBe('Choose members');
    await multiSelect.toggleOption({ text: 'Ada Lovelace' });
    await multiSelect.toggleOption({ text: 'Grace Hopper' });
    expect(await multiSelect.getVisibleTokenTexts()).toEqual(['Ada Lovelace', 'Grace Hopper']);
    expect(await multiSelect.getSelectedTexts()).toEqual(['Ada Lovelace', 'Grace Hopper']);
    expect(
      await loader.hasHarness(KrnMultiSelectHarness.with({ value: 'Ada Lovelace, Grace Hopper' })),
    ).toBe(true);
    expect(await multiSelect.getOptions({ disabled: true })).toHaveLength(1);
    await multiSelect.close();

    const combobox = await loader.getHarness(
      KrnComboboxHarness.with({ ariaLabel: 'Deployment region', open: false }),
    );
    await combobox.setValue('central');
    expect(await combobox.getOptions()).toHaveLength(1);
    await combobox.selectOption({ text: 'EU Central' });
    expect(await combobox.getValue()).toBe('EU Central');
    expect(await combobox.isOpen()).toBe(false);

    const autocomplete = await loader.getHarness(
      KrnAutocompleteHarness.with({ ariaLabel: 'Custom tag', disabled: false }),
    );
    await autocomplete.setValue('Incident 42');
    expect(await autocomplete.getValue()).toBe('Incident 42');
    expect(await autocomplete.isOpen()).toBe(true);
    await autocomplete.close();
  });

  it('drives calendar, date-range, and time controls through semantic state', async () => {
    const fixture = TestBed.createComponent(ExtendedHarnessDemo);
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const calendar = await loader.getHarness(KrnCalendarHarness);

    expect(await calendar.getMonthLabel()).toContain('March');
    await calendar.goToNextMonth();
    expect(await calendar.getMonthLabel()).toContain('April');
    await calendar.goToPreviousMonth();
    expect(await calendar.getMonthLabel()).toContain('March');
    expect(await calendar.getCells({ date: '2025-03-19', disabled: true })).toHaveLength(1);
    await calendar.selectDate('2025-03-20');
    expect(await calendar.getCells({ date: '2025-03-20', selected: true })).toHaveLength(1);

    const datePicker = await loader.getHarness(
      KrnDatePickerHarness.with({ ariaLabel: 'Deployment date', open: false }),
    );
    await datePicker.selectDate('2025-03-20');
    expect(await datePicker.getValueText()).toContain('20');
    expect(await datePicker.isOpen()).toBe(false);

    const rangePicker = await loader.getHarness(
      KrnDateRangePickerHarness.with({ ariaLabel: 'Reporting period', open: false }),
    );
    await rangePicker.selectDate('2025-03-20');
    await rangePicker.selectDate('2025-03-22');
    expect(await rangePicker.getCells({ selected: true })).toHaveLength(2);
    expect(await rangePicker.getValueText()).toContain('22');
    await rangePicker.close();

    const timePicker = await loader.getHarness(
      KrnTimePickerHarness.with({ ariaLabel: 'Deployment time', open: false }),
    );
    await timePicker.setTime(9, 5);
    expect(await timePicker.getValueText()).toContain('09:05');
    expect(await timePicker.isOpen()).toBe(false);
    await expect(timePicker.setTime(24, 5)).rejects.toThrow(
      'Time picker hour must be an integer from 0 to 23',
    );
  });

  it('drives trees, menus, and tabs without leaking decorative text', async () => {
    const fixture = TestBed.createComponent(ExtendedHarnessDemo);
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const tree = await loader.getHarness(KrnTreeHarness);
    const platform = (await tree.getItems({ text: 'Platform' }))[0];

    expect(platform).toBeDefined();
    expect(await platform?.getId()).toBe('platform');
    await platform?.expand();
    expect(await platform?.isExpanded()).toBe(true);
    await tree.selectItem({ text: 'Runtime' });
    expect(await tree.getItems({ text: 'Runtime', selected: true })).toHaveLength(1);
    expect(await tree.getItems({ text: 'Archive', disabled: true })).toHaveLength(1);
    const loading = (await tree.getItems({ text: 'Loading branch', loading: true }))[0];
    const failed = (await tree.getItems({ text: 'Failed branch', error: true }))[0];
    expect(await loading?.getText()).toBe('Loading branch');
    expect(await loading?.isLoading()).toBe(true);
    expect(await failed?.getText()).toBe('Failed branch');
    expect(await failed?.hasError()).toBe(true);

    const navigation = await loader.getHarness(KrnTreeNavigationHarness);
    const products = (await navigation.getItems({ text: 'Products' }))[0];
    await products?.expand();
    expect(await products?.isExpanded()).toBe(true);
    await navigation.selectItem({ text: 'Analytics' });
    expect(await navigation.getItems({ text: 'Analytics', selected: true })).toHaveLength(1);

    const menu = await loader.getHarness(KrnMenuHarness);
    expect(await menu.getItemTexts()).toEqual(['Rename', 'Delete']);
    await menu.close();
    expect(await menu.isOpen()).toBe(false);
    await menu.clickItem('Rename');
    expect(fixture.componentInstance.selectedMenuItem()).toBe('rename');
    expect(await menu.isOpen()).toBe(false);

    const tabs = await loader.getHarness(KrnTabsHarness);
    expect(await tabs.getTabTexts()).toEqual(['Overview', 'Activity']);
    expect(await tabs.getSelectedTabText()).toBe('Overview');
    await tabs.selectTab('Activity');
    expect(await tabs.getSelectedTabText()).toBe('Activity');
  });

  it('reads exact toast messages and operates upload controls', async () => {
    const fixture = TestBed.createComponent(ExtendedHarnessDemo);
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const toasts = await loader.getHarness(KrnToastViewportHarness);
    const toastService = TestBed.inject(KrnToastService);
    toastService.success('Workspace saved', { title: 'Ready', duration: 0 });
    toastService.error('Deployment failed', { title: 'Action required', duration: 0 });
    toastService.show('Build queued', { actionLabel: 'View', duration: 0 });
    fixture.detectChanges();

    expect(await toasts.getMessages()).toEqual([
      'Build queued',
      'Deployment failed',
      'Workspace saved',
    ]);
    await toasts.dismiss();
    expect(await toasts.getCount()).toBe(2);
    await toasts.clearAll();
    expect(await toasts.getCount()).toBe(0);
    toastService.show('Single notification', { duration: 0 });
    fixture.detectChanges();
    await toasts.clearAll();
    expect(await toasts.getCount()).toBe(0);

    const upload = await loader.getHarness(KrnFileUploadHarness);
    expect(await upload.getLabel()).toBe('Attach logs');
    expect(await upload.getAccept()).toBe('.txt');
    expect(await upload.isMultiple()).toBe(true);

    const nativeInput = fixture.nativeElement.querySelector(
      'krn-file-upload input[type="file"]',
    ) as HTMLInputElement;
    Object.defineProperty(nativeInput, 'files', {
      configurable: true,
      value: [new File(['hello'], 'build.txt', { type: 'text/plain' })],
    });
    nativeInput.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(await upload.getFileNames()).toEqual(['build.txt']);
    await upload.removeFile();
    expect(await upload.getFileNames()).toEqual([]);

    const dropUpload = await loader.getHarness(KrnDropUploadHarness);
    expect(await dropUpload.getLabel()).toBe('Browse reports');
    expect(await dropUpload.getAccept()).toBe('.pdf');
    expect(await dropUpload.isMultiple()).toBe(false);
  });

  it('drives root and typed charts through marks and the accessible source table', async () => {
    const fixture = TestBed.createComponent(AdvancedHarnessDemo);
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const chart = await loader.getHarness(
      KrnChartHarness.with({
        title: 'Root trend',
        type: 'line',
        empty: false,
        tableVisible: false,
      }),
    );

    expect(await chart.getDescriptionText()).toBe('Monthly active workspaces');
    expect(await chart.getAccessibleSummary()).toContain('Root trend');
    expect(await chart.getData()).toHaveLength(3);
    await chart.activateDatum({ label: /^February/ });
    expect(await chart.getActiveDatum().then((datum) => datum?.getAccessibleLabel())).toContain(
      'February',
    );

    const rows = await chart.getTableRows();
    expect(await chart.getTableCaption()).toContain('Root trend');
    expect(await rows[0]?.getLabelText()).toBe('January');
    expect(await rows[0]?.getValueText()).toBe('12');
    expect(await rows[0]?.getShareText()).toContain('%');
    await chart.hideTable();
    expect(await chart.isTableVisible()).toBe(false);

    const line = await loader.getHarness(
      KrnLineChartHarness.with({ title: 'Line trend', type: 'line' }),
    );
    const bar = await loader.getHarness(
      KrnBarChartHarness.with({ title: 'Bar trend', type: 'bar' }),
    );
    const donut = await loader.getHarness(
      KrnDonutChartHarness.with({ title: 'Donut mix', type: 'donut' }),
    );
    expect(await line.getData()).toHaveLength(3);
    expect(await bar.getData()).toHaveLength(3);
    expect(await donut.getData()).toHaveLength(3);
    await donut.activateDatum({ label: 'March' });
    expect(await donut.getActiveDatum().then((datum) => datum?.getAccessibleLabel())).toBe('March');
  });

  it('operates color-picker presets, ranges, validation, and completion', async () => {
    const fixture = TestBed.createComponent(AdvancedHarnessDemo);
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const picker = await loader.getHarness(
      KrnColorPickerHarness.with({
        ariaLabel: 'Brand color',
        value: '#4666DA',
        disabled: false,
        readonly: false,
        invalid: false,
        open: false,
      }),
    );

    expect(await picker.getPresets()).toHaveLength(8);
    await picker.selectPreset({ ariaLabel: /#0f8a6a/i });
    expect(await picker.getValueText()).toBe('#0F8A6A');
    expect(await picker.getPresets({ selected: true })).toHaveLength(1);

    await picker.setHue(180);
    expect(await picker.getHue()).toBe(180);
    await picker.setSaturation(40);
    expect(await picker.getSaturation()).toBe(40);
    await expect(picker.setHue(360)).rejects.toThrow('integer from 0 to 359');

    await picker.setValue('not-a-color');
    expect(await picker.isInvalid()).toBe(true);
    expect(await picker.getStatusText()).toContain('valid hexadecimal color');
    await expect(picker.finish()).rejects.toThrow('current value is invalid');

    await picker.setValue('#112233');
    expect(await picker.getTextValue()).toBe('#112233');
    expect(await picker.isInvalid()).toBe(false);
    await picker.finish();
    expect(await picker.isOpen()).toBe(false);
  });

  it('filters, navigates, and selects commands through the open palette contract', async () => {
    const fixture = TestBed.createComponent(AdvancedHarnessDemo);
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const palette = await loader.getHarness(
      KrnCommandPaletteHarness.with({
        title: 'Workspace commands',
        query: '',
        open: true,
        resultCount: 3,
      }),
    );

    expect(await palette.getDescriptionText()).toBe('Search all workspace actions');
    expect(await palette.getResultLabels()).toEqual([
      'Open overview',
      'Deploy workspace',
      'Open settings',
    ]);
    expect(await palette.getActiveOption().then((option) => option?.getLabelText())).toBe(
      'Open overview',
    );

    await palette.setQuery('deploy');
    expect(await palette.getResultCount()).toBe(1);
    const deployment = (await palette.getOptions({ label: 'Deploy workspace', selected: true }))[0];
    expect(await deployment?.getDescriptionText()).toBe('Start a production deployment');
    await palette.selectOption({ label: 'Deploy workspace' });
    expect(fixture.componentInstance.selectedCommand()).toBe('deploy');
    expect(fixture.componentInstance.closedReason()).toBe('selection');
    expect(await palette.isOpen()).toBe(false);

    fixture.componentInstance.commandOpen.set(true);
    fixture.detectChanges();
    await palette.setQuery('missing');
    expect(await palette.getResultCount()).toBe(0);
    expect(await palette.getEmptyText()).toContain('missing');
    await palette.close();
    expect(fixture.componentInstance.closedReason()).toBe('escape');
  });

  it('reads and keyboard-resizes constrained resizable panels', async () => {
    const fixture = TestBed.createComponent(AdvancedHarnessDemo);
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const panels = await loader.getHarness(
      KrnResizablePanelsHarness.with({
        orientation: 'horizontal',
        disabled: false,
        resizing: false,
        panelCount: 2,
      }),
    );

    expect(await panels.getSizes()).toEqual([35, 65]);
    expect(
      await panels.getPanels({ ariaLabel: 'Workspace navigation', overflow: 'auto', size: 35 }),
    ).toHaveLength(1);

    const handle = (
      await panels.getHandles({
        ariaLabel: 'Resize workspace panels',
        orientation: 'horizontal',
        value: 35,
        disabled: false,
      })
    )[0];
    expect(handle).toBeDefined();
    expect(await handle?.getMinimum()).toBe(0);
    expect(await handle?.getMaximum()).toBe(100);
    expect(await handle?.getValueText()).toBe('35%');

    await handle?.setToMaximum();
    expect(await panels.getSizes()).toEqual([80, 20]);
    await handle?.setToMinimum();
    expect(await panels.getSizes()).toEqual([20, 80]);
    await handle?.reset();
    expect(await panels.getSizes()).toEqual([50, 50]);

    fixture.componentInstance.panelsDisabled.set(true);
    fixture.detectChanges();
    expect(await panels.isDisabled()).toBe(true);
    expect(await handle?.isDisabled()).toBe(true);
  });
});
