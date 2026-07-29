import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { lstat, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from '@playwright/test';

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const evidencePath = 'browser/kern-hydration-evidence.json';
const requestTimeoutMilliseconds = 15_000;
const evidenceChecks = [
  'ssr-versioned-base-path',
  'ssr-hydration-markers',
  'browser-angular-bootstrap',
  'client-router-lazy-route',
  'hydrated-component-interaction',
  'runtime-error-free',
  'request-failure-free',
  'agent-contract-base-path',
];

function option(name, fallback = null) {
  const prefix = `--${name}=`;
  const argument = process.argv.find((value) => value.startsWith(prefix));
  return argument ? argument.slice(prefix.length) : fallback;
}

function normalizeBasePath(value) {
  if (
    typeof value !== 'string' ||
    !value.startsWith('/') ||
    value.includes('\\') ||
    value.split('/').includes('..')
  ) {
    throw new Error(`Invalid versioned documentation base path: ${value}`);
  }
  return value === '/' ? '/' : `${value.replace(/\/+$/, '')}/`;
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function posixPath(path) {
  return path.split(sep).join('/');
}

function contentDigest(files) {
  const hash = createHash('sha256');
  for (const file of files) {
    hash.update(file.path);
    hash.update('\0');
    hash.update(file.sha256);
    hash.update('\0');
    hash.update(String(file.bytes));
    hash.update('\0');
  }
  return hash.digest('hex');
}

async function collectBuildIdentity(root, excludedPath) {
  const files = [];

  async function visit(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name, 'en'));
    for (const entry of entries) {
      const path = resolve(directory, entry.name);
      const relativePath = posixPath(relative(root, path));
      if (relativePath === excludedPath) continue;
      if (entry.isSymbolicLink()) {
        throw new Error(`Versioned documentation build contains a symlink: ${relativePath}`);
      }
      if (entry.isDirectory()) {
        await visit(path);
        continue;
      }
      if (!entry.isFile()) {
        throw new Error(`Unsupported documentation build entry: ${relativePath}`);
      }
      const [metadata, content] = await Promise.all([lstat(path), readFile(path)]);
      files.push({
        path: relativePath,
        bytes: metadata.size,
        sha256: sha256(content),
      });
    }
  }

  await visit(root);
  files.sort((left, right) => left.path.localeCompare(right.path, 'en'));
  return {
    fileCount: files.length,
    totalBytes: files.reduce((sum, file) => sum + file.bytes, 0),
    contentSha256: contentDigest(files),
  };
}

async function fetchEventually(url, attempts = 40) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        redirect: 'error',
        signal: AbortSignal.timeout(2_000),
      });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      return response;
    } catch (error) {
      lastError = error;
      await new Promise((resolvePromise) => setTimeout(resolvePromise, 250));
    }
  }
  throw lastError;
}

function assertWithinBase(url, baseUrl, label) {
  if (url.origin !== baseUrl.origin || !url.pathname.startsWith(baseUrl.pathname)) {
    throw new Error(`${label} escapes the versioned base path: ${url.href}`);
  }
}

async function fetchRequired(url, baseUrl, label) {
  assertWithinBase(url, baseUrl, label);
  const response = await fetch(url, {
    redirect: 'error',
    signal: AbortSignal.timeout(requestTimeoutMilliseconds),
  });
  if (!response.ok) {
    throw new Error(`${label} was not served at ${url.pathname} (${response.status}).`);
  }
  if (response.headers.get('content-type')?.includes('text/html')) {
    throw new Error(`${label} resolved to the documentation HTML fallback at ${url.pathname}.`);
  }
  if (baseUrl.pathname !== '/') {
    const cacheControl = response.headers.get('cache-control')?.toLowerCase() ?? '';
    const directives = new Set(cacheControl.split(',').map((directive) => directive.trim()));
    if (!directives.has('max-age=31536000') || !directives.has('immutable')) {
      throw new Error(
        `${label} must be immutable for a versioned deployment; received Cache-Control "${cacheControl}".`,
      );
    }
  }
  return response;
}

async function mapConcurrent(values, concurrency, operation) {
  let cursor = 0;
  const workers = Array.from(
    { length: Math.min(concurrency, Math.max(values.length, 1)) },
    async () => {
      while (cursor < values.length) {
        const index = cursor;
        cursor += 1;
        await operation(values[index], index);
      }
    },
  );
  await Promise.all(workers);
}

