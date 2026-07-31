import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { schema as angularSchema } from '@angular-devkit/core';
import ts from 'typescript';

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const defaultInventoryPath = resolve(workspaceRoot, 'projects/kern/api/component-inventory.json');
const defaultSchemaPath = resolve(
  workspaceRoot,
  'projects/kern/api/component-inventory.schema.json',
);
const runtimeConfigPath = resolve(workspaceRoot, 'projects/kern/api/runtime-entrypoints.json');
const lifecyclePath = resolve(workspaceRoot, 'projects/kern/api/lifecycle.json');
const deprecationsPath = resolve(workspaceRoot, 'projects/kern/api/deprecations.json');
const packageManifestPath = resolve(workspaceRoot, 'projects/kern/package.json');
const componentContractPath = resolve(
  workspaceRoot,
  'projects/showcase/src/lib/generated-component-contract.ts',
);
const issues = [];

function option(name, fallback) {
  const prefix = `--${name}=`;
  const argument = process.argv.find((value) => value.startsWith(prefix));
  return argument ? resolve(workspaceRoot, argument.slice(prefix.length)) : fallback;
}

function report(message) {
  issues.push(message);
}

function failWithIssues() {
  console.error(`Kern component inventory verification failed:\n- ${issues.join('\n- ')}`);
  process.exitCode = 1;
}

