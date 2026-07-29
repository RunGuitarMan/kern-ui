'use strict';

const ts = require('typescript');
const { SchematicsException } = require('@angular-devkit/schematics');

function scriptKind(filePath) {
  return filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
}

function parse(filePath, content) {
  return ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true, scriptKind(filePath));
}

function applyEdits(content, edits) {
  return [...edits]
    .sort((left, right) => right.start - left.start)
    .reduce(
      (value, edit) => `${value.slice(0, edit.start)}${edit.text}${value.slice(edit.end)}`,
      content,
    );
}

function propertyName(node) {
  if (!node) {
    return null;
  }
  if (ts.isIdentifier(node) || ts.isStringLiteral(node)) {
    return node.text;
  }
  return null;
}

function findCall(source, name) {
  let result = null;
  function visit(node) {
    if (
      result === null &&
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === name
    ) {
      result = node;
      return;
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  return result;
}

function containsCall(node, name) {
  let found = false;
  function visit(candidate) {
    if (
      ts.isCallExpression(candidate) &&
      ts.isIdentifier(candidate.expression) &&
      candidate.expression.text === name
    ) {
      found = true;
      return;
    }
    if (!found) {
      ts.forEachChild(candidate, visit);
    }
  }
  visit(node);
  return found;
}

function quote(value) {
  return JSON.stringify(value);
}

function literal(value) {
  if (typeof value === 'string') {
    return quote(value);
  }
  if (typeof value === 'boolean' || typeof value === 'number') {
    return String(value);
  }
  if (value === null) {
    return 'null';
  }
  throw new SchematicsException(`Unsupported KERN configuration value: ${String(value)}.`);
}

function objectExpression(properties, indent = '    ') {
  const entries = Object.entries(properties).filter(([, value]) => value !== undefined);
  if (entries.length === 0) {
    return '';
  }
  return `{\n${entries.map(([key, value]) => `${indent}${key}: ${literal(value)},`).join('\n')}\n  }`;
}

function ensureNamedImport(content, filePath, moduleName, symbols) {
  const source = parse(filePath, content);
  const requested = [...new Set(symbols)].sort();
  const importedValues = new Set();
  let declaration = null;

  for (const statement of source.statements) {
    if (!ts.isImportDeclaration(statement) || statement.importClause?.isTypeOnly) {
      continue;
    }
    const bindings = statement.importClause?.namedBindings;
    if (bindings && ts.isNamedImports(bindings)) {
      for (const element of bindings.elements) {
        if (!element.isTypeOnly) {
          importedValues.add(element.name.text);
        }
      }
      if (
        declaration === null &&
        ts.isStringLiteral(statement.moduleSpecifier) &&
        statement.moduleSpecifier.text === moduleName
      ) {
        declaration = statement;
      }
    }
  }

  if (declaration) {
    const bindings = declaration.importClause?.namedBindings;
    if (bindings && ts.isNamedImports(bindings)) {
      const missing = requested.filter((symbol) => !importedValues.has(symbol));
      if (missing.length === 0) {
        return content;
      }
      const insertion = bindings.elements.end;
      const prefix = bindings.elements.length > 0 ? ', ' : '';
      return `${content.slice(0, insertion)}${prefix}${missing.join(', ')}${content.slice(insertion)}`;
    }
  }

  const missing = requested.filter((symbol) => !importedValues.has(symbol));
  if (missing.length === 0) {
    return content;
  }
  const importText = `import { ${missing.join(', ')} } from '${moduleName}';\n`;
  const imports = source.statements.filter(ts.isImportDeclaration);
  const position = imports.length > 0 ? imports[imports.length - 1].end : 0;
  const separator = position > 0 ? '\n' : '';
  return `${content.slice(0, position)}${separator}${importText}${content.slice(position)}`;
}

function mergeCallObject(content, filePath, callName, values) {
  const source = parse(filePath, content);
  const call = findCall(source, callName);
  if (!call) {
    return { content, found: false, changed: false, safe: true };
  }

  const requested = Object.entries(values).filter(([, value]) => value !== undefined);
  if (requested.length === 0) {
    return { content, found: true, changed: false, safe: true };
  }

  const argument = call.arguments[0];
  if (!argument) {
    const expression = objectExpression(Object.fromEntries(requested), '    ');
    const next = `${content.slice(0, call.expression.end)}(${expression})${content.slice(call.end)}`;
    return { content: next, found: true, changed: true, safe: true };
  }
  if (!ts.isObjectLiteralExpression(argument)) {
    return { content, found: true, changed: false, safe: false };
  }

  const current = new Map(
    argument.properties
      .filter(ts.isPropertyAssignment)
      .map((property) => [propertyName(property.name), property]),
  );
  const edits = [];
  const additions = [];
  for (const [key, value] of requested) {
    const property = current.get(key);
    if (property) {
      const nextValue = literal(value);
      if (property.initializer.getText(source) !== nextValue) {
        edits.push({
          start: property.initializer.getStart(source),
          end: property.initializer.end,
          text: nextValue,
        });
      }
    } else {
      additions.push(`${key}: ${literal(value)}`);
    }
  }

  if (additions.length > 0) {
    const separator = argument.properties.length > 0 ? ', ' : '';
    edits.push({
      start: argument.properties.end,
      end: argument.properties.end,
      text: `${separator}${additions.join(', ')}`,
    });
  }

  return {
    content: applyEdits(content, edits),
    found: true,
    changed: edits.length > 0,
    safe: true,
  };
}

function addProviderToFirstProvidersArray(content, filePath, expression) {
  const source = parse(filePath, content);
  let target = null;
  function visit(node) {
    if (
      target === null &&
      ts.isPropertyAssignment(node) &&
      propertyName(node.name) === 'providers' &&
      ts.isArrayLiteralExpression(node.initializer)
    ) {
      target = node.initializer;
      return;
    }
    ts.forEachChild(node, visit);
  }
  visit(source);

  if (!target) {
    return { content, changed: false };
  }
  const exists = target.elements.some((element) => containsCall(element, 'provideKrn'));
  if (exists) {
    return { content, changed: false };
  }
  const separator = target.elements.length > 0 ? ',\n    ' : '\n    ';
  const suffix = target.elements.length > 0 ? '' : '\n  ';
  const position = target.elements.end;
  return {
    content: `${content.slice(0, position)}${separator}${expression}${suffix}${content.slice(position)}`,
    changed: true,
  };
}

function findProviderFile(tree, files, mainFile) {
  const preferred = files.find((file) => /\/app\.config\.ts$/.test(file));
  if (preferred) {
    return preferred;
  }
  const withConfig = files.find((file) => {
    if (!tree.exists(file)) {
      return false;
    }
    const content = tree.readText(file);
    return content.includes('ApplicationConfig') && content.includes('providers');
  });
  return withConfig ?? mainFile;
}

function configureRuntimeProvider(tree, files, mainFile, values) {
  for (const file of files) {
    if (!tree.exists(file)) {
      continue;
    }
    const content = tree.readText(file);
    if (!findCall(parse(file, content), 'provideKrn')) {
      continue;
    }
    const merged = mergeCallObject(content, file, 'provideKrn', values);
    if (!merged.safe) {
      throw new SchematicsException(
        `Cannot safely merge KERN options into ${file}: provideKrn uses a non-literal argument.`,
      );
    }
    let next = ensureNamedImport(merged.content, file, '@kern-ui/angular/core', ['provideKrn']);
    if (next !== content) {
      tree.overwrite(file, next);
    }
    return file;
  }

  const target = findProviderFile(tree, files, mainFile);
  if (!target || !tree.exists(target)) {
    throw new SchematicsException(
      'Could not find an ApplicationConfig or bootstrapApplication providers array for provideKrn().',
    );
  }

  const expression = `provideKrn(${objectExpression(values, '      ')})`;
  let content = tree.readText(target);
  content = ensureNamedImport(content, target, '@kern-ui/angular/core', ['provideKrn']);
  const inserted = addProviderToFirstProvidersArray(content, target, expression);
  if (!inserted.changed) {
    throw new SchematicsException(
      `Could not find a literal providers array in ${target}. Add provideKrn() manually.`,
    );
  }
  tree.overwrite(target, inserted.content);
  return target;
}

function configurePrepaint(tree, mainFile, values) {
  if (!mainFile || !tree.exists(`/${mainFile.replace(/^\/+/, '')}`)) {
    throw new SchematicsException('Could not find the browser bootstrap file for KERN prepaint.');
  }
  const file = `/${mainFile.replace(/^\/+/, '')}`;
  let content = tree.readText(file);
  if (findCall(parse(file, content), 'applyKrnPrepaintTheme')) {
    const merged = mergeCallObject(content, file, 'applyKrnPrepaintTheme', values);
    if (!merged.safe) {
      throw new SchematicsException(
        `Cannot safely merge KERN prepaint options into ${file}: the call uses a non-literal argument.`,
      );
    }
    content = merged.content;
  } else {
    const source = parse(file, content);
    const bootstrap = findCall(source, 'bootstrapApplication');
    if (!bootstrap) {
      throw new SchematicsException(
        `Could not find bootstrapApplication() in ${file}; call applyKrnPrepaintTheme() manually before bootstrap.`,
      );
    }
    const statement = source.statements.find(
      (candidate) =>
        bootstrap.getStart(source) >= candidate.getStart(source) && bootstrap.end <= candidate.end,
    );
    const position = statement?.getStart(source) ?? bootstrap.getStart(source);
    const call = `applyKrnPrepaintTheme(${objectExpression(values, '    ')});\n\n`;
    content = `${content.slice(0, position)}${call}${content.slice(position)}`;
  }
  content = ensureNamedImport(content, file, '@kern-ui/angular/core', ['applyKrnPrepaintTheme']);
  tree.overwrite(file, content);
  return file;
}

function lineAndColumn(content, offset) {
  const lines = content.slice(0, offset).split('\n');
  return { line: lines.length, column: (lines.at(-1)?.length ?? 0) + 1 };
}

module.exports = {
  configurePrepaint,
  configureRuntimeProvider,
  ensureNamedImport,
  findCall,
  lineAndColumn,
  mergeCallObject,
  objectExpression,
  parse,
};
