'use strict';

const { generationContext, writeComponentFiles } = require('../shared/generator');

function modeMembers(mode) {
  if (mode === 'virtual') {
    return {
      imports: 'input',
      fields: "  readonly mode = input<KrnDataGridMode>({ kind: 'virtual' });\n",
    };
  }
  if (mode === 'controlled') {
    return {
      imports: 'computed, input',
      fields: `  readonly totalRows = input(0);
  protected readonly mode = computed<KrnDataGridMode>(() => ({
    kind: 'controlled',
    totalRows: this.totalRows(),
  }));
`,
    };
  }
  return {
    imports: 'input',
    fields: "  readonly mode = input<KrnDataGridMode>({ kind: 'client', pagination: true });\n",
  };
}

function typescript(context, mode) {
  const members = modeMembers(mode);
  return `import { ChangeDetectionStrategy, Component, ${members.imports}, output } from '@angular/core';
import {
  KrnDataGrid,
  type KrnDataColumn,
  type KrnDataGridMode,
  type KrnDataGridQuery,
  type KrnDataRowKey,
} from '@kern-ui/angular/addon-grid';

export interface ${context.className}Row {
  readonly id: string;
  readonly name: string;
  readonly status: string;
}

@Component({
  selector: '${context.selector}',
  imports: [KrnDataGrid],
  templateUrl: './${context.fileName}.component.html',
  styleUrl: './${context.fileName}.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ${context.className}Component {
  readonly rows = input<readonly ${context.className}Row[]>([]);
  readonly loading = input(false);
  readonly error = input('');
  readonly queryChange = output<KrnDataGridQuery>();

  protected readonly columns = [
    { key: 'name', label: 'Name', sortable: true, priority: 'primary' },
    { key: 'status', label: 'Status', sortable: true, priority: 'secondary' },
  ] satisfies readonly KrnDataColumn<${context.className}Row>[];
${members.fields}
  protected readonly rowIdentity = (row: ${context.className}Row): KrnDataRowKey => row.id;
}
`;
}

function template() {
  return `<krn-data-grid
  [data]="rows()"
  [columns]="columns"
  [rowIdentity]="rowIdentity"
  [mode]="mode()"
  [loading]="loading()"
  [error]="error()"
  (queryChange)="queryChange.emit($event)"
/>
`;
}

function styles() {
  return `:host {
  display: block;
  min-inline-size: 0;
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
        ts: typescript(target, options.mode ?? 'client'),
        html: template(),
        css: styles(),
      },
      options.force,
    );
    context.logger.info(
      `Created typed KERN data grid at ${target.directory}/${target.fileName}.component.ts.`,
    );
    return tree;
  };
}

exports.default = defaultFactory;
