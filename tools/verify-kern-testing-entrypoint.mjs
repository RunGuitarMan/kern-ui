import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const packageRoot = join(import.meta.dirname, '..', 'dist', 'kern');
const packageJsonPath = join(packageRoot, 'package.json');

function fail(message) {
  console.error(`Kern testing entry point verification failed: ${message}`);
  process.exitCode = 1;
}

if (!existsSync(packageJsonPath)) {
  fail('dist/kern/package.json is missing. Run "npm run build:kern" first.');
} else {
  const manifest = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  const testingExport = manifest.exports?.['./testing'];

  if (
    typeof testingExport !== 'object' ||
    typeof testingExport.types !== 'string' ||
    typeof testingExport.default !== 'string'
  ) {
    fail('package.json does not expose both types and default conditions for "./testing".');
  } else {
    const declarationsPath = join(packageRoot, testingExport.types);
    const modulePath = join(packageRoot, testingExport.default);
    const primaryExport = manifest.exports?.['.']?.default;
    const primaryModulePath =
      typeof primaryExport === 'string' ? join(packageRoot, primaryExport) : null;

    for (const path of [declarationsPath, modulePath]) {
      if (!existsSync(path)) {
        fail(`declared artifact is missing: ${path}`);
      }
    }

    if (existsSync(declarationsPath) && existsSync(modulePath)) {
      const declarations = readFileSync(declarationsPath, 'utf8');
      const moduleSource = readFileSync(modulePath, 'utf8');
      const importSpecifiers = [
        ...moduleSource.matchAll(/^\s*import\s+[^;\n]+?\s+from\s+['"]([^'"]+)['"];?/gm),
      ].map((match) => match[1]);
      const requiredHarnesses = [
        'KrnButtonHarness',
        'KrnDataGridHarness',
        'KrnDialogHarness',
        'KrnFormControlHarness',
        'KrnFormFieldHarness',
        'KrnSelectHarness',
      ];

      for (const harness of requiredHarnesses) {
        if (!declarations.includes(`class ${harness}`)) {
          fail(`public declarations do not include ${harness}.`);
        }
      }

      const forbiddenImports = importSpecifiers.filter(
        (specifier) =>
          specifier === '@angular/core' ||
          specifier === '@kern-ui/angular' ||
          specifier.startsWith('@kern-ui/angular/'),
      );
      if (forbiddenImports.length) {
        fail(
          `test-only bundle imports runtime entry points: ${[...new Set(forbiddenImports)].join(
            ', ',
          )}.`,
        );
      }

      if (/\bInjectionToken\b|\bKRN_[A-Z0-9_]+\b/.test(moduleSource)) {
        fail('test-only bundle contains runtime injection-token code.');
      }

      if (primaryModulePath && existsSync(primaryModulePath)) {
        const primaryModuleSource = readFileSync(primaryModulePath, 'utf8');
        if (requiredHarnesses.some((harness) => primaryModuleSource.includes(`class ${harness}`))) {
          fail('a testing harness leaked into the primary runtime bundle.');
        }
      }

      if (statSync(modulePath).size > 100_000) {
        fail('test-only FESM exceeds the 100 kB uncompressed budget.');
      }

      if (!process.exitCode) {
        console.log(
          `Kern testing entry point verified: ${requiredHarnesses.length} core harnesses, ` +
            `${statSync(modulePath).size} byte isolated FESM.`,
        );
      }
    }
  }
}
