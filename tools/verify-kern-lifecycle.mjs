import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { schema as angularSchema } from '@angular-devkit/core';
import { lt, rcompare, valid as validSemver } from 'semver';
import ts from 'typescript';

import { extractCatalogFromSource } from '../scripts/generate-component-contract.mjs';
import { validateLifecycleAttestation } from './attest-kern-lifecycle-release.mjs';

const modulePath = fileURLToPath(import.meta.url);
const workspaceRoot = resolve(dirname(modulePath), '..');
const defaultLifecyclePath = resolve(workspaceRoot, 'projects/kern/api/lifecycle.json');
const defaultLifecycleEvidencePath = resolve(
  workspaceRoot,
  'projects/kern/api/lifecycle-evidence.json',
);
const lifecycleEvidenceSchemaPath = resolve(
  workspaceRoot,
  'projects/kern/api/lifecycle-evidence.schema.json',
);
const manualEvidencePath = resolve(workspaceRoot, 'docs/accessibility/manual-evidence.json');
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
const allowedEvidenceModes = new Set(['local', 'release', 'promotion']);
const issues = [];

function option(name, fallback) {
  const prefix = `--${name}=`;
  const argument = process.argv.find((value) => value.startsWith(prefix));
  return argument ? resolve(workspaceRoot, argument.slice(prefix.length)) : fallback;
}

function valueOption(name, fallback) {
  const prefix = `--${name}=`;
  const argument = process.argv.find((value) => value.startsWith(prefix));
  return argument ? argument.slice(prefix.length) : fallback;
}

function report(message) {
  issues.push(message);
}

function sha256(content) {
  return `sha256-${createHash('sha256').update(content).digest('hex')}`;
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

const releasePackages = ['@kern-ui/angular', '@kern-ui/mcp'];
const publicReleaseTags = ['latest', 'next'];

export function selectPublishedReleaseBase(distTagsByPackage, currentVersion) {
  if (validSemver(currentVersion) !== currentVersion) {
    throw new Error(`Release base version must be exact Semantic Versioning: ${currentVersion}.`);
  }
  const candidates = [];
  for (const tag of publicReleaseTags) {
    const versions = releasePackages.map(
      (packageName) => distTagsByPackage[packageName]?.[tag] ?? null,
    );
    const configured = versions.filter((version) => version !== null);
    if (configured.length === 0) continue;
    if (configured.length !== releasePackages.length || new Set(configured).size !== 1) {
      throw new Error(
        `Published npm dist-tag ${tag} is not synchronized: ${releasePackages
          .map((packageName, index) => `${packageName}=${versions[index] ?? 'unset'}`)
          .join(', ')}.`,
      );
    }
    const [version] = configured;
    if (validSemver(version) !== version) {
      throw new Error(`Published npm dist-tag ${tag} contains invalid version ${version}.`);
    }
    if (lt(version, currentVersion)) candidates.push(version);
  }
  return [...new Set(candidates)].sort(rcompare)[0] ?? null;
}

function publishedDistTags(packageName) {
  const result = spawnSync(
    process.platform === 'win32' ? 'npm.cmd' : 'npm',
    ['view', packageName, 'dist-tags', '--json'],
    {
      cwd: workspaceRoot,
      encoding: 'utf8',
      maxBuffer: 2 * 1024 * 1024,
    },
  );
  if (result.status !== 0) {
    const output = `${result.stdout}\n${result.stderr}`;
    if (/E404|404 Not Found|is not in this registry/i.test(output)) return {};
    throw new Error(`Could not query npm dist-tags for ${packageName}: ${output.trim()}`);
  }
  const value = JSON.parse(result.stdout || '{}');
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`npm returned invalid dist-tags for ${packageName}.`);
  }
  return value;
}

