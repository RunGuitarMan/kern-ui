import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const defaultArtifactDirectory = resolve(workspaceRoot, 'release');
const sourceManifestPath = resolve(workspaceRoot, 'projects/kern/package.json');
const builtManifestPath = resolve(workspaceRoot, 'dist/kern/package.json');
const companionSourceManifestPath = resolve(workspaceRoot, 'projects/kern-mcp/package.json');
const companionBuiltManifestPath = resolve(workspaceRoot, 'dist/kern-mcp/package.json');
const policyPath = resolve(workspaceRoot, 'projects/kern/api/release-policy.json');
const versionedDocsVerifierPath = resolve(workspaceRoot, 'tools/verify-kern-versioned-docs.mjs');
const issues = [];

function option(name, fallback = null) {
  const prefix = `--${name}=`;
  const argument = process.argv.find((value) => value.startsWith(prefix));
  return argument ? argument.slice(prefix.length) : fallback;
}

function report(message) {
  issues.push(message);
}

async function readJson(path, label) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    throw new Error(
      `${label} could not be read at ${path}: ${error instanceof Error ? error.message : error}`,
    );
  }
}

function semver(value) {
  return (
    typeof value === 'string' &&
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?$/.test(value)
  );
}

function packagePurl(packageName, version) {
  return `pkg:npm/${packageName.replace('@', '%40')}@${version}`;
}

function packageDefinitions(policy) {
  const companion = policy.companionPackage;
  return [
    {
      builtManifestPath,
      dependencies: policy.dependencies,
      directory: 'projects/kern',
      key: 'angular',
      packageName: policy.packageName,
      peerDependencies: policy.peerDependencies,
      peerDependenciesMeta: policy.peerDependenciesMeta ?? {},
      slug: 'kern-ui-angular',
      sourceManifestPath,
    },
    {
      builtManifestPath: companionBuiltManifestPath,
      dependencies: companion.dependencies,
      directory: companion.directory,
      key: 'mcp',
      packageName: companion.packageName,
      peerDependencies: companion.peerDependencies ?? {},
      peerDependenciesMeta: companion.peerDependenciesMeta ?? {},
      slug: 'kern-ui-mcp',
      sourceManifestPath: companionSourceManifestPath,
    },
  ];
}

function validateManifest(manifest, policy, packageDefinition, label, version) {
  if (manifest.name !== packageDefinition.packageName) {
    report(`${label} name must be ${packageDefinition.packageName}.`);
  }
  if (manifest.version !== version) report(`${label} version must be ${version}.`);
  if (manifest.license !== policy.license) report(`${label} license must be ${policy.license}.`);
  if (manifest.repository?.url !== `git+${policy.repository}`) {
    report(`${label} repository URL must be git+${policy.repository}.`);
  }
  if (manifest.repository?.directory !== packageDefinition.directory) {
    report(`${label} repository directory must be ${packageDefinition.directory}.`);
  }
  if (manifest.homepage !== 'https://github.com/RunGuitarMan/kern-ui#readme') {
    report(`${label} homepage is missing or unexpected.`);
  }
  if (manifest.bugs?.url !== 'https://github.com/RunGuitarMan/kern-ui/issues') {
    report(`${label} bugs URL is missing or unexpected.`);
  }
  if (
    manifest.publishConfig?.access !== 'public' ||
    manifest.publishConfig?.registry !== policy.registry ||
    manifest.publishConfig?.provenance !== true
  ) {
    report(`${label} publishConfig must require public npm provenance publication.`);
  }
  if (!isDeepStrictEqual(manifest.dependencies ?? {}, packageDefinition.dependencies)) {
    report(`${label} dependencies differ from release-policy.json.`);
  }
  if (!isDeepStrictEqual(manifest.peerDependencies ?? {}, packageDefinition.peerDependencies)) {
    report(`${label} peerDependencies differ from release-policy.json.`);
  }
  if (
    !isDeepStrictEqual(manifest.peerDependenciesMeta ?? {}, packageDefinition.peerDependenciesMeta)
  ) {
    report(`${label} peerDependenciesMeta differs from release-policy.json.`);
  }
  for (const forbidden of ['devDependencies', 'bundledDependencies', 'bundleDependencies']) {
    if (forbidden in manifest) report(`${label} must not contain ${forbidden}.`);
  }
  if (manifest.private === true) report(`${label} must not be private.`);
}

