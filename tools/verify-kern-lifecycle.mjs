import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import ts from 'typescript';

import { extractCatalogFromSource } from '../scripts/generate-component-contract.mjs';

const modulePath = fileURLToPath(import.meta.url);
const workspaceRoot = resolve(dirname(modulePath), '..');
const defaultLifecyclePath = resolve(workspaceRoot, 'projects/kern/api/lifecycle.json');
const defaultDeprecationsPath = resolve(workspaceRoot, 'projects/kern/api/deprecations.json');
const catalogPath = resolve(workspaceRoot, 'projects/showcase/src/lib/catalog.ts');
const catalogIndexPath = resolve(
  workspaceRoot,
  'projects/showcase/catalog-index/src/lib/catalog-index.ts',
);
const componentContractPath = resolve(
  workspaceRoot,
  'projects/showcase/src/lib/generated-component-contract.ts',
);
const apiConfigPath = resolve(workspaceRoot, 'projects/kern/api/entrypoints.json');
const packageManifestPath = resolve(workspaceRoot, 'projects/kern/package.json');
const allowedStatuses = new Set(['stable', 'beta', 'experimental', 'recipe', 'deprecated']);
const issues = [];

function option(name, fallback) {
  const prefix = `--${name}=`;
  const argument = process.argv.find((value) => value.startsWith(prefix));
  return argument ? resolve(workspaceRoot, argument.slice(prefix.length)) : fallback;
}

function report(message) {
  issues.push(message);
}

async function readJson(path, label) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    throw new Error(
      `${label} could not be read at ${path}: ${error instanceof Error ? error.message : error}`,
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
  if (ts.isIdentifier(node) || ts.isStringLiteralLike(node) || ts.isNumericLiteral(node)) {
    return node.text;
  }
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

function stringArray(node, sourceFile, label) {
  const value = unwrapExpression(node);
  if (!value || !ts.isArrayLiteralExpression(value)) {
    throw new Error(`${label} must remain an array literal so lifecycle drift can be verified.`);
  }
  return value.elements.map((element) => {
    const item = unwrapExpression(element);
    if (!item || !ts.isStringLiteralLike(item)) {
      throw new Error(`${label} may contain only string literals.`);
    }
    return item.text;
  });
}

export function discoverLifecycleCatalogFromSource(sourceText, sourcePath = catalogPath) {
  const descriptors = extractCatalogFromSource(sourceText, sourcePath);
  const sourceFile = ts.createSourceFile(
    sourcePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  function statusSet(name) {
    const initializer = variableInitializer(sourceFile, name);
    if (!initializer || !ts.isNewExpression(initializer)) {
      throw new Error(`Catalog ${name} must remain a Set constructed from a string array.`);
    }
    return new Set(stringArray(initializer.arguments?.[0], sourceFile, name));
  }

  const beta = statusSet('BETA_COMPONENTS');
  const experimental = statusSet('EXPERIMENTAL_COMPONENTS');
  const catalog = new Map();

  for (const item of descriptors) {
    const status =
      item.category === 'Patterns'
        ? 'recipe'
        : experimental.has(item.id)
          ? 'experimental'
          : beta.has(item.id)
            ? 'beta'
            : 'stable';
    if (catalog.has(item.id)) throw new Error(`Catalog id "${item.id}" is duplicated.`);
    catalog.set(item.id, { ...item, status });
  }

  return catalog;
}

async function discoverCatalog() {
  const [indexSource, catalogSource] = await Promise.all([
    readFile(catalogIndexPath, 'utf8'),
    readFile(catalogPath, 'utf8'),
  ]);
  return discoverLifecycleCatalogFromSource(`${indexSource}\n${catalogSource}`, catalogPath);
}

function declarationName(node, sourceFile) {
  return node.name ? nodeName(node.name, sourceFile) : null;
}

function hasJsDocTag(node, tagName) {
  return ts.getJSDocTags(node).some((tag) => tag.tagName.text === tagName);
}

function publicDeclarations(sourceFile) {
  const declarations = new Map();
  for (const statement of sourceFile.statements) {
    if (
      ts.isClassDeclaration(statement) ||
      ts.isInterfaceDeclaration(statement) ||
      ts.isTypeAliasDeclaration(statement) ||
      ts.isEnumDeclaration(statement) ||
      ts.isFunctionDeclaration(statement)
    ) {
      const name = declarationName(statement, sourceFile);
      if (name) declarations.set(name, statement);
    } else if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        const name = declarationName(declaration, sourceFile);
        if (name) declarations.set(name, declaration);
      }
    }
  }
  return declarations;
}

