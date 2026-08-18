import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import ts from 'typescript';

import {
  extractCatalogFromSource,
  exportedClasses,
  isRuntimeValueExport,
  normalizeRepositoryPath,
} from '../../scripts/generate-component-contract.mjs';
import { stableTypeText } from '../../scripts/lib/stable-type-text.mjs';
import {
  componentStatusIssues,
  discoverLifecycleCatalogFromSource,
  lifecyclePromotionTransitions,
  promotionManualEvidenceIssues,
  symbolDependencyStatusIssues,
} from '../verify-kern-lifecycle.mjs';
import './kern-release-identity.test.mjs';
import './kern-versioned-docs.test.mjs';
import './kern-testing-entrypoint.test.mjs';

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const lifecycleScript = resolve(workspaceRoot, 'tools/verify-kern-lifecycle.mjs');
const componentInventoryScript = resolve(
  workspaceRoot,
  'tools/verify-kern-component-inventory.mjs',
);
const accessibilityScript = resolve(workspaceRoot, 'tools/verify-kern-accessibility-evidence.mjs');
const lifecycleEvidenceGenerator = resolve(
  workspaceRoot,
  'scripts/generate-lifecycle-evidence.mjs',
);
const lifecycleEvidencePath = resolve(workspaceRoot, 'projects/kern/api/lifecycle-evidence.json');
const packagePolicyScript = resolve(workspaceRoot, 'tools/verify-kern-package-policy.mjs');
const componentInventoryPath = resolve(workspaceRoot, 'projects/kern/api/component-inventory.json');
const agentRoot = resolve(workspaceRoot, 'projects/kern/agent');
const docsReleaseIdentityPath = resolve(workspaceRoot, 'projects/docs/src/app/release-identity.ts');
const ciWorkflowPath = resolve(workspaceRoot, '.github/workflows/ci.yml');

function run(script, ...arguments_) {
  return spawnSync(process.execPath, [script, ...arguments_], {
    cwd: workspaceRoot,
    encoding: 'utf8',
    maxBuffer: 2 * 1024 * 1024,
  });
}

function runNx(...arguments_) {
  return spawnSync(resolve(workspaceRoot, 'node_modules/.bin/nx'), arguments_, {
    cwd: workspaceRoot,
    encoding: 'utf8',
    env: {
      ...process.env,
      NX_DAEMON: 'false',
    },
    maxBuffer: 2 * 1024 * 1024,
  });
}

function isAngularProject(project) {
  return Object.values(project.targets ?? {}).some((target) => {
    const executor = target?.executor ?? target?.builder ?? '';
    return (
      executor.startsWith('@angular/') ||
      executor.startsWith('@angular-devkit/build-angular:') ||
      executor.startsWith('@nx/angular:')
    );
  });
}

function inventorySelectorDeprecation(entry, patch = {}) {
  return {
    id: entry.id,
    selector: entry.selector,
    status: 'active',
    introducedIn: entry.introducedIn,
    removeIn: entry.removeIn,
    replacement: entry.replacement,
    migration: entry.migration,
    documentation: entry.documentation,
    ...patch,
  };
}

async function temporaryJson(name, value) {
  const directory = await mkdtemp(join(tmpdir(), 'kern-governance-'));
  const path = join(directory, name);
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  return { directory, path };
}

function certifiedManualEvidence(evidence, { attestedAt, testedAt }) {
  const certified = structuredClone(evidence);
  for (const record of certified.records.filter((candidate) => candidate.required)) {
    record.status = 'pass';
    record.testedAt = testedAt;
    record.tester = 'Manual tester';
    record.verifiedBy = 'Independent reviewer';
    record.evidence = ['docs/accessibility/manual-evidence.json'];
    for (const environment of Object.values(record.environment)) {
      environment.version = 'fixture-1';
    }
  }
  certified.certification = {
    status: 'certified',
    statement: 'All required manual evidence records were independently reviewed.',
    attestedAt,
    attestedBy: 'Release reviewer',
    evidence: ['docs/accessibility/manual-evidence.json'],
  };
  return certified;
}

test('catalog selector literals support attribute selectors without generator inference', () => {
  const catalog = extractCatalogFromSource(`
    const GROUPS = { Actions: ['Button'] } as const;
    const VARIANT_OF = {} as const;
    const SELECTOR_BY_ID = { button: 'button[krnButton]' } as const;
  `);
  assert.equal(catalog.length, 1);
  assert.equal(catalog[0].selector, 'button[krnButton]');
});

test('lifecycle component matching consumes the shared attribute selector registry', () => {
  const catalog = discoverLifecycleCatalogFromSource(`
    const GROUPS = { Actions: ['Button'] } as const;
    const VARIANT_OF = {} as const;
    const SELECTOR_BY_ID = { button: 'button[krnButton]' } as const;
    const COMPONENT_OVERRIDES = {} as const;
    const BETA_COMPONENTS = new Set([]);
    const EXPERIMENTAL_COMPONENTS = new Set([]);
  `);
  const issues = componentStatusIssues(
    catalog,
    new Map([['button[krnButton]', 'FixtureButton']]),
    new Map([
      [
        './kit:FixtureButton',
        {
          entrypoint: './kit',
          name: 'FixtureButton',
          status: 'stable',
        },
      ],
    ]),
  );
  assert.deepEqual(issues, []);
});

test('lifecycle dependency closure rejects stable and beta symbols coupled to less mature API', () => {
  const discovered = new Map([
    ['./kit:StableControl', { dependencies: new Set(['./kit:BetaController']) }],
    ['./kit:BetaController', { dependencies: new Set(['./kit:ExperimentalState']) }],
    ['./kit:ExperimentalState', { dependencies: new Set(['./kit:BetaController']) }],
  ]);
  const registered = new Map([
    ['./kit:StableControl', { status: 'stable' }],
    ['./kit:BetaController', { status: 'beta' }],
    ['./kit:ExperimentalState', { status: 'experimental' }],
  ]);

  assert.deepEqual(symbolDependencyStatusIssues(discovered, registered), [
    'Public stable symbol "./kit:StableControl" depends on less mature beta symbol "./kit:BetaController".',
    'Public beta symbol "./kit:BetaController" depends on less mature experimental symbol "./kit:ExperimentalState".',
  ]);
});

test('catalog documentation overrides cannot bypass the selector literal registry', () => {
  assert.throws(
    () =>
      extractCatalogFromSource(`
        const GROUPS = { Actions: ['Button'] } as const;
        const VARIANT_OF = {} as const;
        const SELECTOR_BY_ID = {} as const;
        const COMPONENT_OVERRIDES = {
          button: { selector: 'button[krnButton]' },
        } as const;
      `),
    /COMPONENT_OVERRIDES\.button cannot override structural field "selector"/,
  );
});

test('generated repository paths normalize Windows separators to POSIX', () => {
  assert.equal(
    normalizeRepositoryPath(String.raw`projects\kern\kit\src\lib\actions\button.ts`),
    'projects/kern/kit/src/lib/actions/button.ts',
  );
});

