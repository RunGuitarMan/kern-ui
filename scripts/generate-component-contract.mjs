import { readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { format, resolveConfig } from 'prettier';
import ts from 'typescript';

import { stableTypeText } from './lib/stable-type-text.mjs';

const modulePath = fileURLToPath(import.meta.url);
const workspaceRoot = resolve(dirname(modulePath), '..');
const outputPath = resolve(
  workspaceRoot,
  'projects/showcase/src/lib/generated-component-contract.ts',
);
const inventoryPath = resolve(workspaceRoot, 'projects/kern/api/component-inventory.json');
const runtimeConfigPath = resolve(workspaceRoot, 'projects/kern/api/runtime-entrypoints.json');
const lifecyclePath = resolve(workspaceRoot, 'projects/kern/api/lifecycle.json');
const deprecationsPath = resolve(workspaceRoot, 'projects/kern/api/deprecations.json');
const catalogPath = resolve(workspaceRoot, 'projects/showcase/src/lib/catalog.ts');
const catalogIndexPath = resolve(
  workspaceRoot,
  'projects/showcase/catalog-index/src/lib/catalog-index.ts',
);
const packageManifestPath = resolve(workspaceRoot, 'projects/kern/package.json');
const tsconfigPath = resolve(workspaceRoot, 'projects/kern/tsconfig.lib.json');
export function normalizeRepositoryPath(path) {
  return path.replaceAll('\\', '/');
}

async function readJson(path, label) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    throw new Error(
      `${label} could not be read at ${relative(workspaceRoot, path)}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

async function collectSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) return collectSourceFiles(path);
      if (!entry.isFile() || !entry.name.endsWith('.ts') || entry.name.endsWith('.spec.ts')) {
        return [];
      }
      return [path];
    }),
  );

  return nested.flat().sort();
}

function propertyName(node, sourceFile) {
  if (!node) return '';
  if (ts.isIdentifier(node) || ts.isStringLiteralLike(node)) return node.text;
  return node.getText(sourceFile);
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

function variableInitializer(sourceFile, name) {
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (propertyName(declaration.name, sourceFile) === name) {
        return unwrapExpression(declaration.initializer);
      }
    }
  }
  return undefined;
}

function stringArray(node, sourceFile, label) {
  const value = unwrapExpression(node);
  if (!value || !ts.isArrayLiteralExpression(value)) {
    throw new Error(`${label} must remain an array literal.`);
  }
  return value.elements.map((element) => {
    const item = unwrapExpression(element);
    if (!item || !ts.isStringLiteralLike(item)) {
      throw new Error(`${label} may contain only string literals.`);
    }
    return item.text;
  });
}

function stringRecord(node, sourceFile, label) {
  const value = unwrapExpression(node);
  if (!value || !ts.isObjectLiteralExpression(value)) {
    throw new Error(`${label} must remain an object literal.`);
  }
  const record = new Map();
  for (const property of value.properties) {
    if (!ts.isPropertyAssignment(property)) {
      throw new Error(`${label} may contain only property assignments.`);
    }
    const key = propertyName(property.name, sourceFile);
    const entry = unwrapExpression(property.initializer);
    if (!key || !entry || !ts.isStringLiteralLike(entry)) {
      throw new Error(`${label} values must remain string literals.`);
    }
    record.set(key, entry.text);
  }
  return record;
}

const STRUCTURAL_CATALOG_FIELDS = new Set([
  'id',
  'name',
  'category',
  'selector',
  'variantOf',
  'status',
  'api',
]);

function validateCatalogOverrides(sourceFile, catalogIds) {
  const overrides = variableInitializer(sourceFile, 'COMPONENT_OVERRIDES');
  if (!overrides) return;
  if (!ts.isObjectLiteralExpression(overrides)) {
    throw new Error('Catalog COMPONENT_OVERRIDES must remain an object literal.');
  }
  for (const property of overrides.properties) {
    if (!ts.isPropertyAssignment(property)) {
      throw new Error('Catalog COMPONENT_OVERRIDES may contain only property assignments.');
    }
    const id = propertyName(property.name, sourceFile);
    if (!catalogIds.has(id)) {
      throw new Error(`Catalog COMPONENT_OVERRIDES references unknown catalog id "${id}".`);
    }
    const override = unwrapExpression(property.initializer);
    if (!override || !ts.isObjectLiteralExpression(override)) {
      throw new Error(`Catalog COMPONENT_OVERRIDES.${id} must remain an object literal.`);
    }
    for (const field of override.properties) {
      if (!ts.isPropertyAssignment(field)) {
        throw new Error(
          `Catalog COMPONENT_OVERRIDES.${id} may contain only documentation property assignments.`,
        );
      }
      const name = propertyName(field.name, sourceFile);
      if (STRUCTURAL_CATALOG_FIELDS.has(name)) {
        throw new Error(
          `Catalog COMPONENT_OVERRIDES.${id} cannot override structural field "${name}".`,
        );
      }
    }
  }
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function extractCatalogFromSource(sourceText, sourcePath = catalogPath) {
  const sourceFile = ts.createSourceFile(
    sourcePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const groups = variableInitializer(sourceFile, 'GROUPS');
  if (!groups || !ts.isObjectLiteralExpression(groups)) {
    throw new Error('Catalog GROUPS must remain an object literal.');
  }
  const variants = stringRecord(
    variableInitializer(sourceFile, 'VARIANT_OF'),
    sourceFile,
    'Catalog VARIANT_OF',
  );
  const selectors = stringRecord(
    variableInitializer(sourceFile, 'SELECTOR_BY_ID'),
    sourceFile,
    'Catalog SELECTOR_BY_ID',
  );
  const items = [];

  for (const property of groups.properties) {
    if (!ts.isPropertyAssignment(property)) {
      throw new Error('Catalog GROUPS may contain only property assignments.');
    }
    const category = propertyName(property.name, sourceFile);
    for (const name of stringArray(property.initializer, sourceFile, `GROUPS.${category}`)) {
      const id = slugify(name);
      items.push({
        id,
        name,
        category,
        selector: selectors.get(id) ?? `krn-${id}`,
        variantOf: variants.get(id) ?? null,
        order: items.length,
      });
    }
  }

  const ids = new Set(items.map((item) => item.id));
  for (const [id, target] of variants) {
    if (!ids.has(id) || !ids.has(target) || id === target) {
      throw new Error(
        `Catalog VARIANT_OF entry "${id}" must reference a different existing catalog id.`,
      );
    }
  }
  for (const [id, selector] of selectors) {
    if (!ids.has(id) || selector.trim().length === 0) {
      throw new Error(
        `Catalog SELECTOR_BY_ID entry "${id}" must provide a selector for an existing catalog id.`,
      );
    }
  }
  validateCatalogOverrides(sourceFile, ids);

  return items;
}

async function extractCatalog() {
  const [indexSource, catalogSource] = await Promise.all([
    readFile(catalogIndexPath, 'utf8'),
    readFile(catalogPath, 'utf8'),
  ]);
  return extractCatalogFromSource(`${indexSource}\n${catalogSource}`, catalogPath);
}

function objectProperty(object, name, sourceFile) {
  if (!object || !ts.isObjectLiteralExpression(object)) return undefined;
  return object.properties.find(
    (property) =>
      ts.isPropertyAssignment(property) && propertyName(property.name, sourceFile) === name,
  );
}

function publicAlias(options, sourceFile) {
  const alias = objectProperty(options, 'alias', sourceFile);
  return alias && ts.isPropertyAssignment(alias) && ts.isStringLiteralLike(alias.initializer)
    ? alias.initializer.text
    : undefined;
}

function callKind(initializer) {
  if (!ts.isCallExpression(initializer)) return undefined;
  const expression = initializer.expression;
  if (ts.isIdentifier(expression) && ['input', 'model', 'output'].includes(expression.text)) {
    return { kind: expression.text, required: false };
  }
  if (
    ts.isPropertyAccessExpression(expression) &&
    ts.isIdentifier(expression.expression) &&
    expression.expression.text === 'input' &&
    expression.name.text === 'required'
  ) {
    return { kind: 'input', required: true };
  }
  return undefined;
}

function signalValueType(checker, call, location) {
  const signalType = checker.getTypeAtLocation(call);
  let typeArguments = [];
  if (signalType.aliasTypeArguments?.length) {
    typeArguments = signalType.aliasTypeArguments;
  } else if (signalType.objectFlags & ts.ObjectFlags.Reference) {
    typeArguments = checker.getTypeArguments(signalType);
  }
  const valueType = typeArguments[0];
  if (valueType) {
    return stableTypeText(checker, valueType, location);
  }
  const rendered = stableTypeText(checker, signalType, location);
  const match = rendered.match(
    /^(?:InputSignal(?:WithTransform)?|ModelSignal|OutputEmitterRef)<(.+?)(?:, .+)?>$/,
  );
  return match?.[1] ?? rendered;
}

function defaultValue(call, required, sourceFile) {
  if (required) return 'required';
  const value = call.arguments[0];
  return value ? value.getText(sourceFile) : 'undefined';
}

function signalContract(checker, member, sourceFile) {
  if (!ts.isPropertyDeclaration(member) || !member.initializer || !member.name) return undefined;
  const modifiers = ts.canHaveModifiers(member) ? (ts.getModifiers(member) ?? []) : [];
  if (
    modifiers.some(
      (modifier) =>
        modifier.kind === ts.SyntaxKind.ProtectedKeyword ||
        modifier.kind === ts.SyntaxKind.PrivateKeyword,
    )
  ) {
    return undefined;
  }
  const match = callKind(member.initializer);
  if (!match) return undefined;

  const call = member.initializer;
  const options = match.required ? call.arguments[0] : call.arguments[1];
  const memberName = propertyName(member.name, sourceFile);

  return {
    name: publicAlias(options, sourceFile) ?? memberName,
    property: memberName,
    kind: match.kind,
    type: signalValueType(checker, call, member),
    required: match.required,
    defaultValue: defaultValue(call, match.required, sourceFile),
  };
}

function decoratorMetadata(node) {
  if (!ts.canHaveDecorators(node)) return undefined;
  for (const decorator of ts.getDecorators(node) ?? []) {
    if (!ts.isCallExpression(decorator.expression)) continue;
    const call = decorator.expression;
    if (!ts.isIdentifier(call.expression)) continue;
    if (!['Component', 'Directive'].includes(call.expression.text)) continue;
    const metadata = call.arguments[0];
    if (metadata && ts.isObjectLiteralExpression(metadata)) {
      return { kind: call.expression.text.toLowerCase(), metadata };
    }
  }
  return undefined;
}

function internalReviewWith(node) {
  const tags = ts.getJSDocTags(node).filter((tag) => tag.tagName.text === 'internalReviewWith');
  if (tags.length === 0) return null;
  if (tags.length !== 1 || typeof tags[0].comment !== 'string') {
    throw new Error(
      `${node.name?.getText() ?? 'Decorated class'} must declare exactly one @internalReviewWith review unit.`,
    );
  }
  const reviewUnit = tags[0].comment.trim();
  if (!/^[a-z0-9-]+:Krn[A-Za-z0-9]+$/.test(reviewUnit)) {
    throw new Error(
      `${node.name?.getText() ?? 'Decorated class'} has invalid @internalReviewWith "${reviewUnit}".`,
    );
  }
  return reviewUnit;
}

function selectorsFrom(metadata, sourceFile) {
  const selector = objectProperty(metadata, 'selector', sourceFile);
  if (
    !selector ||
    !ts.isPropertyAssignment(selector) ||
    !ts.isStringLiteralLike(selector.initializer)
  ) {
    return [];
  }

  return selector.initializer.text
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

async function extractContracts(runtimeConfig) {
  const sourceRoots = runtimeConfig.entrypoints.map((entrypoint) =>
    resolve(workspaceRoot, entrypoint.sourceRoot),
  );
  const files = (await Promise.all(sourceRoots.map((sourceRoot) => collectSourceFiles(sourceRoot))))
    .flat()
    .sort();
  const loaded = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
  if (loaded.error) {
    throw new Error(ts.flattenDiagnosticMessageText(loaded.error.messageText, '\n'));
  }
  const parsed = ts.parseJsonConfigFileContent(loaded.config, ts.sys, dirname(tsconfigPath), {
    noEmit: true,
    skipLibCheck: true,
  });
  const program = ts.createProgram({
    rootNames: files,
    options: parsed.options,
  });
  const diagnostics = ts
    .getPreEmitDiagnostics(program)
    .filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error);
  if (diagnostics.length > 0) {
    throw new Error(
      `Cannot generate the runtime component contract from an invalid program:\n${ts.formatDiagnosticsWithColorAndContext(
        diagnostics.slice(0, 20),
        {
          getCurrentDirectory: () => workspaceRoot,
          getCanonicalFileName: (path) => path,
          getNewLine: () => '\n',
        },
      )}`,
    );
  }
  const checker = program.getTypeChecker();
  const classes = [];

  for (const path of files) {
    const sourceFile = program.getSourceFile(path);
    if (!sourceFile) {
      throw new Error(`TypeScript program omitted ${relative(workspaceRoot, path)}.`);
    }

    for (const statement of sourceFile.statements) {
      if (!ts.isClassDeclaration(statement) || !statement.name) continue;
      const symbol = checker.getSymbolAtLocation(statement.name);
      if (!symbol) {
        throw new Error(
          `TypeScript omitted the class symbol for ${relative(workspaceRoot, path)}#${
            statement.name.text
          }.`,
        );
      }
      const decorated = decoratorMetadata(statement);
      const ownApi = statement.members
        .map((member) => signalContract(checker, member, sourceFile))
        .filter(Boolean);
      const extendsClause = statement.heritageClauses?.find(
        (clause) => clause.token === ts.SyntaxKind.ExtendsKeyword,
      );
      const baseName = extendsClause?.types[0]?.expression.getText(sourceFile);

      classes.push({
        name: statement.name.text,
        source: normalizeRepositoryPath(relative(workspaceRoot, path)),
        decorated,
        selectors: decorated ? selectorsFrom(decorated.metadata, sourceFile) : [],
        internalReviewWith: decorated ? internalReviewWith(statement) : null,
        baseName,
        ownApi,
        symbol,
      });
    }
  }

  const byName = new Map(classes.map((definition) => [definition.name, definition]));
  const resolved = new Map();

  function resolveApi(definition, stack = new Set()) {
    const cached = resolved.get(definition.name);
    if (cached) return cached;
    if (stack.has(definition.name)) {
      throw new Error(`Circular class inheritance while resolving ${definition.name}`);
    }

    const nextStack = new Set(stack).add(definition.name);
    const base = definition.baseName ? byName.get(definition.baseName) : undefined;
    const rows = [...(base ? resolveApi(base, nextStack) : []), ...definition.ownApi];
    const unique = new Map(rows.map((row) => [`${row.kind}:${row.name}`, row]));
    const api = [...unique.values()].sort((left, right) =>
      `${left.kind}:${left.name}`.localeCompare(`${right.kind}:${right.name}`),
    );
    resolved.set(definition.name, api);
    return api;
  }

  const contracts = [];

  for (const definition of classes) {
    if (!definition.decorated) continue;
    for (const selector of definition.selectors) {
      contracts.push({
        selector,
        className: definition.name,
        kind: definition.decorated.kind,
        source: definition.source,
        api: resolveApi(definition),
      });
    }
  }

  return {
    checker,
    classes,
    contracts: contracts.sort((left, right) => left.selector.localeCompare(right.selector)),
    program,
  };
}

function quote(value) {
  return JSON.stringify(value);
}

function render(contracts) {
  const entries = contracts
    .map((contract) => {
      const api = contract.api
        .map(
          (row) => `      {
        name: ${quote(row.name)},
        property: ${quote(row.property)},
        kind: ${quote(row.kind)},
        type: ${quote(row.type)},
        required: ${row.required},
        defaultValue: ${quote(row.defaultValue)},
      },`,
        )
        .join('\n');

      return `  ${quote(contract.selector)}: {
    className: ${quote(contract.className)},
    kind: ${quote(contract.kind)},
    source: ${quote(contract.source)},
    api: [
${api}
    ],
  },`;
    })
    .join('\n');

  return `/*
 * Generated by scripts/generate-component-contract.mjs.
 * Do not edit by hand; run \`npm run contracts:write\`.
 */

export type KernRuntimeApiKind = 'input' | 'model' | 'output';

export interface KernRuntimeApiRow {
  readonly name: string;
  readonly property: string;
  readonly kind: KernRuntimeApiKind;
  readonly type: string;
  readonly required: boolean;
  readonly defaultValue: string;
}

export interface KernRuntimeComponentContract {
  readonly className: string;
  readonly kind: 'component' | 'directive';
  readonly source: string;
  readonly api: readonly KernRuntimeApiRow[];
}

export const KERN_RUNTIME_COMPONENTS = {
${entries}
} as const satisfies Readonly<Record<string, KernRuntimeComponentContract>>;
`;
}

function classKey(definition) {
  return `${definition.source}#${definition.name}`;
}