function relativeMarkdownLinks(source) {
  const links = [];
  const pattern = /\[[^\]]*]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g;
  for (const match of source.matchAll(pattern)) {
    const link = match[1];
    if (link && !link.startsWith('#') && !/^[a-z][a-z\d+.-]*:/i.test(link)) {
      links.push(link);
    }
  }
  return [...new Set(links)].sort((left, right) => left.localeCompare(right, 'en'));
}

async function verifyAgentContract(origin, basePath) {
  const baseUrl = new URL(basePath, origin);
  const contractPrefixes = ['', 'agent/'];
  const requiredPaths = [
    'llms.txt',
    'component-manifest.json',
    'component-manifest.schema.json',
    'import-map.json',
    'root-export-map.json',
    'checklist.md',
    'common-mistakes.md',
    'llms-full.txt',
    'examples/index.json',
  ];
  const bodies = new Map();
  const deployedPaths = contractPrefixes.flatMap((prefix) =>
    requiredPaths.map((path) => `${prefix}${path}`),
  );

  await mapConcurrent(deployedPaths, 8, async (path) => {
    const url = new URL(path, baseUrl);
    const response = await fetchRequired(url, baseUrl, `Agent contract ${path}`);
    bodies.set(path, await response.text());
  });
  for (const path of requiredPaths) {
    if (bodies.get(path) !== bodies.get(`agent/${path}`)) {
      throw new Error(`Agent contract ${path} differs between the root and /agent namespaces.`);
    }
  }

  for (const prefix of contractPrefixes) {
    for (const path of [
      'component-manifest.schema.json',
      'import-map.json',
      'root-export-map.json',
      'examples/index.json',
    ]) {
      try {
        JSON.parse(bodies.get(`${prefix}${path}`));
      } catch {
        throw new Error(`Agent contract ${prefix}${path} is not valid JSON.`);
      }
    }

    const llmsPath = `${prefix}llms.txt`;
    const llmsUrl = new URL(llmsPath, baseUrl);
    const llmsLinks = relativeMarkdownLinks(bodies.get(llmsPath));
    if (llmsLinks.length === 0) {
      throw new Error(`Agent contract ${llmsPath} contains no relative discovery links.`);
    }
    await mapConcurrent(llmsLinks, 16, async (link) => {
      const url = new URL(link, llmsUrl);
      const response = await fetchRequired(url, baseUrl, `${llmsPath} link ${link}`);
      await response.arrayBuffer();
    });

    const manifestPath = `${prefix}component-manifest.json`;
    let manifest;
    try {
      manifest = JSON.parse(bodies.get(manifestPath));
    } catch {
      throw new Error(`Agent contract ${manifestPath} is not valid JSON.`);
    }
    if (!Array.isArray(manifest.components) || manifest.components.length === 0) {
      throw new Error(`Agent contract ${manifestPath} requires a non-empty components list.`);
    }

    const manifestUrl = new URL(manifestPath, baseUrl);
    const componentIds = new Set();
    const artifactUrls = [];
    for (const component of manifest.components) {
      if (
        typeof component.id !== 'string' ||
        !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(component.id) ||
        componentIds.has(component.id)
      ) {
        throw new Error(
          `Agent contract ${manifestPath} contains an invalid component id: ${component.id}`,
        );
      }
      componentIds.add(component.id);
      const documentation = component.documentation;
      if (documentation?.route !== `components/${component.id}`) {
        throw new Error(
          `Agent contract route for ${component.id} must be relative components/${component.id}.`,
        );
      }
      for (const [format, extension] of [
        ['json', 'json'],
        ['markdown', 'md'],
      ]) {
        const expectedPath = `components/${component.id}.${extension}`;
        if (documentation[format] !== expectedPath) {
          throw new Error(
            `Agent contract ${component.id} documentation.${format} must be manifest-relative ${expectedPath}.`,
          );
        }
        const url = new URL(documentation[format], manifestUrl);
        assertWithinBase(url, baseUrl, `${component.id} documentation.${format}`);
        artifactUrls.push({
          url,
          label: `${manifestPath} ${component.id} documentation.${format}`,
          format,
        });
      }
      if (!Array.isArray(component.examples) || component.examples.length === 0) {
        throw new Error(`Agent contract ${component.id} requires a non-empty examples list.`);
      }
      for (const example of component.examples) {
        const expectedPath = `examples/${component.id}.ts`;
        if (example.source !== expectedPath) {
          throw new Error(
            `Agent contract ${component.id} example source must be manifest-relative ${expectedPath}.`,
          );
        }
        const url = new URL(example.source, manifestUrl);
        assertWithinBase(url, baseUrl, `${component.id} component example source`);
        artifactUrls.push({
          url,
          label: `${manifestPath} ${component.id} component example source`,
          format: 'typescript',
        });
      }
    }
    if (!Array.isArray(manifest.recipes) || manifest.recipes.length === 0) {
      throw new Error(`Agent contract ${manifestPath} requires a non-empty recipes list.`);
    }
    const recipeIds = new Set();
    for (const recipe of manifest.recipes) {
      if (
        typeof recipe.id !== 'string' ||
        !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(recipe.id) ||
        recipeIds.has(recipe.id) ||
        !/^sha256-[0-9a-f]{64}$/.test(recipe.sourceDigest ?? '')
      ) {
        throw new Error(`Agent contract ${manifestPath} contains an invalid recipe: ${recipe.id}`);
      }
      recipeIds.add(recipe.id);
      const expectedPath = `recipes/${recipe.id}.ts`;
      if (recipe.source !== expectedPath) {
        throw new Error(
          `Agent contract recipe ${recipe.id} source must be manifest-relative ${expectedPath}.`,
        );
      }
      const url = new URL(recipe.source, manifestUrl);
      assertWithinBase(url, baseUrl, `${recipe.id} recipe source`);
      artifactUrls.push({
        url,
        label: `${manifestPath} ${recipe.id} recipe source`,
        format: 'typescript',
        digest: recipe.sourceDigest,
      });
    }

    const exampleIndexPath = `${prefix}examples/index.json`;
    const exampleIndexUrl = new URL(exampleIndexPath, baseUrl);
    const exampleIndex = JSON.parse(bodies.get(exampleIndexPath));
    if (!Array.isArray(exampleIndex.examples) || exampleIndex.examples.length === 0) {
      throw new Error(`Agent contract ${exampleIndexPath} requires a non-empty examples list.`);
    }
    if (exampleIndex.total !== exampleIndex.examples.length) {
      throw new Error(`Agent contract ${exampleIndexPath} total does not match its examples list.`);
    }
    const exampleIds = new Set();
    for (const example of exampleIndex.examples) {
      if (
        typeof example.id !== 'string' ||
        !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(example.id) ||
        exampleIds.has(example.id) ||
        !/^sha256-[0-9a-f]{64}$/.test(example.sourceDigest ?? '')
      ) {
        throw new Error(
          `Agent contract ${exampleIndexPath} contains an invalid example: ${example.id}`,
        );
      }
      exampleIds.add(example.id);
      const expectedPath = `${example.id}.ts`;
      if (example.source !== expectedPath) {
        throw new Error(
          `Agent contract example ${example.id} source must be index-relative ${expectedPath}.`,
        );
      }
      const url = new URL(example.source, exampleIndexUrl);
      assertWithinBase(url, baseUrl, `${example.id} example source`);
      artifactUrls.push({
        url,
        label: `${exampleIndexPath} ${example.id} example source`,
        format: 'typescript',
        digest: example.sourceDigest,
      });
    }

    await mapConcurrent(artifactUrls, 16, async ({ url, label, format, digest }) => {
      const response = await fetchRequired(url, baseUrl, label);
      const content = Buffer.from(await response.arrayBuffer());
      if (content.length === 0) throw new Error(`${label} is empty.`);
      if (format === 'json') {
        try {
          JSON.parse(content.toString('utf8'));
        } catch {
          throw new Error(`${label} is not valid JSON.`);
        }
      }
      if (digest !== undefined && digest !== `sha256-${sha256(content)}`) {
        throw new Error(`${label} does not match its declared source digest.`);
      }
    });
  }
}

