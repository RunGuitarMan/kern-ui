import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

function option(name) {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length);
}

function runNpm(arguments_) {
  return spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', arguments_, {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });
}

export function publicationDecision(publishedIntegrity, candidateIntegrity) {
  if (publishedIntegrity === null) return 'publish';
  if (publishedIntegrity === candidateIntegrity) return 'skip';
  throw new Error(
    `The registry already contains different bytes (${publishedIntegrity}); ` +
      `approved candidate integrity is ${candidateIntegrity}.`,
  );
}

export function assertDistTagVersion(tag, taggedVersion, expectedVersion) {
  if (taggedVersion !== expectedVersion) {
    throw new Error(
      `npm dist-tag ${tag} points to ${taggedVersion ?? 'nothing'}, expected ${expectedVersion}.`,
    );
  }
}

export async function tarballIntegrity(path) {
  const hash = createHash('sha512')
    .update(await readFile(path))
    .digest('base64');
  return `sha512-${hash}`;
}

async function publishedIntegrity(packageName, version) {
  const result = runNpm(['view', `${packageName}@${version}`, 'dist.integrity', '--json']);
  if (result.status === 0) {
    const value = JSON.parse(result.stdout || 'null');
    if (typeof value !== 'string' || !value.startsWith('sha512-')) {
      throw new Error(`npm returned an invalid integrity for ${packageName}@${version}.`);
    }
    return value;
  }

  const output = `${result.stdout}\n${result.stderr}`;
  if (/E404|404 Not Found|is not in this registry/i.test(output)) return null;
  throw new Error(`Could not query ${packageName}@${version}: ${output.trim()}`);
}

async function publishedTagVersion(packageName, tag) {
  const result = runNpm(['view', packageName, `dist-tags.${tag}`, '--json']);
  if (result.status !== 0) {
    throw new Error(
      `Could not query npm dist-tag ${tag} for ${packageName}: ` +
        `${result.stdout}\n${result.stderr}`.trim(),
    );
  }
  const value = JSON.parse(result.stdout || 'null');
  return typeof value === 'string' ? value : null;
}

async function main() {
  const packageName = option('package');
  const version = option('version');
  const tarball = option('tarball');
  const tag = option('tag');
  if (!packageName || !version || !tarball || !tag) {
    throw new Error(
      'Usage: publish-kern-release-package.mjs --package=NAME --version=X ' +
        '--tarball=PATH --tag=latest|next',
    );
  }
  if (!['latest', 'next'].includes(tag)) throw new Error(`Unsupported npm tag: ${tag}`);

  const tarballPath = resolve(tarball);
  const candidateIntegrity = await tarballIntegrity(tarballPath);
  const decision = publicationDecision(
    await publishedIntegrity(packageName, version),
    candidateIntegrity,
  );
  if (decision === 'skip') {
    assertDistTagVersion(tag, await publishedTagVersion(packageName, tag), version);
    console.log(`${packageName}@${version} already contains the exact approved tarball; skipping.`);
    return;
  }

  const result = runNpm([
    'publish',
    tarballPath,
    '--access',
    'public',
    '--tag',
    tag,
    '--provenance',
  ]);
  if (result.status !== 0) {
    throw new Error(
      `npm publish failed for ${packageName}@${version}: ${`${result.stdout}\n${result.stderr}`.trim()}`,
    );
  }
  process.stdout.write(result.stdout);
}

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  try {
    await main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