test('runtime export discovery excludes decorated classes re-exported only as types', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'kern-export-fixture-'));
  const implementationPath = join(directory, 'implementation.ts');
  const intermediatePath = join(directory, 'intermediate.ts');
  const publicApiPath = join(directory, 'public-api.ts');
  const typeStarPath = join(directory, 'type-star.ts');
  const publicTypeStarPath = join(directory, 'public-type-star.ts');
  const localTypePath = join(directory, 'local-type.ts');
  const publicLocalTypePath = join(directory, 'public-local-type.ts');
  try {
    await Promise.all([
      writeFile(
        implementationPath,
        `
          declare function Component(metadata: { selector: string }): ClassDecorator;
          @Component({ selector: 'fixture-only-type' })
          export class FixtureOnlyType {}
          @Component({ selector: 'fixture-runtime-value' })
          export class FixtureRuntimeValue {}
        `,
        'utf8',
      ),
      writeFile(
        intermediatePath,
        `export { type FixtureOnlyType, FixtureRuntimeValue } from './implementation';`,
        'utf8',
      ),
      writeFile(publicApiPath, `export * from './intermediate';`, 'utf8'),
      writeFile(typeStarPath, `export type * from './implementation';`, 'utf8'),
      writeFile(publicTypeStarPath, `export * from './type-star';`, 'utf8'),
      writeFile(
        localTypePath,
        `
          import type { FixtureOnlyType } from './implementation';
          export { FixtureOnlyType };
        `,
        'utf8',
      ),
      writeFile(publicLocalTypePath, `export * from './local-type';`, 'utf8'),
    ]);

    const program = ts.createProgram({
      rootNames: [publicApiPath, publicTypeStarPath, publicLocalTypePath],
      options: {
        experimentalDecorators: true,
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
        noEmit: true,
        skipLibCheck: true,
        target: ts.ScriptTarget.ES2022,
      },
    });
    const diagnostics = ts
      .getPreEmitDiagnostics(program)
      .filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error);
    assert.equal(
      diagnostics.length,
      0,
      ts.formatDiagnostics(diagnostics, {
        getCanonicalFileName: (path) => path,
        getCurrentDirectory: () => directory,
        getNewLine: () => '\n',
      }),
    );
    const checker = program.getTypeChecker();
    const exportsOf = (path) => {
      const sourceFile = program.getSourceFile(path);
      assert.ok(sourceFile, `${path} must be in the fixture program`);
      const moduleSymbol = checker.getSymbolAtLocation(sourceFile) ?? sourceFile.symbol;
      assert.ok(moduleSymbol, `${path} must have a module symbol`);
      return checker.getExportsOfModule(moduleSymbol);
    };

    const publicExports = exportsOf(publicApiPath);
    const onlyType = publicExports.find((symbol) => symbol.getName() === 'FixtureOnlyType');
    const runtimeValue = publicExports.find((symbol) => symbol.getName() === 'FixtureRuntimeValue');
    assert.ok(onlyType);
    assert.ok(runtimeValue);
    assert.equal(
      isRuntimeValueExport(onlyType, checker, program.getSourceFile(publicApiPath)),
      false,
    );
    assert.equal(
      isRuntimeValueExport(runtimeValue, checker, program.getSourceFile(publicApiPath)),
      true,
    );

    const typeStarExports = exportsOf(publicTypeStarPath);
    const typeStarClass = typeStarExports.find((symbol) => symbol.getName() === 'FixtureOnlyType');
    assert.ok(typeStarClass);
    assert.equal(
      isRuntimeValueExport(typeStarClass, checker, program.getSourceFile(publicTypeStarPath)),
      false,
    );

    const localTypeExports = exportsOf(publicLocalTypePath);
    const localTypeClass = localTypeExports.find(
      (symbol) => symbol.getName() === 'FixtureOnlyType',
    );
    assert.ok(localTypeClass);
    assert.equal(
      isRuntimeValueExport(localTypeClass, checker, program.getSourceFile(publicLocalTypePath)),
      false,
    );

    const implementationSource = program.getSourceFile(implementationPath);
    assert.ok(implementationSource);
    const classes = implementationSource.statements
      .filter((statement) => ts.isClassDeclaration(statement) && statement.name)
      .map((statement) => ({
        decorated: { kind: 'component' },
        name: statement.name.text,
        selectors: [`fixture-${statement.name.text}`],
        source: normalizeRepositoryPath(relative(workspaceRoot, implementationPath)),
        symbol: checker.getSymbolAtLocation(statement.name),
      }));
    assert.ok(classes.every((definition) => definition.symbol));
    const exported = exportedClasses(
      {
        checker,
        classes,
        program,
      },
      {
        packageName: '@fixture/angular',
        entrypoints: [
          {
            name: 'fixture',
            publicApi: publicApiPath,
            subpath: './fixture',
          },
        ],
      },
    );
    assert.deepEqual(
      [...exported.values()].flatMap((records) => records.map((record) => record.name)),
      ['FixtureRuntimeValue'],
    );

    const locallyReexported = exportedClasses(
      {
        checker,
        classes,
        program,
      },
      {
        packageName: '@fixture/angular',
        entrypoints: [
          {
            name: 'fixture',
            publicApi: publicLocalTypePath,
            subpath: './fixture',
          },
        ],
      },
    );
    assert.equal(locallyReexported.size, 0);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('runtime contract union types are stable across source and program ordering', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'kern-union-fixture-'));
  const firstPath = join(directory, 'first.ts');
  const secondPath = join(directory, 'second.ts');
  try {
    await Promise.all([
      writeFile(
        firstPath,
        `
          export declare const fit: undefined | 'none' | null | 'fill' | 'cover' | 'contain';
          export declare const promised: Promise<undefined | 'b' | 'a'>;
          export declare const record: { state: null | 'Data display' | 'Actions' };
          export declare const handler:
            (value: 'b' | 'a') => undefined | 'd' | 'c';
          export declare const tuple:
            readonly [Promise<'b' | 'a'>, undefined | 'd' | 'c'];
        `,
        'utf8',
      ),
      writeFile(
        secondPath,
        `
          export declare const fit: 'contain' | 'cover' | 'fill' | null | 'none' | undefined;
          export declare const promised: Promise<'a' | 'b' | undefined>;
          export declare const record: { state: 'Actions' | 'Data display' | null };
          export declare const handler:
            (value: 'a' | 'b') => 'c' | 'd' | undefined;
          export declare const tuple:
            readonly [Promise<'a' | 'b'>, 'c' | 'd' | undefined];
        `,
        'utf8',
      ),
    ]);

    const render = (rootNames, path) => {
      const program = ts.createProgram({
        rootNames,
        options: {
          module: ts.ModuleKind.ESNext,
          moduleResolution: ts.ModuleResolutionKind.Bundler,
          noEmit: true,
          strictNullChecks: true,
          target: ts.ScriptTarget.ES2022,
        },
      });
      const sourceFile = program.getSourceFile(path);
      assert.ok(sourceFile, `${path} must be in the union fixture program`);
      const checker = program.getTypeChecker();
      return Object.fromEntries(
        sourceFile.statements
          .filter((statement) => ts.isVariableStatement(statement))
          .flatMap((statement) => statement.declarationList.declarations)
          .map((declaration) => [
            declaration.name.getText(sourceFile),
            stableTypeText(checker, checker.getTypeAtLocation(declaration.name), declaration),
          ]),
      );
    };

    const first = render([firstPath, secondPath], firstPath);
    const second = render([secondPath, firstPath], secondPath);
    assert.deepEqual(first, second);
    assert.deepEqual(first, {
      fit: '"contain" | "cover" | "fill" | "none" | null | undefined',
      handler: '(value: "a" | "b") => "c" | "d" | undefined',
      promised: 'Promise<"a" | "b" | undefined>',
      record: '{ state: "Actions" | "Data display" | null; }',
      tuple: 'readonly [Promise<"a" | "b">, "c" | "d" | undefined]',
    });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('component and agent generators share the stable type serializer', async () => {
  const [componentGenerator, agentGenerator] = await Promise.all([
    readFile(resolve(workspaceRoot, 'scripts/generate-component-contract.mjs'), 'utf8'),
    readFile(resolve(workspaceRoot, 'scripts/generate-agent-contract.mjs'), 'utf8'),
  ]);
  for (const [name, source] of [
    ['component', componentGenerator],
    ['agent', agentGenerator],
  ]) {
    assert.match(
      source,
      /import \{ stableTypeText \} from '\.\/lib\/stable-type-text\.mjs';/,
      `${name} generator must import the shared serializer`,
    );
    assert.doesNotMatch(
      source,
      /checker\.typeToString/,
      `${name} generator must not bypass the shared serializer`,
    );
  }
});

test('committed lifecycle and manual evidence registries verify', () => {
  const lifecycle = run(lifecycleScript);
  assert.equal(lifecycle.status, 0, lifecycle.stderr);
  assert.match(lifecycle.stdout, /132 catalog entries, 494 public symbols/);

  const componentInventory = run(componentInventoryScript);
  assert.equal(componentInventory.status, 0, componentInventory.stderr);
  assert.match(
    componentInventory.stdout,
    /136 public review units \(127 catalog \+ 9 supporting\), 3 internal, 150 selectors/,
  );

  const accessibility = run(accessibilityScript);
  assert.equal(accessibility.status, 0, accessibility.stderr);
  assert.match(accessibility.stdout, /0 pass, 0 fail, 7 pending/);
  assert.match(accessibility.stdout, /not-certified/);
  assert.match(accessibility.stdout, /mode=local/);

  const packagePolicy = run(packagePolicyScript);
  assert.equal(packagePolicy.status, 0, packagePolicy.stderr);
  assert.match(packagePolicy.stdout, /package policy verified/);
});

test('component inventory rejects a public review unit marked as internal', async () => {
  const inventory = JSON.parse(await readFile(componentInventoryPath, 'utf8'));
  const supporting = inventory.units.find((unit) => unit.role === 'supporting');
  assert.ok(supporting, 'fixture requires one supporting review unit');
  supporting.role = 'internal';
  const temporary = await temporaryJson('component-inventory.json', inventory);
  try {
    const result = run(componentInventoryScript, `--inventory=${temporary.path}`);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /a public unit cannot have role "internal"/);
  } finally {
    await rm(temporary.directory, { recursive: true, force: true });
  }
});

