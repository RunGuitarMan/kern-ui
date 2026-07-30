import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

import { format, resolveConfig } from 'prettier';
import ts from 'typescript';

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const packageName = '@kern-ui/angular';
const schemaVersion = '1.2.0';
const writeMode = process.argv.includes('--write');
const verboseMode = process.argv.includes('--verbose');

const paths = {
  packageJson: resolve(workspaceRoot, 'projects/kern/package.json'),
  tsconfig: resolve(workspaceRoot, 'projects/kern/tsconfig.lib.json'),
  runtimeEntrypoints: resolve(workspaceRoot, 'projects/kern/api/runtime-entrypoints.json'),
  testingPublicApi: resolve(workspaceRoot, 'projects/kern/testing/src/public-api.ts'),
  catalog: resolve(workspaceRoot, 'projects/showcase/src/lib/catalog.ts'),
  playground: resolve(workspaceRoot, 'projects/showcase/specimen/src/lib/playground.ts'),
  schema: resolve(workspaceRoot, 'metadata/agent/schema/component-manifest.schema.json'),
  overrides: resolve(workspaceRoot, 'metadata/agent/curated/component-overrides.json'),
  nonStableContracts: resolve(workspaceRoot, 'metadata/agent/curated/non-stable-contracts.json'),
  recipes: resolve(workspaceRoot, 'metadata/agent/curated/recipes.json'),
  migrations: resolve(workspaceRoot, 'metadata/agent/curated/migrations.json'),
  examplesIndex: resolve(workspaceRoot, 'metadata/agent/examples/index.json'),
  examplesRoot: resolve(workspaceRoot, 'metadata/agent/examples'),
  recipesRoot: resolve(workspaceRoot, 'metadata/agent/recipes'),
  lifecycle: resolve(workspaceRoot, 'projects/kern/api/lifecycle.json'),
  generated: resolve(workspaceRoot, 'metadata/agent/generated'),
  packageAgent: resolve(workspaceRoot, 'projects/kern/agent'),
};

const typeFormatFlags =
  ts.TypeFormatFlags.NoTruncation |
  ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope |
  ts.TypeFormatFlags.WriteArrayAsGenericType;

const lifecycleDescriptions = {
  stable: 'Supported contract; the documented compatibility policy applies.',
  beta: 'Available for controlled production evaluation; the contract may still be refined.',
  experimental: 'Early contract that may change in a pre-1.0 minor release.',
  recipe: 'Adaptable composition whose primitive dependencies have their own lifecycle.',
  deprecated: 'Temporarily supported while consumers move to the documented replacement.',
};

const promotionCriteria = [
  'Public API, defaults, aliases and entrypoint ownership are reviewed.',
  'SSR/hydration, keyboard, accessibility and visual evidence are linked.',
  'Runtime scale limits and consumer testing contract are documented.',
  'Migration impact is classified before lifecycle promotion.',
];

const genericChecklist = [
  'Import the symbol from its documented owner entrypoint; do not use a deep source import.',
  "Load @kern-ui/angular/styles/kern.css exactly once in the application's global styles.",
  'Provide every required input and keep collection identities stable across updates.',
  'Verify keyboard, focus, visible labels, invalid state, long text, RTL and 200% zoom.',
  'Test the consuming SSR/hydration route when server rendering is enabled.',
  'Use @kern-ui/angular/testing harnesses when a component-specific harness is available.',
];

const genericMistakes = [
  'Importing from an undeclared family path or a source implementation file.',
  'Loading only tokens.css instead of the complete styles/kern.css component bundle.',
  'Assuming the documentation SSR build replaces validation of the consuming application.',
];

const playgroundFixtureEffectModes = new Map([
  ['layout', new Set(['alternate', 'constrained', 'expanded', 'overflow'])],
  [
    'content',
    new Set(['alternate', 'empty', 'filled', 'long-text', 'with-action', 'without-action']),
  ],
  [
    'data',
    new Set([
      'alternate',
      'empty',
      'error',
      'filtered',
      'loading',
      'selected',
      'sorted',
      'success',
      'virtualized',
    ]),
  ],
  ['status', new Set(['danger', 'info', 'neutral', 'success', 'warning'])],
]);
const playgroundFixtureEffectFields = new Set(['kind', 'mode', 'label', 'description']);

function normalizePath(value) {
  return value.split(sep).join('/');
}

function unique(values) {
  return [
    ...new Set(values.filter((value) => value !== undefined && value !== null && value !== '')),
  ];
}

function compareStrings(left, right) {
  return left.localeCompare(right, 'en');
}

function json(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function pascalCase(value) {
  return value
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => {
      const normalized = part.length > 1 && /^[A-Z0-9]+$/.test(part) ? part.toLowerCase() : part;
      return `${normalized[0]?.toUpperCase() ?? ''}${normalized.slice(1)}`;
    })
    .join('');
}

function sourceDigest(values) {
  const hash = createHash('sha256');
  for (const value of values) {
    hash.update(value);
    hash.update('\0');
  }
  return `sha256-${hash.digest('hex')}`;
}

function contentDigest(value) {
  return `sha256-${createHash('sha256').update(value).digest('hex')}`;
}

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

