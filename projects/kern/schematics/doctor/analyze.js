'use strict';

const { existsSync } = require('node:fs');
const { resolve } = require('node:path');
const ts = require('typescript');
const { DIAGNOSTIC_CODES: CODES, diagnostic } = require('../shared/diagnostics');
const {
  inspectProject,
  projectFiles,
  projectMainFile,
  projectUsesSsr,
} = require('../shared/workspace');
const { lineAndColumn, parse } = require('../shared/source');

const KERN_ROOT = '@kern-ui/angular';
const KERN_PACKAGE_ROOT = resolve(__dirname, '../..');
const KERN_PACKAGE = require('../../package.json');
const rootExportMapPath = existsSync(resolve(__dirname, '../shared/root-export-map.json'))
  ? '../shared/root-export-map.json'
  : '../../agent/root-export-map.json';
const KERN_ROOT_EXPORT_MAP = require(rootExportMapPath);
const RUNTIME_ENTRYPOINTS = new Set(KERN_ROOT_EXPORT_MAP.entrypoints);
const FALLBACK_PEER_RANGES = Object.freeze({
  '@angular/aria': '^22.0.0',
  '@angular/cdk': '^22.0.0',
  '@angular/common': '^22.0.0',
  '@angular/core': '^22.0.0',
  '@angular/forms': '^22.0.0',
  rxjs: '^7.4.0',
});
const OVERLAY_MARKERS =
  /\bKrn(?:Autocomplete|Combobox|CommandPalette|Dialog|Drawer|Dropdown|HoverCard|Menu|Modal|Popover|Select|Tooltip)\b|<krn-(?:autocomplete|combobox|command-palette|dialog|drawer|dropdown|hover-card|menu|modal|popover|select|tooltip)\b/;

function exportTargets(target) {
  if (typeof target === 'string') {
    return [target];
  }
  if (Array.isArray(target)) {
    return target.flatMap(exportTargets);
  }
  if (target && typeof target === 'object') {
    return Object.values(target).flatMap(exportTargets);
  }
  return [];
}

function declaredPackageExport(subpath) {
  for (const [key, target] of Object.entries(KERN_PACKAGE.exports ?? {})) {
    if (!key.includes('*')) {
      if (key === subpath && exportTargets(target).length > 0) {
        return true;
      }
      continue;
    }

    const [prefix, suffix] = key.split('*');
    if (
      !subpath.startsWith(prefix) ||
      !subpath.endsWith(suffix) ||
      subpath.length < prefix.length + suffix.length
    ) {
      continue;
    }
    const wildcard = subpath.slice(prefix.length, subpath.length - suffix.length);
    if (!wildcard || wildcard.includes('/')) {
      continue;
    }
    if (
      exportTargets(target).some((candidate) => {
        if (!candidate.startsWith('./') || !candidate.includes('*')) {
          return false;
        }
        const resolvedTarget = candidate.replaceAll('*', wildcard);
        return existsSync(resolve(KERN_PACKAGE_ROOT, resolvedTarget));
      })
    ) {
      return true;
    }
  }
  return false;
}

function canonicalKernSpecifier(specifier) {
  if (RUNTIME_ENTRYPOINTS.has(specifier)) {
    return true;
  }
  const subpath = `.${specifier.slice(KERN_ROOT.length)}`;
  return declaredPackageExport(subpath);
}

function allPackageDependencies(tree) {
  if (!tree.exists('/package.json')) {
    return {};
  }
  const manifest = JSON.parse(tree.readText('/package.json'));
  return {
    ...manifest.dependencies,
    ...manifest.devDependencies,
    ...manifest.peerDependencies,
    ...manifest.optionalDependencies,
  };
}

function numericVersion(value) {
  if (typeof value !== 'string' || /^(?:file|git|link|workspace):/.test(value)) {
    return null;
  }
  const match = value.match(/(\d+)(?:\.(\d+))?/);
  return match ? { major: Number(match[1]), minor: Number(match[2] ?? 0) } : null;
}

function kernPeerRanges() {
  try {
    const manifest = require('../../package.json');
    return { ...FALLBACK_PEER_RANGES, ...manifest.peerDependencies };
  } catch {
    return FALLBACK_PEER_RANGES;
  }
}