async function discoverPublicApi(apiConfig) {
  const symbols = new Map();
  const deprecatedMembers = new Map();

  for (const entrypoint of apiConfig.entrypoints) {
    if (entrypoint.subpath === '.') continue;
    const baselinePath = resolve(workspaceRoot, 'projects/kern/api', entrypoint.baseline);
    const sourceText = await readFile(baselinePath, 'utf8');
    const sourceFile = ts.createSourceFile(
      baselinePath,
      sourceText,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS,
    );
    const declarations = publicDeclarations(sourceFile);
    const exportedLocals = new Map();

    for (const statement of sourceFile.statements) {
      if (
        !ts.isExportDeclaration(statement) ||
        !statement.exportClause ||
        !ts.isNamedExports(statement.exportClause)
      ) {
        continue;
      }
      for (const element of statement.exportClause.elements) {
        const exportedName = element.name.text;
        const localName = element.propertyName?.text ?? exportedName;
        const key = `${entrypoint.subpath}:${exportedName}`;
        if (symbols.has(key)) report(`Public API baseline exports "${key}" more than once.`);
        const declaration = declarations.get(localName);
        symbols.set(key, {
          entrypoint: entrypoint.subpath,
          experimental: declaration ? hasJsDocTag(declaration, 'experimental') : false,
          kind: statement.isTypeOnly || element.isTypeOnly ? 'type' : 'value',
          localName,
          name: exportedName,
        });
        if (!exportedLocals.has(localName) || exportedName === localName) {
          exportedLocals.set(localName, exportedName);
        }
      }
    }

    for (const [localName, exportedName] of exportedLocals) {
      const declaration = declarations.get(localName);
      if (!declaration || !ts.isClassDeclaration(declaration)) continue;
      for (const member of declaration.members) {
        if (!hasJsDocTag(member, 'deprecated')) continue;
        const memberName = declarationName(member, sourceFile);
        if (!memberName) {
          report(`${entrypoint.subpath}:${exportedName} has an unnamed deprecated member.`);
          continue;
        }
        const key = `${entrypoint.subpath}:${exportedName}.${memberName}`;
        deprecatedMembers.set(key, {
          entrypoint: entrypoint.subpath,
          member: memberName,
          symbol: exportedName,
        });
      }
    }
  }

  return { deprecatedMembers, symbols };
}