async function compiledRecipes(curatedRecipes) {
  const ids = new Set();
  const recipes = [];
  for (const recipe of curatedRecipes) {
    if (ids.has(recipe.id)) throw new Error(`Duplicate curated recipe id "${recipe.id}".`);
    ids.add(recipe.id);
    const expectedSource = `recipes/${recipe.id}.ts`;
    if (recipe.source !== expectedSource) {
      throw new Error(
        `Recipe "${recipe.id}" must use the deterministic source path "${expectedSource}".`,
      );
    }
    const code = await readFile(resolve(paths.recipesRoot, `${recipe.id}.ts`), 'utf8');
    if (!/@Component\s*\(/.test(code) || !/\bstandalone:\s*true\b/.test(code)) {
      throw new Error(`Recipe "${recipe.id}" is not an explicit standalone Angular fixture.`);
    }
    if (!/\bvoid bootstrapApplication\s*\(/.test(code)) {
      throw new Error(`Recipe "${recipe.id}" is not a runnable bootstrap fixture.`);
    }
    if (
      /TODO|replace this|implement here|Set childrenState|Cancel the previous request|KERN-owned nested overlays coordinate|\breportError\s*\(|\bwindow\.|\bconsole\.(?:log|info|debug)\s*\(/.test(
        code,
      )
    ) {
      throw new Error(`Recipe "${recipe.id}" contains placeholder or unsafe runtime logic.`);
    }
    recipes.push({
      ...recipe,
      source: expectedSource,
      verification: 'packed-package-aot',
      sourceDigest: contentDigest(code),
      code,
    });
  }
  return recipes;
}

function compilerConfig(configPath) {
  const loaded = ts.readConfigFile(configPath, ts.sys.readFile);
  if (loaded.error) {
    throw new Error(ts.flattenDiagnosticMessageText(loaded.error.messageText, '\n'));
  }
  return ts.parseJsonConfigFileContent(loaded.config, ts.sys, dirname(configPath), {
    noEmit: true,
  });
}

function createCompiler(entrypoints) {
  const parsed = compilerConfig(paths.tsconfig);
  const testingFiles = ts.sys.readDirectory(
    dirname(paths.testingPublicApi),
    ['.ts'],
    ['**/*.spec.ts'],
    ['**/*.ts'],
  );
  const rootNames = unique([
    ...parsed.fileNames.map((path) => resolve(path)),
    ...testingFiles.map((path) => resolve(path)),
    ...entrypoints.map((entrypoint) => resolve(workspaceRoot, entrypoint.publicApi)),
  ]);
  const program = ts.createProgram({
    rootNames,
    options: {
      ...parsed.options,
      noEmit: true,
      skipLibCheck: true,
    },
  });
  const diagnostics = ts
    .getPreEmitDiagnostics(program)
    .filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error);
  if (diagnostics.length > 0) {
    const formatted = ts.formatDiagnosticsWithColorAndContext(diagnostics.slice(0, 20), {
      getCurrentDirectory: () => workspaceRoot,
      getCanonicalFileName: (path) => path,
      getNewLine: () => '\n',
    });
    throw new Error(
      `Cannot generate the KERN agent contract from an invalid program:\n${formatted}`,
    );
  }
  return { program, checker: program.getTypeChecker() };
}

function resolveAlias(checker, symbol) {
  return symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
}

function symbolKind(symbol) {
  if (symbol.flags & ts.SymbolFlags.Class) return 'class';
  if (symbol.flags & ts.SymbolFlags.Interface) return 'interface';
  if (symbol.flags & ts.SymbolFlags.TypeAlias) return 'type';
  if (symbol.flags & ts.SymbolFlags.Function) return 'function';
  if (symbol.flags & ts.SymbolFlags.Enum) return 'enum';
  if (symbol.flags & (ts.SymbolFlags.Variable | ts.SymbolFlags.BlockScopedVariable))
    return 'constant';
  return 'unknown';
}

function symbolDescription(checker, symbol) {
  return ts.displayPartsToString(symbol.getDocumentationComment(checker)).trim();
}

function isDeprecated(symbol) {
  return symbol.getJsDocTags().some((tag) => tag.name === 'deprecated');
}

function declarationType(checker, symbol, declaration) {
  if (!declaration) return symbol.getName();
  try {
    if (symbol.flags & ts.SymbolFlags.Class) return `class ${symbol.getName()}`;
    if (symbol.flags & ts.SymbolFlags.Interface) return `interface ${symbol.getName()}`;
    if (symbol.flags & ts.SymbolFlags.TypeAlias) {
      const type = checker.getDeclaredTypeOfSymbol(symbol);
      return checker.typeToString(type, declaration, typeFormatFlags);
    }
    const type = checker.getTypeOfSymbolAtLocation(symbol, declaration);
    return checker.typeToString(type, declaration, typeFormatFlags);
  } catch {
    return symbol.getName();
  }
}

function publicSymbols(checker, program, entrypoints) {
  const records = [];
  const targetKeys = new Map();
  let nextTargetKey = 0;

  for (const entrypoint of entrypoints) {
    const sourceFile = program.getSourceFile(resolve(workspaceRoot, entrypoint.publicApi));
    if (!sourceFile) {
      throw new Error(`Missing public API source ${entrypoint.publicApi}`);
    }
    const moduleSymbol = checker.getSymbolAtLocation(sourceFile);
    if (!moduleSymbol) {
      throw new Error(`Cannot inspect public API module ${entrypoint.publicApi}`);
    }
    const grouped = new Map();
    for (const exported of checker.getExportsOfModule(moduleSymbol)) {
      const target = resolveAlias(checker, exported);
      let targetKey = targetKeys.get(target);
      if (targetKey === undefined) {
        targetKey = nextTargetKey++;
        targetKeys.set(target, targetKey);
      }
      const groupKey = `${entrypoint.name}:${targetKey}`;
      const group = grouped.get(groupKey) ?? { target, exportNames: [] };
      group.exportNames.push(exported.getName());
      grouped.set(groupKey, group);
    }

    for (const { target, exportNames } of grouped.values()) {
      const declaration = target.valueDeclaration ?? target.declarations?.[0];
      const targetName = target.getName();
      const name = exportNames.includes(targetName)
        ? targetName
        : [...exportNames].sort(compareStrings)[0];
      const aliases = exportNames.filter((candidate) => candidate !== name).sort(compareStrings);
      records.push({
        name,
        aliases,
        owner: entrypoint.name,
        importPath: entrypoint.importPath,
        kind: symbolKind(target),
        type: declarationType(checker, target, declaration),
        deprecated: isDeprecated(target),
        description:
          symbolDescription(checker, target) ||
          `Public ${symbolKind(target)} owned by ${entrypoint.importPath}.`,
        source: declaration
          ? normalizePath(relative(workspaceRoot, declaration.getSourceFile().fileName))
          : normalizePath(entrypoint.publicApi),
        componentIds: [],
        _target: target,
        _declaration: declaration,
        _exportNames: unique([name, ...aliases]),
      });
    }
  }

  return records.sort((left, right) =>
    `${left.importPath}:${left.name}`.localeCompare(`${right.importPath}:${right.name}`, 'en'),
  );
}

function rootExportMap(checker, program, runtimeConfig, symbols) {
  const sourceFile = program.getSourceFile(resolve(workspaceRoot, runtimeConfig.rootPublicApi));
  if (!sourceFile) {
    throw new Error(`Missing root public API source ${runtimeConfig.rootPublicApi}.`);
  }
  const moduleSymbol = checker.getSymbolAtLocation(sourceFile);
  if (!moduleSymbol) {
    throw new Error(`Cannot inspect root public API module ${runtimeConfig.rootPublicApi}.`);
  }

  const rootNames = checker
    .getExportsOfModule(moduleSymbol)
    .map((symbol) => symbol.getName())
    .sort(compareStrings);
  const runtimeOwners = new Set(runtimeConfig.entrypoints.map((entrypoint) => entrypoint.name));
  const ownership = new Map();
  for (const symbol of symbols.filter((record) => runtimeOwners.has(record.owner))) {
    for (const exportName of [symbol.name, ...symbol.aliases]) {
      if (ownership.has(exportName)) {
        throw new Error(`Root export ${exportName} has more than one owner entrypoint.`);
      }
      ownership.set(exportName, symbol.importPath);
    }
  }

  const missing = rootNames.filter((name) => !ownership.has(name));
  const stale = [...ownership.keys()].filter((name) => !rootNames.includes(name));
  if (missing.length || stale.length) {
    throw new Error(
      [
        missing.length ? `missing ownership: ${missing.join(', ')}` : '',
        stale.length ? `not exported by the root: ${stale.join(', ')}` : '',
      ]
        .filter(Boolean)
        .join('; '),
    );
  }

  return {
    schemaVersion: '1.0.0',
    package: packageName,
    generatedFrom: runtimeConfig.rootPublicApi,
    entrypoints: runtimeConfig.entrypoints.map((entrypoint) => `${packageName}/${entrypoint.name}`),
    exports: Object.fromEntries(rootNames.map((name) => [name, ownership.get(name)])),
  };
}

function decoratorMetadata(node) {
  if (!ts.canHaveDecorators(node)) return undefined;
  for (const decorator of ts.getDecorators(node) ?? []) {
    if (!ts.isCallExpression(decorator.expression)) continue;
    const expression = decorator.expression.expression;
    if (!ts.isIdentifier(expression) || !['Component', 'Directive'].includes(expression.text)) {
      continue;
    }
    const metadata = decorator.expression.arguments[0];
    if (metadata && ts.isObjectLiteralExpression(metadata)) {
      return {
        kind: expression.text.toLowerCase(),
        metadata,
      };
    }
  }
  return undefined;
}

function propertyName(node, sourceFile) {
  if (!node) return '';
  if (ts.isIdentifier(node) || ts.isStringLiteralLike(node)) return node.text;
  return node.getText(sourceFile);
}

function objectProperty(object, name, sourceFile) {
  if (!object || !ts.isObjectLiteralExpression(object)) return undefined;
  return object.properties.find(
    (property) =>
      ts.isPropertyAssignment(property) && propertyName(property.name, sourceFile) === name,
  );
}

function stringProperty(object, name, sourceFile) {
  const property = objectProperty(object, name, sourceFile);
  if (!property || !ts.isPropertyAssignment(property)) return undefined;
  return ts.isStringLiteralLike(property.initializer) ? property.initializer.text : undefined;
}

function selectorsFrom(metadata, sourceFile) {
  return (stringProperty(metadata, 'selector', sourceFile) ?? '')
    .split(',')
    .map((selector) => selector.trim())
    .filter(Boolean);
}

function signalCall(initializer) {
  if (!ts.isCallExpression(initializer)) return undefined;
  const expression = initializer.expression;
  if (ts.isIdentifier(expression) && ['input', 'model', 'output'].includes(expression.text)) {
    return { kind: expression.text, required: false, call: initializer };
  }
  if (
    ts.isPropertyAccessExpression(expression) &&
    ts.isIdentifier(expression.expression) &&
    expression.expression.text === 'input' &&
    expression.name.text === 'required'
  ) {
    return { kind: 'input', required: true, call: initializer };
  }
  return undefined;
}

function publicAlias(options, sourceFile) {
  const alias = objectProperty(options, 'alias', sourceFile);
  return alias && ts.isPropertyAssignment(alias) && ts.isStringLiteralLike(alias.initializer)
    ? alias.initializer.text
    : undefined;
}

function signalValueType(checker, call, location) {
  const signalType = checker.getTypeAtLocation(call);
  let typeArguments = [];
  if (signalType.aliasTypeArguments?.length) {
    typeArguments = signalType.aliasTypeArguments;
  } else if (signalType.objectFlags & ts.ObjectFlags.Reference) {
    typeArguments = checker.getTypeArguments(signalType);
  }
  const valueType = typeArguments[0];
  if (valueType) {
    return checker.typeToString(valueType, location, typeFormatFlags);
  }
  const rendered = checker.typeToString(signalType, location, typeFormatFlags);
  const match = rendered.match(
    /^(?:InputSignal(?:WithTransform)?|ModelSignal|OutputEmitterRef)<(.+?)(?:, .+)?>$/,
  );
  return match?.[1] ?? rendered;
}

function baseClassDeclaration(checker, declaration) {
  const clause = declaration.heritageClauses?.find(
    (candidate) => candidate.token === ts.SyntaxKind.ExtendsKeyword,
  );
  const typeNode = clause?.types[0];
  if (!typeNode) return undefined;
  const symbol = resolveAlias(checker, checker.getSymbolAtLocation(typeNode.expression));
  const target = symbol?.valueDeclaration ?? symbol?.declarations?.[0];
  return target && ts.isClassDeclaration(target) ? target : undefined;
}

function inferDescription(name, kind) {
  const explicit = {
    ariaLabel: 'Accessible name used when visible content is not sufficient.',
    accessibleLabel: 'Accessible name for the complete composite widget.',
    describedBy: 'Space-separated element ids that provide the accessible description.',
    disabled: 'Prevents user interaction and participates in the disabled-state contract.',
    readOnly: 'Keeps the value perceivable while preventing user edits.',
    readonly: 'Keeps the value perceivable while preventing user edits.',
    required: 'Marks the value as required and participates in Angular Forms validation.',
    invalid: 'Exposes an externally controlled invalid presentation state.',
    loading: 'Prevents duplicate actions and exposes accessible busy state.',
    value: 'Controlled component value.',
    open: 'Controls whether the disclosure or overlay surface is visible.',
    data: 'Immutable data supplied by the consumer.',
    rowIdentity: 'Returns a stable unique key for every source row occurrence.',
    columns: 'Typed column definitions with stable keys.',
    nodes: 'Hierarchical nodes whose ids must be stable and unique across the complete tree.',
    options: 'Authoritative option collection presented by the selection control.',
    items: 'Ordered item collection rendered by the composite widget.',
    rows: 'Ordered row collection rendered by the tabular view.',
    results: 'Search result collection rendered in response to the current query.',
    title: 'Visible title that also names the component surface or data view.',
    label: 'Visible text that names the control or data value.',
    labels: 'Localized copy overrides for the component-owned interface text.',
    description: 'Visible supporting description for the component content.',
    placeholder: 'Short input hint shown only while no value is present.',
    locale: 'Locale identifier used for collation, formatting, and component-owned copy.',
    identityMatcher: 'Compares option values when object identity is not stable across refreshes.',
    trackBy: 'Returns the stable identity used to retain rendered items across updates.',
    stringify: 'Converts a domain value into the human-readable label shown to users.',
    valueFormatter: 'Formats a domain value for visible and accessible presentation.',
    percentFormatter: 'Formats a normalized value for visible and accessible percentage copy.',
    filterPredicate: 'Determines whether a row matches the current filter query.',
    disabledHandler: 'Determines whether an individual option or item is unavailable.',
    initialFocus: 'Identifies the element that receives focus when the modal surface opens.',
    orientation: 'Defines the logical axis used by layout and keyboard navigation.',
    direction: 'Defines the logical reading and interaction direction.',
    min: 'Smallest accepted numeric or temporal value.',
    max: 'Largest accepted numeric or temporal value.',
    step: 'Increment applied by keyboard and pointer value adjustments.',
    page: 'One-based controlled page index.',
    pageSize: 'Maximum number of records requested or displayed on one page.',
    totalItems: 'Total result count used to calculate the available page range.',
    viewportHeight: 'Measured virtual viewport height used to determine visible rows.',
    virtualize: 'Enables fixed-height row virtualization for large data collections.',
    weekStartsOn: 'Zero-based weekday used as the first calendar column.',
    today: 'Deterministic plain date treated as today on both server and client.',
    disabledDates: 'Returns whether a plain date is unavailable for selection.',
    query: 'Current controlled search text used to derive visible results.',
    selected: 'Controlled selected state, distinct from keyboard focus.',
    expanded: 'Controlled expanded state for a disclosure or hierarchical item.',
    activeId: 'Stable id of the item currently participating in roving focus.',
    activeIndex: 'Zero-based index currently participating in managed keyboard focus.',
    selectedId: 'Stable id of the currently selected item.',
    expandedIds: 'Stable ids of the currently expanded hierarchical items.',
    hiddenColumnKeys: 'Stable column keys excluded from the current grid presentation.',
    sortKey: 'Stable column key that owns the current sort operation.',
    sortDirection: 'Current ascending, descending, or unsorted direction.',
    contentTemplate: 'Template used to render the component body with its typed context.',
    optionTemplate: 'Template used to render one option with its typed context.',
    selectedTemplate: 'Template used to render the committed selection.',
    actionsTemplate: 'Template used to render product-owned actions in the designated slot.',
    emptyText: 'Visible and announced copy when the data collection has no items.',
    errorText: 'Visible and announced copy when loading the data collection fails.',
    loadingText: 'Visible and announced copy while asynchronous data is loading.',
    emptyLabel: 'Accessible copy that explains the empty state.',
    emptyResultsLabel: 'Accessible copy announced when a search has no matching results.',
    closeOnEscape: 'Allows Escape to dismiss the topmost owned overlay.',
    closeOnOutside: 'Allows an interaction outside the owned overlay to dismiss it.',
    dismissible: 'Controls whether the user can dismiss the surface before completing an action.',
    palette: 'Ordered semantic color values available to the color control.',
    axis: 'Chart axis represented by the data series and keyboard movement.',
    ratio: 'Required width-to-height ratio maintained by the layout.',
    aspectRatio: 'Required width-to-height ratio maintained by the media surface.',
    mode: 'Discriminated operating mode that selects the component data and interaction contract.',
    error: 'Current failure message or error state exposed by asynchronous content.',
    filterable: 'Enables the grid-owned text filtering interface.',
    filterPlaceholder: 'Short hint displayed in the grid filter input before a query is entered.',
    selectable: 'Enables row selection and the corresponding selected-key contract.',
    resizable: 'Enables pointer and keyboard resizing for supported columns or panels.',
    pagination: 'Enables client pagination or supplies the controlled paging configuration.',
    compact: 'Uses the reduced-density presentation intended for constrained data views.',
    columnChooser: 'Enables the grid-owned control for changing visible columns.',
    customName: 'Native form-control name shared by every radio option in the group.',
    indent: 'Logical inline indentation applied for each hierarchical depth level.',
    code: 'Required source text rendered by the syntax-aware code presentation.',
    href: 'Required destination URL used by the semantic link element.',
    name: 'Required human-readable name for the represented person, item, or action.',
    accept: 'Comma-separated file types accepted by the upload control.',
    active: 'Marks the item as the current interaction target without implying selection.',
    addOnBlur: 'Commits a valid draft tag when the text input loses focus.',
    align: 'Logical cross-axis alignment applied to children by the layout.',
    alt: 'Text alternative that communicates the meaning of visual media.',
    bioMaxLength: 'Maximum biography length enforced by the profile form pattern.',
    blocking: 'Marks feedback as requiring attention before the workflow can continue.',
    columnGap: 'Logical spacing inserted between grid columns.',
    detail: 'Supporting detail text displayed with the primary content.',
    display: 'Named presentation strategy used to render the supplied value.',
    download: 'Enables native download behavior and optionally provides the downloaded filename.',
    elevated: 'Adds semantic surface elevation for content that sits above its surroundings.',
    extended: 'Displays the floating action label in addition to its icon.',
    fit: 'Media fitting strategy used when intrinsic and container ratios differ.',
    for: 'Id of the labelable control associated with this label.',
    from: 'Starting boundary of the represented range or interval.',
    gap: 'Logical spacing inserted between adjacent layout children.',
    gutter: 'Outer or inter-column spacing applied by the layout.',
    gutters: 'Enables the container-owned logical inline page gutters.',
    hasProjectedTrigger:
      'Legacy signal indicating that trigger content is projected by the consumer.',
    height: 'Explicit block size of the rendered surface or virtual viewport.',
    high: 'Threshold above which a meter value is considered high.',
    hint: 'Supporting guidance displayed with a form control or product action.',
    icon: 'Semantic icon name rendered alongside the visible component content.',
    indeterminate: 'Represents an unknown progress value or a mixed selection state.',
    index: 'Zero-based position of the represented item in its ordered collection.',
    inputMode: 'Virtual-keyboard hint forwarded to the editable control.',
    inset: 'Aligns the divider or content edge with surrounding inset content.',
    interactive: 'Enables the documented user interaction for an otherwise presentational item.',
    intrinsic: 'Preserves the media element’s intrinsic dimensions when space permits.',
    justify: 'Logical main-axis distribution applied to layout children.',
    keyboardAccessible:
      'Confirms that the custom rendered action participates in keyboard interaction.',
    krnTooltipPosition: 'Preferred logical placement of the tooltip relative to its trigger.',
    language: 'Language identifier used by syntax highlighting and accessible code metadata.',
    length: 'Required number of editable positions in the verification-code control.',
    linear: 'Requires step completion in order and prevents skipping incomplete steps.',
    low: 'Threshold below which a meter value is considered low.',
    mainMaxWidth: 'Maximum inline size allocated to the primary application content.',
    mobileNavigation: 'Template rendered as the application’s narrow-viewport navigation.',
    multiple: 'Allows more than one value or file to be selected in one interaction.',
    numericOnly: 'Restricts verification-code entry to decimal digits.',
    observe: 'Enables automatic observation of headings used by the table of contents.',
    openDelay: 'Delay in milliseconds before the transient surface becomes visible.',
    optimum: 'Meter value considered optimal for interpreting low and high ranges.',
    overlap: 'Allows the floating action surface to overlap its adjacent container edge.',
    position: 'Logical placement of the component relative to its owning surface.',
    pressed: 'Controlled toggle-button pressed state exposed through native button semantics.',
    railWidth: 'Inline size reserved for the application navigation rail.',
    recoveryHref: 'Destination URL for the error-state recovery action.',
    rel: 'Native link relationship tokens applied to the destination.',
    removable: 'Displays a named action for removing the represented value.',
    responsive: 'Enables the component’s documented container-responsive presentation.',
    reverseCollapsed: 'Collapses the logical end panel instead of the logical start panel.',
    role: 'ARIA role used when the consumer must refine the component’s semantic purpose.',
    rowGap: 'Logical spacing inserted between grid rows.',
    saving: 'Exposes an in-progress save state and prevents duplicate submission.',
    scrollbar: 'Controls whether the scroll area uses native or visually hidden scrollbars.',
    selectedCount: 'Number of selected records summarized by the surrounding pattern.',
    separator: 'Visible text inserted between adjacent values or navigation segments.',
    shape: 'Named geometry applied to the avatar or media boundary.',
    siblingCount: 'Total number of peer items used to expose hierarchical position.',
    side: 'Logical side on which the anchored or modal surface is placed.',
    sidebarPosition: 'Logical start or end placement of the application sidebar.',
    sidebarWidth: 'Inline size reserved for the expanded application sidebar.',
    size: 'Named semantic size resolved through KERN density and sizing tokens.',
    spellcheck: 'Native spell-checking preference forwarded to the editable control.',
    src: 'Required media source URL loaded by the component.',
    state: 'Current semantic state used to choose copy, iconography, and announcement behavior.',
    status: 'Current domain status rendered as visible text and a non-color-only treatment.',
    sticky: 'Keeps the surface attached to its scrolling boundary while content moves.',
    target: 'Native browsing-context target used when activating the link.',
    tone: 'Semantic intent that selects coordinated text, icon, border, and surface tokens.',
    trend: 'Direction of change communicated by the statistic in addition to its numeric value.',
    type: 'Native action or input type forwarded to the owned interactive element.',
    until: 'Ending boundary of the represented range or interval.',
    variant: 'Named visual hierarchy treatment that preserves the component semantics.',
    width: 'Explicit inline size of the rendered surface.',
    wrap: 'Controls whether layout children wrap onto additional lines when space is constrained.',
  };
  if (explicit[name]) return explicit[name];
  const words = name
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replaceAll(/[_-]+/g, ' ')
    .toLowerCase();
  if (kind === 'model') {
    return `Controlled ${words} state with a matching Angular model-change output.`;
  }
  if (kind === 'output') {
    return `Notifies the consumer after the ${words} interaction completes.`;
  }
  if (/(template|content)$/i.test(name)) {
    return `Template or projected content used to render ${words.replace(/ (template|content)$/, '')}.`;
  }
  if (/(label|text|message|prompt|heading|eyebrow)$/i.test(name)) {
    return `Human-readable copy for the ${words.replace(/ (label|text|message)$/, '')} state or control.`;
  }
  if (/(id|ids|keys)$/i.test(name)) {
    return `Stable identifier value used by the ${words.replace(/ (id|ids|keys)$/, '')} contract.`;
  }
  if (/^(min|max|minimum|maximum)/i.test(name)) {
    return `Upper or lower bound applied to the ${words.replace(/^(min|max|minimum|maximum) /, '')} value.`;
  }
  if (/^(show|hide|allow|auto|close|collapse|expand|enable|disable)/i.test(name)) {
    return `Controls whether the component applies the ${words} behavior.`;
  }
  if (/(formatter|stringify|predicate|matcher|handler|track by)$/.test(words)) {
    return `Consumer function used by the component to resolve ${words}.`;
  }
  if (/(items|values|steps|sizes|filters|notifications|timezones)$/i.test(name)) {
    return `Ordered domain values supplied to the ${words.replace(/s$/, '')} collection.`;
  }
  return `Typed value that defines the component's ${words} behavior or presentation.`;
}

function apiForClass(checker, declaration, stack = new Set()) {
  const key = `${declaration.getSourceFile().fileName}:${declaration.pos}`;
  if (stack.has(key)) {
    throw new Error(`Circular class inheritance while resolving ${declaration.name?.text ?? key}`);
  }
  const nextStack = new Set(stack).add(key);
  const inherited = baseClassDeclaration(checker, declaration);
  const rows = inherited ? apiForClass(checker, inherited, nextStack) : [];
  const sourceFile = declaration.getSourceFile();

  for (const member of declaration.members) {
    if (!ts.isPropertyDeclaration(member) || !member.initializer || !member.name) continue;
    const modifiers = ts.canHaveModifiers(member) ? (ts.getModifiers(member) ?? []) : [];
    if (
      modifiers.some(
        (modifier) =>
          modifier.kind === ts.SyntaxKind.ProtectedKeyword ||
          modifier.kind === ts.SyntaxKind.PrivateKeyword,
      )
    ) {
      continue;
    }
    const signal = signalCall(member.initializer);
    if (!signal) continue;
    const options = signal.required ? signal.call.arguments[0] : signal.call.arguments[1];
    const property = propertyName(member.name, sourceFile);
    const memberSymbol = checker.getSymbolAtLocation(member.name);
    const sourceDescription = memberSymbol ? symbolDescription(checker, memberSymbol) : '';
    rows.push({
      name: publicAlias(options, sourceFile) ?? property,
      property,
      kind: signal.kind,
      type: signalValueType(checker, signal.call, member),
      required: signal.required,
      defaultValue: signal.required
        ? 'required'
        : (signal.call.arguments[0]?.getText(sourceFile) ?? 'undefined'),
      description: sourceDescription || inferDescription(property, signal.kind),
      descriptionSource: sourceDescription ? 'source' : 'inferred',
    });
  }

  const uniqueRows = new Map();
  for (const row of rows) {
    uniqueRows.set(`${row.kind}:${row.name}`, row);
  }
  return [...uniqueRows.values()];
}

async function templateFor(metadata, sourceFile) {
  const inline = objectProperty(metadata, 'template', sourceFile);
  if (
    inline &&
    ts.isPropertyAssignment(inline) &&
    (ts.isStringLiteralLike(inline.initializer) ||
      ts.isNoSubstitutionTemplateLiteral(inline.initializer))
  ) {
    return inline.initializer.text;
  }
  const templateUrl = stringProperty(metadata, 'templateUrl', sourceFile);
  return templateUrl ? readFile(resolve(dirname(sourceFile.fileName), templateUrl), 'utf8') : '';
}

function slotName(selector, index) {
  if (!selector) return index === 0 ? 'default' : `default-${index + 1}`;
  const attribute = selector.match(/^\[([^\]]+)\]$/);
  if (attribute) return attribute[1];
  return slugify(selector.replace(/[[\].,#]/g, ' ')) || `slot-${index + 1}`;
}

function slotsFromTemplate(template) {
  const slots = [];
  const matcher = /<ng-content\b([^>]*)>/g;
  let match;
  while ((match = matcher.exec(template))) {
    const selectorMatch = match[1].match(/\bselect\s*=\s*(['"])(.*?)\1/);
    const selector = selectorMatch?.[2] ?? '';
    slots.push({
      name: slotName(selector, slots.length),
      selector: selector || '*',
      required: false,
      description: selector
        ? `Projects content matching ${selector}.`
        : 'Projects default component content.',
    });
  }
  return [...new Map(slots.map((slot) => [slot.selector, slot])).values()];
}

function slotsContract(slots, override, componentId) {
  const curated = override?.slots ?? {};
  const selectors = new Set(slots.map((slot) => slot.selector));
  for (const selector of Object.keys(curated)) {
    if (!selectors.has(selector)) {
      throw new Error(
        `Component override "${componentId}" configures unknown content slot "${selector}".`,
      );
    }
  }
  return slots.map((slot) => {
    const patch = curated[slot.selector];
    return patch
      ? {
          ...slot,
          required: patch.required ?? slot.required,
          description: patch.description ?? slot.description,
        }
      : slot;
  });
}

function formValueType(checker, declaration, stack = new Set()) {
  const key = `${declaration.getSourceFile().fileName}:${declaration.pos}`;
  if (stack.has(key)) return null;
  const nextStack = new Set(stack).add(key);
  const clause = declaration.heritageClauses?.find(
    (candidate) => candidate.token === ts.SyntaxKind.ExtendsKeyword,
  );
  const typeNode = clause?.types[0];
  if (!typeNode) return null;
  const baseName = typeNode.expression.getText(declaration.getSourceFile()).split('.').at(-1);
  if (baseName === 'KrnValueAccessor') {
    const valueType = typeNode.typeArguments?.[0];
    return valueType
      ? checker.typeToString(checker.getTypeFromTypeNode(valueType), declaration, typeFormatFlags)
      : 'unknown';
  }
  const base = baseClassDeclaration(checker, declaration);
  return base ? formValueType(checker, base, nextStack) : null;
}

async function decoratedComponents(program, checker) {
  const records = [];
  for (const sourceFile of program.getSourceFiles()) {
    const relativePath = normalizePath(relative(workspaceRoot, sourceFile.fileName));
    if (
      sourceFile.isDeclarationFile ||
      !relativePath.startsWith('projects/kern/') ||
      relativePath.includes('.spec.')
    ) {
      continue;
    }
    for (const statement of sourceFile.statements) {
      if (!ts.isClassDeclaration(statement) || !statement.name) continue;
      const decorated = decoratorMetadata(statement);
      if (!decorated) continue;
      const symbol = checker.getSymbolAtLocation(statement.name);
      if (!symbol) continue;
      const selectors = selectorsFrom(decorated.metadata, sourceFile);
      const template = await templateFor(decorated.metadata, sourceFile);
      const valueType = formValueType(checker, statement);
      const sourceText = statement.getText(sourceFile);
      records.push({
        className: statement.name.text,
        kind: decorated.kind,
        selectors,
        api: apiForClass(checker, statement),
        slots: slotsFromTemplate(template),
        formValueType: valueType,
        source: relativePath,
        sourceText,
        symbol,
        declaration: statement,
      });
    }
  }
  return records;
}

function executeCatalog(sourceText, runtimeComponents) {
  const compiled = ts.transpileModule(sourceText, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
    fileName: paths.catalog,
  }).outputText;
  const module = { exports: {} };
  const sandbox = {
    module,
    exports: module.exports,
    require: (specifier) => {
      if (specifier === './generated-component-contract') {
        return { KERN_RUNTIME_COMPONENTS: runtimeComponents };
      }
      throw new Error(`Catalog evaluation rejected unexpected import ${specifier}`);
    },
    console,
    Object,
    Set,
  };
  vm.runInNewContext(compiled, sandbox, {
    filename: paths.catalog,
    timeout: 2_000,
  });
  return module.exports.KERN_CATALOG.map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    selector: item.selector,
    variantOf: item.variantOf,
    summary: item.summary,
    status: item.status,
    states: [...item.states],
    keyboard: [...item.keyboard],
    accessibility: [...item.accessibility],
    api: item.api.map((member) => ({ ...member })),
    do: item.do,
    dont: item.dont,
  }));
}

function executePlayground(sourceText, catalog) {
  const compiled = ts.transpileModule(sourceText, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
    fileName: paths.playground,
  }).outputText;
  const module = { exports: {} };
  const sandbox = {
    module,
    exports: module.exports,
    require: (specifier) => {
      if (specifier === '@kern-ui/showcase') return { KERN_CATALOG: catalog };
      throw new Error(`Playground evaluation rejected unexpected import ${specifier}`);
    },
    console,
  };
  vm.runInNewContext(compiled, sandbox, {
    filename: paths.playground,
    timeout: 2_000,
  });
  const definitions = module.exports.KERN_PLAYGROUND_DEFINITIONS;
  if (!Array.isArray(definitions)) {
    throw new Error('Playground evaluation did not export KERN_PLAYGROUND_DEFINITIONS.');
  }
  const normalizeStateId = module.exports.normalizeKernPlaygroundStateId;
  if (typeof normalizeStateId !== 'function') {
    throw new Error('Playground evaluation did not export normalizeKernPlaygroundStateId.');
  }
  return {
    definitions: JSON.parse(JSON.stringify(definitions)),
    exclusions: JSON.parse(JSON.stringify(module.exports.KERN_PLAYGROUND_API_EXCLUSIONS ?? [])),
    coverage: JSON.parse(JSON.stringify(module.exports.KERN_PLAYGROUND_API_COVERAGE ?? {})),
    normalizeStateId,
  };
}

function validatePlaygroundFixtureEffect(componentId, preset) {
  const effect = preset.fixtureEffect;
  if (effect === undefined) return;

  const context = `${componentId}.${preset.id ?? '<missing-preset-id>'}.fixtureEffect`;
  if (typeof effect !== 'object' || effect === null || Array.isArray(effect)) {
    throw new Error(`${context} must be an object.`);
  }

  const supportedModes = playgroundFixtureEffectModes.get(effect.kind);
  if (!supportedModes) {
    throw new Error(`${context}.kind must be layout, content, data, or status.`);
  }
  if (!supportedModes.has(effect.mode)) {
    throw new Error(
      `${context}.mode "${String(effect.mode)}" is not valid for kind "${effect.kind}".`,
    );
  }
  for (const field of ['label', 'description']) {
    if (typeof effect[field] !== 'string' || effect[field].trim().length === 0) {
      throw new Error(`${context}.${field} must be a non-empty string.`);
    }
  }

  const undeclaredFields = Object.keys(effect).filter(
    (field) => !playgroundFixtureEffectFields.has(field),
  );
  if (undeclaredFields.length > 0) {
    throw new Error(`${context} contains undeclared fields: ${undeclaredFields.join(', ')}.`);
  }
}

function playgroundQueryContract() {
  return {
    routePattern: 'preview/{componentId}',
    argumentsPrefix: 'arg.',
    scenarioParameter: 'scenario',
    presetParameter: 'state',
    environment: [
      {
        key: 'theme',
        parameter: 'theme',
        defaultValue: 'system',
        values: ['system', 'light', 'dark', 'high-contrast'],
      },
      {
        key: 'density',
        parameter: 'density',
        defaultValue: 'comfortable',
        values: ['compact', 'comfortable', 'spacious'],
      },
      {
        key: 'direction',
        parameter: 'direction',
        defaultValue: 'ltr',
        values: ['ltr', 'rtl'],
      },
      {
        key: 'locale',
        parameter: 'locale',
        defaultValue: 'en-US',
        values: ['en-US', 'ru-RU'],
      },
      {
        key: 'motion',
        parameter: 'motion',
        defaultValue: 'system',
        values: ['system', 'reduce', 'full'],
      },
      {
        key: 'viewport',
        parameter: 'viewport',
        defaultValue: 'responsive',
        values: ['responsive', 'phone', 'tablet'],
      },
    ],
    brandColor: {
      parameter: 'brandColor',
      defaultValue: '#4666da',
      pattern: '^#[0-9a-fA-F]{6}$',
    },
  };
}

function ownerEntrypoints(runtimeConfig) {
  return [
    ...runtimeConfig.entrypoints.map((entrypoint) => ({
      ...entrypoint,
      importPath: `${packageName}/${entrypoint.name}`,
    })),
    {
      name: 'testing',
      subpath: './testing',
      sourceRoot: 'projects/kern/testing/src',
      publicApi: 'projects/kern/testing/src/public-api.ts',
      dependencies: [],
      importPath: `${packageName}/testing`,
    },
  ];
}

function symbolRecordForComponent(symbols, decorated) {
  return symbols.find(
    (record) =>
      record._target === decorated.symbol ||
      record._declaration === decorated.declaration ||
      record._exportNames.includes(decorated.className),
  );
}

function catalogSymbolName(item, symbolRecord) {
  const preferred = `Krn${pascalCase(item.name)}`;
  return symbolRecord._exportNames.includes(preferred) ? preferred : symbolRecord.name;
}

function compiledExample(component, record, code) {
  return {
    id: 'minimal',
    title: record.title,
    kind: 'minimal',
    language: 'typescript',
    code,
    verification: 'compiled',
    source: `examples/${component.id}.ts`,
  };
}

function lifecycleRegistry(registry) {
  const records = new Map();
  for (const group of registry.catalogGroups ?? []) {
    const requiredEvidence =
      registry.evidenceProfiles?.[group.evidenceProfile]?.requiredEvidence ?? [];
    for (const id of group.ids ?? []) {
      records.set(id, {
        evidenceProfile: group.evidenceProfile,
        owner: group.owner,
        requiredEvidence,
      });
    }
  }
  return records;
}

function lifecycle(status, item, override, registryRecord) {
  if (!registryRecord) {
    throw new Error(`${item.id} has no lifecycle evidence profile.`);
  }
  const nonStable = status === 'beta' || status === 'experimental';
  const defaultRationale =
    status === 'beta'
      ? 'The component is available for controlled production evaluation while its complete promotion evidence is collected.'
      : status === 'experimental'
        ? 'The component contract is incubating and may change before its exit criteria are satisfied.'
        : lifecycleDescriptions[status];
  return {
    status,
    compatibility: lifecycleDescriptions[status],
    owner: registryRecord.owner,
    evidenceProfile: registryRecord.evidenceProfile,
    requiredEvidence: registryRecord.requiredEvidence,
    rationale: override?.lifecycleRationale ?? defaultRationale,
    knownLimitations:
      override?.knownLimitations ??
      (nonStable
        ? [
            'The consuming application must complete the required evidence profile before treating this contract as stable.',
          ]
        : []),
    promotionCriteria: nonStable ? promotionCriteria : [],
    replacement: null,
  };
}

function formsContract(decorated) {
  const isControl = decorated.formValueType !== null;
  const stateNames = new Set(['disabled', 'readonly', 'required', 'invalid']);
  return {
    controlValueAccessor: isControl,
    validator: isControl,
    valueType: decorated.formValueType,
    reactiveForms: isControl,
    templateDrivenForms: isControl,
    stateInputs: decorated.api
      .filter((member) => member.kind === 'input' && stateNames.has(member.name))
      .map((member) => member.name),
    notes: isControl
      ? [
          'Works with Angular Forms through ControlValueAccessor.',
          'Angular validator state and explicit KERN state inputs are combined.',
        ]
      : [],
  };
}

function ssrContract(decorated) {
  const browserOnly = /\bFile\b|clipboard|Clipboard|DataTransfer/.test(decorated.sourceText);
  const notes = [
    'KERN avoids ambient browser globals in reusable runtime infrastructure.',
    'Validate the consuming SSR/hydration route, locale, ids and overlay host.',
  ];
  if (decorated.sourceText.includes('KrnIdService')) {
    notes.push('Uses the shared deterministic KERN id service.');
  }
  if (browserOnly) {
    notes.push('Browser capabilities are nullable or become available only after hydration.');
  }
  return {
    status: 'supported-with-consumer-validation',
    hydration: 'consumer-validation-required',
    evidenceScope: 'library-docs-route-smoke',
    notes,
  };
}

function componentRelated(item, catalog, override) {
  const sameCategory = catalog
    .filter((candidate) => candidate.category === item.category && candidate.id !== item.id)
    .map((candidate) => candidate.id);
  const related = [
    ...(override?.related ?? []),
    ...(item.variantOf ? [item.variantOf] : []),
    ...sameCategory.slice(0, 4),
  ];
  return unique(related)
    .filter((id) => catalog.some((candidate) => candidate.id === id))
    .slice(0, 8);
}

function componentMistakes(item, decorated, override) {
  const required = decorated.api
    .filter((member) => member.kind === 'input' && member.required)
    .map((member) => member.name);
  const values = [...genericMistakes, ...(override?.commonMistakes ?? [])];
  if (required.length) {
    values.unshift(
      `Do not omit required inputs: ${required.map((name) => `\`${name}\``).join(', ')}.`,
    );
  }
  if (decorated.formValueType !== null) {
    values.push(
      'Do not manually duplicate value and disabled state when Angular Forms owns the control.',
    );
  }
  return unique(values);
}

function componentChecklist(decorated) {
  const values = [...genericChecklist];
  if (decorated.formValueType !== null) {
    values.splice(
      3,
      0,
      'Verify reactive-form value, touched, disabled, required and invalid state.',
    );
  }
  return values;
}

function publicComponentContract({
  item,
  decorated,
  symbolRecord,
  siblingItems,
  override,
  catalog,
  lifecycleRecord,
  playground,
}) {
  const symbol = catalogSymbolName(item, symbolRecord);
  const aliasSymbols = unique(
    symbolRecord._exportNames.filter((candidate) => candidate !== symbol),
  ).sort(compareStrings);
  const aliasSelectors = unique(
    siblingItems
      .flatMap((sibling) => sibling.selectors)
      .filter((selector) => selector !== item.selector),
  ).sort(compareStrings);
  const aliasIds = siblingItems
    .flatMap((sibling) => sibling.catalogIds)
    .filter((id) => id !== item.id)
    .sort(compareStrings);
  const primaryCatalogItem = catalog.find(
    (candidate) => candidate.selector === decorated.selectors[0],
  );
  const canonicalId = item.variantOf ?? primaryCatalogItem?.id ?? item.id;
  const component = {
    id: item.id,
    name: item.name,
    category: item.category,
    kind: decorated.kind,
    selector: item.selector,
    selectors: [...decorated.selectors],
    symbol,
    canonicalSymbol: symbolRecord.name,
    canonicalId,
    owner: symbolRecord.owner,
    importPath: symbolRecord.importPath,
    aliases: {
      symbols: aliasSymbols,
      selectors: aliasSelectors,
      componentIds: aliasIds,
    },
    summary: item.summary,
    acceptanceStates: item.states,
    lifecycle: lifecycle(item.status, item, override, lifecycleRecord),
    api: decorated.api,
    slots: slotsContract(decorated.slots, override, item.id),
    forms: formsContract(decorated),
    a11y: {
      target: 'WCAG 2.2 AA',
      keyboard: override?.keyboard ?? item.keyboard,
      notes: override?.a11yNotes ?? item.accessibility,
      manualValidationRequired: true,
    },
    ssr: ssrContract(decorated),
    examples: [],
    related: componentRelated(item, catalog, override),
    keywords: unique([
      item.id,
      item.name,
      item.category,
      item.selector,
      symbol,
      symbolRecord.name,
      ...aliasSymbols,
      ...(override?.keywords ?? []),
      ...decorated.api.map((member) => member.name),
    ]),
    guidance: {
      useWhen: override?.useWhen ?? item.do,
      avoidWhen: override?.avoidWhen ?? item.dont,
    },
    commonMistakes: componentMistakes(item, decorated, override),
    checklist: componentChecklist(decorated),
    documentation: {
      route: `components/${item.id}`,
      json: `components/${item.id}.json`,
      markdown: `components/${item.id}.md`,
    },
    playground: {
      route: `preview/${item.id}`,
      scenarios: playground.scenarios,
      controls: playground.controls,
      presets: playground.presets,
      apiCoverage: playground.apiCoverage,
      exclusions: playground.exclusions,
    },
  };
  return component;
}

function markdownApi(api) {
  if (!api.length) return '_No signal inputs, models, or outputs._';
  const rows = api.map(
    (member) =>
      `| \`${member.name}\` | ${member.kind} | \`${member.type.replaceAll('|', '\\|')}\` | ${
        member.required ? 'yes' : 'no'
      } | \`${member.defaultValue.replaceAll('|', '\\|')}\` | ${member.description} |`,
  );
  return [
    '| Name | Kind | Type | Required | Default | Description |',
    '| --- | --- | --- | --- | --- | --- |',
    ...rows,
  ].join('\n');
}

function markdownPlaygroundBinding(binding) {
  if (binding.kind === 'input') {
    return `input \`${binding.publicName}\` (${binding.syntax ?? 'property'})`;
  }
  if (binding.kind === 'model') return `model \`${binding.publicName}\``;
  if (binding.kind === 'fixture') return `fixture ${binding.target}`;
  return `composition \`${binding.attribute}\``;
}

function markdownPlaygroundFixtureEffect(effect) {
  if (!effect) return '';
  return `fixture effect \`${effect.kind}/${effect.mode}\` — ${effect.label}: ${effect.description}`;
}

function markdownPlayground(component) {
  const controls = component.playground.controls.map(
    (control) =>
      `| \`${control.key}\` | ${control.kind} | \`${JSON.stringify(control.defaultValue).replaceAll(
        '|',
        '\\|',
      )}\` | \`${JSON.stringify(control.testValue).replaceAll(
        '|',
        '\\|',
      )}\` | ${markdownPlaygroundBinding(control.binding)} | ${control.description.replaceAll(
        '|',
        '\\|',
      )} |`,
  );
  const controlTable = [
    '| Argument | Control | Default | Test value | Binding | Description |',
    '| --- | --- | --- | --- | --- | --- |',
    ...controls,
  ].join('\n');
  const presets = component.playground.presets
    .map((preset) => {
      const effects = [
        `scenario \`${preset.scenario}\``,
        ...Object.entries(preset.environment ?? {}).map(([key, value]) => `${key} \`${value}\``),
        ...Object.entries(preset.args).map(([key, value]) => `\`${key}=${JSON.stringify(value)}\``),
        preset.visualPseudoState ? `visual state \`${preset.visualPseudoState}\`` : '',
        markdownPlaygroundFixtureEffect(preset.fixtureEffect),
      ].filter(Boolean);
      return `- \`${preset.id}\` — ${preset.label}; ${effects.join('; ')}.`;
    })
    .join('\n');
  const exclusions = component.playground.exclusions.length
    ? [
        '| Public API | Category | Evidence | Reason |',
        '| --- | --- | --- | --- |',
        ...component.playground.exclusions.map(
          (exclusion) =>
            `| \`${exclusion.publicName}\` | ${exclusion.code} | \`${exclusion.evidence.category}:${exclusion.evidence.pointer}\` | ${exclusion.reason.replaceAll('|', '\\|')} |`,
        ),
      ].join('\n')
    : '_No excluded public API members._';
  return `Route: \`${component.playground.route}\`

Scenarios: ${component.playground.scenarios.map((scenario) => `\`${scenario}\``).join(', ')}.
Public API coverage: ${component.playground.apiCoverage.controlled}/${component.playground.apiCoverage.publicInputsAndModels}
directly controlled; ${component.playground.apiCoverage.excluded} exact exclusions; 0 unclassified.
Use \`arg.<key>\` query parameters for controls. Controls tagged \`fixture\` or \`composition\`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

${controlTable}

Exact API exclusions:

${exclusions}

Presets:

${presets}`;
}

