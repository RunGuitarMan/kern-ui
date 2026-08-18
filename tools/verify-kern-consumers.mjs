import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { cp, mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { basename, join, relative, resolve, sep } from 'node:path';
import { isDeepStrictEqual } from 'node:util';

const workspaceRoot = resolve(import.meta.dirname, '..');
const packageRoot = join(workspaceRoot, 'dist/kern');
const fixtureTemplateRoot = join(workspaceRoot, 'tests/consumer-fixtures');
const artifactsRoot = join(workspaceRoot, 'tests/.artifacts');
const runtimeEntrypointsConfigPath = join(
  workspaceRoot,
  'projects/kern/api/runtime-entrypoints.json',
);
const testingEntrypointsConfigPath = join(workspaceRoot, 'projects/kern/testing/entrypoints.json');
const releasePolicyPath = join(workspaceRoot, 'projects/kern/api/release-policy.json');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const failures = [];

function fail(message) {
  failures.push(message);
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
    input: options.input,
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

function packagePath(packageDirectory, specifier) {
  const candidate = resolve(packageDirectory, specifier);
  const normalizedRoot = resolve(packageDirectory);
  if (candidate !== normalizedRoot && !candidate.startsWith(`${normalizedRoot}${sep}`)) {
    throw new Error(`Package export resolves outside the package: ${specifier}`);
  }
  return candidate;
}

function exportedFiles(conditions) {
  if (typeof conditions === 'string') return [conditions];
  if (!conditions || typeof conditions !== 'object') return [];
  return Object.values(conditions).flatMap((value) => exportedFiles(value));
}

async function packageFiles(directory, root = directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) return packageFiles(path, root);
      return entry.isFile() ? [relative(root, path).split(sep).join('/')] : [];
    }),
  );
  return nested.flat();
}

function exportTargetExists(files, target) {
  const relativeTarget = target.slice(2);
  if (!relativeTarget.includes('*')) return files.has(relativeTarget);
  const expression = relativeTarget
    .split('*')
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('.+');
  const matcher = new RegExp(`^${expression}$`);
  return [...files].some((path) => matcher.test(path));
}

async function verifyInstalledPackage(consumerRoot, requiredSubpaths, releasePolicy) {
  const installedRoot = join(consumerRoot, 'node_modules/@kern-ui/angular');
  const manifestPath = join(installedRoot, 'package.json');
  if (!existsSync(manifestPath)) {
    throw new Error('Packed @kern-ui/angular was not installed into the consumer fixture.');
  }

  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const installedFiles = new Set(await packageFiles(installedRoot));
  if (manifest.name !== '@kern-ui/angular') {
    fail(`Packed manifest has unexpected name "${manifest.name ?? '<missing>'}".`);
  }
  if (!isDeepStrictEqual(manifest.dependencies ?? {}, releasePolicy.dependencies)) {
    fail('Packed dependencies differ from the reviewed release policy.');
  }
  if (!isDeepStrictEqual(manifest.peerDependencies ?? {}, releasePolicy.peerDependencies)) {
    fail('Packed peerDependencies differ from the reviewed release policy.');
  }
  if (
    !isDeepStrictEqual(
      manifest.peerDependenciesMeta ?? {},
      releasePolicy.peerDependenciesMeta ?? {},
    )
  ) {
    fail('Packed peerDependenciesMeta differ from the reviewed release policy.');
  }
  for (const packageName of releasePolicy.frameworkPeerPackages ?? []) {
    if (manifest.dependencies?.[packageName] || !manifest.peerDependencies?.[packageName]) {
      fail(`Packed framework package ${packageName} must be a peerDependency only.`);
    }
  }

  for (const requiredSubpath of requiredSubpaths) {
    const conditions = manifest.exports?.[requiredSubpath];
    if (
      !conditions ||
      typeof conditions !== 'object' ||
      typeof conditions.types !== 'string' ||
      typeof conditions.default !== 'string'
    ) {
      fail(`Packed export "${requiredSubpath}" must expose "types" and "default" conditions.`);
    }
  }

  for (const [subpath, conditions] of Object.entries(manifest.exports ?? {})) {
    const targets = exportedFiles(conditions);
    if (!targets.length) {
      fail(`Packed export "${subpath}" has no file targets.`);
      continue;
    }
    for (const target of targets) {
      if (!target.startsWith('./')) {
        fail(`Packed export "${subpath}" has non-relative target "${target}".`);
        continue;
      }
      packagePath(installedRoot, target.replaceAll('*', '__kern_export_pattern__'));
      if (!exportTargetExists(installedFiles, target)) {
        fail(`Packed export "${subpath}" matches no packaged file for "${target}".`);
      }
    }
  }

  if (typeof manifest.schematics !== 'string') {
    fail('Packed manifest does not declare its schematics collection.');
  } else if (!existsSync(packagePath(installedRoot, manifest.schematics))) {
    fail(`Packed schematics collection is missing: ${manifest.schematics}.`);
  }

  if ('bin' in manifest) {
    fail('Packed Angular runtime must not expose tooling executables.');
  }
  for (const path of installedFiles) {
    if (path.startsWith('agent/') || path.startsWith('mcp/')) {
      fail(`Packed Angular runtime contains optional AI tooling asset "${path}".`);
      break;
    }
  }
  for (const subpath of Object.keys(manifest.exports ?? {})) {
    if (/^\.\/(agent|mcp)/.test(subpath)) {
      fail(`Packed Angular runtime exposes optional AI tooling subpath "${subpath}".`);
    }
  }

  const styleExports = Object.keys(manifest.exports ?? {}).filter((subpath) =>
    subpath.startsWith('./styles/'),
  );
  if (!styleExports.includes('./styles/kern.css')) {
    fail('Packed manifest does not export the complete styles/kern.css bundle.');
  }
  if (
    !Array.isArray(manifest.sideEffects) ||
    !manifest.sideEffects.some((pattern) => pattern === './styles/*.css')
  ) {
    fail('Packed manifest must preserve exported CSS through its sideEffects contract.');
  }
}

