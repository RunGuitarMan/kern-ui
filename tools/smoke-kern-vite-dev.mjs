import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const workspaceRoot = resolve(import.meta.dirname, '..');
const nxCli = resolve(workspaceRoot, 'node_modules/nx/dist/bin/nx.js');
const port = 4309;
const url = `http://127.0.0.1:${port}/`;
let output = '';
let prebundlingDisabled = false;

const server = spawn(
  process.execPath,
  [
    nxCli,
    'serve',
    'docs',
    '--configuration',
    'development',
    '--excludeTaskDependencies',
    '--host',
    '127.0.0.1',
    '--port',
    String(port),
  ],
  {
    cwd: workspaceRoot,
    detached: process.platform !== 'win32',
    env: { ...process.env, CI: 'false', FORCE_COLOR: '0', NX_DAEMON: 'false' },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  },
);

for (const stream of [server.stdout, server.stderr]) {
  stream?.on('data', (chunk) => {
    const text = String(chunk);
    output = `${output}${text}`.slice(-20_000);
    if (output.includes('Prebundling has been configured but will not be used')) {
      prebundlingDisabled = true;
    }
  });
}

const stopped = new Promise((resolveStopped) => {
  server.once('exit', (code, signal) => resolveStopped({ code, signal }));
});

function signalProcessGroup(signal) {
  try {
    if (server.pid === undefined) server.kill(signal);
    else process.kill(-server.pid, signal);
  } catch (error) {
    if (error?.code !== 'ESRCH') throw error;
  }
}

async function terminateWindowsTree() {
  if (server.pid === undefined) {
    server.kill();
    return;
  }

  await new Promise((resolveTermination) => {
    const termination = spawn('taskkill', ['/pid', String(server.pid), '/T', '/F'], {
      stdio: 'ignore',
      windowsHide: true,
    });
    termination.once('error', resolveTermination);
    termination.once('exit', resolveTermination);
  });
}

async function stop() {
  if (process.platform === 'win32') await terminateWindowsTree();
  else signalProcessGroup('SIGTERM');
  await Promise.race([stopped, new Promise((resolveTimeout) => setTimeout(resolveTimeout, 5_000))]);
  if (server.exitCode === null && server.signalCode === null) {
    if (process.platform === 'win32') await terminateWindowsTree();
    else signalProcessGroup('SIGKILL');
  }
}

try {
  const deadline = Date.now() + 120_000;
  let ready = false;
  while (Date.now() < deadline) {
    const state = await Promise.race([
      stopped.then((result) => ({ type: 'stopped', result })),
      fetch(url, { signal: AbortSignal.timeout(1_000) })
        .then((response) => ({ type: 'response', response }))
        .catch(() => ({ type: 'retry' })),
    ]);
    if (state.type === 'stopped') {
      throw new Error(
        `Vite dev server stopped before becoming ready (${state.result.signal ?? `status ${state.result.code ?? 'unknown'}`}).`,
      );
    }
    if (state.type === 'response' && state.response.ok) {
      const html = await state.response.text();
      if (!html.includes('<kdocs-root')) {
        throw new Error('Vite dev server returned an unexpected document.');
      }
      if (prebundlingDisabled) {
        throw new Error('Angular disabled the configured Vite dependency prebundling.');
      }
      console.log('Kern Vite development server smoke test passed.');
      ready = true;
      break;
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 250));
  }
  if (!ready) throw new Error('Vite dev server did not become ready within 120s.');
} catch (error) {
  console.error(output);
  throw error;
} finally {
  await stop();
}
