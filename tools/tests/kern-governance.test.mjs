import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import './kern-release-identity.test.mjs';
import './kern-versioned-docs.test.mjs';

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const lifecycleScript = resolve(workspaceRoot, 'tools/verify-kern-lifecycle.mjs');
const accessibilityScript = resolve(workspaceRoot, 'tools/verify-kern-accessibility-evidence.mjs');
const packagePolicyScript = resolve(workspaceRoot, 'tools/verify-kern-package-policy.mjs');
const agentRoot = resolve(workspaceRoot, 'projects/kern/agent');
const docsReleaseIdentityPath = resolve(workspaceRoot, 'projects/docs/src/app/release-identity.ts');

function run(script, ...arguments_) {
  return spawnSync(process.execPath, [script, ...arguments_], {
    cwd: workspaceRoot,
    encoding: 'utf8',
    maxBuffer: 2 * 1024 * 1024,
  });
}

async function temporaryJson(name, value) {
  const directory = await mkdtemp(join(tmpdir(), 'kern-governance-'));
  const path = join(directory, name);
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  return { directory, path };
}

test('committed lifecycle and manual evidence registries verify', () => {
  const lifecycle = run(lifecycleScript);
  assert.equal(lifecycle.status, 0, lifecycle.stderr);
  assert.match(lifecycle.stdout, /131 catalog entries, 404 public symbols/);

  const accessibility = run(accessibilityScript);
  assert.equal(accessibility.status, 0, accessibility.stderr);
  assert.match(accessibility.stdout, /0 pass, 0 fail, 7 pending/);
  assert.match(accessibility.stdout, /not-certified/);

  const packagePolicy = run(packagePolicyScript);
  assert.equal(packagePolicy.status, 0, packagePolicy.stderr);
  assert.match(packagePolicy.stdout, /package policy verified/);
});

test('lifecycle verification rejects an unregistered public symbol', async () => {
  const registry = JSON.parse(
    await readFile(resolve(workspaceRoot, 'projects/kern/api/lifecycle.json'), 'utf8'),
  );
  registry.symbolGroups[0].symbols.shift();
  const temporary = await temporaryJson('lifecycle.json', registry);
  try {
    const result = run(lifecycleScript, `--lifecycle=${temporary.path}`);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /has no lifecycle registration/);
  } finally {
    await rm(temporary.directory, { recursive: true, force: true });
  }
});

test('lifecycle verification rejects an undocumented API deprecation', async () => {
  const registry = JSON.parse(
    await readFile(resolve(workspaceRoot, 'projects/kern/api/deprecations.json'), 'utf8'),
  );
  registry.entries.shift();
  const temporary = await temporaryJson('deprecations.json', registry);
  try {
    const result = run(lifecycleScript, `--deprecations=${temporary.path}`);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /is missing from deprecations\.json/);
  } finally {
    await rm(temporary.directory, { recursive: true, force: true });
  }
});

test('manual evidence cannot claim pass without execution metadata and artifacts', async () => {
  const evidence = JSON.parse(
    await readFile(resolve(workspaceRoot, 'docs/accessibility/manual-evidence.json'), 'utf8'),
  );
  evidence.records[0].status = 'pass';
  const temporary = await temporaryJson('manual-evidence.json', evidence);
  try {
    const result = run(accessibilityScript, `--evidence=${temporary.path}`);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /version is required for completed evidence/);
    assert.match(result.stderr, /evidence is required for completed evidence/);
  } finally {
    await rm(temporary.directory, { recursive: true, force: true });
  }
});

test('package policy rejects publication without provenance', async () => {
  const manifest = JSON.parse(
    await readFile(resolve(workspaceRoot, 'projects/kern/package.json'), 'utf8'),
  );
  manifest.publishConfig.provenance = false;
  const temporary = await temporaryJson('package.json', manifest);
  try {
    const result = run(packagePolicyScript, `--manifest=${temporary.path}`);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /provenance publication/);
  } finally {
    await rm(temporary.directory, { recursive: true, force: true });
  }
});

