'use strict';

const { generationContext, writeComponentFiles } = require('../shared/generator');

function typescript(context) {
  const record = `${context.className}Record`;
  return `import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { KrnDataGrid, type KrnDataColumn, type KrnDataRowKey } from '@kern-ui/angular/addon-grid';
import { KrnButton, KrnFormField, KrnTextInput } from '@kern-ui/angular/kit';
import { KrnMasterDetailLayout } from '@kern-ui/angular/patterns';

export interface ${record} {
  readonly id: string;
  readonly name: string;
  readonly description: string;
}

@Component({
  selector: '${context.selector}',
  imports: [
    ReactiveFormsModule,
    KrnButton,
    KrnDataGrid,
    KrnFormField,
    KrnMasterDetailLayout,
    KrnTextInput,
  ],
  templateUrl: './${context.fileName}.component.html',
  styleUrl: './${context.fileName}.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ${context.className}Component {
  protected readonly records = signal<readonly ${record}[]>([]);
  protected readonly selectedKeys = signal<ReadonlySet<KrnDataRowKey>>(new Set());
  protected readonly selectedId = computed(() => {
    const [id] = this.selectedKeys();
    return typeof id === 'string' ? id : null;
  });
  protected readonly selected = computed(
    () => this.records().find((record) => record.id === this.selectedId()) ?? null,
  );
  protected readonly detailOpen = signal(false);
  protected readonly columns = [
    { key: 'name', label: 'Name', sortable: true, priority: 'primary' },
    { key: 'description', label: 'Description', priority: 'secondary' },
  ] satisfies readonly KrnDataColumn<${record}>[];
  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true }),
  });
  protected readonly rowIdentity = (record: ${record}): KrnDataRowKey => record.id;
  private nextId = 0;

  protected select(keys: ReadonlySet<KrnDataRowKey>): void {
    this.selectedKeys.set(keys);
    const selected = this.records().find((record) => keys.has(record.id));
    if (selected) {
      this.form.setValue({ name: selected.name, description: selected.description });
      this.detailOpen.set(true);
    }
  }

  protected create(): void {
    this.selectedKeys.set(new Set());
    this.form.reset();
    this.detailOpen.set(true);
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const id = this.selectedId() ?? \`record-\${++this.nextId}\`;
    const record: ${record} = { id, ...value };
    this.records.update((records) => {
      const exists = records.some((item) => item.id === id);
      return exists ? records.map((item) => (item.id === id ? record : item)) : [...records, record];
    });
    this.selectedKeys.set(new Set([id]));
  }

  protected remove(): void {
    const id = this.selectedId();
    if (!id) {
      return;
    }
    this.records.update((records) => records.filter((record) => record.id !== id));
    this.selectedKeys.set(new Set());
    this.form.reset();
    this.detailOpen.set(false);
  }
}
`;
}

function template() {
  return `<krn-master-detail-layout
  [detailOpen]="detailOpen()"
  (detailOpenChange)="detailOpen.set($event)"
>
  <section krnMaster aria-label="Records">
    <header>
      <h2>Records</h2>
      <button krnButton variant="outline" (click)="create()">New</button>
    </header>

    <krn-data-grid
      ariaLabel="Records"
      [data]="records()"
      [columns]="columns"
      [rowIdentity]="rowIdentity"
      [mode]="{ kind: 'client', pagination: true }"
      [selectable]="true"
      [selected]="selectedKeys()"
      (selectedChange)="select($event)"
    />
  </section>

  <section krnDetail aria-label="Record details">
    <h2>{{ selected() ? 'Edit record' : 'New record' }}</h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <krn-form-field label="Name">
        <krn-text-input [formControl]="form.controls.name" />
      </krn-form-field>
      <krn-form-field label="Description">
        <krn-text-input [formControl]="form.controls.description" />
      </krn-form-field>
      <footer>
        <button krnButton type="submit" [disabled]="form.invalid">Save</button>
        @if (selected()) {
          <button krnButton tone="danger" variant="outline" (click)="remove()">Delete</button>
        }
      </footer>
    </form>
  </section>
</krn-master-detail-layout>
`;
}

function styles() {
  return `:host {
  display: block;
  container-type: inline-size;
}

section,
form {
  display: grid;
  gap: var(--krn-space-4);
  padding: var(--krn-space-5);
}

header,
footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--krn-space-3);
}
`;
}

function defaultFactory(options) {
  return async (tree, context) => {
    const target = await generationContext(tree, options);
    writeComponentFiles(
      tree,
      target,
      {
        ts: typescript(target),
        html: template(),
        css: styles(),
      },
      options.force,
    );
    context.logger.info(
      `Created KERN CRUD master-detail feature at ${target.directory}/${target.fileName}.component.ts.`,
    );
    return tree;
  };
}

exports.default = defaultFactory;
