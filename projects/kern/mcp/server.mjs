#!/usr/bin/env node

import { createInterface } from 'node:readline';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createKernAgentApi, loadManifest, toolDefinitions } from './lib.mjs';

const toolRoot = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(toolRoot, '../..');
const packagedManifestPath = resolve(toolRoot, '../agent/component-manifest.json');
const repositoryManifestPath = resolve(
  workspaceRoot,
  'metadata/agent/generated/component-manifest.json',
);
const manifestFlag = process.argv.indexOf('--manifest');
const manifestPath =
  manifestFlag >= 0 && process.argv[manifestFlag + 1]
    ? resolve(process.argv[manifestFlag + 1])
    : existsSync(packagedManifestPath)
      ? packagedManifestPath
      : repositoryManifestPath;
const manifest = await loadManifest(manifestPath);
const api = createKernAgentApi(manifest);

function response(id, result) {
  return { jsonrpc: '2.0', id, result };
}

function protocolError(id, code, message, data) {
  return {
    jsonrpc: '2.0',
    id: id ?? null,
    error: {
      code,
      message,
      ...(data === undefined ? {} : { data }),
    },
  };
}

async function handle(message) {
  if (!message || message.jsonrpc !== '2.0' || typeof message.method !== 'string') {
    return protocolError(message?.id, -32600, 'Invalid JSON-RPC request.');
  }
  switch (message.method) {
    case 'initialize':
      return response(message.id, {
        protocolVersion: message.params?.protocolVersion ?? '2025-06-18',
        capabilities: {
          tools: {
            listChanged: false,
          },
        },
        serverInfo: {
          name: 'kern-agent-contract',
          version: manifest.library.version,
        },
        instructions:
          'Search before selecting a component, read its contract and example, then validate usage. This server is read-only.',
      });
    case 'notifications/initialized':
      return undefined;
    case 'ping':
      return response(message.id, {});
    case 'tools/list':
      return response(message.id, { tools: toolDefinitions });
    case 'tools/call':
      return response(
        message.id,
        api.callTool(message.params?.name, message.params?.arguments ?? {}),
      );
    default:
      return protocolError(message.id, -32601, `Method not found: ${message.method}`);
  }
}

const lines = createInterface({
  input: process.stdin,
  crlfDelay: Infinity,
  terminal: false,
});

for await (const line of lines) {
  if (!line.trim()) continue;
  let message;
  try {
    message = JSON.parse(line);
  } catch (error) {
    process.stdout.write(
      `${JSON.stringify(protocolError(null, -32700, 'Parse error.', String(error)))}\n`,
    );
    continue;
  }
  try {
    const result = await handle(message);
    if (result) process.stdout.write(`${JSON.stringify(result)}\n`);
  } catch (error) {
    process.stdout.write(
      `${JSON.stringify(protocolError(message.id, -32603, 'Internal error.', String(error)))}\n`,
    );
  }
}