function componentMarkdown(component) {
  const slots = component.slots.length
    ? component.slots.map((slot) => `- \`${slot.selector}\` — ${slot.description}`).join('\n')
    : '_No projected content slots._';
  const form = component.forms.controlValueAccessor
    ? `Angular Forms control with value type \`${component.forms.valueType}\`.`
    : 'Not an Angular Forms value accessor.';
  return `# ${component.name}

- ID: \`${component.id}\`
- Selector: \`${component.selector}\`
- Import: \`import { ${component.symbol} } from '${component.importPath}';\`
- Canonical symbol: \`${component.canonicalSymbol}\`
- Lifecycle: **${component.lifecycle.status}**
- Category: ${component.category}

${component.summary}

## Use

${component.guidance.useWhen}

Avoid: ${component.guidance.avoidWhen}

## Compile-verified standalone Angular example

\`\`\`ts
${component.examples[0].code}
\`\`\`

## API

${markdownApi(component.api)}

## Content slots

${slots}

## Angular Forms

${form}

## Accessibility

${component.a11y.keyboard.map((rule) => `- ${rule}`).join('\n')}
${component.a11y.notes.map((note) => `- ${note}`).join('\n')}

Manual assistive-technology validation remains required in the consuming application.

## SSR and hydration

${component.ssr.notes.map((note) => `- ${note}`).join('\n')}

Hydration evidence scope: \`${component.ssr.evidenceScope}\`; status:
\`${component.ssr.hydration}\`.

## Acceptance states

${component.acceptanceStates.map((state) => `- ${state}`).join('\n')}

## Interactive playground

${markdownPlayground(component)}

## Related

${component.related.map((id) => `- \`${id}\``).join('\n') || '_None._'}

