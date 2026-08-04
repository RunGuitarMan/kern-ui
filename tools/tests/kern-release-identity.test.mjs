import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { assertDistTagVersion, publicationDecision } from '../publish-kern-release-package.mjs';
import { buildReleaseLock } from '../prepare-kern-release-lock.mjs';
import {
  assertPromotionAdvance,
  promotePublicTags,
  rollbackPlan,
  verifyDistTagWriteAccess,
} from '../promote-kern-release.mjs';
import {
  createLifecycleAttestation,
  validateLifecycleAttestation,
} from '../attest-kern-lifecycle-release.mjs';
import { compareSbomGraph, normalizeSbom } from '../verify-kern-release-artifacts.mjs';
import { selectPublishedReleaseBase } from '../verify-kern-lifecycle.mjs';

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const verifier = resolve(workspaceRoot, 'tools/verify-kern-release-identity.mjs');
const fixtures = resolve(workspaceRoot, 'tools/tests/fixtures/release-identity');
const validFixture = resolve(fixtures, 'valid');
const releaseWorkflow = resolve(workspaceRoot, '.github/workflows/release-candidate.yml');
const releaseDocumentation = resolve(workspaceRoot, 'docs/RELEASING.md');
const lifecycleVerifier = resolve(workspaceRoot, 'tools/verify-kern-lifecycle.mjs');

function attestationGitOperations({ commit, version, tags = {} }) {
  return {
    assertAncestor() {},
    checkedOutCommit: () => commit,
    packageVersionsAtCommit: (targetCommit) => ({
      '@kern-ui/angular': tags[targetCommit]?.version ?? version,
      '@kern-ui/mcp': tags[targetCommit]?.version ?? version,
    }),
    taggedCommit: (tag) => {
      const tagged = tags[tag]?.commit ?? (tag === `v${version}` ? commit : null);
      if (!tagged) throw new Error(`Git tag ${tag} does not resolve to an exact commit.`);
      return tagged;
    },
  };
}

function sbomGraphFixture() {
  const releaseLock = {
    name: '@kern-ui/test',
    version: '1.2.3',
    packages: {
      '': {
        dependencies: { direct: '^1.0.0' },
        optionalDependencies: { absent: '^1.0.0' },
      },
      'node_modules/direct': {
        version: '1.0.0',
        dependencies: { transitive: '^2.0.0' },
      },
      'node_modules/transitive': { version: '2.0.1' },
    },
  };
  const component = (name, version) => ({
    'bom-ref': `${name}@${version}`,
    type: 'library',
    name,
    version,
    purl: `pkg:npm/${name.replace('@', '%40')}@${version}`,
  });
  const sbom = {
    metadata: { component: component('@kern-ui/test', '1.2.3') },
    components: [component('direct', '1.0.0'), component('transitive', '2.0.1')],
    dependencies: [
      { ref: '@kern-ui/test@1.2.3', dependsOn: ['direct@1.0.0'] },
      { ref: 'direct@1.0.0', dependsOn: ['transitive@2.0.1'] },
      { ref: 'transitive@2.0.1', dependsOn: [] },
    ],
  };
  return { releaseLock, sbom };
}

function run({
  version = '1.2.3',
  tag = `v${version}`,
  manifest = resolve(validFixture, 'package.json'),
  docsIdentity = resolve(validFixture, 'release-identity.ts'),
  changelog = resolve(validFixture, 'CHANGELOG.md'),
} = {}) {
  return spawnSync(
    process.execPath,
    [
      verifier,
      `--version=${version}`,
      `--tag=${tag}`,
      `--manifest=${manifest}`,
      `--docs-identity=${docsIdentity}`,
      `--changelog=${changelog}`,
    ],
    {
      cwd: workspaceRoot,
      encoding: 'utf8',
    },
  );
}