async function discoverComponentContracts() {
  const sourceText = await readFile(componentContractPath, 'utf8');
  const sourceFile = ts.createSourceFile(
    componentContractPath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const contractsNode = variableInitializer(sourceFile, 'KERN_RUNTIME_COMPONENTS');
  if (!contractsNode || !ts.isObjectLiteralExpression(contractsNode)) {
    throw new Error('Generated KERN_RUNTIME_COMPONENTS must remain an object literal.');
  }

  const contracts = new Map();
  for (const property of contractsNode.properties) {
    if (!ts.isPropertyAssignment(property)) continue;
    const selector = nodeName(property.name, sourceFile);
    const contract = unwrapExpression(property.initializer);
    if (!selector || !contract || !ts.isObjectLiteralExpression(contract)) continue;
    const classProperty = contract.properties.find(
      (candidate) =>
        ts.isPropertyAssignment(candidate) && nodeName(candidate.name, sourceFile) === 'className',
    );
    const kindProperty = contract.properties.find(
      (candidate) =>
        ts.isPropertyAssignment(candidate) && nodeName(candidate.name, sourceFile) === 'kind',
    );
    if (
      !classProperty ||
      !ts.isPropertyAssignment(classProperty) ||
      !kindProperty ||
      !ts.isPropertyAssignment(kindProperty)
    ) {
      continue;
    }
    const classNameNode = unwrapExpression(classProperty.initializer);
    const kindNode = unwrapExpression(kindProperty.initializer);
    if (
      classNameNode &&
      ts.isStringLiteralLike(classNameNode) &&
      kindNode &&
      ts.isStringLiteralLike(kindNode)
    ) {
      contracts.set(selector, {
        className: classNameNode.text,
        kind: kindNode.text,
      });
    }
  }
  return contracts;
}

function flattenCatalogRegistry(registry) {
  const entries = new Map();
  if (!Array.isArray(registry.catalogGroups)) {
    report('lifecycle.json requires a catalogGroups array.');
    return entries;
  }
  const profiles = new Set(Object.keys(registry.evidenceProfiles ?? {}));

  for (const [index, group] of registry.catalogGroups.entries()) {
    const label = `catalogGroups[${index}]`;
    if (!group || typeof group !== 'object') {
      report(`${label} must be an object.`);
      continue;
    }
    if (!allowedStatuses.has(group.status))
      report(`${label} has invalid status "${group.status}".`);
    if (typeof group.category !== 'string' || !group.category) {
      report(`${label} requires category.`);
    }
    if (typeof group.owner !== 'string' || !group.owner) report(`${label} requires owner.`);
    if (!profiles.has(group.evidenceProfile)) {
      report(`${label} references unknown evidenceProfile "${group.evidenceProfile}".`);
    }
    if (!Array.isArray(group.ids) || group.ids.length === 0) {
      report(`${label} requires at least one id.`);
      continue;
    }
    for (const id of group.ids) {
      if (typeof id !== 'string' || !id) {
        report(`${label} contains an invalid id.`);
        continue;
      }
      if (entries.has(id)) report(`Lifecycle catalog id "${id}" is registered more than once.`);
      entries.set(id, {
        category: group.category,
        evidenceProfile: group.evidenceProfile,
        owner: group.owner,
        status: group.status,
      });
    }
  }
  return entries;
}

function flattenSymbolRegistry(registry) {
  const symbols = new Map();
  if (!Array.isArray(registry.symbolGroups)) {
    report('lifecycle.json requires a symbolGroups array.');
    return symbols;
  }

  for (const [index, group] of registry.symbolGroups.entries()) {
    const label = `symbolGroups[${index}]`;
    if (!group || typeof group !== 'object') {
      report(`${label} must be an object.`);
      continue;
    }
    if (typeof group.entrypoint !== 'string' || !group.entrypoint) {
      report(`${label} requires entrypoint.`);
    }
    if (!allowedStatuses.has(group.status))
      report(`${label} has invalid status "${group.status}".`);
    if (typeof group.owner !== 'string' || !group.owner) report(`${label} requires owner.`);
    if (
      group.status !== 'stable' &&
      (typeof group.rationale !== 'string' || group.rationale.length < 10)
    ) {
      report(`${label} requires a concrete rationale for non-stable status.`);
    }
    if (!Array.isArray(group.symbols) || group.symbols.length === 0) {
      report(`${label} requires at least one symbol.`);
      continue;
    }
    for (const name of group.symbols) {
      if (typeof name !== 'string' || !name) {
        report(`${label} contains an invalid symbol.`);
        continue;
      }
      const key = `${group.entrypoint}:${name}`;
      if (symbols.has(key))
        report(`Lifecycle public symbol "${key}" is registered more than once.`);
      symbols.set(key, {
        entrypoint: group.entrypoint,
        name,
        owner: group.owner,
        status: group.status,
      });
    }
  }
  return symbols;
}

function compareCatalog(expected, registered) {
  for (const [id, item] of expected) {
    const lifecycle = registered.get(id);
    if (!lifecycle) {
      report(`Catalog entry "${id}" has no lifecycle registration.`);
      continue;
    }
    if (lifecycle.category !== item.category) {
      report(
        `Catalog entry "${id}" category is "${item.category}", lifecycle has "${lifecycle.category}".`,
      );
    }
    if (lifecycle.status !== item.status) {
      report(
        `Catalog entry "${id}" status is "${item.status}", lifecycle has "${lifecycle.status}".`,
      );
    }
  }
  for (const id of registered.keys()) {
    if (!expected.has(id)) report(`Lifecycle catalog entry "${id}" does not exist in the catalog.`);
  }
}

function compareSymbols(expected, registered) {
  for (const [key, symbol] of expected) {
    const lifecycle = registered.get(key);
    if (!lifecycle) {
      report(`Public symbol "${key}" has no lifecycle registration.`);
      continue;
    }
    if (symbol.experimental && lifecycle.status !== 'experimental') {
      report(`Public symbol "${key}" is tagged @experimental but registered ${lifecycle.status}.`);
    }
  }
  for (const key of registered.keys()) {
    if (!expected.has(key)) report(`Lifecycle public symbol "${key}" is not in an API baseline.`);
  }
}

export function componentStatusIssues(catalog, classes, registeredSymbols) {
  const found = [];
  for (const [id, item] of catalog) {
    const className = classes.get(item.selector);
    if (!className) {
      found.push(`Catalog selector "${item.selector}" has no generated component contract.`);
      continue;
    }
    const matches = [...registeredSymbols.values()].filter(
      (symbol) => symbol.name === className && symbol.entrypoint !== './testing',
    );
    if (matches.length !== 1) {
      found.push(
        `Catalog entry "${id}" resolves to ${className}, expected one lifecycle public symbol but found ${matches.length}.`,
      );
      continue;
    }
    if (matches[0].status !== item.status) {
      found.push(
        `Catalog entry "${id}" is ${item.status}, but its public class ${className} is ${matches[0].status}.`,
      );
    }
  }
  return found;
}

function compareComponentStatuses(catalog, classes, registeredSymbols) {
  for (const issue of componentStatusIssues(catalog, classes, registeredSymbols)) report(issue);
}

function parseSemver(value) {
  const match =
    typeof value === 'string' &&
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z.-]+))?$/.exec(value);
  if (!match) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4] ?? null,
  };
}

