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

function removeAttribute(tag, pattern) {
  return tag.replace(pattern, '');
}

const PAGINATION_ATTRIBUTE =
  /\s+(?:\[pagination\]|pagination)(?=\s|=|\/?>)(?:\s*=\s*["']([^"']*)["'])?/;
const VIRTUALIZE_ATTRIBUTE =
  /\s+(?:\[virtualize\]|virtualize)(?=\s|=|\/?>)(?:\s*=\s*["']([^"']*)["'])?/;
const MODE_ATTRIBUTE = /\s+(\[mode\]|mode)(?=\s|=|\/?>)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'))?/;

function unwrapExpression(expression) {
  let current = expression;
  while (
    ts.isParenthesizedExpression(current) ||
    ts.isAsExpression(current) ||
    ts.isTypeAssertionExpression(current) ||
    ts.isSatisfiesExpression(current)
  ) {
    current = current.expression;
  }
  return current;
}

function modeBindingKind(tag) {
  const match = tag.match(MODE_ATTRIBUTE);
  if (!match) {
    return { kind: 'absent', match: null };
  }
  if (match[1] !== '[mode]' || (match[2] === undefined && match[3] === undefined)) {
    return { kind: 'dynamic', match };
  }

  const value = (match[2] ?? match[3]).trim();
  const source = ts.createSourceFile(
    'krn-grid-mode.ts',
    `const krnGridMode = (${value});`,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const statement = source.statements[0];
  const declaration = ts.isVariableStatement(statement)
    ? statement.declarationList.declarations[0]
    : undefined;
  if (!declaration?.initializer || source.parseDiagnostics.length > 0) {
    return { kind: 'dynamic', match };
  }

  const expression = unwrapExpression(declaration.initializer);
  if (
    expression.kind === ts.SyntaxKind.NullKeyword ||
    (ts.isIdentifier(expression) && expression.text === 'undefined') ||
    (ts.isVoidExpression(expression) && ts.isNumericLiteral(expression.expression))
  ) {
    return { kind: 'nullish', match };
  }
  return { kind: ts.isObjectLiteralExpression(expression) ? 'static' : 'dynamic', match };
}

function staticBoolean(match) {
  if (!match) {
    return undefined;
  }
  const value = match[1]?.trim();
  if (value === undefined || value === '' || value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  return null;
}

function removeLegacyGridInputs(tag) {
  return removeAttribute(removeAttribute(tag, PAGINATION_ATTRIBUTE), VIRTUALIZE_ATTRIBUTE);
}

function appendMode(tag, mode) {
  return tag.replace(/\s*(\/?>)$/, ` [mode]="${mode}"$1`);
}

function openingTagPattern(elementNamePattern) {
  return new RegExp(`<${elementNamePattern}\\b(?:[^>"']|"[^"]*"|'[^']*')*>`, 'g');
}

function migrateDataGridTag(tag, file, logger) {
  const pagination = tag.match(PAGINATION_ATTRIBUTE);
  const virtualize = tag.match(VIRTUALIZE_ATTRIBUTE);
  const mode = modeBindingKind(tag);
  if (!pagination && !virtualize) {
    if (mode.kind === 'nullish') {
      return removeAttribute(tag, MODE_ATTRIBUTE);
    }
    if (mode.kind === 'dynamic') {
      logger.warn(
        `${MIGRATION_CODE} ${file}: dynamic mode binding requires review because KrnDataGrid.mode is now non-null; coalesce null or undefined to an explicit discriminated mode.`,
      );
    }
    return tag;
  }

  if (mode.kind === 'static') {
    return removeLegacyGridInputs(tag);
  }
  if (mode.kind === 'dynamic') {
    logger.warn(
      `${MIGRATION_CODE} ${file}: pagination/virtualize was left unchanged because the existing mode binding may resolve to null; migrate the fallback to one discriminated mode expression.`,
    );
    return tag;
  }
  if (mode.kind === 'nullish') {
    tag = removeAttribute(tag, MODE_ATTRIBUTE);
  }

  const virtualState = staticBoolean(virtualize);
  const paginationState = staticBoolean(pagination);

  // The legacy virtual input took precedence over pagination. A statically enabled virtual mode is
  // therefore safe even when the now-irrelevant pagination binding is dynamic.
  if (virtualState === true) {
    return appendMode(removeLegacyGridInputs(tag), "{ kind: 'virtual' }");
  }

  if (virtualState === null || paginationState === null) {
    logger.warn(
      `${MIGRATION_CODE} ${file}: dynamic pagination/virtualize binding was left unchanged; migrate it to the discriminated mode input.`,
    );
    return tag;
  }

  // `virtualize=false` selected client mode. Pagination kept its explicit value and defaulted to
  // true when it was absent, so always emit the complete client mode instead of relying on defaults.
  return appendMode(
    removeLegacyGridInputs(tag),
    `{ kind: 'client', pagination: ${paginationState ?? true} }`,
  );
}

function migrateGroupAriaLabel(tag) {
  return tag
    .replace(/(\s)\[ariaLabel\](?=\s*=)/g, '$1[attr.aria-label]')
    .replace(/(\s)ariaLabel(?=\s|=|\/?>)/g, '$1aria-label');
}

function migrateGroupHosts(content, elementName, directiveName) {
  const openingTag = openingTagPattern(elementName);
  const closingTag = new RegExp(`</${elementName}\\s*>`, 'g');
  const directiveHost = new RegExp(`\\b${directiveName}(?=\\s|=|/?>)`);
  let next = content.replace(openingTag, (tag) => {
    const selfClosing = /\/\s*>$/.test(tag);
    let migrated = migrateGroupAriaLabel(
      tag.replace(new RegExp(`^<${elementName}\\b`), `<div ${directiveName}`),
    );
    if (selfClosing) {
      migrated = migrated.replace(/\s*\/\s*>$/, '></div>');
    }
    return migrated;
  });
  next = next.replace(closingTag, '</div>');
  return next.replace(openingTagPattern('div'), (tag) =>
    directiveHost.test(tag) ? migrateGroupAriaLabel(tag) : tag,
  );
}

function migrateTemplates(content, file, logger) {
  let next = migrateGroupHosts(content, 'krn-button-group', 'krnButtonGroup');
  next = migrateGroupHosts(next, 'krn-toggle-group', 'krnToggleGroup');
  next = next.replace(openingTagPattern('krn-(?:data-grid|data-table)'), (tag) =>
    migrateDataGridTag(tag, file, logger),
  );
  const menuNeedsManualMigration = [...next.matchAll(openingTagPattern('krn-menu'))].some((match) =>
    /(?:\[hasProjectedTrigger\]|\bhasProjectedTrigger)\s*(?:=|\s|\/?>)/.test(match[0]),
  );
  if (menuNeedsManualMigration) {
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