async function withFixture(runTest) {
  const directory = await mkdtemp(join(tmpdir(), 'kern-release-identity-'));
  await cp(validFixture, directory, { recursive: true });
  try {
    await runTest(directory);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

test('release identity verifier accepts an exact released fixture', () => {
  const result = run();

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /release identity verified/);
  assert.match(result.stdout, /1\.2\.3 \(v1\.2\.3\)/);
});

test('release identity verifier rejects malformed version and mismatched tag', () => {
  const result = run({ version: '01.2.3', tag: 'release-01.2.3' });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /not exact Semantic Versioning/);
  assert.match(result.stderr, /Release tag must be exactly v01\.2\.3/);
  assert.match(result.stderr, /Package manifest version must be 01\.2\.3/);
});

test('release identity verifier rejects an unpublished documentation source candidate', () => {
  const result = run({
    docsIdentity: resolve(fixtures, 'source-candidate/release-identity.ts'),
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /release state must be "released"/);
});

test('release identity verifier rejects package and documentation version drift', async () => {
  await withFixture(async (directory) => {
    const manifest = JSON.parse(await readFile(join(directory, 'package.json'), 'utf8'));
    manifest.version = '1.2.4';
    await writeFile(join(directory, 'package.json'), `${JSON.stringify(manifest, null, 2)}\n`);
    await writeFile(
      join(directory, 'release-identity.ts'),
      [
        "export const KERN_DOCS_VERSION = '1.2.4' as const;",
        "export const KERN_DOCS_RELEASE_STATE = 'released' as const;",
        '',
      ].join('\n'),
    );

    const result = run({
      manifest: join(directory, 'package.json'),
      docsIdentity: join(directory, 'release-identity.ts'),
      changelog: join(directory, 'CHANGELOG.md'),
    });

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Package manifest version must be 1\.2\.3/);
    assert.match(result.stderr, /Documentation version must be 1\.2\.3/);
  });
});

test('release identity verifier requires a dated section, bullet, and exact HTTPS tag link', async () => {
  await withFixture(async (directory) => {
    await writeFile(
      join(directory, 'CHANGELOG.md'),
      [
        '# Changelog',
        '',
        '## [1.2.3]',
        '',
        '### Added',
        '',
        'No release bullet.',
        '',
        '[1.2.3]: http://example.com/releases/tag/v1.2.4',
        '',
      ].join('\n'),
    );

    const result = run({
      manifest: join(directory, 'package.json'),
      docsIdentity: join(directory, 'release-identity.ts'),
      changelog: join(directory, 'CHANGELOG.md'),
    });

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /exact heading/);
    assert.match(result.stderr, /HTTPS \[1\.2\.3\] release link/);
  });
});

test('release identity verifier rejects an empty release section independently', async () => {
  await withFixture(async (directory) => {
    await writeFile(
      join(directory, 'CHANGELOG.md'),
      [
        '# Changelog',
        '',
        '## [1.2.3] - 2026-07-29',
        '',
        '### Added',
        '',
        'No bullet.',
        '',
        '[1.2.3]: https://github.com/kern-ui/kern/releases/tag/v1.2.3',
        '',
      ].join('\n'),
    );

    const result = run({
      manifest: join(directory, 'package.json'),
      docsIdentity: join(directory, 'release-identity.ts'),
      changelog: join(directory, 'CHANGELOG.md'),
    });

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /must contain a non-empty bullet/);
  });
});

test('release identity verifier rejects an invalid date and a link to a different tag', async () => {
  await withFixture(async (directory) => {
    await writeFile(
      join(directory, 'CHANGELOG.md'),
      [
        '# Changelog',
        '',
        '## [1.2.3] - 2026-02-30',
        '',
        '### Added',
        '',
        '- Release note.',
        '',
        '[1.2.3]: https://github.com/kern-ui/kern/releases/tag/v1.2.4',
        '',
      ].join('\n'),
    );

    const result = run({
      manifest: join(directory, 'package.json'),
      docsIdentity: join(directory, 'release-identity.ts'),
      changelog: join(directory, 'CHANGELOG.md'),
    });

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /not a valid calendar date/);
    assert.match(result.stderr, /must target tag v1\.2\.3 over HTTPS/);
  });
});

