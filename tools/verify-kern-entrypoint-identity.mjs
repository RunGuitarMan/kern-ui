import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { cp, mkdir, mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { basename, join, relative, resolve, sep } from 'node:path';

const workspaceRoot = resolve(import.meta.dirname, '..');
const packageRoot = join(workspaceRoot, 'dist/kern');
const packageManifestPath = join(packageRoot, 'package.json');
const configPath = join(workspaceRoot, 'projects/kern/api/runtime-entrypoints.json');
const fixtureTemplateRoot = join(workspaceRoot, 'tests/consumer-fixtures');
const artifactsRoot = join(workspaceRoot, 'tests/.artifacts');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const identityMarker = 'KRN_ENTRYPOINT_IDENTITY:';

function pathInside(root, candidate) {
  const normalizedRoot = resolve(root);
  const normalizedCandidate = resolve(candidate);
  return (
    normalizedCandidate === normalizedRoot ||
    normalizedCandidate.startsWith(`${normalizedRoot}${sep}`)
  );
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? workspaceRoot,
    encoding: 'utf8',
    env: {
      ...process.env,
      FORCE_COLOR: '0',
    },
    maxBuffer: 20 * 1024 * 1024,
  });

  if (result.status !== 0) {
    const output = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
    const reason =
      result.error?.message ??
      (result.signal ? `terminated by ${result.signal}` : `status ${result.status ?? 'unknown'}`);
    throw new Error(
      `${basename(command)} ${args.join(' ')} failed with ${reason}.${output ? `\n${output}` : ''}`,
    );
  }

  return result.stdout.trim();
}

async function copyFixtureTemplate(destination) {
  const excludedRoots = new Set(['.angular', 'dist', 'node_modules', 'out-tsc']);
  await cp(fixtureTemplateRoot, destination, {
    recursive: true,
    filter: (source) => {
      const sourcePath = relative(fixtureTemplateRoot, source);
      if (!sourcePath) return true;
      const rootName = sourcePath.split(sep)[0];
      return !excludedRoots.has(rootName) && !sourcePath.endsWith('.tgz');
    },
  });
}

function validateConfig(value) {
  if (
    !value ||
    typeof value !== 'object' ||
    typeof value.packageName !== 'string' ||
    typeof value.primarySourceRoot !== 'string' ||
    !Array.isArray(value.entrypoints)
  ) {
    throw new Error('Invalid projects/kern/api/runtime-entrypoints.json structure.');
  }

  const names = new Set();
  const subpaths = new Set();
  for (const entrypoint of value.entrypoints) {
    if (
      !entrypoint ||
      typeof entrypoint.name !== 'string' ||
      typeof entrypoint.subpath !== 'string' ||
      typeof entrypoint.sourceRoot !== 'string' ||
      !Array.isArray(entrypoint.identityExports) ||
      !entrypoint.identityExports.every((name) => typeof name === 'string')
    ) {
      throw new Error(`Invalid runtime identity configuration: ${JSON.stringify(entrypoint)}`);
    }
    if (names.has(entrypoint.name) || subpaths.has(entrypoint.subpath)) {
      throw new Error(`Duplicate runtime identity entrypoint: ${entrypoint.name}.`);
    }
    names.add(entrypoint.name);
    subpaths.add(entrypoint.subpath);
  }
  return value;
}

function packagePath(packageDirectory, specifier) {
  const candidate = resolve(packageDirectory, specifier);
  if (!pathInside(packageDirectory, candidate)) {
    throw new Error(`Package export resolves outside the package: ${specifier}`);
  }
  return candidate;
}