## Common mistakes

${component.commonMistakes.map((mistake) => `- ${mistake}`).join('\n')}

## Ship checklist

${component.checklist.map((item) => `- [ ] ${item}`).join('\n')}
`;
}

function importMap(components, symbols) {
  const componentEntries = Object.fromEntries(
    components.map((component) => [
      component.id,
      {
        symbol: component.symbol,
        canonicalSymbol: component.canonicalSymbol,
        selector: component.selector,
        importPath: component.importPath,
        lifecycle: component.lifecycle.status,
      },
    ]),
  );
  const symbolEntries = {};
  for (const symbol of symbols) {
    for (const name of [symbol.name, ...symbol.aliases]) {
      symbolEntries[name] = {
        canonicalSymbol: symbol.name,
        importPath: symbol.importPath,
        owner: symbol.owner,
        kind: symbol.kind,
      };
    }
  }
  return {
    schemaVersion,
    package: packageName,
    components: componentEntries,
    symbols: Object.fromEntries(
      Object.entries(symbolEntries).sort(([left], [right]) => compareStrings(left, right)),
    ),
  };
}

function checklistMarkdown() {
  return `# KERN agent implementation checklist

## Install

- [ ] Install \`@kern-ui/angular\` with compatible Angular CDK and Angular Aria peers.
- [ ] Load \`@kern-ui/angular/styles/kern.css\` exactly once.
- [ ] Use \`provideKrn\` only for application-owned runtime preferences; zero-config is supported.

## Choose and import

- [ ] Search the component manifest by task and compare related alternatives.
- [ ] Prefer the documented owner entrypoint.
- [ ] Never import from \`projects/kern\`, \`src/lib\`, or an undeclared family subpath.

## Implement

${genericChecklist.map((item) => `- [ ] ${item}`).join('\n')}

## Validate

- [ ] Run the KERN MCP \`validate_usage\` tool or equivalent static contract check.
- [ ] Compile against the packed npm artifact, not workspace source paths.
- [ ] Exercise the public testing harness for behavior-sensitive components.
`;
}

