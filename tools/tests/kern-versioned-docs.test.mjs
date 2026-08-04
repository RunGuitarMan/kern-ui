import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { createLifecycleAttestation } from '../attest-kern-lifecycle-release.mjs';
import { buildReleaseLock } from '../prepare-kern-release-lock.mjs';
import { normalizeSbom } from '../verify-kern-release-artifacts.mjs';

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const verifier = resolve(workspaceRoot, 'tools/verify-kern-versioned-docs.mjs');
const releaseVerifier = resolve(workspaceRoot, 'tools/verify-kern-release-artifacts.mjs');
const sourceManifest = JSON.parse(
  await readFile(resolve(workspaceRoot, 'projects/kern/package.json'), 'utf8'),
);
const companionSourceManifest = JSON.parse(
  await readFile(resolve(workspaceRoot, 'projects/kern-mcp/package.json'), 'utf8'),
);
const workspaceManifest = JSON.parse(
  await readFile(resolve(workspaceRoot, 'package.json'), 'utf8'),
);
const releasePolicy = JSON.parse(
  await readFile(resolve(workspaceRoot, 'projects/kern/api/release-policy.json'), 'utf8'),
);
const version = sourceManifest.version;
const tag = `v${version}`;
const commit = spawnSync('git', ['rev-parse', 'HEAD'], {
  cwd: workspaceRoot,
  encoding: 'utf8',
}).stdout.trim();
const workspaceLockContents = await readFile(
  resolve(workspaceRoot, releasePolicy.sbom.dependencyLock),
);
const workspaceLock = JSON.parse(workspaceLockContents);
const workspaceLockHash = hash(workspaceLockContents);
const basePath = `/versions/${version}/`;
const playwrightVersion = workspaceManifest.devDependencies['@playwright/test'];
const hydrationEvidencePath = 'browser/kern-hydration-evidence.json';
const hydrationEvidenceChecks = [
  'ssr-versioned-base-path',
  'ssr-hydration-markers',
  'browser-angular-bootstrap',
  'client-router-lazy-route',
  'hydrated-component-interaction',
  'runtime-error-free',
  'request-failure-free',
  'agent-contract-base-path',
];

function run(command, inputDirectory, artifactDirectory, identity = {}) {
  const arguments_ = [
    verifier,
    command,
    `--version=${identity.version ?? version}`,
    `--tag=${identity.tag ?? tag}`,
    `--commit=${identity.commit ?? commit}`,
    `--base-path=${identity.basePath ?? basePath}`,
    `--artifact-dir=${artifactDirectory}`,
  ];
  if (inputDirectory) arguments_.push(`--input-dir=${inputDirectory}`);
  return spawnSync(process.execPath, arguments_, {
    cwd: workspaceRoot,
    encoding: 'utf8',
    maxBuffer: 4 * 1024 * 1024,
  });
}

function contentDigest(files) {
  const digest = createHash('sha256');
  for (const file of files) {
    digest.update(file.path);
    digest.update('\0');
    digest.update(file.sha256);
    digest.update('\0');
    digest.update(String(file.bytes));
    digest.update('\0');
  }
  return digest.digest('hex');
}

