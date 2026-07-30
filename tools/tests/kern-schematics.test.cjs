'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { describe, it } = require('node:test');
const { HostTree } = require('@angular-devkit/schematics');
const { SchematicTestRunner } = require('@angular-devkit/schematics/testing');
const ts = require('typescript');

const collectionPath = path.resolve(__dirname, '../../projects/kern/schematics/collection.json');
const migrationPath = path.resolve(__dirname, '../../projects/kern/schematics/migration.json');
const kernPackageRoot = path.resolve(__dirname, '../../projects/kern');
const kernRootPublicApi = path.join(kernPackageRoot, 'src/public-api.ts');
const kernTsconfig = path.join(kernPackageRoot, 'tsconfig.lib.json');
const kernRootExportMap = path.join(kernPackageRoot, 'agent/root-export-map.json');
const kernStyle = 'node_modules/@kern-ui/angular/styles/kern.css';
const kernPackageName = '@kern-ui/angular';

function workspace(projects = { app: applicationProject() }) {
  const tree = new HostTree();
  tree.create(
    '/angular.json',
    JSON.stringify(
      {
        version: 1,
        projects,
      },
      null,
      2,
    ),
  );
  return tree;
}

function applicationProject(styles = ['src/styles.css']) {
  return {
    projectType: 'application',
    root: '',
    sourceRoot: 'src',
    architect: {
      build: {
        builder: '@angular/build:application',
        options: {
          browser: 'src/main.ts',
          styles,
        },
        configurations: {
          production: {
            optimization: true,
          },
        },
      },
    },
  };
}

function nxApplicationProject(root = 'projects/app', styles = [`${root}/src/styles.css`]) {
  return {
    $schema: '../../node_modules/nx/schemas/project-schema.json',
    projectType: 'application',
    root,
    sourceRoot: `${root}/src`,
    prefix: 'app',
    tags: ['scope:application', 'type:application'],
    cli: {
      cache: {
        enabled: false,
      },
    },
    targets: {
      build: {
        executor: '@angular/build:application',
        options: {
          browser: `${root}/src/main.ts`,
          styles,
        },
        configurations: {
          production: {
            optimization: true,
          },
        },
      },
    },
  };
}

function nxWorkspace(projects = { app: nxApplicationProject() }) {
  const tree = new HostTree();
  tree.create(
    '/nx.json',
    JSON.stringify(
      {
        $schema: './node_modules/nx/schemas/nx-schema.json',
        targetDefaults: {
          build: {
            cache: true,
            dependsOn: ['^build'],
          },
        },
      },
      null,
      2,
    ),
  );
  for (const [name, project] of Object.entries(projects)) {
    const config = { name, ...project };
    tree.create(`/${config.root}/project.json`, JSON.stringify(config, null, 2));
  }
  return tree;
}

function stylesFrom(tree, projectName = 'app') {
  return JSON.parse(tree.readText('/angular.json')).projects[projectName].architect.build.options
    .styles;
}

function nxProjectFrom(tree, projectName = 'app', root = `projects/${projectName}`) {
  const source = tree.readText(`/${root}/project.json`).replace(/^\s*\/\/.*$/gm, '');
  const project = JSON.parse(source);
  assert.equal(project.name, projectName);
  return project;
}

function nxStylesFrom(tree, projectName = 'app', root = `projects/${projectName}`) {
  return nxProjectFrom(tree, projectName, root).targets.build.options.styles;
}

function addCompatiblePackage(tree) {
  tree.create(
    '/package.json',
    JSON.stringify({
      dependencies: {
        '@angular/aria': '22.0.6',
        '@angular/cdk': '22.0.6',
        '@angular/common': '22.0.8',
        '@angular/core': '22.0.8',
        '@angular/forms': '22.0.8',
        rxjs: '7.8.2',
      },
    }),
  );
  return tree;
}

function addStandaloneApplication(tree, sourceRoot = 'src') {
  const root = `/${sourceRoot.replace(/^\/+|\/+$/g, '')}`;
  tree.create(
    `${root}/main.ts`,
    `import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { appConfig } from './app/app.config';

bootstrapApplication(App, appConfig).catch(console.error);
`,
  );
  tree.create(
    `${root}/app/app.config.ts`,
    `import { ApplicationConfig } from '@angular/core';

export const appConfig: ApplicationConfig = {
  providers: [],
};
`,
  );
  tree.create(
    `${root}/app/app.ts`,
    `import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
`,
  );
  tree.create(`${root}/app/app.html`, '<main>Application</main>\n');
  tree.create(`${root}/styles.css`, '');
  return tree;
}

function count(source, pattern) {
  return [...source.matchAll(pattern)].length;
}

function assertTypeScriptSyntax(source, fileName) {
  const result = ts.transpileModule(source, {
    fileName,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      experimentalDecorators: true,
    },
    reportDiagnostics: true,
  });
  const diagnostics = (result.diagnostics ?? []).filter(
    (item) => item.category === ts.DiagnosticCategory.Error,
  );
  assert.deepEqual(
    diagnostics.map((item) => ts.flattenDiagnosticMessageText(item.messageText, '\n')),
    [],
  );
}

