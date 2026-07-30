import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';

const workspaceRoot = resolve(import.meta.dirname, '../..');

describe('KERN Docs and preview example integration', () => {
  it('keeps the generated showcase registry current', () => {
    const result = spawnSync(process.execPath, ['scripts/generate-showcase-example-registry.mjs'], {
      cwd: workspaceRoot,
      encoding: 'utf8',
    });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.match(result.stdout, /131 packed-package AOT examples/);
  });

  it('uses the compile-verified registry instead of handwritten fallback snippets', async () => {
    const [pageSource, playgroundSource] = await Promise.all([
      readFile(resolve(workspaceRoot, 'projects/docs/src/app/pages/component-page.ts'), 'utf8'),
      readFile(
        resolve(workspaceRoot, 'projects/docs/src/app/playground/component-playground.ts'),
        'utf8',
      ),
    ]);
    assert.match(pageSource, /findKernAgentExample/);
    assert.doesNotMatch(
      playgroundSource,
      /Strict AOT verified against the packed npm artifact/,
      'The Code tab derives runtime configuration from a compiled base example and must not label that snapshot as AOT verified.',
    );
    assert.match(
      playgroundSource,
      /base scaffold is\s+strict-AOT verified/i,
      'The Code tab must distinguish the compiled base example from its runtime preview snapshot.',
    );
    assert.doesNotMatch(
      `${pageSource}\n${playgroundSource}`,
      /EXAMPLE_MARKUP|COMPANION_EXAMPLE_SYMBOLS/,
    );
  });

  it('keeps a focused shared Docs preview specimen for every catalog entry', () => {
    const result = spawnSync(process.execPath, ['tools/verify-kern-specimen-coverage.mjs'], {
      cwd: workspaceRoot,
      encoding: 'utf8',
    });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.match(result.stdout, /131\/131 catalog components/);
  });

  it('publishes complete, executable playground metadata for every catalog entry', () => {
    const result = spawnSync(process.execPath, ['tools/verify-kern-playground-registry.mjs'], {
      cwd: workspaceRoot,
      encoding: 'utf8',
    });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.match(
      result.stdout,
      /131\/131 components; \d+ controls \(\d+\/\d+ public API, \d+ exact exclusions, 0 unclassified\); \d+ executable presets; \d+ fixture effects; 0 unmapped acceptance states/,
    );
  });
});
