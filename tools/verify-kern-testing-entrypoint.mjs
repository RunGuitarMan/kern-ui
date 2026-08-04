import { existsSync } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const workspaceRoot = resolve(import.meta.dirname, '..');
const packageRoot = join(workspaceRoot, 'dist/kern');
const packageJsonPath = join(packageRoot, 'package.json');
const contractPath = join(workspaceRoot, 'projects/kern/testing/entrypoints.json');
const lifecyclePath = join(workspaceRoot, 'projects/kern/api/lifecycle.json');
const inventoryPath = join(workspaceRoot, 'projects/kern/api/component-inventory.json');
const failures = [];

function fail(message) {
  failures.push(message);
}

function packagePath(specifier) {
  const path = resolve(packageRoot, specifier);
  if (path !== packageRoot && !path.startsWith(`${packageRoot}${sep}`)) {
    throw new Error(`Package export resolves outside dist/kern: ${specifier}`);
  }
  return path;
}

function typedExport(manifest, subpath) {
  const value = manifest.exports?.[subpath];
  if (
    !value ||
    typeof value !== 'object' ||
    typeof value.types !== 'string' ||
    typeof value.default !== 'string'
  ) {
    fail(`package.json does not expose types and default conditions for "${subpath}".`);
    return null;
  }
  return value;
}

export function validateTestingEntrypointContract(contract, inventory) {
  if (
    contract?.schemaVersion !== 1 ||
    contract.packageName !== '@kern-ui/angular' ||
    contract.aggregator?.subpath !== './testing' ||
    !Number.isInteger(contract.aggregator?.budgetBytes) ||
    !Array.isArray(contract.entrypoints)
  ) {
    throw new Error('Invalid projects/kern/testing/entrypoints.json contract.');
  }
  const inventoryFamilies = new Set(inventory.units.map(({ family }) => family));
  const names = new Set();
  const subpaths = new Set([contract.aggregator.subpath]);
  for (const entrypoint of contract.entrypoints) {
    if (
      typeof entrypoint?.name !== 'string' ||
      entrypoint.subpath !== `./testing/${entrypoint.name}` ||
      typeof entrypoint.aggregated !== 'boolean' ||
      (entrypoint.aggregated &&
        (!Array.isArray(entrypoint.inventoryFamilies) ||
          entrypoint.inventoryFamilies.length === 0 ||
          new Set(entrypoint.inventoryFamilies).size !== entrypoint.inventoryFamilies.length)) ||
      !Number.isInteger(entrypoint.budgetBytes) ||
      entrypoint.budgetBytes <= 0 ||
      names.has(entrypoint.name) ||
      subpaths.has(entrypoint.subpath)
    ) {
      throw new Error(`Invalid testing entrypoint: ${JSON.stringify(entrypoint)}`);
    }
    if (entrypoint.aggregated) {
      const unknownFamilies = entrypoint.inventoryFamilies.filter(
        (family) => !inventoryFamilies.has(family),
      );
      if (unknownFamilies.length > 0 || !entrypoint.inventoryFamilies.includes(entrypoint.name)) {
        throw new Error(
          `Aggregated testing family "${entrypoint.name}" has invalid component inventory owners: ${
            unknownFamilies.join(', ') || entrypoint.inventoryFamilies.join(', ')
          }.`,
        );
      }
    }
    names.add(entrypoint.name);
    subpaths.add(entrypoint.subpath);
  }
  if (!contract.entrypoints.some(({ name, aggregated }) => name === 'shared' && !aggregated)) {
    throw new Error('Testing entrypoint contract requires one non-aggregated shared foundation.');
  }
  return contract;
}

export function validateTestingFamilySelectors(entrypoint, moduleSource, inventory) {
  if (!entrypoint.aggregated) return [];
  const familiesBySelector = new Map();
  for (const unit of inventory.units) {
    for (const selector of unit.selectors ?? []) {
      const previous = familiesBySelector.get(selector);
      if (previous && previous !== unit.family) {
        throw new Error(`Component selector "${selector}" belongs to multiple inventory families.`);
      }
      familiesBySelector.set(selector, unit.family);
    }
  }
  const knownSelectors = [...new Set(moduleSource.match(/\bkrn-[a-z0-9-]+\b/g) ?? [])]
    .filter((selector) => familiesBySelector.has(selector))
    .sort();
  const mismatches = knownSelectors.filter(
    (selector) => !entrypoint.inventoryFamilies.includes(familiesBySelector.get(selector)),
  );
  if (mismatches.length > 0) {
    throw new Error(
      `${entrypoint.subpath} contains harness selectors owned by another inventory family: ${mismatches
        .map((selector) => `${selector} (${familiesBySelector.get(selector)})`)
        .join(', ')}.`,
    );
  }
  return knownSelectors;
}

