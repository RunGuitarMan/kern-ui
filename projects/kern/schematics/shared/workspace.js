'use strict';

const { SchematicsException } = require('@angular-devkit/schematics');
const { getWorkspace, writeWorkspace } = require('@schematics/angular/utility/workspace');

const KERN_STYLE = 'node_modules/@kern-ui/angular/styles/kern.css';
const KERN_STYLE_SPECIFIER = '@kern-ui/angular/styles/kern.css';

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
        `Project "${requestedProject}" is not an application. KERN global styles must be configured on an application build target.`,
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

function isKernStylePath(value) {
  const path = normalizedPath(value);
  return (
    path === KERN_STYLE ||
    path === KERN_STYLE_SPECIFIER ||
    path.endsWith(`/node_modules/${KERN_STYLE_SPECIFIER}`)
  );
}

function optionsStyleArrays(target) {
  const arrays = [];
  const baseStyles = target.options?.styles;
  if (Array.isArray(baseStyles)) {
    arrays.push(baseStyles);
  }

  for (const configuration of Object.values(target.configurations ?? {})) {
    if (configuration && Array.isArray(configuration.styles)) {
      arrays.push(configuration.styles);
    }
  }
  return arrays;
}

function effectiveStyleArrays(target) {
  const baseStyles = Array.isArray(target.options?.styles) ? target.options.styles : [];
  const arrays = [baseStyles];

  for (const configuration of Object.values(target.configurations ?? {})) {
    if (configuration && Array.isArray(configuration.styles)) {
      arrays.push(configuration.styles);
    }
  }
  return arrays;
}

function stylesheetImportsKern(tree, path) {
  const normalized = normalizedPath(path);
  const treePath = normalized.startsWith('/') ? normalized : `/${normalized}`;
  if (!tree.exists(treePath)) {
    return false;
  }

  return tree.readText(treePath).includes(KERN_STYLE_SPECIFIER);
}

function styleArrayHasKern(tree, styles) {
  return styles.some((entry) => {
    const path = stylePath(entry);
    return path !== null && (isKernStylePath(path) || stylesheetImportsKern(tree, path));
  });
}

function inspectProject(tree, project) {
  const target = project.targets.get('build');
  if (!target) {
    return {
      configured: false,
      duplicates: 0,
      reason: 'has no build target',
    };
  }

  const arrays = effectiveStyleArrays(target);
  const configured = arrays.every((styles) => styleArrayHasKern(tree, styles));
  const duplicates = optionsStyleArrays(target).reduce((count, styles) => {
    const directEntries = styles
      .map(stylePath)
      .filter((path) => path !== null && isKernStylePath(path));
    return count + Math.max(0, directEntries.length - 1);
  }, 0);

  return {
    configured,
    duplicates,
    reason: configured ? null : 'does not load @kern-ui/angular/styles/kern.css',
  };
}

function addKernStyles(tree, project) {
  const target = project.targets.get('build');
  if (!target) {
    throw new SchematicsException(
      'The selected application has no build target. Configure @kern-ui/angular/styles/kern.css manually.',
    );
  }

  target.options ??= {};
  if (!Array.isArray(target.options.styles)) {
    target.options.styles = [];
  }

  const arrays = optionsStyleArrays(target);
  for (const styles of arrays) {
    if (!styleArrayHasKern(tree, styles)) {
      styles.unshift(KERN_STYLE);
    }
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

module.exports = {
  KERN_STYLE,
  addKernStyles,
  configureProjectStyles,
  getWorkspace,
  inspectProject,
  resolveDoctorProjects,
  resolveInstallProject,
};
