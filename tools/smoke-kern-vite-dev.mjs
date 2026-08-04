import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { createServer } from 'node:net';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { chromium } from '@playwright/test';

const workspaceRoot = resolve(import.meta.dirname, '..');
const nxCli = resolve(workspaceRoot, 'node_modules/nx/dist/bin/nx.js');
const viteCacheRoot = resolve(workspaceRoot, '.nx/cache/angular-vite-smoke');
const compilerCachePreload = `--import=${
  pathToFileURL(resolve(workspaceRoot, 'tools/vite-smoke/in-memory-angular-compiler-cache.mjs'))
    .href
}`;

const port = await new Promise((resolvePort, rejectPort) => {
  const reservation = createServer();
  reservation.once('error', rejectPort);
  reservation.listen(0, '127.0.0.1', () => {
    const address = reservation.address();
    if (!address || typeof address === 'string') {
      reservation.close();
      rejectPort(new Error('Unable to reserve a Vite smoke-test port.'));
      return;
    }
    reservation.close((error) => {
      if (error) rejectPort(error);
      else resolvePort(address.port);
    });
  });
});
const origin = `http://127.0.0.1:${port}`;
const readinessUrl = `${origin}/`;
const initialComponentUrl = `${origin}/components/dropdown-button`;
const nextComponentUrl = `${origin}/components/form-field`;
const prebundleDisabledMessage = 'Prebundling has been configured but will not be used';
let output = '';
let prebundleDisabled = false;
let prebundleLogTail = '';

await rm(viteCacheRoot, { force: true, recursive: true });