test('release workflow verifies source identity in both candidate and approved publish jobs', async () => {
  const workflow = await readFile(releaseWorkflow, 'utf8');
  const invocations = workflow.match(/node tools\/verify-kern-release-identity\.mjs/g) ?? [];
  const publishJob = workflow.indexOf('\n  publish:');
  const publishVerification = workflow.indexOf(
    'node tools/verify-kern-release-identity.mjs',
    publishJob,
  );
  const npmPublication = workflow.indexOf(
    'node tools/publish-kern-release-package.mjs',
    publishJob,
  );
  const publishCheckout = workflow.indexOf('uses: actions/checkout@', publishJob);
  const publishSetupNode = workflow.indexOf('uses: actions/setup-node@', publishCheckout);
  const publishInstall = workflow.indexOf('run: npm ci --ignore-scripts', publishSetupNode);
  const publishNodeTool = workflow.indexOf('node tools/', publishJob);

  assert.equal(invocations.length, 2);
  assert.ok(publishJob >= 0, 'release workflow must define the approved publish job');
  assert.ok(
    publishCheckout > publishJob &&
      workflow.slice(publishCheckout, publishSetupNode).includes('fetch-depth: 0'),
    'approved publication must fetch full history for lifecycle ancestry verification',
  );
  assert.ok(
    publishInstall > publishSetupNode && publishInstall < publishNodeTool,
    'approved publication must install locked release tooling without lifecycle scripts before running Node tools',
  );
  assert.ok(
    publishVerification > publishJob && publishVerification < npmPublication,
    'approved publication must reverify release identity before npm publish',
  );
  for (const packageSlug of ['kern-ui-angular', 'kern-ui-mcp']) {
    assert.ok(
      workflow.includes(`release/${packageSlug}-${'${RELEASE_VERSION}'}.tgz`),
      `${packageSlug} tarball must be part of the immutable release candidate`,
    );
    assert.ok(
      workflow.includes(`release/${packageSlug}-${'${RELEASE_VERSION}'}.cdx.json`),
      `${packageSlug} SBOM must be part of the immutable release candidate`,
    );
    assert.ok(
      workflow.includes(`--tarball=release/${packageSlug}-${'${RELEASE_VERSION}'}.tgz`),
      `${packageSlug} must be published from the verified tarball`,
    );
  }
  assert.equal(
    workflow.match(/node tools\/publish-kern-release-package\.mjs/g)?.length,
    2,
    'both npm packages must use the resumable publisher',
  );
  const publisher = await readFile(
    resolve(workspaceRoot, 'tools/publish-kern-release-package.mjs'),
    'utf8',
  );
  assert.match(publisher, /'--provenance'/);
  assert.match(publisher, /dist\.integrity/);
  assert.match(workflow, /NPM_STAGING_TAG: kern-staging/);
  assert.match(workflow, /node tools\/verify-kern-lifecycle\.mjs/);
  assert.match(workflow, /--mode=release/);
  assert.match(workflow, /node tools\/attest-kern-lifecycle-release\.mjs/);
  assert.match(workflow, /--release-attestation=release\/lifecycle-attestation\.json/);
  assert.doesNotMatch(workflow, /--release-base-version=/);
  assert.equal(
    workflow.match(/node tools\/prepare-kern-release-lock\.mjs/g)?.length,
    2,
    'both SBOMs must be generated from deterministic slices of the workspace lockfile',
  );
  assert.doesNotMatch(workflow, /npm install --package-lock-only/);
  const promotion = workflow.indexOf('node tools/promote-kern-release.mjs', npmPublication);
  assert.ok(
    promotion > workflow.lastIndexOf('node tools/publish-kern-release-package.mjs'),
    'public tags must be promoted only after both packages are staged',
  );
  const tokenBinding = workflow.indexOf(
    'NODE_AUTH_TOKEN: ${{ secrets.NPM_DIST_TAG_TOKEN }}',
    npmPublication,
  );
  assert.equal(
    workflow.match(/NODE_AUTH_TOKEN:/g)?.length,
    1,
    'the granular npm token must be exposed to exactly one workflow step',
  );
  assert.ok(
    tokenBinding > workflow.lastIndexOf('node tools/publish-kern-release-package.mjs') &&
      tokenBinding < promotion,
    'the granular npm token must be scoped to promotion and remain absent from OIDC staging',
  );
  const tagVerification = workflow.indexOf(
    'node tools/verify-kern-release-dist-tags.mjs',
    npmPublication,
  );
  const githubPublication = workflow.indexOf('Publish GitHub release with evidence', publishJob);
  assert.ok(
    tagVerification > workflow.lastIndexOf('node tools/publish-kern-release-package.mjs'),
    'the workflow must verify distribution tags after both package publications',
  );
  assert.ok(
    tagVerification < githubPublication,
    'the public GitHub release must follow both npm publications',
  );
  assert.match(workflow, /concurrency:\n  group: kern-release\n/);
});