async function fixture(root, configuredBasePath = basePath, options = {}) {
  await Promise.all([
    mkdir(join(root, 'browser'), { recursive: true }),
    mkdir(join(root, 'server'), { recursive: true }),
  ]);
  const document = `<!doctype html><html><head><base href="${configuredBasePath}"></head></html>\n`;
  await Promise.all([
    writeFile(join(root, 'browser/index.html'), document),
    writeFile(join(root, 'browser/index.csr.html'), document),
    writeFile(join(root, 'browser/main-ABC123.js'), 'console.log("kern docs");\n'),
    writeFile(join(root, 'server/main.server.mjs'), 'export {};\n'),
    writeFile(join(root, 'server/server.mjs'), 'export {};\n'),
    writeFile(
      join(root, 'prerendered-routes.json'),
      `${JSON.stringify({ routes: { [configuredBasePath.slice(0, -1)]: {} } }, null, 2)}\n`,
    ),
  ]);

  if (options.evidence === 'missing') return;
  const buildPaths = [
    'browser/index.csr.html',
    'browser/index.html',
    'browser/main-ABC123.js',
    'prerendered-routes.json',
    'server/main.server.mjs',
    'server/server.mjs',
  ];
  const files = await Promise.all(
    buildPaths.map(async (path) => {
      const content = await readFile(join(root, path));
      return {
        path,
        bytes: content.length,
        sha256: hash(content),
      };
    }),
  );
  const evidence = {
    schemaVersion: 1,
    application: 'kern-documentation',
    evidenceType: 'browser-hydration-smoke',
    basePath: configuredBasePath,
    browser: {
      engine: 'chromium',
      version: '123.0.6312.58',
      headless: true,
      automation: {
        package: '@playwright/test',
        version: playwrightVersion,
      },
    },
    status: 'passed',
    checks: hydrationEvidenceChecks,
    boundBuild: {
      fileCount: files.length,
      totalBytes: files.reduce((sum, file) => sum + file.bytes, 0),
      contentSha256: contentDigest(files),
    },
  };
  if (options.evidence === 'invalid') {
    evidence.boundBuild.contentSha256 = '0'.repeat(64);
  }
  if (options.evidence === 'invalid-browser') {
    evidence.browser.version = 'unknown';
  }
  await writeFile(join(root, hydrationEvidencePath), `${JSON.stringify(evidence, null, 2)}\n`);
}

function hash(content) {
  return createHash('sha256').update(content).digest('hex');
}

