import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { Script } from 'node:vm';
import { fileURLToPath } from 'node:url';

import { format, resolveConfig } from 'prettier';
import ts from 'typescript';

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const generatedContractPath = resolve(
  workspaceRoot,
  'projects/showcase/src/lib/generated-component-contract.ts',
);
const catalogPath = resolve(workspaceRoot, 'projects/showcase/src/lib/catalog.ts');
const playgroundPath = resolve(workspaceRoot, 'projects/showcase/specimen/src/lib/playground.ts');
const templatePath = resolve(
  workspaceRoot,
  'projects/showcase/specimen/src/lib/component-specimen.html',
);
const write = process.argv.includes('--write');

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

async function evaluateTypeScript(filePath, dependencies = new Map()) {
  const source = await readFile(filePath, 'utf8');
  const result = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: filePath,
    reportDiagnostics: true,
  });
  const diagnostics = (result.diagnostics ?? []).filter(
    ({ category }) => category === ts.DiagnosticCategory.Error,
  );
  invariant(
    diagnostics.length === 0,
    `Unable to evaluate ${filePath}:\n${ts.formatDiagnostics(diagnostics, {
      getCanonicalFileName: (name) => name,
      getCurrentDirectory: () => workspaceRoot,
      getNewLine: () => '\n',
    })}`,
  );

  const module = { exports: {} };
  const localRequire = (specifier) => {
    invariant(
      dependencies.has(specifier),
      `${filePath} has an unexpected runtime dependency on ${JSON.stringify(specifier)}.`,
    );
    return dependencies.get(specifier);
  };
  const wrapper = new Script(`(function (require, module, exports) {\n${result.outputText}\n})`, {
    filename: filePath,
  }).runInThisContext();
  wrapper(localRequire, module, module.exports);
  return module.exports;
}

const generatedContract = await evaluateTypeScript(generatedContractPath);
const showcase = await evaluateTypeScript(
  catalogPath,
  new Map([['./generated-component-contract', generatedContract]]),
);
const playground = await evaluateTypeScript(
  playgroundPath,
  new Map([['@kern-ui/showcase', showcase]]),
);

const selectorOverrides = Object.freeze({
  'confirmation-pattern': 'krn-confirmation',
  'drag-drop-upload': 'krn-drop-upload',
  'responsive-show-hide': 'krn-show',
  toast: 'krn-toast-viewport',
  tooltip: 'krn-icon-button',
  'verification-code': 'krn-otp-input',
});

const catalog = showcase.KERN_CATALOG;
const definitionsById = new Map(
  playground.KERN_PLAYGROUND_DEFINITIONS.map((definition) => [definition.id, definition]),
);
const autoKeys = playground.KERN_PLAYGROUND_AUTO_CONTROL_KEYS;
let template = await readFile(templatePath, 'utf8');
const original = template;
let bindingCount = 0;

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeTemplateString(value) {
  return value.replaceAll('\\', '\\\\').replaceAll("'", "\\'");
}

function findSelectorStart(source, selector, start, end) {
  const segment = source.slice(start, end);
  const match = new RegExp(`<${escapeRegExp(selector)}(?=[\\s/>])`).exec(segment);
  return match ? start + match.index : -1;
}

function expressionFor(control) {
  if (control.kind === 'boolean') {
    return `booleanArgument('${control.key}', ${String(control.defaultValue)})`;
  }
  if (
    control.kind === 'number' ||
    control.kind === 'range' ||
    typeof control.defaultValue === 'number'
  ) {
    return `numberArgument('${control.key}', ${String(control.defaultValue)})`;
  }
  return `stringArgument('${control.key}', '${escapeTemplateString(String(control.defaultValue))}')`;
}

function replaceOrInsertBinding(openingTag, publicName, expression, tagIndent) {
  const escaped = escapeRegExp(publicName);
  const binding = `[${publicName}]="${expression}"`;
  const boundPatterns = [
    new RegExp(`\\[\\(${escaped}\\)\\]\\s*=\\s*\"[^\"]*\"`),
    new RegExp(`\\[${escaped}\\]\\s*=\\s*\"[^\"]*\"`),
  ];
  for (const pattern of boundPatterns) {
    if (pattern.test(openingTag)) return openingTag.replace(pattern, binding);
  }

  const staticPattern = new RegExp(`(^|\\s)${escaped}\\s*=\\s*\"[^\"]*\"`);
  if (staticPattern.test(openingTag)) {
    return openingTag.replace(staticPattern, (match, prefix) => `${prefix}${binding}`);
  }
  const barePattern = new RegExp(`(^|\\s)${escaped}(?=\\s|/?>)`);
  if (barePattern.test(openingTag)) {
    return openingTag.replace(barePattern, (match, prefix) => `${prefix}${binding}`);
  }

  const attributeIndent = `${tagIndent}  `;
  if (openingTag.includes('\n')) {
    const closingIndex = openingTag.lastIndexOf('/>');
    const normalClosingIndex = openingTag.lastIndexOf('>');
    const index = closingIndex >= 0 ? closingIndex : normalClosingIndex;
    return `${openingTag.slice(0, index).trimEnd()}\n${attributeIndent}${binding}\n${tagIndent}${openingTag.slice(index)}`;
  }
  const close = openingTag.endsWith('/>') ? '/>' : '>';
  return `${openingTag.slice(0, -close.length).trimEnd()} ${binding}${close}`;
}