export function testingLifecycleOwners(lifecycle) {
  const owners = new Map();
  for (const group of lifecycle.symbolGroups.filter(({ entrypoint }) =>
    entrypoint.startsWith('./testing/'),
  )) {
    for (const symbol of group.symbols) {
      if (owners.has(symbol)) {
        throw new Error(
          'Testing lifecycle evidence must contain a unique public symbol inventory.',
        );
      }
      owners.set(symbol, group.entrypoint);
    }
  }
  if (owners.size === 0) {
    throw new Error('Testing lifecycle evidence must contain a unique public symbol inventory.');
  }
  return owners;
}

export function testingLifecycleSymbols(lifecycle) {
  return [...testingLifecycleOwners(lifecycle).keys()].sort();
}

function declaredSymbols(declarations) {
  return new Set(
    [
      ...declarations.matchAll(
        /\b(?:declare\s+)?(?:abstract\s+)?(?:class|interface|type|const|let|var)\s+(Krn[A-Za-z0-9]+)/g,
      ),
    ].map((match) => match[1]),
  );
}

function exportedSymbols(declarations) {
  return new Set(
    [...declarations.matchAll(/\bexport\s+(?:type\s+)?\{([^}]+)\}/g)].flatMap((match) =>
      match[1]
        .split(',')
        .map((symbol) =>
          symbol
            .trim()
            .split(/\s+as\s+/)
            .at(-1),
        )
        .filter(Boolean),
    ),
  );
}

function moduleSpecifiers(source) {
  return [...source.matchAll(/\b(?:from|import)\s*(?:\([^)]*\)\s*)?['"]([^'"]+)['"]/g)].map(
    (match) => match[1],
  );
}

async function artifact(manifest, entrypoint) {
  const conditions = typedExport(manifest, entrypoint.subpath);
  if (!conditions) return null;
  const declarationsPath = packagePath(conditions.types);
  const modulePath = packagePath(conditions.default);
  for (const path of [declarationsPath, modulePath]) {
    if (!existsSync(path)) fail(`Declared artifact is missing: ${path}`);
  }
  if (!existsSync(declarationsPath) || !existsSync(modulePath)) return null;

  const [declarations, moduleSource, moduleStats] = await Promise.all([
    readFile(declarationsPath, 'utf8'),
    readFile(modulePath, 'utf8'),
    stat(modulePath),
  ]);
  if (moduleStats.size > entrypoint.budgetBytes) {
    fail(
      `${entrypoint.subpath} FESM is ${moduleStats.size} bytes; budget is ${entrypoint.budgetBytes}.`,
    );
  }
  const forbiddenImports = moduleSpecifiers(moduleSource).filter(
    (specifier) =>
      specifier === '@angular/core' ||
      specifier === '@kern-ui/angular' ||
      (specifier.startsWith('@kern-ui/angular/') &&
        !specifier.startsWith('@kern-ui/angular/testing/')),
  );
  if (forbiddenImports.length > 0) {
    fail(
      `${entrypoint.subpath} imports runtime entrypoints: ${[...new Set(forbiddenImports)].join(
        ', ',
      )}.`,
    );
  }
  if (/\bInjectionToken\b|\bKRN_[A-Z0-9_]+\b/.test(moduleSource)) {
    fail(`${entrypoint.subpath} contains runtime injection-token code.`);
  }
  return { ...entrypoint, declarations, modulePath, moduleSource, size: moduleStats.size };
}

async function verifyRuntimeIdentity(aggregator, entrypoints, requiredSymbols) {
  await import('@angular/compiler');
  const root = await import(pathToFileURL(aggregator.modulePath).href);
  const owners = new Map();
  for (const entrypoint of entrypoints.filter(({ aggregated }) => aggregated)) {
    const module = await import(pathToFileURL(entrypoint.modulePath).href);
    for (const name of Object.keys(module)) {
      if (owners.has(name)) {
        fail(`${name} is implemented by both ${owners.get(name)} and ${entrypoint.subpath}.`);
      } else {
        owners.set(name, entrypoint.subpath);
      }
      if (!(name in root) || !Object.is(root[name], module[name])) {
        fail(`Compatibility /testing export ${name} differs from ${entrypoint.subpath}.`);
      }
    }
  }
  for (const harness of requiredSymbols.filter((name) => name.endsWith('Harness'))) {
    if (typeof root[harness] !== 'function' || !owners.has(harness)) {
      fail(`Lifecycle-required runtime harness ${harness} has no compatibility identity.`);
    }
  }
  for (const name of Object.keys(root)) {
    if (!owners.has(name)) {
      fail(`Compatibility /testing has runtime export ${name} without a narrow family owner.`);
    }
  }
}

