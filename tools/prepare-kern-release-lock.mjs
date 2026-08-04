import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { satisfies, valid, validRange } from 'semver';

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function option(name, fallback = null) {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length) ?? fallback;
}

function dependencyPath(parentPath, dependencyName, packages) {
  let directory = parentPath;
  while (true) {
    const candidate = directory
      ? `${directory}/node_modules/${dependencyName}`
      : `node_modules/${dependencyName}`;
    if (packages[candidate]) return candidate;

    const boundary = directory.lastIndexOf('/node_modules/');
    if (boundary >= 0) {
      directory = directory.slice(0, boundary);
    } else if (directory.startsWith('node_modules/')) {
      directory = '';
    } else {
      break;
    }
  }
  return null;
}

function dependencyEntries(packageEntry) {
  return [
    ...Object.entries(packageEntry.dependencies ?? {}).map(([name, range]) => ({
      kind: 'dependency',
      name,
      optional: false,
      range,
    })),
    ...Object.entries(packageEntry.optionalDependencies ?? {}).map(([name, range]) => ({
      kind: 'optional dependency',
      name,
      optional: true,
      range,
    })),
    ...Object.entries(packageEntry.peerDependencies ?? {}).map(([name, range]) => ({
      kind: 'peer dependency',
      name,
      optional: packageEntry.peerDependenciesMeta?.[name]?.optional === true,
      range,
    })),
  ];
}

function assertResolvedEdge(manifestName, parentPath, dependency, path, entry) {
  const owner = parentPath || manifestName;
  if (typeof dependency.range !== 'string' || validRange(dependency.range) === null) {
    throw new Error(
      `${owner} ${dependency.kind} ${dependency.name} has unsupported range ${String(
        dependency.range,
      )}.`,
    );
  }
  if (typeof entry.version !== 'string' || valid(entry.version) !== entry.version) {
    throw new Error(`${path} does not contain an exact Semantic Versioning package version.`);
  }
  if (!satisfies(entry.version, dependency.range)) {
    throw new Error(
      `${owner} ${dependency.kind} ${dependency.name}@${dependency.range} resolves to ` +
        `${entry.version} at ${path}, outside the declared range.`,
    );
  }
}

function runtimeEntry(entry) {
  const copy = structuredClone(entry);
  delete copy.dev;
  delete copy.devOptional;
  delete copy.extraneous;
  return copy;
}

export function buildReleaseLock(workspaceLock, manifest) {
  if (workspaceLock.lockfileVersion !== 3 || !workspaceLock.packages) {
    throw new Error('The workspace package-lock must use lockfileVersion 3.');
  }
  if (typeof manifest.name !== 'string' || typeof manifest.version !== 'string') {
    throw new Error('The release package manifest requires a name and version.');
  }

  const root = {};
  for (const field of [
    'name',
    'version',
    'license',
    'engines',
    'dependencies',
    'optionalDependencies',
    'peerDependencies',
    'peerDependenciesMeta',
    'bin',
  ]) {
    if (manifest[field] !== undefined) root[field] = structuredClone(manifest[field]);
  }

  const selected = new Map([['', root]]);
  const queue = [{ entry: root, path: '' }];
  while (queue.length > 0) {
    const current = queue.shift();
    for (const dependency of dependencyEntries(current.entry)) {
      const path = dependencyPath(current.path, dependency.name, workspaceLock.packages);
      if (!path) {
        if (dependency.optional) continue;
        throw new Error(
          `${manifest.name} dependency ${dependency.name} is not pinned in the workspace lockfile.`,
        );
      }
      const entry = runtimeEntry(workspaceLock.packages[path]);
      assertResolvedEdge(manifest.name, current.path, dependency, path, entry);
      if (selected.has(path)) continue;
      selected.set(path, entry);
      queue.push({ entry, path });
    }
  }

  return {
    name: manifest.name,
    version: manifest.version,
    lockfileVersion: 3,
    requires: true,
    packages: Object.fromEntries(
      [...selected.entries()].sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0)),
    ),
  };
}

async function main() {
  const manifestPath = resolve(workspaceRoot, option('manifest'));
  const workspaceLockPath = resolve(workspaceRoot, option('workspace-lock', 'package-lock.json'));
  const outputPath = resolve(workspaceRoot, option('output'));
  const [manifest, workspaceLock] = await Promise.all(
    [manifestPath, workspaceLockPath].map(async (path) => JSON.parse(await readFile(path, 'utf8'))),
  );
  const releaseLock = buildReleaseLock(workspaceLock, manifest);
  await writeFile(outputPath, `${JSON.stringify(releaseLock, null, 2)}\n`, 'utf8');
  console.log(
    `Pinned ${Object.keys(releaseLock.packages).length - 1} package(s) for ${manifest.name}@${manifest.version}.`,
  );
}

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  try {
    if (!option('manifest') || !option('output')) {
      throw new Error(
        'Usage: prepare-kern-release-lock.mjs --manifest=PATH --output=PATH ' +
          '[--workspace-lock=PATH]',
      );
    }
    await main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
