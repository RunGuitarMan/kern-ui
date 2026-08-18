import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function option(name) {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length);
}

function npmVersions(packageName) {
  const result = spawnSync(
    process.platform === 'win32' ? 'npm.cmd' : 'npm',
    ['view', packageName, 'versions', '--json'],
    { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 },
  );
  if (result.status === 0) {
    const value = JSON.parse(result.stdout || '[]');
    return Array.isArray(value) ? value : typeof value === 'string' ? [value] : [];
  }
  const output = `${result.stdout}\n${result.stderr}`;
  if (/E404|404 Not Found|is not in this registry/i.test(output)) return [];
  throw new Error(`Could not query ${packageName}: ${output.trim()}`);
}

export function bootstrapRegistryIssues(packageVersions, version) {
  const issues = [];
  for (const [packageName, versions] of Object.entries(packageVersions)) {
    const unexpected = versions.filter((publishedVersion) => publishedVersion !== version);
    if (unexpected.length > 0) {
      issues.push(
        `${packageName} already has non-bootstrap version(s): ${unexpected.join(', ')}. ` +
          'Use trusted publishing for an existing package.',
      );
    }
  }
  return issues;
}

async function main() {
  const version = option('version');
  const [policy, angularManifest, mcpManifest] = await Promise.all(
    [
      'projects/kern/api/release-policy.json',
      'projects/kern/package.json',
      'projects/kern-mcp/package.json',
    ].map(async (path) => JSON.parse(await readFile(resolve(workspaceRoot, path), 'utf8'))),
  );
  if (!version || version !== policy.bootstrapVersion) {
    throw new Error(
      `Token bootstrap is restricted to the declared first version ${policy.bootstrapVersion}; ` +
        `received ${version ?? '<missing>'}.`,
    );
  }
  if (angularManifest.version !== version || mcpManifest.version !== version) {
    throw new Error('Bootstrap version must match both source package manifests.');
  }
  const packageNames = [policy.packageName, policy.companionPackage.packageName];
  const packageVersions = Object.fromEntries(
    await Promise.all(
      packageNames.map(async (packageName) => [packageName, npmVersions(packageName)]),
    ),
  );
  const issues = bootstrapRegistryIssues(packageVersions, version);
  if (issues.length > 0) throw new Error(issues.join('\n'));
  console.log(
    `npm bootstrap verified for ${version}: registry is empty or contains only resumable exact candidates.`,
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
