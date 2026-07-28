'use strict';

const { chain } = require('@angular-devkit/schematics');
const {
  configureProjectStyles,
  getWorkspace,
  inspectProject,
  resolveInstallProject,
} = require('../shared/workspace');

function defaultFactory(options = {}) {
  return async (tree, context) => {
    const workspace = await getWorkspace(tree);
    const projectName = resolveInstallProject(workspace, options.project);
    const project = workspace.projects.get(projectName);
    const inspection = inspectProject(tree, project);

    if (options.skipStyles || inspection.configured) {
      if (inspection.duplicates > 0) {
        context.logger.warn(
          `KERN styles are configured more than once for "${projectName}". Run @kern-ui/angular:doctor --strict to detect duplicate entries in CI.`,
        );
      }
      context.logger.info(
        options.skipStyles
          ? `Skipped KERN styles for "${projectName}" by request.`
          : `KERN styles are already configured for "${projectName}".`,
      );
      return tree;
    }

    context.logger.info(`Configuring KERN global styles for "${projectName}".`);
    context.logger.info(
      "Optional runtime preferences can be registered with provideKrn(...) in the application's providers.",
    );

    return chain([configureProjectStyles(projectName)])(tree, context);
  };
}

exports.default = defaultFactory;
