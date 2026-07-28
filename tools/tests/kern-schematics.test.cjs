'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const { describe, it } = require('node:test');
const { HostTree } = require('@angular-devkit/schematics');
const { SchematicTestRunner } = require('@angular-devkit/schematics/testing');

const collectionPath = path.resolve(__dirname, '../../projects/kern/schematics/collection.json');

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

function stylesFrom(tree, projectName = 'app') {
  return JSON.parse(tree.readText('/angular.json')).projects[projectName].architect.build.options
    .styles;
}

describe('KERN schematics', () => {
  it('adds the KERN bundle before application styles and stays idempotent', async () => {
    const runner = new SchematicTestRunner('@kern-ui/angular', collectionPath);
    const first = await runner.runSchematic('ng-add', { project: 'app' }, workspace());
    const second = await runner.runSchematic('ng-add', { project: 'app' }, first);

    assert.deepEqual(stylesFrom(second), [
      'node_modules/@kern-ui/angular/styles/kern.css',
      'src/styles.css',
    ]);
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

    assert.equal(build.options.styles[0], 'node_modules/@kern-ui/angular/styles/kern.css');
    assert.deepEqual(build.configurations.production.styles, [
      'node_modules/@kern-ui/angular/styles/kern.css',
      'src/production.css',
    ]);
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
      portal: applicationProject(['node_modules/@kern-ui/angular/styles/kern.css', 'portal.css']),
    });

    const result = await runner.runSchematic('doctor', { fix: true }, tree);

    assert.equal(stylesFrom(result, 'admin')[0], 'node_modules/@kern-ui/angular/styles/kern.css');
    assert.deepEqual(stylesFrom(result, 'portal'), [
      'node_modules/@kern-ui/angular/styles/kern.css',
      'portal.css',
    ]);
  });

  it('doctor strict mode fails on missing styles without modifying the tree', async () => {
    const runner = new SchematicTestRunner('@kern-ui/angular', collectionPath);

    await assert.rejects(
      runner.runSchematic('doctor', { project: 'app', strict: true }, workspace()),
      /KERN workspace check failed.*missing styles: app/,
    );
  });
});