async function main() {
  for (const path of [packageJsonPath, contractPath, lifecyclePath, inventoryPath]) {
    if (!existsSync(path)) {
      throw new Error(`Required testing contract input is missing: ${path}`);
    }
  }
  const [manifest, rawContract, lifecycle, inventory] = await Promise.all(
    [packageJsonPath, contractPath, lifecyclePath, inventoryPath].map(async (path) =>
      JSON.parse(await readFile(path, 'utf8')),
    ),
  );
  const contract = validateTestingEntrypointContract(rawContract, inventory);
  const lifecycleOwners = testingLifecycleOwners(lifecycle);
  const requiredSymbols = [...lifecycleOwners.keys()].sort();
  const expectedSubpaths = new Set([
    contract.aggregator.subpath,
    ...contract.entrypoints.map(({ subpath }) => subpath),
  ]);
  const actualSubpaths = Object.entries(manifest.exports ?? {})
    .filter(
      ([subpath, conditions]) =>
        subpath.startsWith('./testing') &&
        conditions &&
        typeof conditions === 'object' &&
        typeof conditions.types === 'string' &&
        typeof conditions.default === 'string',
    )
    .map(([subpath]) => subpath);
  if (
    actualSubpaths.length !== expectedSubpaths.size ||
    actualSubpaths.some((subpath) => !expectedSubpaths.has(subpath))
  ) {
    fail(
      `Built testing subpaths are ${actualSubpaths.sort().join(', ')}, expected ${[
        ...expectedSubpaths,
      ]
        .sort()
        .join(', ')}.`,
    );
  }

  const aggregator = await artifact(manifest, {
    ...contract.aggregator,
    name: 'testing',
    aggregated: false,
  });
  const entrypoints = (
    await Promise.all(contract.entrypoints.map((entrypoint) => artifact(manifest, entrypoint)))
  ).filter(Boolean);
  if (!aggregator || entrypoints.length !== contract.entrypoints.length) return;

  for (const entrypoint of entrypoints) {
    try {
      validateTestingFamilySelectors(entrypoint, entrypoint.moduleSource, inventory);
    } catch (error) {
      fail(error instanceof Error ? error.message : String(error));
    }
  }

  const declarationsBySymbol = new Map();
  for (const entrypoint of entrypoints) {
    for (const symbol of declaredSymbols(entrypoint.declarations)) {
      const owners = declarationsBySymbol.get(symbol) ?? [];
      owners.push(entrypoint.subpath);
      declarationsBySymbol.set(symbol, owners);
    }
  }
  for (const symbol of requiredSymbols) {
    const owners = declarationsBySymbol.get(symbol) ?? [];
    const expectedOwner = lifecycleOwners.get(symbol);
    if (owners.length !== 1 || owners[0] !== expectedOwner) {
      fail(`${symbol} must be owned by ${expectedOwner}; found ${owners.join(', ') || 'none'}.`);
    }
  }

  for (const entrypoint of entrypoints) {
    const expected = [...lifecycleOwners]
      .filter(([, owner]) => owner === entrypoint.subpath)
      .map(([symbol]) => symbol)
      .sort();
    const actual = [...exportedSymbols(entrypoint.declarations)].sort();
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      fail(
        `${entrypoint.subpath} exports ${actual.join(', ') || 'nothing'}; lifecycle owns ${
          expected.join(', ') || 'nothing'
        }.`,
      );
    }
  }

  for (const entrypoint of contract.entrypoints) {
    if (entrypoint.aggregated && !aggregator.declarations.includes(entrypoint.subpath.slice(1))) {
      fail(`Compatibility /testing declarations do not re-export ${entrypoint.subpath}.`);
    }
  }
  const expectedAggregatorSpecifiers = contract.entrypoints
    .filter(({ aggregated }) => aggregated)
    .map(({ subpath }) => `${contract.packageName}${subpath.slice(1)}`)
    .sort();
  const actualAggregatorSpecifiers = moduleSpecifiers(aggregator.moduleSource)
    .filter((specifier) => specifier.startsWith(`${contract.packageName}/testing/`))
    .sort();
  if (JSON.stringify(actualAggregatorSpecifiers) !== JSON.stringify(expectedAggregatorSpecifiers)) {
    fail('Compatibility /testing FESM does not exclusively re-export every family owner.');
  }
  if (/\b(?:class|function|const|let|var)\b/.test(aggregator.moduleSource)) {
    fail('Compatibility /testing FESM contains implementation code.');
  }

  const primaryExport = manifest.exports?.['.']?.default;
  if (typeof primaryExport === 'string') {
    const primarySource = await readFile(packagePath(primaryExport), 'utf8');
    const leaked = requiredSymbols.filter(
      (name) => name.endsWith('Harness') && primarySource.includes(`class ${name}`),
    );
    if (leaked.length > 0) fail(`Testing harnesses leaked into runtime: ${leaked.join(', ')}.`);
  }

  await verifyRuntimeIdentity(aggregator, entrypoints, requiredSymbols);
  if (failures.length > 0) {
    console.error(`Kern testing entry point verification failed:\n- ${failures.join('\n- ')}`);
    process.exitCode = 1;
    return;
  }
  console.log(
    `Kern testing entrypoints verified: ${requiredSymbols.length} lifecycle symbols, ` +
      `${entrypoints.length} narrow owners, ${aggregator.size} byte compatibility FESM.`,
  );
}

if (
  resolve(process.argv[1] ?? '') ===
  resolve(import.meta.dirname, 'verify-kern-testing-entrypoint.mjs')
) {
  try {
    await main();
  } catch (error) {
    console.error(
      `Kern testing entry point verification failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    process.exitCode = 1;
  }
}