test('versioned SSR documentation artifact is deterministic and independently verifiable', async () => {
  const temporary = await mkdtemp(join(tmpdir(), 'kern-versioned-docs-'));
  const input = join(temporary, 'input');
  const first = join(temporary, 'first');
  const second = join(temporary, 'second');
  try {
    await fixture(input);
    const firstPrepare = run('prepare', input, first);
    assert.equal(firstPrepare.status, 0, firstPrepare.stderr);
    const firstVerify = run('verify', null, first);
    assert.equal(firstVerify.status, 0, firstVerify.stderr);
    const secondPrepare = run('prepare', input, second);
    assert.equal(secondPrepare.status, 0, secondPrepare.stderr);

    const archiveName = `kern-docs-${version}.tgz`;
    const manifestName = `kern-docs-${version}.manifest.json`;
    assert.deepEqual(
      await readFile(join(first, archiveName)),
      await readFile(join(second, archiveName)),
    );
    assert.deepEqual(
      await readFile(join(first, manifestName)),
      await readFile(join(second, manifestName)),
    );

    const manifest = JSON.parse(await readFile(join(first, manifestName), 'utf8'));
    assert.equal(manifest.package.version, version);
    assert.equal(manifest.package.tag, tag);
    assert.equal(manifest.source.commit, commit);
    assert.equal(manifest.deployment.mountPath, basePath);
    assert.equal(manifest.deployment.hosting, 'external');
    assert.equal(manifest.build.outputMode, 'server');
    assert.equal(manifest.build.hydration, true);
    assert.equal(manifest.build.hydrationEvidence.path, hydrationEvidencePath);
    assert.equal(manifest.build.hydrationEvidence.type, 'browser-hydration-smoke');
    assert.equal(manifest.build.hydrationEvidence.browser.engine, 'chromium');
    assert.equal(manifest.build.hydrationEvidence.browser.version, '123.0.6312.58');
    assert.equal(manifest.build.hydrationEvidence.browser.automation.version, playwrightVersion);
    assert.deepEqual(manifest.build.hydrationEvidence.checks, hydrationEvidenceChecks);
    assert.equal(manifest.build.toolchain.playwright, playwrightVersion);
    assert.equal(
      manifest.build.hydrationEvidence.sha256,
      manifest.files.find((file) => file.path === hydrationEvidencePath)?.sha256,
    );
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test('versioned documentation verification rejects archive tampering', async () => {
  const temporary = await mkdtemp(join(tmpdir(), 'kern-versioned-docs-'));
  const input = join(temporary, 'input');
  const output = join(temporary, 'output');
  try {
    await fixture(input);
    const prepared = run('prepare', input, output);
    assert.equal(prepared.status, 0, prepared.stderr);
    const archivePath = join(output, `kern-docs-${version}.tgz`);
    const archive = await readFile(archivePath);
    archive[9] = 0x03;
    await writeFile(archivePath, archive);
    const verified = run('verify', null, output);
    assert.notEqual(verified.status, 0);
    assert.match(verified.stderr, /not in the deterministic normalized format/);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test('versioned documentation preparation rejects missing browser hydration evidence', async () => {
  const temporary = await mkdtemp(join(tmpdir(), 'kern-versioned-docs-'));
  const input = join(temporary, 'input');
  const output = join(temporary, 'output');
  try {
    await fixture(input, basePath, { evidence: 'missing' });
    const prepared = run('prepare', input, output);
    assert.notEqual(prepared.status, 0);
    assert.match(prepared.stderr, /missing browser\/kern-hydration-evidence\.json/);
    assert.match(prepared.stderr, /run the versioned browser smoke test first/);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test('versioned documentation preparation rejects hydration evidence for different build bytes', async () => {
  const temporary = await mkdtemp(join(tmpdir(), 'kern-versioned-docs-'));
  const input = join(temporary, 'input');
  const output = join(temporary, 'output');
  try {
    await fixture(input, basePath, { evidence: 'invalid' });
    const prepared = run('prepare', input, output);
    assert.notEqual(prepared.status, 0);
    assert.match(
      prepared.stderr,
      /does not prove Chromium hydration for the exact versioned build/,
    );
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test('versioned documentation preparation rejects hydration evidence without an exact Chromium version', async () => {
  const temporary = await mkdtemp(join(tmpdir(), 'kern-versioned-docs-'));
  const input = join(temporary, 'input');
  const output = join(temporary, 'output');
  try {
    await fixture(input, basePath, { evidence: 'invalid-browser' });
    const prepared = run('prepare', input, output);
    assert.notEqual(prepared.status, 0);
    assert.match(prepared.stderr, /must record the exact Chromium version/);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test('versioned documentation preparation rejects an unversioned browser base path', async () => {
  const temporary = await mkdtemp(join(tmpdir(), 'kern-versioned-docs-'));
  const input = join(temporary, 'input');
  const output = join(temporary, 'output');
  try {
    await fixture(input, '/');
    const prepared = run('prepare', input, output);
    assert.notEqual(prepared.status, 0);
    assert.match(prepared.stderr, /not bound to version mount path/);
    assert.match(prepared.stderr, /versioned root route/);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test('versioned documentation verification rejects release identity drift', async () => {
  const temporary = await mkdtemp(join(tmpdir(), 'kern-versioned-docs-'));
  const input = join(temporary, 'input');
  const output = join(temporary, 'output');
  try {
    await fixture(input);
    const prepared = run('prepare', input, output);
    assert.equal(prepared.status, 0, prepared.stderr);
    const verified = run('verify', null, output, {
      commit: 'ffffffffffffffffffffffffffffffffffffffff',
    });
    assert.notEqual(verified.status, 0);
    assert.match(verified.stderr, /does not match package, tag, repository, and commit/);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test('release verification binds both packages and versioned documentation to checksums', async () => {
  const temporary = await mkdtemp(join(tmpdir(), 'kern-versioned-docs-release-'));
  const input = join(temporary, 'input');
  const release = join(temporary, 'release');
  try {
    await fixture(input);
    const prepared = run('prepare', input, release);
    assert.equal(prepared.status, 0, prepared.stderr);

    const packageFixtures = [
      {
        dependencies: {
          ...releasePolicy.dependencies,
          ...releasePolicy.peerDependencies,
        },
        manifest: sourceManifest,
        name: releasePolicy.packageName,
        slug: 'kern-ui-angular',
      },
      {
        dependencies: releasePolicy.companionPackage.dependencies,
        manifest: companionSourceManifest,
        name: releasePolicy.companionPackage.packageName,
        slug: 'kern-ui-mcp',
      },
    ];
    for (const packageFixture of packageFixtures) {
      const root = join(temporary, `${packageFixture.slug}-root`);
      const packageRoot = join(root, 'package');
      await mkdir(packageRoot, { recursive: true });
      await writeFile(
        join(packageRoot, 'package.json'),
        `${JSON.stringify(packageFixture.manifest, null, 2)}\n`,
      );
      packageFixture.tarballName = `${packageFixture.slug}-${version}.tgz`;
      packageFixture.tarballPath = join(release, packageFixture.tarballName);
      const packed = spawnSync(
        'tar',
        ['-czf', packageFixture.tarballPath, '-C', root, 'package/package.json'],
        { encoding: 'utf8' },
      );
      assert.equal(packed.status, 0, packed.stderr);

      packageFixture.sbomName = `${packageFixture.slug}-${version}.cdx.json`;
      packageFixture.sbomPath = join(release, packageFixture.sbomName);
      await writeFile(
        join(packageRoot, 'package-lock.json'),
        `${JSON.stringify(buildReleaseLock(workspaceLock, packageFixture.manifest), null, 2)}\n`,
      );
      const generatedSbom = spawnSync(
        process.platform === 'win32' ? 'npm.cmd' : 'npm',
        [
          'sbom',
          '--prefix',
          packageRoot,
          '--package-lock-only',
          '--sbom-format',
          'cyclonedx',
          '--sbom-type',
          'library',
        ],
        { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 },
      );
      assert.equal(generatedSbom.status, 0, generatedSbom.stderr);
      const sbom = normalizeSbom(
        JSON.parse(generatedSbom.stdout),
        { packageName: packageFixture.name },
        version,
        workspaceLockHash,
      );
      await writeFile(packageFixture.sbomPath, `${JSON.stringify(sbom, null, 2)}\n`);
      packageFixture.tarballHash = hash(await readFile(packageFixture.tarballPath));
      packageFixture.sbomHash = hash(await readFile(packageFixture.sbomPath));
    }

    const docsArchiveName = `kern-docs-${version}.tgz`;
    const docsManifestName = `kern-docs-${version}.manifest.json`;
    const artifactHashes = {
      docsArchive: hash(await readFile(join(release, docsArchiveName))),
      docsManifest: hash(await readFile(join(release, docsManifestName))),
    };
    const lifecycleAttestationName = 'lifecycle-attestation.json';
    const lifecycleAttestationPath = join(release, lifecycleAttestationName);
    await writeFile(
      lifecycleAttestationPath,
      `${JSON.stringify(
        await createLifecycleAttestation({ version, tag, commit, base: null }),
        null,
        2,
      )}\n`,
    );
    artifactHashes.lifecycleAttestation = hash(await readFile(lifecycleAttestationPath));
    const releaseManifest = {
      schemaVersion: 4,
      release: {
        version,
        tag,
        npmDistTag: 'latest',
      },
      packages: packageFixtures.map((packageFixture) => ({
        name: packageFixture.name,
        version,
        tarball: {
          file: packageFixture.tarballName,
          sha256: packageFixture.tarballHash,
        },
        sbom: {
          file: packageFixture.sbomName,
          format: releasePolicy.sbom.format,
          sha256: packageFixture.sbomHash,
        },
      })),
      source: {
        repository: releasePolicy.repository,
        commit,
        workflowRunId: process.env.GITHUB_RUN_ID ?? null,
        dependencyLock: {
          file: releasePolicy.sbom.dependencyLock,
          sha256: workspaceLockHash,
        },
        lifecycleAttestation: {
          file: lifecycleAttestationName,
          sha256: artifactHashes.lifecycleAttestation,
        },
      },
      artifacts: {
        documentation: {
          archive: {
            file: docsArchiveName,
            format: 'tar+gzip',
            sha256: artifactHashes.docsArchive,
          },
          manifest: {
            file: docsManifestName,
            schemaVersion: 1,
            sha256: artifactHashes.docsManifest,
          },
          mountPath: basePath,
        },
      },
      policy: {
        file: 'projects/kern/api/release-policy.json',
        auditLevel: releasePolicy.auditLevel,
        allowedLicenses: releasePolicy.allowedLicenses,
      },
    };
    const releaseManifestPath = join(release, 'release-manifest.json');
    await writeFile(releaseManifestPath, `${JSON.stringify(releaseManifest, null, 2)}\n`);
    const checksums = [
      `${hash(await readFile(releaseManifestPath))}  release-manifest.json`,
      `${artifactHashes.lifecycleAttestation}  ${lifecycleAttestationName}`,
      `${artifactHashes.docsArchive}  ${docsArchiveName}`,
      `${artifactHashes.docsManifest}  ${docsManifestName}`,
      ...packageFixtures.flatMap((packageFixture) => [
        `${packageFixture.sbomHash}  ${packageFixture.sbomName}`,
        `${packageFixture.tarballHash}  ${packageFixture.tarballName}`,
      ]),
    ].sort();
    await writeFile(join(release, 'SHA256SUMS'), `${checksums.join('\n')}\n`);

    const gitDirectory = join(temporary, 'release.git');
    const clonedRepository = spawnSync(
      'git',
      ['clone', '--bare', '--no-local', workspaceRoot, gitDirectory],
      { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 },
    );
    assert.equal(clonedRepository.status, 0, clonedRepository.stderr);
    const taggedRelease = spawnSync(
      'git',
      ['--git-dir', gitDirectory, 'update-ref', `refs/tags/${tag}`, commit],
      { encoding: 'utf8' },
    );
    assert.equal(taggedRelease.status, 0, taggedRelease.stderr);

    const verifyRelease = () =>
      spawnSync(
        process.execPath,
        [
          releaseVerifier,
          'verify',
          `--version=${version}`,
          `--tag=${tag}`,
          `--commit=${commit}`,
          '--npm-tag=latest',
          `--artifact-dir=${release}`,
        ],
        {
          cwd: workspaceRoot,
          encoding: 'utf8',
          env: { ...process.env, GIT_DIR: gitDirectory },
          maxBuffer: 4 * 1024 * 1024,
        },
      );
    const verified = verifyRelease();
    assert.equal(verified.status, 0, verified.stderr);
    assert.match(verified.stdout, /release artifacts verified/);
    assert.deepEqual(
      releaseManifest.packages.map(({ name }) => name),
      ['@kern-ui/angular', '@kern-ui/mcp'],
    );

    const originalManifest = await readFile(releaseManifestPath, 'utf8');
    const originalChecksums = await readFile(join(release, 'SHA256SUMS'), 'utf8');
    const forgedManifest = JSON.parse(originalManifest);
    forgedManifest.policy.auditLevel = 'low';
    forgedManifest.unexpected = true;
    await writeFile(releaseManifestPath, `${JSON.stringify(forgedManifest, null, 2)}\n`);
    const forgedManifestHash = hash(await readFile(releaseManifestPath));
    await writeFile(
      join(release, 'SHA256SUMS'),
      originalChecksums.replace(
        /^[0-9a-f]{64} {2}release-manifest\.json$/m,
        `${forgedManifestHash}  release-manifest.json`,
      ),
    );
    const forgedPolicy = verifyRelease();
    assert.notEqual(forgedPolicy.status, 0);
    assert.match(
      forgedPolicy.stderr,
      /Release manifest does not satisfy its JSON Schema|Release manifest does not match/,
    );
    await writeFile(releaseManifestPath, originalManifest);
    await writeFile(join(release, 'SHA256SUMS'), originalChecksums);

    const originalAttestation = await readFile(lifecycleAttestationPath, 'utf8');
    const tamperedAttestation = JSON.parse(originalAttestation);
    tamperedAttestation.inputs[0].sha256 = `sha256-${'0'.repeat(64)}`;
    await writeFile(lifecycleAttestationPath, `${JSON.stringify(tamperedAttestation, null, 2)}\n`);
    const staleAttestation = verifyRelease();
    assert.notEqual(staleAttestation.status, 0);
    assert.match(staleAttestation.stderr, /does not match checked-out source/);
    await writeFile(lifecycleAttestationPath, originalAttestation);

    const companionSbom = packageFixtures.find(({ name }) => name === '@kern-ui/mcp');
    assert.ok(companionSbom);
    await writeFile(companionSbom.sbomPath, `${await readFile(companionSbom.sbomPath, 'utf8')}\n`);
    const tampered = verifyRelease();
    assert.notEqual(tampered.status, 0);
    assert.match(tampered.stderr, /SHA256SUMS does not exactly match/);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});
