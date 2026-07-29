import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { lstat, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { gzipSync, gunzipSync } from 'node:zlib';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const defaultInputDirectory = resolve(workspaceRoot, 'dist/versioned-docs');
const defaultArtifactDirectory = resolve(workspaceRoot, 'release');
const sourceManifestPath = resolve(workspaceRoot, 'projects/kern/package.json');
const workspaceManifestPath = resolve(workspaceRoot, 'package.json');
const nodeVersionPath = resolve(workspaceRoot, '.nvmrc');
const repository = 'https://github.com/RunGuitarMan/kern-ui.git';
const archiveRoot = 'kern-docs';
const hydrationEvidencePath = 'browser/kern-hydration-evidence.json';
const hydrationEvidenceChecks = [
  'ssr-versioned-base-path',
  'ssr-hydration-markers',
  'browser-angular-bootstrap',
  'client-router-lazy-route',
  'hydrated-component-interaction',
  'runtime-error-free',
  'request-failure-free',
  'agent-contract-base-path',
];
const maximumArchiveBytes = 256 * 1024 * 1024;
const maximumExpandedBytes = 512 * 1024 * 1024;
const maximumFileCount = 50_000;
const issues = [];

function option(name, fallback = null) {
  const prefix = `--${name}=`;
  const argument = process.argv.find((value) => value.startsWith(prefix));
  return argument ? argument.slice(prefix.length) : fallback;
}

function report(message) {
  issues.push(message);
}

function semver(value) {
  return (
    typeof value === 'string' &&
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?$/.test(value)
  );
}

async function readJson(path, label) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    throw new Error(
      `${label} could not be read at ${path}: ${error instanceof Error ? error.message : error}`,
    );
  }
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function posixPath(path) {
  return path.split(sep).join('/');
}

function isSafeRelativePath(path) {
  return (
    typeof path === 'string' &&
    path.length > 0 &&
    !path.startsWith('/') &&
    !path.includes('\\') &&
    path.split('/').every((segment) => segment && segment !== '.' && segment !== '..')
  );
}

async function collectFiles(root) {
  const files = [];

  async function visit(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name, 'en'));
    for (const entry of entries) {
      const path = resolve(directory, entry.name);
      const relativePath = posixPath(relative(root, path));
      if (!isSafeRelativePath(relativePath)) {
        throw new Error(`Unsafe documentation build path: ${relativePath}`);
      }
      if (entry.isSymbolicLink()) {
        throw new Error(`Documentation build must not contain symlinks: ${relativePath}`);
      }
      if (entry.isDirectory()) {
        await visit(path);
        continue;
      }
      if (!entry.isFile()) {
        throw new Error(`Unsupported documentation build entry: ${relativePath}`);
      }
      const metadata = await lstat(path);
      const content = await readFile(path);
      files.push({
        path: relativePath,
        bytes: metadata.size,
        sha256: sha256(content),
        content,
      });
    }
  }

  await visit(root);
  if (files.length > maximumFileCount) {
    throw new Error(`Documentation build exceeds ${maximumFileCount} files.`);
  }
  return files.sort((left, right) => left.path.localeCompare(right.path, 'en'));
}

