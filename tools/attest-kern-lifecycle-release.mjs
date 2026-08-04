import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { lt, rcompare, valid as validSemver } from 'semver';

const modulePath = fileURLToPath(import.meta.url);
const workspaceRoot = resolve(dirname(modulePath), '..');
const releasePackages = ['@kern-ui/angular', '@kern-ui/mcp'];
const publicReleaseTags = ['latest', 'next'];
const staticInputPaths = [
  'docs/accessibility/manual-evidence.json',
  'projects/kern/api/deprecations.json',
  'projects/kern/api/entrypoints.json',
  'projects/kern/api/lifecycle-evidence.schema.json',
  'projects/kern/api/lifecycle-evidence.json',
  'projects/kern/api/lifecycle.json',
  'projects/kern/api/release-manifest.schema.json',
  'projects/kern-mcp/package.json',
  'projects/kern/package.json',
  'projects/showcase/catalog-index/src/lib/catalog-index.ts',
  'projects/showcase/src/lib/catalog.ts',
  'projects/showcase/src/lib/generated-component-contract.ts',
];

function option(name, fallback = null) {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length) ?? fallback;
}

function sha256(content) {
  return `sha256-${createHash('sha256').update(content).digest('hex')}`;
}

function exactSemver(value) {
  return validSemver(value) === value;
}

function exactCommit(value) {
  return typeof value === 'string' && /^[0-9a-f]{40}$/.test(value);
}

function workspacePath(path) {
  const absolute = resolve(workspaceRoot, path);
  if (!absolute.startsWith(`${workspaceRoot}${sep}`) || !existsSync(absolute)) {
    throw new Error(`Lifecycle attestation input must be an existing workspace file: ${path}.`);
  }
  return relative(workspaceRoot, absolute).split(sep).join('/');
}