function rangeCompatibility(value, expectedRange) {
  if (
    typeof value !== 'string' ||
    /^(?:file|git|link|workspace):/.test(value) ||
    /^(?:latest|next|\*)$/.test(value.trim())
  ) {
    return null;
  }
  const expected = numericVersion(expectedRange);
  const actual = numericVersion(value);
  if (!expected || !actual) {
    return null;
  }
  if (actual.major !== expected.major) {
    const bounded = value.match(/>=?\s*(\d+)[^<]*<\s*(\d+)/);
    return Boolean(
      bounded && Number(bounded[1]) <= expected.major && Number(bounded[2]) > expected.major,
    );
  }
  if (actual.minor >= expected.minor) {
    return true;
  }
  const normalized = value.trim();
  return normalized.startsWith('^') || normalized.startsWith('>=');
}

function peerDiagnostics(tree, projectName) {
  const dependencies = allPackageDependencies(tree);
  const diagnostics = [];
  for (const [name, expected] of Object.entries(kernPeerRanges())) {
    if (!(name in dependencies)) {
      if (KERN_PACKAGE.peerDependenciesMeta?.[name]?.optional === true) {
        continue;
      }
      diagnostics.push(
        diagnostic(
          CODES.peerMissing,
          'error',
          projectName,
          `Required KERN peer "${name}" is not declared in package.json.`,
          { package: name, expected },
        ),
      );
      continue;
    }
    const compatibility = rangeCompatibility(dependencies[name], expected);
    if (compatibility === false) {
      diagnostics.push(
        diagnostic(
          CODES.peerIncompatible,
          'error',
          projectName,
          `KERN peer "${name}" has incompatible range "${dependencies[name]}".`,
          {
            package: name,
            actual: dependencies[name],
            expected,
          },
        ),
      );
    } else if (compatibility === null) {
      diagnostics.push(
        diagnostic(
          CODES.peerUnverifiable,
          'warning',
          projectName,
          `KERN could not verify peer "${name}" range "${dependencies[name]}".`,
          { package: name, actual: dependencies[name], expected },
        ),
      );
    }
  }
  return diagnostics;
}

function styleDiagnostics(tree, projectName, project) {
  const state = inspectProject(tree, project);
  const diagnostics = [];
  if (!state.configured) {
    diagnostics.push(
      diagnostic(CODES.stylesMissing, 'error', projectName, `KERN ${state.reason}.`, {
        fixable: true,
      }),
    );
  }
  if (state.duplicates > 0) {
    diagnostics.push(
      diagnostic(
        CODES.stylesDuplicate,
        'warning',
        projectName,
        `KERN global styles are loaded ${state.duplicates + 1} times in at least one build configuration.`,
        { fixable: true, count: state.duplicates + 1 },
      ),
    );
  }
  if (state.orderIssues.length > 0) {
    diagnostics.push(
      diagnostic(
        CODES.stylesOrder,
        'warning',
        projectName,
        `KERN global styles must load before application styles (${state.orderIssues
          .map((item) => item.configuration)
          .join(', ')}).`,
        { fixable: true },
      ),
    );
  }
  if (state.partials.length > 0) {
    diagnostics.push(
      diagnostic(
        CODES.stylesPartial,
        'warning',
        projectName,
        'Partial KERN style entrypoints do not replace styles/kern.css.',
        { entries: state.partials },
      ),
    );
  }
  return diagnostics;
}