test('component inventory rejects an alias omitted from its canonical review unit', async () => {
  const inventory = JSON.parse(await readFile(componentInventoryPath, 'utf8'));
  const aliased = inventory.units.find((unit) => unit.aliases.selectors.length > 0);
  assert.ok(aliased, 'fixture requires one selector alias');
  aliased.aliases.selectors.shift();
  const temporary = await temporaryJson('component-inventory.json', inventory);
  try {
    const result = run(componentInventoryScript, `--inventory=${temporary.path}`);
    assert.notEqual(result.status, 0);
    assert.match(
      result.stderr,
      /aliases\.selectors must contain every non-canonical selector exactly once/,
    );
  } finally {
    await rm(temporary.directory, { recursive: true, force: true });
  }
});

test('component inventory rejects an ambiguous canonical catalog id', async () => {
  const inventory = JSON.parse(await readFile(componentInventoryPath, 'utf8'));
  const aliased = inventory.units.find((unit) =>
    unit.catalog.some((item) => item.variantOf !== null),
  );
  assert.ok(aliased, 'fixture requires one catalog alias');
  const catalogAlias = aliased.catalog.find((item) => item.variantOf !== null);
  catalogAlias.variantOf = null;
  const temporary = await temporaryJson('component-inventory.json', inventory);
  try {
    const result = run(componentInventoryScript, `--inventory=${temporary.path}`);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /must own exactly one canonical catalog id, found 2/);
  } finally {
    await rm(temporary.directory, { recursive: true, force: true });
  }
});

test('component inventory schema rejects an incomplete review unit', async () => {
  const inventory = JSON.parse(await readFile(componentInventoryPath, 'utf8'));
  delete inventory.units[0].source;
  const temporary = await temporaryJson('component-inventory.json', inventory);
  try {
    const result = run(componentInventoryScript, `--inventory=${temporary.path}`);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /does not satisfy its JSON Schema/);
  } finally {
    await rm(temporary.directory, { recursive: true, force: true });
  }
});

test('component inventory requires explicit review ownership for internal units', async () => {
  const inventory = JSON.parse(await readFile(componentInventoryPath, 'utf8'));
  const internal = inventory.units.find((unit) => unit.visibility === 'internal');
  assert.ok(internal, 'fixture requires one internal review unit');
  internal.reviewWith = null;
  const temporary = await temporaryJson('component-inventory.json', inventory);
  try {
    const result = run(componentInventoryScript, `--inventory=${temporary.path}`);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /an internal unit requires reviewWith/);
  } finally {
    await rm(temporary.directory, { recursive: true, force: true });
  }
});

test('component inventory rejects a missing internal review target', async () => {
  const inventory = JSON.parse(await readFile(componentInventoryPath, 'utf8'));
  const internal = inventory.units.find((unit) => unit.visibility === 'internal');
  assert.ok(internal, 'fixture requires one internal review unit');
  internal.reviewWith = `${internal.entrypoint}:KrnMissingReviewTarget`;
  const temporary = await temporaryJson('component-inventory.json', inventory);
  try {
    const result = run(componentInventoryScript, `--inventory=${temporary.path}`);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /references missing kit:KrnMissingReviewTarget/);
  } finally {
    await rm(temporary.directory, { recursive: true, force: true });
  }
});

test('component inventory rejects an internal review target outside its behavior family', async () => {
  const inventory = JSON.parse(await readFile(componentInventoryPath, 'utf8'));
  const internal = inventory.units.find((unit) => unit.visibility === 'internal');
  assert.ok(internal, 'fixture requires one internal review unit');
  internal.reviewWith = 'kit:KrnButton';
  const temporary = await temporaryJson('component-inventory.json', inventory);
  try {
    const result = run(componentInventoryScript, `--inventory=${temporary.path}`);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /same entrypoint and behavior family/);
  } finally {
    await rm(temporary.directory, { recursive: true, force: true });
  }
});