test('package policy requires the optional MCP TypeScript peer to cover the exact verified workspace version', async () => {
  const policy = JSON.parse(
    await readFile(resolve(workspaceRoot, 'projects/kern/api/release-policy.json'), 'utf8'),
  );
  policy.peerDependencies.typescript = '>=7.0.0 <8.0.0';
  const temporary = await temporaryJson('release-policy.json', policy);
  try {
    const result = run(packagePolicyScript, `--policy=${temporary.path}`);
    assert.notEqual(result.status, 0);
    assert.match(
      result.stderr,
      /must include the exact TypeScript version used by the verified workspace/,
    );
  } finally {
    await rm(temporary.directory, { recursive: true, force: true });
  }
});

test('package policy rejects a TypeScript MCP peer wider than Angular supports', async () => {
  const policy = JSON.parse(
    await readFile(resolve(workspaceRoot, 'projects/kern/api/release-policy.json'), 'utf8'),
  );
  policy.peerDependencies.typescript = '>=6.0.0 <8.0.0';
  const temporary = await temporaryJson('release-policy.json', policy);
  try {
    const result = run(packagePolicyScript, `--policy=${temporary.path}`);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /must stay within the Angular build peer range/);
  } finally {
    await rm(temporary.directory, { recursive: true, force: true });
  }
});

test('documentation publishes the canonical agent contract for web discovery', async () => {
  const workspace = JSON.parse(await readFile(resolve(workspaceRoot, 'angular.json'), 'utf8'));
  const assets = workspace.projects.docs.architect.build.options.assets;
  const agentAssets = assets.filter((asset) => asset.input === 'projects/kern/agent');

  assert.deepEqual(agentAssets, [
    {
      glob: '**/*',
      input: 'projects/kern/agent',
      ignore: ['**/tsconfig.json'],
      output: 'agent',
    },
    {
      glob: '**/*',
      input: 'projects/kern/agent',
      ignore: ['**/tsconfig.json'],
    },
  ]);
});

