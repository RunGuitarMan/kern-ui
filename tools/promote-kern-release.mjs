import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { gt, prerelease, valid } from 'semver';

import {
  assertDistTagEventually,
  assertRegistryCandidate,
  publishedIntegrity,
  publishedTagVersion,
  removeDistTag,
  setDistTag,
  tarballIntegrity,
} from './publish-kern-release-package.mjs';

const registryOperations = {
  assertDistTagEventually,
  removeDistTag,
  setDistTag,
};

function option(name) {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length);
}

export function rollbackPlan(changedCandidates) {
  return [...changedCandidates].reverse().map(({ packageName, previousVersion }) => ({
    action: previousVersion === null ? 'remove' : 'restore',
    packageName,
    version: previousVersion,
  }));
}

export function assertPromotionAdvance(version, previousVersion, publicTag) {
  if (valid(version) !== version) {
    throw new Error(`Promotion version must be exact Semantic Versioning: ${version}.`);
  }
  if (publicTag === 'latest' && prerelease(version) !== null) {
    throw new Error(`Prerelease ${version} cannot be promoted under latest.`);
  }
  if (previousVersion === null || previousVersion === version) return;
  if (valid(previousVersion) !== previousVersion) {
    throw new Error(`npm dist-tag ${publicTag} contains invalid version ${previousVersion}.`);
  }
  if (!gt(version, previousVersion)) {
    throw new Error(
      `Refusing to move npm dist-tag ${publicTag} backwards from ${previousVersion} to ${version}.`,
    );
  }
}

async function rollback(changedCandidates, publicTag, operations) {
  const failures = [];
  for (const operation of rollbackPlan(changedCandidates)) {
    try {
      if (operation.action === 'remove') {
        await operations.removeDistTag(operation.packageName, publicTag);
        await operations.assertDistTagEventually(operation.packageName, publicTag, null);
      } else {
        await operations.setDistTag(operation.packageName, operation.version, publicTag);
        await operations.assertDistTagEventually(
          operation.packageName,
          publicTag,
          operation.version,
        );
      }
    } catch (error) {
      failures.push(error instanceof Error ? error.message : String(error));
    }
  }
  if (failures.length > 0)
    throw new Error(`Public dist-tag rollback failed: ${failures.join('; ')}`);
}

/** Restores both staging tags and exercises the exact token capability used by promotion. */
export async function verifyDistTagWriteAccess(
  candidates,
  version,
  stagingTag,
  operations = registryOperations,
) {
  for (const candidate of candidates) {
    await operations.setDistTag(candidate.packageName, version, stagingTag);
    await operations.assertDistTagEventually(candidate.packageName, stagingTag, version);
  }
}

/**
 * Promotes both public tags as one compensating transaction.
 *
 * Rollback intent is recorded before each external mutation because a failed npm process can be
 * ambiguous: the registry may have committed the tag before the client observed a timeout.
 */
export async function promotePublicTags(
  candidates,
  version,
  publicTag,
  operations = registryOperations,
) {
  const changedCandidates = [];
  try {
    for (const candidate of candidates) {
      if (candidate.previousVersion === version) continue;
      changedCandidates.push(candidate);
      await operations.setDistTag(candidate.packageName, version, publicTag);
      await operations.assertDistTagEventually(candidate.packageName, publicTag, version);
    }
    for (const candidate of candidates) {
      await operations.assertDistTagEventually(candidate.packageName, publicTag, version);
    }
  } catch (error) {
    try {
      await rollback(changedCandidates, publicTag, operations);
    } catch (rollbackError) {
      throw new AggregateError([error, rollbackError], 'Promotion and rollback both failed.');
    }
    throw error;
  }
}

async function main() {
  const version = option('version');
  const publicTag = option('tag');
  const stagingTag = option('staging-tag');
  const angularTarball = option('angular-tarball');
  const mcpTarball = option('mcp-tarball');
  if (!version || !publicTag || !stagingTag || !angularTarball || !mcpTarball) {
    throw new Error(
      'Usage: promote-kern-release.mjs --version=X --tag=latest|next ' +
        '--staging-tag=kern-staging --angular-tarball=PATH --mcp-tarball=PATH',
    );
  }
  if (!['latest', 'next'].includes(publicTag)) {
    throw new Error(`Unsupported public npm tag: ${publicTag}`);
  }
  if (!/^kern-staging(?:-[a-z0-9-]+)?$/.test(stagingTag)) {
    throw new Error(`Unsupported npm staging tag: ${stagingTag}`);
  }

  const candidates = await Promise.all(
    [
      { packageName: '@kern-ui/angular', tarball: angularTarball },
      { packageName: '@kern-ui/mcp', tarball: mcpTarball },
    ].map(async (candidate) => ({
      ...candidate,
      integrity: await tarballIntegrity(resolve(candidate.tarball)),
    })),
  );

  for (const candidate of candidates) {
    const registryIntegrity = await publishedIntegrity(candidate.packageName, version);
    if (registryIntegrity !== candidate.integrity) {
      throw new Error(
        `${candidate.packageName}@${version} registry integrity changed after staging verification.`,
      );
    }
    candidate.previousVersion = await publishedTagVersion(candidate.packageName, publicTag);
    assertPromotionAdvance(version, candidate.previousVersion, publicTag);
  }

  await verifyDistTagWriteAccess(candidates, version, stagingTag);
  for (const candidate of candidates) {
    await assertRegistryCandidate(candidate.packageName, version, candidate.integrity, stagingTag);
  }
  await promotePublicTags(candidates, version, publicTag);
  console.log(`Promoted both Kern packages to ${publicTag}@${version}.`);
}

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  try {
    await main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