function moduleSpecifiers(file, content) {
  const source = parse(file, content);
  const result = [];
  function add(node, value) {
    const position = lineAndColumn(content, node.getStart(source));
    result.push({ value, ...position });
  }
  function visit(node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      add(node.moduleSpecifier, node.moduleSpecifier.text);
    }
    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length === 1 &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      add(node.arguments[0], node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  return result;
}

function importDiagnostics(tree, projectName, files) {
  const diagnostics = [];
  for (const file of files.filter((candidate) => candidate.endsWith('.ts'))) {
    const content = tree.readText(file);
    for (const specifier of moduleSpecifiers(file, content)) {
      if (specifier.value === KERN_ROOT) {
        diagnostics.push(
          diagnostic(
            CODES.rootImport,
            'warning',
            projectName,
            'Import from the compatibility root is non-canonical; use the owning KERN entrypoint.',
            { file, line: specifier.line, column: specifier.column, import: specifier.value },
          ),
        );
      } else if (
        specifier.value.startsWith(`${KERN_ROOT}/`) &&
        !canonicalKernSpecifier(specifier.value)
      ) {
        diagnostics.push(
          diagnostic(
            CODES.deepImport,
            'error',
            projectName,
            `Unsupported KERN deep or unknown import "${specifier.value}".`,
            { file, line: specifier.line, column: specifier.column, import: specifier.value },
          ),
        );
      }
    }
  }
  return diagnostics;
}

function deprecatedTagDiagnostics(projectName, file, content) {
  const diagnostics = [];
  const tags = [
    {
      tag: /<krn-(?:data-grid|data-table)\b[\s\S]*?>/g,
      attributes: [
        {
          pattern: /(?:\[pagination\]|\bpagination)\s*(?:=|\s|\/?>)/,
          replacement: 'Use the discriminated mode input with { kind: "client", pagination }.',
        },
        {
          pattern: /(?:\[virtualize\]|\bvirtualize)\s*(?:=|\s|\/?>)/,
          replacement: 'Use [mode]="{ kind: \'virtual\' }".',
        },
      ],
    },
    {
      tag: /<krn-menu\b[\s\S]*?>/g,
      attributes: [
        {
          pattern: /(?:\[hasProjectedTrigger\]|\bhasProjectedTrigger)\s*(?:=|\s|\/?>)/,
          replacement: 'Apply KrnMenuTrigger to the projected trigger instead.',
        },
      ],
    },
  ];
  for (const definition of tags) {
    for (const match of content.matchAll(definition.tag)) {
      for (const attribute of definition.attributes) {
        if (!attribute.pattern.test(match[0])) {
          continue;
        }
        const position = lineAndColumn(content, match.index);
        diagnostics.push(
          diagnostic(
            CODES.deprecatedApi,
            'warning',
            projectName,
            `Deprecated KERN template API. ${attribute.replacement}`,
            { file, line: position.line, column: position.column },
          ),
        );
      }
    }
  }
  return diagnostics;
}

function literalValue(node) {
  if (ts.isStringLiteralLike(node)) {
    return node.text;
  }
  if (node.kind === ts.SyntaxKind.TrueKeyword) {
    return true;
  }
  if (node.kind === ts.SyntaxKind.FalseKeyword) {
    return false;
  }
  if (node.kind === ts.SyntaxKind.NullKeyword) {
    return null;
  }
  return undefined;
}

function callOptions(file, content, callName) {
  const source = parse(file, content);
  const calls = [];
  const localNames = new Set();
  const namespaceNames = new Set();
  let indirectReference = false;

  for (const statement of source.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier) ||
      ![KERN_ROOT, `${KERN_ROOT}/core`].includes(statement.moduleSpecifier.text)
    ) {
      continue;
    }
    const bindings = statement.importClause?.namedBindings;
    if (bindings && ts.isNamedImports(bindings)) {
      for (const element of bindings.elements) {
        if ((element.propertyName?.text ?? element.name.text) === callName) {
          localNames.add(element.name.text);
        }
      }
    } else if (bindings && ts.isNamespaceImport(bindings)) {
      namespaceNames.add(bindings.name.text);
    }
  }

  function isTargetCall(node) {
    if (ts.isIdentifier(node.expression)) {
      return localNames.has(node.expression.text);
    }
    return (
      ts.isPropertyAccessExpression(node.expression) &&
      ts.isIdentifier(node.expression.expression) &&
      namespaceNames.has(node.expression.expression.text) &&
      node.expression.name.text === callName
    );
  }

  function visit(node) {
    if (ts.isCallExpression(node) && isTargetCall(node)) {
      const values = {};
      const argument = node.arguments[0];
      let verifiable = argument === undefined || ts.isObjectLiteralExpression(argument);
      if (argument && ts.isObjectLiteralExpression(argument)) {
        for (const property of argument.properties) {
          if (
            ts.isPropertyAssignment(property) &&
            (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name))
          ) {
            const value = literalValue(property.initializer);
            values[property.name.text] = value;
            if (value === undefined) {
              verifiable = false;
            }
          } else {
            verifiable = false;
          }
        }
      }
      calls.push({ file, offset: node.getStart(source), values, verifiable });
    } else if (
      ts.isIdentifier(node) &&
      localNames.has(node.text) &&
      !ts.isImportSpecifier(node.parent) &&
      !(ts.isCallExpression(node.parent) && node.parent.expression === node)
    ) {
      indirectReference = true;
    } else if (
      ts.isPropertyAccessExpression(node) &&
      ts.isIdentifier(node.expression) &&
      namespaceNames.has(node.expression.text) &&
      node.name.text === callName &&
      !(ts.isCallExpression(node.parent) && node.parent.expression === node)
    ) {
      indirectReference = true;
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  return { calls, indirectReference };
}