test('agent discovery links and manifest assets resolve from every supported web location', async () => {
  const [llms, manifest, examplesIndex] = await Promise.all([
    readFile(resolve(agentRoot, 'llms.txt'), 'utf8'),
    readFile(resolve(agentRoot, 'component-manifest.json'), 'utf8').then(JSON.parse),
    readFile(resolve(agentRoot, 'examples/index.json'), 'utf8').then(JSON.parse),
  ]);
  const links = [...llms.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)].map((match) => match[1]);
  const uniqueLinks = new Set(links);

  assert.equal(links.length, uniqueLinks.size, 'llms.txt must not publish duplicate links.');
  assert.equal(
    links.filter((link) => link.startsWith('./components/')).length,
    manifest.components.length,
  );
  for (const required of [
    './component-manifest.json',
    './import-map.json',
    './root-export-map.json',
    './checklist.md',
    './common-mistakes.md',
    './llms-full.txt',
    './examples/index.json',
  ]) {
    assert.ok(uniqueLinks.has(required), `llms.txt is missing ${required}.`);
  }

  for (const link of links) {
    assert.match(link, /^\.[/][a-z0-9][a-z0-9./-]*$/i);
    assert.doesNotMatch(link, /(?:^|[/])\.\.(?:[/]|$)/);
    await readFile(resolve(agentRoot, link.slice(2)));
  }

  const mounts = ['/', `/versions/${manifest.library.version}/`];
  for (const mount of mounts) {
    const mountUrl = new URL(mount, 'https://kern-ui.dev');
    for (const contractDirectory of ['', 'agent/']) {
      const contractRootUrl = new URL(contractDirectory, mountUrl);
      const llmsUrl = new URL('llms.txt', contractRootUrl);
      const manifestUrl = new URL('component-manifest.json', contractRootUrl);

      for (const link of links) {
        const resolved = new URL(link, llmsUrl);
        assert.equal(resolved.origin, mountUrl.origin);
        assert.equal(
          resolved.pathname,
          `${contractRootUrl.pathname}${link.slice(2)}`,
          `${link} does not map to the copied ${contractRootUrl.pathname} contract tree.`,
        );
      }

      const schemaUrl = new URL(manifest.$schema, manifestUrl);
      assert.equal(schemaUrl.pathname, `${contractRootUrl.pathname}component-manifest.schema.json`);

      for (const component of manifest.components) {
        assert.equal(component.documentation.route, `components/${component.id}`);
        assert.equal(component.documentation.json, `components/${component.id}.json`);
        assert.equal(component.documentation.markdown, `components/${component.id}.md`);
        assert.equal(component.examples[0].source, `examples/${component.id}.ts`);

        const routeUrl = new URL(component.documentation.route, mountUrl);
        assert.equal(routeUrl.pathname, `${mountUrl.pathname}components/${component.id}`);

        for (const asset of [
          component.documentation.json,
          component.documentation.markdown,
          component.examples[0].source,
        ]) {
          const resolved = new URL(asset, manifestUrl);
          assert.equal(
            resolved.pathname,
            `${contractRootUrl.pathname}${asset}`,
            `${asset} does not map to the copied ${contractRootUrl.pathname} contract tree.`,
          );
          await readFile(resolve(agentRoot, asset));
        }
      }

      for (const recipe of manifest.recipes) {
        assert.equal(recipe.source, `recipes/${recipe.id}.ts`);
        const resolved = new URL(recipe.source, manifestUrl);
        assert.equal(resolved.pathname, `${contractRootUrl.pathname}${recipe.source}`);
        await readFile(resolve(agentRoot, recipe.source));
      }

      const indexUrl = new URL('examples/index.json', contractRootUrl);
      for (const example of examplesIndex.examples) {
        assert.equal(example.source, `${example.id}.ts`);
        const resolved = new URL(example.source, indexUrl);
        assert.equal(resolved.pathname, `${contractRootUrl.pathname}examples/${example.id}.ts`);
        await readFile(resolve(agentRoot, 'examples', example.source));
      }
    }
  }
});

test('documentation release identity matches the package and exposes its publication state', async () => {
  const packageManifest = JSON.parse(
    await readFile(resolve(workspaceRoot, 'projects/kern/package.json'), 'utf8'),
  );
  const releaseIdentity = await readFile(docsReleaseIdentityPath, 'utf8');
  const versionMatch = releaseIdentity.match(
    /export const KERN_DOCS_VERSION = '([^']+)' as const;/,
  );
  const stateMatch = releaseIdentity.match(
    /export const KERN_DOCS_RELEASE_STATE(?:\s*:[^=]+)?\s*=\s*'([^']+)';/,
  );

  assert.ok(versionMatch, 'release-identity.ts must export a literal KERN_DOCS_VERSION');
  assert.ok(stateMatch, 'release-identity.ts must export a literal KERN_DOCS_RELEASE_STATE');
  assert.equal(versionMatch[1], packageManifest.version);
  assert.ok(
    ['source-candidate', 'released'].includes(stateMatch[1]),
    'documentation release state must be source-candidate or released',
  );

  const releaseSurfaces = await Promise.all(
    [
      'projects/docs/src/app/app.ts',
      'projects/docs/src/app/app.html',
      'projects/docs/src/app/pages/changelog.ts',
    ].map((path) => readFile(resolve(workspaceRoot, path), 'utf8')),
  );
  const renderedReleaseSource = releaseSurfaces.join('\n');

  assert.match(renderedReleaseSource, /KERN_DOCS_VERSION|docsVersion/);
  assert.match(renderedReleaseSource, /KERN_DOCS_RELEASE_STATE_LABEL|docsReleaseStateLabel/);
  if (stateMatch[1] === 'source-candidate') {
    assert.doesNotMatch(renderedReleaseSource, />\s*Current release\s*</);
  }
});
