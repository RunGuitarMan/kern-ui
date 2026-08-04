import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  testingLifecycleSymbols,
  validateTestingEntrypointContract,
  validateTestingFamilySelectors,
} from '../verify-kern-testing-entrypoint.mjs';

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

test('mandatory testing symbols are derived from lifecycle evidence metadata', () => {
  const symbols = testingLifecycleSymbols({
    symbolGroups: [
      { entrypoint: './core', symbols: ['KrnIgnoredHarness'] },
      { entrypoint: './testing', symbols: ['KrnCompatibilityOnlyHarness'] },
      {
        entrypoint: './testing/actions',
        symbols: ['KrnFutureHarness', 'KrnFutureHarnessFilters'],
      },
    ],
  });

  assert.deepEqual(symbols, ['KrnFutureHarness', 'KrnFutureHarnessFilters']);
  assert.throws(
    () =>
      testingLifecycleSymbols({
        symbolGroups: [
          { entrypoint: './testing/actions', symbols: ['KrnFutureHarness'] },
          { entrypoint: './testing/forms', symbols: ['KrnFutureHarness'] },
        ],
      }),
    /unique public symbol inventory/,
  );
});

test('family harness modules may only target selectors owned by their inventory family', () => {
  const inventory = {
    units: [
      { family: 'forms', selectors: ['krn-file-upload'] },
      { family: 'feedback', selectors: ['krn-toast-viewport'] },
    ],
  };
  const entrypoint = {
    name: 'forms',
    subpath: './testing/forms',
    aggregated: true,
    inventoryFamilies: ['forms'],
  };

  assert.deepEqual(
    validateTestingFamilySelectors(
      entrypoint,
      `static hostSelector = 'krn-file-upload';`,
      inventory,
    ),
    ['krn-file-upload'],
  );
  assert.throws(
    () =>
      validateTestingFamilySelectors(
        entrypoint,
        `static hostSelector = 'krn-toast-viewport';`,
        inventory,
      ),
    /owned by another inventory family/,
  );
});

test('testing family contract is owned by component inventory families', async () => {
  const [contract, inventory] = await Promise.all(
    ['projects/kern/testing/entrypoints.json', 'projects/kern/api/component-inventory.json'].map(
      async (path) => JSON.parse(await readFile(resolve(workspaceRoot, path), 'utf8')),
    ),
  );

  assert.equal(validateTestingEntrypointContract(contract, inventory), contract);
  assert.deepEqual(
    contract.entrypoints.filter(({ aggregated }) => aggregated).map(({ name }) => name),
    ['actions', 'data-display', 'feedback', 'forms', 'layout', 'navigation'],
  );
  assert.throws(
    () =>
      validateTestingEntrypointContract(
        {
          ...contract,
          entrypoints: contract.entrypoints.map((entrypoint, index) =>
            index === 0
              ? { ...entrypoint, name: 'unknown', subpath: './testing/unknown' }
              : entrypoint,
          ),
        },
        inventory,
      ),
    /invalid component inventory owners/,
  );
});