test('component inventory rejects an internal review target that is not public', async () => {
  const inventory = JSON.parse(await readFile(componentInventoryPath, 'utf8'));
  const internal = inventory.units.find((unit) => unit.visibility === 'internal');
  assert.ok(internal, 'fixture requires one internal review unit');
  internal.reviewWith = internal.reviewUnit;
  const temporary = await temporaryJson('component-inventory.json', inventory);
  try {
    const result = run(componentInventoryScript, `--inventory=${temporary.path}`);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /must review with a public review unit/);
  } finally {
    await rm(temporary.directory, { recursive: true, force: true });
  }
});

test('lifecycle verification rejects an unregistered public symbol', async () => {
  const registry = JSON.parse(
    await readFile(resolve(workspaceRoot, 'projects/kern/api/lifecycle.json'), 'utf8'),
  );
  registry.symbolGroups[0].symbols.shift();
  const temporary = await temporaryJson('lifecycle.json', registry);
  try {
    const result = run(lifecycleScript, `--lifecycle=${temporary.path}`);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /has no lifecycle registration/);
  } finally {
    await rm(temporary.directory, { recursive: true, force: true });
  }
});

test('Nx owns persistent task caching while Vite uses an ephemeral prebundle cache', async () => {
  const projectsResult = runNx('show', 'projects', '--json');
  assert.equal(projectsResult.status, 0, projectsResult.stderr);
  const projectNames = JSON.parse(projectsResult.stdout);
  assert.ok(projectNames.length > 0, 'Nx must discover at least one project');

  const angularProjects = [];
  const viteSmokeProjects = [];
  for (const name of projectNames) {
    const projectResult = runNx('show', 'project', name, '--json');
    assert.equal(projectResult.status, 0, projectResult.stderr);
    const resolvedProject = JSON.parse(projectResult.stdout);
    if (!isAngularProject(resolvedProject)) continue;
    angularProjects.push(name);
    const path = `${resolvedProject.root}/project.json`;
    const project = JSON.parse(await readFile(resolve(workspaceRoot, path), 'utf8'));
    const developmentServer = Object.values(project.targets ?? {}).find(
      (target) => (target.executor ?? target.builder) === '@angular/build:dev-server',
    );
    if (name === 'docs-vite-smoke') {
      assert.ok(developmentServer, `${path} must configure the Angular Vite development server`);
      viteSmokeProjects.push(name);
      assert.equal(project.cli?.cache?.enabled, true, `${path} must enable Vite prebundling`);
      assert.equal(
        project.cli?.cache?.environment,
        'all',
        `${path} must enable the isolated smoke cache in every environment`,
      );
      assert.equal(
        project.cli?.cache?.path,
        '.nx/cache/angular-vite-smoke',
        `${path} must keep the local Vite cache inside the Nx-owned cache root`,
      );
      assert.equal(
        developmentServer.options?.prebundle,
        true,
        `${path} must explicitly exercise Vite dependency prebundling`,
      );
      assert.equal(
        developmentServer.options?.buildTarget,
        'docs:build:development',
        `${path} must exercise the real Docs application build`,
      );
    } else {
      assert.equal(
        project.cli?.cache?.enabled,
        false,
        `${path} must leave Nx as the sole persistent task-cache owner`,
      );
    }
  }
  assert.ok(angularProjects.length > 0, 'Nx must discover at least one Angular project');
  assert.deepEqual(viteSmokeProjects, ['docs-vite-smoke']);

  const smoke = await readFile(resolve(workspaceRoot, 'tools/smoke-kern-vite-dev.mjs'), 'utf8');
  const compilerCacheAdapter = await readFile(
    resolve(workspaceRoot, 'tools/vite-smoke/in-memory-angular-compiler-cache.mjs'),
    'utf8',
  );
  assert.match(smoke, /from '@playwright\/test'/, 'the smoke must launch a real browser');
  assert.doesNotMatch(smoke, /CI:\s*'false'/, 'the smoke must preserve the caller CI mode');
  assert.match(smoke, /'docs-vite-smoke'/, 'the smoke must use the isolated Vite cache owner');
  assert.match(
    smoke,
    /in-memory-angular-compiler-cache\.mjs/,
    'the isolated smoke must not enable Angular compiler LMDB caching',
  );
  assert.equal(
    [...smoke.matchAll(/await rm\(viteCacheRoot/g)].length,
    2,
    'the smoke must clear its ephemeral Vite cache before and after execution',
  );
  assert.match(
    compilerCacheAdapter,
    /lmdb\.open =/,
    'the adapter must replace only nested Angular LMDB stores',
  );
  assert.doesNotMatch(
    compilerCacheAdapter,
    /process\.versions/,
    'the adapter must preserve Node worker and Atomics platform detection',
  );
  assert.match(
    smoke,
    /Prebundling has been configured but will not be used/,
    'the smoke must fail when Angular disables configured prebundling',
  );
  assert.match(
    smoke,
    /component-specimen-dropdown-button/,
    'the smoke must hydrate a lazy component specimen',
  );
  assert.match(
    smoke,
    /component-specimen-form-field/,
    'the smoke must cross a lazy route-category boundary',
  );
  assert.match(smoke, /getByRole\('menu'\)/, 'the smoke must exercise an interactive overlay');
  assert.match(smoke, /routeScriptResponses/, 'the smoke must observe a lazy Vite script request');
  assert.match(
    smoke,
    /Kern Vite development server browser smoke test passed/,
    'the smoke must execute the Vite browser runtime',
  );
  assert.match(
    smoke,
    /node_modules\/nx\/dist\/bin\/nx\.js/,
    'the smoke must use the portable Nx CLI',
  );
});

test('lifecycle verification rejects an active member not tagged deprecated in the API', async () => {
  const registry = JSON.parse(
    await readFile(resolve(workspaceRoot, 'projects/kern/api/deprecations.json'), 'utf8'),
  );
  const deprecatedMember = registry.entries.find((entry) => entry.kind !== 'selector');
  assert.ok(deprecatedMember, 'fixture requires a removed API member');
  deprecatedMember.status = 'active';
  const temporary = await temporaryJson('deprecations.json', registry);
  try {
    const result = run(lifecycleScript, `--deprecations=${temporary.path}`);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /is not tagged @deprecated in the API baseline/);
  } finally {
    await rm(temporary.directory, { recursive: true, force: true });
  }
});

test('lifecycle verification rejects an active selector deprecation missing from runtime metadata', async () => {
  const registry = JSON.parse(
    await readFile(resolve(workspaceRoot, 'projects/kern/api/deprecations.json'), 'utf8'),
  );
  const selector = registry.entries.find((entry) => entry.kind === 'selector');
  assert.ok(selector, 'fixture requires a removed selector deprecation');
  selector.status = 'active';
  selector.selector = 'krn-missing-selector';
  const temporary = await temporaryJson('deprecations.json', registry);
  try {
    const result = run(lifecycleScript, `--deprecations=${temporary.path}`);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /does not exist on a public component or directive/);
  } finally {
    await rm(temporary.directory, { recursive: true, force: true });
  }
});

test('lifecycle verification rejects a deprecated selector assigned to the wrong public symbol', async () => {
  const registry = JSON.parse(
    await readFile(resolve(workspaceRoot, 'projects/kern/api/deprecations.json'), 'utf8'),
  );
  const selector = registry.entries.find((entry) => entry.kind === 'selector');
  assert.ok(selector, 'fixture requires a removed selector deprecation');
  selector.status = 'active';
  selector.selector = 'div[krnButtonGroup]';
  selector.symbol = 'KrnButton';
  const temporary = await temporaryJson('deprecations.json', registry);
  try {
    const result = run(lifecycleScript, `--deprecations=${temporary.path}`);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /belongs to KrnButtonGroup, not public symbol/);
  } finally {
    await rm(temporary.directory, { recursive: true, force: true });
  }
});

