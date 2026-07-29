'use strict';

const ts = require('typescript');
const { getWorkspace, projectFiles, resolveDoctorProjects } = require('../shared/workspace');
const { parse } = require('../shared/source');

const KERN_ROOT = '@kern-ui/angular';
const MIGRATION_CODE = 'KRN-DX-030';
const ROOT_EXPORT_CONTRACT = require('../../agent/root-export-map.json');

function rootExportOwnership(contract) {
  if (
    contract?.schemaVersion !== '1.0.0' ||
    contract.package !== KERN_ROOT ||
    !Array.isArray(contract.entrypoints) ||
    contract.entrypoints.length === 0 ||
    !contract.exports ||
    typeof contract.exports !== 'object' ||
    Array.isArray(contract.exports)
  ) {
    throw new Error('Invalid KERN root export ownership contract.');
  }
  const entrypoints = new Set(contract.entrypoints);
  if (
    entrypoints.size !== contract.entrypoints.length ||
    [...entrypoints].some(
      (entrypoint) => typeof entrypoint !== 'string' || !entrypoint.startsWith(`${KERN_ROOT}/`),
    )
  ) {
    throw new Error('Invalid KERN root export ownership entrypoints.');
  }
  for (const [symbol, entrypoint] of Object.entries(contract.exports)) {
    if (!symbol || typeof entrypoint !== 'string' || !entrypoints.has(entrypoint)) {
      throw new Error(`Invalid owner entrypoint for KERN root export "${symbol}".`);
    }
  }
  return Object.freeze({ ...contract.exports });
}

const ROOT_EXPORT_OWNERSHIP = rootExportOwnership(ROOT_EXPORT_CONTRACT);

function entrypointFor(symbol) {
  return ROOT_EXPORT_OWNERSHIP[symbol] ?? null;
}

function migrateRootImports(content, file, logger) {
  const source = parse(file, content);
  const edits = [];

  for (const statement of source.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier) ||
      statement.moduleSpecifier.text !== KERN_ROOT
    ) {
      continue;
    }

    const clause = statement.importClause;
    if (
      !clause ||
      clause.name ||
      !clause.namedBindings ||
      !ts.isNamedImports(clause.namedBindings)
    ) {
      logger.warn(
        `${MIGRATION_CODE} ${file}: namespace/default root import requires manual migration.`,
      );
      continue;
    }

    const groups = new Map();
    const unresolved = [];
    for (const element of clause.namedBindings.elements) {
      const exportedName = element.propertyName?.text ?? element.name.text;
      const entrypoint = entrypointFor(exportedName);
      if (!entrypoint) {
        unresolved.push(element.getText(source));
        continue;
      }
      const elements = groups.get(entrypoint) ?? [];
      elements.push(element.getText(source));
      groups.set(entrypoint, elements);
    }

    if (groups.size === 0) {
      logger.warn(`${MIGRATION_CODE} ${file}: root import has no safely mapped symbols.`);
      continue;
    }

    if (unresolved.length > 0) {
      groups.set(KERN_ROOT, unresolved);
      logger.warn(
        `${MIGRATION_CODE} ${file}: kept unresolved root symbols for manual review: ${unresolved.join(', ')}.`,
      );
    }

    const typePrefix = clause.isTypeOnly ? 'type ' : '';
    const replacement = [...groups]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(
        ([entrypoint, elements]) =>
          `import ${typePrefix}{ ${elements.join(', ')} } from '${entrypoint}';`,
      )
      .join('\n');
    edits.push({
      start: statement.getStart(source),
      end: statement.end,
      text: replacement,
    });
  }

  return edits
    .sort((left, right) => right.start - left.start)
    .reduce(
      (next, edit) => `${next.slice(0, edit.start)}${edit.text}${next.slice(edit.end)}`,
      content,
    );
}

function hasMode(tag) {
  return /(?:\[mode\]|\bmode)\s*=/.test(tag);
}

function removeAttribute(tag, pattern) {
  return tag.replace(pattern, '');
}