function mistakesMarkdown(components) {
  const specialized = components
    .filter((component) => component.commonMistakes.length > genericMistakes.length)
    .map(
      (component) =>
        `## ${component.name}\n\n${component.commonMistakes.map((mistake) => `- ${mistake}`).join('\n')}`,
    );
  return `# Common KERN usage mistakes

${genericMistakes.map((mistake) => `- ${mistake}`).join('\n')}

${specialized.join('\n\n')}
`;
}

function llmsIndex(manifest) {
  const categories = new Map();
  for (const component of manifest.components) {
    const group = categories.get(component.category) ?? [];
    group.push(component);
    categories.set(component.category, group);
  }
  const groups = [...categories.entries()]
    .map(
      ([category, components]) =>
        `## ${category}\n\n${components
          .map(
            (component) =>
              `- [${component.name}](./components/${component.id}.md): \`${component.selector}\`, ${component.lifecycle.status}, import from \`${component.importPath}\`.`,
          )
          .join('\n')}`,
    )
    .join('\n\n');
  return `# KERN Angular agent index

KERN is a standalone Angular component library for enterprise product interfaces.

## Required setup

- Package: \`${packageName}\`
- Required global stylesheet: \`${manifest.library.requiredStyles}\`
- Runtime provider: \`provideKrn\` is preferred for application preferences but is not required.
- Prefer each component's owner entrypoint; the package root is a supported compatibility aggregator.
- Machine contract: [component-manifest.json](./component-manifest.json)
- Import map: [import-map.json](./import-map.json)
- Root compatibility export map: [root-export-map.json](./root-export-map.json)
- Checklist: [checklist.md](./checklist.md)
- Common mistakes: [common-mistakes.md](./common-mistakes.md)
- Full reference: [llms-full.txt](./llms-full.txt)
- Compile-verified examples: [examples/index.json](./examples/index.json)
- Interactive previews: each component contract publishes a \`preview/<component-id>\` route,
  typed \`arg.*\` controls, executable presets, scenarios, and input/model/fixture binding metadata.

${groups}
`;
}

