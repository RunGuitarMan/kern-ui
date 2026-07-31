import { readFile } from 'node:fs/promises';

import { parseTemplate } from '@angular/compiler';
import ts from 'typescript';

const packageName = '@kern-ui/angular';
const SEARCH_STOPWORDS = new Set([
  'a',
  'an',
  'and',
  'at',
  'by',
  'display',
  'enter',
  'for',
  'from',
  'in',
  'of',
  'on',
  'or',
  'please',
  'show',
  'side',
  'the',
  'to',
  'with',
]);
const SEARCH_SYNONYM_GROUPS = [
  ['choose', 'pick', 'select', 'selection'],
  ['one', 'single'],
  ['choice', 'choices', 'option', 'options', 'value'],
  ['adjust', 'resize', 'resizable', 'resizing'],
  ['pane', 'panes', 'panel', 'panels'],
  ['busy', 'load', 'loading', 'pending'],
  ['progress', 'progressbar'],
  ['state', 'status'],
  ['backend', 'controlled', 'remote', 'server'],
  ['data-table', 'datatable', 'grid', 'table'],
  ['attach', 'upload', 'uploader'],
  ['many', 'multiple', 'several'],
  ['attachment', 'attachments', 'file', 'files'],
  ['auth', 'authentication', 'verification', 'verify'],
  ['code', 'otp', 'pin', 'token'],
];
const COMPONENT_INTENT_ALIASES = {
  select: ['choose one option', 'pick a single option', 'single choice from known options'],
  'resizable-panels': [
    'resize dashboard panels',
    'adjust split panes',
    'resizable workspace layout',
  ],
  'progress-bar': [
    'show loading progress',
    'display task progress',
    'determinate or indeterminate progress',
  ],
  'status-badge': ['display account status', 'show record status', 'compact semantic status'],
  'data-grid': ['server side table', 'remote data table', 'controlled enterprise grid'],
  'file-upload': ['upload several files', 'attach multiple files', 'validated multi file upload'],
  'verification-code': ['enter verification code', 'one time password input', 'otp code entry'],
};
const SEARCH_SYNONYMS = new Map();

for (const group of SEARCH_SYNONYM_GROUPS) {
  for (const term of group) SEARCH_SYNONYMS.set(term, new Set(group));
}

function normalize(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

function searchTokens(value) {
  return (
    String(value ?? '')
      .replace(/([a-z\d])([A-Z])/g, '$1 $2')
      .toLowerCase()
      .match(/[\p{L}\p{N}]+/gu) ?? []
  );
}

function searchPhrase(value) {
  return searchTokens(value).join(' ');
}

function tokenSet(values) {
  return new Set(values.flatMap((value) => searchTokens(value)));
}

function intersects(left, right) {
  return [...left].some((value) => right.has(value));
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function textResult(value) {
  return {
    content: [
      {
        type: 'text',
        text: typeof value === 'string' ? value : JSON.stringify(value, null, 2),
      },
    ],
    structuredContent: typeof value === 'string' ? { text: value } : value,
  };
}

function errorResult(code, message, details = {}) {
  return {
    isError: true,
    content: [
      {
        type: 'text',
        text: `${code}: ${message}`,
      },
    ],
    structuredContent: {
      error: {
        code,
        message,
        ...details,
      },
    },
  };
}

function indexManifest(manifest) {
  const componentLookup = new Map();
  for (const component of manifest.components) {
    const keys = [component.id, component.name, component.selector, component.symbol];
    for (const key of keys) {
      const normalized = normalize(key);
      if (normalized) componentLookup.set(normalized, component);
    }
  }
  for (const component of manifest.components) {
    const aliases = [
      component.canonicalSymbol,
      ...component.aliases.symbols,
      ...component.aliases.selectors,
      ...component.aliases.componentIds,
    ];
    for (const key of aliases) {
      const normalized = normalize(key);
      if (normalized && !componentLookup.has(normalized))
        componentLookup.set(normalized, component);
    }
  }
  const symbolLookup = new Map();
  for (const symbol of manifest.symbols) {
    for (const name of [symbol.name, ...symbol.aliases]) {
      symbolLookup.set(name, symbol);
    }
  }
  return { componentLookup, symbolLookup };
}

function issue(severity, code, message, fix, component) {
  return {
    severity,
    code,
    message,
    fix,
    documentation: component ? component.documentation.markdown : 'checklist.md',
  };
}

function importedSymbols(code) {
  const sourceFile = ts.createSourceFile(
    'kern-consumer-usage.ts',
    code,
    ts.ScriptTarget.Latest,
    false,
    ts.ScriptKind.TS,
  );
  const imports = [];
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) {
      continue;
    }
    const importClause = statement.importClause;
    const bindings = importClause?.namedBindings;
    if (!bindings || !ts.isNamedImports(bindings)) continue;
    for (const element of bindings.elements) {
      imports.push({
        exported: element.propertyName?.text ?? element.name.text,
        local: element.name.text,
        from: statement.moduleSpecifier.text,
        typeOnly: Boolean(importClause.isTypeOnly || element.isTypeOnly),
      });
    }
  }
  return imports;
}