async function verifyBrowserHydration(origin, basePath, playwrightVersion) {
  const errors = [];
  const executablePath = process.env['PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH']?.trim();
  const browser = await chromium.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {}),
  });
  const browserVersion = browser.version();

  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      reducedMotion: 'reduce',
      serviceWorkers: 'block',
    });
    const page = await context.newPage();
    page.on('pageerror', (error) => {
      errors.push(`pageerror: ${error.message}`);
    });
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(`console: ${message.text()}`);
    });
    page.on('requestfailed', (request) => {
      errors.push(
        `requestfailed: ${request.method()} ${request.url()} · ${
          request.failure()?.errorText ?? 'unknown failure'
        }`,
      );
    });
    page.on('response', (response) => {
      if (response.status() >= 400) {
        errors.push(
          `response: ${response.status()} ${response.request().method()} ${response.url()}`,
        );
      }
    });

    const homeUrl = new URL(basePath, origin).href;
    await page.goto(homeUrl, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => Boolean(document.querySelector('[ng-version]')));
    await page.evaluate(() => {
      Reflect.set(globalThis, '__kernVersionedSmokeDocument', 'preserved');
    });

    const browseLink = page.getByRole('link', { name: /Browse components/i }).first();
    await browseLink.waitFor({ state: 'visible' });
    await Promise.all([
      page.waitForURL(new URL('components/button', homeUrl).href),
      browseLink.click(),
    ]);
    await page.waitForLoadState('networkidle');
    await page.getByTestId('component-specimen-button').waitFor({ state: 'visible' });
    if (
      (await page.evaluate(() => Reflect.get(globalThis, '__kernVersionedSmokeDocument'))) !==
      'preserved'
    ) {
      throw new Error(
        'Browse-components navigation reloaded the document instead of using Angular.',
      );
    }

    const tabsUrl = new URL('components/tabs', homeUrl).href;
    const tabsLink = page.locator('a[href$="/components/tabs"]').first();
    await tabsLink.waitFor({ state: 'attached' });
    await Promise.all([page.waitForURL(tabsUrl), tabsLink.evaluate((element) => element.click())]);
    await page.waitForLoadState('networkidle');
    if (
      (await page.evaluate(() => Reflect.get(globalThis, '__kernVersionedSmokeDocument'))) !==
      'preserved'
    ) {
      throw new Error('Tabs navigation reloaded the document instead of using the Angular router.');
    }

    const specimen = page.getByTestId('component-specimen-tabs');
    await specimen.waitFor({ state: 'visible' });
    const tabs = specimen.getByRole('tab');
    if ((await tabs.count()) < 2) {
      throw new Error('Tabs specimen does not expose two interactive tabs.');
    }
    const firstTab = tabs.nth(0);
    const secondTab = tabs.nth(1);
    if ((await firstTab.getAttribute('aria-selected')) !== 'true') {
      throw new Error('Tabs specimen did not hydrate with its initial selected state.');
    }
    await secondTab.click();
    const secondTabHandle = await secondTab.elementHandle();
    if (!secondTabHandle) throw new Error('Tabs specimen lost its interactive tab element.');
    await page.waitForFunction(
      (element) => element.getAttribute('aria-selected') === 'true',
      secondTabHandle,
    );
    await secondTabHandle.dispose();
    if ((await firstTab.getAttribute('aria-selected')) !== 'false') {
      throw new Error('Tabs specimen click did not update the Angular component state.');
    }
    if (!page.url().startsWith(new URL(basePath, origin).href)) {
      throw new Error(`Client navigation escaped the versioned base path: ${page.url()}`);
    }

    await context.close();
  } finally {
    await browser.close();
  }

  if (errors.length > 0) {
    throw new Error(`Chromium reported runtime or request failures:\n- ${errors.join('\n- ')}`);
  }
  return {
    engine: 'chromium',
    version: browserVersion,
    headless: true,
    automation: {
      package: '@playwright/test',
      version: playwrightVersion,
    },
  };
}