async function readJson(path, label) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    throw new Error(
      `${label} could not be read at ${path}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

function unwrapExpression(node) {
  let current = node;
  while (
    current &&
    (ts.isAsExpression(current) ||
      ts.isSatisfiesExpression(current) ||
      ts.isParenthesizedExpression(current))
  ) {
    current = current.expression;
  }
  return current;
}

function nodeName(node, sourceFile) {
  if (!node) return null;
  if (ts.isIdentifier(node) || ts.isStringLiteralLike(node)) return node.text;
  return node.getText(sourceFile);
}

function variableInitializer(sourceFile, name) {
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (nodeName(declaration.name, sourceFile) === name) {
        return unwrapExpression(declaration.initializer);
      }
    }
  }
  return undefined;
}

function objectField(object, name, sourceFile) {
  return object.properties.find(
    (property) => ts.isPropertyAssignment(property) && nodeName(property.name, sourceFile) === name,
  );
}

async function discoverRuntimeContracts() {
  const sourceText = await readFile(componentContractPath, 'utf8');
  const sourceFile = ts.createSourceFile(
    componentContractPath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const initializer = variableInitializer(sourceFile, 'KERN_RUNTIME_COMPONENTS');
  if (!initializer || !ts.isObjectLiteralExpression(initializer)) {
    throw new Error('Generated KERN_RUNTIME_COMPONENTS must remain an object literal.');
  }

  const contracts = new Map();
  for (const property of initializer.properties) {
    if (!ts.isPropertyAssignment(property)) continue;
    const selector = nodeName(property.name, sourceFile);
    const value = unwrapExpression(property.initializer);
    if (!selector || !value || !ts.isObjectLiteralExpression(value)) continue;
    const className = objectField(value, 'className', sourceFile);
    const kind = objectField(value, 'kind', sourceFile);
    const source = objectField(value, 'source', sourceFile);
    const fields = [className, kind, source].map((field) =>
      field && ts.isPropertyAssignment(field) ? unwrapExpression(field.initializer) : undefined,
    );
    if (!fields.every((field) => field && ts.isStringLiteralLike(field))) {
      throw new Error(`Runtime component contract "${selector}" is incomplete.`);
    }
    contracts.set(selector, {
      className: fields[0].text,
      kind: fields[1].text,
      source: fields[2].text,
    });
  }
  return contracts;
}

function sameSet(actual, expected) {
  return (
    actual.length === expected.length &&
    new Set(actual).size === actual.length &&
    actual.every((value) => expected.includes(value))
  );
}

function selectorDeprecationRecord(entry) {
  return {
    id: entry.id,
    selector: entry.selector,
    status: entry.status,
    introducedIn: entry.introducedIn,
    removeIn: entry.removeIn,
    replacement: entry.replacement,
    migration: entry.migration,
    documentation: entry.documentation,
  };
}

function sameRecords(actual, expected) {
  const serialize = (values) =>
    JSON.stringify([...values].sort((left, right) => left.id.localeCompare(right.id)));
  return serialize(actual) === serialize(expected);
}

function flattenLifecycle(lifecycle) {
  const catalog = new Map();
  const symbols = new Map();
  for (const group of lifecycle.catalogGroups ?? []) {
    for (const id of group.ids ?? []) {
      catalog.set(id, {
        category: group.category,
        evidenceProfile: group.evidenceProfile,
        owner: group.owner,
        status: group.status,
      });
    }
  }
  for (const group of lifecycle.symbolGroups ?? []) {
    for (const symbol of group.symbols ?? []) {
      symbols.set(`${group.entrypoint}:${symbol}`, {
        owner: group.owner,
        status: group.status,
      });
    }
  }
  return { catalog, symbols };
}

function resolveOwnership(source, runtimeConfig) {
  const matches = [];
  for (const entrypoint of runtimeConfig.entrypoints ?? []) {
    const prefix = `${entrypoint.sourceRoot}/`;
    if (!source.startsWith(prefix)) continue;
    const ownedPath = source.slice(prefix.length);
    for (const owner of entrypoint.owns ?? []) {
      if (ownedPath === owner || ownedPath.startsWith(`${owner}/`)) {
        matches.push({
          entrypoint,
          family: owner
            .replace(/^lib[/]/, '')
            .replace(/[.]ts$/, '')
            .split('/')[0],
        });
      }
    }
  }
  return matches;
}

function computedSummary(units) {
  const catalogUnits = units.filter((unit) => unit.role === 'catalog');
  return {
    selectorCount: units.reduce((total, unit) => total + unit.selectors.length, 0),
    implementationCount: units.length,
    componentCount: units.filter((unit) => unit.kind === 'component').length,
    directiveCount: units.filter((unit) => unit.kind === 'directive').length,
    catalogEntryCount: units.reduce((total, unit) => total + unit.catalog.length, 0),
    catalogReviewUnitCount: catalogUnits.length,
    catalogAliasEntryCount:
      units.reduce((total, unit) => total + unit.catalog.length, 0) - catalogUnits.length,
    publicReviewUnitCount: units.filter((unit) => unit.visibility === 'public').length,
    supportingReviewUnitCount: units.filter((unit) => unit.role === 'supporting').length,
    internalImplementationCount: units.filter((unit) => unit.role === 'internal').length,
    selectorAliasCount:
      units.reduce((total, unit) => total + unit.selectors.length, 0) - units.length,
  };
}

function verifyUnit(unit, index, context) {
  const label = `units[${index}]`;
  if (!unit || typeof unit !== 'object' || Array.isArray(unit)) {
    report(`${label} must be an object.`);
    return;
  }
  if (unit.reviewUnit !== `${unit.entrypoint}:${unit.symbol}`) {
    report(`${label} reviewUnit must equal entrypoint:symbol.`);
  }
  if (!['component', 'directive'].includes(unit.kind)) {
    report(`${label} has invalid kind "${unit.kind}".`);
  }
  if (!['public', 'internal'].includes(unit.visibility)) {
    report(`${label} has invalid visibility "${unit.visibility}".`);
  }
  if (!['catalog', 'supporting', 'internal'].includes(unit.role)) {
    report(`${label} has invalid role "${unit.role}".`);
  }
  if (context.reviewUnits.has(unit.reviewUnit)) {
    report(`Review unit "${unit.reviewUnit}" is duplicated.`);
  }
  context.reviewUnits.add(unit.reviewUnit);
  if (!context.unitsByReviewUnit.has(unit.reviewUnit)) {
    context.unitsByReviewUnit.set(unit.reviewUnit, unit);
  }

  if (!Array.isArray(unit.selectors) || unit.selectors.length === 0) {
    report(`${label} requires at least one selector.`);
    return;
  }
  if (!unit.selectors.includes(unit.canonicalSelector)) {
    report(`${label} canonicalSelector must be present in selectors.`);
  }
  const expectedSelectorAliases = unit.selectors.filter(
    (selector) => selector !== unit.canonicalSelector,
  );
  if (
    !Array.isArray(unit.aliases?.selectors) ||
    !sameSet(unit.aliases.selectors, expectedSelectorAliases)
  ) {
    report(`${label} aliases.selectors must contain every non-canonical selector exactly once.`);
  }

  for (const selector of unit.selectors) {
    const existing = context.selectors.get(selector);
    if (existing) {
      report(`Selector "${selector}" belongs to both ${existing} and ${unit.reviewUnit}.`);
    }
    context.selectors.set(selector, unit.reviewUnit);
    const contract = context.runtimeContracts.get(selector);
    if (!contract) {
      report(`${label} selector "${selector}" is missing from the generated runtime contract.`);
      continue;
    }
    if (
      contract.className !== unit.symbol ||
      contract.kind !== unit.kind ||
      contract.source !== unit.source
    ) {
      report(`${label} selector "${selector}" differs from its generated runtime contract.`);
    }
  }

  const ownership = resolveOwnership(unit.source, context.runtimeConfig);
  if (ownership.length !== 1) {
    report(`${label} source must have exactly one runtime owner, found ${ownership.length}.`);
  } else if (
    ownership[0].entrypoint.name !== unit.entrypoint ||
    ownership[0].family !== unit.family
  ) {
    report(`${label} entrypoint/family does not match runtime source ownership.`);
  }
  if (!existsSync(resolve(workspaceRoot, unit.source))) {
    report(`${label} source "${unit.source}" does not exist.`);
  }

  const publicSymbols = Array.isArray(unit.publicSymbols) ? unit.publicSymbols : [];
  const expectedCanonicalPublicSymbol = publicSymbols.includes(unit.symbol)
    ? unit.symbol
    : ([...publicSymbols].sort()[0] ?? null);
  if (unit.canonicalPublicSymbol !== expectedCanonicalPublicSymbol) {
    report(`${label} canonicalPublicSymbol does not match the decorated implementation class.`);
  }
  const expectedSymbolAliases = publicSymbols.filter(
    (symbol) => symbol !== unit.canonicalPublicSymbol,
  );
  if (
    !Array.isArray(unit.aliases?.symbols) ||
    !sameSet(unit.aliases.symbols, expectedSymbolAliases)
  ) {
    report(`${label} aliases.symbols must contain every non-canonical public symbol exactly once.`);
  }

  const entrypoint = context.runtimeConfig.entrypoints.find(
    (candidate) => candidate.name === unit.entrypoint,
  );
  const selectorDeprecations = Array.isArray(unit.selectorDeprecations)
    ? unit.selectorDeprecations
    : [];
  const expectedSelectorDeprecations = context.selectorDeprecations
    .filter(
      (entry) => entry.entrypoint === entrypoint?.subpath && publicSymbols.includes(entry.symbol),
    )
    .map(selectorDeprecationRecord);
  if (!sameRecords(selectorDeprecations, expectedSelectorDeprecations)) {
    report(`${label} selectorDeprecations differs from the active deprecation registry.`);
  }
  for (const deprecation of selectorDeprecations) {
    if (context.selectorDeprecationIds.has(deprecation.id)) {
      report(`Selector deprecation "${deprecation.id}" belongs to more than one review unit.`);
    }
    context.selectorDeprecationIds.add(deprecation.id);
    if (!unit.selectors.includes(deprecation.selector)) {
      report(
        `${label} deprecated selector "${deprecation.selector}" is not owned by the review unit.`,
      );
    }
  }
  if (unit.visibility === 'public') {
    if (unit.role === 'internal') report(`${label} a public unit cannot have role "internal".`);
    if (unit.reviewWith !== null) {
      report(`${label} a public unit cannot delegate review ownership.`);
    }
    if (publicSymbols.length === 0 || !publicSymbols.includes(unit.canonicalPublicSymbol)) {
      report(`${label} public unit requires a canonical public symbol.`);
    }
    const expectedImportPath =
      entrypoint?.subpath === '.'
        ? context.runtimeConfig.packageName
        : `${context.runtimeConfig.packageName}/${entrypoint?.subpath?.replace(/^[.][/]/, '')}`;
    if (unit.importPath !== expectedImportPath) {
      report(`${label} importPath does not match its direct runtime entrypoint.`);
    }
    if (!unit.lifecycle || typeof unit.lifecycle !== 'object') {
      report(`${label} public unit requires lifecycle metadata.`);
    }
    for (const symbol of publicSymbols) {
      const row = context.lifecycle.symbols.get(`${entrypoint?.subpath}:${symbol}`);
      if (!row) {
        report(`${label} public symbol "${symbol}" has no lifecycle registration.`);
      } else if (row.status !== unit.lifecycle?.status || row.owner !== unit.lifecycle?.owner) {
        report(`${label} public symbol "${symbol}" differs from unit lifecycle metadata.`);
      }
    }
  } else {
    if (unit.role !== 'internal') report(`${label} an internal unit must have role "internal".`);
    if (typeof unit.reviewWith !== 'string' || unit.reviewWith.length === 0) {
      report(`${label} an internal unit requires reviewWith.`);
    }
    if (
      publicSymbols.length > 0 ||
      unit.canonicalPublicSymbol !== null ||
      unit.importPath !== null ||
      unit.lifecycle !== null
    ) {
      report(`${label} internal unit cannot expose public API or lifecycle metadata.`);
    }
  }

  const catalog = Array.isArray(unit.catalog) ? unit.catalog : [];
  if (unit.role === 'catalog' && catalog.length === 0) {
    report(`${label} catalog role requires at least one catalog entry.`);
  }
  if (unit.role !== 'catalog' && catalog.length > 0) {
    report(`${label} only catalog review units may own catalog entries.`);
  }
  const canonicalCatalogItems = catalog.filter((item) => item.variantOf === null);
  if (catalog.length > 0 && canonicalCatalogItems.length !== 1) {
    report(
      `${label} must own exactly one canonical catalog id, found ${canonicalCatalogItems.length}.`,
    );
  }
  const canonicalCatalog = canonicalCatalogItems[0];
  const expectedCanonicalSelector =
    canonicalCatalog?.selector ?? [...unit.selectors].sort()[0] ?? null;
  if (unit.canonicalSelector !== expectedCanonicalSelector) {
    report(`${label} canonicalSelector does not match its canonical catalog/runtime selector.`);
  }
  const expectedCatalogAliases = catalog
    .map((item) => item.id)
    .filter((id) => id !== canonicalCatalog?.id);
  if (
    !Array.isArray(unit.aliases?.catalogIds) ||
    !sameSet(unit.aliases.catalogIds, expectedCatalogAliases)
  ) {
    report(`${label} aliases.catalogIds must contain every non-canonical catalog id exactly once.`);
  }

  for (const item of catalog) {
    if (context.catalogIds.has(item.id)) {
      report(`Catalog id "${item.id}" belongs to more than one review unit.`);
    }
    context.catalogIds.add(item.id);
    if (!unit.selectors.includes(item.selector)) {
      report(`${label} catalog selector "${item.selector}" is not owned by the review unit.`);
    }
    if (item.variantOf !== null && item.variantOf !== canonicalCatalog?.id) {
      report(
        `${label} catalog alias "${item.id}" must reference canonical id "${canonicalCatalog?.id}".`,
      );
    }
    const row = context.lifecycle.catalog.get(item.id);
    if (!row) {
      report(`${label} catalog id "${item.id}" has no lifecycle registration.`);
    } else if (
      row.category !== item.category ||
      row.status !== item.status ||
      row.owner !== item.owner ||
      row.evidenceProfile !== item.evidenceProfile
    ) {
      report(`${label} catalog id "${item.id}" differs from lifecycle metadata.`);
    }
  }
}

async function main() {
  const inventoryPath = option('inventory', defaultInventoryPath);
  const schemaPath = option('schema', defaultSchemaPath);
  const [
    inventory,
    schema,
    runtimeConfig,
    lifecycle,
    deprecations,
    packageManifest,
    runtimeContracts,
  ] = await Promise.all([
    readJson(inventoryPath, 'Component inventory'),
    readJson(schemaPath, 'Component inventory schema'),
    readJson(runtimeConfigPath, 'Runtime entrypoint configuration'),
    readJson(lifecyclePath, 'Lifecycle registry'),
    readJson(deprecationsPath, 'Deprecation registry'),
    readJson(packageManifestPath, 'Kern package manifest'),
    discoverRuntimeContracts(),
  ]);

  if (inventory.$schema !== './component-inventory.schema.json') {
    report('Component inventory must reference its local JSON Schema.');
  }
  if (inventory.schemaVersion !== '1.1.0') {
    report(`Unsupported component inventory schemaVersion "${inventory.schemaVersion}".`);
  }
  if (
    schema.$id !== `https://kern-ui.dev/schemas/component-inventory/${inventory.schemaVersion}` ||
    schema.properties?.schemaVersion?.const !== inventory.schemaVersion
  ) {
    report('Component inventory schema id/version differs from the inventory version.');
  }
  const schemaRegistry = new angularSchema.CoreSchemaRegistry();
  const validateSchema = await schemaRegistry.compile(schema);
  const schemaResult = await validateSchema(inventory);
  if (!schemaResult.success) {
    const details = (schemaResult.errors ?? [])
      .map((error) => `${error.instancePath || '/'} ${error.message ?? 'is invalid'}`)
      .join('; ');
    report(`Component inventory does not satisfy its JSON Schema: ${details}`);
    failWithIssues();
    return;
  }
  if (
    inventory.library?.name !== runtimeConfig.packageName ||
    inventory.library?.name !== packageManifest.name ||
    inventory.library?.version !== packageManifest.version
  ) {
    report('Component inventory library identity differs from the package/runtime configuration.');
  }
  if (inventory.generatedBy !== 'scripts/generate-component-contract.mjs') {
    report('Component inventory must identify its canonical generator.');
  }
  if (!Array.isArray(inventory.units)) {
    report('Component inventory requires a units array.');
    return;
  }

  const context = {
    catalogIds: new Set(),
    lifecycle: flattenLifecycle(lifecycle),
    reviewUnits: new Set(),
    runtimeConfig,
    runtimeContracts,
    selectorDeprecationIds: new Set(),
    selectorDeprecations: (deprecations.entries ?? []).filter(
      (entry) => entry.kind === 'selector' && entry.status === 'active',
    ),
    selectors: new Map(),
    unitsByReviewUnit: new Map(),
  };
  inventory.units.forEach((unit, index) => verifyUnit(unit, index, context));

  for (const unit of inventory.units) {
    if (unit.visibility !== 'internal' || typeof unit.reviewWith !== 'string') continue;
    const target = context.unitsByReviewUnit.get(unit.reviewWith);
    if (!target) {
      report(`Internal review unit ${unit.reviewUnit} references missing ${unit.reviewWith}.`);
      continue;
    }
    if (target.visibility !== 'public') {
      report(`Internal review unit ${unit.reviewUnit} must review with a public review unit.`);
    }
    if (target.entrypoint !== unit.entrypoint || target.family !== unit.family) {
      report(
        `Internal review unit ${unit.reviewUnit} must review with a public unit in the same entrypoint and behavior family.`,
      );
    }
  }

  for (const selector of runtimeContracts.keys()) {
    if (!context.selectors.has(selector)) {
      report(`Runtime selector "${selector}" has no inventory review unit.`);
    }
  }
  for (const id of context.lifecycle.catalog.keys()) {
    if (!context.catalogIds.has(id)) {
      report(`Lifecycle catalog id "${id}" has no inventory review unit.`);
    }
  }
  for (const entry of context.selectorDeprecations) {
    if (!context.selectorDeprecationIds.has(entry.id)) {
      report(`Active selector deprecation "${entry.id}" has no inventory metadata.`);
    }
  }

  const summary = computedSummary(inventory.units);
  for (const [name, value] of Object.entries(summary)) {
    if (inventory.summary?.[name] !== value) {
      report(`summary.${name} is ${inventory.summary?.[name]}, computed ${value}.`);
    }
  }

  if (issues.length > 0) {
    failWithIssues();
    return;
  }

  console.log(
    `Kern component inventory verified: ${summary.publicReviewUnitCount} public review units ` +
      `(${summary.catalogReviewUnitCount} catalog + ${summary.supportingReviewUnitCount} supporting), ` +
      `${summary.internalImplementationCount} internal, ${summary.selectorCount} selectors.`,
  );
}

try {
  await main();
} catch (error) {
  console.error(
    `Kern component inventory verification failed: ${
      error instanceof Error ? error.message : String(error)
    }`,
  );
  process.exitCode = 1;
}