function compilerRootExports() {
  const loaded = ts.readConfigFile(kernTsconfig, ts.sys.readFile);
  assert.equal(loaded.error, undefined);
  const parsed = ts.parseJsonConfigFileContent(loaded.config, ts.sys, path.dirname(kernTsconfig), {
    noEmit: true,
  });
  const program = ts.createProgram({
    rootNames: [...parsed.fileNames, kernRootPublicApi],
    options: { ...parsed.options, noEmit: true, skipLibCheck: true },
  });
  const sourceFile = program.getSourceFile(kernRootPublicApi);
  assert.ok(sourceFile);
  const checker = program.getTypeChecker();
  const moduleSymbol = checker.getSymbolAtLocation(sourceFile);
  assert.ok(moduleSymbol);
  return checker
    .getExportsOfModule(moduleSymbol)
    .map((symbol) => symbol.getName())
    .sort();
}

function actualAgentExportSpecifiers() {
  const manifest = JSON.parse(fs.readFileSync(path.join(kernPackageRoot, 'package.json'), 'utf8'));
  const specifiers = [];
  for (const subpath of Object.keys(manifest.exports ?? {}).filter((key) =>
    key.startsWith('./agent/'),
  )) {
    if (!subpath.includes('*')) {
      specifiers.push(`${kernPackageName}${subpath.slice(1)}`);
      continue;
    }
    const directory = path.resolve(kernPackageRoot, path.dirname(subpath));
    const pattern = new RegExp(
      `^${path
        .basename(subpath)
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
        .replace('*', '[^/]+')}$`,
    );
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (entry.isFile() && pattern.test(entry.name)) {
        specifiers.push(`${kernPackageName}${path.dirname(subpath).slice(1)}/${entry.name}`);
      }
    }
  }
  return [...new Set(specifiers)].sort();
}

function migratedKernOwners(content) {
  const source = ts.createSourceFile(
    'migrated.ts',
    content,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const owners = new Map();
  for (const statement of source.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier) ||
      !statement.importClause?.namedBindings ||
      !ts.isNamedImports(statement.importClause.namedBindings)
    ) {
      continue;
    }
    for (const element of statement.importClause.namedBindings.elements) {
      owners.set(element.propertyName?.text ?? element.name.text, statement.moduleSpecifier.text);
    }
  }
  return owners;
}

async function runWithLogs(runner, schematic, options, tree) {
  const events = [];
  const subscription = runner.logger.subscribe((event) => events.push(event));
  try {
    const result = await runner.runSchematic(schematic, options, tree);
    return { result, events };
  } finally {
    subscription.unsubscribe();
  }
}