function compareSemver(left, right) {
  for (const key of ['major', 'minor', 'patch']) {
    if (left[key] !== right[key]) return left[key] - right[key];
  }
  if (left.prerelease === right.prerelease) return 0;
  if (left.prerelease === null) return 1;
  if (right.prerelease === null) return -1;
  return left.prerelease.localeCompare(right.prerelease);
}

async function verifyDeprecations(
  registry,
  discoveredApi,
  lifecycleSymbols,
  packageVersion,
  componentContracts,
) {
  if (!registry || registry.schemaVersion !== 1 || !Array.isArray(registry.entries)) {
    report('deprecations.json requires schemaVersion 1 and an entries array.');
    return 0;
  }
  const activeMembers = new Map();
  const activeSelectors = new Map();
  const ids = new Set();
  for (const [index, entry] of registry.entries.entries()) {
    const label = `deprecations.entries[${index}]`;
    if (!entry || typeof entry !== 'object') {
      report(`${label} must be an object.`);
      continue;
    }
    if (typeof entry.id !== 'string' || entry.id.length < 3) {
      report(`${label} requires a stable id.`);
    } else if (ids.has(entry.id)) {
      report(`${label} duplicates deprecation id "${entry.id}".`);
    } else {
      ids.add(entry.id);
    }
    const publicSymbolKey = `${entry.entrypoint}:${entry.symbol}`;
    const publicSymbol = discoveredApi.symbols.get(publicSymbolKey);
    if (!lifecycleSymbols.has(publicSymbolKey) || !publicSymbol) {
      report(`${label} references unregistered public symbol "${publicSymbolKey}".`);
    }
    if (!['input', 'model', 'output', 'method', 'property', 'selector'].includes(entry.kind)) {
      report(`${label} has invalid kind "${entry.kind}".`);
    }
    if (!['active', 'removed'].includes(entry.status)) {
      report(`${label} has invalid status "${entry.status}".`);
    }
    if (typeof entry.replacement !== 'string' || entry.replacement.length < 5) {
      report(`${label} requires a concrete replacement.`);
    }
    if (typeof entry.migration !== 'string' || entry.migration.length < 10) {
      report(`${label} requires migration guidance.`);
    }
    const introduced = parseSemver(entry.introducedIn);
    const removal = parseSemver(entry.removeIn);
    if (!introduced) report(`${label} has invalid introducedIn version.`);
    if (!removal) report(`${label} has invalid removeIn version.`);
    if (introduced && removal && compareSemver(removal, introduced) <= 0) {
      report(`${label} removeIn must be later than introducedIn.`);
    }
    if (entry.kind === 'selector') {
      if (typeof entry.selector !== 'string' || entry.selector.length === 0) {
        report(`${label} requires a selector.`);
      }
      if ('member' in entry) {
        report(`${label} selector deprecation must not declare member.`);
      }
      if (entry.status === 'active' && typeof entry.selector === 'string') {
        const key = `${publicSymbolKey}#${entry.selector}`;
        if (activeSelectors.has(key)) {
          report(`Active selector deprecation "${key}" is registered more than once.`);
        }
        activeSelectors.set(key, entry);
        const contract = componentContracts.get(entry.selector);
        if (!contract) {
          report(
            `${label} active selector "${entry.selector}" does not exist on a public component or directive.`,
          );
        } else if (
          !publicSymbol ||
          contract.className !== publicSymbol.localName ||
          !['component', 'directive'].includes(contract.kind)
        ) {
          report(
            `${label} selector "${entry.selector}" belongs to ${contract.className}, not public symbol "${publicSymbolKey}".`,
          );
        }
      }
    } else {
      if (typeof entry.member !== 'string' || entry.member.length === 0) {
        report(`${label} member deprecation requires member.`);
      }
      if ('selector' in entry) {
        report(`${label} member deprecation must not declare selector.`);
      }
      if (entry.status === 'active' && typeof entry.member === 'string') {
        const key = `${publicSymbolKey}.${entry.member}`;
        if (activeMembers.has(key)) {
          report(`Active deprecation "${key}" is registered more than once.`);
        }
        activeMembers.set(key, entry);
      }
    }
    if (entry.status === 'active') {
      if (removal && compareSemver(removal, packageVersion) <= 0) {
        report(`Active deprecation "${entry.id}" has reached removal version ${entry.removeIn}.`);
      }
    }

    if (typeof entry.documentation !== 'string') {
      report(`${label} requires a documentation link.`);
      continue;
    }
    const [relativePath, fragment] = entry.documentation.split('#');
    const documentationPath = resolve(workspaceRoot, relativePath);
    if (!documentationPath.startsWith(`${workspaceRoot}${sep}`) || !existsSync(documentationPath)) {
      report(`${label} documentation path does not exist inside the workspace.`);
      continue;
    }
    const documentation = await readFile(documentationPath, 'utf8');
    if (!fragment || !documentation.includes(`id="${fragment}"`)) {
      report(`${label} documentation must point to an explicit anchor.`);
    }
  }

  for (const key of discoveredApi.deprecatedMembers.keys()) {
    if (!activeMembers.has(key))
      report(`Public API deprecation "${key}" is missing from deprecations.json.`);
  }
  for (const key of activeMembers.keys()) {
    if (!discoveredApi.deprecatedMembers.has(key)) {
      report(`Active deprecation "${key}" is not tagged @deprecated in the API baseline.`);
    }
  }
  return activeMembers.size + activeSelectors.size;
}

