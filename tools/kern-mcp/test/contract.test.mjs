import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';

import Ajv2020 from 'ajv/dist/2020.js';

import { createKernAgentApi, loadManifest, toolDefinitions } from '../lib.mjs';

const workspaceRoot = resolve(import.meta.dirname, '../../..');
const manifestPath = resolve(workspaceRoot, 'metadata/agent/generated/component-manifest.json');
const manifest = await loadManifest(manifestPath);
const api = createKernAgentApi(manifest);

describe('KERN agent component contract', () => {
  it('validates the complete manifest against the published JSON Schema', async () => {
    const schema = JSON.parse(
      await readFile(
        resolve(workspaceRoot, 'metadata/agent/schema/component-manifest.schema.json'),
        'utf8',
      ),
    );
    const validate = new Ajv2020({ allErrors: true, strict: true }).compile(schema);
    assert.equal(validate(manifest), true, JSON.stringify(validate.errors, null, 2));

    const invalidRoute = structuredClone(manifest);
    invalidRoute.components[0].documentation.route = '/components/app-shell';
    assert.equal(validate(invalidRoute), false, 'Absolute UI routes must be rejected.');

    const invalidDocumentationAsset = structuredClone(manifest);
    invalidDocumentationAsset.components[0].documentation.json = 'agent/components/app-shell.json';
    assert.equal(
      validate(invalidDocumentationAsset),
      false,
      'Documentation artifacts must be manifest-relative.',
    );

    const invalidPlaygroundRoute = structuredClone(manifest);
    invalidPlaygroundRoute.components[0].playground.route = '/preview/app-shell';
    assert.equal(
      validate(invalidPlaygroundRoute),
      false,
      'Playground routes must be mount-relative.',
    );

    const incompleteSelectorDeprecation = structuredClone(manifest);
    const buttonGroup = incompleteSelectorDeprecation.components.find(
      (component) => component.id === 'button-group',
    );
    assert.ok(buttonGroup?.selectorDeprecations.length);
    delete buttonGroup.selectorDeprecations[0].migration;
    assert.equal(
      validate(incompleteSelectorDeprecation),
      false,
      'Deprecated selector metadata must include migration guidance.',
    );

    const validFixtureEffects = [
      {
        kind: 'layout',
        mode: 'overflow',
        label: 'Overflow',
        description: 'Constrains the documentation fixture.',
      },
      {
        kind: 'content',
        mode: 'long-text',
        label: 'Long text',
        description: 'Uses deterministic long fixture content.',
      },
      {
        kind: 'data',
        mode: 'loading',
        label: 'Loading',
        description: 'Uses deterministic loading data.',
      },
      {
        kind: 'status',
        mode: 'warning',
        label: 'Warning',
        description: 'Uses the warning fixture state.',
      },
    ];
    for (const fixtureEffect of validFixtureEffects) {
      const validFixtureManifest = structuredClone(manifest);
      validFixtureManifest.components[0].playground.presets[0].fixtureEffect = fixtureEffect;
      assert.equal(
        validate(validFixtureManifest),
        true,
        `${fixtureEffect.kind}/${fixtureEffect.mode}: ${JSON.stringify(validate.errors, null, 2)}`,
      );
    }

    const invalidFixtureMode = structuredClone(manifest);
    invalidFixtureMode.components[0].playground.presets[0].fixtureEffect = {
      kind: 'layout',
      mode: 'loading',
      label: 'Loading',
      description: 'A data mode must not validate as a layout effect.',
    };
    assert.equal(
      validate(invalidFixtureMode),
      false,
      'Fixture effect modes must be discriminated by kind.',
    );

    const fixtureWithUndeclaredField = structuredClone(manifest);
    fixtureWithUndeclaredField.components[0].playground.presets[0].fixtureEffect = {
      kind: 'status',
      mode: 'warning',
      label: 'Warning',
      description: 'Uses the warning fixture state.',
      publicInput: 'tone',
    };
    assert.equal(
      validate(fixtureWithUndeclaredField),
      false,
      'Fixture effects must reject undeclared public-binding metadata.',
    );

    const invalidExampleAsset = structuredClone(manifest);
    invalidExampleAsset.components[0].examples[0].source = 'agent/examples/app-shell.ts';
    assert.equal(
      validate(invalidExampleAsset),
      false,
      'Example artifacts must be manifest-relative.',
    );

    const invalidRecipeAsset = structuredClone(manifest);
    invalidRecipeAsset.recipes[0].source = 'agent/recipes/install-and-configure.ts';
    assert.equal(
      validate(invalidRecipeAsset),
      false,
      'Recipe artifacts must be manifest-relative.',
    );
  });

  it('covers every catalog entry with complete public ownership and agent fields', () => {
    assert.equal(manifest.schemaVersion, '1.3.0');
    assert.deepEqual(
      manifest.library.playground.environment.map(({ key }) => key),
      ['theme', 'density', 'direction', 'locale', 'motion', 'viewport'],
    );
    assert.equal(manifest.library.playground.brandColor.parameter, 'brandColor');
    assert.equal(manifest.components.length, 131);
    assert.ok(manifest.symbols.length > 300);
    assert.equal(new Set(manifest.components.map((component) => component.id)).size, 131);

    for (const component of manifest.components) {
      assert.match(component.importPath, /^@kern-ui\/angular\//);
      assert.ok(component.symbol);
      assert.ok(component.canonicalSymbol);
      assert.ok(component.lifecycle.status);
      assert.ok(component.lifecycle.evidenceProfile);
      assert.ok(component.lifecycle.requiredEvidence.length > 0);
      assert.ok(component.lifecycle.rationale.length > 20);
      assert.ok(component.acceptanceStates.length > 0);
      assert.ok(Array.isArray(component.api));
      assert.ok(Array.isArray(component.slots));
      assert.equal(typeof component.forms.controlValueAccessor, 'boolean');
      assert.equal(component.a11y.target, 'WCAG 2.2 AA');
      assert.equal(component.ssr.hydration, 'consumer-validation-required');
      assert.equal(component.ssr.evidenceScope, 'library-docs-route-smoke');
      assert.ok(component.examples[0]?.code.includes(component.symbol));
      assert.equal(component.examples[0]?.verification, 'compiled');
      assert.equal(component.examples[0]?.source, `examples/${component.id}.ts`);
      assert.match(component.examples[0]?.code ?? '', /standalone:\s*true/);
      assert.match(component.examples[0]?.code ?? '', /void bootstrapApplication\(/);
      assert.ok(component.documentation.json.endsWith(`${component.id}.json`));
      assert.equal(component.playground.route, `preview/${component.id}`);
      assert.ok(component.playground.scenarios.includes('default'));
      assert.ok(component.playground.controls.length > 0);
      assert.ok(component.playground.presets.length > 0);
      assert.ok(
        component.playground.controls.every(
          (control) => control.description && control.binding?.kind,
        ),
      );
      assert.ok(component.commonMistakes.length > 0);
      assert.ok(component.checklist.length > 0);
    }

    for (const recipe of manifest.recipes) {
      assert.equal(recipe.source, `recipes/${recipe.id}.ts`);
      assert.equal(recipe.verification, 'packed-package-aot');
      assert.match(recipe.sourceDigest, /^sha256-[a-f0-9]{64}$/);
      assert.match(recipe.code, /standalone:\s*true/);
      assert.match(recipe.code, /void bootstrapApplication\(/);
    }
  });

  it('uses compiler-derived generic types and canonical aliases for complex components', () => {
    const grid = api.resolveComponent('data-grid');
    assert.equal(grid.importPath, '@kern-ui/angular/addon-grid');
    assert.equal(grid.canonicalId, 'data-grid');
    assert.deepEqual(grid.aliases.symbols, ['KrnDataTable']);
    assert.equal(grid.api.find((member) => member.name === 'data')?.type, 'ReadonlyArray<T>');
    assert.equal(grid.api.find((member) => member.name === 'rowIdentity')?.required, true);
    assert.match(grid.examples[0].code, /rowIdentity/);

    const table = api.resolveComponent('KrnDataTable');
    assert.equal(table.id, 'data-table');
    assert.equal(table.canonicalId, 'data-grid');
    assert.equal(table.canonicalSymbol, 'KrnDataGrid');

    const select = api.resolveComponent('krn-select');
    assert.equal(select.forms.controlValueAccessor, true);
    assert.equal(select.forms.valueType, 'T | null');
    assert.equal(select.api.find((member) => member.name === 'placeholder')?.type, 'string');

    const popoverTrigger = api
      .resolveComponent('popover')
      .slots.find((slot) => slot.selector === '[krnPopoverTrigger]');
    assert.equal(popoverTrigger.required, true);
    assert.match(popoverTrigger.description, /non-interactive label content/);

    const hoverCardTrigger = api
      .resolveComponent('hover-card')
      .slots.find((slot) => slot.selector === '[krnHoverCardTrigger]');
    assert.equal(hoverCardTrigger.required, true);
    assert.match(hoverCardTrigger.description, /Hover Card-owned trigger button/);

    const menuTrigger = api
      .resolveComponent('menu')
      .slots.find((slot) => slot.selector === '[krnMenuTrigger]');
    assert.equal(menuTrigger.required, false);
    assert.match(menuTrigger.description, /omit it to use triggerLabel/);

    const crudToolbar = api.resolveComponent('crud-toolbar');
    assert.equal(crudToolbar.symbol, 'KrnCrudToolbar');
    assert.equal(crudToolbar.canonicalSymbol, 'KrnCrudToolbar');
    assert.ok(crudToolbar.aliases.symbols.includes('KrnCRUDToolbar'));
    assert.match(crudToolbar.examples[0].code, /import \{ KrnCrudToolbar \}/);
    assert.doesNotMatch(crudToolbar.examples[0].code, /import \{ KrnCRUDToolbar \}/);
  });

  it('mirrors repository and package assets exactly', async () => {
    const repositoryManifest = await readFile(manifestPath, 'utf8');
    const packageManifest = await readFile(
      resolve(workspaceRoot, 'projects/kern/agent/component-manifest.json'),
      'utf8',
    );
    assert.equal(packageManifest, repositoryManifest);

    const importMap = JSON.parse(
      await readFile(resolve(workspaceRoot, 'metadata/agent/generated/import-map.json'), 'utf8'),
    );
    assert.equal(importMap.components['data-grid'].importPath, '@kern-ui/angular/addon-grid');
    assert.equal(importMap.symbols.KrnDataTable.canonicalSymbol, 'KrnDataGrid');

    const repositoryRootExportMap = await readFile(
      resolve(workspaceRoot, 'metadata/agent/generated/root-export-map.json'),
      'utf8',
    );
    const packageRootExportMap = await readFile(
      resolve(workspaceRoot, 'projects/kern/agent/root-export-map.json'),
      'utf8',
    );
    assert.equal(packageRootExportMap, repositoryRootExportMap);

    const repositoryExamples = await readFile(
      resolve(workspaceRoot, 'metadata/agent/examples/index.json'),
      'utf8',
    );
    const packageExamples = await readFile(
      resolve(workspaceRoot, 'projects/kern/agent/examples/index.json'),
      'utf8',
    );
    assert.equal(packageExamples, repositoryExamples);
  });

  it('publishes all requested read-only MCP tools', () => {
    assert.deepEqual(
      toolDefinitions.map((tool) => tool.name),
      [
        'get_overview',
        'search_components',
        'get_component_contract',
        'get_example',
        'get_recipe',
        'get_migration',
        'validate_usage',
      ],
    );
  });
});

describe('KERN agent API', () => {
  it('searches by task and returns lifecycle and owner information', () => {
    const result = api.searchComponents({ query: 'authoritative options' });
    assert.ok(result.results.some((component) => component.id === 'combobox'));
    assert.ok(result.results.every((component) => component.importPath));
  });

  it('ranks the natural-language component-discovery acceptance corpus', () => {
    const corpus = [
      ['choose one option', 'select'],
      ['resize dashboard panels', 'resizable-panels'],
      ['show loading progress', 'progress-bar'],
      ['display account status', 'status-badge'],
      ['server side table', 'data-grid'],
      ['upload several files', 'file-upload'],
      ['enter verification code', 'verification-code'],
    ];

    for (const [query, expected] of corpus) {
      const result = api.searchComponents({ query, limit: 5 });
      assert.ok(result.total > 0, `${query}: search must return a candidate`);
      assert.equal(
        result.results[0]?.id,
        expected,
        `${query}: ${result.results.map((entry) => entry.id).join(', ')}`,
      );
    }
  });

  it('uses OR fallback scoring when part of a natural-language query is unknown', () => {
    const result = api.searchComponents({
      query: 'choose one option quux-unregistered-domain-term',
      limit: 5,
    });

    assert.ok(result.total > 0);
    assert.equal(result.results[0]?.id, 'select');
  });

  it('resolves ids, selectors, canonical symbols and aliases', () => {
    assert.equal(api.resolveComponent('data-grid')?.id, 'data-grid');
    assert.equal(api.resolveComponent('krn-data-grid')?.id, 'data-grid');
    assert.equal(api.resolveComponent('KrnDataGrid')?.id, 'data-grid');
    assert.equal(api.resolveComponent('KrnDataTable')?.id, 'data-table');
  });

  it('returns the packed-package compile-verified source', () => {
    const result = api.callTool('get_example', {
      component: 'data-grid',
    }).structuredContent;
    assert.equal(result.example.verification, 'compiled');
    assert.equal(result.example.source, 'examples/data-grid.ts');
    assert.match(result.example.code, /readonly KrnDataColumn<CustomerRow>\[\]/);
    assert.match(result.example.code, /=> row\.id/);
  });

  it('returns a complete compile-verified enterprise recipe', () => {
    const result = api.callTool('get_recipe', {
      recipe: 'controlled-data-grid',
    }).structuredContent;
    assert.equal(result.verification, 'packed-package-aot');
    assert.equal(result.source, 'recipes/controlled-data-grid.ts');
    assert.match(result.code, /new KrnDataGridDataSource/);
    assert.match(result.code, /ngOnInit\(\)/);
    assert.match(result.code, /retry\(\)/);
    assert.match(result.code, /AbortSignal/);
    assert.doesNotMatch(result.code, /TODO|implement here|Cancel the previous request/);
  });

  it('validates imports, required inputs and stylesheet configuration without requiring provideKrn', () => {
    const invalid = api.callTool('validate_usage', {
      component: 'data-grid',
      code: `
        import { Component } from '@angular/core';
        import { KrnDataGrid } from '@kern-ui/angular/addon-grid';

        @Component({
          imports: [KrnDataGrid],
          template: '<krn-data-grid />',
        })
        class InvalidGrid {}
      `,
      stylesConfigured: false,
      providerConfigured: false,
    }).structuredContent;
    assert.equal(invalid.valid, false);
    assert.ok(invalid.issues.some((entry) => entry.code === 'KRN_USAGE_MISSING_STYLES'));
    assert.equal(
      invalid.issues.filter((entry) => entry.code === 'KRN_USAGE_REQUIRED_INPUT').length,
      3,
    );
    assert.ok(!invalid.issues.some((entry) => entry.message.includes('provideKrn')));

    const valid = api.callTool('validate_usage', {
      component: 'button',
      code: `
        import { Component } from '@angular/core';
        import { KrnButton } from '@kern-ui/angular/kit';

        @Component({
          imports: [KrnButton],
          template: '<button krnButton>Save</button>',
        })
        class ValidButton {}
      `,
      stylesConfigured: true,
      providerConfigured: false,
    }).structuredContent;
    assert.equal(valid.valid, true);
    assert.deepEqual(valid.issues, []);
    assert.deepEqual(valid.verificationRequired, []);
    assert.ok(
      valid.checked.includes(`required global stylesheet ${manifest.library.requiredStyles}`),
    );
  });

  it('reports omitted or invalid stylesheet state as unverified instead of claiming complete validity', () => {
    for (const stylesConfigured of [undefined, null, 'true']) {
      const result = api.callTool('validate_usage', {
        component: 'button',
        code: `
          import { Component } from '@angular/core';
          import { KrnButton } from '@kern-ui/angular/kit';

          @Component({
            imports: [KrnButton],
            template: '<button krnButton>Save</button>',
          })
          class UnverifiedStylesButton {}
        `,
        stylesConfigured,
      }).structuredContent;

      assert.equal(result.valid, true);
      assert.ok(
        result.issues.some(
          (entry) => entry.severity === 'warning' && entry.code === 'KRN_USAGE_STYLES_UNVERIFIED',
        ),
      );
      assert.equal(result.verificationRequired.length, 1);
      assert.match(result.verificationRequired[0], /styles\/kern\.css/);
      assert.match(result.summary, /remains unverified/);
      assert.doesNotMatch(result.summary, /satisfies the checked public contract/);
      assert.ok(result.notChecked.includes('consumer global stylesheet configuration'));
      assert.ok(!result.checked.some((entry) => entry.includes('global stylesheet')));
    }
  });

  it('resolves exported and local import names through the TypeScript AST', () => {
    const aliased = api.callTool('validate_usage', {
      component: 'button',
      code: `
        import { Component } from '@angular/core';
        import {
          KrnButton as PrimaryAction,
          type KrnSelectOption as Option,
        } from '@kern-ui/angular/kit';

        const option = null as Option<string> | null;
        void option;

        @Component({
          imports: [PrimaryAction],
          template: '<button krnButton>Save</button>',
        })
        class AliasedButton {}
      `,
      stylesConfigured: true,
    }).structuredContent;

    assert.equal(aliased.valid, true);
    assert.deepEqual(aliased.issues, []);
  });

  it('does not accept a type-only import as a runtime component import', () => {
    for (const code of [
      `
        import { Component } from '@angular/core';
        import type { KrnButton } from '@kern-ui/angular/kit';
        @Component({ imports: [KrnButton], template: '<button krnButton>Save</button>' })
        class TypeOnlyButton {}
      `,
      `
        import { Component } from '@angular/core';
        import { type KrnButton as PrimaryAction } from '@kern-ui/angular/kit';
        @Component({ imports: [PrimaryAction], template: '<button krnButton>Save</button>' })
        class TypeOnlyAliasedButton {}
      `,
    ]) {
      const result = api.callTool('validate_usage', {
        component: 'button',
        code,
        stylesConfigured: true,
      }).structuredContent;

      assert.equal(result.valid, false);
      assert.ok(result.issues.some((entry) => entry.code === 'KRN_USAGE_MISSING_IMPORT'));
    }
  });

  it('does not confuse a colliding local alias with the exported component name', () => {
    const result = api.callTool('validate_usage', {
      component: 'button',
      code: `
        import { Component } from '@angular/core';
        import { KrnSelectOption as KrnButton } from '@kern-ui/angular/kit';
        @Component({ imports: [KrnButton], template: '<button krnButton>Save</button>' })
        class CollidingButton {}
      `,
      stylesConfigured: true,
    }).structuredContent;

    assert.equal(result.valid, false);
    assert.ok(result.issues.some((entry) => entry.code === 'KRN_USAGE_MISSING_IMPORT'));
  });

  it('recognizes an aliased ReactiveFormsModule by its exported name', () => {
    const result = api.callTool('validate_usage', {
      component: 'select',
      code: `
        import { Component } from '@angular/core';
        import { ReactiveFormsModule as Forms } from '@angular/forms';
        import { KrnSelect as PlanSelect } from '@kern-ui/angular/kit';

        @Component({
          imports: [Forms, PlanSelect],
          template: '<krn-select formControlName="plan" [options]="plans" />',
        })
        class PlanForm {}
      `,
      stylesConfigured: true,
    }).structuredContent;

    assert.equal(result.valid, true);
    assert.ok(!result.issues.some((entry) => entry.code === 'KRN_USAGE_REACTIVE_FORMS_IMPORT'));

    const typeOnlyForms = api.callTool('validate_usage', {
      component: 'select',
      code: `
        import { Component } from '@angular/core';
        import type { ReactiveFormsModule as Forms } from '@angular/forms';
        import { KrnSelect } from '@kern-ui/angular/kit';
        @Component({
          imports: [Forms, KrnSelect],
          template: '<krn-select formControlName="plan" [options]="plans" />',
        })
        class InvalidPlanForm {}
      `,
      stylesConfigured: true,
    }).structuredContent;
    assert.equal(typeOnlyForms.valid, false);
    assert.ok(
      typeOnlyForms.issues.some((entry) => entry.code === 'KRN_USAGE_REACTIVE_FORMS_IMPORT'),
    );
  });

  it('validates required inputs on the matching element instead of identifier-like source text', () => {
    const result = api.callTool('validate_usage', {
      component: 'data-grid',
      code: `
        import { Component } from '@angular/core';
        import { KrnDataGrid } from '@kern-ui/angular/addon-grid';

        const data = [];
        const columns = [];
        const rowIdentity = (row) => row.id;

        @Component({
          imports: [KrnDataGrid],
          template: '<krn-data-grid />',
        })
        class MissingBindings {}
      `,
      stylesConfigured: true,
    }).structuredContent;

    assert.equal(result.valid, false);
    assert.equal(
      result.issues.filter((entry) => entry.code === 'KRN_USAGE_REQUIRED_INPUT').length,
      3,
    );
  });

  it('requires selector usage and runtime symbols in the owning standalone component imports', () => {
    const missingSelector = api.callTool('validate_usage', {
      component: 'button',
      code: `
        import { Component } from '@angular/core';
        import { KrnButton } from '@kern-ui/angular/kit';
        @Component({ imports: [KrnButton], template: '<button>Native</button>' })
        class MissingSelector {}
      `,
      stylesConfigured: true,
    }).structuredContent;
    assert.equal(missingSelector.valid, false);
    assert.ok(missingSelector.issues.some((entry) => entry.code === 'KRN_USAGE_SELECTOR_MISSING'));

    const missingWiring = api.callTool('validate_usage', {
      component: 'button',
      code: `
        import { Component } from '@angular/core';
        import { KrnButton } from '@kern-ui/angular/kit';
        @Component({ imports: [], template: '<button krnButton>Save</button>' })
        class MissingWiring {}
      `,
      stylesConfigured: true,
    }).structuredContent;
    assert.equal(missingWiring.valid, false);
    assert.ok(missingWiring.issues.some((entry) => entry.code === 'KRN_USAGE_COMPONENT_IMPORTS'));
  });

  it('accepts every published per-component example as a structurally runnable usage', () => {
    for (const component of manifest.components) {
      const result = api.callTool('validate_usage', {
        component: component.id,
        code: component.examples[0].code,
        stylesConfigured: true,
      }).structuredContent;
      assert.equal(
        result.valid,
        true,
        `${component.id}: ${JSON.stringify(result.issues, null, 2)}`,
      );
    }
  });

  it('returns explicit empty migration guidance instead of inventing changes', () => {
    const result = api.callTool('get_migration', {
      from: '0.1.0',
      to: '1.0.0',
      component: 'button',
    }).structuredContent;
    assert.deepEqual(result.migrations, []);
    assert.match(result.message, /No migration is registered/);
  });
});