async function filesWithExtension(directory, extension) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) return filesWithExtension(path, extension);
      return entry.isFile() && entry.name.endsWith(extension) ? [path] : [];
    }),
  );
  return nested.flat().sort();
}

async function measureBuild(outputRoot) {
  const javascriptFiles = await filesWithExtension(outputRoot, '.js');
  const stylesheetFiles = await filesWithExtension(outputRoot, '.css');
  if (!javascriptFiles.length) {
    throw new Error(`Consumer build emitted no JavaScript under ${outputRoot}.`);
  }
  if (!stylesheetFiles.length) {
    throw new Error(`Consumer build emitted no CSS under ${outputRoot}.`);
  }

  let bytes = 0;
  let gzipBytes = 0;
  let source = '';
  for (const path of javascriptFiles) {
    const content = await readFile(path);
    bytes += (await stat(path)).size;
    gzipBytes += gzipSync(content, { level: 9 }).byteLength;
    source += content.toString('utf8');
  }

  let cssBytes = 0;
  let cssGzipBytes = 0;
  for (const path of stylesheetFiles) {
    const content = await readFile(path);
    cssBytes += (await stat(path)).size;
    cssGzipBytes += gzipSync(content, { level: 9 }).byteLength;
  }

  return {
    bytes,
    gzipBytes,
    source,
    files: javascriptFiles.length,
    cssBytes,
    cssGzipBytes,
    cssFiles: stylesheetFiles.length,
  };
}

