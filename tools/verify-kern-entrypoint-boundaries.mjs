import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';

import ts from 'typescript';

const workspaceRoot = resolve(import.meta.dirname, '..');
const configPath = join(workspaceRoot, 'projects/kern/api/runtime-entrypoints.json');
const failures = [];

function fail(message) {
  failures.push(message);
}

function workspacePath(path) {
  return relative(workspaceRoot, path).split(sep).join('/');
}

function normalizedPath(path) {
  return path.replaceAll('\\', '/').replace(/^\.\//, '').replace(/\/+$/, '');
}

function isPathWithin(root, candidate) {
  const normalizedRoot = resolve(root);
  const normalizedCandidate = resolve(candidate);
  return (
    normalizedCandidate === normalizedRoot ||
    normalizedCandidate.startsWith(`${normalizedRoot}${sep}`)
  );
}

function matchesPathRule(sourcePath, rule) {
  const normalizedSource = normalizedPath(sourcePath);
  const normalizedRule = normalizedPath(rule);
  return normalizedRule.endsWith('.ts')
    ? normalizedSource === normalizedRule
    : normalizedSource.startsWith(`${normalizedRule}/`);
}

function validateConfig(value) {
  if (
    !value ||
    typeof value !== 'object' ||
    typeof value.packageName !== 'string' ||
    typeof value.primarySourceRoot !== 'string' ||
    typeof value.rootPublicApi !== 'string' ||
    !Array.isArray(value.entrypoints)
  ) {
    throw new Error('Invalid projects/kern/api/runtime-entrypoints.json structure.');
  }

  const names = new Set();
  const subpaths = new Set();
  const sourceRoots = new Set();
  const publicApis = new Set();
  for (const entrypoint of value.entrypoints) {
    if (
      !entrypoint ||
      typeof entrypoint !== 'object' ||
      typeof entrypoint.name !== 'string' ||
      typeof entrypoint.subpath !== 'string' ||
      typeof entrypoint.sourceRoot !== 'string' ||
      typeof entrypoint.publicApi !== 'string' ||
      !Array.isArray(entrypoint.owns) ||
      !Array.isArray(entrypoint.dependencies) ||
      !Array.isArray(entrypoint.identityExports) ||
      !entrypoint.owns.every((item) => typeof item === 'string') ||
      !entrypoint.dependencies.every((item) => typeof item === 'string') ||
      !entrypoint.identityExports.every((item) => typeof item === 'string')
    ) {
      throw new Error(`Invalid runtime entrypoint configuration: ${JSON.stringify(entrypoint)}`);
    }
    if (!entrypoint.subpath.startsWith('./') || entrypoint.subpath.slice(2).includes('/')) {
      throw new Error(`Runtime subpath must be a single package segment: ${entrypoint.subpath}`);
    }
    if (!entrypoint.owns.length || !entrypoint.identityExports.length) {
      throw new Error(
        `Runtime entrypoint "${entrypoint.name}" requires owners and identity exports.`,
      );
    }
    if (names.has(entrypoint.name)) {
      throw new Error(`Duplicate runtime entrypoint name: ${entrypoint.name}`);
    }
    if (subpaths.has(entrypoint.subpath)) {
      throw new Error(`Duplicate runtime entrypoint subpath: ${entrypoint.subpath}`);
    }
    if (sourceRoots.has(entrypoint.sourceRoot)) {
      throw new Error(`Duplicate runtime entrypoint source root: ${entrypoint.sourceRoot}`);
    }
    if (publicApis.has(entrypoint.publicApi)) {
      throw new Error(`Duplicate runtime entrypoint public API: ${entrypoint.publicApi}`);
    }
    const sourceRoot = resolve(workspaceRoot, entrypoint.sourceRoot);
    const publicApi = resolve(workspaceRoot, entrypoint.publicApi);
    if (!isPathWithin(sourceRoot, publicApi)) {
      throw new Error(
        `Entrypoint "${entrypoint.name}" public API must live inside its physical source root.`,
      );
    }
    names.add(entrypoint.name);
    subpaths.add(entrypoint.subpath);
    sourceRoots.add(entrypoint.sourceRoot);
    publicApis.add(entrypoint.publicApi);
  }

  const resolvedSourceRoots = value.entrypoints.map((entrypoint) => ({
    name: entrypoint.name,
    path: resolve(workspaceRoot, entrypoint.sourceRoot),
  }));
  for (const sourceRoot of resolvedSourceRoots) {
    for (const candidate of resolvedSourceRoots) {
      if (
        sourceRoot.name !== candidate.name &&
        (isPathWithin(sourceRoot.path, candidate.path) ||
          isPathWithin(candidate.path, sourceRoot.path))
      ) {
        throw new Error(
          `Runtime source roots for "${sourceRoot.name}" and "${candidate.name}" overlap.`,
        );
      }
    }
  }

  for (const entrypoint of value.entrypoints) {
    const dependencies = new Set();
    for (const dependency of entrypoint.dependencies) {
      if (!names.has(dependency)) {
        throw new Error(`Entrypoint "${entrypoint.name}" has unknown dependency "${dependency}".`);
      }
      if (dependency === entrypoint.name) {
        throw new Error(`Entrypoint "${entrypoint.name}" cannot depend on itself.`);
      }
      if (dependencies.has(dependency)) {
        throw new Error(`Entrypoint "${entrypoint.name}" repeats dependency "${dependency}".`);
      }
      dependencies.add(dependency);
    }
  }

  const byName = new Map(value.entrypoints.map((entrypoint) => [entrypoint.name, entrypoint]));
  const visiting = new Set();
  const visited = new Set();
  function visit(name, chain) {
    if (visiting.has(name)) {
      throw new Error(`Runtime entrypoint dependency cycle: ${[...chain, name].join(' -> ')}`);
    }
    if (visited.has(name)) return;
    visiting.add(name);
    const entrypoint = byName.get(name);
    for (const dependency of entrypoint.dependencies) {
      visit(dependency, [...chain, name]);
    }
    visiting.delete(name);
    visited.add(name);
  }
  for (const name of names) visit(name, []);

  return value;
}

async function filesRecursively(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) return filesRecursively(path);
      return entry.isFile() ? [path] : [];
    }),
  );
  return nested.flat().sort();
}

