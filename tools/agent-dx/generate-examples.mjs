import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';

import { format, resolveConfig } from 'prettier';

import { KERN_AGENT_EXAMPLE_RECIPES } from './example-recipes.mjs';
import { internalButtonTriggerViolations } from './trigger-slot-policy.mjs';

const workspaceRoot = resolve(import.meta.dirname, '../..');
const manifestPath = join(workspaceRoot, 'metadata/agent/generated/component-manifest.json');
const outputRoots = [
  join(workspaceRoot, 'metadata/agent/examples'),
  join(workspaceRoot, 'projects/kern/agent/examples'),
];
const writeMode = process.argv.includes('--write');
const verboseMode = process.argv.includes('--verbose');

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function compare(left, right) {
  return left.localeCompare(right, 'en');
}

function pascalCase(value) {
  return value
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase() ?? ''}${part.slice(1)}`)
    .join('');
}

function digest(value) {
  return `sha256-${createHash('sha256').update(value).digest('hex')}`;
}

function selectorMarker(component) {
  const selector = (component.selector ?? component.selectors[0]).split(',')[0].trim();
  const attribute = /\[\s*([A-Za-z_][\w-]*)/.exec(selector);
  if (attribute) return attribute[1];
  return /^[A-Za-z][\w-]*/.exec(selector)?.[0] ?? selector;
}

function addImport(map, moduleName, symbol) {
  const symbols = map.get(moduleName) ?? new Set();
  symbols.add(symbol);
  map.set(moduleName, symbols);
}

function renderImports(component, recipe) {
  const values = new Map();
  const types = new Map();

  for (const symbol of ['ChangeDetectionStrategy', 'Component', ...(recipe.coreImports ?? [])]) {
    addImport(values, '@angular/core', symbol);
  }
  addImport(values, '@angular/platform-browser', 'bootstrapApplication');
  addImport(values, component.importPath, component.symbol);

  for (const [moduleName, symbols] of Object.entries(recipe.valueImports ?? {})) {
    for (const symbol of symbols) addImport(values, moduleName, symbol);
  }
  for (const [moduleName, symbols] of Object.entries(recipe.typeImports ?? {})) {
    for (const symbol of symbols) addImport(types, moduleName, symbol);
  }

  const moduleNames = unique([...values.keys(), ...types.keys()]).sort(compare);
  return moduleNames
    .map((moduleName) => {
      const valueSymbols = [...(values.get(moduleName) ?? [])].sort(compare);
      const typeSymbols = [...(types.get(moduleName) ?? [])]
        .filter((symbol) => !valueSymbols.includes(symbol))
        .sort(compare)
        .map((symbol) => `type ${symbol}`);
      return `import { ${[...valueSymbols, ...typeSymbols].join(', ')} } from '${moduleName}';`;
    })
    .join('\n');
}

function validateRecipe(component, recipe) {
  const failures = [];
  if (!recipe || typeof recipe !== 'object') failures.push('recipe is missing');
  if (!recipe?.title?.trim()) failures.push('title is missing');
  if (!recipe?.scenario?.trim()) failures.push('scenario is missing');
  if (!recipe?.template?.trim()) failures.push('template is missing');
  const marker = selectorMarker(component);
  if (marker && !recipe?.template?.includes(marker)) {
    failures.push(`template does not use public selector marker "${marker}"`);
  }
  if (/\bExample\b|Example title|\[options\]\s*=\s*"\[\]"/.test(recipe?.template ?? '')) {
    failures.push('template contains a generic fallback marker');
  }
  for (const violation of internalButtonTriggerViolations(
    recipe?.template ?? '',
    `${component.id}.template.html`,
  )) {
    failures.push(violation.message);
  }
  for (const assertion of recipe?.assertions ?? []) {
    const completeRecipe = [
      recipe.template,
      ...(recipe.declarations ?? []),
      ...(recipe.members ?? []),
      ...(recipe.providers ?? []),
    ].join('\n');
    if (!completeRecipe.includes(assertion)) {
      failures.push(`declared assertion marker is absent: ${JSON.stringify(assertion)}`);
    }
  }
  if (failures.length) {
    throw new Error(`Invalid agent example recipe "${component.id}": ${failures.join('; ')}.`);
  }
}

export function renderExample(component, recipe) {
  validateRecipe(component, recipe);
  const className = `Kern${pascalCase(component.id)}AgentExample`;
  const imports = renderImports(component, recipe);
  const componentImports = unique([component.symbol, ...(recipe.componentImports ?? [])]);
  const declarations = (recipe.declarations ?? []).join('\n\n');
  const members = (recipe.members ?? []).join('\n\n');
  const providerLine = recipe.providers?.length
    ? `  providers: [${recipe.providers.join(', ')}],\n`
    : '';
  const source = `/**
 * ${recipe.title}
 *
 * ${recipe.scenario}
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
${imports}

${declarations}
@Component({
  selector: 'app-kern-${component.id}-agent-example',
  standalone: true,
  imports: [${componentImports.join(', ')}],
${providerLine}  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
${recipe.template.trim()}
  \`,
})
export class ${className} {
${members}
}

void bootstrapApplication(${className});
`;
  return {
    className,
    source,
  };
}

async function expectedOutputs() {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const componentIds = manifest.components.map((component) => component.id);
  const recipeIds = Object.keys(KERN_AGENT_EXAMPLE_RECIPES);
  const missing = componentIds.filter((id) => !recipeIds.includes(id));
  const stale = recipeIds.filter((id) => !componentIds.includes(id));
  if (missing.length || stale.length) {
    throw new Error(
      [
        missing.length ? `Missing recipes: ${missing.join(', ')}` : '',
        stale.length ? `Stale recipes: ${stale.join(', ')}` : '',
      ]
        .filter(Boolean)
        .join('\n'),
    );
  }

  const prettierConfig = (await resolveConfig(join(workspaceRoot, 'package.json'))) ?? {};
  const files = new Map();
  const records = [];
  for (const component of manifest.components) {
    const recipe = KERN_AGENT_EXAMPLE_RECIPES[component.id];
    const rendered = renderExample(component, recipe);
    const formatted = await format(rendered.source, {
      ...prettierConfig,
      parser: 'typescript',
      filepath: `${component.id}.ts`,
    });
    files.set(`${component.id}.ts`, formatted);
    records.push({
      id: component.id,
      title: recipe.title,
      scenario: recipe.scenario,
      selector: component.selector,
      symbol: component.symbol,
      importPath: component.importPath,
      className: rendered.className,
      source: `${component.id}.ts`,
      verification: 'packed-package-aot',
      riskTags: recipe.riskTags ?? [],
      assertions: recipe.assertions ?? [],
      sourceDigest: digest(formatted),
    });
  }

  const index = {
    schemaVersion: '1.0.0',
    package: manifest.library.package,
    packageVersion: manifest.library.version,
    generatedFrom: 'tools/agent-dx/example-recipes.mjs',
    requiredStyles: manifest.library.requiredStyles,
    verificationCommand: 'node tools/verify-kern-agent-dx.mjs',
    total: records.length,
    examples: records,
  };
  files.set(
    'index.json',
    await format(`${JSON.stringify(index, null, 2)}\n`, {
      ...prettierConfig,
      parser: 'json',
      filepath: 'index.json',
    }),
  );
  files.set(
    'README.md',
    await format(
      `# KERN compile-verified examples

This directory contains one self-contained standalone Angular application source for every public
catalog entry. Each source imports KERN from its canonical owner entrypoint and is AOT-compiled
against the packed npm artifact by:

\`\`\`sh
node tools/verify-kern-agent-dx.mjs
\`\`\`

The registry is closed by design: adding a catalog item without an explicit recipe fails generation.
Load \`${manifest.library.requiredStyles}\` once in the consuming application's global styles.
`,
      {
        ...prettierConfig,
        parser: 'markdown',
        filepath: 'README.md',
      },
    ),
  );

  return { manifest, files, records };
}

async function existingGeneratedFiles(root) {
  try {
    const entries = await readdir(root, { withFileTypes: true });
    return entries
      .filter(
        (entry) =>
          entry.isFile() &&
          (entry.name.endsWith('.ts') || entry.name === 'index.json' || entry.name === 'README.md'),
      )
      .map((entry) => entry.name)
      .sort(compare);
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
}

async function synchronize() {
  const { files, records } = await expectedOutputs();
  const failures = [];
  let updated = 0;

  for (const root of outputRoots) {
    const expectedNames = [...files.keys()].sort(compare);
    const actualNames = await existingGeneratedFiles(root);
    const stale = actualNames.filter((name) => !files.has(name));
    if (stale.length) {
      failures.push(
        `${relative(workspaceRoot, root)} has stale generated files: ${stale.join(', ')}`,
      );
    }

    if (writeMode) await mkdir(root, { recursive: true });
    for (const name of expectedNames) {
      const target = join(root, name);
      const expected = files.get(name);
      let actual = null;
      try {
        actual = await readFile(target, 'utf8');
      } catch (error) {
        if (error?.code !== 'ENOENT') throw error;
      }
      if (actual === expected) continue;
      if (writeMode) {
        await mkdir(dirname(target), { recursive: true });
        await writeFile(target, expected, 'utf8');
        updated += 1;
      } else {
        failures.push(`${relative(workspaceRoot, target)} is missing or stale`);
      }
    }
  }

  if (failures.length) {
    throw new Error(
      `${failures.join('\n')}\nRun "node tools/agent-dx/generate-examples.mjs --write".`,
    );
  }

  const verb = writeMode ? `generated (${updated} file updates)` : 'is current';
  console.log(`KERN agent examples ${verb}: ${records.length} explicit standalone sources.`);
  if (verboseMode) {
    const highRisk = records.filter((record) => record.riskTags.length > 0).length;
    console.log(`Risk-tagged examples: ${highRisk}; output mirrors: ${outputRoots.length}.`);
  }
}

const isMain =
  process.argv[1] !== undefined && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;

if (isMain) {
  try {
    await synchronize();
  } catch (error) {
    console.error(
      `KERN agent example generation failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    process.exitCode = 1;
  }
}
