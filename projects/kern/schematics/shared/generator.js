'use strict';

const { SchematicsException } = require('@angular-devkit/schematics');
const {
  getWorkspace,
  normalizedPath,
  projectSourceRoot,
  resolveInstallProject,
} = require('./workspace');

function dasherize(value) {
  return value
    .trim()
    .replaceAll('\\', '/')
    .split('/')
    .filter(Boolean)
    .at(-1)
    .replace(/([a-z\d])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z\d]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function classify(value) {
  return value
    .split('-')
    .filter(Boolean)
    .map((part) => `${part[0].toUpperCase()}${part.slice(1)}`)
    .join('');
}

function validateName(value) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new SchematicsException('A non-empty schematic name is required.');
  }
  if (value.split(/[\\/]/).some((segment) => segment === '..' || segment === '.')) {
    throw new SchematicsException('Schematic names cannot contain "." or ".." path segments.');
  }
  const fileName = dasherize(value);
  if (!fileName) {
    throw new SchematicsException(`Could not derive a safe file name from "${value}".`);
  }
  return fileName;
}

function validatePath(value) {
  const path = normalizedPath(String(value)).replace(/^\/+|\/+$/g, '');
  if (!path || path.split('/').some((segment) => segment === '..' || segment === '.')) {
    throw new SchematicsException(`Unsafe schematic output path "${value}".`);
  }
  return path;
}

async function generationContext(tree, options) {
  const workspace = await getWorkspace(tree);
  const projectName = resolveInstallProject(workspace, options.project);
  const project = workspace.projects.get(projectName);
  const fileName = validateName(options.name);
  const className = classify(fileName);
  const sourceRoot = projectSourceRoot(project);
  const requestedPath = options.path
    ? validatePath(options.path)
    : `${sourceRoot.replace(/\/+$/, '')}/app`;
  const directory = options.flat ? requestedPath : `${requestedPath}/${fileName}`;
  return {
    projectName,
    project,
    fileName,
    className,
    selector: `${options.prefix ?? 'app'}-${fileName}`,
    directory: `/${directory.replace(/^\/+/, '')}`,
  };
}

function writeFile(tree, path, content, force = false) {
  if (tree.exists(path)) {
    if (!force) {
      throw new SchematicsException(
        `Refusing to overwrite "${path}". Re-run with --force only after reviewing the target.`,
      );
    }
    tree.overwrite(path, content);
  } else {
    tree.create(path, content);
  }
}

function writeComponentFiles(tree, context, files, force = false) {
  for (const [suffix, content] of Object.entries(files)) {
    writeFile(tree, `${context.directory}/${context.fileName}.component.${suffix}`, content, force);
  }
}

module.exports = {
  classify,
  dasherize,
  generationContext,
  writeComponentFiles,
  writeFile,
};
