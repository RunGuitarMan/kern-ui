import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const workspaceRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = join(workspaceRoot, 'projects/kern/src');
const kernStylePath = join(sourceRoot, 'styles/kern.css');
const foundationStylePath = join(sourceRoot, 'styles/foundation.css');
const componentStyleRoot = join(sourceRoot, 'styles/components');
const stylePolicy = JSON.parse(
  readFileSync(join(workspaceRoot, 'projects/kern/api/style-policy.json'), 'utf8'),
);
const bundleBudgets = JSON.parse(
  readFileSync(join(workspaceRoot, 'projects/kern/api/bundle-budgets.json'), 'utf8'),
);
const runtimeEntrypoints = JSON.parse(
  readFileSync(join(workspaceRoot, 'projects/kern/api/runtime-entrypoints.json'), 'utf8'),
);
const familyStyles = [
  {
    family: 'actions',
    path: join(componentStyleRoot, 'actions.css'),
    leaves: [
      'actions-core.css',
      'actions-groups.css',
      'actions-menus.css',
      'actions-utilities.css',
    ],
  },
  {
    family: 'forms',
    path: join(componentStyleRoot, 'forms.css'),
    leaves: [
      'forms-foundation.css',
      'forms-selection.css',
      'forms-pickers.css',
      'forms-specialized.css',
    ],
  },
  {
    family: 'projection',
    path: join(componentStyleRoot, 'projection.css'),
    leaves: [],
  },
];
const failures = [];

function walk(directory, extension) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      return walk(path, extension);
    }
    return entry.name.endsWith(extension) ? [path] : [];
  });
}

function splitSelectorList(selectorList) {
  const selectors = [];
  let depth = 0;
  let start = 0;

  for (let index = 0; index < selectorList.length; index += 1) {
    const character = selectorList[index];
    if (character === '(' || character === '[') {
      depth += 1;
    } else if (character === ')' || character === ']') {
      depth -= 1;
    } else if (character === ',' && depth === 0) {
      selectors.push(selectorList.slice(start, index).trim());
      start = index + 1;
    }
  }

  selectors.push(selectorList.slice(start).trim());
  return selectors.filter(Boolean);
}

const componentSources = [
  ...walk(join(workspaceRoot, 'projects/kern/actions/src/lib/actions'), '.ts'),
  ...walk(join(workspaceRoot, 'projects/kern/forms/src/lib/forms'), '.ts'),
];

const kernProjectRoot = join(workspaceRoot, 'projects/kern');
const runtimeSourceRoots = [
  join(kernProjectRoot, 'src/lib'),
  ...readdirSync(kernProjectRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(kernProjectRoot, entry.name, 'src/lib')),
].filter(existsSync);
const runtimeComponentSources = runtimeSourceRoots.flatMap((sourceRoot) =>
  walk(sourceRoot, '.ts').filter(
    (path) => !path.endsWith('.spec.ts') && !path.endsWith('.hydration.spec.ts'),
  ),
);

for (const path of runtimeComponentSources) {
  if (readFileSync(path, 'utf8').includes('::ng-deep')) {
    failures.push(`${relative(workspaceRoot, path)} uses forbidden ::ng-deep styling.`);
  }
}

