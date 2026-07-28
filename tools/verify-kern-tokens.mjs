import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const workspaceRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const tokenSourcePath = join(workspaceRoot, 'projects/kern/core/src/lib/foundations/tokens.ts');
const stylePaths = ['tokens.css', 'themes.css', 'density.css', 'preferences.css'].map((file) =>
  join(workspaceRoot, 'projects/kern/src/styles', file),
);

const tokenSource = readFileSync(tokenSourcePath, 'utf8');
const styleSource = stylePaths.map((file) => readFileSync(file, 'utf8')).join('\n');

const manifestNames = new Set(
  [...tokenSource.matchAll(/'(--krn-[a-z0-9-]+)'/g)].map((match) => match[1]),
);
const cssDefinitions = new Set(
  [...styleSource.matchAll(/(--krn-[a-z0-9-]+)\s*:/g)].map((match) => match[1]),
);

const missingFromCss = [...manifestNames].filter((name) => !cssDefinitions.has(name)).sort();
const missingFromManifest = [...cssDefinitions].filter((name) => !manifestNames.has(name)).sort();

if (missingFromCss.length || missingFromManifest.length) {
  if (missingFromCss.length) {
    console.error(`Tokens missing from CSS:\n${missingFromCss.join('\n')}`);
  }
  if (missingFromManifest.length) {
    console.error(
      `CSS variables missing from the token manifest:\n${missingFromManifest.join('\n')}`,
    );
  }
  process.exitCode = 1;
} else {
  console.log(`Kern token contract verified: ${manifestNames.size} names are in parity.`);
}
