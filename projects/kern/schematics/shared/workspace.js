'use strict';

const { SchematicsException } = require('@angular-devkit/schematics');
const { getWorkspace, writeWorkspace } = require('@schematics/angular/utility/workspace');

const KERN_STYLE = 'node_modules/@kern-ui/angular/styles/kern.css';
const KERN_STYLE_SPECIFIER = '@kern-ui/angular/styles/kern.css';
const KERN_PARTIAL_STYLE_PREFIX = '@kern-ui/angular/styles/';
const KERN_CSS_IMPORT = new RegExp(
  String.raw`@import\s+(?:url\(\s*)?["']${KERN_STYLE_SPECIFIER.replaceAll('/', String.raw`\/`)}["']\s*\)?\s*;`,
  'g',
);
const KERN_PARTIAL_CSS_IMPORT =
  /@import\s+(?:url\(\s*)?["']@kern-ui\/angular\/styles\/([^"']+)["']/g;

function isApplication(project) {
  return project.extensions['projectType'] === 'application';
}

function applicationNames(workspace) {
  return [...workspace.projects]
    .filter(([, project]) => isApplication(project))
    .map(([name]) => name)
    .sort();
}

function resolveInstallProject(workspace, requestedProject) {
  if (requestedProject) {
    const project = workspace.projects.get(requestedProject);
    if (!project) {
      throw new SchematicsException(
        `Project "${requestedProject}" does not exist. Available applications: ${applicationNames(workspace).join(', ') || 'none'}.`,
      );
    }
    if (!isApplication(project)) {
      throw new SchematicsException(
        `Project "${requestedProject}" is not an application. KERN must be configured on an application build target.`,
      );
    }
    return requestedProject;
  }

  const applications = applicationNames(workspace);
  if (applications.length === 1) {
    return applications[0];
  }
  if (applications.length === 0) {
    throw new SchematicsException('No Angular application project was found in this workspace.');
  }

  throw new SchematicsException(
    `This workspace contains multiple applications (${applications.join(', ')}). Re-run with --project <name> to avoid changing the wrong application.`,
  );
}

function resolveDoctorProjects(workspace, requestedProject) {
  if (requestedProject) {
    return [resolveInstallProject(workspace, requestedProject)];
  }

  const applications = applicationNames(workspace);
  if (applications.length === 0) {
    throw new SchematicsException('No Angular application project was found in this workspace.');
  }
  return applications;
}

function stylePath(entry) {
  if (typeof entry === 'string') {
    return entry;
  }
  if (entry && typeof entry === 'object' && typeof entry.input === 'string') {
    return entry.input;
  }
  return null;
}

function normalizedPath(value) {
  return value.replaceAll('\\', '/').replace(/^\.\//, '');
}

function treePath(value) {
  const normalized = normalizedPath(value);
  return normalized.startsWith('/') ? normalized : `/${normalized}`;
}

function isKernStylePath(value) {
  const path = normalizedPath(value);
  return (
    path === KERN_STYLE ||
    path === KERN_STYLE_SPECIFIER ||
    path.endsWith(`/node_modules/${KERN_STYLE_SPECIFIER}`)
  );
}

function isKernPartialStylePath(value) {
  const path = normalizedPath(value);
  return path.includes(KERN_PARTIAL_STYLE_PREFIX) && !isKernStylePath(path);
}

function optionsStyleArrays(target) {
  const arrays = [];
  const baseStyles = target.options?.styles;
  if (Array.isArray(baseStyles)) {
    arrays.push({ configuration: 'default', styles: baseStyles });
  }

  for (const [name, configuration] of Object.entries(target.configurations ?? {})) {
    if (configuration && Array.isArray(configuration.styles)) {
      arrays.push({ configuration: name, styles: configuration.styles });
    }
  }
  return arrays;
}

function effectiveStyleArrays(target) {
  const baseStyles = Array.isArray(target.options?.styles) ? target.options.styles : [];
  const arrays = [{ configuration: 'default', styles: baseStyles }];

  for (const [name, configuration] of Object.entries(target.configurations ?? {})) {
    if (configuration && Array.isArray(configuration.styles)) {
      arrays.push({ configuration: name, styles: configuration.styles });
    }
  }
  return arrays;
}

function stylesheetKernState(tree, path) {
  const filePath = treePath(path);
  if (!tree.exists(filePath)) {
    return { count: 0, ordered: true, partials: [] };
  }

  const content = tree.readText(filePath);
  const imports = [...content.matchAll(KERN_CSS_IMPORT)];
  const partials = [...content.matchAll(KERN_PARTIAL_CSS_IMPORT)]
    .map((match) => match[1])
    .filter((name) => name !== 'kern.css');
  if (imports.length === 0) {
    return { count: 0, ordered: true, partials };
  }

  const before = content
    .slice(0, imports[0].index)
    .replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '')
    .trim();
  return {
    count: imports.length,
    ordered: before === '' || /^@charset\s+[^;]+;\s*$/i.test(before),
    partials,
  };
}

function inspectStyleArray(tree, configuration, styles) {
  let directCount = 0;
  let importedCount = 0;
  let firstKernIndex = -1;
  let firstApplicationStyle = -1;
  const partials = [];
  const importedFiles = [];

  styles.forEach((entry, index) => {
    const path = stylePath(entry);
    if (path === null) {
      return;
    }
    if (isKernStylePath(path)) {
      directCount += 1;
      firstKernIndex = firstKernIndex === -1 ? index : firstKernIndex;
      return;
    }
    if (isKernPartialStylePath(path)) {
      partials.push(path);
    }
    const state = stylesheetKernState(tree, path);
    if (state.count > 0) {
      importedCount += state.count;
      firstKernIndex = firstKernIndex === -1 ? index : firstKernIndex;
      importedFiles.push({ path, ...state });
    } else if (firstApplicationStyle === -1) {
      firstApplicationStyle = index;
    }
    partials.push(...state.partials.map((name) => `${path} -> ${name}`));
  });

  const count = directCount + importedCount;
  const sourceOrdered =
    firstKernIndex === -1 || firstApplicationStyle === -1 || firstKernIndex < firstApplicationStyle;
  const importOrdered = importedFiles.every((file) => file.ordered);

  return {
    configuration,
    configured: count > 0,
    count,
    duplicates: Math.max(0, count - 1),
    ordered: sourceOrdered && importOrdered,
    partials,
    importedFiles,
  };
}

function inspectProject(tree, project) {
  const target = project.targets.get('build');
  if (!target) {
    return {
      configured: false,
      duplicates: 0,
      orderIssues: [],
      partials: [],
      arrays: [],
      reason: 'has no build target',
    };
  }

  const arrays = effectiveStyleArrays(target).map(({ configuration, styles }) =>
    inspectStyleArray(tree, configuration, styles),
  );
  const missing = arrays.filter((state) => !state.configured);
  const duplicates = arrays.reduce((count, state) => count + state.duplicates, 0);
  const orderIssues = arrays.filter((state) => state.configured && !state.ordered);
  const partials = [...new Set(arrays.flatMap((state) => state.partials))];
  const configured = missing.length === 0;

  return {
    configured,
    duplicates,
    orderIssues,
    partials,
    arrays,
    reason: configured
      ? null
      : `does not load ${KERN_STYLE_SPECIFIER} in ${missing
          .map((state) => state.configuration)
          .join(', ')}`,
  };
}

function normalizeStylesheetImport(tree, path) {
  const filePath = treePath(path);
  if (!tree.exists(filePath)) {
    return;
  }
  const content = tree.readText(filePath);
  const matches = [...content.matchAll(KERN_CSS_IMPORT)];
  if (matches.length === 0) {
    return;
  }

  let next = content.replace(KERN_CSS_IMPORT, '');
  const charset = next.match(/^\s*@charset\s+[^;]+;\s*/i);
  const insertion = charset?.[0].length ?? 0;
  const prefix = next.slice(0, insertion);
  const suffix = next.slice(insertion).replace(/^\s+/, '');
  next = `${prefix}@import '${KERN_STYLE_SPECIFIER}';\n${suffix}`;
  if (next !== content) {
    tree.overwrite(filePath, next);
  }
}

function removeStylesheetImport(tree, path) {
  const filePath = treePath(path);
  if (!tree.exists(filePath)) {
    return;
  }
  const content = tree.readText(filePath);
  const next = content.replace(KERN_CSS_IMPORT, '').replace(/^\s*\n/, '');
  if (next !== content) {
    tree.overwrite(filePath, next);
  }
}

function normalizeStyleArray(tree, styles) {
  const sources = [];

  styles.forEach((entry, index) => {
    const path = stylePath(entry);
    if (path === null) {
      return;
    }
    if (isKernStylePath(path)) {
      sources.push({ kind: 'direct', index, path });
      return;
    }
    const state = stylesheetKernState(tree, path);
    if (state.count > 0) {
      sources.push({ kind: 'import', index, path, state });
    }
  });

  const importedSources = sources.filter((source) => source.kind === 'import');
  const firstSource = sources.sort((left, right) => left.index - right.index)[0];
  const keepImportedSource =
    firstSource?.kind === 'import' &&
    firstSource.index === 0 &&
    importedSources.length === 1 &&
    firstSource.state.ordered &&
    firstSource.state.count === 1;
  const keptPath = keepImportedSource ? firstSource.path : null;

  for (const path of [...new Set(importedSources.map((source) => source.path))]) {
    if (path === keptPath) {
      normalizeStylesheetImport(tree, path);
    } else {
      removeStylesheetImport(tree, path);
    }
  }

  const retained = styles.filter((entry) => {
    const path = stylePath(entry);
    return path === null || !isKernStylePath(path);
  });
  styles.splice(0, styles.length, ...retained);

  if (!keepImportedSource) {
    styles.unshift(KERN_STYLE);
  }
}

function addKernStyles(tree, project) {
  const target = project.targets.get('build');
  if (!target) {
    throw new SchematicsException(
      `The selected application has no build target. Configure ${KERN_STYLE_SPECIFIER} manually.`,
    );
  }

  target.options ??= {};
  if (!Array.isArray(target.options.styles)) {
    target.options.styles = [];
  }

  for (const { styles } of optionsStyleArrays(target)) {
    normalizeStyleArray(tree, styles);
  }
}

function configureProjectStyles(projectName) {
  return async (tree) => {
    const workspace = await getWorkspace(tree);
    const project = workspace.projects.get(projectName);
    if (!project) {
      throw new SchematicsException(`Project "${projectName}" no longer exists.`);
    }
    addKernStyles(tree, project);
    await writeWorkspace(tree, workspace);
    return tree;
  };
}

function projectSourceRoot(project) {
  const root = normalizedPath(String(project.root ?? project.extensions.root ?? ''));
  const configured = project.sourceRoot ?? project.extensions.sourceRoot;
  return normalizedPath(String(configured ?? `${root ? `${root}/` : ''}src`));
}

function projectMainFile(project) {
  const target = project.targets.get('build');
  const value = target?.options?.browser ?? target?.options?.main;
  return typeof value === 'string' ? normalizedPath(value) : null;
}

function projectFiles(tree, project, extensions = ['.ts', '.html', '.css', '.scss', '.less']) {
  const root = `/${projectSourceRoot(project).replace(/^\/+/, '')}/`;
  const files = [];
  tree.visit((file) => files.push(file));
  return files
    .filter((file) => file.startsWith(root))
    .filter((file) => extensions.some((extension) => file.endsWith(extension)))
    .sort();
}

function projectUsesSsr(project) {
  const target = project.targets.get('build');
  return Boolean(target?.options?.server || target?.options?.ssr);
}

module.exports = {
  KERN_STYLE,
  KERN_STYLE_SPECIFIER,
  addKernStyles,
  applicationNames,
  configureProjectStyles,
  getWorkspace,
  inspectProject,
  normalizedPath,
  projectFiles,
  projectMainFile,
  projectSourceRoot,
  projectUsesSsr,
  resolveDoctorProjects,
  resolveInstallProject,
  stylePath,
  writeWorkspace,
};