function importPathFor(packageName, subpath) {
  return subpath === '.' ? packageName : `${packageName}/${subpath.replace(/^[.][/]/, '')}`;
}

function resolveOwnership(source, runtimeConfig) {
  const matches = [];
  for (const entrypoint of runtimeConfig.entrypoints) {
    const sourcePrefix = `${entrypoint.sourceRoot}/`;
    if (!source.startsWith(sourcePrefix)) continue;
    const ownedPath = source.slice(sourcePrefix.length);
    for (const owner of entrypoint.owns) {
      if (ownedPath === owner || ownedPath.startsWith(`${owner}/`)) {
        matches.push({ entrypoint, owner });
      }
    }
  }
  if (matches.length !== 1) {
    throw new Error(
      `${source} must have exactly one runtime owner, found ${matches.length}. ` +
        'Update projects/kern/api/runtime-entrypoints.json.',
    );
  }
  const match = matches[0];
  const family = match.owner
    .replace(/^lib[/]/, '')
    .replace(/[.]ts$/, '')
    .split('/')[0];
  return { entrypoint: match.entrypoint, family };
}

function hasModifier(node, kind) {
  return (
    ts.canHaveModifiers(node) && (ts.getModifiers(node) ?? []).some((item) => item.kind === kind)
  );
}