async function main() {
  const lifecyclePath = option('lifecycle', defaultLifecyclePath);
  const deprecationsPath = option('deprecations', defaultDeprecationsPath);
  const [lifecycle, deprecations, apiConfig, packageManifest, catalog, componentContracts] =
    await Promise.all([
      readJson(lifecyclePath, 'Lifecycle registry'),
      readJson(deprecationsPath, 'Deprecation registry'),
      readJson(apiConfigPath, 'API entrypoint configuration'),
      readJson(packageManifestPath, 'Kern package manifest'),
      discoverCatalog(),
      discoverComponentContracts(),
    ]);
  const classes = new Map(
    [...componentContracts].map(([selector, contract]) => [selector, contract.className]),
  );

  if (lifecycle.schemaVersion !== 1) report('lifecycle.json schemaVersion must be 1.');
  if (!lifecycle.policy || typeof lifecycle.policy !== 'object') {
    report('lifecycle.json requires a policy object.');
  }
  for (const [name, profile] of Object.entries(lifecycle.evidenceProfiles ?? {})) {
    if (!Array.isArray(profile.requiredEvidence) || profile.requiredEvidence.length === 0) {
      report(`Evidence profile "${name}" requires a non-empty requiredEvidence array.`);
    }
  }

  const registeredCatalog = flattenCatalogRegistry(lifecycle);
  const registeredSymbols = flattenSymbolRegistry(lifecycle);
  const discoveredApi = await discoverPublicApi(apiConfig);
  compareCatalog(catalog, registeredCatalog);
  compareSymbols(discoveredApi.symbols, registeredSymbols);
  compareComponentStatuses(catalog, classes, registeredSymbols);

  const version = parseSemver(packageManifest.version);
  let activeDeprecationCount = 0;
  if (!version) {
    report(`projects/kern/package.json has invalid version "${packageManifest.version}".`);
  } else {
    activeDeprecationCount = await verifyDeprecations(
      deprecations,
      discoveredApi,
      registeredSymbols,
      version,
      componentContracts,
    );
  }

  if (issues.length) {
    console.error(`Kern lifecycle verification failed:\n- ${issues.join('\n- ')}`);
    process.exitCode = 1;
    return;
  }

  console.log(
    `Kern lifecycle verified: ${registeredCatalog.size} catalog entries, ` +
      `${registeredSymbols.size} public symbols, ` +
      `${activeDeprecationCount} active deprecations.`,
  );
}

if (process.argv[1] && resolve(process.argv[1]) === modulePath) {
  try {
    await main();
  } catch (error) {
    console.error(
      `Kern lifecycle verification failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exitCode = 1;
  }
}
