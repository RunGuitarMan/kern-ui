import { spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { join } from 'node:path';

import express from 'express';

const workspace = process.cwd();
const host = '127.0.0.1';
const docsUrl = 'http://localhost:4200/';
const labUrl = 'http://localhost:4201/';
/** @type {import('node:http').Server[]} */
const applicationServers = [];
/** @type {import('node:http').Server | undefined} */
let healthServer;
let shuttingDown = false;

/** @param {string} url */
async function responds(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(1_000) });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * @param {string} url
 * @param {string} label
 * @param {number} [timeout]
 */
async function waitFor(url, label, timeout = 120_000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await responds(url)) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`${label} did not become ready at ${url} within ${timeout}ms.`);
}

/** @param {string} script */
function runBuild(script) {
  const result = spawnSync('npm', ['run', script], {
    cwd: workspace,
    env: process.env,
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    throw new Error(`npm run ${script} exited with status ${result.status ?? 'unknown'}.`);
  }
}

/**
 * @param {string} label
 * @param {string} root
 * @param {string} fallback
 * @param {number} port
 */
function startProject(label, root, fallback, port) {
  const application = express();
  application.disable('x-powered-by');
  application.use(express.static(root, { index: 'index.html' }));
  application.use((request, response, next) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      next();
      return;
    }
    response.sendFile(fallback);
  });
  const server = application.listen(port, host);
  applicationServers.push(server);
  server.once('error', (error) => {
    if (!shuttingDown) console.error(`${label} static server failed.`, error);
  });
}

async function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const server of applicationServers) {
    await new Promise((resolve) => server.close(resolve));
  }
  if (healthServer) {
    const server = healthServer;
    await new Promise((resolve) => server.close(resolve));
  }
  process.exit(0);
}

const docsAlreadyRunning = await responds(docsUrl);
const labAlreadyRunning = await responds(labUrl);

if (!docsAlreadyRunning || !labAlreadyRunning) {
  // Build and serve production output. This validates exactly what ships and
  // avoids two long-lived esbuild watchers competing on constrained CI hosts.
  runBuild('build:kern');
  runBuild('build:showcase');
  if (!docsAlreadyRunning) runBuild('build:docs');
  if (!labAlreadyRunning) runBuild('build:lab');
}

if (!docsAlreadyRunning) {
  const docsRoot = join(workspace, 'dist', 'docs', 'browser');
  startProject('Docs', docsRoot, join(docsRoot, 'index.csr.html'), 4200);
  await waitFor(docsUrl, 'Docs');
}
if (!labAlreadyRunning) {
  const labRoot = join(workspace, 'dist', 'lab', 'browser');
  startProject('Lab', labRoot, join(labRoot, 'index.html'), 4201);
  await waitFor(labUrl, 'Lab');
}

healthServer = createServer((request, response) => {
  if (request.url === '/ready') {
    response.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('docs=ready lab=ready');
    return;
  }
  response.writeHead(404);
  response.end();
});

healthServer.listen(4199, host);
process.once('SIGINT', () => void shutdown());
process.once('SIGTERM', () => void shutdown());