function tarballManifest(path) {
  const result = spawnSync('tar', ['-xOf', path, 'package/package.json'], {
    encoding: 'utf8',
    maxBuffer: 2 * 1024 * 1024,
  });
  if (result.status !== 0) {
    throw new Error(`Could not read package/package.json from ${path}: ${result.stderr.trim()}`);
  }
  return JSON.parse(result.stdout);
}

function licenseExpressions(component) {
  return (component.licenses ?? []).flatMap((entry) => {
    if (typeof entry.expression === 'string') return [entry.expression];
    if (typeof entry.license?.id === 'string') return [entry.license.id];
    if (typeof entry.license?.name === 'string') return [entry.license.name];
    return [];
  });
}

function validateSbom(sbom, policy, packageDefinition, version) {
  if (sbom.bomFormat !== policy.sbom.format) {
    report(`SBOM format must be ${policy.sbom.format}.`);
  }
  if (!policy.sbom.specVersions.includes(sbom.specVersion)) {
    report(`SBOM specVersion ${sbom.specVersion} is not allowed by release policy.`);
  }
  if (
    !(sbom.metadata?.tools ?? []).some(
      (tool) =>
        (tool.name === policy.sbom.generator || tool.vendor === policy.sbom.generator) &&
        typeof tool.version === 'string',
    )
  ) {
    report(`SBOM must identify ${policy.sbom.generator} and its version as the generator.`);
  }
  const root = sbom.metadata?.component;
  if (
    root?.name !== packageDefinition.packageName ||
    root?.version !== version ||
    root?.type !== 'library' ||
    root?.purl !== packagePurl(packageDefinition.packageName, version)
  ) {
    report(
      `${packageDefinition.packageName} SBOM root component does not identify the exact release package.`,
    );
  }

  const allowedLicenses = new Set(policy.allowedLicenses);
  const componentNames = new Set();
  for (const component of sbom.components ?? []) {
    if (typeof component.name !== 'string' || typeof component.version !== 'string') {
      report('Every SBOM component requires a name and version.');
      continue;
    }
    componentNames.add(component.name);
    const licenses = licenseExpressions(component);
    if (licenses.length === 0) {
      report(`SBOM component ${component.name}@${component.version} has no declared license.`);
    }
    for (const license of licenses) {
      if (!allowedLicenses.has(license)) {
        report(
          `SBOM component ${component.name}@${component.version} uses unapproved license ${license}.`,
        );
      }
    }
  }
  const requiredPeers = Object.keys(packageDefinition.peerDependencies).filter(
    (name) => packageDefinition.peerDependenciesMeta[name]?.optional !== true,
  );
  for (const dependency of [...Object.keys(packageDefinition.dependencies), ...requiredPeers]) {
    if (!componentNames.has(dependency)) {
      report(
        `${packageDefinition.packageName} SBOM does not contain declared package dependency ${dependency}.`,
      );
    }
  }
}

function normalizeSbom(sbom, packageDefinition, version) {
  const normalized = structuredClone(sbom);
  normalized.metadata ??= {};
  normalized.metadata.lifecycles = [{ phase: 'post-build' }];
  normalized.metadata.component ??= {};
  normalized.metadata.component.name = packageDefinition.packageName;
  normalized.metadata.component.version = version;
  normalized.metadata.component.type = 'library';
  normalized.metadata.component['bom-ref'] = `${packageDefinition.packageName}@${version}`;
  normalized.metadata.component.purl = packagePurl(packageDefinition.packageName, version);
  return normalized;
}

async function sha256(path) {
  const hash = createHash('sha256');
  hash.update(await readFile(path));
  return hash.digest('hex');
}

