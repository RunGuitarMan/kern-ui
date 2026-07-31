'use strict';

const { generationContext, writeComponentFiles } = require('../shared/generator');

function typescript(context) {
  const valueName = `${context.className}FormValue`;
  return `import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { KrnButton, KrnFormField, KrnTextInput } from '@kern-ui/angular/kit';

export interface ${valueName} {
  readonly name: string;
  readonly email: string;
}

@Component({
  selector: '${context.selector}',
  imports: [ReactiveFormsModule, KrnButton, KrnFormField, KrnTextInput],
  templateUrl: './${context.fileName}.component.html',
  styleUrl: './${context.fileName}.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ${context.className}Component {
  readonly submitted = output<${valueName}>();

  protected readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitted.emit(this.form.getRawValue());
  }
}
`;
}

function template() {
  return `<form [formGroup]="form" (ngSubmit)="submit()">
  <krn-form-field label="Name">
    <krn-text-input [formControl]="form.controls.name" />
  </krn-form-field>

  <krn-form-field label="Email">
    <krn-text-input [formControl]="form.controls.email" />
  </krn-form-field>

  <button krnButton type="submit" [disabled]="form.invalid">Save</button>
</form>
`;
}

function styles() {
  return `:host {
  display: block;
}

form {
  display: grid;
  gap: var(--krn-space-4);
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
      `Created typed KERN form at ${target.directory}/${target.fileName}.component.ts.`,
    );
    return tree;
  };
}

exports.default = defaultFactory;