async function readJson(path, label) {
  try {
    return JSON.parse(await readFile(resolve(workspaceRoot, path), 'utf8'));
  } catch (error) {
    throw new Error(
      `${label} could not be read at ${path}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

function checkedOutCommit() {
  const result = spawnSync('git', ['rev-parse', 'HEAD'], {
    cwd: workspaceRoot,
    encoding: 'utf8',
  });
  return result.status === 0 ? result.stdout.trim() : null;
}

function publishedDistTags(packageName) {
  const result = spawnSync(
    process.platform === 'win32' ? 'npm.cmd' : 'npm',
    ['view', packageName, 'dist-tags', '--json'],
    { cwd: workspaceRoot, encoding: 'utf8', maxBuffer: 2 * 1024 * 1024 },
  );
  if (result.status !== 0) {
    const output = `${result.stdout}\n${result.stderr}`;
    if (/E404|404 Not Found|is not in this registry/i.test(output)) return {};
    throw new Error(`Could not query npm dist-tags for ${packageName}: ${output.trim()}`);
  }
  const value = JSON.parse(result.stdout || '{}');
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`npm returned invalid dist-tags for ${packageName}.`);
  }
  return value;
}

export function selectPublishedReleaseBase(distTagsByPackage, candidateVersion) {
  if (!exactSemver(candidateVersion)) {
    throw new Error(`Release version must be exact Semantic Versioning: ${candidateVersion}.`);
  }
  const candidates = [];
  for (const tag of publicReleaseTags) {
    const versions = releasePackages.map(
      (packageName) => distTagsByPackage[packageName]?.[tag] ?? null,
    );
    const configured = versions.filter((version) => version !== null);
    if (configured.length === 0) continue;
    if (configured.length !== releasePackages.length || new Set(configured).size !== 1) {
      throw new Error(
        `Published npm dist-tag ${tag} is not synchronized: ${releasePackages
          .map((packageName, index) => `${packageName}=${versions[index] ?? 'unset'}`)
          .join(', ')}.`,
      );
    }
    const [version] = configured;
    if (!exactSemver(version)) {
      throw new Error(`Published npm dist-tag ${tag} contains invalid version ${version}.`);
    }
    if (lt(version, candidateVersion)) candidates.push(version);
  }
  return [...new Set(candidates)].sort(rcompare)[0] ?? null;
}

function taggedCommit(tag) {
  const result = spawnSync('git', ['rev-parse', '--verify', `${tag}^{commit}`], {
    cwd: workspaceRoot,
    encoding: 'utf8',
  });
  if (result.status !== 0 || !exactCommit(result.stdout.trim())) {
    throw new Error(`Git tag ${tag} does not resolve to an exact commit.`);
  }
  return result.stdout.trim();
}

function packageVersionsAtCommit(commit) {
  return Object.fromEntries(
    [
      ['@kern-ui/angular', 'projects/kern/package.json'],
      ['@kern-ui/mcp', 'projects/kern-mcp/package.json'],
    ].map(([packageName, path]) => {
      const result = spawnSync('git', ['show', `${commit}:${path}`], {
        cwd: workspaceRoot,
        encoding: 'utf8',
        maxBuffer: 1024 * 1024,
      });
      if (result.status !== 0) {
        throw new Error(`Could not read ${path} from release commit ${commit}.`);
      }
      try {
        return [packageName, JSON.parse(result.stdout).version];
      } catch {
        throw new Error(`${path} is not valid JSON at release commit ${commit}.`);
      }
    }),
  );
}

function assertAncestor(ancestor, descendant) {
  const result = spawnSync('git', ['merge-base', '--is-ancestor', ancestor, descendant], {
    cwd: workspaceRoot,
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    throw new Error(`Published release base ${ancestor} is not an ancestor of ${descendant}.`);
  }
}

export function resolvePublishedReleaseBase(candidateVersion, candidateCommit) {
  if (!exactCommit(candidateCommit)) {
    throw new Error(`Release commit must be a full Git SHA: ${candidateCommit}.`);
  }
  const distTagsByPackage = Object.fromEntries(
    releasePackages.map((packageName) => [packageName, publishedDistTags(packageName)]),
  );
  const version = selectPublishedReleaseBase(distTagsByPackage, candidateVersion);
  if (version === null) return null;
  const tag = `v${version}`;
  const commit = taggedCommit(tag);
  assertAncestor(commit, candidateCommit);
  return { version, tag, commit };
}

export async function lifecycleAttestationInputPaths() {
  const [apiConfig, lifecycleEvidence, deprecations] = await Promise.all([
    readJson('projects/kern/api/entrypoints.json', 'API entrypoint configuration'),
    readJson('projects/kern/api/lifecycle-evidence.json', 'Lifecycle evidence'),
    readJson('projects/kern/api/deprecations.json', 'Deprecation registry'),
  ]);
  const paths = new Set(staticInputPaths);
  for (const entrypoint of apiConfig.entrypoints ?? []) {
    if (entrypoint.subpath !== '.' && typeof entrypoint.baseline === 'string') {
      paths.add(`projects/kern/api/${entrypoint.baseline}`);
    }
  }
  for (const artifact of Object.values(lifecycleEvidence.artifacts ?? {})) {
    if (typeof artifact?.path === 'string') paths.add(artifact.path);
  }
  for (const component of lifecycleEvidence.components ?? []) {
    if (typeof component?.source === 'string') paths.add(component.source);
  }
  for (const entry of deprecations.entries ?? []) {
    if (typeof entry?.documentation !== 'string') continue;
    paths.add(entry.documentation.split('#', 1)[0]);
  }
  return [...paths].map(workspacePath).sort();
}

export async function createLifecycleAttestation({ version, tag, commit, base = null }) {
  if (!exactSemver(version))
    throw new Error(`Release version must be exact Semantic Versioning: ${version}.`);
  if (tag !== `v${version}`) throw new Error(`Release tag must be exactly v${version}.`);
  if (!exactCommit(commit)) throw new Error(`Release commit must be a full Git SHA: ${commit}.`);
  if (checkedOutCommit() !== commit) {
    throw new Error(
      `Lifecycle attestation must be created from checked-out release commit ${commit}.`,
    );
  }
  if (
    base !== null &&
    (!exactSemver(base.version) || base.tag !== `v${base.version}` || !exactCommit(base.commit))
  ) {
    throw new Error('Lifecycle attestation base must contain an exact version, tag, and commit.');
  }
  if (base) assertAncestor(base.commit, commit);
  const inputs = await Promise.all(
    (await lifecycleAttestationInputPaths()).map(async (path) => ({
      path,
      sha256: sha256(await readFile(resolve(workspaceRoot, path))),
    })),
  );
  return {
    schemaVersion: 1,
    candidate: { version, tag, commit },
    base,
    inputs,
  };
}

export async function validateLifecycleAttestation(
  attestation,
  { version, tag, commit },
  operations = { assertAncestor, checkedOutCommit, packageVersionsAtCommit, taggedCommit },
) {
  const issues = [];
  if (!attestation || attestation.schemaVersion !== 1) {
    return ['Lifecycle attestation must use schemaVersion 1.'];
  }
  const candidate = attestation.candidate;
  const candidateIsExact =
    candidate &&
    exactSemver(candidate.version) &&
    candidate.tag === `v${candidate.version}` &&
    exactCommit(candidate.commit);
  if (!candidateIsExact) {
    issues.push('Lifecycle attestation candidate must contain an exact version, tag, and commit.');
  }
  if (candidate?.version !== version || candidate?.tag !== tag || candidate?.commit !== commit) {
    issues.push('Lifecycle attestation candidate identity does not match the requested release.');
  }
  if (operations.checkedOutCommit() !== commit) {
    issues.push(`Checked-out source does not match lifecycle attestation commit ${commit}.`);
  }
  if (candidateIsExact) {
    try {
      const tagged = operations.taggedCommit(candidate.tag);
      if (tagged !== candidate.commit) {
        issues.push(
          `Lifecycle attestation candidate tag ${candidate.tag} resolves to ${tagged}, ` +
            `not ${candidate.commit}.`,
        );
      }
      const versions = operations.packageVersionsAtCommit(candidate.commit);
      for (const packageName of releasePackages) {
        if (versions[packageName] !== candidate.version) {
          issues.push(
            `Lifecycle attestation candidate commit contains ${packageName}@${String(
              versions[packageName],
            )}, expected ${candidate.version}.`,
          );
        }
      }
    } catch (error) {
      issues.push(error instanceof Error ? error.message : String(error));
    }
  }
  const base = attestation.base;
  if (
    base !== null &&
    (!base ||
      !exactSemver(base.version) ||
      base.tag !== `v${base.version}` ||
      !exactCommit(base.commit))
  ) {
    issues.push(
      'Lifecycle attestation base must be null or contain an exact version, tag, and commit.',
    );
  } else if (base) {
    if (!lt(base.version, version)) {
      issues.push('Lifecycle attestation base version must precede the candidate version.');
    }
    try {
      const tagged = operations.taggedCommit(base.tag);
      if (tagged !== base.commit) {
        issues.push(
          `Lifecycle attestation base tag ${base.tag} resolves to ${tagged}, not ${base.commit}.`,
        );
      }
      const versions = operations.packageVersionsAtCommit(base.commit);
      for (const packageName of releasePackages) {
        if (versions[packageName] !== base.version) {
          issues.push(
            `Lifecycle attestation base commit contains ${packageName}@${String(
              versions[packageName],
            )}, expected ${base.version}.`,
          );
        }
      }
      operations.assertAncestor(base.commit, commit);
    } catch (error) {
      issues.push(error instanceof Error ? error.message : String(error));
    }
  }
  const expectedPaths = await lifecycleAttestationInputPaths();
  const actualInputs = attestation.inputs;
  if (!Array.isArray(actualInputs)) {
    issues.push('Lifecycle attestation requires an inputs array.');
    return issues;
  }
  const actualPaths = actualInputs.map((input) => input?.path);
  if (
    actualInputs.length !== expectedPaths.length ||
    actualPaths.some((path, index) => path !== expectedPaths[index])
  ) {
    issues.push('Lifecycle attestation inputs do not exactly cover the lifecycle verifier inputs.');
  }
  for (const input of actualInputs) {
    if (!input || typeof input.path !== 'string' || typeof input.sha256 !== 'string') {
      issues.push('Lifecycle attestation input is malformed.');
      continue;
    }
    try {
      const actual = sha256(await readFile(resolve(workspaceRoot, workspacePath(input.path))));
      if (input.sha256 !== actual) {
        issues.push(`Lifecycle attestation input ${input.path} does not match checked-out source.`);
      }
    } catch (error) {
      issues.push(error instanceof Error ? error.message : String(error));
    }
  }
  return issues;
}

async function main() {
  const version = option('version');
  const tag = option('tag');
  const commit = option('commit');
  const output = option('output');
  if (!version || !tag || !commit || !output) {
    throw new Error(
      'Usage: attest-kern-lifecycle-release.mjs --version=X --tag=vX --commit=SHA --output=PATH',
    );
  }
  const base = resolvePublishedReleaseBase(version, commit);
  const attestation = await createLifecycleAttestation({ version, tag, commit, base });
  const validationIssues = await validateLifecycleAttestation(attestation, {
    version,
    tag,
    commit,
  });
  if (validationIssues.length > 0) {
    throw new Error(`Lifecycle attestation is invalid: ${validationIssues.join('; ')}`);
  }
  const outputPath = resolve(workspaceRoot, output);
  if (!outputPath.startsWith(`${workspaceRoot}${sep}`)) {
    throw new Error('Lifecycle attestation output must remain inside the workspace.');
  }
  await writeFile(outputPath, `${JSON.stringify(attestation, null, 2)}\n`, 'utf8');
  console.log(
    `Lifecycle release attestation written: ${version} from ${base ? `${base.tag}@${base.commit}` : 'no prior public release'}.`,
  );
}

if (resolve(process.argv[1] ?? '') === modulePath) {
  try {
    await main();
  } catch (error) {
    console.error(
      `Kern lifecycle attestation failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exitCode = 1;
  }
}
