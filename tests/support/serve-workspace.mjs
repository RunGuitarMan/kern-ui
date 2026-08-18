import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { join } from 'node:path';

const workspace = process.cwd();
const host = '127.0.0.1';
const docsUrl = 'http://127.0.0.1:4200/';
const reuseExistingServer = process.env['KERN_E2E_REUSE_SERVER'] === 'true';
/** @type {import('node:child_process').ChildProcess[]} */
const applicationProcesses = [];
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
 * Runs the built Angular Node server so browser tests exercise server rendering
 * and hydration instead of a client-side index fallback.
 *
 * @param {string} entry
 * @param {number} port
 */
function startDocsServer(entry, port) {
  const child = spawn(process.execPath, [entry], {
    cwd: workspace,
    env: {
      ...process.env,
      PORT: String(port),
    },
    stdio: 'inherit',
  });
  applicationProcesses.push(child);
  child.once('exit', (code, signal) => {
    if (!shuttingDown) {
      console.error(
        `Docs SSR server exited unexpectedly (${signal ?? `status ${code ?? 'unknown'}`}).`,
      );
      void shutdown(1);
    }
  });
}

/** @param {number} [exitCode] */
async function shutdown(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of applicationProcesses) {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill('SIGTERM');
    }
  }
  if (healthServer) {
    const server = healthServer;
    await new Promise((resolve) => server.close(resolve));
  }
  process.exit(exitCode);
}

const docsAlreadyRunning = reuseExistingServer && (await responds(docsUrl));

if (!docsAlreadyRunning) {
  // Nx builds the complete docs dependency graph in production mode. Serving
  // that output validates exactly what ships and avoids a long-lived watcher
  // on constrained CI hosts.
  runBuild('build:docs');
}

if (!docsAlreadyRunning) {
  startDocsServer(join(workspace, 'dist', 'docs', 'server', 'server.mjs'), 4200);
  await waitFor(docsUrl, 'Docs');
}
healthServer = createServer((request, response) => {
  if (request.url === '/ready') {
    response.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('docs=ready');
    return;
  }
  response.writeHead(404);
  response.end();
});

healthServer.listen(4199, host);
process.once('SIGINT', () => void shutdown());
process.once('SIGTERM', () => void shutdown());