test('lifecycle release attestation freezes all verifier inputs to the checked-out candidate', async () => {
  const commit = spawnSync('git', ['rev-parse', 'HEAD'], {
    cwd: workspaceRoot,
    encoding: 'utf8',
  }).stdout.trim();
  const manifest = JSON.parse(
    await readFile(resolve(workspaceRoot, 'projects/kern/package.json'), 'utf8'),
  );
  const attestation = await createLifecycleAttestation({
    version: manifest.version,
    tag: `v${manifest.version}`,
    commit,
    base: null,
  });
  const gitOperations = attestationGitOperations({ commit, version: manifest.version });

  assert.deepEqual(
    await validateLifecycleAttestation(
      attestation,
      {
        version: manifest.version,
        tag: `v${manifest.version}`,
        commit,
      },
      gitOperations,
    ),
    [],
  );
  attestation.inputs[0].sha256 = `sha256-${'0'.repeat(64)}`;
  assert.match(
    (
      await validateLifecycleAttestation(
        attestation,
        {
          version: manifest.version,
          tag: `v${manifest.version}`,
          commit,
        },
        gitOperations,
      )
    ).join('\n'),
    /does not match checked-out source/,
  );
});

test('lifecycle attestation rejects missing or moved Git tags and package-version drift', async () => {
  const commit = spawnSync('git', ['rev-parse', 'HEAD'], {
    cwd: workspaceRoot,
    encoding: 'utf8',
  }).stdout.trim();
  const version = JSON.parse(
    await readFile(resolve(workspaceRoot, 'projects/kern/package.json'), 'utf8'),
  ).version;
  const attestation = await createLifecycleAttestation({
    version,
    tag: `v${version}`,
    commit,
    base: null,
  });
  const movedCommit = 'b'.repeat(40);
  const moved = await validateLifecycleAttestation(
    attestation,
    { version, tag: `v${version}`, commit },
    attestationGitOperations({
      commit,
      version,
      tags: { [`v${version}`]: { commit: movedCommit, version } },
    }),
  );
  assert.match(moved.join('\n'), /candidate tag .* resolves to .* not/);

  const missing = await validateLifecycleAttestation(
    attestation,
    { version, tag: `v${version}`, commit },
    {
      ...attestationGitOperations({ commit, version }),
      taggedCommit: () => {
        throw new Error(`Git tag v${version} does not resolve to an exact commit.`);
      },
    },
  );
  assert.match(missing.join('\n'), /does not resolve to an exact commit/);

  const versionDrift = await validateLifecycleAttestation(
    attestation,
    { version, tag: `v${version}`, commit },
    {
      ...attestationGitOperations({ commit, version }),
      packageVersionsAtCommit: () => ({
        '@kern-ui/angular': version,
        '@kern-ui/mcp': '0.0.0',
      }),
    },
  );
  assert.match(versionDrift.join('\n'), /candidate commit contains @kern-ui\/mcp@0\.0\.0/);

  const baseCommit = 'c'.repeat(40);
  const withBase = {
    ...attestation,
    base: { version: '0.0.1', tag: 'v0.0.1', commit: baseCommit },
  };
  const movedBase = await validateLifecycleAttestation(
    withBase,
    { version, tag: `v${version}`, commit },
    attestationGitOperations({
      commit,
      version,
      tags: {
        'v0.0.1': { commit: movedCommit, version: '0.0.1' },
        [baseCommit]: { version: '0.0.1' },
      },
    }),
  );
  assert.match(movedBase.join('\n'), /base tag v0\.0\.1 resolves to .* not/);
});

