import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

import {
  assertRegistryCandidate,
  publishedTagVersion,
  tarballIntegrity,
} from './publish-kern-release-package.mjs';

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function option(name) {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length);
}

function runNpm(arguments_) {
  const result = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', arguments_, {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });
  if (result.status !== 0) {
    throw new Error(
      `npm ${arguments_.join(' ')} failed: ${`${result.stdout}\n${result.stderr}`.trim()}`,
    );
  }
  return result.stdout.trim();
}

export function publishedManifestIssues(manifest, definition, policy, version) {
  const issues = [];
  const expectedRepository = {
    type: 'git',
    url: `git+${policy.repository}`,
    directory: definition.directory,
  };
  for (const [field, expected] of [
    ['name', definition.packageName],
    ['version', version],
    ['license', policy.license],
  ]) {
    if (manifest[field] !== expected)
      issues.push(`${definition.packageName} ${field} is incorrect.`);
  }
  for (const [field, expected] of [
    ['repository', expectedRepository],
    ['dependencies', definition.dependencies],
    ['peerDependencies', definition.peerDependencies],
    ['peerDependenciesMeta', definition.peerDependenciesMeta],
  ]) {
    if (!isDeepStrictEqual(manifest[field] ?? {}, expected ?? {})) {
      issues.push(`${definition.packageName} ${field} differs from the approved release policy.`);
    }
  }
  if (
    typeof manifest.dist?.integrity !== 'string' ||
    !manifest.dist.integrity.startsWith('sha512-')
  ) {
    issues.push(`${definition.packageName} registry metadata has no SHA-512 integrity.`);
  }
  if (!String(manifest.dist?.tarball ?? '').startsWith('https://registry.npmjs.org/')) {
    issues.push(
      `${definition.packageName} registry tarball is not hosted by the canonical registry.`,
    );
  }
  if (
    !String(manifest.dist?.attestations?.url ?? '').startsWith(
      'https://registry.npmjs.org/-/npm/v1/attestations/',
    ) ||
    manifest.dist?.attestations?.provenance?.predicateType !== 'https://slsa.dev/provenance/v1'
  ) {
    issues.push(`${definition.packageName} registry metadata has no SLSA provenance attestation.`);
  }
  return issues;
}

async function registryManifest(packageName, version) {
  let lastError;
  for (let attempt = 0; attempt < 10; attempt += 1) {
    try {
      return JSON.parse(runNpm(['view', `${packageName}@${version}`, '--json']));
    } catch (error) {
      lastError = error;
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 2_000));
    }
  }
  throw lastError;
}

async function verifyDownloadedTarball(definition, version, expectedIntegrity, directory) {
  const output = JSON.parse(
    runNpm([
      'pack',
      `${definition.packageName}@${version}`,
      '--json',
      '--ignore-scripts',
      '--pack-destination',
      directory,
    ]),
  );
  const filename = output[0]?.filename;
  if (typeof filename !== 'string') {
    throw new Error(`npm pack did not return a filename for ${definition.packageName}@${version}.`);
  }
  const integrity = await tarballIntegrity(join(directory, filename));
  if (integrity !== expectedIntegrity) {
    throw new Error(
      `${definition.packageName}@${version} downloaded integrity ${integrity} differs from ` +
        `${expectedIntegrity}.`,
    );
  }
  return basename(filename);
}

async function main() {
  const version = option('version');
  const publicTag = option('tag');
  const angularTarball = option('angular-tarball');
  const mcpTarball = option('mcp-tarball');
  if (!version || !['latest', 'next'].includes(publicTag) || !angularTarball || !mcpTarball) {
    throw new Error(
      'Usage: verify-kern-published-release.mjs --version=X --tag=latest|next ' +
        '--angular-tarball=PATH --mcp-tarball=PATH',
    );
  }
  const policy = JSON.parse(
    await readFile(resolve(workspaceRoot, 'projects/kern/api/release-policy.json'), 'utf8'),
  );
  const definitions = [
    {
      packageName: policy.packageName,
      directory: 'projects/kern',
      dependencies: policy.dependencies,
      peerDependencies: policy.peerDependencies,
      peerDependenciesMeta: policy.peerDependenciesMeta ?? {},
      tarball: resolve(workspaceRoot, angularTarball),
    },
    {
      packageName: policy.companionPackage.packageName,
      directory: policy.companionPackage.directory,
      dependencies: policy.companionPackage.dependencies,
      peerDependencies: policy.companionPackage.peerDependencies ?? {},
      peerDependenciesMeta: policy.companionPackage.peerDependenciesMeta ?? {},
      tarball: resolve(workspaceRoot, mcpTarball),
    },
  ];
  const directory = await mkdtemp(join(tmpdir(), 'kern-published-release-'));
  try {
    for (const definition of definitions) {
      const expectedIntegrity = await tarballIntegrity(definition.tarball);
      await assertRegistryCandidate(definition.packageName, version, expectedIntegrity, publicTag);
      const manifest = await registryManifest(definition.packageName, version);
      const issues = publishedManifestIssues(manifest, definition, policy, version);
      if (issues.length > 0) throw new Error(issues.join('\n'));
      if (manifest.dist.integrity !== expectedIntegrity) {
        throw new Error(
          `${definition.packageName}@${version} registry integrity differs from approved bytes.`,
        );
      }
      const taggedVersion = await publishedTagVersion(definition.packageName, publicTag);
      if (taggedVersion !== version) {
        throw new Error(
          `${definition.packageName} ${publicTag} points to ${taggedVersion ?? '<unset>'}, expected ${version}.`,
        );
      }
      await verifyDownloadedTarball(definition, version, expectedIntegrity, directory);
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
  console.log(
    `Published release verified from npm: both packages expose ${publicTag}@${version} with approved bytes.`,
  );
}

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  try {
    await main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
