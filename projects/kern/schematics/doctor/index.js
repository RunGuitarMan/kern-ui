'use strict';

const { SchematicsException, chain } = require('@angular-devkit/schematics');
const {
  configureProjectStyles,
  getWorkspace,
  inspectProject,
  resolveDoctorProjects,
} = require('../shared/workspace');

function defaultFactory(options = {}) {
  return async (tree, context) => {
    const workspace = await getWorkspace(tree);
    const projectNames = resolveDoctorProjects(workspace, options.project);
    const missing = [];
    const duplicates = [];

    for (const projectName of projectNames) {
      const project = workspace.projects.get(projectName);
      const result = inspectProject(tree, project);
      if (!result.configured) {
        missing.push(projectName);
        context.logger.warn(`KERN doctor: "${projectName}" ${result.reason}.`);
      } else {
        context.logger.info(`KERN doctor: "${projectName}" has the required global styles.`);
      }
      if (result.duplicates > 0) {
        duplicates.push(projectName);
        context.logger.warn(
          `KERN doctor: "${projectName}" contains ${result.duplicates + 1} direct KERN style entries.`,
        );
      }
    }

    if (options.fix && missing.length > 0) {
      context.logger.info(`Adding KERN styles to: ${missing.join(', ')}.`);
      return chain(missing.map(configureProjectStyles))(tree, context);
    }

    if (options.strict && (missing.length > 0 || duplicates.length > 0)) {
      const problems = [
        missing.length ? `missing styles: ${missing.join(', ')}` : null,
        duplicates.length ? `duplicate styles: ${duplicates.join(', ')}` : null,
      ].filter(Boolean);
      throw new SchematicsException(`KERN workspace check failed (${problems.join('; ')}).`);
    }

    return tree;
  };
}

exports.default = defaultFactory;
