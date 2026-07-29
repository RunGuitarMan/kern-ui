import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { it } from 'node:test';

const workspaceRoot = resolve(import.meta.dirname, '../../..');

it('keeps the compiler-backed agent contract deterministic and current', () => {
  const result = spawnSync(process.execPath, ['scripts/generate-agent-contract.mjs'], {
    cwd: workspaceRoot,
    encoding: 'utf8',
    timeout: 30_000,
  });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /131 components/);
  assert.match(result.stdout, /agent contract is current/);
});
