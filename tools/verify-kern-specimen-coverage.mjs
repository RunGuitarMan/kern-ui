import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = resolve(workspaceRoot, 'metadata/agent/generated/component-manifest.json');
const specimenPath = resolve(
  workspaceRoot,
  'projects/showcase/specimen/src/lib/component-specimen.html',
);

const [manifestSource, specimenSource] = await Promise.all([
  readFile(manifestPath, 'utf8'),
  readFile(specimenPath, 'utf8'),
]);
const manifest = JSON.parse(manifestSource);
const renderedIds = new Set(
  [...specimenSource.matchAll(/@case\s*\(\s*'([^']+)'\s*\)/g)].map((match) => match[1]),
);
const catalogIds = manifest.components.map((component) => component.id);
const missing = catalogIds.filter((id) => !renderedIds.has(id));

if (manifest.components.length !== 131) {
  throw new Error(
    `Expected the closed 131-component catalog, received ${manifest.components.length}.`,
  );
}
if (missing.length) {
  throw new Error(
    `The shared Docs/Lab specimen is missing focused renderers for: ${missing.join(', ')}.`,
  );
}
if (!specimenSource.includes('@default')) {
  throw new Error('The shared specimen must keep an honest unknown-component state.');
}
if (!specimenSource.includes('Example pending')) {
  throw new Error(
    'The unknown-component state must not imply that an unimplemented preview works.',
  );
}
const nestedInteractiveTrigger = specimenSource.match(
  /<(?:button|a|input|select|textarea|krn-button|krn-icon-button)\b[^>]*\bkrn(?:Menu|Popover|HoverCard)Trigger\b/i,
);
if (nestedInteractiveTrigger) {
  throw new Error(
    `Internal-button trigger slots accept label content, not nested interactive controls: ${nestedInteractiveTrigger[0]}.`,
  );
}

console.log(
  `KERN specimen coverage verified: ${catalogIds.length}/${catalogIds.length} catalog components; ${renderedIds.size} explicit render branches.`,
);