function publishedReleaseBaseCommit(currentVersion) {
  const distTagsByPackage = Object.fromEntries(
    releasePackages.map((packageName) => [packageName, publishedDistTags(packageName)]),
  );
  const baseVersion = selectPublishedReleaseBase(distTagsByPackage, currentVersion);
  if (baseVersion === null) return null;
  const tag = `v${baseVersion}`;
  const revision = spawnSync('git', ['rev-parse', '--verify', `${tag}^{commit}`], {
    cwd: workspaceRoot,
    encoding: 'utf8',
  });
  if (revision.status !== 0 || !/^[0-9a-f]{40}\n?$/.test(revision.stdout)) {
    throw new Error(`Published release base ${baseVersion} has no exact Git tag ${tag}.`);
  }
  const commit = revision.stdout.trim();
  const ancestor = spawnSync('git', ['merge-base', '--is-ancestor', commit, 'HEAD'], {
    cwd: workspaceRoot,
    encoding: 'utf8',
  });
  if (ancestor.status !== 0) {
    throw new Error(`Published release base ${tag} is not an ancestor of the current release tag.`);
  }
  return commit;
}

async function readBaseLifecycle(path, ref, releaseVersion) {
  if ([path, ref, releaseVersion].filter(Boolean).length > 1) {
    throw new Error(
      'Use only one of --base-lifecycle=PATH, --base-ref=COMMIT, or --release-base-version=VERSION.',
    );
  }
  if (path) return readJson(path, 'Base lifecycle registry');
  if (releaseVersion) ref = publishedReleaseBaseCommit(releaseVersion);
  if (!ref) return null;
  if (!/^[0-9a-f]{40}$/.test(ref)) {
    throw new Error('--base-ref must be an exact 40-character Git commit SHA.');
  }
  const result = spawnSync('git', ['show', `${ref}:projects/kern/api/lifecycle.json`], {
    cwd: workspaceRoot,
    encoding: 'utf8',
    maxBuffer: 2 * 1024 * 1024,
  });
  if (result.status !== 0) {
    throw new Error(
      `Base lifecycle registry could not be read from ${ref}: ${result.stderr.trim()}`,
    );
  }
  try {
    return JSON.parse(result.stdout);
  } catch (error) {
    throw new Error(
      `Base lifecycle registry at ${ref} is invalid JSON: ${
        error instanceof Error ? error.message : error
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

function kernEntrypointFromModule(moduleName) {
  if (moduleName === '@kern-ui/angular') return '.';
  const prefix = '@kern-ui/angular/';
  return moduleName.startsWith(prefix) ? `./${moduleName.slice(prefix.length)}` : null;
}

function importBindings(sourceFile) {
  const named = new Map();
  const namespaces = new Map();
  for (const statement of sourceFile.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteralLike(statement.moduleSpecifier) ||
      !statement.importClause
    ) {
      continue;
    }
    const entrypoint = kernEntrypointFromModule(statement.moduleSpecifier.text);
    if (!entrypoint) continue;
    const bindings = statement.importClause.namedBindings;
    if (bindings && ts.isNamedImports(bindings)) {
      for (const element of bindings.elements) {
        named.set(
          element.name.text,
          `${entrypoint}:${element.propertyName?.text ?? element.name.text}`,
        );
      }
    } else if (bindings && ts.isNamespaceImport(bindings)) {
      namespaces.set(bindings.name.text, entrypoint);
    }
  }
  return { named, namespaces };
}

function isDeclarationName(identifier) {
  const parent = identifier.parent;
  return Boolean(
    parent &&
    'name' in parent &&
    parent.name === identifier &&
    !ts.isShorthandPropertyAssignment(parent),
  );
}

function declarationDependencies(rootName, declarations, exportedLocals, imports) {
  const dependencies = new Set();
  const visitedLocals = new Set();

  function visitDeclaration(localName) {
    if (visitedLocals.has(localName)) return;
    visitedLocals.add(localName);
    const declaration = declarations.get(localName);
    if (declaration) ts.forEachChild(declaration, visit);
  }

  function visit(node) {
    if (ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression)) {
      const entrypoint = imports.namespaces.get(node.expression.text);
      if (entrypoint) dependencies.add(`${entrypoint}:${node.name.text}`);
    }
    if (ts.isIdentifier(node) && !isDeclarationName(node)) {
      const imported = imports.named.get(node.text);
      if (imported) {
        dependencies.add(imported);
      } else if (node.text !== rootName && declarations.has(node.text)) {
        const exportedName = exportedLocals.get(node.text);
        if (exportedName) {
          dependencies.add(exportedName);
        } else {
          visitDeclaration(node.text);
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  visitDeclaration(rootName);
  return dependencies;
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
    const exportedKeys = new Map();
    const imports = importBindings(sourceFile);

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
          dependencies: new Set(),
          entrypoint: entrypoint.subpath,
          experimental: declaration ? hasJsDocTag(declaration, 'experimental') : false,
          kind: statement.isTypeOnly || element.isTypeOnly ? 'type' : 'value',
          localName,
          name: exportedName,
        });
        if (!exportedLocals.has(localName) || exportedName === localName) {
          exportedLocals.set(localName, key);
        }
        const keys = exportedKeys.get(localName) ?? [];
        keys.push(key);
        exportedKeys.set(localName, keys);
      }
    }

    for (const [localName, keys] of exportedKeys) {
      const dependencies = declarationDependencies(
        localName,
        declarations,
        exportedLocals,
        imports,
      );
      for (const key of keys) {
        const symbol = symbols.get(key);
        symbol.dependencies = new Set([...dependencies].filter((dependency) => dependency !== key));
      }
    }

    for (const [localName, publicSymbolKey] of exportedLocals) {
      const exportedName = publicSymbolKey.slice(publicSymbolKey.lastIndexOf(':') + 1);
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

function catalogRecordIndex(registry) {
  return new Map(
    (registry.catalogGroups ?? []).flatMap((group) =>
      (group.ids ?? []).map((id) => [
        id,
        {
          evidenceProfile: group.evidenceProfile,
          status: group.status,
        },
      ]),
    ),
  );
}

/** Detects status promotions that must be proven against the pull request or push base. */
export function lifecyclePromotionTransitions(baseLifecycle, currentLifecycle) {
  const base = catalogRecordIndex(baseLifecycle);
  const current = catalogRecordIndex(currentLifecycle);
  return [...current]
    .flatMap(([id, currentRecord]) => {
      const baseRecord = base.get(id);
      return baseRecord &&
        ['beta', 'experimental'].includes(baseRecord.status) &&
        currentRecord.status === 'stable'
        ? [
            {
              fromEvidenceProfile: baseRecord.evidenceProfile,
              fromStatus: baseRecord.status,
              id,
              toEvidenceProfile: currentRecord.evidenceProfile,
              toStatus: currentRecord.status,
            },
          ]
        : [];
    })
    .sort((left, right) => left.id.localeCompare(right.id));
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

const lifecycleMaturity = new Map([
  ['experimental', 0],
  ['beta', 1],
  ['stable', 2],
]);

export function symbolDependencyStatusIssues(discoveredSymbols, registeredSymbols) {
  const found = [];
  for (const [key, symbol] of discoveredSymbols) {
    const owner = registeredSymbols.get(key);
    const ownerMaturity = lifecycleMaturity.get(owner?.status);
    if (ownerMaturity === undefined || ownerMaturity === 0) continue;
    for (const dependencyKey of symbol.dependencies ?? []) {
      const dependency = registeredSymbols.get(dependencyKey);
      const dependencyMaturity = lifecycleMaturity.get(dependency?.status);
      if (dependencyMaturity === undefined || dependencyMaturity >= ownerMaturity) continue;
      found.push(
        `Public ${owner.status} symbol "${key}" depends on less mature ` +
          `${dependency.status} symbol "${dependencyKey}".`,
      );
    }
  }
  return found;
}

function compareSymbolDependencyStatuses(discoveredSymbols, registeredSymbols) {
  for (const issue of symbolDependencyStatusIssues(discoveredSymbols, registeredSymbols)) {
    report(issue);
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
      (symbol) => symbol.name === className && !symbol.entrypoint.startsWith('./testing'),
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

function evidenceKindsForComponent(lifecycle, componentId, profileName) {
  const kinds = new Set(lifecycle.evidenceProfiles?.[profileName]?.requiredEvidence ?? []);
  for (const riskProfile of Object.values(lifecycle.riskEvidenceProfiles ?? {})) {
    if (
      !Array.isArray(riskProfile.appliesToEvidenceProfiles) ||
      !riskProfile.appliesToEvidenceProfiles.includes(profileName)
    ) {
      continue;
    }
    const components = Object.values(riskProfile.families ?? {});
    if (components.includes(componentId)) kinds.add(riskProfile.requiredEvidence);
  }
  return [...kinds];
}

function validateRiskEvidenceProfiles(lifecycle, registeredCatalog) {
  const evidenceProfiles = new Set(Object.keys(lifecycle.evidenceProfiles ?? {}));
  const componentKinds = new Set();
  for (const [name, profile] of Object.entries(lifecycle.riskEvidenceProfiles ?? {})) {
    const label = `Risk evidence profile "${name}"`;
    if (!profile || typeof profile !== 'object') {
      report(`${label} must be an object.`);
      continue;
    }
    if (typeof profile.requiredEvidence !== 'string' || !profile.requiredEvidence.trim()) {
      report(`${label} requires requiredEvidence.`);
    }
    if (
      !Array.isArray(profile.appliesToEvidenceProfiles) ||
      profile.appliesToEvidenceProfiles.length === 0
    ) {
      report(`${label} requires appliesToEvidenceProfiles.`);
      continue;
    }
    if (
      new Set(profile.appliesToEvidenceProfiles).size !== profile.appliesToEvidenceProfiles.length
    ) {
      report(`${label} repeats an evidence profile.`);
    }
    for (const evidenceProfile of profile.appliesToEvidenceProfiles) {
      if (!evidenceProfiles.has(evidenceProfile)) {
        report(`${label} references unknown evidence profile "${evidenceProfile}".`);
      }
    }
    if (!profile.families || typeof profile.families !== 'object') {
      report(`${label} requires component families.`);
      continue;
    }
    const families = Object.entries(profile.families);
    if (families.length === 0) report(`${label} requires at least one component family.`);
    for (const [family, componentId] of families) {
      if (!family || typeof componentId !== 'string' || !componentId) {
        report(`${label} contains an invalid family mapping.`);
        continue;
      }
      const component = registeredCatalog.get(componentId);
      if (!component) {
        report(`${label} references unknown component "${componentId}".`);
        continue;
      }
      if (!profile.appliesToEvidenceProfiles.includes(component.evidenceProfile)) {
        report(
          `${label} does not apply to ${componentId}'s "${component.evidenceProfile}" profile.`,
        );
      }
      const key = `${componentId}:${profile.requiredEvidence}`;
      if (componentKinds.has(key)) report(`Risk evidence "${key}" is registered more than once.`);
      componentKinds.add(key);
    }
  }
}