function llmsFull(manifest, componentDocuments) {
  const recipes = manifest.recipes
    .map(
      (recipe) => `# Recipe: ${recipe.title}

${recipe.summary}

${recipe.steps.map((step, index) => `${index + 1}. ${step}`).join('\n')}

\`\`\`ts
${recipe.code}
\`\`\``,
    )
    .join('\n\n');
  return `${llmsIndex(manifest)}

# Recipes

${recipes}

# Complete component contracts

${componentDocuments.map((document) => document.trimEnd()).join('\n\n---\n\n')}
`;
}

async function expectedOutputs(manifest, schema, rootExports) {
  const outputs = new Map();
  const componentDocuments = [];
  for (const component of manifest.components) {
    const markdown = componentMarkdown(component);
    componentDocuments.push(markdown);
    outputs.set(`components/${component.id}.json`, json(component));
    outputs.set(`components/${component.id}.md`, markdown);
  }
  outputs.set('component-manifest.json', json(manifest));
  outputs.set('component-manifest.schema.json', json(schema));
  outputs.set('import-map.json', json(importMap(manifest.components, manifest.symbols)));
  outputs.set('root-export-map.json', json(rootExports));
  outputs.set('checklist.md', checklistMarkdown());
  outputs.set('common-mistakes.md', mistakesMarkdown(manifest.components));
  outputs.set('llms.txt', llmsIndex(manifest));
  outputs.set('llms-full.txt', llmsFull(manifest, componentDocuments));
  for (const recipe of manifest.recipes) {
    outputs.set(`recipes/${recipe.id}.ts`, recipe.code);
  }
  const prettierConfig = (await resolveConfig(paths.schema)) ?? {};
  const formatted = new Map();
  for (const [name, content] of outputs) {
    formatted.set(
      name,
      name.endsWith('.json') || name.endsWith('.md')
        ? await format(content, {
            ...prettierConfig,
            filepath: resolve(paths.generated, name),
          })
        : content,
    );
  }
  return formatted;
}

