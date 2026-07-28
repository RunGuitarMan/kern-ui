import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';

const workspaceRoot = resolve(import.meta.dirname, '..');
const configPath = join(workspaceRoot, 'projects/kern/api/runtime-entrypoints.json');
const emittedExtensions = [
  '.js',
  '.js.map',
  '.mjs',
  '.mjs.map',
  '.cjs',
  '.cjs.map',
  '.d.ts',
  '.d.ts.map',
];

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

async function main() {
  if (!existsSync(configPath)) {
    throw new Error('projects/kern/api/runtime-entrypoints.json is missing.');
  }
  const config = JSON.parse(await readFile(configPath, 'utf8'));
  if (
    !config ||
    typeof config.primarySourceRoot !== 'string' ||
    !Array.isArray(config.entrypoints) ||
    !config.entrypoints.every(
      (entrypoint) => entrypoint && typeof entrypoint.sourceRoot === 'string',
    )
  ) {
    throw new Error('Invalid projects/kern/api/runtime-entrypoints.json source-root structure.');
  }

  const sourceRoots = [
    config.primarySourceRoot,
    ...config.entrypoints.map((entrypoint) => entrypoint.sourceRoot),
  ];
  if (new Set(sourceRoots).size !== sourceRoots.length) {
    throw new Error('Kern source-pollution roots must be unique.');
  }

  const emittedArtifacts = (
    await Promise.all(
      sourceRoots.map(async (sourceRoot) => {
        const absoluteRoot = resolve(workspaceRoot, sourceRoot);
        if (!existsSync(absoluteRoot)) {
          throw new Error(`Configured source root is missing: ${sourceRoot}.`);
        }
        return filesRecursively(absoluteRoot);
      }),
    )
  )
    .flat()
    .filter((path) => emittedExtensions.some((extension) => path.endsWith(extension)));

  if (emittedArtifacts.length) {
    throw new Error(
      `Package build emitted compiled artifacts into source:\n- ${emittedArtifacts
        .map((path) => relative(workspaceRoot, path))
        .join('\n- ')}`,
    );
  }

  console.log(`Kern source trees verified clean: ${sourceRoots.length} physical roots.`);
}

try {
  await main();
} catch (error) {
  console.error(
    `Kern source-pollution verification failed: ${
      error instanceof Error ? error.message : String(error)
    }`,
  );
  process.exitCode = 1;
}
