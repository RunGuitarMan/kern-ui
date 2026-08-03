import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

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
const issues = [];

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
  const [manifest, companionManifest, policy, workspaceManifest, workspaceLock] = await Promise.all(
    [
      readJson(manifestPath),
      readJson(companionManifestPath),
      readJson(policyPath),
      readJson(workspaceManifestPath),
      readJson(workspaceLockPath),
    ],
  );
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

  if (policy.schemaVersion !== 1) report('release-policy.json schemaVersion must be 1.');
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