function addBindingNames(name, names) {
  if (ts.isIdentifier(name)) {
    names.add(name.text);
    return;
  }
  for (const element of name.elements) {
    if (!ts.isOmittedExpression(element)) addBindingNames(element.name, names);
  }
}

function moduleSourceFile(checker, moduleSpecifier) {
  const moduleSymbol = checker.getSymbolAtLocation(moduleSpecifier);
  if (!moduleSymbol) return undefined;
  const target =
    moduleSymbol.flags & ts.SymbolFlags.Alias
      ? checker.getAliasedSymbol(moduleSymbol)
      : moduleSymbol;
  if (target.valueDeclaration && ts.isSourceFile(target.valueDeclaration)) {
    return target.valueDeclaration;
  }
  return target.declarations?.find((declaration) => ts.isSourceFile(declaration));
}

function hasTypeOnlyImportOrigin(symbol, checker, seen = new Set()) {
  if (seen.has(symbol)) return false;
  seen.add(symbol);
  if (
    (symbol.declarations ?? []).some((declaration) => ts.isTypeOnlyImportDeclaration(declaration))
  ) {
    return true;
  }
  if (!(symbol.flags & ts.SymbolFlags.Alias)) return false;
  const immediate = checker.getImmediateAliasedSymbol(symbol);
  return immediate ? hasTypeOnlyImportOrigin(immediate, checker, seen) : false;
}