async function stopServer(server) {
  if (server.exitCode !== null || server.signalCode !== null) return false;
  server.kill('SIGTERM');
  const stopped = await Promise.race([
    new Promise((resolvePromise) => server.once('exit', () => resolvePromise(true))),
    new Promise((resolvePromise) => setTimeout(() => resolvePromise(false), 2_000)),
  ]);
  if (stopped) return false;

  server.kill('SIGKILL');
  await Promise.race([
    new Promise((resolvePromise) => server.once('exit', resolvePromise)),
    new Promise((resolvePromise) => setTimeout(resolvePromise, 2_000)),
  ]);
  return true;
}

async function main() {
  const buildDirectory = resolve(
    workspaceRoot,
    option('input-dir', resolve(workspaceRoot, 'dist/versioned-docs')),
  );
  const basePath = normalizeBasePath(option('base-path'));
  const entrypoint = resolve(buildDirectory, 'server/server.mjs');
  const absoluteEvidencePath = resolve(buildDirectory, evidencePath);
  if (!existsSync(entrypoint)) {
    throw new Error(`Versioned documentation server is missing: ${entrypoint}`);
  }

  const port = Number.parseInt(option('port', '4173'), 10);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) {
    throw new Error(`Invalid smoke-test port: ${port}`);
  }
  const workspaceManifest = JSON.parse(
    await readFile(resolve(workspaceRoot, 'package.json'), 'utf8'),
  );
  const playwrightVersion = workspaceManifest.devDependencies?.['@playwright/test'];
  if (!/^\d+\.\d+\.\d+$/.test(playwrightVersion ?? '')) {
    throw new Error('Workspace @playwright/test must use an exact version.');
  }
  await rm(absoluteEvidencePath, { force: true });

  const origin = `http://127.0.0.1:${port}`;
  let serverOutput = '';
  const server = spawn(process.execPath, [entrypoint], {
    cwd: buildDirectory,
    env: {
      ...process.env,
      KERN_DOCS_BASE_PATH: basePath,
      PORT: String(port),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  server.stdout.on('data', (chunk) => {
    serverOutput += chunk;
  });
  server.stderr.on('data', (chunk) => {
    serverOutput += chunk;
  });

  let forcedShutdown = false;
  try {
    const home = await fetchEventually(`${origin}${basePath}`);
    const homeText = await home.text();
    if (!homeText.includes(`<base href="${basePath}">`)) {
      throw new Error('SSR response does not contain the requested versioned base path.');
    }
    if (
      !/ng-server-context=["'](?:ssr|ssg)["']/.test(homeText) ||
      !/\sngh=["'][^"']+["']/.test(homeText) ||
      !/<script[^>]+id=["']ng-state["'][^>]*>/.test(homeText)
    ) {
      throw new Error('SSR response does not contain Angular hydration markers.');
    }
    const mainBundle = /<script\s+src="([^"]*main-[A-Z0-9]+\.js)"\s+type="module">/i.exec(
      homeText,
    )?.[1];
    if (!mainBundle) throw new Error('SSR response does not reference a hashed main bundle.');

    const [asset, component] = await Promise.all([
      fetch(`${origin}${new URL(mainBundle, `${origin}${basePath}`).pathname}`, {
        redirect: 'error',
        signal: AbortSignal.timeout(requestTimeoutMilliseconds),
      }),
      fetch(`${origin}${basePath}components/tabs`, {
        redirect: 'error',
        signal: AbortSignal.timeout(requestTimeoutMilliseconds),
      }),
    ]);
    if (!asset.ok || !asset.headers.get('content-type')?.includes('javascript')) {
      throw new Error(`Versioned browser bundle was not served (${asset.status}).`);
    }
    const componentText = await component.text();
    if (
      !component.ok ||
      !componentText.includes(`<base href="${basePath}">`) ||
      !componentText.includes('data-testid="component-specimen-tabs"') ||
      !componentText.includes('ng-server-context="ssr"') ||
      !/\sngh=["'][^"']+["']/.test(componentText) ||
      !/<script[^>]+id=["']ng-state["'][^>]*>/.test(componentText)
    ) {
      throw new Error(`Versioned lazy component route was not SSR rendered (${component.status}).`);
    }

    await verifyAgentContract(origin, basePath);
    const browserEvidence = await verifyBrowserHydration(origin, basePath, playwrightVersion);

    const boundBuild = await collectBuildIdentity(buildDirectory, evidencePath);
    const evidence = {
      schemaVersion: 1,
      application: 'kern-documentation',
      evidenceType: 'browser-hydration-smoke',
      basePath,
      browser: browserEvidence,
      status: 'passed',
      checks: evidenceChecks,
      boundBuild,
    };
    await writeFile(absoluteEvidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
  } finally {
    forcedShutdown = await stopServer(server);
  }

  if (
    forcedShutdown ||
    (server.exitCode !== null && server.exitCode !== 0) ||
    (server.signalCode !== null && server.signalCode !== 'SIGTERM')
  ) {
    throw new Error(`Versioned documentation server failed:\n${serverOutput.trim()}`);
  }
  console.log(
    `Kern versioned documentation SSR, agent contract, and Chromium hydration verified at ${basePath}.`,
  );
}

try {
  await main();
} catch (error) {
  console.error(
    `Kern versioned documentation smoke verification failed: ${
      error instanceof Error ? error.message : String(error)
    }`,
  );
  process.exitCode = 1;
}