function migrateDataGridTag(tag, file, logger) {
  const pagination = tag.match(
    /\s+(?:\[pagination\]|pagination)(?=\s|=|\/?>)(?:\s*=\s*["']([^"']*)["'])?/,
  );
  const virtualize = tag.match(
    /\s+(?:\[virtualize\]|virtualize)(?=\s|=|\/?>)(?:\s*=\s*["']([^"']*)["'])?/,
  );
  if (!pagination && !virtualize) {
    return tag;
  }

  const paginationValue = pagination?.[1]?.trim();
  const virtualizeValue = virtualize?.[1]?.trim();
  const explicitMode = hasMode(tag);
  if (explicitMode) {
    return removeAttribute(
      removeAttribute(
        tag,
        /\s+(?:\[pagination\]|pagination)(?=\s|=|\/?>)(?:\s*=\s*["'][^"']*["'])?/,
      ),
      /\s+(?:\[virtualize\]|virtualize)(?=\s|=|\/?>)(?:\s*=\s*["'][^"']*["'])?/,
    );
  }

  const virtualEnabled =
    Boolean(virtualize) &&
    (virtualizeValue === undefined || virtualizeValue === '' || virtualizeValue === 'true');
  const paginationDefault =
    Boolean(pagination) &&
    (paginationValue === undefined || paginationValue === '' || paginationValue === 'true');
  const paginationDisabled = Boolean(pagination) && paginationValue === 'false';

  if (virtualEnabled || (!virtualize && (paginationDefault || paginationDisabled))) {
    let next = removeAttribute(
      removeAttribute(
        tag,
        /\s+(?:\[pagination\]|pagination)(?=\s|=|\/?>)(?:\s*=\s*["'][^"']*["'])?/,
      ),
      /\s+(?:\[virtualize\]|virtualize)(?=\s|=|\/?>)(?:\s*=\s*["'][^"']*["'])?/,
    );
    if (virtualEnabled) {
      next = next.replace(/\s*(\/?>)$/, ` [mode]="{ kind: 'virtual' }"$1`);
    } else if (paginationDisabled) {
      next = next.replace(/\s*(\/?>)$/, ` [mode]="{ kind: 'client', pagination: false }"$1`);
    }
    return next;
  }

  logger.warn(
    `${MIGRATION_CODE} ${file}: dynamic pagination/virtualize binding was left unchanged; migrate it to the discriminated mode input.`,
  );
  return tag;
}

function migrateTemplates(content, file, logger) {
  let next = content.replace(/<krn-(?:data-grid|data-table)\b[\s\S]*?>/g, (tag) =>
    migrateDataGridTag(tag, file, logger),
  );
  if (
    /<krn-menu\b[\s\S]*?(?:\[hasProjectedTrigger\]|\bhasProjectedTrigger)\s*(?:=|\s|\/?>)/.test(
      next,
    )
  ) {
    logger.warn(
      `${MIGRATION_CODE} ${file}: hasProjectedTrigger requires a manual KrnMenuTrigger directive migration.`,
    );
  }
  return next;
}

function updateToV1(options = {}) {
  return async (tree, context) => {
    const workspace = await getWorkspace(tree);
    const projectNames = resolveDoctorProjects(workspace, options.project);
    let changed = 0;

    for (const projectName of projectNames) {
      const project = workspace.projects.get(projectName);
      for (const file of projectFiles(tree, project, ['.ts', '.html'])) {
        const content = tree.readText(file);
        let next = content;
        if (file.endsWith('.ts')) {
          next = migrateRootImports(next, file, context.logger);
        }
        next = migrateTemplates(next, file, context.logger);
        if (next !== content) {
          tree.overwrite(file, next);
          changed += 1;
        }
      }
    }

    context.logger.info(
      `KERN 1.0 migration updated ${changed} file(s). Re-run @kern-ui/angular:doctor --strict before committing.`,
    );
    return tree;
  };
}

exports.default = updateToV1;
exports.updateToV1 = updateToV1;