const runtimeExportCaches = new WeakMap();

export function runtimeValueExportNames(sourceFile, checker) {
  let cache = runtimeExportCaches.get(checker);
  if (!cache) {
    cache = new Map();
    runtimeExportCaches.set(checker, cache);
  }
  const cached = cache.get(sourceFile.fileName);
  if (cached) return cached;

  const names = new Set();
  cache.set(sourceFile.fileName, names);

  for (const statement of sourceFile.statements) {
    if (ts.isExportDeclaration(statement)) {
      if (statement.isTypeOnly) continue;
      const targetSource = statement.moduleSpecifier
        ? moduleSourceFile(checker, statement.moduleSpecifier)
        : undefined;
      const targetNames = targetSource ? runtimeValueExportNames(targetSource, checker) : undefined;

      if (!statement.exportClause) {
        for (const name of targetNames ?? []) {
          if (name !== 'default') names.add(name);
        }
        continue;
      }
      if (ts.isNamespaceExport(statement.exportClause)) {
        names.add(statement.exportClause.name.text);
        continue;
      }
      for (const element of statement.exportClause.elements) {
        if (element.isTypeOnly) continue;
        const importedName = (element.propertyName ?? element.name).text;
        if (targetNames) {
          if (targetNames.has(importedName)) names.add(element.name.text);
          continue;
        }
        const localTarget =
          checker.getExportSpecifierLocalTargetSymbol(element) ??
          checker.getSymbolAtLocation(element.propertyName ?? element.name);
        if (!localTarget) continue;
        if (hasTypeOnlyImportOrigin(localTarget, checker)) continue;
        const resolved =
          localTarget.flags & ts.SymbolFlags.Alias
            ? checker.getAliasedSymbol(localTarget)
            : localTarget;
        if (resolved.flags & ts.SymbolFlags.Value) names.add(element.name.text);
      }
      continue;
    }

    if (ts.isExportAssignment(statement)) {
      if (!statement.isExportEquals) names.add('default');
      continue;
    }

    if (!hasModifier(statement, ts.SyntaxKind.ExportKeyword)) continue;
    const exportedName = hasModifier(statement, ts.SyntaxKind.DefaultKeyword)
      ? 'default'
      : statement.name?.text;
    if (exportedName) {
      names.add(exportedName);
    } else if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        addBindingNames(declaration.name, names);
      }
    }
  }

  return names;
}