test('component inventory schema rejects incomplete selector deprecation metadata', async () => {
  const inventory = JSON.parse(await readFile(componentInventoryPath, 'utf8'));
  const registry = JSON.parse(
    await readFile(resolve(workspaceRoot, 'projects/kern/api/deprecations.json'), 'utf8'),
  );
  const selector = registry.entries.find((entry) => entry.kind === 'selector');
  const unit = inventory.units.find((candidate) => candidate.symbol === selector?.symbol);
  assert.ok(unit && selector, 'fixture requires matching removed selector metadata');
  const incomplete = inventorySelectorDeprecation(selector);
  delete incomplete.replacement;
  unit.selectorDeprecations.push(incomplete);
  const temporary = await temporaryJson('component-inventory.json', inventory);
  try {
    const result = run(componentInventoryScript, `--inventory=${temporary.path}`);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /does not satisfy its JSON Schema/);
  } finally {
    await rm(temporary.directory, { recursive: true, force: true });
  }
});

test('component inventory rejects selector deprecation drift from the lifecycle registry', async () => {
  const inventory = JSON.parse(await readFile(componentInventoryPath, 'utf8'));
  const registry = JSON.parse(
    await readFile(resolve(workspaceRoot, 'projects/kern/api/deprecations.json'), 'utf8'),
  );
  const selector = registry.entries.find((entry) => entry.kind === 'selector');
  const unit = inventory.units.find((candidate) => candidate.symbol === selector?.symbol);
  assert.ok(unit && selector, 'fixture requires matching removed selector metadata');
  unit.selectorDeprecations.push(
    inventorySelectorDeprecation(selector, {
      migration: 'Use an unregistered migration instead.',
    }),
  );
  const temporary = await temporaryJson('component-inventory.json', inventory);
  try {
    const result = run(componentInventoryScript, `--inventory=${temporary.path}`);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /differs from the active deprecation registry/);
  } finally {
    await rm(temporary.directory, { recursive: true, force: true });
  }
});

test('manual evidence cannot claim pass without execution metadata and artifacts', async () => {
  const evidence = JSON.parse(
    await readFile(resolve(workspaceRoot, 'docs/accessibility/manual-evidence.json'), 'utf8'),
  );
  evidence.records[0].status = 'pass';
  const temporary = await temporaryJson('manual-evidence.json', evidence);
  try {
    const result = run(accessibilityScript, `--evidence=${temporary.path}`);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /version is required for completed evidence/);
    assert.match(result.stderr, /evidence is required for completed evidence/);
  } finally {
    await rm(temporary.directory, { recursive: true, force: true });
  }
});

test('manual evidence is validated against its declared JSON Schema', async () => {
  const evidence = JSON.parse(
    await readFile(resolve(workspaceRoot, 'docs/accessibility/manual-evidence.json'), 'utf8'),
  );
  evidence.untrackedClaim = true;
  const temporary = await temporaryJson('manual-evidence.json', evidence);
  try {
    const result = run(accessibilityScript, `--evidence=${temporary.path}`);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Manual evidence does not satisfy its JSON Schema/);
    assert.match(result.stderr, /must NOT have additional properties/);
  } finally {
    await rm(temporary.directory, { recursive: true, force: true });
  }
});

test('mandatory manual evidence records cannot disable required release gates', async () => {
  const evidence = JSON.parse(
    await readFile(resolve(workspaceRoot, 'docs/accessibility/manual-evidence.json'), 'utf8'),
  );
  const record = evidence.records.find(({ id }) => id === 'nvda-firefox-windows');
  assert.ok(record, 'fixture requires the mandatory NVDA record');
  record.required = false;
  record.releaseBlocking = false;
  const temporary = await temporaryJson('manual-evidence.json', evidence);
  try {
    const result = run(accessibilityScript, `--evidence=${temporary.path}`);
    assert.notEqual(result.status, 0);
    assert.match(
      result.stderr,
      /Required manual evidence record "nvda-firefox-windows" must set required=true/,
    );
    assert.match(
      result.stderr,
      /Required manual evidence record "nvda-firefox-windows" must set releaseBlocking=true/,
    );
  } finally {
    await rm(temporary.directory, { recursive: true, force: true });
  }
});

test('fresh post-test certification satisfies release and promotion timing gates', async () => {
  const evidence = JSON.parse(
    await readFile(resolve(workspaceRoot, 'docs/accessibility/manual-evidence.json'), 'utf8'),
  );
  const now = Date.now();
  const certified = certifiedManualEvidence(evidence, {
    testedAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
    attestedAt: new Date(now - 60 * 60 * 1000).toISOString(),
  });
  const temporary = await temporaryJson('manual-evidence.json', certified);
  try {
    const release = run(accessibilityScript, `--evidence=${temporary.path}`, '--mode=release');
    assert.equal(release.status, 0, release.stderr);
    const promotion = run(
      accessibilityScript,
      `--evidence=${temporary.path}`,
      '--mode=promotion',
      '--components=select',
    );
    assert.equal(promotion.status, 0, promotion.stderr);
  } finally {
    await rm(temporary.directory, { recursive: true, force: true });
  }
});

test('release certification cannot be attested in the future', async () => {
  const evidence = JSON.parse(
    await readFile(resolve(workspaceRoot, 'docs/accessibility/manual-evidence.json'), 'utf8'),
  );
  const now = Date.now();
  const certified = certifiedManualEvidence(evidence, {
    testedAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
    attestedAt: new Date(now + 60 * 60 * 1000).toISOString(),
  });
  const temporary = await temporaryJson('manual-evidence.json', certified);
  try {
    const result = run(accessibilityScript, `--evidence=${temporary.path}`, '--mode=release');
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /certification\.attestedAt not to be in the future/);
  } finally {
    await rm(temporary.directory, { recursive: true, force: true });
  }
});

test('release certification must satisfy the release freshness policy', async () => {
  const evidence = JSON.parse(
    await readFile(resolve(workspaceRoot, 'docs/accessibility/manual-evidence.json'), 'utf8'),
  );
  evidence.policy.releaseMaxAgeDays = 1;
  const now = Date.now();
  const certified = certifiedManualEvidence(evidence, {
    testedAt: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
    attestedAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
  });
  const temporary = await temporaryJson('manual-evidence.json', certified);
  try {
    const result = run(accessibilityScript, `--evidence=${temporary.path}`, '--mode=release');
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Release gate requires certification no older than 1 day/);
  } finally {
    await rm(temporary.directory, { recursive: true, force: true });
  }
});