function manualRecordFresh(record, maxAgeDays, now = Date.now()) {
  if (typeof record?.testedAt !== 'string' || Number.isNaN(Date.parse(record.testedAt))) {
    return false;
  }
  const testedAt = Date.parse(record.testedAt);
  const age = now - testedAt;
  return testedAt <= now && age <= maxAgeDays * 24 * 60 * 60 * 1000;
}

export function promotionManualEvidenceIssues(componentId, item, manualEvidence, now = Date.now()) {
  const found = [];
  if (manualEvidence.certification?.status !== 'certified') {
    found.push(`Promotion gate for "${componentId}" requires certified manual AT evidence.`);
  }
  const maxAgeDays = manualEvidence.policy?.promotionMaxAgeDays;
  const manualById = new Map((manualEvidence.records ?? []).map((record) => [record.id, record]));
  for (const recordId of item?.recordIds ?? []) {
    const record = manualById.get(recordId);
    if (record?.status !== 'pass') {
      found.push(
        `Promotion gate for "${componentId}" requires passing manual record "${recordId}".`,
      );
    } else if (!Number.isInteger(maxAgeDays) || !manualRecordFresh(record, maxAgeDays, now)) {
      found.push(`Promotion gate for "${componentId}" requires fresh manual record "${recordId}".`);
    }
  }
  return found;
}