async function ensureOutput(path, content) {
  let current = '';
  try {
    current = await readFile(path, 'utf8');
  } catch {
    // Missing output is reported or written below.
  }
  if (current === content) return false;
  if (!writeMode) {
    throw new Error(
      `Agent contract is stale at ${normalizePath(relative(workspaceRoot, path))}. ` +
        'Run `node scripts/generate-agent-contract.mjs --write`.',
    );
  }
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content, 'utf8');
  return true;
}

async function assertNoStaleComponentFiles(root, expectedNames) {
  let names = [];
  try {
    names = await readdir(resolve(root, 'components'));
  } catch {
    return;
  }
  const stale = names.filter(
    (name) => (name.endsWith('.json') || name.endsWith('.md')) && !expectedNames.has(name),
  );
  if (stale.length) {
    throw new Error(
      `Stale generated component files in ${normalizePath(relative(workspaceRoot, root))}: ${stale.join(
        ', ',
      )}. Remove them after reviewing the catalog change.`,
    );
  }
}

async function assertNoStaleRecipeFiles(root, expectedNames) {
  let names = [];
  try {
    names = await readdir(resolve(root, 'recipes'));
  } catch {
    return;
  }
  const stale = names.filter((name) => name.endsWith('.ts') && !expectedNames.has(name));
  if (stale.length) {
    throw new Error(
      `Stale generated recipe files in ${normalizePath(relative(workspaceRoot, root))}: ${stale.join(
        ', ',
      )}. Remove them after reviewing the curated recipe change.`,
    );
  }
}

