import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { cp, mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { basename, join, relative, resolve } from 'node:path';

import ts from 'typescript';

import { createKernAgentApi } from './kern-mcp/lib.mjs';
import {
  KERN_AGENT_EXAMPLE_RECIPES,
  KERN_AGENT_HIGH_RISK_TASKS,
} from './agent-dx/example-recipes.mjs';
import { internalButtonTriggerViolations } from './agent-dx/trigger-slot-policy.mjs';

const workspaceRoot = resolve(import.meta.dirname, '..');
const packageName = '@kern-ui/angular';
const angularDistRoot = join(workspaceRoot, 'dist/kern');
const distRoot = join(workspaceRoot, 'dist/kern-mcp');
const repositoryManifestPath = join(
  workspaceRoot,
  'metadata/agent/generated/component-manifest.json',
);
const repositoryRootExportMapPath = join(
  workspaceRoot,
  'metadata/agent/generated/root-export-map.json',
);
const repositoryExamplesRoot = join(workspaceRoot, 'metadata/agent/examples');
const packageExamplesRoot = join(workspaceRoot, 'projects/kern/agent/examples');
const repositoryRecipesRoot = join(workspaceRoot, 'metadata/agent/recipes');
const generatedRecipesRoot = join(workspaceRoot, 'metadata/agent/generated/recipes');
const packageRecipesRoot = join(workspaceRoot, 'projects/kern/agent/recipes');
const fixtureRoot = join(workspaceRoot, 'tests/consumer-fixtures');
const fixtureConfigRoot = join(fixtureRoot, 'agent-dx');
const artifactsRoot = join(workspaceRoot, 'tests/.artifacts');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const failures = [];

function fail(message) {
  failures.push(message);
}

function digest(value) {
  return `sha256-${createHash('sha256').update(value).digest('hex')}`;
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? workspaceRoot,
    encoding: 'utf8',
    env: {
      ...process.env,
      FORCE_COLOR: '0',
    },
    maxBuffer: 50 * 1024 * 1024,
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

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

async function regularFiles(root, extension) {
  const entries = await readdir(root, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(extension))
    .map((entry) => join(root, entry.name))
    .sort();
}

function parseImports(source, fileName) {
  const sourceFile = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const imports = [];
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) {
      continue;
    }
    const moduleName = statement.moduleSpecifier.text;
    const importClause = statement.importClause;
    if (importClause?.name) {
      imports.push({
        symbol: 'default',
        local: importClause.name.text,
        moduleName,
      });
    }
    const bindings = importClause?.namedBindings;
    if (bindings && ts.isNamedImports(bindings)) {
      for (const element of bindings.elements) {
        imports.push({
          symbol: element.propertyName?.text ?? element.name.text,
          local: element.name.text,
          moduleName,
          typeOnly: importClause?.isTypeOnly || element.isTypeOnly,
        });
      }
    }
    if (bindings && ts.isNamespaceImport(bindings)) {
      imports.push({
        symbol: '*',
        local: bindings.name.text,
        moduleName,
      });
    }
  }
  return imports;
}

