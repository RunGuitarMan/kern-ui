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

function npmFailure(message, result) {
  return new Error(`${message}: ${`${result.stdout}\n${result.stderr}`.trim()}`);
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

export async function publishedIntegrity(packageName, version) {
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

export async function publishedTagVersion(packageName, tag) {
  const result = runNpm(['view', packageName, `dist-tags.${tag}`, '--json']);
  if (result.status !== 0) {
    const output = `${result.stdout}\n${result.stderr}`;
    if (/E404|404 Not Found|is not in this registry/i.test(output)) return null;
    throw new Error(`Could not query npm dist-tag ${tag} for ${packageName}: ${output.trim()}`);
  }
  const value = JSON.parse(result.stdout || 'null');
  return typeof value === 'string' ? value : null;
}

export async function assertDistTagEventually(packageName, tag, expectedVersion) {
  let actualVersion = null;
  for (let attempt = 0; attempt < 10; attempt += 1) {
    actualVersion = await publishedTagVersion(packageName, tag);
    if (actualVersion === expectedVersion) return;
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 2_000));
  }
  assertDistTagVersion(tag, actualVersion, expectedVersion);
}

export async function assertRegistryCandidate(packageName, version, integrity, tag) {
  let state = '';
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const [actualIntegrity, actualVersion] = await Promise.all([
      publishedIntegrity(packageName, version),
      publishedTagVersion(packageName, tag),
    ]);
    state = `integrity ${actualIntegrity ?? 'missing'}, ${tag} ${actualVersion ?? 'unset'}`;
    if (actualIntegrity === integrity && actualVersion === version) return;
    if (actualIntegrity !== null && actualIntegrity !== integrity) {
      publicationDecision(actualIntegrity, integrity);
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 2_000));
  }
  throw new Error(`${packageName}@${version} did not reach the expected registry state: ${state}.`);
}

export async function setDistTag(packageName, version, tag) {
  const result = runNpm(['dist-tag', 'add', `${packageName}@${version}`, tag]);
  if (result.status !== 0) throw npmFailure(`Could not set ${packageName} dist-tag ${tag}`, result);
}

export async function removeDistTag(packageName, tag) {
  const result = runNpm(['dist-tag', 'rm', packageName, tag]);
  if (result.status !== 0) {
    throw npmFailure(`Could not remove ${packageName} dist-tag ${tag}`, result);
  }
}

async function main() {
  const packageName = option('package');
  const version = option('version');
  const tarball = option('tarball');
  const stagingTag = option('staging-tag');
  if (!packageName || !version || !tarball || !stagingTag) {
    throw new Error(
      'Usage: publish-kern-release-package.mjs --package=NAME --version=X ' +
        '--tarball=PATH --staging-tag=kern-staging',
    );
  }
  if (!/^kern-staging(?:-[a-z0-9-]+)?$/.test(stagingTag)) {
    throw new Error(`Unsupported npm staging tag: ${stagingTag}`);
  }

  const tarballPath = resolve(tarball);
  const candidateIntegrity = await tarballIntegrity(tarballPath);
  const decision = publicationDecision(
    await publishedIntegrity(packageName, version),
    candidateIntegrity,
  );
  if (decision === 'skip') {
    console.log(`${packageName}@${version} already contains the exact approved tarball.`);
    return;
  }

  const result = runNpm([
    'publish',
    tarballPath,
    '--access',
    'public',
    '--tag',
    stagingTag,
    '--provenance',
  ]);
  if (result.status !== 0) {
    throw npmFailure(`npm publish failed for ${packageName}@${version}`, result);
  }
  await assertRegistryCandidate(packageName, version, candidateIntegrity, stagingTag);
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
