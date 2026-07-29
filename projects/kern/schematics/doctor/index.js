'use strict';

const { SchematicsException } = require('@angular-devkit/schematics');
const { analyzeProject, peerDiagnostics } = require('./analyze');
const { createReport } = require('../shared/diagnostics');
const {
  addKernStyles,
  getWorkspace,
  resolveDoctorProjects,
  writeWorkspace,
} = require('../shared/workspace');

function logDiagnostic(context, item) {
  const location = item.file
    ? ` ${item.file}${item.line ? `:${item.line}${item.column ? `:${item.column}` : ''}` : ''}`
    : '';
  const message = `${item.code}${location} — ${item.message}`;
  if (item.severity === 'error') {
    context.logger.error(message);
  } else if (item.severity === 'warning') {
    context.logger.warn(message);
  } else {
    context.logger.info(message);
  }
}

function strictProblems(diagnostics) {
  return diagnostics.filter((item) => item.severity !== 'info');
}

function defaultFactory(options = {}) {
  return async (tree, context) => {
    const workspace = await getWorkspace(tree);
    const projectNames = resolveDoctorProjects(workspace, options.project);
    let diagnostics = peerDiagnostics(tree, projectNames[0]);
    const fixed = [];

    for (const projectName of projectNames) {
      const project = workspace.projects.get(projectName);
      diagnostics.push(...analyzeProject(tree, projectName, project));
    }

    if (options.fix) {
      const fixProjects = new Set(
        diagnostics
          .filter((item) => item.fixable)
          .map((item) => item.project)
          .filter((name) => workspace.projects.has(name)),
      );
      for (const projectName of fixProjects) {
        const project = workspace.projects.get(projectName);
        addKernStyles(tree, project);
        fixed.push(...diagnostics.filter((item) => item.project === projectName && item.fixable));
      }
      if (fixProjects.size > 0) {
        await writeWorkspace(tree, workspace);
      }

      diagnostics = peerDiagnostics(tree, projectNames[0]);
      for (const projectName of projectNames) {
        diagnostics.push(...analyzeProject(tree, projectName, workspace.projects.get(projectName)));
      }
    }

    const report = createReport(projectNames, diagnostics, fixed);
    if (options.json) {
      context.logger.info(JSON.stringify(report));
    } else {
      for (const item of report.diagnostics) {
        logDiagnostic(context, item);
      }
      if (report.diagnostics.length === 0) {
        context.logger.info('KRN doctor: no issues found.');
      } else {
        context.logger.info(
          `KRN doctor: ${strictProblems(report.diagnostics).length} actionable issue(s), ${report.diagnostics.length - strictProblems(report.diagnostics).length} informational.`,
        );
      }
      if (report.fixed.length > 0) {
        context.logger.info(`KRN doctor safely fixed ${report.fixed.length} style issue(s).`);
      }
    }

    const problems = strictProblems(report.diagnostics);
    if (options.strict && problems.length > 0) {
      const missing = problems
        .filter((item) => item.code === 'KRN-DX-001')
        .map((item) => item.project);
      const duplicate = problems
        .filter((item) => item.code === 'KRN-DX-002')
        .map((item) => item.project);
      const summary = [
        missing.length ? `missing styles: ${[...new Set(missing)].join(', ')}` : null,
        duplicate.length ? `duplicate styles: ${[...new Set(duplicate)].join(', ')}` : null,
        `diagnostics: ${problems.map((item) => item.code).join(', ')}`,
      ].filter(Boolean);
      throw new SchematicsException(`KERN workspace check failed (${summary.join('; ')}).`);
    }

    return tree;
  };
}

exports.default = defaultFactory;