describe('KERN schematics', () => {
  it('adds the KERN bundle before application styles and stays idempotent', async () => {
    const runner = new SchematicTestRunner('@kern-ui/angular', collectionPath);
    const first = await runner.runSchematic('ng-add', { project: 'app' }, workspace());
    const second = await runner.runSchematic('ng-add', { project: 'app' }, first);

    assert.deepEqual(stylesFrom(second), [kernStyle, 'src/styles.css']);
  });

  it('configures an Nx project.json idempotently without discarding JSONC or Nx metadata', async () => {
    const runner = new SchematicTestRunner('@kern-ui/angular', collectionPath);
    const tree = addStandaloneApplication(nxWorkspace(), 'projects/app/src');
    const projectPath = '/projects/app/project.json';
    tree.overwrite(
      projectPath,
      tree
        .readText(projectPath)
        .replace('  "root": "projects/app",\n', '')
        .replace(
          '  "projectType": "application",',
          '  // This comment and the Nx-only fields must survive schematic writes.\n  "projectType": "application",',
        ),
    );

    const first = await runner.runSchematic('ng-add', { project: 'app', runtime: true }, tree);
    const second = await runner.runSchematic('ng-add', { project: 'app', runtime: true }, first);
    const projectSource = second.readText(projectPath);
    const project = nxProjectFrom(second);
    const appConfig = second.readText('/projects/app/src/app/app.config.ts');

    assert.match(projectSource, /This comment and the Nx-only fields must survive/);
    assert.deepEqual(project.tags, ['scope:application', 'type:application']);
    assert.deepEqual(project.cli, { cache: { enabled: false } });
    assert.ok(!('root' in project), 'the inferred Nx project root must remain implicit');
    assert.equal(project.targets.build.executor, '@angular/build:application');
    assert.deepEqual(project.targets.build.configurations, {
      production: { optimization: true },
    });
    assert.deepEqual(nxStylesFrom(second), [kernStyle, 'projects/app/src/styles.css']);
    assert.equal(count(appConfig, /provideKrn\(/g), 1);
  });

  it('recognizes an existing package import instead of adding duplicate CSS', async () => {
    const runner = new SchematicTestRunner('@kern-ui/angular', collectionPath);
    const tree = workspace();
    tree.create('/src/styles.css', "@import '@kern-ui/angular/styles/kern.css';\n");

    const result = await runner.runSchematic('ng-add', { project: 'app' }, tree);

    assert.deepEqual(stylesFrom(result), ['src/styles.css']);
  });

  it('configures style arrays that override the base build options', async () => {
    const runner = new SchematicTestRunner('@kern-ui/angular', collectionPath);
    const project = applicationProject();
    project.architect.build.configurations.production.styles = ['src/production.css'];

    const result = await runner.runSchematic(
      'ng-add',
      { project: 'app' },
      workspace({ app: project }),
    );
    const build = JSON.parse(result.readText('/angular.json')).projects.app.architect.build;

    assert.equal(build.options.styles[0], kernStyle);
    assert.deepEqual(build.configurations.production.styles, [kernStyle, 'src/production.css']);
  });

  it('requires an explicit application in multi-application workspaces', async () => {
    const runner = new SchematicTestRunner('@kern-ui/angular', collectionPath);
    const tree = workspace({
      admin: applicationProject(),
      portal: applicationProject(),
    });

    await assert.rejects(
      runner.runSchematic('ng-add', {}, tree),
      /multiple applications.*--project <name>/,
    );
  });

  it('doctor fixes every missing application without touching configured ones', async () => {
    const runner = new SchematicTestRunner('@kern-ui/angular', collectionPath);
    const tree = workspace({
      admin: applicationProject(),
      portal: applicationProject([kernStyle, 'portal.css']),
    });

    const result = await runner.runSchematic('doctor', { fix: true }, tree);

    assert.equal(stylesFrom(result, 'admin')[0], kernStyle);
    assert.deepEqual(stylesFrom(result, 'portal'), [kernStyle, 'portal.css']);
  });

  it('doctor discovers and safely fixes every Nx project.json application', async () => {
    const runner = new SchematicTestRunner('@kern-ui/angular', collectionPath);
    const tree = addCompatiblePackage(
      nxWorkspace({
        admin: nxApplicationProject('apps/admin'),
        portal: nxApplicationProject('apps/portal', [kernStyle, 'apps/portal/src/styles.css']),
      }),
    );

    const result = await runner.runSchematic('doctor', { fix: true }, tree);

    assert.deepEqual(nxStylesFrom(result, 'admin', 'apps/admin'), [
      kernStyle,
      'apps/admin/src/styles.css',
    ]);
    assert.deepEqual(nxStylesFrom(result, 'portal', 'apps/portal'), [
      kernStyle,
      'apps/portal/src/styles.css',
    ]);
    assert.equal(nxProjectFrom(result, 'admin', 'apps/admin').root, 'apps/admin');
    assert.equal(nxProjectFrom(result, 'portal', 'apps/portal').root, 'apps/portal');
  });

  it('doctor strict mode fails on missing styles without modifying the tree', async () => {
    const runner = new SchematicTestRunner('@kern-ui/angular', collectionPath);

    await assert.rejects(
      runner.runSchematic('doctor', { project: 'app', strict: true }, workspace()),
      /KERN workspace check failed.*missing styles: app/,
    );
  });

  it('normalizes duplicate and out-of-order direct style entries', async () => {
    const runner = new SchematicTestRunner('@kern-ui/angular', collectionPath);
    const tree = workspace({
      app: applicationProject(['src/styles.css', kernStyle, kernStyle]),
    });

    const result = await runner.runSchematic('ng-add', { project: 'app' }, tree);

    assert.deepEqual(stylesFrom(result), [kernStyle, 'src/styles.css']);
  });

  it('doctor safely removes duplicate package imports from secondary stylesheets', async () => {
    const runner = new SchematicTestRunner('@kern-ui/angular', collectionPath);
    const tree = workspace({
      app: applicationProject(['src/first.css', 'src/second.css']),
    });
    tree.create('/src/first.css', "@import '@kern-ui/angular/styles/kern.css';\n.first {}\n");
    tree.create('/src/second.css', "@import '@kern-ui/angular/styles/kern.css';\n.second {}\n");

    const result = await runner.runSchematic('doctor', { project: 'app', fix: true }, tree);

    assert.doesNotMatch(result.readText('/src/first.css'), /@kern-ui\/angular\/styles\/kern\.css/);
    assert.doesNotMatch(result.readText('/src/second.css'), /@kern-ui\/angular\/styles\/kern\.css/);
    assert.deepEqual(stylesFrom(result), [kernStyle, 'src/first.css', 'src/second.css']);
  });

  it('doctor moves a late stylesheet import to the canonical first global entry', async () => {
    const runner = new SchematicTestRunner('@kern-ui/angular', collectionPath);
    const tree = workspace({
      app: applicationProject(['src/base.css', 'src/theme.css']),
    });
    tree.create('/src/base.css', '.base {}\n');
    tree.create('/src/theme.css', "@import '@kern-ui/angular/styles/kern.css';\n.theme {}\n");

    const result = await runner.runSchematic('doctor', { project: 'app', fix: true }, tree);

    assert.deepEqual(stylesFrom(result), [kernStyle, 'src/base.css', 'src/theme.css']);
    assert.doesNotMatch(result.readText('/src/theme.css'), /@kern-ui\/angular\/styles\/kern\.css/);
  });

  it('configures runtime preferences and prepaint once', async () => {
    const runner = new SchematicTestRunner('@kern-ui/angular', collectionPath);
    const tree = addStandaloneApplication(workspace());
    const options = {
      project: 'app',
      runtime: true,
      prepaint: true,
      locale: 'de-DE',
      direction: 'ltr',
      theme: 'dark',
      density: 'compact',
      motion: 'reduce',
      brandColor: '#ef5a32',
      persistPreferences: true,
      preferenceStorageKey: 'acme-theme',
      overlayHost: '#app-overlays',
    };

    const first = await runner.runSchematic('ng-add', options, tree);
    const second = await runner.runSchematic('ng-add', options, first);
    const config = second.readText('/src/app/app.config.ts');
    const main = second.readText('/src/main.ts');

    assert.equal(count(config, /\bprovideKrn\s*\(/g), 1);
    assert.match(config, /from '@kern-ui\/angular\/core'/);
    assert.match(config, /locale: "de-DE"/);
    assert.match(config, /brandColor: "#ef5a32"/);
    assert.match(config, /overlayHost: "#app-overlays"/);
    assert.equal(count(main, /\bapplyKrnPrepaintTheme\s*\(/g), 1);
    assert.match(main, /persist: true/);
    assert.match(main, /storageKey: "acme-theme"/);
    assert.ok(main.indexOf('applyKrnPrepaintTheme(') < main.indexOf('bootstrapApplication('));
    assert.deepEqual(stylesFrom(second), [kernStyle, 'src/styles.css']);
    assertTypeScriptSyntax(config, 'app.config.ts');
    assertTypeScriptSyntax(main, 'main.ts');
  });

  it('merges existing literal runtime configuration without duplicate imports', async () => {
    const runner = new SchematicTestRunner('@kern-ui/angular', collectionPath);
    const tree = addStandaloneApplication(workspace());
    tree.overwrite(
      '/src/app/app.config.ts',
      `import { ApplicationConfig } from '@angular/core';
import { provideKrn } from '@kern-ui/angular';

export const appConfig: ApplicationConfig = {
  providers: [provideKrn({ theme: 'light' })],
};
`,
    );

    const result = await runner.runSchematic(
      'ng-add',
      { project: 'app', locale: 'fr-FR', theme: 'dark' },
      tree,
    );
    const config = result.readText('/src/app/app.config.ts');

    assert.equal(count(config, /\bprovideKrn\s*\(/g), 1);
    assert.equal(count(config, /import\s+\{[^}]*provideKrn[^}]*\}/g), 1);
    assert.match(config, /theme: "dark"/);
    assert.match(config, /locale: "fr-FR"/);
    assertTypeScriptSyntax(config, 'app.config.ts');
  });

  it('rejects unsafe non-literal provideKrn configuration instead of overwriting it', async () => {
    const runner = new SchematicTestRunner('@kern-ui/angular', collectionPath);
    const tree = addStandaloneApplication(workspace());
    tree.overwrite(
      '/src/app/app.config.ts',
      `import { ApplicationConfig } from '@angular/core';
import { provideKrn, type KrnConfig } from '@kern-ui/angular/core';

const kernConfig: KrnConfig = {};
export const appConfig: ApplicationConfig = {
  providers: [provideKrn(kernConfig)],
};
`,
    );

    await assert.rejects(
      runner.runSchematic('ng-add', { project: 'app', locale: 'fr-FR' }, tree),
      /Cannot safely merge KERN options/,
    );
  });

  it('emits a versioned machine-readable doctor report with stable codes', async () => {
    const runner = new SchematicTestRunner('@kern-ui/angular', collectionPath);
    const tree = addCompatiblePackage(
      addStandaloneApplication(
        workspace({
          app: applicationProject([
            'node_modules/@kern-ui/angular/styles/tokens.css',
            kernStyle,
            'src/styles.css',
          ]),
        }),
      ),
    );
    tree.overwrite(
      '/src/app/app.config.ts',
      `import { ApplicationConfig, LOCALE_ID } from '@angular/core';
import { provideKrn } from '@kern-ui/angular/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideKrn({ locale: 'de-DE', theme: 'dark', overlayHost: '#app-overlays' }),
    { provide: LOCALE_ID, useValue: 'fr-FR' },
  ],
};
`,
    );
    tree.overwrite(
      '/src/app/app.ts',
      `import { Component } from '@angular/core';
import { KrnButton } from '@kern-ui/angular';
import { Unsupported } from '@kern-ui/angular/kit/internal';

@Component({
  selector: 'app-root',
  imports: [KrnButton],
  templateUrl: './app.html',
})
export class App {
  protected readonly unsupported = Unsupported;
}
`,
    );
    tree.overwrite(
      '/src/app/app.html',
      `<krn-select ariaLabel="Plan" />
<krn-data-grid [pagination]="false" [data]="[]" [columns]="[]" [rowIdentity]="$any(null)" />
`,
    );

    const { events } = await runWithLogs(runner, 'doctor', { project: 'app', json: true }, tree);
    const report = JSON.parse(events.find((event) => event.message.startsWith('{')).message);
    const codes = new Set(report.diagnostics.map((item) => item.code));

    assert.equal(report.schemaVersion, 1);
    assert.equal(report.tool, '@kern-ui/angular:doctor');
    for (const code of [
      'KRN-DX-003',
      'KRN-DX-004',
      'KRN-DX-020',
      'KRN-DX-021',
      'KRN-DX-030',
      'KRN-DX-042',
      'KRN-DX-044',
      'KRN-DX-045',
      'KRN-DX-046',
    ]) {
      assert.ok(codes.has(code), `Expected ${code} in ${[...codes].join(', ')}`);
    }
  });

  it('doctor fix changes only safe styles and preserves source diagnostics', async () => {
    const runner = new SchematicTestRunner('@kern-ui/angular', collectionPath);
    const tree = addCompatiblePackage(
      addStandaloneApplication(
        workspace({
          app: applicationProject(['src/styles.css', kernStyle, kernStyle]),
        }),
      ),
    );
    tree.overwrite(
      '/src/app/app.ts',
      `import { Component } from '@angular/core';
import { KrnButton } from '@kern-ui/angular';

@Component({
  selector: 'app-root',
  imports: [KrnButton],
  template: '<krn-data-grid pagination />',
})
export class App {}
`,
    );
    const originalSource = tree.readText('/src/app/app.ts');

    const { result, events } = await runWithLogs(
      runner,
      'doctor',
      { project: 'app', fix: true, json: true },
      tree,
    );
    const report = JSON.parse(events.find((event) => event.message.startsWith('{')).message);

    assert.deepEqual(stylesFrom(result), [kernStyle, 'src/styles.css']);
    assert.equal(result.readText('/src/app/app.ts'), originalSource);
    assert.ok(report.fixed.some((item) => item.code === 'KRN-DX-002'));
    assert.ok(report.fixed.some((item) => item.code === 'KRN-DX-003'));
    assert.ok(report.diagnostics.some((item) => item.code === 'KRN-DX-020'));
    assert.ok(report.diagnostics.some((item) => item.code === 'KRN-DX-030'));
  });

  it('doctor strict mode permits informational zero-config runtime guidance', async () => {
    const runner = new SchematicTestRunner('@kern-ui/angular', collectionPath);
    const tree = addCompatiblePackage(
      addStandaloneApplication(
        workspace({ app: applicationProject([kernStyle, 'src/styles.css']) }),
      ),
    );
    tree.overwrite(
      '/src/app/app.ts',
      `import { Component } from '@angular/core';
import { KrnButton } from '@kern-ui/angular/kit';

@Component({ selector: 'app-root', imports: [KrnButton], template: '' })
export class App {}
`,
    );

    const result = await runner.runSchematic('doctor', { project: 'app', strict: true }, tree);

    assert.ok(result.exists('/src/app/app.ts'));
  });

  it('doctor resolves aliased KERN runtime and prepaint imports', async () => {
    const runner = new SchematicTestRunner('@kern-ui/angular', collectionPath);
    const tree = addCompatiblePackage(
      addStandaloneApplication(
        workspace({ app: applicationProject([kernStyle, 'src/styles.css']) }),
      ),
    );
    tree.overwrite(
      '/src/app/app.config.ts',
      `import { ApplicationConfig } from '@angular/core';
import {
  applyKrnPrepaintTheme as applyDesignSystemTheme,
  provideKrn as provideDesignSystem,
} from '@kern-ui/angular/core';

applyDesignSystemTheme();
export const appConfig: ApplicationConfig = {
  providers: [provideDesignSystem({ theme: 'dark' })],
};
`,
    );

    const { events } = await runWithLogs(runner, 'doctor', { project: 'app', json: true }, tree);
    const report = JSON.parse(events.find((event) => event.message.startsWith('{')).message);
    const codes = new Set(report.diagnostics.map((item) => item.code));

    assert.ok(!codes.has('KRN-DX-040'));
    assert.ok(!codes.has('KRN-DX-042'));
    assert.ok(!codes.has('KRN-DX-049'));
  });

  it('doctor reports duplicate and dynamically unverifiable runtime configuration', async () => {
    const runner = new SchematicTestRunner('@kern-ui/angular', collectionPath);
    const tree = addCompatiblePackage(
      addStandaloneApplication(
        workspace({ app: applicationProject([kernStyle, 'src/styles.css']) }),
      ),
    );
    tree.overwrite(
      '/src/app/app.config.ts',
      `import { ApplicationConfig } from '@angular/core';
import { provideKrn as provideDesignSystem } from '@kern-ui/angular/core';

declare function runtimeConfig(): object;
const wrappedProvider = provideDesignSystem;
export const appConfig: ApplicationConfig = {
  providers: [
    provideDesignSystem(runtimeConfig()),
    provideDesignSystem(),
    wrappedProvider(),
  ],
};
`,
    );

    const { events } = await runWithLogs(runner, 'doctor', { project: 'app', json: true }, tree);
    const report = JSON.parse(events.find((event) => event.message.startsWith('{')).message);
    const codes = new Set(report.diagnostics.map((item) => item.code));

    assert.ok(codes.has('KRN-DX-048'));
    assert.ok(codes.has('KRN-DX-049'));
    assert.equal(report.diagnostics.find((item) => item.code === 'KRN-DX-048')?.count, 2);
  });

  it('reports SSR-specific runtime and prepaint placement problems', async () => {
    const runner = new SchematicTestRunner('@kern-ui/angular', collectionPath);
    const project = applicationProject([kernStyle, 'src/styles.css']);
    project.architect.build.options.ssr = true;
    const tree = addCompatiblePackage(addStandaloneApplication(workspace({ app: project })));
    tree.overwrite(
      '/src/main.ts',
      `import { bootstrapApplication } from '@angular/platform-browser';
import { applyKrnPrepaintTheme } from '@kern-ui/angular/core';
import { App } from './app/app';

bootstrapApplication(App);
applyKrnPrepaintTheme();
`,
    );
    tree.overwrite(
      '/src/app/app.config.ts',
      `import { ApplicationConfig } from '@angular/core';
import { applyKrnPrepaintTheme } from '@kern-ui/angular/core';

applyKrnPrepaintTheme();
export const appConfig: ApplicationConfig = { providers: [] };
`,
    );

    const { events } = await runWithLogs(runner, 'doctor', { project: 'app', json: true }, tree);
    const report = JSON.parse(events.find((event) => event.message.startsWith('{')).message);
    const codes = new Set(report.diagnostics.map((item) => item.code));

    assert.ok(codes.has('KRN-DX-041'));
    assert.ok(codes.has('KRN-DX-043'));
    assert.ok(codes.has('KRN-DX-047'));
  });

  it('recognizes an existing attribute-selector overlay host', async () => {
    const runner = new SchematicTestRunner('@kern-ui/angular', collectionPath);
    const tree = addCompatiblePackage(
      addStandaloneApplication(
        workspace({ app: applicationProject([kernStyle, 'src/styles.css']) }),
      ),
    );
    tree.overwrite(
      '/src/app/app.config.ts',
      `import { ApplicationConfig } from '@angular/core';
import { provideKrn } from '@kern-ui/angular/core';

export const appConfig: ApplicationConfig = {
  providers: [provideKrn({ overlayHost: '[data-app-overlays]' })],
};
`,
    );
    tree.overwrite(
      '/src/app/app.html',
      `<krn-select ariaLabel="Plan" />
<div data-app-overlays></div>
`,
    );

    const { events } = await runWithLogs(runner, 'doctor', { project: 'app', json: true }, tree);
    const report = JSON.parse(events.find((event) => event.message.startsWith('{')).message);

    assert.ok(!report.diagnostics.some((item) => item.code === 'KRN-DX-044'));
  });

  it('detects missing and incompatible peer packages', async () => {
    const runner = new SchematicTestRunner('@kern-ui/angular', collectionPath);
    const tree = addStandaloneApplication(
      workspace({ app: applicationProject([kernStyle, 'src/styles.css']) }),
    );
    tree.create(
      '/package.json',
      JSON.stringify({
        dependencies: {
          '@angular/compiler': '21.0.0',
          '@angular/core': '21.0.0',
          '@angular/common': '22.0.0',
          '@angular/forms': '22.0.0',
          '@angular/cdk': '22.0.0',
          rxjs: '7.3.0',
          typescript: '5.9.0',
        },
      }),
    );

    const { events } = await runWithLogs(runner, 'doctor', { project: 'app', json: true }, tree);
    const report = JSON.parse(events.find((event) => event.message.startsWith('{')).message);

    assert.ok(report.diagnostics.some((item) => item.code === 'KRN-DX-010'));
    const incompatiblePeers = new Set(
      report.diagnostics.filter((item) => item.code === 'KRN-DX-011').map((item) => item.package),
    );
    assert.ok(incompatiblePeers.has('@angular/compiler'));
    assert.ok(incompatiblePeers.has('@angular/core'));
    assert.ok(incompatiblePeers.has('rxjs'));
    assert.ok(incompatiblePeers.has('typescript'));
  });

  it('accepts every real package-exported agent asset and rejects unknown deep imports', async () => {
    const runner = new SchematicTestRunner('@kern-ui/angular', collectionPath);
    const tree = addCompatiblePackage(
      addStandaloneApplication(
        workspace({ app: applicationProject([kernStyle, 'src/styles.css']) }),
      ),
    );
    const exportedSpecifiers = actualAgentExportSpecifiers();
    assert.ok(exportedSpecifiers.includes('@kern-ui/angular/agent/examples/index.json'));
    assert.ok(exportedSpecifiers.includes('@kern-ui/angular/agent/examples/button.ts'));
    assert.ok(exportedSpecifiers.includes('@kern-ui/angular/agent/root-export-map.json'));
    tree.overwrite(
      '/src/app/app.ts',
      [
        ...exportedSpecifiers.map((specifier) => `import '${specifier}';`),
        "import '@kern-ui/angular/agent/examples/missing.ts';",
        "import '@kern-ui/angular/agent/examples/nested/button.ts';",
        "import '@kern-ui/angular/kit/internal';",
        '',
      ].join('\n'),
    );

    const { events } = await runWithLogs(runner, 'doctor', { project: 'app', json: true }, tree);
    const report = JSON.parse(events.find((event) => event.message.startsWith('{')).message);
    const rejectedImports = report.diagnostics
      .filter((item) => item.code === 'KRN-DX-021')
      .map((item) => item.import)
      .sort();

    assert.deepEqual(rejectedImports, [
      '@kern-ui/angular/agent/examples/missing.ts',
      '@kern-ui/angular/agent/examples/nested/button.ts',
      '@kern-ui/angular/kit/internal',
    ]);
  });

  it('generates a strictly typed standalone form with canonical imports', async () => {
    const runner = new SchematicTestRunner('@kern-ui/angular', collectionPath);
    const result = await runner.runSchematic(
      'typed-form',
      { project: 'app', name: 'account-profile' },
      workspace(),
    );
    const file = '/src/app/account-profile/account-profile.component.ts';
    const source = result.readText(file);

    assert.match(source, /FormGroup/);
    assert.match(source, /nonNullable: true/);
    assert.match(source, /output<AccountProfileFormValue>/);
    assert.match(source, /from '@kern-ui\/angular\/kit'/);
    assert.doesNotMatch(source, /from '@kern-ui\/angular';/);
    assertTypeScriptSyntax(source, file);
  });

  it('runs every enterprise generator against an Nx project source root', async () => {
    const runner = new SchematicTestRunner('@kern-ui/angular', collectionPath);
    let tree = nxWorkspace();
    for (const [schematic, name] of [
      ['typed-form', 'profile'],
      ['data-grid', 'accounts'],
      ['crud', 'customers'],
    ]) {
      tree = await runner.runSchematic(schematic, { project: 'app', name }, tree);
    }

    for (const feature of ['profile', 'accounts', 'customers']) {
      const file = `/projects/app/src/app/${feature}/${feature}.component.ts`;
      assert.ok(tree.exists(file), `${feature} must be generated inside the Nx application`);
      assertTypeScriptSyntax(tree.readText(file), file);
    }
  });

  it('generates explicit client, controlled, and virtual data-grid modes', async () => {
    const runner = new SchematicTestRunner('@kern-ui/angular', collectionPath);
    let tree = workspace();
    tree = await runner.runSchematic(
      'data-grid',
      { project: 'app', name: 'client-grid', mode: 'client' },
      tree,
    );
    tree = await runner.runSchematic(
      'data-grid',
      { project: 'app', name: 'server-grid', mode: 'controlled' },
      tree,
    );
    tree = await runner.runSchematic(
      'data-grid',
      { project: 'app', name: 'virtual-grid', mode: 'virtual' },
      tree,
    );
    const client = tree.readText('/src/app/client-grid/client-grid.component.ts');
    const controlled = tree.readText('/src/app/server-grid/server-grid.component.ts');
    const virtual = tree.readText('/src/app/virtual-grid/virtual-grid.component.ts');
    const controlledTemplate = tree.readText('/src/app/server-grid/server-grid.component.html');

    assert.match(client, /kind: 'client', pagination: true/);
    assert.match(controlled, /computed<KrnDataGridMode>/);
    assert.match(controlled, /totalRows: this\.totalRows\(\)/);
    assert.match(virtual, /kind: 'virtual'/);
    assert.match(controlledTemplate, /\[mode\]="mode\(\)"/);
    for (const [name, source] of [
      ['client-grid.ts', client],
      ['server-grid.ts', controlled],
      ['virtual-grid.ts', virtual],
    ]) {
      assert.match(source, /from '@kern-ui\/angular\/addon-grid'/);
      assertTypeScriptSyntax(source, name);
    }
  });

  it('generates a CRUD master-detail feature without browser-only ambient APIs', async () => {
    const runner = new SchematicTestRunner('@kern-ui/angular', collectionPath);
    const result = await runner.runSchematic(
      'crud',
      { project: 'app', name: 'customers' },
      workspace(),
    );
    const file = '/src/app/customers/customers.component.ts';
    const source = result.readText(file);
    const template = result.readText('/src/app/customers/customers.component.html');

    assert.match(source, /KrnMasterDetailLayout.*@kern-ui\/angular\/patterns/);
    assert.match(source, /record-\$\{\+\+this\.nextId\}/);
    assert.doesNotMatch(source, /crypto\.|window\.|document\./);
    assert.match(template, /\[detailOpen\]="detailOpen\(\)"/);
    assert.match(template, /\(detailOpenChange\)="detailOpen\.set\(\$event\)"/);
    assert.match(template, /\[mode\]="\{ kind: 'client', pagination: true \}"/);
    assertTypeScriptSyntax(source, file);
  });

  it('refuses accidental generator overwrites unless force is explicit', async () => {
    const runner = new SchematicTestRunner('@kern-ui/angular', collectionPath);
    const first = await runner.runSchematic(
      'typed-form',
      { project: 'app', name: 'profile' },
      workspace(),
    );

    await assert.rejects(
      runner.runSchematic('typed-form', { project: 'app', name: 'profile' }, first),
      /Refusing to overwrite/,
    );
    const forced = await runner.runSchematic(
      'typed-form',
      { project: 'app', name: 'profile', force: true },
      first,
    );
    assert.ok(forced.exists('/src/app/profile/profile.component.ts'));
  });

  it('runs the 1.0 migration against compiler-visible files in an Nx application', async () => {
    const runner = new SchematicTestRunner('@kern-ui/angular', collectionPath);
    const tree = addStandaloneApplication(nxWorkspace(), 'projects/app/src');
    tree.overwrite(
      '/projects/app/src/app/app.ts',
      `import { KrnButton, KrnDataGrid } from '@kern-ui/angular';

export const imports = [KrnButton, KrnDataGrid];
`,
    );
    tree.overwrite('/projects/app/src/app/app.html', '<krn-data-grid [pagination]="false" />\n');

    const first = await runner.runSchematic('ng-update', { project: 'app' }, tree);
    const second = await runner.runSchematic('ng-update', { project: 'app' }, first);
    const source = first.readText('/projects/app/src/app/app.ts');
    const template = first.readText('/projects/app/src/app/app.html');

    assert.match(source, /from '@kern-ui\/angular\/addon-grid'/);
    assert.match(source, /from '@kern-ui\/angular\/kit'/);
    assert.doesNotMatch(source, /from '@kern-ui\/angular';/);
    assert.match(template, /\[mode\]="\{ kind: 'client', pagination: false \}"/);
    assert.equal(second.readText('/projects/app/src/app/app.ts'), source);
    assert.equal(second.readText('/projects/app/src/app/app.html'), template);
  });

  it('migrates canonical imports and safe deprecated grid inputs idempotently', async () => {
    const runner = new SchematicTestRunner('@kern-ui/angular', collectionPath);
    const tree = addStandaloneApplication(workspace());
    tree.overwrite(
      '/src/app/app.ts',
      `import { Component } from '@angular/core';
import {
  KrnButton,
  KrnDataGrid,
  type KrnDataGridMode,
  KrnMasterDetailLayout,
  provideKrn,
} from '@kern-ui/angular';

@Component({
  selector: 'app-root',
  imports: [KrnButton, KrnDataGrid, KrnMasterDetailLayout],
  templateUrl: './app.html',
})
export class App {
  protected readonly mode: KrnDataGridMode = { kind: 'client' };
  protected readonly providers = [provideKrn()];
}
`,
    );
    tree.overwrite(
      '/src/app/app.html',
      `<krn-data-grid [pagination]="false" />
<krn-data-table virtualize />
<krn-menu hasProjectedTrigger />
`,
    );

    const first = await runner.runSchematic('ng-update', { project: 'app' }, tree);
    const firstSource = first.readText('/src/app/app.ts');
    const firstTemplate = first.readText('/src/app/app.html');
    const second = await runner.runSchematic('ng-update', { project: 'app' }, first);

    assert.doesNotMatch(firstSource, /from '@kern-ui\/angular';/);
    assert.match(firstSource, /from '@kern-ui\/angular\/addon-grid'/);
    assert.match(firstSource, /from '@kern-ui\/angular\/core'/);
    assert.match(firstSource, /from '@kern-ui\/angular\/kit'/);
    assert.match(firstSource, /from '@kern-ui\/angular\/patterns'/);
    assert.match(firstTemplate, /\[mode\]="\{ kind: 'client', pagination: false \}"/);
    assert.match(firstTemplate, /\[mode\]="\{ kind: 'virtual' \}"/);
    assert.match(firstTemplate, /hasProjectedTrigger/);
    assert.equal(second.readText('/src/app/app.ts'), firstSource);
    assert.equal(second.readText('/src/app/app.html'), firstTemplate);
    assertTypeScriptSyntax(firstSource, 'app.ts');
  });

  it('migrates every compiler-visible root export to its generated owner idempotently', async () => {
    const runner = new SchematicTestRunner('@kern-ui/angular', collectionPath);
    const ownership = JSON.parse(fs.readFileSync(kernRootExportMap, 'utf8'));
    const exportedNames = compilerRootExports();

    assert.equal(ownership.schemaVersion, '1.0.0');
    assert.equal(ownership.package, kernPackageName);
    assert.deepEqual(Object.keys(ownership.exports).sort(), exportedNames);
    assert.deepEqual(
      [...new Set(Object.values(ownership.exports))].sort(),
      [...ownership.entrypoints].sort(),
    );
    assert.ok(!ownership.entrypoints.includes('@kern-ui/angular/testing'));
    for (const required of [
      'KrnLocaleConfig',
      'KrnLocalePack',
      'KrnChartDatum',
      'KrnChartLabels',
      'KrnChartType',
      'KrnChartValueFormatter',
      'KrnDataColumnPin',
    ]) {
      assert.ok(exportedNames.includes(required), `${required} must be covered by the migration`);
    }

    const tree = addStandaloneApplication(workspace());
    tree.overwrite(
      '/src/app/app.ts',
      `import { ${exportedNames.join(', ')} } from '${kernPackageName}';\n`,
    );

    const first = await runner.runSchematic('ng-update', { project: 'app' }, tree);
    const firstSource = first.readText('/src/app/app.ts');
    const migratedOwners = migratedKernOwners(firstSource);
    const second = await runner.runSchematic('ng-update', { project: 'app' }, first);

    assert.doesNotMatch(firstSource, /from '@kern-ui\/angular';/);
    assert.equal(migratedOwners.size, exportedNames.length);
    for (const name of exportedNames) {
      assert.equal(
        migratedOwners.get(name),
        ownership.exports[name],
        `${name} must migrate to its compiler-generated owner`,
      );
    }
    assert.equal(second.readText('/src/app/app.ts'), firstSource);
    assertTypeScriptSyntax(firstSource, 'all-root-exports.ts');
  });

  it('exposes the versioned migration through the Angular migration collection', async () => {
    const runner = new SchematicTestRunner('@kern-ui/angular', migrationPath);
    const tree = addStandaloneApplication(workspace());
    tree.overwrite(
      '/src/app/app.ts',
      `import { KrnButton } from '@kern-ui/angular';

export const imports = [KrnButton];
`,
    );

    const result = await runner.runSchematic('migration-v1', {}, tree);

    assert.match(result.readText('/src/app/app.ts'), /from '@kern-ui\/angular\/kit'/);
  });
});
