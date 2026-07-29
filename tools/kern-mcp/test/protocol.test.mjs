import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { it } from 'node:test';

const workspaceRoot = resolve(import.meta.dirname, '../../..');
const server = resolve(workspaceRoot, 'tools/kern-mcp/server.mjs');

it('serves initialize, tools/list and tools/call over read-only stdio JSON-RPC', () => {
  const requests = [
    {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'test' } },
    },
    { jsonrpc: '2.0', method: 'notifications/initialized' },
    { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} },
    {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'get_component_contract',
        arguments: { component: 'button' },
      },
    },
  ];
  const result = spawnSync(process.execPath, [server], {
    cwd: workspaceRoot,
    input: `${requests.map((request) => JSON.stringify(request)).join('\n')}\n`,
    encoding: 'utf8',
    timeout: 10_000,
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, '');
  const responses = result.stdout
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line));
  assert.equal(responses.length, 3);
  assert.equal(responses[0].result.serverInfo.name, 'kern-agent-contract');
  assert.equal(responses[1].result.tools.length, 7);
  assert.equal(responses[2].result.structuredContent.id, 'button');
  assert.equal(responses[2].result.structuredContent.importPath, '@kern-ui/angular/kit');
});