function removeGeneratedBindings(openingTag, controls, selector, selfClosing) {
  let repaired = openingTag;
  const truncatedSelector = selector.slice(0, -1);
  if (repaired.startsWith(`<${truncatedSelector} `)) {
    repaired = `<${selector}${repaired.slice(truncatedSelector.length + 1)}`;
  }
  for (const control of controls) {
    const binding = control.binding;
    const generated = `[${binding.publicName}]="${expressionFor(control)}"`;
    repaired = repaired.replaceAll(generated, '');
    repaired = repaired.replaceAll(generated.slice(0, -1), '');
  }
  while (/\n[ \t]*\n/.test(repaired)) {
    repaired = repaired.replace(/\n[ \t]*\n/g, '\n');
  }
  repaired = repaired.replace(/[ \t]{2,}(?=\[|\/?>)/g, ' ');
  if (selfClosing) {
    repaired = `${repaired.slice(0, -2).replaceAll('>', '').trimEnd()} />`;
  }
  const quoteCount = [...repaired].filter((character) => character === '"').length;
  if (quoteCount % 2 !== 0) {
    const close = repaired.endsWith('/>') ? '/>' : '>';
    repaired = `${repaired.slice(0, -close.length).trimEnd()}"${close}`;
  }
  return repaired;
}

for (let index = catalog.length - 1; index >= 0; index -= 1) {
  const item = catalog[index];
  const definition = definitionsById.get(item.id);
  invariant(definition, `${item.id}: missing playground definition.`);
  const keys = new Set(autoKeys[item.id] ?? []);
  if (keys.size === 0) continue;

  const marker = `@case ('${item.id}')`;
  const segmentStart = template.indexOf(marker);
  invariant(segmentStart >= 0, `${item.id}: specimen case is missing.`);
  const nextItem = catalog[index + 1];
  const segmentEnd = nextItem
    ? template.indexOf(`@case ('${nextItem.id}')`, segmentStart + marker.length)
    : template.length;
  invariant(segmentEnd > segmentStart, `${item.id}: specimen case boundary is invalid.`);

  const selector = selectorOverrides[item.id] ?? item.selector;
  let tagStart = findSelectorStart(template, selector, segmentStart, segmentEnd);
  if (!(tagStart >= segmentStart && tagStart < segmentEnd)) {
    tagStart = findSelectorStart(template, selector.slice(0, -1), segmentStart, segmentEnd);
  }
  invariant(
    tagStart >= segmentStart && tagStart < segmentEnd,
    `${item.id}: cannot find renderer target <${selector}> in its specimen case.`,
  );
  const nextElement = template.indexOf('<', tagStart + 1);
  const slashClose = template.indexOf('/>', tagStart);
  const selfClosing = slashClose >= 0 && (nextElement < 0 || slashClose < nextElement);
  const tagEnd = selfClosing ? slashClose + 1 : template.indexOf('>', tagStart);
  invariant(tagEnd > tagStart && tagEnd < segmentEnd, `${item.id}: renderer tag is malformed.`);
  let openingTag = template.slice(tagStart, tagEnd + 1);
  const lineStart = template.lastIndexOf('\n', tagStart) + 1;
  const tagIndent = /^\s*/.exec(template.slice(lineStart, tagStart))?.[0] ?? '';
  const controls = definition.controls.filter((control) => keys.has(control.key));
  openingTag = removeGeneratedBindings(openingTag, controls, selector, selfClosing);

  for (const control of controls) {
    const binding = control.binding;
    invariant(
      binding.kind === 'input' || binding.kind === 'model',
      `${item.id}.${control.key}: automatic control must bind a public input/model.`,
    );
    openingTag = replaceOrInsertBinding(
      openingTag,
      binding.publicName,
      expressionFor(control),
      tagIndent,
    );
    bindingCount += 1;
  }
  template = `${template.slice(0, tagStart)}${openingTag}${template.slice(tagEnd + 1)}`;
}

template = await format(template, {
  ...((await resolveConfig(templatePath)) ?? {}),
  filepath: templatePath,
});

if (template !== original) {
  invariant(
    write,
    `Specimen public API bindings are stale (${bindingCount} automatic bindings). Run "node tools/sync-kern-specimen-public-api-bindings.mjs --write".`,
  );
  await writeFile(templatePath, template);
  console.log(`Updated ${bindingCount} automatic public API bindings in the specimen template.`);
} else {
  console.log(`Verified ${bindingCount} automatic public API bindings in the specimen template.`);
}
