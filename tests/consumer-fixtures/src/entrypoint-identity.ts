import * as addonCharts from '@kern-ui/angular/addon-charts';
import * as addonGrid from '@kern-ui/angular/addon-grid';
import * as cdk from '@kern-ui/angular/cdk';
import * as core from '@kern-ui/angular/core';
import * as kit from '@kern-ui/angular/kit';
import * as patterns from '@kern-ui/angular/patterns';
import * as root from '@kern-ui/angular';

type RuntimeNamespace = Readonly<Record<string, unknown>>;

const rootExports = root as RuntimeNamespace;
const entrypoints = {
  cdk: cdk as RuntimeNamespace,
  core: core as RuntimeNamespace,
  kit: kit as RuntimeNamespace,
  'addon-grid': addonGrid as RuntimeNamespace,
  'addon-charts': addonCharts as RuntimeNamespace,
  patterns: patterns as RuntimeNamespace,
} as const;
const owners = new Map<string, string>();
const failures: string[] = [];
const exportsByEntrypoint: Record<string, readonly string[]> = {};

for (const [entrypoint, module] of Object.entries(entrypoints)) {
  const exportNames = Object.keys(module)
    .filter((name) => name !== 'default')
    .sort();
  exportsByEntrypoint[entrypoint] = exportNames;

  for (const name of exportNames) {
    const existingOwner = owners.get(name);
    if (existingOwner) {
      failures.push(
        `Runtime export "${name}" is exposed by both "${existingOwner}" and "${entrypoint}".`,
      );
      continue;
    }
    owners.set(name, entrypoint);

    if (!(name in rootExports)) {
      failures.push(
        `Root compatibility entrypoint does not export "${name}" from "${entrypoint}".`,
      );
    } else if (!Object.is(rootExports[name], module[name])) {
      failures.push(`Root and "${entrypoint}" expose different runtime identities for "${name}".`);
    }
  }
}

for (const name of Object.keys(rootExports)) {
  if (name !== 'default' && !owners.has(name)) {
    failures.push(`Root runtime export "${name}" has no secondary entrypoint owner.`);
  }
}

if (failures.length) {
  throw new Error(`KERN entrypoint identity mismatch:\n- ${failures.join('\n- ')}`);
}

console.log(`KRN_ENTRYPOINT_IDENTITY:${JSON.stringify({ exportsByEntrypoint })}`);