function moduleReferences(sourcePath, source) {
  const sourceFile = ts.createSourceFile(
    sourcePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const references = [];

  function addReference(node, literal) {
    if (!literal || !ts.isStringLiteralLike(literal)) return;
    const position = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
    references.push({
      specifier: literal.text,
      line: position.line + 1,
    });
  }

  function visit(node) {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      addReference(node, node.moduleSpecifier);
    } else if (
      ts.isImportEqualsDeclaration(node) &&
      ts.isExternalModuleReference(node.moduleReference)
    ) {
      addReference(node, node.moduleReference.expression);
    } else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      addReference(node, node.arguments[0]);
    } else if (
      ts.isImportTypeNode(node) &&
      ts.isLiteralTypeNode(node.argument) &&
      ts.isStringLiteralLike(node.argument.literal)
    ) {
      addReference(node, node.argument.literal);
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return references;
}

function resolveRelativeModule(importer, specifier) {
  const base = resolve(dirname(importer), specifier);
  const extension = extname(base);
  const candidates =
    extension === '.ts' || extension === '.mts' || extension === '.cts'
      ? [base]
      : [`${base}.ts`, join(base, 'index.ts')];
  if (extension === '.js' || extension === '.mjs' || extension === '.cjs') {
    candidates.push(`${base.slice(0, -3)}.ts`);
  }
  return candidates.find((candidate) => existsSync(candidate));
}

async function main() {
  if (!existsSync(configPath)) {
    throw new Error('projects/kern/api/runtime-entrypoints.json is missing.');
  }

  const config = validateConfig(JSON.parse(await readFile(configPath, 'utf8')));
  const entrypointsByName = new Map(
    config.entrypoints.map((entrypoint) => [entrypoint.name, entrypoint]),
  );
  const entrypointsBySpecifier = new Map(
    config.entrypoints.map((entrypoint) => [
      `${config.packageName}${entrypoint.subpath.slice(1)}`,
      entrypoint,
    ]),
  );

  const sourceFiles = [];
  const ownership = new Map();
  for (const entrypoint of config.entrypoints) {
    const sourceRoot = resolve(workspaceRoot, entrypoint.sourceRoot);
    if (!existsSync(sourceRoot)) {
      fail(`Entrypoint "${entrypoint.name}" source root is missing: ${entrypoint.sourceRoot}.`);
      continue;
    }
    const publicApi = resolve(workspaceRoot, entrypoint.publicApi);
    const entrypointSourceFiles = (await filesRecursively(sourceRoot)).filter(
      (path) =>
        path.endsWith('.ts') &&
        !path.endsWith('.d.ts') &&
        !path.endsWith('.spec.ts') &&
        path !== publicApi,
    );
    for (const sourceFile of entrypointSourceFiles) {
      sourceFiles.push(sourceFile);
      const sourcePath = normalizedPath(relative(sourceRoot, sourceFile));
      const matchingRules = entrypoint.owns.filter((rule) => matchesPathRule(sourcePath, rule));
      if (matchingRules.length !== 1) {
        fail(
          `${workspacePath(sourceFile)} must match exactly one ownership rule for ` +
            `"${entrypoint.name}"; found ${matchingRules.join(', ') || 'none'}.`,
        );
        continue;
      }
      ownership.set(sourceFile, entrypoint.name);
    }
  }

  const primarySourceRoot = resolve(workspaceRoot, config.primarySourceRoot);
  const rootPublicApi = resolve(workspaceRoot, config.rootPublicApi);
  if (!existsSync(primarySourceRoot)) {
    fail(`Primary source root is missing: ${config.primarySourceRoot}.`);
  } else {
    const misplacedPrimarySources = (await filesRecursively(primarySourceRoot)).filter(
      (path) =>
        path.endsWith('.ts') &&
        !path.endsWith('.d.ts') &&
        !path.endsWith('.spec.ts') &&
        path !== rootPublicApi,
    );
    for (const sourceFile of misplacedPrimarySources) {
      fail(
        `${workspacePath(sourceFile)} is runtime source under the primary aggregator; ` +
          'move it to exactly one secondary entrypoint.',
      );
    }
  }

  let dependencyImportCount = 0;
  for (const sourceFile of sourceFiles) {
    const ownerName = ownership.get(sourceFile);
    if (!ownerName) continue;
    const owner = entrypointsByName.get(ownerName);
    const references = moduleReferences(sourceFile, await readFile(sourceFile, 'utf8'));

    for (const reference of references) {
      const location = `${workspacePath(sourceFile)}:${reference.line}`;
      if (reference.specifier.startsWith('.')) {
        const target = resolveRelativeModule(sourceFile, reference.specifier);
        if (!target) {
          fail(`${location} has unresolved local module "${reference.specifier}".`);
          continue;
        }
        const targetOwner = ownership.get(target);
        if (!targetOwner) {
          fail(`${location} imports unowned runtime source ${workspacePath(target)}.`);
        } else if (targetOwner !== ownerName) {
          const targetEntrypoint = entrypointsByName.get(targetOwner);
          fail(
            `${location} crosses from "${ownerName}" to "${targetOwner}" through relative import ` +
              `"${reference.specifier}". Use "${config.packageName}${targetEntrypoint.subpath.slice(1)}".`,
          );
        }
        continue;
      }

      if (
        reference.specifier !== config.packageName &&
        !reference.specifier.startsWith(`${config.packageName}/`)
      ) {
        continue;
      }
      if (reference.specifier === config.packageName) {
        fail(
          `${location} imports the root compatibility entrypoint from secondary "${ownerName}".`,
        );
        continue;
      }

      const targetEntrypoint = entrypointsBySpecifier.get(reference.specifier);
      if (!targetEntrypoint) {
        fail(`${location} uses unsupported internal deep import "${reference.specifier}".`);
        continue;
      }
      if (targetEntrypoint.name === ownerName) {
        fail(
          `${location} imports its own package subpath "${reference.specifier}"; use an intra-entrypoint relative import.`,
        );
        continue;
      }
      if (!owner.dependencies.includes(targetEntrypoint.name)) {
        fail(
          `${location} violates the dependency matrix: "${ownerName}" may depend only on ` +
            `${owner.dependencies.join(', ') || 'no Kern entrypoints'}, not "${targetEntrypoint.name}".`,
        );
        continue;
      }
      dependencyImportCount += 1;
    }
  }

  for (const entrypoint of config.entrypoints) {
    const publicApi = resolve(workspaceRoot, entrypoint.publicApi);
    const ngPackagePath = join(workspaceRoot, 'projects/kern', entrypoint.name, 'ng-package.json');
    if (!existsSync(ngPackagePath)) {
      fail(`Entrypoint "${entrypoint.name}" ng-package.json is missing.`);
    } else {
      try {
        const ngPackage = JSON.parse(await readFile(ngPackagePath, 'utf8'));
        const configuredEntryFile =
          typeof ngPackage.lib?.entryFile === 'string'
            ? resolve(dirname(ngPackagePath), ngPackage.lib.entryFile)
            : undefined;
        if (configuredEntryFile !== publicApi) {
          fail(
            `Entrypoint "${entrypoint.name}" ng-package.json must target ${entrypoint.publicApi}.`,
          );
        }
      } catch (error) {
        fail(
          `Entrypoint "${entrypoint.name}" ng-package.json is invalid: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }
    if (!existsSync(publicApi)) {
      fail(`Entrypoint "${entrypoint.name}" public API is missing: ${entrypoint.publicApi}.`);
      continue;
    }
    const references = moduleReferences(publicApi, await readFile(publicApi, 'utf8'));
    if (!references.length) {
      fail(`Entrypoint "${entrypoint.name}" public API exposes no owned source.`);
    }
    for (const reference of references) {
      const location = `${workspacePath(publicApi)}:${reference.line}`;
      if (!reference.specifier.startsWith('.')) {
        fail(
          `${location} must expose only source owned by "${entrypoint.name}", not "${reference.specifier}".`,
        );
        continue;
      }
      const target = resolveRelativeModule(publicApi, reference.specifier);
      if (!target) {
        fail(`${location} has unresolved public export "${reference.specifier}".`);
        continue;
      }
      const targetOwner = ownership.get(target);
      if (targetOwner !== entrypoint.name) {
        fail(
          `${location} exposes ${workspacePath(target)}, owned by "${targetOwner ?? 'no entrypoint'}".`,
        );
      }
    }
  }

  if (!existsSync(rootPublicApi)) {
    fail(`Root compatibility public API is missing: ${config.rootPublicApi}.`);
  } else {
    const rootReferences = moduleReferences(rootPublicApi, await readFile(rootPublicApi, 'utf8'));
    const counts = new Map();
    for (const reference of rootReferences) {
      const location = `${workspacePath(rootPublicApi)}:${reference.line}`;
      const entrypoint = entrypointsBySpecifier.get(reference.specifier);
      if (!entrypoint) {
        fail(
          `${location} root compatibility API may aggregate only declared runtime subpaths; ` +
            `found "${reference.specifier}".`,
        );
        continue;
      }
      counts.set(entrypoint.name, (counts.get(entrypoint.name) ?? 0) + 1);
    }
    for (const entrypoint of config.entrypoints) {
      if (counts.get(entrypoint.name) !== 1) {
        fail(
          `Root compatibility API must export "${config.packageName}${entrypoint.subpath.slice(1)}" exactly once.`,
        );
      }
    }
  }

  if (failures.length) {
    console.error(
      `Kern runtime entrypoint boundary verification failed:\n- ${failures.join('\n- ')}`,
    );
    process.exitCode = 1;
  } else {
    console.log(
      `Kern runtime entrypoint boundaries verified: ${config.entrypoints.length} entrypoints, ` +
        `${sourceFiles.length} owned source files, ${dependencyImportCount} package-boundary imports.`,
    );
  }
}

try {
  await main();
} catch (error) {
  console.error(
    `Kern runtime entrypoint boundary verification failed: ${
      error instanceof Error ? error.message : String(error)
    }`,
  );
  process.exitCode = 1;
}
