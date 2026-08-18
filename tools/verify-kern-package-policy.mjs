import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

import ts from 'typescript';

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const defaultManifestPath = resolve(workspaceRoot, 'projects/kern/package.json');
const defaultPolicyPath = resolve(workspaceRoot, 'projects/kern/api/release-policy.json');
const workspaceManifestPath = resolve(workspaceRoot, 'package.json');
const workspaceLockPath = resolve(workspaceRoot, 'package-lock.json');
const readmePath = resolve(workspaceRoot, 'projects/kern/README.md');
const licensePath = resolve(workspaceRoot, 'projects/kern/LICENSE');
const companionManifestPath = resolve(workspaceRoot, 'projects/kern-mcp/package.json');
const companionReadmePath = resolve(workspaceRoot, 'projects/kern-mcp/README.md');
const companionTypesPath = resolve(workspaceRoot, 'projects/kern-mcp/lib.d.mts');
const packageSourceRoot = resolve(workspaceRoot, 'projects/kern');
const issues = [];

const ignoredSourceDirectories = new Set(['agent', 'api', 'mcp']);
const sourceExtensions = new Set(['.js', '.mjs', '.ts']);

function option(name, fallback) {
  const prefix = `--${name}=`;
  const argument = process.argv.find((value) => value.startsWith(prefix));
  return argument ? resolve(workspaceRoot, argument.slice(prefix.length)) : fallback;
}

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

function report(message) {
  issues.push(message);
}

function sourceExtension(path) {
  const match = path.match(/\.[^.]+$/);
  return match?.[0] ?? '';
}

function isProductionSource(path) {
  const relativePath = relative(packageSourceRoot, path).split(sep).join('/');
  const [root] = relativePath.split('/');
  return (
    !ignoredSourceDirectories.has(root) &&
    sourceExtensions.has(sourceExtension(path)) &&
    !/(?:^|\/)[^/]+\.(?:spec|test)\.[cm]?[jt]s$/.test(relativePath)
  );
}

async function productionSourceFiles(directory = packageSourceRoot) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      if (directory === packageSourceRoot && ignoredSourceDirectories.has(entry.name)) return [];
      const path = join(directory, entry.name);
      if (entry.isDirectory()) return productionSourceFiles(path);
      return entry.isFile() && isProductionSource(path) ? [path] : [];
    }),
  );
  return files.flat().sort();
}

function externalPackageName(specifier) {
  if (
    !specifier ||
    specifier.startsWith('.') ||
    specifier.startsWith('/') ||
    specifier.startsWith('node:') ||
    specifier === '@kern-ui/angular' ||
    specifier.startsWith('@kern-ui/angular/')
  ) {
    return null;
  }
  const segments = specifier.split('/');
  return specifier.startsWith('@') ? segments.slice(0, 2).join('/') : segments[0];
}

function staticModuleSpecifiers(path, source) {
  const kind = path.endsWith('.js') || path.endsWith('.mjs') ? ts.ScriptKind.JS : ts.ScriptKind.TS;
  const sourceFile = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, kind);
  const specifiers = new Set();
  const add = (node) => {
    if (node && ts.isStringLiteralLike(node)) specifiers.add(node.text);
  };
  const visit = (node) => {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      add(node.moduleSpecifier);
    } else if (
      ts.isImportEqualsDeclaration(node) &&
      ts.isExternalModuleReference(node.moduleReference)
    ) {
      add(node.moduleReference.expression);
    } else if (ts.isCallExpression(node)) {
      const callee = node.expression;
      if (
        callee.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(callee) && callee.text === 'require') ||
        (ts.isPropertyAccessExpression(callee) &&
          ts.isIdentifier(callee.expression) &&
          callee.expression.text === 'require' &&
          callee.name.text === 'resolve')
      ) {
        add(node.arguments[0]);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return specifiers;
}

async function sourceExternalImports() {
  const imports = new Map();
  for (const path of await productionSourceFiles()) {
    const source = await readFile(path, 'utf8');
    for (const specifier of staticModuleSpecifiers(path, source)) {
      const packageName = externalPackageName(specifier);
      if (!packageName) continue;
      const locations = imports.get(packageName) ?? new Set();
      locations.add(relative(workspaceRoot, path).split(sep).join('/'));
      imports.set(packageName, locations);
    }
  }
  return imports;
}