export function isRuntimeValueExport(symbol, checker, sourceFile) {
  if (sourceFile && !runtimeValueExportNames(sourceFile, checker).has(symbol.getName())) {
    return false;
  }
  const declarations = symbol.declarations ?? [];
  if (
    declarations.length > 0 &&
    declarations.every((declaration) => ts.isTypeOnlyExportDeclaration(declaration))
  ) {
    return false;
  }
  const target = symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
  return Boolean(target.flags & ts.SymbolFlags.Value);
}

export function exportedClasses(model, runtimeConfig) {
  const definitionsBySymbol = new Map(
    model.classes.map((definition) => [definition.symbol, definition]),
  );
  const definitionsByKey = new Map(
    model.classes.map((definition) => [classKey(definition), definition]),
  );
  const exportsByClass = new Map();

  const definitionFor = (symbol) => {
    const direct = definitionsBySymbol.get(symbol);
    if (direct) return direct;
    for (const declaration of symbol.declarations ?? []) {
      if (!ts.isClassDeclaration(declaration) || !declaration.name) continue;
      const source = normalizeRepositoryPath(
        relative(workspaceRoot, declaration.getSourceFile().fileName),
      );
      const definition = definitionsByKey.get(`${source}#${declaration.name.text}`);
      if (definition) return definition;
    }
    return undefined;
  };

  for (const entrypoint of runtimeConfig.entrypoints) {
    const publicApiPath = resolve(workspaceRoot, entrypoint.publicApi);
    const sourceFile = model.program.getSourceFile(publicApiPath);
    if (!sourceFile) {
      throw new Error(`TypeScript program omitted ${entrypoint.publicApi}.`);
    }
    const moduleSymbol = model.checker.getSymbolAtLocation(sourceFile) ?? sourceFile.symbol;
    if (!moduleSymbol) {
      throw new Error(`TypeScript omitted the module symbol for ${entrypoint.publicApi}.`);
    }

    for (const exported of model.checker.getExportsOfModule(moduleSymbol)) {
      if (!isRuntimeValueExport(exported, model.checker, sourceFile)) continue;
      const target =
        exported.flags & ts.SymbolFlags.Alias ? model.checker.getAliasedSymbol(exported) : exported;
      const definition = definitionFor(target);
      if (!definition?.decorated || definition.selectors.length === 0) continue;
      const key = classKey(definition);
      const records = exportsByClass.get(key) ?? [];
      records.push({
        entrypoint: entrypoint.name,
        importPath: importPathFor(runtimeConfig.packageName, entrypoint.subpath),
        name: exported.getName(),
        subpath: entrypoint.subpath,
      });
      exportsByClass.set(key, records);
    }
  }

  return exportsByClass;
}