const server = spawn(
  process.execPath,
  [
    nxCli,
    'serve',
    'docs-vite-smoke',
    '--excludeTaskDependencies',
    '--poll',
    '1000',
    '--hmr=false',
    '--host',
    '127.0.0.1',
    '--port',
    String(port),
  ],
  {
    cwd: workspaceRoot,
    detached: process.platform !== 'win32',
    env: {
      ...process.env,
      FORCE_COLOR: '0',
      KERN_VITE_SMOKE_CACHE_ROOT: viteCacheRoot,
      NODE_OPTIONS: [process.env['NODE_OPTIONS'], compilerCachePreload].filter(Boolean).join(' '),
      NX_DAEMON: 'false',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  },
);

for (const stream of [server.stdout, server.stderr]) {
  stream?.on('data', (chunk) => {
    const text = String(chunk);
    const prebundleProbe = `${prebundleLogTail}${text}`;
    if (prebundleProbe.includes(prebundleDisabledMessage)) prebundleDisabled = true;
    prebundleLogTail = prebundleProbe.slice(-(prebundleDisabledMessage.length - 1));
    output = `${output}${text}`.slice(-20_000);
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

async function waitForServer() {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    const state = await Promise.race([
      stopped.then((result) => ({ type: 'stopped', result })),
      fetch(readinessUrl, { signal: AbortSignal.timeout(1_000) })
        .then((response) => ({ type: 'response', response }))
        .catch(() => ({ type: 'retry' })),
    ]);
    if (state.type === 'stopped') {
      throw new Error(
        `Vite dev server stopped before becoming ready (${state.result.signal ?? `status ${state.result.code ?? 'unknown'}`}).`,
      );
    }
    if (state.type === 'response' && state.response.ok) {
      await state.response.body?.cancel();
      return;
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 250));
  }
  throw new Error('Vite dev server did not become ready within 120s.');
}

async function verifyBrowserRuntime() {
  const browserErrors = [];
  const routeScriptResponses = [];
  const configuredExecutablePath = process.env['PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH']?.trim();
  const platformExecutablePath =
    process.platform === 'darwin'
      ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
      : undefined;
  const executablePath = [configuredExecutablePath, platformExecutablePath].find(
    (candidate) => candidate && existsSync(candidate),
  );
  const browser = await chromium.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {}),
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      reducedMotion: 'reduce',
      serviceWorkers: 'block',
    });
    const page = await context.newPage();
    let routeNavigationStarted = false;

    page.on('pageerror', (error) => {
      browserErrors.push(`pageerror: ${error.message}`);
    });
    page.on('console', (message) => {
      if (message.type() === 'error') browserErrors.push(`console: ${message.text()}`);
    });
    page.on('requestfailed', (request) => {
      browserErrors.push(
        `requestfailed: ${request.method()} ${request.url()} · ${request.failure()?.errorText ?? 'unknown failure'}`,
      );
    });
    page.on('response', (response) => {
      if (
        routeNavigationStarted &&
        response.ok() &&
        response.request().resourceType() === 'script'
      ) {
        routeScriptResponses.push(response.url());
      }
    });

    await page.goto(initialComponentUrl, { waitUntil: 'networkidle', timeout: 120_000 });
    await page.locator('kdocs-root[ng-version]').waitFor({ state: 'attached' });

    const dropdownSpecimen = page.getByTestId('component-specimen-dropdown-button');
    await dropdownSpecimen.waitFor({ state: 'visible' });
    if ((await dropdownSpecimen.locator('.specimen-loading').count()) !== 0) {
      throw new Error('The lazy dropdown-button specimen remained on its defer placeholder.');
    }

    const dropdownTrigger = dropdownSpecimen.getByRole('button', {
      name: 'Export',
      exact: true,
    });
    await dropdownTrigger.click();
    const menu = page.getByRole('menu');
    await menu.waitFor({ state: 'visible' });
    if ((await dropdownTrigger.getAttribute('aria-expanded')) !== 'true') {
      throw new Error('The hydrated dropdown did not expose its open state.');
    }
    await page.keyboard.press('Escape');
    await menu.waitFor({ state: 'hidden' });

    await page.evaluate(() => {
      Reflect.set(globalThis, '__kernViteSmokeDocument', 'preserved');
    });
    const nextLink = page.locator('.component-pager a.next');
    await nextLink.waitFor({ state: 'visible' });
    if ((await nextLink.getAttribute('href')) !== '/components/form-field') {
      throw new Error('The Vite smoke route boundary no longer targets form-field.');
    }

    routeNavigationStarted = true;
    await Promise.all([page.waitForURL(nextComponentUrl), nextLink.click()]);
    const formFieldSpecimen = page.getByTestId('component-specimen-form-field');
    await formFieldSpecimen.waitFor({ state: 'visible' });
    if ((await formFieldSpecimen.locator('.specimen-loading').count()) !== 0) {
      throw new Error('The cross-category lazy form-field specimen remained deferred.');
    }
    if (
      (await page.evaluate(() => Reflect.get(globalThis, '__kernViteSmokeDocument'))) !==
      'preserved'
    ) {
      throw new Error('Component navigation reloaded the document instead of using Angular.');
    }
    if (routeScriptResponses.length === 0) {
      throw new Error('Cross-category navigation did not load a lazy Vite script chunk.');
    }

    const workspaceName = formFieldSpecimen.getByRole('textbox', { name: /Workspace name/ });
    await workspaceName.fill('Vite runtime verified');
    if ((await workspaceName.inputValue()) !== 'Vite runtime verified') {
      throw new Error('The lazy form-field specimen did not accept client-side input.');
    }

    const overlayCount = await page.locator('vite-error-overlay, ng-error-overlay').count();
    if (overlayCount !== 0) {
      throw new Error(`Vite rendered ${overlayCount} runtime error overlay(s).`);
    }
    if (browserErrors.length > 0) {
      throw new Error(`Vite browser runtime failed:\n${browserErrors.join('\n')}`);
    }
  } finally {
    await browser.close();
  }
}

try {
  await waitForServer();
  if (prebundleDisabled) {
    throw new Error('Angular disabled the configured Vite dependency prebundling.');
  }
  await verifyBrowserRuntime();
  if (prebundleDisabled) {
    throw new Error('Angular disabled the configured Vite dependency prebundling.');
  }
  console.log('Kern Vite development server browser smoke test passed.');
} catch (error) {
  console.error(output);
  throw error;
} finally {
  try {
    await stop();
  } finally {
    await rm(viteCacheRoot, { force: true, recursive: true });
  }
}