test('promotion certification must postdate its required passing records', async () => {
  const evidence = JSON.parse(
    await readFile(resolve(workspaceRoot, 'docs/accessibility/manual-evidence.json'), 'utf8'),
  );
  const now = Date.now();
  const certified = certifiedManualEvidence(evidence, {
    testedAt: new Date(now - 60 * 60 * 1000).toISOString(),
    attestedAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
  });
  const temporary = await temporaryJson('manual-evidence.json', certified);
  try {
    const result = run(
      accessibilityScript,
      `--evidence=${temporary.path}`,
      '--mode=promotion',
      '--components=select',
    );
    assert.notEqual(result.status, 0);
    assert.match(
      result.stderr,
      /Promotion gate for "select" certification must be at or after required passing record/,
    );
  } finally {
    await rm(temporary.directory, { recursive: true, force: true });
  }
});

test('manual evidence remains non-blocking locally but blocks a release while required runs are pending', () => {
  const local = run(accessibilityScript);
  assert.equal(local.status, 0, local.stderr);

  const release = run(accessibilityScript, '--mode=release');
  assert.notEqual(release.status, 0);
  assert.match(release.stderr, /Release gate requires "nvda-firefox-windows" to pass/);
  assert.match(release.stderr, /current status is pending/);
});

test('pre-1 release mode preserves pending evidence without claiming certification', () => {
  const result = run(accessibilityScript, '--mode=pre-1-release');
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /certification status is not-certified/);
  assert.match(result.stdout, /mode=pre-1-release/);
});

test('pre-1 release mode rejects failed or blocked required evidence', async () => {
  const evidence = JSON.parse(
    await readFile(resolve(workspaceRoot, 'docs/accessibility/manual-evidence.json'), 'utf8'),
  );
  const record = evidence.records.find(({ id }) => id === 'nvda-firefox-windows');
  assert.ok(record, 'fixture requires the mandatory NVDA record');
  record.status = 'blocked';
  record.notes = 'Blocked by an unavailable required Windows test environment.';
  const temporary = await temporaryJson('manual-evidence.json', evidence);
  try {
    const result = run(accessibilityScript, `--evidence=${temporary.path}`, '--mode=pre-1-release');
    assert.notEqual(result.status, 0);
    assert.match(
      result.stderr,
      /Pre-1 release gate rejects "nvda-firefox-windows" with status blocked/,
    );
  } finally {
    await rm(temporary.directory, { recursive: true, force: true });
  }
});

test('pre-1 release mode cannot be used for a stable major version', async () => {
  const evidence = JSON.parse(
    await readFile(resolve(workspaceRoot, 'docs/accessibility/manual-evidence.json'), 'utf8'),
  );
  evidence.libraryVersion = '1.0.0';
  const temporaryEvidence = await temporaryJson('manual-evidence.json', evidence);
  const temporaryManifest = await temporaryJson('package.json', {
    name: '@kern-ui/angular',
    version: '1.0.0',
  });
  try {
    const result = run(
      accessibilityScript,
      `--evidence=${temporaryEvidence.path}`,
      `--package-manifest=${temporaryManifest.path}`,
      '--mode=pre-1-release',
    );
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Pre-1 release mode requires a 0\.x package version/);
  } finally {
    await rm(temporaryEvidence.directory, { recursive: true, force: true });
    await rm(temporaryManifest.directory, { recursive: true, force: true });
  }
});

test('manual evidence blocks stable promotion without component-scoped passing AT records', () => {
  const result = run(accessibilityScript, '--mode=promotion', '--components=select');
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Promotion gate for "select" requires/);
  assert.match(result.stderr, /current status is pending/);
});

test('lifecycle evidence is materialized and release mode requires an attestation', async () => {
  const generated = run(lifecycleEvidenceGenerator);
  assert.equal(generated.status, 0, generated.stderr);

  const evidence = JSON.parse(await readFile(lifecycleEvidencePath, 'utf8'));
  assert.equal(evidence.components.length, 132);
  const button = evidence.components.find((component) => component.id === 'button');
  assert.ok(button, 'fixture requires Button lifecycle evidence');
  assert.deepEqual(button.evidence.find((item) => item.kind === 'unit')?.artifactIds, [
    'unit-button',
  ]);
  assert.equal(
    evidence.artifacts['unit-button']?.path,
    'projects/kern/kit/src/lib/actions/button.spec.ts',
  );
  assert.equal(evidence.artifacts['unit-button']?.anchor, 'KrnButton');
  const numberInput = evidence.components.find((component) => component.id === 'number-input');
  assert.ok(numberInput, 'fixture requires Number Input lifecycle evidence');
  assert.equal(numberInput.evidence.find((item) => item.kind === 'mobile-touch')?.status, 'linked');

  const release = run(lifecycleScript, '--mode=release');
  assert.notEqual(release.status, 0);
  assert.match(release.stderr, /Release lifecycle mode requires --release-attestation=PATH/);
});

test('lifecycle evidence rejects stale artifacts and unresolved promotion requirements', async () => {
  const evidence = JSON.parse(await readFile(lifecycleEvidencePath, 'utf8'));
  evidence.artifacts['catalog-a11y'].sha256 = `sha256-${'0'.repeat(64)}`;
  const temporary = await temporaryJson('lifecycle-evidence.json', evidence);
  try {
    const stale = run(lifecycleScript, `--evidence=${temporary.path}`);
    assert.notEqual(stale.status, 0);
    assert.match(stale.stderr, /artifact "catalog-a11y" is stale/);
  } finally {
    await rm(temporary.directory, { recursive: true, force: true });
  }

  const promotion = run(lifecycleScript, '--mode=promotion', '--components=command-palette');
  assert.notEqual(promotion.status, 0);
  assert.match(
    promotion.stderr,
    /promotion gate requires linked lifecycle evidence "command-palette:runtime-performance"/i,
  );
  assert.match(promotion.stderr, /requires certified manual AT evidence/);
});

test('lifecycle transition detection gates only beta or experimental promotions to stable', () => {
  const lifecycle = (status, evidenceProfile, owner = 'kern/forms') => ({
    catalogGroups: [
      {
        status,
        evidenceProfile,
        owner,
        ids: ['select'],
      },
    ],
  });
  const beta = lifecycle('beta', 'beta-promotion');
  const stable = lifecycle('stable', 'beta-promotion');

  assert.deepEqual(lifecyclePromotionTransitions(beta, stable), [
    {
      fromEvidenceProfile: 'beta-promotion',
      fromStatus: 'beta',
      id: 'select',
      toEvidenceProfile: 'beta-promotion',
      toStatus: 'stable',
    },
  ]);
  assert.deepEqual(
    lifecyclePromotionTransitions(stable, lifecycle('stable', 'stable-release', 'kern/platform')),
    [],
    'ordinary edits to an already-stable component must not reopen promotion',
  );
  assert.equal(
    lifecyclePromotionTransitions(lifecycle('experimental', 'experimental-incubation'), stable)[0]
      ?.id,
    'select',
  );
});

test('transition-aware lifecycle gate rejects pending manual evidence and accepts fresh certification', () => {
  const now = Date.parse('2026-08-03T12:00:00.000Z');
  const item = { recordIds: ['nvda-firefox-windows'] };
  const pending = {
    certification: { status: 'not-certified' },
    policy: { promotionMaxAgeDays: 30 },
    records: [{ id: 'nvda-firefox-windows', status: 'pending', testedAt: null }],
  };
  assert.deepEqual(promotionManualEvidenceIssues('select', item, pending, now), [
    'Promotion gate for "select" requires certified manual AT evidence.',
    'Promotion gate for "select" requires passing manual record "nvda-firefox-windows".',
  ]);

  const certified = structuredClone(pending);
  certified.certification.status = 'certified';
  certified.records[0] = {
    id: 'nvda-firefox-windows',
    status: 'pass',
    testedAt: '2026-08-02T12:00:00.000Z',
  };
  assert.deepEqual(promotionManualEvidenceIssues('select', item, certified, now), []);
});