function lifecycleMaps(lifecycle) {
  const catalog = new Map();
  const symbols = new Map();

  for (const group of lifecycle.catalogGroups ?? []) {
    for (const id of group.ids ?? []) {
      if (catalog.has(id)) {
        throw new Error(`Lifecycle catalog id "${id}" is registered more than once.`);
      }
      catalog.set(id, {
        category: group.category,
        evidenceProfile: group.evidenceProfile,
        owner: group.owner,
        status: group.status,
      });
    }
  }

  for (const group of lifecycle.symbolGroups ?? []) {
    for (const name of group.symbols ?? []) {
      const key = `${group.entrypoint}:${name}`;
      if (symbols.has(key)) {
        throw new Error(`Lifecycle public symbol "${key}" is registered more than once.`);
      }
      symbols.set(key, {
        owner: group.owner,
        status: group.status,
      });
    }
  }

  return { catalog, symbols };
}

function canonicalFirst(values, canonical) {
  return [...new Set(values)].sort((left, right) => {
    if (left === canonical) return -1;
    if (right === canonical) return 1;
    return left.localeCompare(right);
  });
}

function buildInventory(model, runtimeConfig, catalog, lifecycle, deprecations, packageManifest) {
  const contractsBySelector = new Map();
  for (const contract of model.contracts) {
    if (contractsBySelector.has(contract.selector)) {
      throw new Error(`Runtime selector "${contract.selector}" is declared more than once.`);
    }
    contractsBySelector.set(contract.selector, contract);
  }

  const catalogByClass = new Map();
  for (const item of catalog) {
    const contract = contractsBySelector.get(item.selector);
    if (!contract) {
      throw new Error(`Catalog selector "${item.selector}" has no runtime component contract.`);
    }
    const key = `${contract.source}#${contract.className}`;
    const items = catalogByClass.get(key) ?? [];
    items.push(item);
    catalogByClass.set(key, items);
  }

  const exportsByClass = exportedClasses(model, runtimeConfig);
  const registered = lifecycleMaps(lifecycle);
  const activeSelectorDeprecations = (deprecations.entries ?? []).filter(
    (entry) => entry.kind === 'selector' && entry.status === 'active',
  );
  const consumedSelectorDeprecations = new Set();
  const entrypointOrder = new Map(
    runtimeConfig.entrypoints.map((entrypoint, index) => [entrypoint.name, index]),
  );
  const units = model.classes
    .filter((definition) => definition.decorated && definition.selectors.length > 0)
    .map((definition) => {
      const key = classKey(definition);
      const ownership = resolveOwnership(definition.source, runtimeConfig);
      const classExports = exportsByClass.get(key) ?? [];
      const exportEntrypoints = new Set(classExports.map((record) => record.entrypoint));
      if (exportEntrypoints.size > 1) {
        throw new Error(
          `${definition.name} is exported from multiple direct entrypoints: ${[
            ...exportEntrypoints,
          ].join(', ')}.`,
        );
      }
      if (exportEntrypoints.size === 1 && !exportEntrypoints.has(ownership.entrypoint.name)) {
        throw new Error(
          `${definition.name} is owned by ${ownership.entrypoint.name} but exported from ${[
            ...exportEntrypoints,
          ].join(', ')}.`,
        );
      }

      const publicSymbols = canonicalFirst(
        classExports.map((record) => record.name),
        definition.name,
      );
      const selectorDeprecations = activeSelectorDeprecations
        .filter(
          (entry) =>
            entry.entrypoint === ownership.entrypoint.subpath &&
            publicSymbols.includes(entry.symbol) &&
            definition.selectors.includes(entry.selector),
        )
        .map((entry) => {
          if (consumedSelectorDeprecations.has(entry.id)) {
            throw new Error(`Selector deprecation "${entry.id}" belongs to more than one unit.`);
          }
          consumedSelectorDeprecations.add(entry.id);
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
        })
        .sort((left, right) => left.selector.localeCompare(right.selector));
      const lifecycleRows = publicSymbols.map((name) => {
        const row = registered.symbols.get(`${ownership.entrypoint.subpath}:${name}`);
        if (!row) {
          throw new Error(
            `Public component symbol "${ownership.entrypoint.subpath}:${name}" has no lifecycle registration.`,
          );
        }
        return row;
      });
      const lifecycleStatuses = new Set(lifecycleRows.map((row) => row.status));
      const lifecycleOwners = new Set(lifecycleRows.map((row) => row.owner));
      if (lifecycleStatuses.size > 1 || lifecycleOwners.size > 1) {
        throw new Error(
          `${definition.name} public aliases must share one lifecycle status and owner.`,
        );
      }

      const catalogItems = (catalogByClass.get(key) ?? []).map((item) => {
        const row = registered.catalog.get(item.id);
        if (!row) {
          throw new Error(`Catalog entry "${item.id}" has no lifecycle registration.`);
        }
        if (row.category !== item.category) {
          throw new Error(
            `Catalog entry "${item.id}" is ${item.category}, lifecycle has ${row.category}.`,
          );
        }
        if (lifecycleStatuses.size === 1 && row.status !== lifecycleRows[0].status) {
          throw new Error(
            `Catalog entry "${item.id}" is ${row.status}, but ${definition.name} is ${lifecycleRows[0].status}.`,
          );
        }
        return {
          id: item.id,
          name: item.name,
          category: item.category,
          selector: item.selector,
          variantOf: item.variantOf,
          status: row.status,
          owner: row.owner,
          evidenceProfile: row.evidenceProfile,
          order: item.order,
        };
      });
      if (catalogItems.length > 0 && publicSymbols.length === 0) {
        throw new Error(
          `Catalog implementation ${definition.name} is not exported from a direct runtime entrypoint.`,
        );
      }

      const canonicalCatalogItems = catalogItems.filter((item) => item.variantOf === null);
      if (catalogItems.length > 0 && canonicalCatalogItems.length !== 1) {
        throw new Error(
          `${definition.name} must own exactly one canonical catalog id, found ${canonicalCatalogItems.length}.`,
        );
      }
      const canonicalCatalog = canonicalCatalogItems[0] ?? null;
      for (const item of catalogItems) {
        if (item.variantOf !== null && item.variantOf !== canonicalCatalog?.id) {
          throw new Error(
            `Catalog alias "${item.id}" must reference canonical id "${canonicalCatalog?.id}".`,
          );
        }
      }
      const canonicalSelector = canonicalCatalog?.selector ?? [...definition.selectors].sort()[0];
      const visibility = publicSymbols.length > 0 ? 'public' : 'internal';
      const role =
        catalogItems.length > 0 ? 'catalog' : visibility === 'public' ? 'supporting' : 'internal';
      if (visibility === 'public' && definition.internalReviewWith !== null) {
        throw new Error(
          `Public review unit ${ownership.entrypoint.name}:${definition.name} cannot declare @internalReviewWith.`,
        );
      }
      if (visibility === 'internal' && definition.internalReviewWith === null) {
        throw new Error(
          `Internal review unit ${ownership.entrypoint.name}:${definition.name} requires @internalReviewWith.`,
        );
      }
      const selectors = canonicalFirst(definition.selectors, canonicalSelector);
      const canonicalPublicSymbol = publicSymbols.includes(definition.name)
        ? definition.name
        : (publicSymbols[0] ?? null);

      return {
        reviewUnit: `${ownership.entrypoint.name}:${definition.name}`,
        symbol: definition.name,
        kind: definition.decorated.kind,
        entrypoint: ownership.entrypoint.name,
        importPath:
          visibility === 'public'
            ? importPathFor(runtimeConfig.packageName, ownership.entrypoint.subpath)
            : null,
        family: ownership.family,
        source: definition.source,
        visibility,
        role,
        reviewWith: definition.internalReviewWith,
        lifecycle:
          visibility === 'public'
            ? {
                status: lifecycleRows[0].status,
                owner: lifecycleRows[0].owner,
              }
            : null,
        canonicalPublicSymbol,
        canonicalSelector,
        publicSymbols,
        selectors,
        selectorDeprecations,
        catalog: catalogItems.map(({ order: _order, ...item }) => item),
        aliases: {
          symbols: publicSymbols.filter((name) => name !== canonicalPublicSymbol),
          selectors: selectors.filter((selector) => selector !== canonicalSelector),
          catalogIds: catalogItems
            .map((item) => item.id)
            .filter((id) => id !== canonicalCatalog?.id),
        },
        order: {
          entrypoint: entrypointOrder.get(ownership.entrypoint.name),
          catalog: Math.min(...catalogItems.map((item) => item.order), Number.MAX_SAFE_INTEGER),
        },
      };
    })
    .sort(
      (left, right) =>
        left.order.entrypoint - right.order.entrypoint ||
        left.family.localeCompare(right.family) ||
        left.order.catalog - right.order.catalog ||
        left.source.localeCompare(right.source) ||
        left.symbol.localeCompare(right.symbol),
    )
    .map(({ order: _order, ...unit }) => unit);

  for (const entry of activeSelectorDeprecations) {
    if (!consumedSelectorDeprecations.has(entry.id)) {
      throw new Error(
        `Active selector deprecation "${entry.id}" does not resolve to its public runtime selector.`,
      );
    }
  }

  const unitsByReviewUnit = new Map(units.map((unit) => [unit.reviewUnit, unit]));
  if (unitsByReviewUnit.size !== units.length) {
    throw new Error('Generated component inventory contains duplicate review units.');
  }
  for (const unit of units) {
    if (unit.visibility !== 'internal') continue;
    const target = unitsByReviewUnit.get(unit.reviewWith);
    if (!target) {
      throw new Error(
        `Internal review unit ${unit.reviewUnit} references missing ${unit.reviewWith}.`,
      );
    }
    if (target.visibility !== 'public') {
      throw new Error(
        `Internal review unit ${unit.reviewUnit} must review with a public review unit.`,
      );
    }
    if (target.entrypoint !== unit.entrypoint || target.family !== unit.family) {
      throw new Error(
        `Internal review unit ${unit.reviewUnit} must review with a public unit in the same entrypoint and behavior family.`,
      );
    }
  }

  const publicUnits = units.filter((unit) => unit.visibility === 'public');
  const catalogUnits = units.filter((unit) => unit.role === 'catalog');
  const supportingUnits = units.filter((unit) => unit.role === 'supporting');
  const internalUnits = units.filter((unit) => unit.role === 'internal');

  return {
    $schema: normalizeRepositoryPath('./component-inventory.schema.json'),
    schemaVersion: '1.1.0',
    library: {
      name: packageManifest.name,
      version: packageManifest.version,
    },
    generatedBy: normalizeRepositoryPath('scripts/generate-component-contract.mjs'),
    generatedFrom: [
      'projects/kern/*/src',
      'projects/kern/api/runtime-entrypoints.json',
      'projects/kern/api/lifecycle.json',
      'projects/kern/api/deprecations.json',
      'projects/showcase/src/lib/catalog.ts',
    ].map(normalizeRepositoryPath),
    summary: {
      selectorCount: model.contracts.length,
      implementationCount: units.length,
      componentCount: units.filter((unit) => unit.kind === 'component').length,
      directiveCount: units.filter((unit) => unit.kind === 'directive').length,
      catalogEntryCount: catalog.length,
      catalogReviewUnitCount: catalogUnits.length,
      catalogAliasEntryCount: catalog.length - catalogUnits.length,
      publicReviewUnitCount: publicUnits.length,
      supportingReviewUnitCount: supportingUnits.length,
      internalImplementationCount: internalUnits.length,
      selectorAliasCount: model.contracts.length - units.length,
    },
    units,
  };
}

