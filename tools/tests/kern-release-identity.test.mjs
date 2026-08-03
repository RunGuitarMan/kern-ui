import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { assertDistTagVersion, publicationDecision } from '../publish-kern-release-package.mjs';

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const verifier = resolve(workspaceRoot, 'tools/verify-kern-release-identity.mjs');
const fixtures = resolve(workspaceRoot, 'tools/tests/fixtures/release-identity');
const validFixture = resolve(fixtures, 'valid');
const releaseWorkflow = resolve(workspaceRoot, '.github/workflows/release-candidate.yml');

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

  assert.equal(invocations.length, 2);
  assert.ok(publishJob >= 0, 'release workflow must define the approved publish job');
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