async function validateInputs() {
  const command = process.argv[2];
  if (!['prepare', 'verify'].includes(command)) {
    throw new Error(
      'Usage: node tools/verify-kern-release-artifacts.mjs <prepare|verify> ' +
        '--version=X --tag=vX --commit=SHA --npm-tag=latest|next --artifact-dir=PATH',
    );
  }
  const version = option('version');
  const tag = option('tag');
  const commit = option('commit');
  const npmTag = option('npm-tag');
  const artifactDirectory = resolve(
    workspaceRoot,
    option('artifact-dir', defaultArtifactDirectory),
  );
  if (!semver(version)) report(`Invalid release version "${version}".`);
  if (tag !== `v${version}`) report(`Release tag must be exactly v${version}.`);
  if (!/^[0-9a-f]{40}$/.test(commit ?? '')) report('Release commit must be a full Git SHA.');
  if (!['latest', 'next'].includes(npmTag)) report('npm tag must be latest or next.');
  if (version?.includes('-') && npmTag === 'latest') {
    report('A prerelease version must not be published under the latest npm tag.');
  }
  return { artifactDirectory, command, commit, npmTag, tag, version };
}

async function validateArtifacts(context, policy, sourceManifests, builtManifests) {
  const docsArchiveName = `kern-docs-${context.version}.tgz`;
  const docsManifestName = `kern-docs-${context.version}.manifest.json`;
  const docsArchivePath = resolve(context.artifactDirectory, docsArchiveName);
  const docsManifestPath = resolve(context.artifactDirectory, docsManifestName);
  if (!existsSync(docsArchivePath)) {
    throw new Error(`Versioned documentation archive is missing: ${docsArchivePath}`);
  }
  if (!existsSync(docsManifestPath)) {
    throw new Error(`Versioned documentation manifest is missing: ${docsManifestPath}`);
  }

  const docsVerification = spawnSync(
    process.execPath,
    [
      versionedDocsVerifierPath,
      'verify',
      `--version=${context.version}`,
      `--tag=${context.tag}`,
      `--commit=${context.commit}`,
      `--base-path=/versions/${context.version}/`,
      `--artifact-dir=${context.artifactDirectory}`,
    ],
    {
      cwd: workspaceRoot,
      encoding: 'utf8',
      maxBuffer: 4 * 1024 * 1024,
    },
  );
  if (docsVerification.status !== 0) {
    report(
      `Versioned documentation verification failed: ${
        docsVerification.stderr.trim() || docsVerification.stdout.trim()
      }`,
    );
  }

  const packages = [];
  for (const packageDefinition of packageDefinitions(policy)) {
    const tarballName = `${packageDefinition.slug}-${context.version}.tgz`;
    const sbomName = `${packageDefinition.slug}-${context.version}.cdx.json`;
    const tarballPath = resolve(context.artifactDirectory, tarballName);
    const sbomPath = resolve(context.artifactDirectory, sbomName);
    if (!existsSync(tarballPath)) throw new Error(`Release tarball is missing: ${tarballPath}`);
    if (!existsSync(sbomPath)) throw new Error(`Release SBOM is missing: ${sbomPath}`);

    const sourceManifest = sourceManifests.get(packageDefinition.key);
    const builtManifest = builtManifests?.get(packageDefinition.key);
    const packedManifest = tarballManifest(tarballPath);
    const packageLabel = packageDefinition.packageName;
    validateManifest(
      sourceManifest,
      policy,
      packageDefinition,
      `${packageLabel} source package manifest`,
      context.version,
    );
    validateManifest(
      packedManifest,
      policy,
      packageDefinition,
      `${packageLabel} packed package manifest`,
      context.version,
    );
    if (builtManifest) {
      validateManifest(
        builtManifest,
        policy,
        packageDefinition,
        `${packageLabel} built package manifest`,
        context.version,
      );
      if (!isDeepStrictEqual(builtManifest, packedManifest)) {
        report(
          `${packageLabel} packed package.json is not byte-equivalent in meaning to its built package.json.`,
        );
      }
    }

    let sbom = await readJson(sbomPath, `${packageLabel} release SBOM`);
    if (context.command === 'prepare') {
      sbom = normalizeSbom(sbom, packageDefinition, context.version);
      await writeFile(sbomPath, `${JSON.stringify(sbom, null, 2)}\n`, 'utf8');
    }
    validateSbom(sbom, policy, packageDefinition, context.version);
    packages.push({
      packageDefinition,
      sbomName,
      sbomPath,
      tarballName,
      tarballPath,
    });
  }

  return {
    docsArchiveName,
    docsArchivePath,
    docsManifestName,
    docsManifestPath,
    packages,
  };
}