test('lifecycle verifier automatically applies promotion evidence when a base status becomes stable', async () => {
  const base = JSON.parse(
    await readFile(resolve(workspaceRoot, 'projects/kern/api/lifecycle.json'), 'utf8'),
  );
  const current = structuredClone(base);
  const sourceGroup = current.catalogGroups.find(({ ids }) => ids.includes('select'));
  assert.equal(sourceGroup?.status, 'beta');
  sourceGroup.ids = sourceGroup.ids.filter((id) => id !== 'select');
  current.catalogGroups.push({
    category: sourceGroup.category,
    status: 'stable',
    owner: sourceGroup.owner,
    evidenceProfile: 'beta-promotion',
    ids: ['select'],
  });
  const [baseFile, currentFile] = await Promise.all([
    temporaryJson('base-lifecycle.json', base),
    temporaryJson('current-lifecycle.json', current),
  ]);
  try {
    const result = run(
      lifecycleScript,
      `--lifecycle=${currentFile.path}`,
      `--base-lifecycle=${baseFile.path}`,
    );
    assert.notEqual(result.status, 0);
    assert.match(
      result.stderr,
      /Promotion gate for "select" requires certified manual AT evidence/,
    );
    assert.match(result.stderr, /Promotion gate for "select" requires passing manual record/);
  } finally {
    await Promise.all(
      [baseFile, currentFile].map(({ directory }) =>
        rm(directory, { recursive: true, force: true }),
      ),
    );
  }
});

test('CI compares lifecycle promotions with the exact pull request or push base commit', async () => {
  const workflow = await readFile(ciWorkflowPath, 'utf8');
  assert.match(workflow, /fetch-depth: 0/);
  assert.match(
    workflow,
    /KERN_LIFECYCLE_BASE_REF: \$\{\{ github\.event\.pull_request\.base\.sha \|\| github\.event\.before \}\}/,
  );
  assert.match(workflow, /verify-kern-lifecycle\.mjs "--base-ref=\$\{KERN_LIFECYCLE_BASE_REF\}"/);
});

