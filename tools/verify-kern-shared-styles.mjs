import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const workspaceRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = join(workspaceRoot, 'projects/kern/src');
const kernStylePath = join(sourceRoot, 'styles/kern.css');
const sharedStyles = [
  {
    family: 'actions',
    path: join(sourceRoot, 'styles/components/actions.css'),
  },
  {
    family: 'forms',
    path: join(sourceRoot, 'styles/components/forms.css'),
  },
  {
    family: 'projection',
    path: join(sourceRoot, 'styles/components/projection.css'),
  },
];
// The reactive locale/input runtime and typed overlay state add 15.5 kB (1.05%) over
// the pre-hardening 1,480,500-byte bundle. Keep only 4 kB of regression headroom.
const maxRuntimeBundleBytes = 1_500_000;
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
  ...walk(join(workspaceRoot, 'projects/kern/kit/src/lib/actions'), '.ts'),
  ...walk(join(workspaceRoot, 'projects/kern/kit/src/lib/forms'), '.ts'),
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

for (const { family, path } of sharedStyles) {
  const expectedImport = `@import './components/${family}.css';`;
  const importCount = kernStyle.split(expectedImport).length - 1;
  if (importCount !== 1) {
    failures.push(`styles/kern.css must import ${family}.css exactly once (found ${importCount}).`);
  }

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
}

const actionStyles = readFileSync(sharedStyles[0].path, 'utf8');
const projectionStyles = readFileSync(sharedStyles[2].path, 'utf8');
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

const bundleDirectory = join(workspaceRoot, 'dist/kern/fesm2022');
let bundleSummary = 'bundle not present';

if (existsSync(bundleDirectory)) {
  const bundlePath = readdirSync(bundleDirectory)
    .filter((name) => name.endsWith('.mjs'))
    .map((name) => join(bundleDirectory, name))
    .sort((left, right) => statSync(right).size - statSync(left).size)[0];

  if (bundlePath) {
    const bundle = readFileSync(bundlePath, 'utf8');
    const embeddedControlRoots = bundle.split('--_control-height:').length - 1;
    const embeddedActionRoots = bundle.split('--_action-height:').length - 1;
    bundleSummary = `${statSync(bundlePath).size} bytes; embedded roots: forms=${embeddedControlRoots}, actions=${embeddedActionRoots}`;

    if (statSync(bundlePath).size > maxRuntimeBundleBytes) {
      failures.push(
        `The primary uncompressed FESM exceeds the ${maxRuntimeBundleBytes} byte regression budget.`,
      );
    }

    if (embeddedControlRoots || embeddedActionRoots) {
      failures.push('The FESM still contains embedded shared form/action style roots.');
    }
  }
}

if (failures.length) {
  console.error(`Kern shared-style verification failed:\n- ${failures.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log(`Kern shared styles verified: ${bundleSummary}.`);
}
