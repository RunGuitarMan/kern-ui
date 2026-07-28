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
];
const maxRuntimeBundleBytes = 1_425_000;
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