async function verifyInstalledExports(installedRoot, config) {
  const manifestPath = join(installedRoot, 'package.json');
  if (!existsSync(manifestPath)) {
    throw new Error('Packed @kern-ui/angular was not installed into the identity fixture.');
  }
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  if (manifest.name !== config.packageName) {
    throw new Error(
      `Packed package name is "${manifest.name ?? '<missing>'}", expected "${config.packageName}".`,
    );
  }

  for (const subpath of ['.', ...config.entrypoints.map((entrypoint) => entrypoint.subpath)]) {
    const conditions = manifest.exports?.[subpath];
    if (
      !conditions ||
      typeof conditions !== 'object' ||
      typeof conditions.types !== 'string' ||
      typeof conditions.default !== 'string'
    ) {
      throw new Error(`Packed export "${subpath}" requires "types" and "default" conditions.`);
    }
    for (const condition of ['types', 'default']) {
      const target = packagePath(installedRoot, conditions[condition]);
      if (!existsSync(target)) {
        throw new Error(
          `Packed export "${subpath}" references missing ${condition} target "${conditions[condition]}".`,
        );
      }
    }
  }
}

async function filesRecursively(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) return filesRecursively(path);
      return entry.isFile() ? [path] : [];
    }),
  );
  return nested.flat().sort();
}

function validateIdentityReport(value, config) {
  if (
    !value ||
    typeof value !== 'object' ||
    !value.exportsByEntrypoint ||
    typeof value.exportsByEntrypoint !== 'object'
  ) {
    throw new Error('Linked identity fixture returned an invalid report.');
  }

  const expectedNames = config.entrypoints.map((entrypoint) => entrypoint.name).sort();
  const actualNames = Object.keys(value.exportsByEntrypoint).sort();
  if (JSON.stringify(actualNames) !== JSON.stringify(expectedNames)) {
    throw new Error(
      `Linked identity fixture covers ${actualNames.join(', ')}, expected ${expectedNames.join(', ')}.`,
    );
  }

  let exportCount = 0;
  for (const entrypoint of config.entrypoints) {
    const exportNames = value.exportsByEntrypoint[entrypoint.name];
    if (!Array.isArray(exportNames) || !exportNames.every((name) => typeof name === 'string')) {
      throw new Error(`Invalid identity export list for "${entrypoint.name}".`);
    }
    exportCount += exportNames.length;
    for (const representative of entrypoint.identityExports) {
      if (!exportNames.includes(representative)) {
        throw new Error(`Representative "${representative}" is missing from "${entrypoint.name}".`);
      }
    }
  }
  return exportCount;
}

function identityProgram(config) {
  const entrypoints = config.entrypoints.map((entrypoint) => ({
    name: entrypoint.name,
    specifier: `${config.packageName}${entrypoint.subpath.slice(1)}`,
  }));

  return `
await import('@angular/compiler');
const root = await import(${JSON.stringify(config.packageName)});
const entrypoints = ${JSON.stringify(entrypoints)};
const owners = new Map();
const failures = [];
const exportsByEntrypoint = {};

for (const entrypoint of entrypoints) {
  const module = await import(entrypoint.specifier);
  const exportNames = Object.keys(module).filter((name) => name !== 'default').sort();
  exportsByEntrypoint[entrypoint.name] = exportNames;

  for (const name of exportNames) {
    const existingOwner = owners.get(name);
    if (existingOwner) {
      failures.push(
        'Runtime export "' + name + '" is exposed by both "' +
        existingOwner + '" and "' + entrypoint.name + '".',
      );
      continue;
    }
    owners.set(name, entrypoint.name);

    if (!(name in root)) {
      failures.push(
        'Root compatibility entrypoint does not export "' + name +
        '" from "' + entrypoint.name + '".',
      );
    } else if (!Object.is(root[name], module[name])) {
      failures.push(
        'Root and "' + entrypoint.name +
        '" expose different runtime identities for "' + name + '".',
      );
    }
  }
}

for (const name of Object.keys(root)) {
  if (name !== 'default' && !owners.has(name)) {
    failures.push('Root runtime export "' + name + '" has no secondary entrypoint owner.');
  }
}

if (failures.length) {
  throw new Error('KERN entrypoint identity mismatch:\\n- ' + failures.join('\\n- '));
}

console.log(${JSON.stringify(identityMarker)} + JSON.stringify({ exportsByEntrypoint }));
`;
}