async function verifyMaterializedEvidence(
  lifecycle,
  evidence,
  manualEvidence,
  registeredCatalog,
  packageManifest,
  mode,
  promotionIds,
  promotionTransitions,
) {
  if (evidence.$schema !== './lifecycle-evidence.schema.json') {
    report('Lifecycle evidence must reference ./lifecycle-evidence.schema.json.');
  }
  if (evidence.schemaVersion !== 1) {
    report('lifecycle-evidence.json schemaVersion must be 1.');
  }
  if (evidence.libraryVersion !== packageManifest.version) {
    report(
      `Lifecycle evidence version ${evidence.libraryVersion} does not match package ${packageManifest.version}.`,
    );
  }
  if (evidence.generatedBy !== 'scripts/generate-lifecycle-evidence.mjs') {
    report('Lifecycle evidence must name its deterministic generator.');
  }

  const artifactContents = new Map();
  for (const [id, artifact] of Object.entries(evidence.artifacts ?? {})) {
    const label = `Lifecycle evidence artifact "${id}"`;
    if (
      !artifact ||
      typeof artifact.path !== 'string' ||
      artifact.path.startsWith('/') ||
      artifact.path.includes('..')
    ) {
      report(`${label} requires a safe repository-relative path.`);
      continue;
    }
    const absolutePath = resolve(workspaceRoot, artifact.path);
    if (!absolutePath.startsWith(`${workspaceRoot}${sep}`) || !existsSync(absolutePath)) {
      report(`${label} points to a missing repository file.`);
      continue;
    }
    const content = await readFile(absolutePath, 'utf8');
    artifactContents.set(id, content);
    if (artifact.sha256 !== sha256(content)) {
      report(`${label} is stale because ${artifact.path} changed.`);
    }
    if (typeof artifact.anchor !== 'string' || !content.includes(artifact.anchor)) {
      report(`${label} anchor no longer resolves in ${artifact.path}.`);
    }
  }

  const records = new Map();
  if (!Array.isArray(evidence.components)) {
    report('lifecycle-evidence.json requires a components array.');
    return;
  }
  for (const [index, component] of evidence.components.entries()) {
    const label = `lifecycle evidence components[${index}]`;
    if (typeof component?.id !== 'string' || !component.id) {
      report(`${label} requires an id.`);
      continue;
    }
    if (records.has(component.id)) {
      report(`Lifecycle evidence component "${component.id}" is duplicated.`);
    }
    records.set(component.id, component);
  }

  const transitionById = new Map(
    promotionTransitions.map((transition) => [transition.id, transition]),
  );
  for (const id of promotionIds) {
    const lifecycleRecord = registeredCatalog.get(id);
    if (!lifecycleRecord) {
      report(`Lifecycle promotion gate references unknown component "${id}".`);
    } else if (
      !transitionById.has(id) &&
      !['beta', 'experimental'].includes(lifecycleRecord.status)
    ) {
      report(
        `Lifecycle promotion gate expects beta or experimental "${id}", found ${lifecycleRecord.status}.`,
      );
    }
    if (lifecycleRecord && lifecycleRecord.evidenceProfile !== 'beta-promotion') {
      report(
        `Lifecycle promotion gate requires "${id}" to retain the "beta-promotion" evidence profile until promotion is verified.`,
      );
    }
  }

  const promotionIdSet = new Set(promotionIds);
  for (const [id, lifecycleRecord] of registeredCatalog) {
    const component = records.get(id);
    if (!component) {
      report(`Lifecycle component "${id}" has no materialized evidence record.`);
      continue;
    }
    if (component.status !== lifecycleRecord.status) {
      report(`Lifecycle evidence "${id}" status differs from lifecycle.json.`);
    }
    if (component.owner !== lifecycleRecord.owner) {
      report(`Lifecycle evidence "${id}" owner differs from lifecycle.json.`);
    }
    if (component.evidenceProfile !== lifecycleRecord.evidenceProfile) {
      report(`Lifecycle evidence "${id}" profile differs from lifecycle.json.`);
    }
    if (
      typeof component.source !== 'string' ||
      component.source.startsWith('/') ||
      component.source.includes('..')
    ) {
      report(`Lifecycle evidence "${id}" requires a safe source path.`);
    } else {
      const sourcePath = resolve(workspaceRoot, component.source);
      if (!sourcePath.startsWith(`${workspaceRoot}${sep}`) || !existsSync(sourcePath)) {
        report(`Lifecycle evidence "${id}" source is missing.`);
      } else {
        const source = await readFile(sourcePath, 'utf8');
        if (component.sourceSha256 !== sha256(source)) {
          report(`Lifecycle evidence "${id}" is stale because its production source changed.`);
        }
      }
    }
    if (typeof component.symbol !== 'string' || !component.symbol) {
      report(`Lifecycle evidence "${id}" requires its canonical symbol.`);
    }

    const expectedProfile = promotionIdSet.has(id)
      ? 'beta-promotion'
      : lifecycleRecord.evidenceProfile;
    const expectedKinds = evidenceKindsForComponent(lifecycle, id, expectedProfile);
    const items = new Map();
    for (const item of component.evidence ?? []) {
      if (items.has(item.kind)) report(`Lifecycle evidence "${id}" duplicates "${item.kind}".`);
      items.set(item.kind, item);
    }
    for (const kind of expectedKinds) {
      const item = items.get(kind);
      if (!item) {
        report(`Lifecycle evidence "${id}" does not materialize required "${kind}".`);
        continue;
      }
      if (!['linked', 'pending'].includes(item.status)) {
        report(`Lifecycle evidence "${id}:${kind}" has invalid status "${item.status}".`);
      }
      if (
        item.status === 'pending' &&
        (typeof item.reason !== 'string' || item.reason.length < 10)
      ) {
        report(`Pending lifecycle evidence "${id}:${kind}" requires a reason.`);
      }
      if (kind === 'manual-at') {
        const expectedRecordIds = (manualEvidence.records ?? [])
          .filter((record) => record.required && record.componentIds?.includes(id))
          .map((record) => record.id)
          .sort();
        if (JSON.stringify(item.recordIds ?? []) !== JSON.stringify(expectedRecordIds)) {
          report(`Lifecycle evidence "${id}:manual-at" differs from the manual evidence matrix.`);
        }
      } else {
        if (
          item.status === 'linked' &&
          (!Array.isArray(item.artifactIds) || !item.artifactIds.length)
        ) {
          report(`Linked lifecycle evidence "${id}:${kind}" requires concrete artifacts.`);
        }
        for (const artifactId of item.artifactIds ?? []) {
          if (!artifactContents.has(artifactId)) {
            report(
              `Lifecycle evidence "${id}:${kind}" references unknown artifact "${artifactId}".`,
            );
          }
        }
      }
    }
    for (const kind of items.keys()) {
      if (!expectedKinds.includes(kind)) {
        report(`Lifecycle evidence "${id}" contains unexpected "${kind}".`);
      }
    }

    const apiItem = items.get('api-baseline');
    if (apiItem?.status === 'linked') {
      const apiSources = (apiItem.artifactIds ?? []).map(
        (artifactId) => artifactContents.get(artifactId) ?? '',
      );
      if (!apiSources.some((content) => content.includes(component.symbol))) {
        report(`Lifecycle evidence "${id}:api-baseline" does not contain ${component.symbol}.`);
      }
    }

    const promotionRequired = promotionIdSet.has(id);
    const strict = (mode === 'release' && lifecycleRecord.status === 'stable') || promotionRequired;
    if (strict) {
      const gate = promotionRequired ? 'promotion' : mode;
      for (const kind of expectedKinds) {
        const item = items.get(kind);
        if (item?.status !== 'linked') {
          report(`${gate} gate requires linked lifecycle evidence "${id}:${kind}".`);
        }
      }
    }

    if (promotionRequired && items.has('manual-at')) {
      for (const issue of promotionManualEvidenceIssues(
        id,
        items.get('manual-at'),
        manualEvidence,
      )) {
        report(issue);
      }
    }
  }

  for (const id of records.keys()) {
    if (!registeredCatalog.has(id)) {
      report(`Lifecycle evidence contains unknown component "${id}".`);
    }
  }
}