async function prepare(context, policy, artifacts) {
  const packageArtifacts = await Promise.all(
    artifacts.packages.map(async (artifact) => ({
      ...artifact,
      sbomHash: await sha256(artifact.sbomPath),
      tarballHash: await sha256(artifact.tarballPath),
    })),
  );
  const docsArchiveHash = await sha256(artifacts.docsArchivePath);
  const docsManifestHash = await sha256(artifacts.docsManifestPath);
  const manifestPath = resolve(context.artifactDirectory, 'release-manifest.json');
  const manifest = {
    schemaVersion: 2,
    release: {
      version: context.version,
      tag: context.tag,
      npmDistTag: context.npmTag,
    },
    packages: packageArtifacts.map((artifact) => ({
      name: artifact.packageDefinition.packageName,
      version: context.version,
      tarball: {
        file: artifact.tarballName,
        sha256: artifact.tarballHash,
      },
      sbom: {
        file: artifact.sbomName,
        format: policy.sbom.format,
        sha256: artifact.sbomHash,
      },
    })),
    source: {
      repository: policy.repository,
      commit: context.commit,
      workflowRunId: process.env.GITHUB_RUN_ID ?? null,
    },
    artifacts: {
      documentation: {
        archive: {
          file: artifacts.docsArchiveName,
          format: 'tar+gzip',
          sha256: docsArchiveHash,
        },
        manifest: {
          file: artifacts.docsManifestName,
          schemaVersion: 1,
          sha256: docsManifestHash,
        },
        mountPath: `/versions/${context.version}/`,
      },
    },
    policy: {
      file: 'projects/kern/api/release-policy.json',
      auditLevel: policy.auditLevel,
      allowedLicenses: policy.allowedLicenses,
    },
  };
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  const manifestHash = await sha256(manifestPath);
  const checksums = [
    `${manifestHash}  release-manifest.json`,
    `${docsArchiveHash}  ${artifacts.docsArchiveName}`,
    `${docsManifestHash}  ${artifacts.docsManifestName}`,
    ...packageArtifacts.flatMap((artifact) => [
      `${artifact.sbomHash}  ${artifact.sbomName}`,
      `${artifact.tarballHash}  ${artifact.tarballName}`,
    ]),
  ].sort();
  await writeFile(
    resolve(context.artifactDirectory, 'SHA256SUMS'),
    `${checksums.join('\n')}\n`,
    'utf8',
  );
}