function validateBuild(files, basePath) {
  const byPath = new Map(files.map((file) => [file.path, file]));
  for (const required of [
    'browser/index.html',
    'browser/index.csr.html',
    'prerendered-routes.json',
    'server/main.server.mjs',
    'server/server.mjs',
  ]) {
    if (!byPath.has(required)) report(`Documentation build is missing ${required}.`);
  }
  if (![...byPath.keys()].some((path) => /^browser\/main-[A-Z0-9]+\.js$/.test(path))) {
    report('Documentation build is missing the hashed browser main bundle.');
  }

  const htmlFiles = files.filter(
    (file) => file.path.startsWith('browser/') && file.path.endsWith('.html'),
  );
  if (htmlFiles.length === 0) report('Documentation build contains no browser HTML documents.');
  const escapedBasePath = basePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const basePattern = new RegExp(`<base\\s+href=["']${escapedBasePath}["']\\s*/?>`, 'i');
  for (const html of htmlFiles) {
    if (!basePattern.test(html.content.toString('utf8'))) {
      report(`${html.path} is not bound to version mount path ${basePath}.`);
    }
  }

  const routesFile = byPath.get('prerendered-routes.json');
  if (routesFile) {
    try {
      const routes = JSON.parse(routesFile.content.toString('utf8')).routes;
      const rootRoute = basePath === '/' ? '/' : basePath.slice(0, -1);
      if (!routes || typeof routes !== 'object' || !Object.hasOwn(routes, rootRoute)) {
        report(`prerendered-routes.json must contain versioned root route ${rootRoute}.`);
      }
    } catch {
      report('prerendered-routes.json is not valid JSON.');
    }
  }
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

function hydrationEvidenceMetadata(evidenceFile, evidence) {
  return {
    schemaVersion: evidence.schemaVersion,
    type: evidence.evidenceType,
    path: evidenceFile.path,
    sha256: evidenceFile.sha256,
    basePath: evidence.basePath,
    browser: evidence.browser,
    status: evidence.status,
    checks: evidence.checks,
    boundBuild: evidence.boundBuild,
  };
}

function validateHydrationEvidence(files, basePath, playwrightVersion) {
  const evidenceFile = files.find((file) => file.path === hydrationEvidencePath);
  if (!evidenceFile) {
    report(
      `Documentation build is missing ${hydrationEvidencePath}; run the versioned browser smoke test first.`,
    );
    return null;
  }

  let evidence;
  try {
    evidence = JSON.parse(evidenceFile.content.toString('utf8'));
  } catch {
    report(`${hydrationEvidencePath} is not valid JSON.`);
    return null;
  }
  if (!/^\d+\.\d+\.\d+\.\d+$/.test(evidence.browser?.version ?? '')) {
    report(`${hydrationEvidencePath} must record the exact Chromium version.`);
    return null;
  }

  const boundFiles = files.filter((file) => file.path !== hydrationEvidencePath);
  const expectedEvidence = {
    schemaVersion: 1,
    application: 'kern-documentation',
    evidenceType: 'browser-hydration-smoke',
    basePath,
    browser: {
      engine: 'chromium',
      version: evidence.browser.version,
      headless: true,
      automation: {
        package: '@playwright/test',
        version: playwrightVersion,
      },
    },
    status: 'passed',
    checks: hydrationEvidenceChecks,
    boundBuild: {
      fileCount: boundFiles.length,
      totalBytes: boundFiles.reduce((sum, file) => sum + file.bytes, 0),
      contentSha256: contentDigest(boundFiles),
    },
  };
  if (!isDeepStrictEqual(evidence, expectedEvidence)) {
    report(
      `${hydrationEvidencePath} does not prove Chromium hydration for the exact versioned build and base path.`,
    );
    return null;
  }

  return hydrationEvidenceMetadata(evidenceFile, evidence);
}

function writeString(buffer, offset, length, value) {
  const encoded = Buffer.from(value, 'utf8');
  if (encoded.length > length) throw new Error(`Tar header value is too long: ${value}`);
  encoded.copy(buffer, offset);
}

function writeOctal(buffer, offset, length, value) {
  const encoded = Math.trunc(value)
    .toString(8)
    .padStart(length - 1, '0');
  if (encoded.length >= length) throw new Error(`Tar header number is too large: ${value}`);
  writeString(buffer, offset, length, `${encoded}\0`);
}

function splitTarPath(path) {
  const encoded = Buffer.byteLength(path);
  if (encoded <= 100) return { name: path, prefix: '' };
  for (let index = path.lastIndexOf('/'); index > 0; index = path.lastIndexOf('/', index - 1)) {
    const prefix = path.slice(0, index);
    const name = path.slice(index + 1);
    if (Buffer.byteLength(prefix) <= 155 && Buffer.byteLength(name) <= 100) {
      return { name, prefix };
    }
  }
  throw new Error(`Tar path is too long: ${path}`);
}

function tarHeader(path, size) {
  const header = Buffer.alloc(512);
  const { name, prefix } = splitTarPath(path);
  writeString(header, 0, 100, name);
  writeOctal(header, 100, 8, 0o644);
  writeOctal(header, 108, 8, 0);
  writeOctal(header, 116, 8, 0);
  writeOctal(header, 124, 12, size);
  writeOctal(header, 136, 12, 0);
  header.fill(0x20, 148, 156);
  header[156] = 0x30;
  writeString(header, 257, 6, 'ustar\0');
  writeString(header, 263, 2, '00');
  writeString(header, 345, 155, prefix);
  const checksum = header.reduce((sum, byte) => sum + byte, 0);
  const checksumValue = checksum.toString(8).padStart(6, '0');
  writeString(header, 148, 8, `${checksumValue}\0 `);
  return header;
}

function createArchive(entries) {
  const chunks = [];
  for (const entry of entries) {
    const path = `${archiveRoot}/${entry.path}`;
    chunks.push(tarHeader(path, entry.content.length), entry.content);
    const remainder = entry.content.length % 512;
    if (remainder) chunks.push(Buffer.alloc(512 - remainder));
  }
  chunks.push(Buffer.alloc(1024));
  const compressed = gzipSync(Buffer.concat(chunks), { level: 9 });
  compressed.writeUInt32LE(0, 4);
  compressed[9] = 0xff;
  return compressed;
}

function readTarString(buffer, offset, length) {
  const end = buffer.indexOf(0, offset);
  return buffer
    .subarray(offset, end >= offset && end < offset + length ? end : offset + length)
    .toString('utf8');
}

function parseOctal(buffer, offset, length, label) {
  const value = readTarString(buffer, offset, length).trim();
  if (!/^[0-7]+$/.test(value)) throw new Error(`Invalid tar ${label}: ${value}`);
  return Number.parseInt(value, 8);
}

function readArchive(archive) {
  if (archive.length > maximumArchiveBytes) {
    throw new Error(`Documentation archive exceeds ${maximumArchiveBytes} bytes.`);
  }
  const tar = gunzipSync(archive, { maxOutputLength: maximumExpandedBytes });
  const entries = new Map();
  let offset = 0;

  while (offset + 512 <= tar.length) {
    const header = tar.subarray(offset, offset + 512);
    if (header.every((byte) => byte === 0)) break;
    const name = readTarString(header, 0, 100);
    const prefix = readTarString(header, 345, 155);
    const path = prefix ? `${prefix}/${name}` : name;
    const type = String.fromCharCode(header[156] || 0x30);
    const size = parseOctal(header, 124, 12, 'entry size');
    const expectedChecksum = parseOctal(header, 148, 8, 'checksum');
    const checksumHeader = Buffer.from(header);
    checksumHeader.fill(0x20, 148, 156);
    const actualChecksum = checksumHeader.reduce((sum, byte) => sum + byte, 0);
    if (expectedChecksum !== actualChecksum) throw new Error(`Invalid tar checksum for ${path}.`);
    if (type !== '0' && type !== '\0') throw new Error(`Unsupported tar entry type for ${path}.`);
    if (!path.startsWith(`${archiveRoot}/`)) {
      throw new Error(`Archive entry is outside ${archiveRoot}/: ${path}`);
    }
    const relativePath = path.slice(archiveRoot.length + 1);
    if (!isSafeRelativePath(relativePath)) throw new Error(`Unsafe archive path: ${path}`);
    const contentOffset = offset + 512;
    const contentEnd = contentOffset + size;
    if (contentEnd > tar.length) throw new Error(`Truncated tar entry: ${path}`);
    if (entries.has(relativePath)) throw new Error(`Duplicate tar entry: ${relativePath}`);
    entries.set(relativePath, tar.subarray(contentOffset, contentEnd));
    if (entries.size > maximumFileCount + 1) {
      throw new Error(`Documentation archive exceeds ${maximumFileCount} build files.`);
    }
    offset = contentOffset + Math.ceil(size / 512) * 512;
  }

  return entries;
}

function validateContext(context, sourceManifest) {
  if (!semver(context.version)) report(`Invalid documentation version "${context.version}".`);
  if (context.tag !== `v${context.version}`) {
    report(`Documentation tag must be exactly v${context.version}.`);
  }
  if (!/^[0-9a-f]{40}$/.test(context.commit ?? '')) {
    report('Documentation commit must be a full Git SHA.');
  }
  if (sourceManifest.name !== '@kern-ui/angular') {
    report('Source package manifest must identify @kern-ui/angular.');
  }
  if (sourceManifest.version !== context.version) {
    report(`Source package version must be ${context.version}.`);
  }
  const expectedBasePath = `/versions/${context.version}/`;
  if (context.basePath !== expectedBasePath) {
    report(`Documentation base path must be exactly ${expectedBasePath}.`);
  }
}

function createManifest(context, files, hydrationEvidence) {
  const publicFiles = files.map(({ path, bytes, sha256: hash }) => ({
    path,
    bytes,
    sha256: hash,
  }));
  return {
    schemaVersion: 1,
    application: 'kern-documentation',
    package: {
      name: '@kern-ui/angular',
      version: context.version,
      tag: context.tag,
    },
    source: {
      repository,
      commit: context.commit,
    },
    deployment: {
      immutable: true,
      mountPath: context.basePath,
      hosting: 'external',
      runtime: 'node',
      entrypoint: 'server/server.mjs',
    },
    build: {
      framework: 'Angular SSR',
      configuration: 'production',
      outputMode: 'server',
      hydration: true,
      hydrationEvidence,
      toolchain: context.toolchain,
      fileCount: publicFiles.length,
      totalBytes: publicFiles.reduce((sum, file) => sum + file.bytes, 0),
      contentSha256: contentDigest(publicFiles),
    },
    files: publicFiles,
  };
}

function validateManifest(manifest, context) {
  if (manifest.schemaVersion !== 1 || manifest.application !== 'kern-documentation') {
    report('Versioned documentation manifest schema or application is invalid.');
  }
  if (
    manifest.package?.name !== '@kern-ui/angular' ||
    manifest.package?.version !== context.version ||
    manifest.package?.tag !== context.tag ||
    manifest.source?.repository !== repository ||
    manifest.source?.commit !== context.commit
  ) {
    report('Versioned documentation manifest does not match package, tag, repository, and commit.');
  }
  if (
    manifest.deployment?.immutable !== true ||
    manifest.deployment?.mountPath !== context.basePath ||
    manifest.deployment?.hosting !== 'external' ||
    manifest.deployment?.runtime !== 'node' ||
    manifest.deployment?.entrypoint !== 'server/server.mjs'
  ) {
    report('Versioned documentation deployment contract is invalid.');
  }
  if (
    manifest.build?.framework !== 'Angular SSR' ||
    manifest.build?.configuration !== 'production' ||
    manifest.build?.outputMode !== 'server' ||
    manifest.build?.hydration !== true ||
    !isDeepStrictEqual(manifest.build?.toolchain, context.toolchain)
  ) {
    report('Versioned documentation build contract is invalid.');
  }
  if (!Array.isArray(manifest.files) || manifest.files.length === 0) {
    report('Versioned documentation manifest requires a non-empty files list.');
    return;
  }
  const sortedFiles = [...manifest.files].sort((left, right) =>
    left.path.localeCompare(right.path, 'en'),
  );
  if (!isDeepStrictEqual(manifest.files, sortedFiles)) {
    report('Versioned documentation manifest files must be sorted.');
  }
  if (
    manifest.files.some(
      (file) =>
        !isSafeRelativePath(file.path) ||
        !Number.isSafeInteger(file.bytes) ||
        file.bytes < 0 ||
        !/^[0-9a-f]{64}$/.test(file.sha256),
    )
  ) {
    report('Versioned documentation manifest contains an invalid file record.');
  }
  const evidenceFile = manifest.files.find((file) => file.path === hydrationEvidencePath);
  const evidence = manifest.build?.hydrationEvidence;
  if (
    !evidenceFile ||
    evidence?.schemaVersion !== 1 ||
    evidence?.type !== 'browser-hydration-smoke' ||
    evidence?.path !== hydrationEvidencePath ||
    evidence?.sha256 !== evidenceFile.sha256 ||
    evidence?.basePath !== context.basePath ||
    evidence?.browser?.engine !== 'chromium' ||
    !/^\d+\.\d+\.\d+\.\d+$/.test(evidence?.browser?.version ?? '') ||
    evidence?.browser?.headless !== true ||
    evidence?.browser?.automation?.package !== '@playwright/test' ||
    evidence?.browser?.automation?.version !== context.toolchain.playwright ||
    evidence?.status !== 'passed' ||
    !isDeepStrictEqual(evidence?.checks, hydrationEvidenceChecks) ||
    !Number.isSafeInteger(evidence?.boundBuild?.fileCount) ||
    evidence.boundBuild.fileCount < 1 ||
    !Number.isSafeInteger(evidence?.boundBuild?.totalBytes) ||
    evidence.boundBuild.totalBytes < 1 ||
    !/^[0-9a-f]{64}$/.test(evidence?.boundBuild?.contentSha256 ?? '')
  ) {
    report('Versioned documentation hydration evidence metadata is invalid.');
  }
  if (
    manifest.build?.fileCount !== manifest.files.length ||
    manifest.build?.totalBytes !== manifest.files.reduce((sum, file) => sum + file.bytes, 0) ||
    manifest.build?.contentSha256 !== contentDigest(manifest.files)
  ) {
    report('Versioned documentation aggregate file metadata is invalid.');
  }
}

async function prepare(context) {
  if (!existsSync(context.inputDirectory)) {
    throw new Error(`Versioned documentation build is missing: ${context.inputDirectory}`);
  }
  const files = await collectFiles(context.inputDirectory);
  validateBuild(files, context.basePath);
  const hydrationEvidence = validateHydrationEvidence(
    files,
    context.basePath,
    context.toolchain.playwright,
  );
  if (issues.length) return;

  const manifest = createManifest(context, files, hydrationEvidence);
  const manifestContent = Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  const archiveEntries = [
    ...files,
    {
      path: 'versioned-docs-manifest.json',
      bytes: manifestContent.length,
      sha256: sha256(manifestContent),
      content: manifestContent,
    },
  ].sort((left, right) => left.path.localeCompare(right.path, 'en'));
  const archive = createArchive(archiveEntries);
  if (archive.length > maximumArchiveBytes) {
    throw new Error(`Documentation archive exceeds ${maximumArchiveBytes} bytes.`);
  }
  await mkdir(context.artifactDirectory, { recursive: true });
  await Promise.all([
    writeFile(context.manifestPath, manifestContent),
    writeFile(context.archivePath, archive),
  ]);
}

async function verify(context) {
  const [manifest, archive] = await Promise.all([
    readJson(context.manifestPath, 'Versioned documentation manifest'),
    readFile(context.archivePath),
  ]);
  validateManifest(manifest, context);
  if (issues.length) return;

  const entries = readArchive(archive);
  const normalizedArchive = createArchive(
    [...entries.entries()]
      .map(([path, content]) => ({ path, content }))
      .sort((left, right) => left.path.localeCompare(right.path, 'en')),
  );
  if (!archive.equals(normalizedArchive)) {
    report('Documentation archive is not in the deterministic normalized format.');
  }
  const embeddedManifest = entries.get('versioned-docs-manifest.json');
  if (!embeddedManifest) {
    report('Documentation archive is missing its embedded manifest.');
  } else if (!embeddedManifest.equals(await readFile(context.manifestPath))) {
    report('Embedded and sidecar versioned documentation manifests differ.');
  }
  entries.delete('versioned-docs-manifest.json');

  const archivedFiles = [...entries.entries()]
    .map(([path, content]) => ({
      path,
      bytes: content.length,
      sha256: sha256(content),
      content,
    }))
    .sort((left, right) => left.path.localeCompare(right.path, 'en'));
  const hydrationEvidence = validateHydrationEvidence(
    archivedFiles,
    context.basePath,
    context.toolchain.playwright,
  );
  if (
    hydrationEvidence &&
    !isDeepStrictEqual(hydrationEvidence, manifest.build?.hydrationEvidence)
  ) {
    report('Archived hydration evidence does not match the sidecar manifest metadata.');
  }
  const actualFiles = archivedFiles.map(({ path, bytes, sha256: hash }) => ({
    path,
    bytes,
    sha256: hash,
  }));
  if (!isDeepStrictEqual(actualFiles, manifest.files)) {
    report('Documentation archive contents do not exactly match the sidecar manifest.');
  }
}

async function main() {
  const command = process.argv[2];
  if (!['prepare', 'verify'].includes(command)) {
    throw new Error(
      'Usage: node tools/verify-kern-versioned-docs.mjs <prepare|verify> ' +
        '--version=X --tag=vX --commit=SHA --base-path=/versions/X/ ' +
        '--input-dir=PATH --artifact-dir=PATH',
    );
  }
  const version = option('version');
  const context = {
    command,
    version,
    tag: option('tag'),
    commit: option('commit'),
    basePath: option('base-path', `/versions/${version}/`),
    inputDirectory: resolve(workspaceRoot, option('input-dir', defaultInputDirectory)),
    artifactDirectory: resolve(workspaceRoot, option('artifact-dir', defaultArtifactDirectory)),
    archivePath: null,
    manifestPath: null,
  };
  context.archivePath = resolve(context.artifactDirectory, `kern-docs-${context.version}.tgz`);
  context.manifestPath = resolve(
    context.artifactDirectory,
    `kern-docs-${context.version}.manifest.json`,
  );

  const [sourceManifest, workspaceManifest, nodeVersionSource] = await Promise.all([
    readJson(sourceManifestPath, 'Source package manifest'),
    readJson(workspaceManifestPath, 'Workspace package manifest'),
    readFile(nodeVersionPath, 'utf8'),
  ]);
  const nodeVersion = nodeVersionSource.trim();
  const angularVersion = workspaceManifest.dependencies?.['@angular/core'];
  const playwrightVersion = workspaceManifest.devDependencies?.['@playwright/test'];
  if (!/^\d+\.\d+\.\d+$/.test(nodeVersion)) {
    report('.nvmrc must contain an exact Node.js version.');
  }
  if (!/^\d+\.\d+\.\d+$/.test(angularVersion ?? '')) {
    report('Workspace @angular/core must use an exact version.');
  }
  if (!/^npm@\d+\.\d+\.\d+$/.test(workspaceManifest.packageManager ?? '')) {
    report('Workspace packageManager must identify an exact npm version.');
  }
  if (!/^\d+\.\d+\.\d+$/.test(playwrightVersion ?? '')) {
    report('Workspace @playwright/test must use an exact version.');
  }
  context.toolchain = {
    node: nodeVersion,
    npm: workspaceManifest.packageManager,
    angular: angularVersion,
    playwright: playwrightVersion,
  };
  validateContext(context, sourceManifest);
  if (issues.length === 0) {
    if (command === 'prepare') await prepare(context);
    else await verify(context);
  }

  if (issues.length) {
    console.error(`Kern versioned documentation verification failed:\n- ${issues.join('\n- ')}`);
    process.exitCode = 1;
    return;
  }
  console.log(
    `Kern versioned documentation ${command === 'prepare' ? 'prepared' : 'verified'}: ` +
      `${context.version}, ${context.tag}, ${context.commit}, ${context.basePath}.`,
  );
}

try {
  await main();
} catch (error) {
  console.error(
    `Kern versioned documentation verification failed: ${
      error instanceof Error ? error.message : String(error)
    }`,
  );
  process.exitCode = 1;
}