async function main() {
  const lifecyclePath = option('lifecycle', defaultLifecyclePath);
  const lifecycleEvidencePath = option('evidence', defaultLifecycleEvidencePath);
  const selectedManualEvidencePath = option('manual-evidence', manualEvidencePath);
  const baseLifecyclePath = option('base-lifecycle', null);
  const baseRef = valueOption('base-ref', '');
  const releaseBaseVersion = valueOption('release-base-version', '');
  const releaseAttestationPath = option('release-attestation', null);
  const deprecationsPath = option('deprecations', defaultDeprecationsPath);
  const evidenceMode = valueOption('mode', 'local');
  const requestedPromotionIds = valueOption('components', '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  if (
    releaseAttestationPath &&
    [baseLifecyclePath, baseRef, releaseBaseVersion].filter(Boolean).length > 0
  ) {
    throw new Error(
      'Use --release-attestation alone, not with --base-lifecycle, --base-ref, or --release-base-version.',
    );
  }
  const releaseAttestation = releaseAttestationPath
    ? await readJson(releaseAttestationPath, 'Lifecycle release attestation')
    : null;
  const attestedBaseRef = releaseAttestation?.base?.commit ?? '';
  if (releaseAttestationPath && attestedBaseRef && !/^[0-9a-f]{40}$/.test(attestedBaseRef)) {
    throw new Error('Lifecycle release attestation base commit must be an exact 40-character SHA.');
  }
  const [
    lifecycle,
    lifecycleEvidence,
    lifecycleEvidenceSchema,
    manualEvidence,
    deprecations,
    apiConfig,
    packageManifest,
    catalog,
    componentContracts,
    baseLifecycle,
  ] = await Promise.all([
    readJson(lifecyclePath, 'Lifecycle registry'),
    readJson(lifecycleEvidencePath, 'Per-component lifecycle evidence'),
    readJson(lifecycleEvidenceSchemaPath, 'Per-component lifecycle evidence schema'),
    readJson(selectedManualEvidencePath, 'Manual accessibility evidence'),
    readJson(deprecationsPath, 'Deprecation registry'),
    readJson(apiConfigPath, 'API entrypoint configuration'),
    readJson(packageManifestPath, 'Kern package manifest'),
    discoverCatalog(),
    discoverComponentContracts(),
    readBaseLifecycle(baseLifecyclePath, baseRef || attestedBaseRef, releaseBaseVersion),
  ]);
  const classes = new Map(
    [...componentContracts].map(([selector, contract]) => [selector, contract.className]),
  );

  if (lifecycle.schemaVersion !== 1) report('lifecycle.json schemaVersion must be 1.');
  const schemaRegistry = new angularSchema.CoreSchemaRegistry();
  const validateEvidenceSchema = await schemaRegistry.compile(lifecycleEvidenceSchema);
  const evidenceSchemaResult = await validateEvidenceSchema(lifecycleEvidence);
  if (!evidenceSchemaResult.success) {
    const details = (evidenceSchemaResult.errors ?? [])
      .map((error) => `${error.instancePath || '/'} ${error.message ?? 'is invalid'}`)
      .join('; ');
    report(`Lifecycle evidence does not satisfy its JSON Schema: ${details}`);
  }
  if (!allowedEvidenceModes.has(evidenceMode)) {
    report(`Unsupported lifecycle evidence mode "${evidenceMode}".`);
  }
  if (evidenceMode === 'release' && !releaseAttestationPath) {
    report('Release lifecycle mode requires --release-attestation=PATH.');
  }
  if (releaseAttestationPath && evidenceMode !== 'release') {
    report('--release-attestation is supported only with --mode=release.');
  }
  if (releaseAttestation) {
    for (const issue of await validateLifecycleAttestation(releaseAttestation, {
      version: packageManifest.version,
      tag: `v${packageManifest.version}`,
      commit:
        typeof releaseAttestation.candidate?.commit === 'string'
          ? releaseAttestation.candidate.commit
          : '',
    })) {
      report(issue);
    }
  }
  if (releaseAttestation && releaseAttestation.candidate?.version !== packageManifest.version) {
    report(
      'Lifecycle release attestation candidate version does not match projects/kern/package.json.',
    );
  }
  if (!lifecycle.policy || typeof lifecycle.policy !== 'object') {
    report('lifecycle.json requires a policy object.');
  }
  for (const [name, profile] of Object.entries(lifecycle.evidenceProfiles ?? {})) {
    if (!Array.isArray(profile.requiredEvidence) || profile.requiredEvidence.length === 0) {
      report(`Evidence profile "${name}" requires a non-empty requiredEvidence array.`);
    }
  }

  const registeredCatalog = flattenCatalogRegistry(lifecycle);
  const promotionTransitions = baseLifecycle
    ? lifecyclePromotionTransitions(baseLifecycle, lifecycle)
    : [];
  const promotionIds = [
    ...new Set([
      ...(evidenceMode === 'promotion' ? requestedPromotionIds : []),
      ...promotionTransitions.map(({ id }) => id),
    ]),
  ].sort();
  if (evidenceMode === 'promotion' && promotionIds.length === 0) {
    report('Lifecycle promotion mode requires --components=<catalog-id>[,<catalog-id>...].');
  }
  if (evidenceMode !== 'promotion' && requestedPromotionIds.length > 0) {
    report('--components is supported only with --mode=promotion.');
  }
  if (promotionIds.length > 0 && !lifecycle.evidenceProfiles?.['beta-promotion']) {
    report('Lifecycle promotion gate requires the beta-promotion evidence profile.');
  }
  const registeredSymbols = flattenSymbolRegistry(lifecycle);
  validateRiskEvidenceProfiles(lifecycle, registeredCatalog);
  const discoveredApi = await discoverPublicApi(apiConfig);
  compareCatalog(catalog, registeredCatalog);
  compareSymbols(discoveredApi.symbols, registeredSymbols);
  compareSymbolDependencyStatuses(discoveredApi.symbols, registeredSymbols);
  compareComponentStatuses(catalog, classes, registeredSymbols);
  await verifyMaterializedEvidence(
    lifecycle,
    lifecycleEvidence,
    manualEvidence,
    registeredCatalog,
    packageManifest,
    evidenceMode,
    promotionIds,
    promotionTransitions,
  );

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
      `${activeDeprecationCount} active deprecations, ` +
      `${lifecycleEvidence.components?.length ?? 0} component evidence records; mode=${evidenceMode}` +
      `${promotionIds.length > 0 ? `; promotion=${promotionIds.join(',')}` : ''}.`,
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
