'use strict';

const {
  addKernStyles,
  getWorkspace,
  inspectProject,
  projectFiles,
  projectMainFile,
  resolveInstallProject,
  writeWorkspace,
} = require('../shared/workspace');
const { configurePrepaint, configureRuntimeProvider } = require('../shared/source');

function runtimeValues(options) {
  return {
    locale: options.locale,
    direction: options.direction,
    density: options.density,
    motion: options.motion,
    theme: options.theme,
    brandColor: options.brandColor,
    persistPreferences: options.persistPreferences,
    preferenceStorageKey: options.preferenceStorageKey,
    overlayHost: options.overlayHost,
  };
}

function prepaintValues(options) {
  return {
    theme: options.theme,
    density: options.density,
    brandColor: options.brandColor,
    persist: options.persistPreferences,
    storageKey: options.preferenceStorageKey,
  };
}

function hasRuntimeOptions(options) {
  return (
    options.runtime === true ||
    options.prepaint === true ||
    Object.values(runtimeValues(options)).some((value) => value !== undefined)
  );
}

function defaultFactory(options = {}) {
  return async (tree, context) => {
    const workspace = await getWorkspace(tree);
    const projectName = resolveInstallProject(workspace, options.project);
    const project = workspace.projects.get(projectName);
    const inspection = inspectProject(tree, project);
    let workspaceChanged = false;

    if (options.skipStyles) {
      context.logger.info(`Skipped KERN styles for "${projectName}" by request.`);
    } else if (
      !inspection.configured ||
      inspection.duplicates > 0 ||
      inspection.orderIssues.length > 0
    ) {
      context.logger.info(`Configuring KERN global styles for "${projectName}".`);
      addKernStyles(tree, project);
      workspaceChanged = true;
    } else {
      if (inspection.duplicates > 0) {
        context.logger.warn(
          `KERN styles are configured more than once for "${projectName}". Run @kern-ui/angular:doctor --strict to detect duplicate entries in CI.`,
        );
      }
      context.logger.info(`KERN styles are already configured for "${projectName}".`);
    }

    if (workspaceChanged) {
      await writeWorkspace(tree, workspace);
    }

    if (hasRuntimeOptions(options)) {
      const files = projectFiles(tree, project, ['.ts']);
      const mainFile = projectMainFile(project);
      const providerFile = configureRuntimeProvider(tree, files, mainFile, runtimeValues(options));
      context.logger.info(`Configured provideKrn() in ${providerFile}.`);

      if (options.prepaint) {
        const prepaintFile = configurePrepaint(tree, mainFile, prepaintValues(options));
        context.logger.info(
          `Configured CSP-safe KERN prepaint before bootstrapApplication() in ${prepaintFile}.`,
        );
      }
    } else {
      context.logger.info(
        'Zero-config runtime retained. Use --runtime to register provideKrn() preferences.',
      );
    }

    return tree;
  };
}

exports.default = defaultFactory;