async function writeOrCheck(path, generated, label, writeMode) {
  if (writeMode) {
    await writeFile(path, generated, 'utf8');
    console.log(`Wrote ${relative(workspaceRoot, path)}`);
    return;
  }

  let existing = '';
  try {
    existing = await readFile(path, 'utf8');
  } catch {
    // A missing generated file is reported by the comparison below.
  }

  if (existing !== generated) {
    console.error(`${label} is stale. Run \`npm run contracts:write\` and commit the result.`);
    process.exitCode = 1;
  } else {
    console.log(`${label} is current.`);
  }
}

async function main() {
  const writeMode = process.argv.includes('--write');
  const [runtimeConfig, catalog, lifecycle, deprecations, packageManifest] = await Promise.all([
    readJson(runtimeConfigPath, 'Runtime entrypoint configuration'),
    extractCatalog(),
    readJson(lifecyclePath, 'Lifecycle registry'),
    readJson(deprecationsPath, 'Deprecation registry'),
    readJson(packageManifestPath, 'Kern package manifest'),
  ]);
  const model = await extractContracts(runtimeConfig);
  const prettierConfig = (await resolveConfig(outputPath)) ?? {};
  const generatedContract = await format(render(model.contracts), {
    ...prettierConfig,
    filepath: outputPath,
  });
  const generatedInventory = await format(
    JSON.stringify(
      buildInventory(model, runtimeConfig, catalog, lifecycle, deprecations, packageManifest),
      null,
      2,
    ),
    {
      ...prettierConfig,
      filepath: inventoryPath,
    },
  );

  await Promise.all([
    writeOrCheck(outputPath, generatedContract, 'Component contract', writeMode),
    writeOrCheck(inventoryPath, generatedInventory, 'Component inventory', writeMode),
  ]);
}

if (process.argv[1] && resolve(process.argv[1]) === modulePath) {
  await main();
}