async function main() {
  const [
    packageJson,
    runtimeConfig,
    catalogSource,
    playgroundSource,
    schema,
    baseOverrides,
    nonStableContracts,
    curatedRecipes,
    migrations,
    examplesIndex,
    lifecycleSource,
  ] = await Promise.all([
    readJson(paths.packageJson),
    readJson(paths.runtimeEntrypoints),
    readFile(paths.catalog, 'utf8'),
    readFile(paths.playground, 'utf8'),
    readJson(paths.schema),
    readJson(paths.overrides),
    readJson(paths.nonStableContracts),
    readJson(paths.recipes),
    readJson(paths.migrations),
    readJson(paths.examplesIndex),
    readJson(paths.lifecycle),
  ]);
  const overrides = Object.fromEntries(
    unique([...Object.keys(baseOverrides), ...Object.keys(nonStableContracts)]).map((id) => [
      id,
      { ...(baseOverrides[id] ?? {}), ...(nonStableContracts[id] ?? {}) },
    ]),
  );
  const lifecycleRecords = lifecycleRegistry(lifecycleSource);
  const recipes = await compiledRecipes(curatedRecipes);
  const entrypoints = ownerEntrypoints(runtimeConfig);
  const { program, checker } = createCompiler(entrypoints);
  const symbols = publicSymbols(checker, program, entrypoints);
  const rootExports = rootExportMap(checker, program, runtimeConfig, symbols);
  const decorated = await decoratedComponents(program, checker);
  const bySelector = new Map();
  for (const component of decorated) {
    for (const selector of component.selectors) {
      if (bySelector.has(selector)) {
        throw new Error(`Selector ${selector} is implemented by more than one component class.`);
      }
      bySelector.set(selector, component);
    }
  }
  const runtimeComponents = Object.fromEntries(
    [...bySelector].map(([selector, component]) => [
      selector,
      {
        className: component.className,
        kind: component.kind,
        source: component.source,
        api: component.api,
      },
    ]),
  );
  const catalog = executeCatalog(catalogSource, runtimeComponents);
  const {
    definitions: playgroundDefinitions,
    exclusions: playgroundExclusions,
    coverage: playgroundCoverage,
    normalizeStateId,
  } = executePlayground(playgroundSource, catalog);
  if (
    playgroundCoverage.unclassified !== 0 ||
    playgroundCoverage.controlled + playgroundCoverage.excluded !==
      playgroundCoverage.publicInputsAndModels
  ) {
    throw new Error(
      `Playground public API coverage is incomplete: ${JSON.stringify(playgroundCoverage)}.`,
    );
  }
  const exclusionsById = new Map();
  for (const exclusion of playgroundExclusions) {
    const exclusions = exclusionsById.get(exclusion.componentId) ?? [];
    exclusions.push(exclusion);
    exclusionsById.set(exclusion.componentId, exclusions);
  }
  const playgroundById = new Map();
  for (const definition of playgroundDefinitions) {
    if (playgroundById.has(definition.id)) {
      throw new Error(`Duplicate playground definition "${definition.id}".`);
    }
    if (
      !Array.isArray(definition.scenarios) ||
      definition.scenarios.length === 0 ||
      !Array.isArray(definition.controls) ||
      definition.controls.length === 0 ||
      !Array.isArray(definition.presets) ||
      definition.presets.length === 0
    ) {
      throw new Error(`Playground definition "${definition.id}" is incomplete.`);
    }
    const publicInputsAndModels = catalog
      .find(({ id }) => id === definition.id)
      .api.filter(({ kind }) => kind === 'input' || kind === 'model').length;
    const controlled = definition.controls.filter(
      ({ binding }) => binding.kind === 'input' || binding.kind === 'model',
    ).length;
    const exclusions = exclusionsById.get(definition.id) ?? [];
    playgroundById.set(definition.id, {
      ...definition,
      apiCoverage: {
        publicInputsAndModels,
        controlled,
        excluded: exclusions.length,
        unclassified: publicInputsAndModels - controlled - exclusions.length,
      },
      exclusions,
    });
  }
  const missingPlaygrounds = catalog.map((item) => item.id).filter((id) => !playgroundById.has(id));
  const stalePlaygrounds = [...playgroundById.keys()].filter(
    (id) => !catalog.some((item) => item.id === id),
  );
  if (missingPlaygrounds.length || stalePlaygrounds.length) {
    throw new Error(
      [
        missingPlaygrounds.length
          ? `missing playground definitions: ${missingPlaygrounds.join(', ')}`
          : '',
        stalePlaygrounds.length
          ? `stale playground definitions: ${stalePlaygrounds.join(', ')}`
          : '',
      ]
        .filter(Boolean)
        .join('; '),
    );
  }
  for (const item of catalog) {
    const presetIds = new Set(playgroundById.get(item.id).presets.map(({ id }) => id));
    const missingAcceptanceStates = item.states.filter(
      (state) => !presetIds.has(normalizeStateId(state)),
    );
    if (missingAcceptanceStates.length > 0) {
      throw new Error(
        `${item.id} playground omits catalog acceptance states: ${missingAcceptanceStates.join(', ')}.`,
      );
    }
  }
  for (const item of catalog.filter(
    (candidate) => candidate.status === 'beta' || candidate.status === 'experimental',
  )) {
    const contract = nonStableContracts[item.id];
    if (!contract) {
      throw new Error(`${item.id} requires a curated non-stable agent contract.`);
    }
    for (const field of ['useWhen', 'avoidWhen', 'lifecycleRationale']) {
      if (typeof contract[field] !== 'string' || contract[field].length < 40) {
        throw new Error(`${item.id} requires a concrete ${field} agent contract.`);
      }
    }
    for (const field of ['keyboard', 'a11yNotes', 'knownLimitations']) {
      if (
        !Array.isArray(contract[field]) ||
        contract[field].length < 2 ||
        contract[field].some((value) => typeof value !== 'string' || value.length < 20)
      ) {
        throw new Error(`${item.id} requires at least two concrete ${field} entries.`);
      }
    }
  }
  const componentGroups = new Map();
  for (const item of catalog) {
    const implementation = bySelector.get(item.selector);
    if (!implementation) {
      throw new Error(`Catalog component ${item.id} has no compiler-visible ${item.selector}.`);
    }
    const group = componentGroups.get(implementation.symbol) ?? [];
    group.push({ ...implementation, catalogIds: [item.id] });
    componentGroups.set(implementation.symbol, group);
  }

  const components = catalog.map((item) => {
    const implementation = bySelector.get(item.selector);
    const symbolRecord = symbolRecordForComponent(symbols, implementation);
    if (!symbolRecord) {
      throw new Error(
        `Catalog component ${item.id} (${implementation.className}) is not exported by an owner entrypoint.`,
      );
    }
    const siblingItems = componentGroups.get(implementation.symbol) ?? [
      { ...implementation, catalogIds: [item.id] },
    ];
    const contract = publicComponentContract({
      item,
      decorated: implementation,
      symbolRecord,
      siblingItems,
      override: overrides[item.id],
      catalog,
      lifecycleRecord: lifecycleRecords.get(item.id),
      playground: playgroundById.get(item.id),
    });
    symbolRecord.componentIds = unique([...symbolRecord.componentIds, item.id]).sort(
      compareStrings,
    );
    return contract;
  });
  for (const component of components) {
    if (
      component.playground.apiCoverage.unclassified !== 0 ||
      component.playground.apiCoverage.controlled + component.playground.apiCoverage.excluded !==
        component.playground.apiCoverage.publicInputsAndModels
    ) {
      throw new Error(
        `${component.id}: playground API coverage is incomplete (${JSON.stringify(component.playground.apiCoverage)}).`,
      );
    }
    const excludedPublicNames = new Set();
    for (const exclusion of component.playground.exclusions) {
      if (
        exclusion.componentId !== component.id ||
        excludedPublicNames.has(exclusion.publicName) ||
        !exclusion.reason ||
        !exclusion.evidence?.pointer?.includes(component.id)
      ) {
        throw new Error(`${component.id}.${exclusion.publicName}: invalid exact API exclusion.`);
      }
      excludedPublicNames.add(exclusion.publicName);
    }
    const playgroundControlKeys = new Set(
      component.playground.controls.map((control) => control.key),
    );
    for (const control of component.playground.controls) {
      if (control.testValue === undefined || Object.is(control.testValue, control.defaultValue)) {
        throw new Error(
          `${component.id}.${control.key}: playground control requires a distinct testValue.`,
        );
      }
      if (control.binding.kind === 'input' || control.binding.kind === 'model') {
        const member = component.api.find(
          (candidate) => candidate.name === control.binding.publicName,
        );
        if (!member || member.kind !== control.binding.kind) {
          throw new Error(
            `${component.id}.${control.key} claims ${control.binding.kind} "${control.binding.publicName}" outside the compiler-derived public API.`,
          );
        }
      }
    }
    for (const preset of component.playground.presets) {
      validatePlaygroundFixtureEffect(component.id, preset);
      for (const key of Object.keys(preset.args)) {
        if (!playgroundControlKeys.has(key)) {
          throw new Error(
            `${component.id}.${preset.id} configures unknown playground argument "${key}".`,
          );
        }
      }
    }
    for (const member of component.api) {
      if (/^(?:Configures the public|Typed value that defines)/.test(member.description)) {
        throw new Error(
          `${component.id}.${member.name} requires a meaningful API description before publication.`,
        );
      }
    }
  }

  const publicNames = new Set(symbols.flatMap((symbol) => [symbol.name, ...symbol.aliases]));
  const exampleRecords = new Map(examplesIndex.examples.map((record) => [record.id, record]));
  if (
    examplesIndex.total !== components.length ||
    examplesIndex.examples.length !== components.length
  ) {
    throw new Error(
      `Compile-verified example index covers ${examplesIndex.examples.length}/${components.length} components.`,
    );
  }
  for (const component of components) {
    if (!publicNames.has(component.symbol)) {
      throw new Error(`${component.id} references non-public symbol ${component.symbol}.`);
    }
    const record = exampleRecords.get(component.id);
    if (!record) {
      throw new Error(`${component.id} has no compile-verified standalone example.`);
    }
    if (record.source !== `${component.id}.ts`) {
      throw new Error(
        `${component.id} example index source must be relative to examples/index.json.`,
      );
    }
    const transitionalAlias =
      writeMode &&
      record.importPath === component.importPath &&
      component.aliases.symbols.includes(record.symbol);
    if (
      record.importPath !== component.importPath ||
      (record.symbol !== component.symbol && !transitionalAlias)
    ) {
      throw new Error(`${component.id} example owner import is stale.`);
    }
    const exampleCode = await readFile(resolve(paths.examplesRoot, `${component.id}.ts`), 'utf8');
    component.examples = [compiledExample(component, record, exampleCode)];
    const required = component.api
      .filter((member) => member.kind === 'input' && member.required)
      .map((member) => member.name);
    for (const name of required) {
      if (!exampleCode.includes(name)) {
        throw new Error(`${component.id} compile-verified example omits required input ${name}.`);
      }
    }
  }

  const cleanSymbols = symbols.map(({ _target, _declaration, _exportNames, ...symbol }) => symbol);
  const sourceFiles = unique([
    ...decorated.map((component) => resolve(workspaceRoot, component.source)),
    ...cleanSymbols.map((symbol) => resolve(workspaceRoot, symbol.source)),
  ]).sort(compareStrings);
  const sourceTexts = await Promise.all(sourceFiles.map((path) => readFile(path, 'utf8')));
  const manifest = {
    $schema: './component-manifest.schema.json',
    schemaVersion,
    library: {
      package: packageName,
      version: packageJson.version,
      framework: {
        name: 'Angular',
        peerRange: packageJson.peerDependencies['@angular/core'],
      },
      requiredStyles: `${packageName}/styles/kern.css`,
      configuration: {
        provider: 'provideKrn',
        required: false,
        notes:
          'Injection-token defaults support zero-config rendering; use provideKrn for application-owned preferences.',
      },
      playground: playgroundQueryContract(),
      entrypoints: entrypoints.map((entrypoint) => entrypoint.importPath),
      sourceDigest: sourceDigest([catalogSource, playgroundSource, ...sourceTexts]),
    },
    components,
    symbols: cleanSymbols,
    recipes,
    migrations,
  };
  if (schema.properties?.schemaVersion?.const !== schemaVersion) {
    throw new Error(`Agent manifest schema must declare schemaVersion const "${schemaVersion}".`);
  }

  const outputs = await expectedOutputs(manifest, schema, rootExports);
  const expectedComponentNames = new Set(
    components.flatMap((component) => [`${component.id}.json`, `${component.id}.md`]),
  );
  await Promise.all([
    assertNoStaleComponentFiles(paths.generated, expectedComponentNames),
    assertNoStaleComponentFiles(paths.packageAgent, expectedComponentNames),
  ]);
  const expectedRecipeNames = new Set(recipes.map((recipe) => `${recipe.id}.ts`));
  await Promise.all([
    assertNoStaleRecipeFiles(paths.generated, expectedRecipeNames),
    assertNoStaleRecipeFiles(paths.packageAgent, expectedRecipeNames),
  ]);

  let changed = 0;
  for (const [name, content] of outputs) {
    changed += Number(await ensureOutput(resolve(paths.generated, name), content));
    changed += Number(await ensureOutput(resolve(paths.packageAgent, name), content));
  }
  const summary =
    `KERN agent contract ${writeMode ? 'generated' : 'is current'}: ` +
    `${components.length} components, ${cleanSymbols.length} public symbol groups, ` +
    `${recipes.length} recipes, ${migrations.length} migrations.`;
  console.log(summary);
  if (verboseMode && writeMode) {
    console.log(`Updated ${changed} mirrored files.`);
  }
}

await main();