function validateCases(value) {
  if (!value || typeof value !== 'object' || !Array.isArray(value.cases)) {
    throw new Error('tests/consumer-fixtures/cases.json must contain a "cases" array.');
  }
  if (
    !value.styleBudget ||
    typeof value.styleBudget !== 'object' ||
    !Number.isSafeInteger(value.styleBudget.maximumCssBytes) ||
    value.styleBudget.maximumCssBytes <= 0 ||
    !Number.isSafeInteger(value.styleBudget.maximumCssGzipBytes) ||
    value.styleBudget.maximumCssGzipBytes <= 0
  ) {
    throw new Error('tests/consumer-fixtures/cases.json must define a positive styleBudget.');
  }

  const names = new Set();
  const cases = value.cases.map((entry) => {
    if (
      !entry ||
      typeof entry !== 'object' ||
      typeof entry.name !== 'string' ||
      typeof entry.project !== 'string' ||
      typeof entry.entryFile !== 'string' ||
      !Number.isSafeInteger(entry.maximumJsBytes) ||
      entry.maximumJsBytes <= 0 ||
      !Number.isSafeInteger(entry.maximumGzipBytes) ||
      entry.maximumGzipBytes <= 0 ||
      !Array.isArray(entry.requiredMarkers) ||
      !entry.requiredMarkers.every((marker) => typeof marker === 'string' && marker.length > 0) ||
      !Array.isArray(entry.forbiddenMarkers) ||
      !entry.forbiddenMarkers.every((marker) => typeof marker === 'string' && marker.length > 0)
    ) {
      throw new Error(`Invalid consumer case: ${JSON.stringify(entry)}`);
    }
    if (names.has(entry.name)) {
      throw new Error(`Duplicate consumer case "${entry.name}".`);
    }
    if (!/^[a-z0-9-]+$/.test(entry.name) || !/^[a-z0-9-]+$/.test(entry.project)) {
      throw new Error(`Consumer case and project names must be kebab-case: ${entry.name}.`);
    }
    if (
      entry.compareWith !== undefined &&
      (typeof entry.compareWith !== 'string' ||
        !Number.isSafeInteger(entry.maximumDifferenceBytes) ||
        entry.maximumDifferenceBytes < 0 ||
        !Number.isSafeInteger(entry.maximumDifferenceGzipBytes) ||
        entry.maximumDifferenceGzipBytes < 0)
    ) {
      throw new Error(`Consumer comparison is invalid for "${entry.name}".`);
    }
    const entryPath = resolve(fixtureTemplateRoot, entry.entryFile);
    if (
      !entry.entryFile.startsWith('src/') ||
      !entry.entryFile.endsWith('.ts') ||
      !entryPath.startsWith(`${resolve(fixtureTemplateRoot)}${sep}`) ||
      !existsSync(entryPath)
    ) {
      throw new Error(`Consumer case "${entry.name}" has invalid entryFile "${entry.entryFile}".`);
    }
    names.add(entry.name);
    return entry;
  });
  for (const entry of cases) {
    if (
      entry.compareWith !== undefined &&
      (!names.has(entry.compareWith) || entry.compareWith === entry.name)
    ) {
      throw new Error(`Consumer case "${entry.name}" has invalid compareWith target.`);
    }
  }
  return { cases, styleBudget: value.styleBudget };
}