function selectorExists(selector, contents) {
  const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (selector.startsWith('#')) {
    const id = escapeRegExp(selector.slice(1));
    return contents.some((content) =>
      new RegExp(String.raw`\bid\s*=\s*["']${id}["']`).test(content),
    );
  }
  if (selector.startsWith('.')) {
    const className = escapeRegExp(selector.slice(1));
    return contents.some((content) =>
      new RegExp(String.raw`\bclass\s*=\s*["'][^"']*\b${className}\b`).test(content),
    );
  }
  const attribute = selector.match(/^\[([-\w:]+)(?:=(["'])(.*?)\2)?\]$/);
  if (attribute) {
    const name = escapeRegExp(attribute[1]);
    const value = attribute[3] === undefined ? null : escapeRegExp(attribute[3]);
    const pattern =
      value === null
        ? new RegExp(String.raw`<[^>]*\s${name}(?=\s|=|\/?>)`)
        : new RegExp(String.raw`<[^>]*\s${name}\s*=\s*["']${value}["']`);
    return contents.some((content) => pattern.test(content));
  }
  return contents.some((content) => content.includes(`<${selector}`));
}

function runtimeDiagnostics(tree, projectName, project, files) {
  const contents = files.map((file) => ({ file, content: tree.readText(file) }));
  const combined = contents.map((item) => item.content).join('\n');
  const usesKern =
    /from\s+['"]@kern-ui\/angular(?:\/(?!agent(?:\/|$)|testing(?:\/|$)|styles(?:\/|$))[^'"]*)?['"]/.test(
      combined,
    );
  const providerInspections = contents
    .filter(({ file }) => file.endsWith('.ts'))
    .map(({ file, content }) => callOptions(file, content, 'provideKrn'));
  const prepaintInspections = contents
    .filter(({ file }) => file.endsWith('.ts'))
    .map(({ file, content }) => callOptions(file, content, 'applyKrnPrepaintTheme'));
  const providerCalls = providerInspections.flatMap((inspection) => inspection.calls);
  const prepaintCalls = prepaintInspections.flatMap((inspection) => inspection.calls);
  const diagnostics = [];
  const ssr = projectUsesSsr(project);

  if (usesKern && providerCalls.length === 0) {
    diagnostics.push(
      diagnostic(
        ssr ? CODES.ssrRuntimeDefault : CODES.runtimeDefault,
        'info',
        projectName,
        ssr
          ? 'SSR application uses KERN injection-token defaults; provideKrn() is optional but recommended for explicit server/client parity.'
          : 'Application uses KERN zero-config runtime defaults; provideKrn() is optional for owned preferences.',
      ),
    );
  }

  if (providerCalls.length > 1) {
    diagnostics.push(
      diagnostic(
        CODES.providerDuplicate,
        'warning',
        projectName,
        `provideKrn() is registered ${providerCalls.length} times; consolidate application-owned runtime configuration into one provider call.`,
        { count: providerCalls.length },
      ),
    );
  }
  if (
    providerCalls.some((call) => !call.verifiable) ||
    providerInspections.some((inspection) => inspection.indirectReference)
  ) {
    diagnostics.push(
      diagnostic(
        CODES.runtimeUnverifiable,
        'warning',
        projectName,
        'KERN runtime configuration is dynamic or wrapped; doctor cannot verify paint, locale, or overlay-host options.',
      ),
    );
  }
  if (
    prepaintCalls.some((call) => !call.verifiable) ||
    prepaintInspections.some((inspection) => inspection.indirectReference)
  ) {
    diagnostics.push(
      diagnostic(
        CODES.runtimeUnverifiable,
        'warning',
        projectName,
        'KERN prepaint setup is dynamic or wrapped; doctor cannot verify bootstrap ordering.',
      ),
    );
  }

  const mainFile = projectMainFile(project);
  for (const prepaint of prepaintCalls) {
    const content = tree.readText(prepaint.file);
    const bootstrap = content.indexOf('bootstrapApplication(');
    if (bootstrap !== -1 && prepaint.offset > bootstrap) {
      const position = lineAndColumn(content, prepaint.offset);
      diagnostics.push(
        diagnostic(
          CODES.prepaintOrder,
          'error',
          projectName,
          'applyKrnPrepaintTheme() must execute before bootstrapApplication().',
          { file: prepaint.file, line: position.line, column: position.column },
        ),
      );
    }
    const normalizedMain = mainFile ? `/${mainFile.replace(/^\/+/, '')}` : null;
    if (ssr && normalizedMain && prepaint.file !== normalizedMain) {
      diagnostics.push(
        diagnostic(
          CODES.ssrPrepaintLocation,
          'warning',
          projectName,
          'For SSR safety, call applyKrnPrepaintTheme() only from the browser bootstrap module.',
          { file: prepaint.file },
        ),
      );
    }
  }

  const providerOptions = providerCalls[0]?.values ?? {};
  const ownsPaintPreferences = [
    'theme',
    'density',
    'brandColor',
    'persistPreferences',
    'preferenceStorageKey',
  ].some((key) => providerOptions[key] !== undefined);
  if (ownsPaintPreferences && prepaintCalls.length === 0) {
    diagnostics.push(
      diagnostic(
        CODES.prepaintMissing,
        'warning',
        projectName,
        'provideKrn() owns paint preferences but no pre-bootstrap applyKrnPrepaintTheme() call was found.',
      ),
    );
  }

  const overlayHost = providerOptions.overlayHost;
  if (
    typeof overlayHost === 'string' &&
    OVERLAY_MARKERS.test(combined) &&
    !selectorExists(
      overlayHost,
      contents
        .filter((item) => item.file.endsWith('.html') || item.file.endsWith('.ts'))
        .map((item) => item.content),
    )
  ) {
    diagnostics.push(
      diagnostic(
        CODES.overlayHostMissing,
        'warning',
        projectName,
        `Configured overlay host "${overlayHost}" was not found in application templates.`,
        { selector: overlayHost },
      ),
    );
  }

  const locale = providerOptions.locale;
  if (typeof locale === 'string') {
    const localeProvider = combined.match(
      /provide\s*:\s*LOCALE_ID\s*,\s*useValue\s*:\s*['"]([^'"]+)['"]/,
    )?.[1];
    if (localeProvider && localeProvider.toLowerCase() !== locale.toLowerCase()) {
      diagnostics.push(
        diagnostic(
          CODES.localeMismatch,
          'warning',
          projectName,
          `provideKrn locale "${locale}" differs from Angular LOCALE_ID "${localeProvider}".`,
          { kernLocale: locale, angularLocale: localeProvider },
        ),
      );
    }
    if (!/^en(?:-|$)/i.test(locale) && !combined.includes('registerLocaleData(')) {
      diagnostics.push(
        diagnostic(
          CODES.localeDataMissing,
          'info',
          projectName,
          `Locale "${locale}" is configured without registerLocaleData(); add it if Angular locale pipes are used.`,
          { locale },
        ),
      );
    }
  }

  return diagnostics;
}

function analyzeProject(tree, projectName, project) {
  const files = projectFiles(tree, project);
  const diagnostics = [
    ...styleDiagnostics(tree, projectName, project),
    ...importDiagnostics(tree, projectName, files),
    ...runtimeDiagnostics(tree, projectName, project, files),
  ];
  for (const file of files.filter(
    (candidate) => candidate.endsWith('.html') || candidate.endsWith('.ts'),
  )) {
    diagnostics.push(...deprecatedTagDiagnostics(projectName, file, tree.readText(file)));
  }
  return diagnostics;
}

module.exports = {
  analyzeProject,
  peerDiagnostics,
};