for (const path of componentSources) {
  const source = readFileSync(path, 'utf8');
  if (/['"]\.\/(?:actions|forms)\.css['"]/.test(source)) {
    failures.push(`${relative(workspaceRoot, path)} still embeds a shared family stylesheet.`);
  }
}

const kernStyle = readFileSync(kernStylePath, 'utf8');
const foundationStyle = readFileSync(foundationStylePath, 'utf8');

if (kernStyle.split("@import './foundation.css';").length - 1 !== 1) {
  failures.push('styles/kern.css must import foundation.css exactly once.');
}
for (const foundationFile of [
  'layers',
  'tokens',
  'themes',
  'density',
  'preferences',
  'reset',
  'base',
  'utilities',
]) {
  const expectedImport = `@import './${foundationFile}.css';`;
  if (foundationStyle.split(expectedImport).length - 1 !== 1) {
    failures.push(`styles/foundation.css must import ${foundationFile}.css exactly once.`);
  }
}

for (const { family, path, leaves } of familyStyles) {
  const expectedImport = `@import './components/${family}.css';`;
  const importCount = kernStyle.split(expectedImport).length - 1;
  if (importCount !== 1) {
    failures.push(`styles/kern.css must import ${family}.css exactly once (found ${importCount}).`);
  }

  const css = readFileSync(path, 'utf8');
  if (leaves.length) {
    const expectedAggregator = `${leaves.map((leaf) => `@import './${leaf}';`).join('\n')}\n`;
    if (css !== expectedAggregator) {
      failures.push(`${relative(workspaceRoot, path)} must remain a pure ordered aggregator.`);
    }
  }
}

const scopedStylePaths = [
  ...familyStyles.flatMap(({ path, leaves }) =>
    leaves.length ? leaves.map((leaf) => join(dirname(path), leaf)) : [path],
  ),
];

for (const path of scopedStylePaths) {
  const css = readFileSync(path, 'utf8');
  if (/:host(?:-context)?\b|::ng-deep/.test(css)) {
    failures.push(`${relative(workspaceRoot, path)} contains component-only Angular selectors.`);
  }

  const withoutComments = css.replaceAll(/\/\*[\s\S]*?\*\//g, '');
  const ruleHeaders = [...withoutComments.matchAll(/([^{}]+)\{/g)].map((match) => match[1].trim());

  for (const header of ruleHeaders) {
    if (
      header.startsWith('@') ||
      /^(?:from|to|\d+(?:\.\d+)?%)$/.test(header) ||
      header.includes('@keyframes')
    ) {
      continue;
    }

    for (const selector of splitSelectorList(header)) {
      if (/^(?:from|to|\d+(?:\.\d+)?%)$/.test(selector)) {
        continue;
      }

      if (!/(?:^|[\s:(>+~])\.?krn-/.test(selector)) {
        failures.push(
          `${relative(workspaceRoot, path)} has an unscoped global selector: ${selector}`,
        );
      }
    }
  }

  if (css.split('\n').length > 751) {
    failures.push(
      `${relative(workspaceRoot, path)} exceeds the 750-line shared-style module limit.`,
    );
  }
}

const actionStyles = readFileSync(join(componentStyleRoot, 'actions-utilities.css'), 'utf8');
const projectionStyles = readFileSync(join(componentStyleRoot, 'projection.css'), 'utf8');
if (!projectionStyles.includes('.krn-responsive-media :is(img, video, iframe, svg)')) {
  failures.push('Responsive Media projection styles must support wrapped media descendants.');
}
const linkFocusRule = actionStyles.match(/\.krn-link:focus-visible\s*\{([^}]*)\}/)?.[1] ?? '';
if (!linkFocusRule.includes('var(--krn-focus-ring')) {
  failures.push('Link focus-visible styles must use the public --krn-focus-ring token.');
}
if (linkFocusRule.includes('var(--_action-')) {
  failures.push('Link focus-visible styles must not depend on private action-root variables.');
}

const colorLiteral = /(?:#[0-9a-fA-F]{3,8}\b|(?:rgb|hsl|oklch|color)\([^)]*\))/g;
const dimensionLiteral = /(?<![-\w])(?:-?(?:\d+\.?\d*|\.\d+))(?:px|rem|em|ms|s|dvh|dvb|vw|vh)\b/g;
const controlledStyleFiles = [
  'base.css',
  'kern.css',
  'reset.css',
  'utilities.css',
  ...readdirSync(componentStyleRoot)
    .filter((name) => name.endsWith('.css') && !['actions.css', 'forms.css'].includes(name))
    .map((name) => `components/${name}`),
].sort();
const policyStyleFiles = Object.keys(stylePolicy.literalBudgets).sort();
if (JSON.stringify(controlledStyleFiles) !== JSON.stringify(policyStyleFiles)) {
  failures.push('style-policy.json must cover every non-token implementation stylesheet exactly.');
}
for (const styleFile of controlledStyleFiles) {
  const policy = stylePolicy.literalBudgets[styleFile];
  if (!policy) continue;
  const css = readFileSync(join(sourceRoot, 'styles', styleFile), 'utf8').replaceAll(
    /\/\*[\s\S]*?\*\//g,
    '',
  );
  const colors = css.match(colorLiteral)?.length ?? 0;
  const dimensions = css.match(dimensionLiteral)?.length ?? 0;
  if (colors > policy.colors || dimensions > policy.dimensions) {
    failures.push(
      `${styleFile} exceeds its non-token literal budget: colors ${colors}/${policy.colors}, dimensions ${dimensions}/${policy.dimensions}.`,
    );
  }
}

const bundleDirectory = join(workspaceRoot, 'dist/kern/fesm2022');
let bundleSummary = 'bundle not present';

if (existsSync(bundleDirectory)) {
  const expectedBudgetNames = [
    ...runtimeEntrypoints.entrypoints.map((entrypoint) => entrypoint.name),
    ...(runtimeEntrypoints.compatibilityEntrypoints ?? []).map((entrypoint) => entrypoint.name),
  ].sort();
  const actualBudgetNames = Object.keys(bundleBudgets.entrypoints).sort();
  if (JSON.stringify(expectedBudgetNames) !== JSON.stringify(actualBudgetNames)) {
    failures.push('bundle-budgets.json must cover every runtime and compatibility entrypoint.');
  }
  const sizes = [];
  for (const name of expectedBudgetNames) {
    const bundlePath = join(bundleDirectory, `kern-ui-angular-${name}.mjs`);
    if (!existsSync(bundlePath)) {
      failures.push(`Missing FESM bundle for ${name}.`);
      continue;
    }
    const bundle = readFileSync(bundlePath, 'utf8');
    const embeddedControlRoots = bundle.split('--_control-height:').length - 1;
    const embeddedActionRoots = bundle.split('--_action-height:').length - 1;
    const size = statSync(bundlePath).size;
    sizes.push(`${name}=${size}`);

    if (size > bundleBudgets.entrypoints[name]) {
      failures.push(
        `${name} FESM is ${size} bytes and exceeds its ${bundleBudgets.entrypoints[name]}-byte budget.`,
      );
    }

    if (embeddedControlRoots || embeddedActionRoots) {
      failures.push('The FESM still contains embedded shared form/action style roots.');
    }
  }
  bundleSummary = sizes.join(', ');
}

if (failures.length) {
  console.error(`Kern shared-style verification failed:\n- ${failures.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log(`Kern shared styles verified: ${bundleSummary}.`);
}