async function main() {
  for (const requiredPath of [
    packageRoot,
    fixtureTemplateRoot,
    runtimeEntrypointsConfigPath,
    testingEntrypointsConfigPath,
    releasePolicyPath,
  ]) {
    if (!existsSync(requiredPath)) {
      throw new Error(
        `Required path is missing: ${relative(workspaceRoot, requiredPath)}. ` +
          'Run "npm run build:kern" and "npm ci" first.',
      );
    }
  }

  const { cases, styleBudget } = validateCases(
    JSON.parse(await readFile(join(fixtureTemplateRoot, 'cases.json'), 'utf8')),
  );
  const runtimeEntrypointsConfig = JSON.parse(await readFile(runtimeEntrypointsConfigPath, 'utf8'));
  const testingEntrypointsConfig = JSON.parse(await readFile(testingEntrypointsConfigPath, 'utf8'));
  const releasePolicy = JSON.parse(await readFile(releasePolicyPath, 'utf8'));
  if (
    !runtimeEntrypointsConfig ||
    !Array.isArray(runtimeEntrypointsConfig.entrypoints) ||
    !runtimeEntrypointsConfig.entrypoints.every(
      (entrypoint) => entrypoint && typeof entrypoint.subpath === 'string',
    )
  ) {
    throw new Error('Invalid projects/kern/api/runtime-entrypoints.json structure.');
  }
  const requiredSubpaths = [
    '.',
    ...runtimeEntrypointsConfig.entrypoints.map((entrypoint) => entrypoint.subpath),
    testingEntrypointsConfig.aggregator?.subpath,
    ...(testingEntrypointsConfig.entrypoints ?? []).map((entrypoint) => entrypoint.subpath),
  ];
  if (!requiredSubpaths.every((subpath) => typeof subpath === 'string')) {
    throw new Error('Invalid projects/kern/testing/entrypoints.json structure.');
  }
  if (new Set(requiredSubpaths).size !== requiredSubpaths.length) {
    throw new Error('Required packed package subpaths must be unique.');
  }
  await mkdir(artifactsRoot, { recursive: true });
  const stagingRoot = await mkdtemp(join(artifactsRoot, 'kern-consumer-'));
  const consumerRoot = join(stagingRoot, 'workspace');

  try {
    await copyFixtureTemplate(consumerRoot);
    run(npmCommand, ['ci', '--no-audit', '--no-fund'], { cwd: consumerRoot });

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
    const archivePath = join(stagingRoot, archiveName);

    run(
      npmCommand,
      ['install', archivePath, '--ignore-scripts', '--save-exact', '--no-audit', '--no-fund'],
      { cwd: consumerRoot },
    );

    await verifyInstalledPackage(consumerRoot, requiredSubpaths, releasePolicy);

    const ngCliPath = join(consumerRoot, 'node_modules/@angular/cli/bin/ng.js');
    const tscCliPath = join(consumerRoot, 'node_modules/typescript/bin/tsc');
    for (const toolPath of [ngCliPath, tscCliPath]) {
      if (!existsSync(toolPath)) {
        throw new Error(`Consumer fixture tool is missing: ${relative(consumerRoot, toolPath)}.`);
      }
    }

    for (const [schematic, name, options] of [
      ['typed-form', 'schematic-form', []],
      ['data-grid', 'schematic-grid', ['--mode', 'controlled']],
      ['crud', 'schematic-crud', []],
    ]) {
      run(
        process.execPath,
        [
          ngCliPath,
          'generate',
          `@kern-ui/angular:${schematic}`,
          name,
          '--project',
          'button',
          '--interactive=false',
          ...options,
        ],
        { cwd: consumerRoot },
      );
    }
    const generatedEntrypoint = join(consumerRoot, 'src/generated-schematics.ts');
    await writeFile(
      generatedEntrypoint,
      `import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { SchematicCrudComponent } from './app/schematic-crud/schematic-crud.component';
import { SchematicFormComponent } from './app/schematic-form/schematic-form.component';
import { SchematicGridComponent } from './app/schematic-grid/schematic-grid.component';

@Component({
  selector: 'app-root',
  imports: [SchematicCrudComponent, SchematicFormComponent, SchematicGridComponent],
  template: \`
    <app-schematic-form />
    <app-schematic-grid />
    <app-schematic-crud />
  \`,
})
class GeneratedSchematicsConsumer {}

void bootstrapApplication(GeneratedSchematicsConsumer);
`,
      'utf8',
    );
    run(
      process.execPath,
      [
        ngCliPath,
        'build',
        'button',
        '--configuration',
        'production',
        '--browser',
        'src/generated-schematics.ts',
        '--output-path',
        'dist/generated-schematics',
        '--progress=false',
      ],
      { cwd: consumerRoot },
    );

    run(process.execPath, [tscCliPath, '-p', 'tsconfig.json', '--noEmit', '--pretty', 'false'], {
      cwd: consumerRoot,
    });

    const summaries = [];
    for (const consumerCase of cases) {
      const outputRoot = join(consumerRoot, 'dist', consumerCase.name);
      run(
        process.execPath,
        [
          ngCliPath,
          'build',
          consumerCase.project,
          '--configuration',
          'production',
          '--browser',
          consumerCase.entryFile,
          '--output-path',
          `dist/${consumerCase.name}`,
          '--stats-json',
          '--progress=false',
        ],
        { cwd: consumerRoot },
      );

      const measurement = await measureBuild(outputRoot);
      summaries.push({
        name: consumerCase.name,
        bytes: measurement.bytes,
        gzipBytes: measurement.gzipBytes,
        files: measurement.files,
        cssBytes: measurement.cssBytes,
        cssGzipBytes: measurement.cssGzipBytes,
        cssFiles: measurement.cssFiles,
      });

      if (measurement.bytes > consumerCase.maximumJsBytes) {
        fail(
          `${consumerCase.name} emitted ${measurement.bytes} JS bytes; ` +
            `budget is ${consumerCase.maximumJsBytes}.`,
        );
      }
      if (measurement.gzipBytes > consumerCase.maximumGzipBytes) {
        fail(
          `${consumerCase.name} emitted ${measurement.gzipBytes} gzip JS bytes; ` +
            `budget is ${consumerCase.maximumGzipBytes}.`,
        );
      }
      if (measurement.cssBytes > styleBudget.maximumCssBytes) {
        fail(
          `${consumerCase.name} emitted ${measurement.cssBytes} CSS bytes; ` +
            `shared-style budget is ${styleBudget.maximumCssBytes}.`,
        );
      }
      if (measurement.cssGzipBytes > styleBudget.maximumCssGzipBytes) {
        fail(
          `${consumerCase.name} emitted ${measurement.cssGzipBytes} gzip CSS bytes; ` +
            `shared-style budget is ${styleBudget.maximumCssGzipBytes}.`,
        );
      }
      for (const marker of consumerCase.requiredMarkers) {
        if (!measurement.source.includes(marker)) {
          fail(`${consumerCase.name} output is missing expected marker "${marker}".`);
        }
      }
      for (const marker of consumerCase.forbiddenMarkers) {
        if (measurement.source.includes(marker)) {
          fail(
            `${consumerCase.name} output contains pruned feature marker "${marker}". ` +
              'The root entrypoint may have regressed tree-shaking.',
          );
        }
      }
    }

    const summaryNameWidth = Math.max(...summaries.map((summary) => summary.name.length));
    for (const summary of summaries) {
      console.log(
        `${summary.name.padEnd(summaryNameWidth)} ${String(summary.bytes).padStart(7)} B JS · ` +
          `${String(summary.gzipBytes).padStart(6)} B gzip · ${summary.files} JS · ` +
          `${String(summary.cssBytes).padStart(6)} B CSS · ` +
          `${String(summary.cssGzipBytes).padStart(5)} B gzip · ${summary.cssFiles} CSS`,
      );
    }

    const summariesByName = new Map(summaries.map((summary) => [summary.name, summary]));
    for (const consumerCase of cases) {
      if (consumerCase.compareWith === undefined) continue;
      const measurement = summariesByName.get(consumerCase.name);
      const reference = summariesByName.get(consumerCase.compareWith);
      if (!measurement || !reference) {
        throw new Error(`Missing bundle summary for consumer comparison "${consumerCase.name}".`);
      }
      const byteDifference = Math.abs(measurement.bytes - reference.bytes);
      const gzipDifference = Math.abs(measurement.gzipBytes - reference.gzipBytes);
      if (byteDifference > consumerCase.maximumDifferenceBytes) {
        fail(
          `${consumerCase.name} differs from ${consumerCase.compareWith} by ${byteDifference} JS bytes; ` +
            `allowed difference is ${consumerCase.maximumDifferenceBytes}.`,
        );
      }
      if (gzipDifference > consumerCase.maximumDifferenceGzipBytes) {
        fail(
          `${consumerCase.name} differs from ${consumerCase.compareWith} by ${gzipDifference} gzip JS bytes; ` +
            `allowed difference is ${consumerCase.maximumDifferenceGzipBytes}.`,
        );
      }
    }
  } finally {
    if (process.env['KRN_KEEP_CONSUMER_FIXTURE'] === '1') {
      console.log(`Kept consumer fixture at ${stagingRoot}.`);
    } else {
      await rm(stagingRoot, { recursive: true, force: true });
    }
  }

  if (failures.length) {
    console.error(`Kern packed-consumer verification failed:\n- ${failures.join('\n- ')}`);
    process.exitCode = 1;
  } else {
    console.log(`Kern packed-consumer verification passed: ${cases.length} isolated builds.`);
  }
}

try {
  await main();
} catch (error) {
  console.error(
    `Kern packed-consumer verification failed: ${
      error instanceof Error ? error.message : String(error)
    }`,
  );
  process.exitCode = 1;
}
