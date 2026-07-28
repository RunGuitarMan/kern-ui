import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  KrnButton,
  KrnDataGrid,
  KrnDialog,
  KrnFormField,
  KrnSelect,
  KrnTextInput,
} from '../../public-api';
import type { KrnDataColumn, KrnSelectOption } from '../../public-api';
import {
  KrnButtonHarness,
  KrnDataGridHarness,
  KrnDialogHarness,
  KrnFormControlHarness,
  KrnFormFieldHarness,
  KrnSelectHarness,
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

describe('@kern-ui/angular/testing', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HarnessDemo] }).compileComponents();
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
    expect(await grid.getCellText(0, 0)).toBe('Atlas');
    expect(await grid.getPaginationRange()).toBe('1–2 of 3');

    await grid.sortByHeader({ text: 'Seats', sortable: true });
    expect(await grid.getCellText(0, 0)).toBe('Cirrus');
    expect(await grid.getCellText(0, 1)).toBe('8');

    await grid.setFilter('Cirrus');
    expect(await grid.getRowCount()).toBe(1);
    expect(await grid.getCellText(0, 0)).toBe('Cirrus');
  });
});
