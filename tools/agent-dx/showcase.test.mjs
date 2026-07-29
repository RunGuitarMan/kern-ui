import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';

const workspaceRoot = resolve(import.meta.dirname, '../..');

describe('KERN Docs and Lab example integration', () => {
  it('keeps the generated showcase registry current', () => {
    const result = spawnSync(process.execPath, ['scripts/generate-showcase-example-registry.mjs'], {
      cwd: workspaceRoot,
      encoding: 'utf8',
    });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.match(result.stdout, /131 packed-package AOT examples/);
  });

  it('uses the compile-verified registry instead of handwritten fallback snippets', async () => {
    const source = await readFile(
      resolve(workspaceRoot, 'projects/docs/src/app/pages/component-page.ts'),
      'utf8',
    );
    assert.match(source, /findKernAgentExample/);
    assert.match(source, /Strict AOT verified against the packed npm artifact/);
    assert.doesNotMatch(source, /EXAMPLE_MARKUP|COMPANION_EXAMPLE_SYMBOLS/);
  });

  it('keeps a focused shared Docs and Lab specimen for every catalog entry', () => {
    const result = spawnSync(process.execPath, ['tools/verify-kern-specimen-coverage.mjs'], {
      cwd: workspaceRoot,
      encoding: 'utf8',
    });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.match(result.stdout, /131\/131 catalog components/);
  });
});