function propertyName(property) {
  return ts.isIdentifier(property.name) || ts.isStringLiteralLike(property.name)
    ? property.name.text
    : null;
}

function staticDeclarations(sourceFile) {
  const declarations = new Map();
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.initializer) {
        declarations.set(declaration.name.text, declaration.initializer);
      }
    }
  }
  return declarations;
}

function staticString(expression, declarations, seen = new Set()) {
  if (ts.isStringLiteralLike(expression) || ts.isNoSubstitutionTemplateLiteral(expression)) {
    return expression.text;
  }
  if (!ts.isIdentifier(expression) || seen.has(expression.text)) return null;
  const initializer = declarations.get(expression.text);
  if (!initializer) return null;
  seen.add(expression.text);
  return staticString(initializer, declarations, seen);
}

function staticImportNames(expression, declarations, seen = new Set()) {
  if (ts.isIdentifier(expression)) {
    if (seen.has(expression.text)) return new Set();
    const initializer = declarations.get(expression.text);
    if (!initializer) return new Set([expression.text]);
    seen.add(expression.text);
    return staticImportNames(initializer, declarations, seen);
  }
  if (ts.isParenthesizedExpression(expression)) {
    return staticImportNames(expression.expression, declarations, seen);
  }
  if (!ts.isArrayLiteralExpression(expression)) return new Set();

  const names = new Set();
  for (const element of expression.elements) {
    const candidate = ts.isSpreadElement(element) ? element.expression : element;
    for (const name of staticImportNames(candidate, declarations, new Set(seen))) {
      names.add(name);
    }
  }
  return names;
}