async function verify(context, policy, artifacts) {
  const manifestPath = resolve(context.artifactDirectory, 'release-manifest.json');
  const checksumsPath = resolve(context.artifactDirectory, 'SHA256SUMS');
  const manifest = await readJson(manifestPath, 'Release manifest');
  if (
    manifest.schemaVersion !== 2 ||
    manifest.release?.version !== context.version ||
    manifest.release?.tag !== context.tag ||
    manifest.release?.npmDistTag !== context.npmTag ||
    manifest.source?.repository !== policy.repository ||
    manifest.source?.commit !== context.commit
  ) {
    report('Release manifest does not match the requested packages, tag, npm tag, and commit.');
  }

  const expectedHashes = new Map([
    ['release-manifest.json', await sha256(manifestPath)],
    [artifacts.docsArchiveName, await sha256(artifacts.docsArchivePath)],
    [artifacts.docsManifestName, await sha256(artifacts.docsManifestPath)],
    ...(await Promise.all(
      artifacts.packages.flatMap((artifact) => [
        sha256(artifact.sbomPath).then((hash) => [artifact.sbomName, hash]),
        sha256(artifact.tarballPath).then((hash) => [artifact.tarballName, hash]),
      ]),
    )),
  ]);
  const checksumLines = (await readFile(checksumsPath, 'utf8')).trim().split('\n');
  const recordedHashes = new Map(
    checksumLines.map((line) => {
      const match = /^([0-9a-f]{64}) {2}(.+)$/.exec(line);
      if (!match) throw new Error(`Invalid SHA256SUMS line: ${line}`);
      return [match[2], match[1]];
    }),
  );
  if (
    checksumLines.length !== recordedHashes.size ||
    !isDeepStrictEqual(expectedHashes, recordedHashes)
  ) {
    report(
      'SHA256SUMS does not exactly match the release manifest, documentation, SBOMs, and npm tarballs.',
    );
  }
  const expectedPackages = artifacts.packages.map((artifact) => ({
    name: artifact.packageDefinition.packageName,
    version: context.version,
    tarball: {
      file: artifact.tarballName,
      sha256: expectedHashes.get(artifact.tarballName),
    },
    sbom: {
      file: artifact.sbomName,
      format: policy.sbom.format,
      sha256: expectedHashes.get(artifact.sbomName),
    },
  }));
  if (
    !isDeepStrictEqual(manifest.packages, expectedPackages) ||
    manifest.artifacts?.documentation?.archive?.file !== artifacts.docsArchiveName ||
    manifest.artifacts?.documentation?.archive?.format !== 'tar+gzip' ||
    manifest.artifacts?.documentation?.archive?.sha256 !==
      expectedHashes.get(artifacts.docsArchiveName) ||
    manifest.artifacts?.documentation?.manifest?.file !== artifacts.docsManifestName ||
    manifest.artifacts?.documentation?.manifest?.schemaVersion !== 1 ||
    manifest.artifacts?.documentation?.manifest?.sha256 !==
      expectedHashes.get(artifacts.docsManifestName) ||
    manifest.artifacts?.documentation?.mountPath !== `/versions/${context.version}/`
  ) {
    report('Release manifest artifact identities and hashes do not match downloaded evidence.');
  }

  const files = (await readdir(context.artifactDirectory)).sort();
  const expectedFiles = [
    'SHA256SUMS',
    artifacts.docsArchiveName,
    artifacts.docsManifestName,
    ...artifacts.packages.flatMap((artifact) => [artifact.sbomName, artifact.tarballName]),
    'release-manifest.json',
  ].sort();
  if (!isDeepStrictEqual(files, expectedFiles)) {
    report(`Release artifact directory must contain only: ${expectedFiles.join(', ')}.`);
  }
}

async function main() {
  const context = await validateInputs();
  const policy = await readJson(policyPath, 'Release policy');
  if (policy.schemaVersion !== 1) report('Release policy schemaVersion must be 1.');
  if (
    typeof policy.companionPackage?.packageName !== 'string' ||
    typeof policy.companionPackage?.directory !== 'string' ||
    !policy.companionPackage?.dependencies
  ) {
    throw new Error('Release policy requires a complete companionPackage contract.');
  }
  if (!Array.isArray(policy.allowedLicenses) || policy.allowedLicenses.length === 0) {
    report('Release policy requires an explicit allowedLicenses list.');
  }
  const packageDefinitionList = packageDefinitions(policy);
  const sourceManifests = new Map(
    await Promise.all(
      packageDefinitionList.map(async (packageDefinition) => [
        packageDefinition.key,
        await readJson(
          packageDefinition.sourceManifestPath,
          `${packageDefinition.packageName} source package manifest`,
        ),
      ]),
    ),
  );
  const builtManifests =
    context.command === 'prepare'
      ? new Map(
          await Promise.all(
            packageDefinitionList.map(async (packageDefinition) => [
              packageDefinition.key,
              await readJson(
                packageDefinition.builtManifestPath,
                `${packageDefinition.packageName} built package manifest`,
              ),
            ]),
          ),
        )
      : null;
  const artifacts = await validateArtifacts(context, policy, sourceManifests, builtManifests);
  if (context.command === 'prepare' && issues.length === 0) {
    await prepare(context, policy, artifacts);
  } else if (context.command === 'verify') {
    await verify(context, policy, artifacts);
  }

  if (issues.length) {
    console.error(`Kern release artifact verification failed:\n- ${issues.join('\n- ')}`);
    process.exitCode = 1;
    return;
  }
  console.log(
    `Kern release artifacts ${context.command === 'prepare' ? 'prepared' : 'verified'}: ` +
      `${packageDefinitionList.map(({ packageName }) => `${packageName}@${context.version}`).join(', ')}, ` +
      `${context.tag}, ${context.commit}.`,
  );
}

try {
  await main();
} catch (error) {
  console.error(
    `Kern release artifact verification failed: ${
      error instanceof Error ? error.message : String(error)
    }`,
  );
  process.exitCode = 1;
}
