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
  const [manifest, policy, workspaceManifest, workspaceLock] = await Promise.all([
    readJson(manifestPath),
    readJson(policyPath),
    readJson(workspaceManifestPath),
    readJson(workspaceLockPath),
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
  const expectedOptionalPeers = {
    '@angular/compiler': { optional: true },
    typescript: { optional: true },
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
  if (
    !supportsVersion(
      policy.peerDependencies?.typescript,
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
  if (!rangeWithin(policy.peerDependencies?.typescript, angularBuildTypeScriptRange)) {
    report('Published TypeScript MCP peer range must stay within the Angular build peer range.');
  }
  if (!isDeepStrictEqual(manifest.peerDependenciesMeta, expectedOptionalPeers)) {
    report('MCP parser peers must remain explicitly optional for runtime-only consumers.');
  }
  if (manifest.bin?.['kern-mcp'] !== './mcp/server.mjs') {
    report('Publishable package must expose the bundled kern-mcp executable.');
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

  if (issues.length) {
    console.error(`Kern package policy verification failed:\n- ${issues.join('\n- ')}`);
    process.exitCode = 1;
    return;
  }
  console.log(
    `Kern package policy verified: ${manifest.name}@${manifest.version}, ` +
      `${Object.keys(manifest.dependencies).length} runtime dependency, ` +
      `${Object.keys(manifest.peerDependencies).length} peer dependencies.`,
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