function componentScopes(code, imports) {
  const sourceFile = ts.createSourceFile(
    'kern-consumer-usage.ts',
    code,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const declarations = staticDeclarations(sourceFile);
  const componentDecoratorNames = new Set(
    imports
      .filter(
        (entry) =>
          entry.exported === 'Component' && entry.from === '@angular/core' && !entry.typeOnly,
      )
      .map((entry) => entry.local),
  );
  const scopes = [];

  const visit = (node) => {
    if (ts.isClassDeclaration(node)) {
      for (const decorator of ts.canHaveDecorators(node) ? (ts.getDecorators(node) ?? []) : []) {
        if (
          !ts.isCallExpression(decorator.expression) ||
          !ts.isIdentifier(decorator.expression.expression) ||
          !componentDecoratorNames.has(decorator.expression.expression.text)
        ) {
          continue;
        }
        const metadata = decorator.expression.arguments[0];
        if (!metadata || !ts.isObjectLiteralExpression(metadata)) continue;

        let template = null;
        let templateUrl = null;
        let importNames = new Set();
        let importsDeclared = false;
        for (const property of metadata.properties) {
          const name = propertyName(property);
          if (name === 'template' && ts.isPropertyAssignment(property)) {
            template = staticString(property.initializer, declarations);
          } else if (name === 'templateUrl' && ts.isPropertyAssignment(property)) {
            templateUrl = staticString(property.initializer, declarations);
          } else if (name === 'imports') {
            importsDeclared = true;
            const expression = ts.isPropertyAssignment(property)
              ? property.initializer
              : ts.isShorthandPropertyAssignment(property)
                ? declarations.get(property.name.text)
                : null;
            if (expression) importNames = staticImportNames(expression, declarations);
          }
        }
        scopes.push({
          className: node.name?.text ?? '(anonymous component)',
          template,
          templateUrl,
          importNames,
          importsDeclared,
        });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);

  return {
    scopes,
    parseErrors: (sourceFile.parseDiagnostics ?? []).map((diagnostic) =>
      ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
    ),
  };
}

function templateElements(template, sourceName) {
  const parsed = parseTemplate(template, sourceName, {
    preserveWhitespaces: false,
    preserveLineEndings: true,
  });
  const elements = [];
  const visit = (node) => {
    if (Array.isArray(node?.attributes) && Array.isArray(node?.inputs)) {
      elements.push(node);
    }
    for (const value of Object.values(node ?? {})) {
      if (!Array.isArray(value)) continue;
      for (const child of value) {
        if (child && typeof child === 'object' && child.sourceSpan) visit(child);
      }
    }
  };
  for (const node of parsed.nodes) visit(node);
  return {
    elements,
    errors: (parsed.errors ?? []).map((error) => error.toString()),
  };
}

function elementBindingNames(element) {
  return new Set([
    ...(element.attributes ?? []).map((attribute) => attribute.name),
    ...(element.inputs ?? []).map((input) => input.name),
  ]);
}

function matchesSelector(element, selector) {
  const compound = /^(?:([-\w:]+))?((?:\[[-\w:]+\])*)$/.exec(selector.trim());
  if (!compound) return false;

  const [, elementName, attributeSource] = compound;
  if (elementName && element.name !== elementName) return false;

  const bindings = elementBindingNames(element);
  const attributes = [...attributeSource.matchAll(/\[([-\w:]+)\]/g)].map(
    (match) => match[1],
  );
  return attributes.every((attribute) => bindings.has(attribute));
}

function targetElements(template, sourceName, selectors) {
  const parsed = templateElements(template, sourceName);
  return {
    elements: parsed.elements.filter((element) =>
      selectors.some((selector) => matchesSelector(element, selector)),
    ),
    errors: parsed.errors,
  };
}

function hasBinding(element, name) {
  return elementBindingNames(element).has(name);
}

function bindingExpression(element, name) {
  return element.inputs?.find((input) => input.name === name)?.value?.source ?? '';
}

function lifecycleCounts(components) {
  return Object.fromEntries(
    ['stable', 'beta', 'experimental', 'recipe', 'deprecated'].map((status) => [
      status,
      components.filter((component) => component.lifecycle.status === status).length,
    ]),
  );
}

export async function loadManifest(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

export function createKernAgentApi(manifest) {
  const { componentLookup, symbolLookup } = indexManifest(manifest);

  function resolveComponent(reference) {
    return componentLookup.get(normalize(reference));
  }

  function getOverview() {
    const categories = Object.fromEntries(
      unique(manifest.components.map((component) => component.category)).map((category) => [
        category,
        manifest.components.filter((component) => component.category === category).length,
      ]),
    );
    return {
      package: manifest.library.package,
      version: manifest.library.version,
      schemaVersion: manifest.schemaVersion,
      framework: manifest.library.framework,
      requiredStyles: manifest.library.requiredStyles,
      configuration: manifest.library.configuration,
      entrypoints: manifest.library.entrypoints,
      totals: {
        components: manifest.components.length,
        publicSymbolGroups: manifest.symbols.length,
        recipes: manifest.recipes.length,
        migrations: manifest.migrations.length,
      },
      lifecycle: lifecycleCounts(manifest.components),
      categories,
      startHere: [
        'Use search_components with a task or domain term.',
        'Read get_component_contract before writing markup.',
        'Use get_example for the canonical owner import and required inputs.',
        'Run validate_usage before compiling.',
      ],
    };
  }

  function searchComponents(args = {}) {
    const query = normalize(args.query);
    const queryPhrase = searchPhrase(args.query);
    const terms = searchTokens(args.query).filter((term) => !SEARCH_STOPWORDS.has(term));
    const concepts = terms.map((term) => SEARCH_SYNONYMS.get(term) ?? new Set([term]));
    const category = normalize(args.category);
    const lifecycle = normalize(args.lifecycle);
    const requestedLimit = Number(args.limit ?? 20);
    const limit = Number.isFinite(requestedLimit)
      ? Math.max(1, Math.min(Math.trunc(requestedLimit), 100))
      : 20;
    const matches = [];
    for (const component of manifest.components) {
      if (category && normalize(component.category) !== category) continue;
      if (lifecycle && normalize(component.lifecycle.status) !== lifecycle) continue;
      const exactKeys = [
        component.id,
        component.name,
        component.selector,
        component.symbol,
        component.canonicalSymbol,
        ...component.aliases.symbols,
        ...component.aliases.selectors,
      ].map(normalize);
      const intentAliases = COMPONENT_INTENT_ALIASES[component.id] ?? [];
      const exactKeyTokens = tokenSet(exactKeys);
      const keywordTokens = tokenSet(component.keywords);
      const intentTokens = tokenSet(intentAliases);
      const broadTokens = tokenSet([
        ...exactKeys,
        component.summary,
        component.category,
        component.guidance.useWhen,
        component.guidance.avoidWhen,
        ...component.keywords,
        ...component.related,
      ]);
      const keywordPhrases = component.keywords.map(searchPhrase);
      const intentPhrases = intentAliases.map(searchPhrase);
      let score = 0;
      let matchedConcepts = 0;
      for (const concept of concepts) {
        let conceptScore = 0;
        if (intersects(concept, exactKeyTokens)) conceptScore = 45;
        if (intersects(concept, keywordTokens)) conceptScore = Math.max(conceptScore, 34);
        if (intersects(concept, intentTokens)) conceptScore = Math.max(conceptScore, 40);
        if (intersects(concept, broadTokens)) conceptScore = Math.max(conceptScore, 12);
        if (conceptScore > 0) {
          matchedConcepts += 1;
          score += conceptScore;
        }
      }
      if (concepts.length > 0 && matchedConcepts === 0) continue;
      if (query && exactKeys.includes(query)) score += 600;
      if (queryPhrase && intentPhrases.includes(queryPhrase)) score += 500;
      if (queryPhrase && keywordPhrases.includes(queryPhrase)) score += 180;
      if (query && normalize(component.name).startsWith(query)) score += 80;
      if (concepts.length > 0) {
        score += Math.round((matchedConcepts / concepts.length) * 120);
        if (matchedConcepts === concepts.length) score += 40;
      }
      score += component.lifecycle.status === 'stable' ? 2 : 0;
      matches.push({
        id: component.id,
        name: component.name,
        selector: component.selector,
        symbol: component.symbol,
        importPath: component.importPath,
        category: component.category,
        lifecycle: component.lifecycle.status,
        summary: component.summary,
        related: component.related,
        score,
      });
    }
    return {
      query: args.query ?? '',
      total: matches.length,
      results: matches
        .sort((left, right) => right.score - left.score || left.name.localeCompare(right.name))
        .slice(0, limit)
        .map(({ score, ...match }) => match),
    };
  }

  function getComponentContract(args = {}) {
    const component = resolveComponent(args.component);
    if (!component) {
      return errorResult(
        'KRN_MCP_COMPONENT_NOT_FOUND',
        `Unknown component reference "${args.component ?? ''}".`,
        { suggestion: 'Call search_components first.' },
      );
    }
    return textResult(component);
  }

  function getExample(args = {}) {
    const component = resolveComponent(args.component);
    if (!component) {
      return errorResult(
        'KRN_MCP_COMPONENT_NOT_FOUND',
        `Unknown component reference "${args.component ?? ''}".`,
        { suggestion: 'Call search_components first.' },
      );
    }
    const example = args.exampleId
      ? component.examples.find((candidate) => candidate.id === args.exampleId)
      : component.examples[0];
    if (!example) {
      return errorResult(
        'KRN_MCP_EXAMPLE_NOT_FOUND',
        `Component "${component.id}" has no example "${args.exampleId}".`,
        { available: component.examples.map((candidate) => candidate.id) },
      );
    }
    return textResult({
      component: component.id,
      importPath: component.importPath,
      symbol: component.symbol,
      example,
    });
  }

  function getRecipe(args = {}) {
    if (!args.recipe) {
      return textResult({
        recipes: manifest.recipes.map(({ id, title, summary, components }) => ({
          id,
          title,
          summary,
          components,
        })),
      });
    }
    const query = normalize(args.recipe);
    const recipe = manifest.recipes.find(
      (candidate) => normalize(candidate.id) === query || normalize(candidate.title) === query,
    );
    return recipe
      ? textResult(recipe)
      : errorResult('KRN_MCP_RECIPE_NOT_FOUND', `Unknown recipe "${args.recipe}".`, {
          available: manifest.recipes.map((candidate) => candidate.id),
        });
  }

  function getMigration(args = {}) {
    const component = normalize(args.component);
    const migrations = manifest.migrations.filter((migration) => {
      if (args.from && migration.from !== args.from) return false;
      if (args.to && migration.to !== args.to) return false;
      if (
        component &&
        !migration.components.some((candidate) => normalize(candidate) === component)
      ) {
        return false;
      }
      return true;
    });
    return textResult({
      from: args.from ?? null,
      to: args.to ?? null,
      component: args.component ?? null,
      migrations,
      message: migrations.length
        ? 'Review every matching migration before changing consumer code.'
        : 'No migration is registered for this range. Root imports remain supported compatibility API.',
    });
  }

  function validateUsage(args = {}) {
    const component = resolveComponent(args.component);
    if (!component) {
      return errorResult(
        'KRN_MCP_COMPONENT_NOT_FOUND',
        `Unknown component reference "${args.component ?? ''}".`,
        { suggestion: 'Call search_components first.' },
      );
    }
    const code = String(args.code ?? '');
    const stylesConfigured =
      typeof args.stylesConfigured === 'boolean' ? args.stylesConfigured : undefined;
    const suppliedTemplate =
      typeof args.template === 'string' && args.template.trim() ? args.template : null;
    const explicitImports = Array.isArray(args.imports)
      ? args.imports.map((entry) => {
          const normalized =
            typeof entry === 'string' ? { symbol: component.symbol, from: entry } : entry;
          return {
            exported: normalized.exported ?? normalized.symbol,
            local: normalized.local ?? normalized.symbol,
            from: normalized.from,
            typeOnly: Boolean(normalized.typeOnly),
          };
        })
      : [];
    const imports = [...importedSymbols(code), ...explicitImports];
    const issues = [];

    const deepImports = imports.filter(
      (entry) =>
        entry.from.startsWith(`${packageName}/`) &&
        !manifest.library.entrypoints.includes(entry.from) &&
        !entry.from.startsWith(`${packageName}/testing`),
    );
    for (const entry of deepImports) {
      issues.push(
        issue(
          'error',
          'KRN_USAGE_DEEP_IMPORT',
          `"${entry.from}" is not a supported KERN runtime entrypoint.`,
          `Import ${entry.exported} from ${component.importPath}.`,
          component,
        ),
      );
    }

    const componentImports = imports.filter(
      (entry) =>
        [component.symbol, component.canonicalSymbol, ...component.aliases.symbols].includes(
          entry.exported,
        ) &&
        !entry.typeOnly &&
        (entry.from === component.importPath || entry.from === packageName),
    );
    const componentImport =
      componentImports.find((entry) => entry.from === component.importPath) ?? componentImports[0];
    if (!componentImport) {
      issues.push(
        issue(
          'error',
          'KRN_USAGE_MISSING_IMPORT',
          `No supported import for ${component.symbol} was found.`,
          `Add: import { ${component.symbol} } from '${component.importPath}';`,
          component,
        ),
      );
    } else if (componentImport.from === packageName) {
      issues.push(
        issue(
          'warning',
          'KRN_USAGE_ROOT_IMPORT',
          'The package root is supported compatibility API, but the owner entrypoint is more explicit.',
          `Prefer ${component.importPath} for new code.`,
          component,
        ),
      );
    }

    const sourceContract = componentScopes(code, imports);
    if (sourceContract.parseErrors.length > 0) {
      issues.push(
        issue(
          'error',
          'KRN_USAGE_TYPESCRIPT_PARSE',
          `Consumer source could not be parsed: ${sourceContract.parseErrors[0]}`,
          'Provide valid TypeScript containing a standalone @Component, or pass template plus explicit imports.',
          component,
        ),
      );
    }

    let scopes = sourceContract.scopes;
    if (suppliedTemplate) {
      if (scopes.length === 1) {
        scopes = [{ ...scopes[0], template: suppliedTemplate }];
      } else if (scopes.length === 0) {
        scopes = [
          {
            className: '(supplied template)',
            template: suppliedTemplate,
            templateUrl: null,
            importNames: new Set(explicitImports.map((entry) => entry.local)),
            importsDeclared: explicitImports.length > 0,
          },
        ];
      } else {
        issues.push(
          issue(
            'error',
            'KRN_USAGE_TEMPLATE_SCOPE',
            'A supplied template cannot be assigned unambiguously because the source declares multiple components.',
            'Pass one component source at a time, including its template and imports metadata.',
            component,
          ),
        );
        scopes = [];
      }
    } else if (scopes.length === 0) {
      issues.push(
        issue(
          'error',
          'KRN_USAGE_COMPONENT_METADATA',
          'No statically analyzable Angular @Component usage was found.',
          'Provide a standalone @Component with inline template/imports, or pass template plus explicit imports.',
          component,
        ),
      );
    }

    const selectors = unique([component.selector, ...component.aliases.selectors]);
    const targetScopes = [];
    for (const scope of scopes) {
      if (scope.template === null) {
        issues.push(
          issue(
            'error',
            'KRN_USAGE_TEMPLATE_UNAVAILABLE',
            `${scope.className} uses an external or dynamic template that validate_usage cannot inspect.`,
            'Pass the exact template in the template argument together with this component source.',
            component,
          ),
        );
        continue;
      }
      const target = targetElements(scope.template, scope.className, selectors);
      if (target.errors.length > 0) {
        issues.push(
          issue(
            'error',
            'KRN_USAGE_TEMPLATE_PARSE',
            `${scope.className} template could not be parsed: ${target.errors[0]}`,
            'Fix the Angular template syntax before validating the KERN contract.',
            component,
          ),
        );
        continue;
      }
      if (target.elements.length > 0) targetScopes.push({ ...scope, elements: target.elements });
    }

    if (scopes.length > 0 && targetScopes.length === 0) {
      issues.push(
        issue(
          'error',
          'KRN_USAGE_SELECTOR_MISSING',
          `No ${selectors.join(' or ')} usage was found in the inspected component template.`,
          `Render ${component.selector} in the template being validated.`,
          component,
        ),
      );
    }

    const componentLocals = new Set(componentImports.map((entry) => entry.local));
    for (const scope of targetScopes) {
      if (
        !scope.importsDeclared ||
        ![...componentLocals].some((local) => scope.importNames.has(local))
      ) {
        issues.push(
          issue(
            'error',
            'KRN_USAGE_COMPONENT_IMPORTS',
            `${component.symbol} is not wired into ${scope.className} @Component.imports.`,
            `Add the imported runtime symbol to ${scope.className} imports.`,
            component,
          ),
        );
      }
    }

    if (stylesConfigured === false) {
      issues.push(
        issue(
          'error',
          'KRN_USAGE_MISSING_STYLES',
          'The complete KERN component stylesheet is not configured.',
          `Load ${manifest.library.requiredStyles} exactly once in global styles.`,
          component,
        ),
      );
    } else if (stylesConfigured === undefined) {
      issues.push(
        issue(
          'warning',
          'KRN_USAGE_STYLES_UNVERIFIED',
          'Global KERN stylesheet configuration was not supplied and could not be verified.',
          `Confirm that ${manifest.library.requiredStyles} is loaded exactly once, then call validate_usage with stylesConfigured: true.`,
          component,
        ),
      );
    }

    for (const input of component.api.filter(
      (member) => member.kind === 'input' && member.required,
    )) {
      const missingCount = targetScopes.reduce(
        (count, scope) =>
          count + scope.elements.filter((element) => !hasBinding(element, input.name)).length,
        0,
      );
      if (missingCount > 0) {
        issues.push(
          issue(
            'error',
            'KRN_USAGE_REQUIRED_INPUT',
            `Required input "${input.name}" is missing from ${missingCount} ${component.selector} usage(s).`,
            `Bind ${input.name} using the component contract and minimal example.`,
            component,
          ),
        );
      }
    }

    const reactiveFormsImports = imports.filter(
      (entry) =>
        entry.exported === 'ReactiveFormsModule' &&
        !entry.typeOnly &&
        entry.from === '@angular/forms',
    );
    if (component.forms.controlValueAccessor) {
      for (const scope of targetScopes) {
        const usesReactiveForms = scope.elements.some(
          (element) => hasBinding(element, 'formControl') || hasBinding(element, 'formControlName'),
        );
        if (
          usesReactiveForms &&
          (reactiveFormsImports.length === 0 ||
            !reactiveFormsImports.some((entry) => scope.importNames.has(entry.local)))
        ) {
          issues.push(
            issue(
              'error',
              'KRN_USAGE_REACTIVE_FORMS_IMPORT',
              `Reactive form binding in ${scope.className} is not wired through ReactiveFormsModule in @Component.imports.`,
              "Import ReactiveFormsModule from '@angular/forms' and add it to the standalone component imports.",
              component,
            ),
          );
        }
      }
    }

    if (
      ['data-grid', 'data-table'].includes(component.id) &&
      targetScopes.some((scope) =>
        scope.elements.some((element) =>
          /(?:^|\W)(?:index|\$index)(?:\W|$)/.test(bindingExpression(element, 'rowIdentity')),
        ),
      )
    ) {
      issues.push(
        issue(
          'warning',
          'KRN_USAGE_UNSTABLE_IDENTITY',
          'Array index appears to be used as persistent Data Grid row identity.',
          'Return a stable unique domain key whenever rows can sort, filter or refresh.',
          component,
        ),
      );
    }

    if (component.forms.controlValueAccessor && args.providerConfigured === false) {
      // Intentionally no issue: provideKrn is optional and Angular Forms providers are component-owned.
    }

    const errors = issues.filter((candidate) => candidate.severity === 'error');
    const verificationRequired =
      stylesConfigured === undefined
        ? [
            `Verify that ${manifest.library.requiredStyles} is loaded exactly once in consumer global styles.`,
          ]
        : [];
    const checked = [
      'supported import path',
      'component selector and standalone imports wiring',
      'required inputs on each matching template element',
      'reactive forms module import and component wiring when applicable',
      'selected component-specific identity rules',
    ];
    if (stylesConfigured === true) {
      checked.push(`required global stylesheet ${manifest.library.requiredStyles}`);
    }
    const notChecked = [
      'Angular AOT template type-checking',
      'runtime behavior',
      'visual rendering',
      'manual assistive-technology behavior',
    ];
    if (stylesConfigured === undefined) {
      notChecked.unshift('consumer global stylesheet configuration');
    }
    return textResult({
      component: component.id,
      valid: errors.length === 0,
      issues,
      verificationRequired,
      summary: errors.length
        ? `${errors.length} blocking contract issue(s) found.`
        : verificationRequired.length
          ? 'Usage passes structural checks, but required global stylesheet configuration remains unverified.'
          : issues.length
            ? 'Usage is structurally valid with non-blocking guidance.'
            : 'Usage satisfies the checked public contract.',
      checked,
      notChecked,
    });
  }

  function callTool(name, args = {}) {
    switch (name) {
      case 'get_overview':
        return textResult(getOverview());
      case 'search_components':
        return textResult(searchComponents(args));
      case 'get_component_contract':
        return getComponentContract(args);
      case 'get_example':
        return getExample(args);
      case 'get_recipe':
        return getRecipe(args);
      case 'get_migration':
        return getMigration(args);
      case 'validate_usage':
        return validateUsage(args);
      default:
        return errorResult('KRN_MCP_TOOL_NOT_FOUND', `Unknown tool "${name}".`, {
          available: toolDefinitions.map((tool) => tool.name),
        });
    }
  }

  return {
    manifest,
    componentLookup,
    symbolLookup,
    getOverview,
    searchComponents,
    resolveComponent,
    callTool,
  };
}

export const toolDefinitions = [
  {
    name: 'get_overview',
    description:
      'Return KERN setup, entrypoints, lifecycle totals, categories and the recommended agent workflow.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {},
    },
  },
  {
    name: 'search_components',
    description:
      'Search KERN components by task, name, selector, symbol, API, category, lifecycle or related concept.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        query: { type: 'string' },
        category: { type: 'string' },
        lifecycle: {
          enum: ['stable', 'beta', 'experimental', 'recipe', 'deprecated'],
        },
        limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
      },
    },
  },
  {
    name: 'get_component_contract',
    description:
      'Return one complete component contract by id, name, selector, canonical symbol or alias.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['component'],
      properties: {
        component: { type: 'string', minLength: 1 },
      },
    },
  },
  {
    name: 'get_example',
    description:
      'Return a component example with the canonical owner import and verification state.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['component'],
      properties: {
        component: { type: 'string', minLength: 1 },
        exampleId: { type: 'string' },
      },
    },
  },
  {
    name: 'get_recipe',
    description: 'List recipes or return a complete enterprise usage recipe by id or title.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        recipe: { type: 'string' },
      },
    },
  },
  {
    name: 'get_migration',
    description:
      'Return registered migration guidance for a version range and optional component. Never invents a migration.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        from: { type: 'string' },
        to: { type: 'string' },
        component: { type: 'string' },
      },
    },
  },
  {
    name: 'validate_usage',
    description:
      'Read-only structural validation of KERN imports, required inputs, stylesheet state, Angular Forms wiring and selected identity rules.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['component'],
      properties: {
        component: { type: 'string', minLength: 1 },
        code: { type: 'string' },
        template: { type: 'string' },
        imports: {
          type: 'array',
          items: {
            anyOf: [
              { type: 'string' },
              {
                type: 'object',
                additionalProperties: false,
                required: ['symbol', 'from'],
                properties: {
                  symbol: { type: 'string' },
                  from: { type: 'string' },
                },
              },
            ],
          },
        },
        stylesConfigured: {
          type: 'boolean',
          description:
            'Set true only after confirming required global styles, false when absent, or omit to receive an explicit unverified warning.',
        },
        providerConfigured: {
          type: 'boolean',
          description: 'Informational only: provideKrn is optional because KERN has root defaults.',
        },
      },
    },
  },
];