function inlineComponentTemplates(source, fileName) {
  const sourceFile = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const templates = [];
  const visit = (node) => {
    if (
      ts.isPropertyAssignment(node) &&
      ((ts.isIdentifier(node.name) && node.name.text === 'template') ||
        (ts.isStringLiteral(node.name) && node.name.text === 'template')) &&
      (ts.isStringLiteralLike(node.initializer) ||
        ts.isNoSubstitutionTemplateLiteral(node.initializer))
    ) {
      templates.push(node.initializer.text);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return templates;
}

function symbolOwner(manifest, exportedName) {
  return manifest.symbols.find(
    (symbol) => symbol.name === exportedName || symbol.aliases.includes(exportedName),
  );
}

async function verifyRepositoryContracts(manifest) {
  const index = await readJson(join(repositoryExamplesRoot, 'index.json'));
  const examplePaths = await regularFiles(repositoryExamplesRoot, '.ts');
  const packageExamplePaths = await regularFiles(packageExamplesRoot, '.ts');
  const repositoryRecipePaths = await regularFiles(repositoryRecipesRoot, '.ts');
  const generatedRecipePaths = await regularFiles(generatedRecipesRoot, '.ts');
  const packageRecipePaths = await regularFiles(packageRecipesRoot, '.ts');
  const catalogIds = manifest.components.map((component) => component.id);
  const indexIds = index.examples.map((example) => example.id);
  const recipeIds = Object.keys(KERN_AGENT_EXAMPLE_RECIPES);

  if (manifest.components.length !== 132) {
    fail(`Expected the current 132-entry catalog, found ${manifest.components.length}.`);
  }
  if (index.total !== manifest.components.length || index.examples.length !== index.total) {
    fail('Agent example index total does not match the component manifest.');
  }
  for (const [label, ids] of [
    ['index', indexIds],
    ['recipe registry', recipeIds],
  ]) {
    const missing = catalogIds.filter((id) => !ids.includes(id));
    const stale = ids.filter((id) => !catalogIds.includes(id));
    if (missing.length || stale.length) {
      fail(
        `${label} catalog coverage mismatch: missing [${missing.join(', ')}], stale [${stale.join(', ')}].`,
      );
    }
  }
  if (examplePaths.length !== manifest.components.length) {
    fail(
      `Expected ${manifest.components.length} repository TypeScript examples, found ${examplePaths.length}.`,
    );
  }
  if (packageExamplePaths.length !== manifest.components.length) {
    fail(
      `Expected ${manifest.components.length} package TypeScript examples, found ${packageExamplePaths.length}.`,
    );
  }
  for (const [label, paths] of [
    ['repository', repositoryRecipePaths],
    ['generated agent contract', generatedRecipePaths],
    ['package', packageRecipePaths],
  ]) {
    if (paths.length !== manifest.recipes.length) {
      fail(`Expected ${manifest.recipes.length} ${label} recipe sources, found ${paths.length}.`);
    }
  }

  const indexById = new Map(index.examples.map((example) => [example.id, example]));
  const api = createKernAgentApi(manifest);
  const sources = new Map();
  for (const component of manifest.components) {
    const path = join(repositoryExamplesRoot, `${component.id}.ts`);
    const packagePath = join(packageExamplesRoot, `${component.id}.ts`);
    const [source, packageSource] = await Promise.all([
      readFile(path, 'utf8'),
      readFile(packagePath, 'utf8'),
    ]);
    sources.set(component.id, source);
    if (source !== packageSource) {
      fail(`${component.id}: repository and package example mirrors differ.`);
    }

    const record = indexById.get(component.id);
    if (!record) continue;
    if (record.sourceDigest !== digest(source)) {
      fail(`${component.id}: source digest does not match agent/examples/index.json.`);
    }
    if (record.source !== `${component.id}.ts`) {
      fail(`${component.id}: example index source is not relative to examples/index.json.`);
    }
    if (record.importPath !== component.importPath || record.symbol !== component.symbol) {
      fail(`${component.id}: example index owner does not match the component manifest.`);
    }
    if (record.verification !== 'packed-package-aot') {
      fail(`${component.id}: example is not marked for packed-package AOT verification.`);
    }

    const imports = parseImports(source, path);
    const kernImports = imports.filter(
      (entry) => entry.moduleName === packageName || entry.moduleName.startsWith(`${packageName}/`),
    );
    for (const imported of kernImports) {
      if (imported.moduleName === packageName) {
        fail(`${component.id}: package-root imports are forbidden (${imported.symbol}).`);
        continue;
      }
      if (!manifest.library.entrypoints.includes(imported.moduleName)) {
        fail(`${component.id}: deep or non-runtime import is forbidden: ${imported.moduleName}.`);
        continue;
      }
      const owner = symbolOwner(manifest, imported.symbol);
      if (!owner) {
        fail(
          `${component.id}: imported public symbol is absent from the manifest: ${imported.symbol}.`,
        );
      } else if (owner.importPath !== imported.moduleName) {
        fail(
          `${component.id}: ${imported.symbol} must come from ${owner.importPath}, not ${imported.moduleName}.`,
        );
      }
    }

    const primaryImport = kernImports.find(
      (entry) =>
        entry.symbol === component.symbol &&
        entry.local === component.symbol &&
        entry.moduleName === component.importPath,
    );
    if (!primaryImport) {
      fail(
        `${component.id}: missing canonical import { ${component.symbol} } from ${component.importPath}.`,
      );
    }
    if (!source.includes('standalone: true')) {
      fail(`${component.id}: source is not an explicit standalone component.`);
    }
    if (!source.includes('void bootstrapApplication(')) {
      fail(`${component.id}: source is not a runnable bootstrap entry.`);
    }
    if (
      /Example title|>\s*Example\s*<|\[options\]\s*=\s*["']\[\]["']|\[data\]\s*=\s*["']\[\]["']|\[columns\]\s*=\s*["']\[\]["']|\[rowIdentity\]\s*=\s*["']0["']/.test(
        source,
      )
    ) {
      fail(`${component.id}: source contains a forbidden generic fallback.`);
    }
    for (const template of inlineComponentTemplates(source, path)) {
      for (const violation of internalButtonTriggerViolations(template, path)) {
        fail(`${component.id}: ${violation.message}`);
      }
    }

    const validation = api.callTool('validate_usage', {
      component: component.id,
      code: source,
      stylesConfigured: true,
      providerConfigured: false,
    });
    if (validation.isError || validation.structuredContent?.valid !== true) {
      fail(
        `${component.id}: MCP validate_usage rejected the source: ${JSON.stringify(
          validation.structuredContent,
        )}`,
      );
    }
    const policyIssues = validation.structuredContent?.issues ?? [];
    if (
      policyIssues.some((issue) =>
        ['KRN_USAGE_DEEP_IMPORT', 'KRN_USAGE_ROOT_IMPORT'].includes(issue.code),
      )
    ) {
      fail(`${component.id}: MCP reported a root/deep import policy issue.`);
    }
  }

  for (const task of KERN_AGENT_HIGH_RISK_TASKS) {
    const component = manifest.components.find((candidate) => candidate.id === task.component);
    const source = sources.get(task.component);
    if (!component || !source) {
      fail(`${task.id}: high-risk task references unknown component ${task.component}.`);
      continue;
    }
    const search = api.searchComponents({ query: task.query, limit: 100 });
    if (!search.results.some((candidate) => candidate.id === task.component)) {
      fail(`${task.id}: search_components("${task.query}") does not discover ${task.component}.`);
    }
    const contract = api.callTool('get_component_contract', { component: task.component });
    if (contract.isError) {
      fail(`${task.id}: get_component_contract failed for ${task.component}.`);
    }
    const example = api.callTool('get_example', { component: task.component });
    if (example.isError) {
      fail(`${task.id}: get_example failed for ${task.component}.`);
    }
    for (const marker of task.requiredMarkers) {
      if (!source.includes(marker)) {
        fail(`${task.id}: source is missing required typed marker ${JSON.stringify(marker)}.`);
      }
    }
    const validation = api.callTool('validate_usage', {
      component: task.component,
      code: source,
      stylesConfigured: true,
    });
    if (validation.isError || validation.structuredContent?.valid !== true) {
      fail(`${task.id}: high-risk MCP validate_usage failed.`);
    }
  }

  for (const recipe of manifest.recipes) {
    const fileName = `${recipe.id}.ts`;
    const [source, generatedSource, packageSource] = await Promise.all([
      readFile(join(repositoryRecipesRoot, fileName), 'utf8'),
      readFile(join(generatedRecipesRoot, fileName), 'utf8'),
      readFile(join(packageRecipesRoot, fileName), 'utf8'),
    ]);
    if (source !== generatedSource || source !== packageSource || source !== recipe.code) {
      fail(`${recipe.id}: repository, generated, package and manifest recipe sources differ.`);
    }
    if (recipe.source !== `recipes/${fileName}`) {
      fail(`${recipe.id}: recipe source path is not deterministic.`);
    }
    if (recipe.verification !== 'packed-package-aot') {
      fail(`${recipe.id}: recipe is not marked for packed-package AOT verification.`);
    }
    if (recipe.sourceDigest !== digest(source)) {
      fail(`${recipe.id}: recipe source digest does not match the manifest.`);
    }
    if (!source.includes('standalone: true') || !source.includes('void bootstrapApplication(')) {
      fail(`${recipe.id}: recipe is not a runnable standalone bootstrap fixture.`);
    }
    if (
      /TODO|replace this|implement here|Cancel the previous request|Set childrenState|KERN-owned nested overlays coordinate|\breportError\s*\(|\bwindow\.|\bconsole\.(?:log|info|debug)\s*\(/.test(
        source,
      )
    ) {
      fail(`${recipe.id}: recipe contains placeholder or unsafe runtime logic.`);
    }
    for (const template of inlineComponentTemplates(source, fileName)) {
      for (const violation of internalButtonTriggerViolations(template, fileName)) {
        fail(`${recipe.id}: ${violation.message}`);
      }
    }

    const imports = parseImports(source, join(repositoryRecipesRoot, fileName));
    const kernImports = imports.filter(
      (entry) => entry.moduleName === packageName || entry.moduleName.startsWith(`${packageName}/`),
    );
    for (const imported of kernImports) {
      if (imported.moduleName === packageName) {
        fail(`${recipe.id}: package-root imports are forbidden (${imported.symbol}).`);
        continue;
      }
      if (!manifest.library.entrypoints.includes(imported.moduleName)) {
        fail(`${recipe.id}: deep or non-runtime import is forbidden: ${imported.moduleName}.`);
        continue;
      }
      const owner = symbolOwner(manifest, imported.symbol);
      if (!owner) {
        fail(
          `${recipe.id}: imported public symbol is absent from the manifest: ${imported.symbol}.`,
        );
      } else if (owner.importPath !== imported.moduleName) {
        fail(
          `${recipe.id}: ${imported.symbol} must come from ${owner.importPath}, not ${imported.moduleName}.`,
        );
      }
    }

    const importedRuntimeSymbols = new Set(
      kernImports.filter((entry) => !entry.typeOnly).map((entry) => entry.symbol),
    );
    const directlyUsedComponents = recipe.components.filter((componentId) => {
      const component = manifest.components.find((candidate) => candidate.id === componentId);
      return (
        component &&
        [component.symbol, component.canonicalSymbol, ...component.aliases.symbols].some((symbol) =>
          importedRuntimeSymbols.has(symbol),
        )
      );
    });
    if (recipe.components.length > 0 && directlyUsedComponents.length === 0) {
      fail(`${recipe.id}: no listed component is imported by the runnable source.`);
    }
    for (const componentId of directlyUsedComponents) {
      const validation = api.callTool('validate_usage', {
        component: componentId,
        code: source,
        stylesConfigured: true,
      });
      if (validation.isError || validation.structuredContent?.valid !== true) {
        fail(
          `${recipe.id}: MCP validate_usage rejected ${componentId}: ${JSON.stringify(
            validation.structuredContent,
          )}`,
        );
      }
    }
  }

  for (const migration of manifest.migrations) {
    if (!/krn(?:HoverCard|Menu|Popover)Trigger/.test(migration.after)) continue;
    for (const violation of internalButtonTriggerViolations(
      migration.after,
      `${migration.id}.after.html`,
    )) {
      fail(`${migration.id}: ${violation.message}`);
    }
  }

  return { index, sources };
}

async function copyFixture(destination) {
  await mkdir(destination, { recursive: true });
  await Promise.all([
    cp(join(fixtureRoot, 'package.json'), join(destination, 'package.json')),
    cp(join(fixtureRoot, 'package-lock.json'), join(destination, 'package-lock.json')),
    cp(join(fixtureConfigRoot, 'tsconfig.json'), join(destination, 'tsconfig.json')),
    cp(join(fixtureConfigRoot, 'README.md'), join(destination, 'README.md')),
  ]);
}

async function assertPackedAgentAssets(installedRoot, repositoryIndex) {
  const packageManifest = await readJson(join(installedRoot, 'package.json'));
  if (
    packageManifest.types !== './lib.d.mts' ||
    packageManifest.exports?.['.']?.types !== './lib.d.mts' ||
    !existsSync(join(installedRoot, 'lib.d.mts'))
  ) {
    fail('Packed MCP package does not expose typed programmatic root API.');
  }
  if (packageManifest.exports?.['./agent/examples/index.json'] !== './agent/examples/index.json') {
    fail('Packed package does not export ./agent/examples/index.json.');
  }
  if (packageManifest.exports?.['./agent/examples/*.ts'] !== './agent/examples/*.ts') {
    fail('Packed package does not export ./agent/examples/*.ts.');
  }
  if (packageManifest.exports?.['./agent/recipes/*.ts'] !== './agent/recipes/*.ts') {
    fail('Packed package does not export ./agent/recipes/*.ts.');
  }
  if (
    packageManifest.exports?.['./agent/root-export-map.json'] !== './agent/root-export-map.json'
  ) {
    fail('Packed package does not export ./agent/root-export-map.json.');
  }
  const mcpExecutable = packageManifest.bin?.['kern-mcp'];
  if (typeof mcpExecutable !== 'string' || !existsSync(join(installedRoot, mcpExecutable))) {
    fail('Packed MCP package does not expose the kern-mcp executable.');
  } else {
    const output = run(process.execPath, [join(installedRoot, mcpExecutable)], {
      cwd: installedRoot,
      input: `${JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: { protocolVersion: '2025-06-18' },
      })}\n`,
    });
    const initialized = JSON.parse(output);
    if (
      initialized.id !== 1 ||
      initialized.result?.serverInfo?.name !== 'kern-agent-contract' ||
      initialized.result?.serverInfo?.version !== packageManifest.version
    ) {
      fail('Packed kern-mcp executable did not initialize against its bundled manifest.');
    }
  }
  const repositoryRootExportMap = await readJson(repositoryRootExportMapPath);
  const packedRootExportMap = await readJson(join(installedRoot, 'agent/root-export-map.json'));
  if (JSON.stringify(packedRootExportMap) !== JSON.stringify(repositoryRootExportMap)) {
    fail('Packed root export ownership map differs from the repository contract.');
  }
  const packedExamplesRoot = join(installedRoot, 'agent/examples');
  const packedIndex = await readJson(join(packedExamplesRoot, 'index.json'));
  if (JSON.stringify(packedIndex) !== JSON.stringify(repositoryIndex)) {
    fail('Packed agent example index differs from the repository index.');
  }
  const packedSources = await regularFiles(packedExamplesRoot, '.ts');
  if (packedSources.length !== repositoryIndex.total) {
    fail(
      `Packed package contains ${packedSources.length} TypeScript examples; expected ${repositoryIndex.total}.`,
    );
  }
  for (const record of repositoryIndex.examples) {
    const source = await readFile(join(packedExamplesRoot, `${record.id}.ts`), 'utf8');
    if (digest(source) !== record.sourceDigest) {
      fail(`${record.id}: packed example source digest differs from the index.`);
    }
  }
  const manifest = await readJson(join(installedRoot, 'agent/component-manifest.json'));
  const packedRecipesRoot = join(installedRoot, 'agent/recipes');
  const packedRecipeSources = await regularFiles(packedRecipesRoot, '.ts');
  if (packedRecipeSources.length !== manifest.recipes.length) {
    fail(
      `Packed package contains ${packedRecipeSources.length} recipe sources; expected ${manifest.recipes.length}.`,
    );
  }
  for (const recipe of manifest.recipes) {
    const source = await readFile(join(packedRecipesRoot, `${recipe.id}.ts`), 'utf8');
    if (digest(source) !== recipe.sourceDigest || source !== recipe.code) {
      fail(`${recipe.id}: packed recipe source differs from its manifest contract.`);
    }
  }
  return {
    manifest,
    packedExamplesRoot,
    packedRecipesRoot,
  };
}

async function countEmittedExamples(outputRoot) {
  const paths = [];
  async function visit(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) await visit(path);
      else if (entry.isFile() && entry.name.endsWith('.js')) paths.push(path);
    }
  }
  await visit(outputRoot);
  return paths.length;
}

async function verifyPackedCompilation(repositoryIndex) {
  if (!existsSync(distRoot) || !existsSync(angularDistRoot)) {
    throw new Error('dist/kern or dist/kern-mcp is missing. Run "npm run build:kern" first.');
  }
  await mkdir(artifactsRoot, { recursive: true });
  const stagingRoot = await mkdtemp(join(artifactsRoot, 'kern-agent-dx-'));
  const consumerRoot = join(stagingRoot, 'consumer');

  try {
    await copyFixture(consumerRoot);
    run(npmCommand, ['ci', '--offline', '--no-audit', '--no-fund'], { cwd: consumerRoot });
    const angularPackOutput = run(npmCommand, [
      'pack',
      angularDistRoot,
      '--json',
      '--pack-destination',
      stagingRoot,
    ]);
    const angularPackReport = JSON.parse(angularPackOutput);
    const angularArchiveName = angularPackReport[0]?.filename;
    if (typeof angularArchiveName !== 'string') {
      throw new Error(`npm pack did not report an Angular archive: ${angularPackOutput}`);
    }
    const packOutput = run(npmCommand, [
      'pack',
      distRoot,
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
        join(stagingRoot, angularArchiveName),
        join(stagingRoot, archiveName),
        '--ignore-scripts',
        '--save-exact',
        '--offline',
        '--no-audit',
        '--no-fund',
      ],
      { cwd: consumerRoot },
    );

    const installedRoot = join(consumerRoot, 'node_modules/@kern-ui/mcp');
    const {
      manifest: packedManifest,
      packedExamplesRoot,
      packedRecipesRoot,
    } = await assertPackedAgentAssets(installedRoot, repositoryIndex);
    const sourceRoot = join(consumerRoot, 'src/examples');
    const recipeSourceRoot = join(consumerRoot, 'src/recipes');
    const apiProbeRoot = join(consumerRoot, 'src/mcp');
    await mkdir(sourceRoot, { recursive: true });
    await mkdir(recipeSourceRoot, { recursive: true });
    await mkdir(apiProbeRoot, { recursive: true });
    await writeFile(
      join(apiProbeRoot, 'api.ts'),
      `import {
  createKernAgentApi,
  loadManifest,
  toolDefinitions,
  type KrnMcpManifest,
} from '@kern-ui/mcp';

export async function inspectKernContract(path: string): Promise<number> {
  const manifest: KrnMcpManifest = await loadManifest(path);
  const api = createKernAgentApi(manifest);
  const result = api.callTool('get_overview');
  const schema: string = manifest.schemaVersion;
  const framework: string = api.getOverview().framework.name;
  void result.structuredContent;
  void toolDefinitions;
  return api.getOverview().totals.components + schema.length + framework.length;
}
`,
    );
    const packedSources = await regularFiles(packedExamplesRoot, '.ts');
    for (const source of packedSources) {
      await cp(source, join(sourceRoot, basename(source)));
    }
    const packedRecipeSources = await regularFiles(packedRecipesRoot, '.ts');
    for (const source of packedRecipeSources) {
      await cp(source, join(recipeSourceRoot, basename(source)));
    }

    const compilerPath = join(
      consumerRoot,
      'node_modules/@angular/compiler-cli/bundles/src/bin/ngc.js',
    );
    if (!existsSync(compilerPath)) {
      throw new Error(`Angular compiler is missing from the isolated fixture: ${compilerPath}.`);
    }
    run(process.execPath, [compilerPath, '-p', 'tsconfig.json'], { cwd: consumerRoot });

    const emittedCount = await countEmittedExamples(join(consumerRoot, 'out-tsc'));
    const expectedEmittedCount = repositoryIndex.total + packedManifest.recipes.length + 1;
    if (emittedCount !== expectedEmittedCount) {
      fail(
        `Packed-package AOT emitted ${emittedCount} agent modules; expected ${expectedEmittedCount}.`,
      );
    }

    const packedApi = createKernAgentApi(packedManifest);
    for (const task of KERN_AGENT_HIGH_RISK_TASKS) {
      const source = await readFile(join(sourceRoot, `${task.component}.ts`), 'utf8');
      const validation = packedApi.callTool('validate_usage', {
        component: task.component,
        code: source,
        stylesConfigured: true,
      });
      if (validation.isError || validation.structuredContent?.valid !== true) {
        fail(`${task.id}: packed-manifest MCP validate_usage failed.`);
      }
    }

    const archiveStats = await stat(join(stagingRoot, archiveName));
    console.log(
      `Packed artifact ${archiveName}: ${archiveStats.size} bytes; ${emittedCount} strict AOT modules emitted ` +
        `(${repositoryIndex.total} component examples + ${packedManifest.recipes.length} enterprise recipes + 1 typed MCP API probe).`,
    );
  } finally {
    if (process.env['KRN_KEEP_AGENT_DX_FIXTURE'] === '1') {
      console.log(`Kept agent DX fixture at ${stagingRoot}.`);
    } else {
      await rm(stagingRoot, { recursive: true, force: true });
    }
  }
}

async function main() {
  for (const requiredPath of [
    repositoryManifestPath,
    repositoryExamplesRoot,
    packageExamplesRoot,
    repositoryRecipesRoot,
    generatedRecipesRoot,
    packageRecipesRoot,
    fixtureRoot,
    fixtureConfigRoot,
  ]) {
    if (!existsSync(requiredPath)) {
      throw new Error(`Required path is missing: ${relative(workspaceRoot, requiredPath)}.`);
    }
  }

  run(process.execPath, [join(workspaceRoot, 'tools/agent-dx/generate-examples.mjs')]);
  const manifest = await readJson(repositoryManifestPath);
  const { index } = await verifyRepositoryContracts(manifest);
  await verifyPackedCompilation(index);

  if (failures.length) {
    throw new Error(`\n- ${failures.join('\n- ')}`);
  }
  console.log(
    `KERN agent DX verification passed: ${index.total} explicit examples, ` +
      `${manifest.recipes.length} runnable enterprise recipes, ` +
      `${KERN_AGENT_HIGH_RISK_TASKS.length} high-risk agent tasks.`,
  );
}

try {
  await main();
} catch (error) {
  console.error(
    `KERN agent DX verification failed: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 1;
}