test('CI exposes independent required checks for every release-quality layer', async () => {
  const [workflow, workspaceManifest] = await Promise.all([
    readFile(ciWorkflowPath, 'utf8'),
    readFile(resolve(workspaceRoot, 'package.json'), 'utf8').then(JSON.parse),
  ]);
  for (const [name, script] of [
    ['Contracts and release policy', 'verify:contracts'],
    ['Lint, types, and unit tests', 'verify:code'],
    ['Build and packed consumers', 'verify:package'],
    ['Workspace build and dev smoke', 'verify:workspace'],
  ]) {
    assert.match(workflow, new RegExp(`name: ${name.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
    assert.match(workflow, new RegExp(`npm run ${script}`));
    assert.equal(typeof workspaceManifest.scripts[script], 'string');
  }
  assert.match(workflow, /name: Browser behavior and accessibility/);
  assert.match(workflow, /npm run test:e2e/);
  assert.match(workspaceManifest.scripts.verify, /verify:contracts/);
  assert.match(workspaceManifest.scripts.verify, /verify:code/);
  assert.match(workspaceManifest.scripts.verify, /verify:package/);
  assert.match(workspaceManifest.scripts.verify, /verify:workspace/);
});

test('package policy rejects publication without provenance', async () => {
  const manifest = JSON.parse(
    await readFile(resolve(workspaceRoot, 'projects/kern/package.json'), 'utf8'),
  );
  manifest.publishConfig.provenance = false;
  const temporary = await temporaryJson('package.json', manifest);
  try {
    const result = run(packagePolicyScript, `--manifest=${temporary.path}`);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /provenance publication/);
  } finally {
    await rm(temporary.directory, { recursive: true, force: true });
  }
});

test('package policy keeps Angular framework packages out of runtime dependencies', async () => {
  const [manifest, policy] = await Promise.all([
    readFile(resolve(workspaceRoot, 'projects/kern/package.json'), 'utf8').then(JSON.parse),
    readFile(resolve(workspaceRoot, 'projects/kern/api/release-policy.json'), 'utf8').then(
      JSON.parse,
    ),
  ]);
  const angularCoreRange = manifest.peerDependencies['@angular/core'];
  delete manifest.peerDependencies['@angular/core'];
  manifest.dependencies['@angular/core'] = angularCoreRange;
  delete policy.peerDependencies['@angular/core'];
  policy.dependencies['@angular/core'] = angularCoreRange;
  const [temporaryManifest, temporaryPolicy] = await Promise.all([
    temporaryJson('package.json', manifest),
    temporaryJson('release-policy.json', policy),
  ]);
  try {
    const result = run(
      packagePolicyScript,
      `--manifest=${temporaryManifest.path}`,
      `--policy=${temporaryPolicy.path}`,
    );
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Framework package @angular\/core must be a peerDependency/);
  } finally {
    await Promise.all(
      [temporaryManifest, temporaryPolicy].map(({ directory }) =>
        rm(directory, { recursive: true, force: true }),
      ),
    );
  }
});

test('package policy requires published schematics tooling as optional peers', async () => {
  const [manifest, policy] = await Promise.all([
    readFile(resolve(workspaceRoot, 'projects/kern/package.json'), 'utf8').then(JSON.parse),
    readFile(resolve(workspaceRoot, 'projects/kern/api/release-policy.json'), 'utf8').then(
      JSON.parse,
    ),
  ]);
  delete manifest.peerDependenciesMeta['@angular-devkit/schematics'];
  delete policy.peerDependenciesMeta['@angular-devkit/schematics'];
  const [temporaryManifest, temporaryPolicy] = await Promise.all([
    temporaryJson('package.json', manifest),
    temporaryJson('release-policy.json', policy),
  ]);
  try {
    const result = run(
      packagePolicyScript,
      `--manifest=${temporaryManifest.path}`,
      `--policy=${temporaryPolicy.path}`,
    );
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Tooling peer @angular-devkit\/schematics must be optional/);
  } finally {
    await Promise.all(
      [temporaryManifest, temporaryPolicy].map(({ directory }) =>
        rm(directory, { recursive: true, force: true }),
      ),
    );
  }
});

test('package policy requires the MCP TypeScript dependency to cover the exact verified workspace version', async () => {
  const policy = JSON.parse(
    await readFile(resolve(workspaceRoot, 'projects/kern/api/release-policy.json'), 'utf8'),
  );
  policy.companionPackage.dependencies.typescript = '>=7.0.0 <8.0.0';
  const temporary = await temporaryJson('release-policy.json', policy);
  try {
    const result = run(packagePolicyScript, `--policy=${temporary.path}`);
    assert.notEqual(result.status, 0);
    assert.match(
      result.stderr,
      /must include the exact TypeScript version used by the verified workspace/,
    );
  } finally {
    await rm(temporary.directory, { recursive: true, force: true });
  }
});

test('package policy rejects a TypeScript MCP dependency wider than Angular supports', async () => {
  const policy = JSON.parse(
    await readFile(resolve(workspaceRoot, 'projects/kern/api/release-policy.json'), 'utf8'),
  );
  policy.companionPackage.dependencies.typescript = '>=6.0.0 <8.0.0';
  const temporary = await temporaryJson('release-policy.json', policy);
  try {
    const result = run(packagePolicyScript, `--policy=${temporary.path}`);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /must stay within the Angular build peer range/);
  } finally {
    await rm(temporary.directory, { recursive: true, force: true });
  }
});

test('documentation publishes the canonical agent contract for web discovery', async () => {
  const project = JSON.parse(
    await readFile(resolve(workspaceRoot, 'projects/docs/project.json'), 'utf8'),
  );
  const assets = project.targets.build.options.assets;
  const agentAssets = assets.filter((asset) => asset.input === 'projects/kern/agent');

  assert.deepEqual(agentAssets, [
    {
      glob: '**/*',
      input: 'projects/kern/agent',
      ignore: ['**/tsconfig.json'],
      output: 'agent',
    },
    {
      glob: '**/*',
      input: 'projects/kern/agent',
      ignore: ['**/tsconfig.json'],
    },
  ]);
});

test('agent discovery links and manifest assets resolve from every supported web location', async () => {
  const [llms, manifest, examplesIndex] = await Promise.all([
    readFile(resolve(agentRoot, 'llms.txt'), 'utf8'),
    readFile(resolve(agentRoot, 'component-manifest.json'), 'utf8').then(JSON.parse),
    readFile(resolve(agentRoot, 'examples/index.json'), 'utf8').then(JSON.parse),
  ]);
  const links = [...llms.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)].map((match) => match[1]);
  const uniqueLinks = new Set(links);

  assert.equal(links.length, uniqueLinks.size, 'llms.txt must not publish duplicate links.');
  assert.equal(
    links.filter((link) => link.startsWith('./components/')).length,
    manifest.components.length,
  );
  for (const required of [
    './component-manifest.json',
    './import-map.json',
    './root-export-map.json',
    './checklist.md',
    './common-mistakes.md',
    './llms-full.txt',
    './examples/index.json',
  ]) {
    assert.ok(uniqueLinks.has(required), `llms.txt is missing ${required}.`);
  }

  for (const link of links) {
    assert.match(link, /^\.[/][a-z0-9][a-z0-9./-]*$/i);
    assert.doesNotMatch(link, /(?:^|[/])\.\.(?:[/]|$)/);
    await readFile(resolve(agentRoot, link.slice(2)));
  }

  const mounts = ['/', `/versions/${manifest.library.version}/`];
  for (const mount of mounts) {
    const mountUrl = new URL(mount, 'https://kern-ui.dev');
    for (const contractDirectory of ['', 'agent/']) {
      const contractRootUrl = new URL(contractDirectory, mountUrl);
      const llmsUrl = new URL('llms.txt', contractRootUrl);
      const manifestUrl = new URL('component-manifest.json', contractRootUrl);

      for (const link of links) {
        const resolved = new URL(link, llmsUrl);
        assert.equal(resolved.origin, mountUrl.origin);
        assert.equal(
          resolved.pathname,
          `${contractRootUrl.pathname}${link.slice(2)}`,
          `${link} does not map to the copied ${contractRootUrl.pathname} contract tree.`,
        );
      }

      const schemaUrl = new URL(manifest.$schema, manifestUrl);
      assert.equal(schemaUrl.pathname, `${contractRootUrl.pathname}component-manifest.schema.json`);

      for (const component of manifest.components) {
        assert.equal(component.documentation.route, `components/${component.id}`);
        assert.equal(component.documentation.json, `components/${component.id}.json`);
        assert.equal(component.documentation.markdown, `components/${component.id}.md`);
        assert.equal(component.examples[0].source, `examples/${component.id}.ts`);

        const routeUrl = new URL(component.documentation.route, mountUrl);
        assert.equal(routeUrl.pathname, `${mountUrl.pathname}components/${component.id}`);

        for (const asset of [
          component.documentation.json,
          component.documentation.markdown,
          component.examples[0].source,
        ]) {
          const resolved = new URL(asset, manifestUrl);
          assert.equal(
            resolved.pathname,
            `${contractRootUrl.pathname}${asset}`,
            `${asset} does not map to the copied ${contractRootUrl.pathname} contract tree.`,
          );
          await readFile(resolve(agentRoot, asset));
        }
      }

      for (const recipe of manifest.recipes) {
        assert.equal(recipe.source, `recipes/${recipe.id}.ts`);
        const resolved = new URL(recipe.source, manifestUrl);
        assert.equal(resolved.pathname, `${contractRootUrl.pathname}${recipe.source}`);
        await readFile(resolve(agentRoot, recipe.source));
      }

      const indexUrl = new URL('examples/index.json', contractRootUrl);
      for (const example of examplesIndex.examples) {
        assert.equal(example.source, `${example.id}.ts`);
        const resolved = new URL(example.source, indexUrl);
        assert.equal(resolved.pathname, `${contractRootUrl.pathname}examples/${example.id}.ts`);
        await readFile(resolve(agentRoot, 'examples', example.source));
      }
    }
  }
});

test('documentation release identity matches the package and exposes its publication state', async () => {
  const packageManifest = JSON.parse(
    await readFile(resolve(workspaceRoot, 'projects/kern/package.json'), 'utf8'),
  );
  const releaseIdentity = await readFile(docsReleaseIdentityPath, 'utf8');
  const versionMatch = releaseIdentity.match(
    /export const KERN_DOCS_VERSION = '([^']+)' as const;/,
  );
  const stateMatch = releaseIdentity.match(
    /export const KERN_DOCS_RELEASE_STATE(?:\s*:[^=]+)?\s*=\s*'([^']+)';/,
  );

  assert.ok(versionMatch, 'release-identity.ts must export a literal KERN_DOCS_VERSION');
  assert.ok(stateMatch, 'release-identity.ts must export a literal KERN_DOCS_RELEASE_STATE');
  assert.equal(versionMatch[1], packageManifest.version);
  assert.ok(
    ['source-candidate', 'released'].includes(stateMatch[1]),
    'documentation release state must be source-candidate or released',
  );

  const releaseSurfaces = await Promise.all(
    [
      'projects/docs/src/app/app.ts',
      'projects/docs/src/app/app.html',
      'projects/docs/src/app/pages/changelog.ts',
    ].map((path) => readFile(resolve(workspaceRoot, path), 'utf8')),
  );
  const renderedReleaseSource = releaseSurfaces.join('\n');

  assert.match(renderedReleaseSource, /KERN_DOCS_VERSION|docsVersion/);
  assert.match(renderedReleaseSource, /KERN_DOCS_RELEASE_STATE_LABEL|docsReleaseStateLabel/);
  if (stateMatch[1] === 'source-candidate') {
    assert.doesNotMatch(renderedReleaseSource, />\s*Current release\s*</);
  }
});