async function main() {
  for (const requiredPath of [packageManifestPath, configPath, fixtureTemplateRoot]) {
    if (!existsSync(requiredPath)) {
      throw new Error(
        `Required path is missing: ${relative(workspaceRoot, requiredPath)}. ` +
          'Run "npm run build:kern" and "npm ci" first.',
      );
    }
  }

  const config = validateConfig(JSON.parse(await readFile(configPath, 'utf8')));
  const builtManifest = JSON.parse(await readFile(packageManifestPath, 'utf8'));
  if (builtManifest.name !== config.packageName) {
    throw new Error(
      `Built package name is "${builtManifest.name ?? '<missing>'}", expected "${config.packageName}".`,
    );
  }
  const sourceRoots = [
    resolve(workspaceRoot, config.primarySourceRoot),
    ...config.entrypoints.map((entrypoint) => resolve(workspaceRoot, entrypoint.sourceRoot)),
  ];
  const emittedSourceArtifacts = (
    await Promise.all(sourceRoots.map((sourceRoot) => filesRecursively(sourceRoot)))
  )
    .flat()
    .filter((path) =>
      ['.js', '.js.map', '.mjs', '.mjs.map', '.cjs', '.cjs.map', '.d.ts', '.d.ts.map'].some(
        (extension) => path.endsWith(extension),
      ),
    );
  if (emittedSourceArtifacts.length) {
    throw new Error(
      `Package build emitted JavaScript into source:\n- ${emittedSourceArtifacts
        .map((path) => relative(workspaceRoot, path))
        .join('\n- ')}`,
    );
  }

  await mkdir(artifactsRoot, { recursive: true });
  const stagingRoot = await mkdtemp(join(artifactsRoot, 'kern-identity-'));
  const consumerRoot = join(stagingRoot, 'workspace');

  try {
    await copyFixtureTemplate(consumerRoot);
    run(
      npmCommand,
      ['ci', '--omit=dev', '--ignore-scripts', '--offline', '--no-audit', '--no-fund'],
      { cwd: consumerRoot },
    );

    const packOutput = run(npmCommand, [
      'pack',
      packageRoot,
      '--json',
      '--pack-destination',
      stagingRoot,
    ]);
    const packReport = JSON.parse(packOutput);
    const archiveName = packReport[0]?.filename;
    if (typeof archiveName !== 'string') {
      throw new Error(`npm pack did not report an archive filename: ${packOutput}`);
    }

    run(
      npmCommand,
      [
        'install',
        join(stagingRoot, archiveName),
        '--ignore-scripts',
        '--no-save',
        '--package-lock=false',
        '--omit=dev',
        '--offline',
        '--no-audit',
        '--no-fund',
      ],
      { cwd: consumerRoot },
    );

    await verifyInstalledExports(join(consumerRoot, 'node_modules/@kern-ui/angular'), config);

    const output = run(
      process.execPath,
      ['--input-type=module', '--eval', identityProgram(config)],
      { cwd: consumerRoot },
    );
    const reportLine = output.split(/\r?\n/).find((line) => line.startsWith(identityMarker));
    if (!reportLine) {
      throw new Error(`Linked identity fixture emitted no ${identityMarker} report.`);
    }
    const exportCount = validateIdentityReport(
      JSON.parse(reportLine.slice(identityMarker.length)),
      config,
    );
    console.log(
      `Kern runtime entrypoint identities verified: ${config.entrypoints.length} subpaths, ` +
        `${exportCount} uniquely owned linked exports.`,
    );
  } finally {
    if (process.env['KRN_KEEP_IDENTITY_FIXTURE'] === '1') {
      console.log(`Kept identity fixture at ${stagingRoot}.`);
    } else {
      await rm(stagingRoot, { recursive: true, force: true });
    }
  }
}

try {
  await main();
} catch (error) {
  console.error(
    `Kern runtime entrypoint identity verification failed: ${
      error instanceof Error ? error.message : String(error)
    }`,
  );
  process.exitCode = 1;
}
