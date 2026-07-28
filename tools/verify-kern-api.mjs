import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';

import ts from 'typescript';

const workspaceRoot = resolve(import.meta.dirname, '..');
const packageRoot = join(workspaceRoot, 'dist/kern');
const packageManifestPath = join(packageRoot, 'package.json');
const runtimeConfigPath = join(workspaceRoot, 'projects/kern/api/runtime-entrypoints.json');
const failures = [];

function fail(message) {
  failures.push(message);
}

function pathInside(root, candidate) {
  const normalizedRoot = resolve(root);
  const normalizedCandidate = resolve(candidate);
  return (
    normalizedCandidate === normalizedRoot ||
    normalizedCandidate.startsWith(`${normalizedRoot}${sep}`)
  );
}

function declarationName(node) {
  return node.name && ts.isIdentifier(node.name) ? node.name.text : null;
}

function enclosingNonPublicMember(node, root) {
  let current = node.parent;
  while (current && current !== root) {
    if (
      ts.isClassElement(current) &&
      current.modifiers?.some(
        (modifier) =>
          modifier.kind === ts.SyntaxKind.PrivateKeyword ||
          modifier.kind === ts.SyntaxKind.ProtectedKeyword,
      )
    ) {
      return true;
    }
    current = current.parent;
  }
  return false;
}

function leftmostIdentifier(entityName) {
  let current = entityName;
  while (ts.isQualifiedName(current)) {
    current = current.left;
  }
  return ts.isIdentifier(current) ? current.text : null;
}

function analyzeDeclarations(declarationPath) {
  const source = ts.createSourceFile(
    declarationPath,
    ts.sys.readFile(declarationPath) ?? '',
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const declarations = new Map();
  const exportedLocalNames = new Set();

  for (const statement of source.statements) {
    if (
      ts.isClassDeclaration(statement) ||
      ts.isInterfaceDeclaration(statement) ||
      ts.isTypeAliasDeclaration(statement) ||
      ts.isEnumDeclaration(statement) ||
      ts.isFunctionDeclaration(statement)
    ) {
      const name = declarationName(statement);
      if (name) {
        declarations.set(name, statement);
        if (
          statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
        ) {
          exportedLocalNames.add(name);
        }
      }
    }

    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        const name = declarationName(declaration);
        if (name) {
          declarations.set(name, declaration);
          if (
            statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
          ) {
            exportedLocalNames.add(name);
          }
        }
      }
    }

    if (
      ts.isExportDeclaration(statement) &&
      statement.exportClause &&
      ts.isNamedExports(statement.exportClause)
    ) {
      for (const element of statement.exportClause.elements) {
        exportedLocalNames.add(element.propertyName?.text ?? element.name.text);
      }
    }
  }

  const forgotten = new Map();
  for (const exportedName of exportedLocalNames) {
    const declaration = declarations.get(exportedName);
    if (!declaration) continue;

    const referenced = new Set();
    function visit(node) {
      if (enclosingNonPublicMember(node, declaration)) return;

      let reference = null;
      if (ts.isTypeReferenceNode(node)) {
        reference = leftmostIdentifier(node.typeName);
      } else if (
        ts.isExpressionWithTypeArguments(node) &&
        ts.isIdentifier(node.expression) &&
        ts.isHeritageClause(node.parent) &&
        node.parent.token === ts.SyntaxKind.ExtendsKeyword
      ) {
        reference = node.expression.text;
      } else if (ts.isTypeQueryNode(node)) {
        reference = leftmostIdentifier(node.exprName);
      }

      if (
        reference &&
        reference !== exportedName &&
        declarations.has(reference) &&
        !exportedLocalNames.has(reference)
      ) {
        referenced.add(reference);
      }
      ts.forEachChild(node, visit);
    }
    visit(declaration);

    if (referenced.size) {
      forgotten.set(exportedName, [...referenced].sort());
    }
  }

  return {
    exportedCount: exportedLocalNames.size,
    forgotten,
  };
}

async function main() {
  if (!existsSync(packageManifestPath) || !existsSync(runtimeConfigPath)) {
    throw new Error(
      'Kern declarations or runtime entrypoint configuration are missing. ' +
        'Run "npm run build:kern" before API verification.',
    );
  }

  const manifest = JSON.parse(await readFile(packageManifestPath, 'utf8'));
  const runtimeConfig = JSON.parse(await readFile(runtimeConfigPath, 'utf8'));
  if (
    !runtimeConfig ||
    !Array.isArray(runtimeConfig.entrypoints) ||
    !runtimeConfig.entrypoints.every(
      (entrypoint) => entrypoint && typeof entrypoint.subpath === 'string',
    )
  ) {
    throw new Error('Invalid projects/kern/api/runtime-entrypoints.json structure.');
  }

  const runtimeSubpaths = [
    '.',
    ...runtimeConfig.entrypoints.map((entrypoint) => entrypoint.subpath),
  ];
  const runtimeSubpathSet = new Set(runtimeSubpaths);
  if (runtimeSubpathSet.size !== runtimeSubpaths.length) {
    throw new Error('Runtime API verification subpaths must be unique.');
  }

  const typedRuntimeExports = Object.entries(manifest.exports ?? {})
    .filter(
      ([subpath, conditions]) =>
        subpath !== './testing' &&
        conditions &&
        typeof conditions === 'object' &&
        typeof conditions.types === 'string' &&
        typeof conditions.default === 'string',
    )
    .map(([subpath]) => subpath);
  for (const subpath of typedRuntimeExports) {
    if (!runtimeSubpathSet.has(subpath)) {
      fail(
        `Typed runtime export "${subpath}" is not covered by runtime-entrypoints.json API verification.`,
      );
    }
  }

  const summaries = [];
  for (const subpath of runtimeSubpaths) {
    const conditions = manifest.exports?.[subpath];
    if (
      !conditions ||
      typeof conditions !== 'object' ||
      typeof conditions.types !== 'string' ||
      typeof conditions.default !== 'string'
    ) {
      fail(`Runtime export "${subpath}" requires string "types" and "default" conditions.`);
      continue;
    }

    const declarationPath = resolve(packageRoot, conditions.types);
    if (!pathInside(packageRoot, declarationPath) || !existsSync(declarationPath)) {
      fail(`Runtime export "${subpath}" references missing or unsafe declarations target.`);
      continue;
    }

    const summary = analyzeDeclarations(declarationPath);
    summaries.push({ subpath, ...summary });
    if (subpath !== '.' && summary.exportedCount === 0) {
      fail(`Runtime entrypoint "${subpath}" contains no locally exported declarations.`);
    }
    for (const [name, references] of summary.forgotten) {
      fail(`${subpath} :: ${name} references non-exported local types: ${references.join(', ')}`);
    }
  }

  if (failures.length) {
    console.error(`Kern public API verification failed:\n- ${failures.join('\n- ')}`);
    process.exitCode = 1;
  } else {
    const total = summaries.reduce((sum, summary) => sum + summary.exportedCount, 0);
    console.log(
      `Kern public API verified: ${summaries.length} runtime entrypoints, ` +
        `${total} locally exported declarations ` +
        `(root compatibility aggregator: ${summaries.find((summary) => summary.subpath === '.')?.exportedCount ?? 0}).`,
    );
  }
}

try {
  await main();
} catch (error) {
  console.error(
    `Kern public API verification failed: ${
      error instanceof Error ? error.message : String(error)
    }`,
  );
  process.exitCode = 1;
}
