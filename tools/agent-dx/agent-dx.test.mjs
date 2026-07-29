import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';

import { KERN_AGENT_EXAMPLE_RECIPES, KERN_AGENT_HIGH_RISK_TASKS } from './example-recipes.mjs';
import { internalButtonTriggerViolations } from './trigger-slot-policy.mjs';

const workspaceRoot = resolve(import.meta.dirname, '../..');
const manifest = JSON.parse(
  await readFile(
    resolve(workspaceRoot, 'metadata/agent/generated/component-manifest.json'),
    'utf8',
  ),
);
const index = JSON.parse(
  await readFile(resolve(workspaceRoot, 'metadata/agent/examples/index.json'), 'utf8'),
);

describe('KERN agent DX examples', () => {
  it('keeps the closed recipe registry aligned with all 131 catalog entries', () => {
    const componentIds = manifest.components.map((component) => component.id).sort();
    const recipeIds = Object.keys(KERN_AGENT_EXAMPLE_RECIPES).sort();
    const exampleIds = index.examples.map((example) => example.id).sort();

    assert.equal(componentIds.length, 131);
    assert.deepEqual(recipeIds, componentIds);
    assert.deepEqual(exampleIds, componentIds);
    assert.equal(index.total, 131);
  });

  it('keeps generated repository and package sources deterministic', () => {
    const result = spawnSync(process.execPath, ['tools/agent-dx/generate-examples.mjs'], {
      cwd: workspaceRoot,
      encoding: 'utf8',
      timeout: 30_000,
    });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.match(result.stdout, /131 explicit standalone sources/);
    assert.match(result.stdout, /is current/);
  });

  it('requires typed backing state for every declared high-risk task', async () => {
    for (const task of KERN_AGENT_HIGH_RISK_TASKS) {
      const source = await readFile(
        resolve(workspaceRoot, `metadata/agent/examples/${task.component}.ts`),
        'utf8',
      );
      for (const marker of task.requiredMarkers) {
        assert.ok(
          source.includes(marker),
          `${task.id} is missing typed marker ${JSON.stringify(marker)}`,
        );
      }
    }
  });

  it('publishes complete runnable sources for every curated enterprise recipe', async () => {
    assert.equal(manifest.recipes.length, 13);
    for (const recipe of manifest.recipes) {
      const source = await readFile(
        resolve(workspaceRoot, `metadata/agent/recipes/${recipe.id}.ts`),
        'utf8',
      );
      assert.equal(recipe.source, `recipes/${recipe.id}.ts`);
      assert.equal(recipe.verification, 'packed-package-aot');
      assert.equal(recipe.code, source);
      assert.match(source, /standalone:\s*true/);
      assert.match(source, /void bootstrapApplication\(/);
      assert.doesNotMatch(
        source,
        /TODO|replace this|implement here|Cancel the previous request|Set childrenState|\breportError\s*\(|\bwindow\.|\bconsole\.(?:log|info|debug)\s*\(/,
      );
    }

    const grid = await readFile(
      resolve(workspaceRoot, 'metadata/agent/recipes/controlled-data-grid.ts'),
      'utf8',
    );
    assert.match(grid, /ngOnInit\(\)/);
    assert.match(grid, /new KrnDataGridDataSource/);
    assert.match(grid, /retry\(\)/);
    assert.match(grid, /candidate\.data\.every\(isCustomerRow\)/);
    assert.doesNotMatch(grid, /<p role="alert">/);

    const tree = await readFile(
      resolve(workspaceRoot, 'metadata/agent/recipes/tree-identity-and-loading.ts'),
      'utf8',
    );
    assert.match(tree, /childrenState: 'loading'/);
    assert.match(tree, /childrenState: 'error'/);
    assert.match(tree, /AbortController/);
    assert.match(tree, /collectTreeNodeIds\(this\.nodes\(\)\)/);
    assert.match(tree, /ids\.has\(candidate\.id\)/);

    const combobox = await readFile(
      resolve(workspaceRoot, 'metadata/agent/recipes/remote-combobox.ts'),
      'utf8',
    );
    assert.match(combobox, /optionsState\.set\('loading'\)/);
    assert.match(combobox, /optionsState\.set\('error'\)/);
    assert.match(combobox, /activeRequest\?\.abort/);
    assert.match(combobox, /retry\(\)/);

    const typedForm = await readFile(
      resolve(workspaceRoot, 'metadata/agent/recipes/typed-reactive-form.ts'),
      'utf8',
    );
    assert.match(typedForm, /savedProfile/);
    assert.match(typedForm, /role="status"/);
    assert.doesNotMatch(typedForm, /\bconsole\./);

    const generatedFeature = await readFile(
      resolve(workspaceRoot, 'metadata/agent/recipes/generate-enterprise-feature.ts'),
      'utf8',
    );
    assert.match(generatedFeature, /KrnCrudToolbar/);
    assert.match(generatedFeature, /rows\.update/);
    assert.doesNotMatch(generatedFeature, /KrnCRUDToolbar/);
  });

  it('rejects nested interactive controls in component-owned button trigger slots', () => {
    assert.deepEqual(
      internalButtonTriggerViolations(`
        <krn-popover><span krnPopoverTrigger>Details</span></krn-popover>
        <krn-hover-card><span krnHoverCardTrigger>Account</span></krn-hover-card>
        <krn-menu><span krnMenuTrigger>Actions</span></krn-menu>
      `),
      [],
    );

    const violations = internalButtonTriggerViolations(`
      <krn-popover><button krnPopoverTrigger>Details</button></krn-popover>
      <krn-hover-card>
        <span krnHoverCardTrigger><a href="/accounts">Account</a></span>
      </krn-hover-card>
      <krn-menu>
        <span krnMenuTrigger><krn-icon-button ariaLabel="Actions">⋯</krn-icon-button></span>
      </krn-menu>
      <krn-popover>
        <span krnPopoverTrigger><krn-select [options]="options" /></span>
      </krn-popover>
    `);
    assert.deepEqual(
      violations.map(({ slot, element }) => ({ slot, element })),
      [
        { slot: 'krnPopoverTrigger', element: 'button' },
        { slot: 'krnHoverCardTrigger', element: 'a' },
        { slot: 'krnMenuTrigger', element: 'krn-icon-button' },
        { slot: 'krnPopoverTrigger', element: 'krn-select' },
      ],
    );
  });
});