test('release lifecycle CLI invokes full attestation validation before trusting its base', async () => {
  const commit = spawnSync('git', ['rev-parse', 'HEAD'], {
    cwd: workspaceRoot,
    encoding: 'utf8',
  }).stdout.trim();
  const version = JSON.parse(
    await readFile(resolve(workspaceRoot, 'projects/kern/package.json'), 'utf8'),
  ).version;
  const attestation = await createLifecycleAttestation({
    version,
    tag: `v${version}`,
    commit,
    base: null,
  });
  attestation.candidate.tag = `v${version}-not-a-release-tag`;
  const directory = await mkdtemp(join(tmpdir(), 'kern-lifecycle-attestation-'));
  const path = join(directory, 'attestation.json');
  try {
    await writeFile(path, `${JSON.stringify(attestation, null, 2)}\n`);
    const result = spawnSync(
      process.execPath,
      [lifecycleVerifier, '--mode=release', `--release-attestation=${path}`],
      { cwd: workspaceRoot, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 },
    );
    assert.notEqual(result.status, 0);
    assert.match(
      result.stderr,
      /Lifecycle attestation candidate must contain an exact version, tag, and commit/,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('release documentation requires a narrowly scoped and rotated dist-tag credential', async () => {
  const documentation = await readFile(releaseDocumentation, 'utf8');
  assert.match(documentation, /NPM_DIST_TAG_TOKEN/);
  assert.match(documentation, /only `@kern-ui\/angular` and `@kern-ui\/mcp`/);
  assert.match(documentation, /\*\*Read and write\*\*/);
  assert.match(documentation, /bypass 2FA/);
  assert.match(documentation, /rotated before expiry/);
  assert.match(documentation, /must not select \*\*disallow tokens\*\*/);
});

test('release lifecycle base is the newest synchronized public version below the candidate', () => {
  const synchronized = {
    '@kern-ui/angular': { latest: '1.2.3', next: '1.3.0-rc.2' },
    '@kern-ui/mcp': { latest: '1.2.3', next: '1.3.0-rc.2' },
  };
  assert.equal(selectPublishedReleaseBase(synchronized, '1.3.0'), '1.3.0-rc.2');
  assert.equal(selectPublishedReleaseBase(synchronized, '1.2.4'), '1.2.3');
  assert.equal(
    selectPublishedReleaseBase({ '@kern-ui/angular': {}, '@kern-ui/mcp': {} }, '1.0.0'),
    null,
  );
  assert.throws(
    () =>
      selectPublishedReleaseBase(
        {
          '@kern-ui/angular': { latest: '1.2.3' },
          '@kern-ui/mcp': { latest: '1.2.2' },
        },
        '1.2.4',
      ),
    /Published npm dist-tag latest is not synchronized/,
  );
});

test('release lock is a runtime-only deterministic closure of the committed workspace lock', () => {
  const workspaceLock = {
    lockfileVersion: 3,
    packages: {
      'node_modules/direct': {
        version: '1.0.0',
        integrity: 'sha512-direct',
        dev: true,
        dependencies: { transitive: '^2.0.0' },
      },
      'node_modules/transitive': {
        version: '2.0.1',
        integrity: 'sha512-transitive',
        devOptional: true,
      },
      'node_modules/unrelated': { version: '9.0.0' },
    },
  };
  const manifest = {
    name: '@kern-ui/test',
    version: '1.2.3',
    dependencies: { direct: '^1.0.0' },
    peerDependencies: { absent: '^1.0.0' },
    peerDependenciesMeta: { absent: { optional: true } },
  };

  const first = buildReleaseLock(workspaceLock, manifest);
  const second = buildReleaseLock(structuredClone(workspaceLock), structuredClone(manifest));
  assert.deepEqual(first, second);
  assert.deepEqual(Object.keys(first.packages), [
    '',
    'node_modules/direct',
    'node_modules/transitive',
  ]);
  assert.equal(first.packages['node_modules/direct'].dev, undefined);
  assert.equal(first.packages['node_modules/transitive'].devOptional, undefined);
  assert.equal(first.packages['node_modules/unrelated'], undefined);
  assert.throws(
    () =>
      buildReleaseLock(workspaceLock, {
        ...manifest,
        dependencies: { missing: '^1.0.0' },
      }),
    /dependency missing is not pinned/,
  );
  assert.throws(
    () =>
      buildReleaseLock(
        {
          ...workspaceLock,
          packages: {
            ...workspaceLock.packages,
            'node_modules/direct': {
              ...workspaceLock.packages['node_modules/direct'],
              version: '2.0.0',
            },
          },
        },
        manifest,
      ),
    /direct@\^1\.0\.0 resolves to 2\.0\.0.*outside the declared range/,
  );
  assert.throws(
    () =>
      buildReleaseLock(
        {
          ...workspaceLock,
          packages: {
            ...workspaceLock.packages,
            'node_modules/transitive': {
              ...workspaceLock.packages['node_modules/transitive'],
              version: '3.0.0',
            },
          },
        },
        manifest,
      ),
    /transitive@\^2\.0\.0 resolves to 3\.0\.0.*outside the declared range/,
  );
  assert.throws(
    () =>
      buildReleaseLock(
        {
          ...workspaceLock,
          packages: {
            ...workspaceLock.packages,
            'node_modules/peer': { version: '2.0.0', integrity: 'sha512-peer' },
          },
        },
        {
          ...manifest,
          peerDependencies: { peer: '^1.0.0' },
          peerDependenciesMeta: {},
        },
      ),
    /peer dependency peer@\^1\.0\.0 resolves to 2\.0\.0.*outside the declared range/,
  );
  assert.throws(
    () =>
      buildReleaseLock(workspaceLock, {
        ...manifest,
        dependencies: { direct: 'workspace:*' },
      }),
    /dependency direct has unsupported range workspace:\*/,
  );
});

test('failed public tag promotion rolls changed packages back in reverse order', () => {
  assert.deepEqual(
    rollbackPlan([
      { packageName: '@kern-ui/angular', previousVersion: '1.2.2' },
      { packageName: '@kern-ui/mcp', previousVersion: null },
    ]),
    [
      { action: 'remove', packageName: '@kern-ui/mcp', version: null },
      { action: 'restore', packageName: '@kern-ui/angular', version: '1.2.2' },
    ],
  );
});

test('public dist-tags advance monotonically with exact prerelease semantics', () => {
  assert.doesNotThrow(() => assertPromotionAdvance('1.2.3', '1.2.2', 'latest'));
  assert.doesNotThrow(() => assertPromotionAdvance('1.2.3', '1.2.3', 'latest'));
  assert.doesNotThrow(() => assertPromotionAdvance('1.2.3-rc.10', '1.2.3-rc.2', 'next'));
  assert.doesNotThrow(() => assertPromotionAdvance('1.2.3', '1.2.3-rc.10', 'next'));
  assert.throws(
    () => assertPromotionAdvance('1.2.2', '1.2.3', 'latest'),
    /Refusing to move npm dist-tag latest backwards from 1\.2\.3 to 1\.2\.2/,
  );
  assert.throws(
    () => assertPromotionAdvance('1.2.3-rc.2', '1.2.3-rc.10', 'next'),
    /Refusing to move npm dist-tag next backwards/,
  );
  assert.throws(
    () => assertPromotionAdvance('1.2.3-rc.1', null, 'latest'),
    /Prerelease 1\.2\.3-rc\.1 cannot be promoted under latest/,
  );
  assert.throws(
    () => assertPromotionAdvance('01.2.3', null, 'next'),
    /must be exact Semantic Versioning/,
  );
});

test('tokenized promotion restores missing or drifted staging tags for both packages', async () => {
  const calls = [];
  const state = new Map([
    ['@kern-ui/angular', null],
    ['@kern-ui/mcp', '1.2.2'],
  ]);
  const operations = {
    async assertDistTagEventually(packageName, tag, version) {
      calls.push(['assert', packageName, tag, version]);
      assert.equal(state.get(packageName), version);
    },
    async setDistTag(packageName, version, tag) {
      calls.push(['set', packageName, tag, version]);
      state.set(packageName, version);
    },
  };

  await verifyDistTagWriteAccess(
    [{ packageName: '@kern-ui/angular' }, { packageName: '@kern-ui/mcp' }],
    '1.2.3',
    'kern-staging',
    operations,
  );

  assert.deepEqual(calls, [
    ['set', '@kern-ui/angular', 'kern-staging', '1.2.3'],
    ['assert', '@kern-ui/angular', 'kern-staging', '1.2.3'],
    ['set', '@kern-ui/mcp', 'kern-staging', '1.2.3'],
    ['assert', '@kern-ui/mcp', 'kern-staging', '1.2.3'],
  ]);
  assert.deepEqual(Object.fromEntries(state), {
    '@kern-ui/angular': '1.2.3',
    '@kern-ui/mcp': '1.2.3',
  });
});

test('ambiguous dist-tag failure rolls back a mutation committed before the client error', async () => {
  const state = new Map([
    ['@kern-ui/angular', '1.2.2'],
    ['@kern-ui/mcp', '1.2.2'],
  ]);
  let failAfterFirstMutation = true;
  const operations = {
    async assertDistTagEventually(packageName, _tag, version) {
      assert.equal(state.get(packageName) ?? null, version);
    },
    async removeDistTag(packageName) {
      state.delete(packageName);
    },
    async setDistTag(packageName, version) {
      state.set(packageName, version);
      if (version === '1.2.3' && failAfterFirstMutation) {
        failAfterFirstMutation = false;
        throw new Error('registry committed the tag before the client timed out');
      }
    },
  };

  await assert.rejects(
    promotePublicTags(
      [
        { packageName: '@kern-ui/angular', previousVersion: '1.2.2' },
        { packageName: '@kern-ui/mcp', previousVersion: '1.2.2' },
      ],
      '1.2.3',
      'latest',
      operations,
    ),
    /registry committed the tag before the client timed out/,
  );
  assert.deepEqual(Object.fromEntries(state), {
    '@kern-ui/angular': '1.2.2',
    '@kern-ui/mcp': '1.2.2',
  });
});

test('SBOM normalization removes invocation entropy and binds the committed dependency lock', () => {
  const source = {
    bomFormat: 'CycloneDX',
    specVersion: '1.6',
    serialNumber: 'urn:uuid:random-per-invocation',
    metadata: {
      timestamp: '2026-08-03T00:00:00.000Z',
      component: {},
      properties: [{ name: 'existing', value: 'preserved' }],
    },
  };
  const packageDefinition = { packageName: '@kern-ui/angular' };
  const first = normalizeSbom(source, packageDefinition, '1.2.3', 'a'.repeat(64));
  const second = normalizeSbom(
    {
      ...source,
      serialNumber: 'urn:uuid:different',
      metadata: { ...source.metadata, timestamp: '2027-01-01T00:00:00.000Z' },
    },
    packageDefinition,
    '1.2.3',
    'a'.repeat(64),
  );

  assert.deepEqual(first, second);
  assert.equal(first.serialNumber, undefined);
  assert.equal(first.metadata.timestamp, undefined);
  assert.deepEqual(first.metadata.properties, [
    { name: 'existing', value: 'preserved' },
    { name: 'kern:workspace-lock-sha256', value: 'a'.repeat(64) },
  ]);
});

test('SBOM graph is an exact name, version, purl, and edge projection of the release lock', () => {
  const { releaseLock, sbom } = sbomGraphFixture();
  assert.deepEqual(compareSbomGraph(sbom, releaseLock), []);

  const wrongVersion = structuredClone(sbom);
  wrongVersion.components[0].version = '9.9.9';
  assert.match(
    compareSbomGraph(wrongVersion, releaseLock).join('\n'),
    /component direct@1\.0\.0 does not match its pinned lock identity/,
  );

  const missingTransitive = structuredClone(sbom);
  missingTransitive.components.splice(1, 1);
  missingTransitive.dependencies.splice(2, 1);
  assert.match(
    compareSbomGraph(missingTransitive, releaseLock).join('\n'),
    /components differ from the pinned release lock/,
  );

  const wrongEdge = structuredClone(sbom);
  wrongEdge.dependencies[1].dependsOn = [];
  assert.match(
    compareSbomGraph(wrongEdge, releaseLock).join('\n'),
    /edges for direct@1\.0\.0 differ from the pinned release lock/,
  );
});

test('SBOM graph rejects duplicate identities, rows, and edges', () => {
  const { releaseLock, sbom } = sbomGraphFixture();
  sbom.components.push(structuredClone(sbom.components[0]));
  sbom.dependencies.push(structuredClone(sbom.dependencies[0]));
  sbom.dependencies[1].dependsOn.push('transitive@2.0.1');
  const issues = compareSbomGraph(sbom, releaseLock).join('\n');
  assert.match(issues, /duplicates component ref direct@1\.0\.0/);
  assert.match(issues, /duplicates dependency row @kern-ui\/test@1\.2\.3/);
  assert.match(issues, /dependency row direct@1\.0\.0 contains duplicate edges/);
});

test('SBOM graph rejects malformed dependency arrays and non-string refs', () => {
  const { releaseLock, sbom } = sbomGraphFixture();
  sbom.dependencies[2].dependsOn = 'not-an-array';
  sbom.dependencies[1].dependsOn.push(42);
  const issues = compareSbomGraph(sbom, releaseLock).join('\n');
  assert.match(issues, /dependency row transitive@2\.0\.1 requires a dependsOn array/);
  assert.match(issues, /dependency row direct@1\.0\.0 contains a non-string edge/);
});

test('resumable publisher skips exact bytes and rejects an occupied mismatched version', () => {
  const integrity = 'sha512-exact';
  assert.equal(publicationDecision(null, integrity), 'publish');
  assert.equal(publicationDecision(integrity, integrity), 'skip');
  assert.throws(
    () => publicationDecision('sha512-different', integrity),
    /registry already contains different bytes/,
  );
  assert.doesNotThrow(() => assertDistTagVersion('next', '1.2.3', '1.2.3'));
  assert.throws(
    () => assertDistTagVersion('latest', '1.2.2', '1.2.3'),
    /dist-tag latest points to 1\.2\.2, expected 1\.2\.3/,
  );
});

test('OIDC resumable publisher never mutates dist-tags when exact bytes already exist', async () => {
  const publisher = await readFile(
    resolve(workspaceRoot, 'tools/publish-kern-release-package.mjs'),
    'utf8',
  );
  const skipStart = publisher.indexOf("if (decision === 'skip')");
  const publishStart = publisher.indexOf('const result = runNpm', skipStart);
  const skipPath = publisher.slice(skipStart, publishStart);

  assert.ok(skipStart >= 0 && publishStart > skipStart);
  assert.doesNotMatch(skipPath, /setDistTag|removeDistTag|dist-tag/);
  assert.match(skipPath, /already contains the exact approved tarball/);
});