function parseVersion(value) {
  const match = String(value).match(/(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
  return match ? [Number(match[1]), Number(match[2] ?? 0), Number(match[3] ?? 0)] : null;
}

function compareVersions(left, right) {
  for (let index = 0; index < 3; index += 1) {
    const difference = left[index] - right[index];
    if (difference !== 0) return Math.sign(difference);
  }
  return 0;
}

function supportsVersion(range, version) {
  const candidate = parseVersion(version);
  const { minimum, maximum } = rangeBounds(range);
  return Boolean(
    candidate &&
    minimum &&
    maximum &&
    compareVersions(candidate, minimum) >= 0 &&
    compareVersions(candidate, maximum) < 0,
  );
}

function rangeBounds(range) {
  return {
    minimum: parseVersion(String(range).match(/>=\s*([0-9.]+)/)?.[1]),
    maximum: parseVersion(String(range).match(/<\s*([0-9.]+)/)?.[1]),
  };
}

function rangeWithin(candidateRange, supportedRange) {
  const candidate = rangeBounds(candidateRange);
  const supported = rangeBounds(supportedRange);
  return Boolean(
    candidate.minimum &&
    candidate.maximum &&
    supported.minimum &&
    supported.maximum &&
    compareVersions(candidate.minimum, supported.minimum) >= 0 &&
    compareVersions(candidate.maximum, supported.maximum) <= 0,
  );
}

async function main() {
  const manifestPath = option('manifest', defaultManifestPath);
  const policyPath = option('policy', defaultPolicyPath);
  const [manifest, companionManifest, policy, workspaceManifest, workspaceLock, externalImports] =
    await Promise.all([
      readJson(manifestPath),
      readJson(companionManifestPath),
      readJson(policyPath),
      readJson(workspaceManifestPath),
      readJson(workspaceLockPath),
      sourceExternalImports(),
    ]);
  const angularBuildTypeScriptRange =
    workspaceLock.packages?.['node_modules/@angular/build']?.peerDependencies?.typescript;
  const expectedRepository = {
    type: 'git',
    url: `git+${policy.repository}`,
    directory: 'projects/kern',
  };
  const expectedPublishConfig = {
    access: 'public',
    registry: policy.registry,
    provenance: true,
  };

  if (policy.schemaVersion !== 2) report('release-policy.json schemaVersion must be 2.');
  if (manifest.name !== policy.packageName) report(`Package name must be ${policy.packageName}.`);
  if (manifest.license !== policy.license) report(`Package license must be ${policy.license}.`);
  if (!isDeepStrictEqual(manifest.repository, expectedRepository)) {
    report('Package repository metadata differs from release policy.');
  }
  if (manifest.homepage !== 'https://github.com/RunGuitarMan/kern-ui#readme') {
    report('Package homepage must point to the public repository README.');
  }
  if (manifest.bugs?.url !== 'https://github.com/RunGuitarMan/kern-ui/issues') {
    report('Package bugs URL must point to the public issue tracker.');
  }
  if (!isDeepStrictEqual(manifest.publishConfig, expectedPublishConfig)) {
    report('Package publishConfig must require public npm provenance publication.');
  }
  if (!isDeepStrictEqual(manifest.dependencies, policy.dependencies)) {
    report('Package dependencies differ from release policy.');
  }
  if (!isDeepStrictEqual(manifest.peerDependencies, policy.peerDependencies)) {
    report('Package peerDependencies differ from release policy.');
  }
  if (!isDeepStrictEqual(manifest.peerDependenciesMeta, policy.peerDependenciesMeta)) {
    report('Package optional peer metadata differs from release policy.');
  }
  const declaredRuntimePackages = new Set([
    ...Object.keys(manifest.dependencies ?? {}),
    ...Object.keys(manifest.peerDependencies ?? {}),
  ]);
  for (const [packageName, locations] of externalImports) {
    if (!declaredRuntimePackages.has(packageName)) {
      report(
        `Production source imports undeclared package ${packageName} ` +
          `(${[...locations].sort().join(', ')}).`,
      );
    }
  }
  for (const packageName of policy.frameworkPeerPackages ?? []) {
    if (manifest.dependencies?.[packageName]) {
      report(`Framework package ${packageName} must be a peerDependency, not a dependency.`);
    }
    if (!manifest.peerDependencies?.[packageName]) {
      report(`Framework package ${packageName} must be declared as a peerDependency.`);
    }
    if (!externalImports.has(packageName)) {
      report(`Framework peer ${packageName} is not used by production package source.`);
    }
  }
  for (const packageName of policy.toolingPeerPackages ?? []) {
    if (manifest.dependencies?.[packageName]) {
      report(`Tooling package ${packageName} must be an optional peerDependency.`);
    }
    if (!manifest.peerDependencies?.[packageName]) {
      report(`Tooling package ${packageName} must be declared as a peerDependency.`);
    }
    if (manifest.peerDependenciesMeta?.[packageName]?.optional !== true) {
      report(`Tooling peer ${packageName} must be optional for runtime-only consumers.`);
    }
    if (!externalImports.has(packageName)) {
      report(`Tooling peer ${packageName} is not used by published schematics source.`);
    }
  }
  if (
    !supportsVersion(
      policy.companionPackage?.dependencies?.typescript,
      workspaceManifest.devDependencies?.typescript,
    )
  ) {
    report(
      'TypeScript MCP peer range must include the exact TypeScript version used by the verified workspace.',
    );
  }
  if (
    !supportsVersion(angularBuildTypeScriptRange, workspaceManifest.devDependencies?.typescript)
  ) {
    report('Workspace TypeScript version must satisfy the installed Angular build peer range.');
  }
  if (
    !rangeWithin(policy.companionPackage?.dependencies?.typescript, angularBuildTypeScriptRange)
  ) {
    report('Published TypeScript MCP dependency must stay within the Angular build peer range.');
  }
  if (
    !supportsVersion(
      policy.peerDependencies?.typescript,
      workspaceManifest.devDependencies?.typescript,
    )
  ) {
    report(
      'Angular schematics TypeScript peer range must include the exact TypeScript version used by the verified workspace.',
    );
  }
  if (!rangeWithin(policy.peerDependencies?.typescript, angularBuildTypeScriptRange)) {
    report('Angular schematics TypeScript peer must stay within the Angular build peer range.');
  }
  if (
    'bin' in manifest ||
    Object.keys(manifest.exports ?? {}).some((key) => /^\.\/(agent|mcp)/.test(key))
  ) {
    report('Angular runtime package must not contain AI contracts or the MCP executable.');
  }
  if (manifest.private === true) report('Publishable package must not be private.');
  for (const forbidden of [
    'devDependencies',
    'bundledDependencies',
    'bundleDependencies',
    'scripts',
  ]) {
    if (forbidden in manifest) report(`Publishable package must not contain ${forbidden}.`);
  }
  if (!Array.isArray(manifest.sideEffects) || !manifest.sideEffects.includes('./styles/*.css')) {
    report('Package must preserve the declared stylesheet side effect.');
  }
  if (!existsSync(readmePath) || !existsSync(licensePath)) {
    report('Package README.md and LICENSE must exist before publication.');
  }

  if (companionManifest.name !== policy.companionPackage?.packageName) {
    report(`Companion package name must be ${policy.companionPackage?.packageName}.`);
  }
  if (companionManifest.version !== manifest.version) {
    report('Angular and MCP package versions must remain aligned.');
  }
  if (!isDeepStrictEqual(companionManifest.dependencies, policy.companionPackage?.dependencies)) {
    report('MCP package dependencies differ from release policy.');
  }
  if (
    !isDeepStrictEqual(
      companionManifest.peerDependencies,
      policy.companionPackage?.peerDependencies,
    ) ||
    !isDeepStrictEqual(
      companionManifest.peerDependenciesMeta,
      policy.companionPackage?.peerDependenciesMeta,
    )
  ) {
    report('MCP package optional Angular peer differs from release policy.');
  }
  if (companionManifest.peerDependencies?.['@kern-ui/angular'] !== manifest.version) {
    report('MCP package must declare its aligned Angular version as an optional peer.');
  }
  if (
    !isDeepStrictEqual(companionManifest.repository, {
      type: 'git',
      url: `git+${policy.repository}`,
      directory: policy.companionPackage?.directory,
    })
  ) {
    report('MCP package repository metadata differs from release policy.');
  }
  if (companionManifest.license !== policy.license) {
    report(`MCP package license must be ${policy.license}.`);
  }
  if (!isDeepStrictEqual(companionManifest.publishConfig, expectedPublishConfig)) {
    report('MCP package publishConfig must require public npm provenance publication.');
  }
  if (companionManifest.bin?.['kern-mcp'] !== './server.mjs') {
    report('MCP package must expose the self-contained kern-mcp executable.');
  }
  if (
    companionManifest.exports?.['./agent/component-manifest.json'] !==
    './agent/component-manifest.json'
  ) {
    report('MCP package must export its immutable component manifest.');
  }
  if (
    companionManifest.types !== './lib.d.mts' ||
    companionManifest.exports?.['.']?.types !== './lib.d.mts' ||
    companionManifest.exports?.['.']?.default !== './lib.mjs' ||
    !existsSync(companionTypesPath)
  ) {
    report('MCP package must publish typed programmatic root exports.');
  }
  if (companionManifest.private === true) report('MCP package must not be private.');
  for (const forbidden of [
    'devDependencies',
    'bundledDependencies',
    'bundleDependencies',
    'scripts',
  ]) {
    if (forbidden in companionManifest) {
      report(`MCP package must not contain ${forbidden}.`);
    }
  }
  if (!existsSync(companionReadmePath)) {
    report('MCP package README.md must exist before publication.');
  }

  if (issues.length) {
    console.error(`Kern package policy verification failed:\n- ${issues.join('\n- ')}`);
    process.exitCode = 1;
    return;
  }
  console.log(
    `Kern package policy verified: ${manifest.name}@${manifest.version}, ` +
      `${Object.keys(manifest.dependencies).length} runtime dependency, ` +
      `${Object.keys(manifest.peerDependencies).length} peer dependencies; ` +
      `${companionManifest.name} owns AI tooling.`,
  );
}

try {
  await main();
} catch (error) {
  console.error(
    `Kern package policy verification failed: ${
      error instanceof Error ? error.message : String(error)
    }`,
  );
  process.exitCode = 1;
}
