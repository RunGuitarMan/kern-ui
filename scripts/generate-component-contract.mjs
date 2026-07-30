import { readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { format, resolveConfig } from 'prettier';
import ts from 'typescript';

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoots = [
  'projects/kern/cdk/src',
  'projects/kern/core/src',
  'projects/kern/kit/src',
  'projects/kern/addon-grid/src',
  'projects/kern/addon-charts/src',
  'projects/kern/patterns/src',
].map((path) => resolve(workspaceRoot, path));
const outputPath = resolve(
  workspaceRoot,
  'projects/showcase/src/lib/generated-component-contract.ts',
);
const tsconfigPath = resolve(workspaceRoot, 'projects/kern/tsconfig.lib.json');
const writeMode = process.argv.includes('--write');
const typeFormatFlags =
  ts.TypeFormatFlags.NoTruncation |
  ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope |
  ts.TypeFormatFlags.WriteArrayAsGenericType;

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
    return checker.typeToString(valueType, location, typeFormatFlags);
  }
  const rendered = checker.typeToString(signalType, location, typeFormatFlags);
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

async function extractContracts() {
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
        source: relative(workspaceRoot, path),
        decorated,
        selectors: decorated ? selectorsFrom(decorated.metadata, sourceFile) : [],
        baseName,
        ownApi,
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

  return contracts.sort((left, right) => left.selector.localeCompare(right.selector));
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

const prettierConfig = (await resolveConfig(outputPath)) ?? {};
const generated = await format(render(await extractContracts()), {
  ...prettierConfig,
  filepath: outputPath,
});

if (writeMode) {
  await writeFile(outputPath, generated, 'utf8');
  console.log(`Wrote ${relative(workspaceRoot, outputPath)}`);
} else {
  let existing = '';
  try {
    existing = await readFile(outputPath, 'utf8');
  } catch {
    // A missing generated file is reported by the comparison below.
  }

  if (existing !== generated) {
    console.error(
      'Component contract is stale. Run `npm run contracts:write` and commit the result.',
    );
    process.exitCode = 1;
  } else {
    console.log('Component contract is current.');
  }
}
