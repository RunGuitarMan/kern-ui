import { createHash } from 'node:crypto';
import { glob, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { format, resolveConfig } from 'prettier';

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lifecyclePath = resolve(workspaceRoot, 'projects/kern/api/lifecycle.json');
const inventoryPath = resolve(workspaceRoot, 'projects/kern/api/component-inventory.json');
const manualEvidencePath = resolve(workspaceRoot, 'docs/accessibility/manual-evidence.json');
const outputPath = resolve(workspaceRoot, 'projects/kern/api/lifecycle-evidence.json');

const performanceSuites = {
  'addon-charts:charts': ['perf-charts', 'Chart keyboard marks stay bounded'],
  'addon-grid:data-grid': ['perf-grid', 'virtual Data Grid keeps a 10k-row source'],
  'kit:feedback': ['perf-dialog', 'Dialog repeated open/close cycles'],
  'kit:forms': ['perf-forms', 'large typed-form primitives update'],
};

const commonArtifacts = {
  'catalog-a11y': ['tests/a11y/accessibility.spec.ts', 'specimen has no automated WCAG violations'],
  'catalog-keyboard': [
    'tests/e2e/quality-regressions.spec.ts',
    'visible enabled controls are keyboard reachable without focus geometry shifts',
  ],
  'catalog-ssr': [
    'tests/e2e/component-specimens.spec.ts',
    'raw SSR response contains every exact catalog route specimen',
  ],
  'catalog-hydration': [
    'tests/e2e/component-specimens.spec.ts',
    'hydration preserves every server-rendered specimen node',
  ],
  'catalog-visual': ['tests/visual/visual.spec.ts', 'default specimen matches its visual baseline'],
  'ssr-server': ['tests/support/serve-workspace.mjs', 'browser tests exercise server rendering'],
  'agent-aot-verifier': ['tools/verify-kern-agent-dx.mjs', 'Packed-package AOT emitted'],
  'responsive-suite': [
    'tests/responsive/responsive.spec.ts',
    'Responsive, RTL, and text zoom contracts',
  ],
  'lifecycle-policy': ['docs/LIFECYCLE.md', 'Current pre-1.0 promotion queue'],
  'perf-tree': ['tests/performance/runtime.spec.ts', 'Tree mounts 500 stable nodes'],
  'perf-select': [
    'tests/performance/runtime.spec.ts',
    'Select exposes the documented 1k-option stress envelope',
  ],
  'perf-charts': ['tests/performance/runtime.spec.ts', 'Chart keyboard marks stay bounded'],
  'perf-grid': ['tests/performance/runtime.spec.ts', 'virtual Data Grid keeps a 10k-row source'],
  'perf-dialog': ['tests/performance/runtime.spec.ts', 'Dialog repeated open/close cycles'],
  'perf-forms': ['tests/performance/runtime.spec.ts', 'large typed-form primitives update'],
  'mobile-overlay': ['tests/mobile-touch/risk-based.spec.ts', '[overlay]'],
  'mobile-form': ['tests/mobile-touch/risk-based.spec.ts', '[form]'],
  'mobile-pointer': ['tests/mobile-touch/risk-based.spec.ts', '[pointer]'],
  'mobile-scroll': ['tests/mobile-touch/risk-based.spec.ts', '[scroll]'],
};

function digest(content) {
  return `sha256-${createHash('sha256').update(content).digest('hex')}`;
}

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

function lifecycleById(lifecycle) {
  const records = new Map();
  for (const group of lifecycle.catalogGroups ?? []) {
    for (const id of group.ids ?? []) {
      if (records.has(id)) throw new Error(`Lifecycle component "${id}" is registered twice.`);
      records.set(id, {
        evidenceProfile: group.evidenceProfile,
        owner: group.owner,
        status: group.status,
      });
    }
  }
  return records;
}

function catalogInventory(inventory) {
  const records = new Map();
  for (const unit of inventory.units ?? []) {
    for (const catalog of unit.catalog ?? []) {
      if (records.has(catalog.id)) {
        throw new Error(`Inventory component "${catalog.id}" is registered twice.`);
      }
      records.set(catalog.id, {
        entrypoint: unit.entrypoint,
        family: unit.family,
        source: unit.source,
        symbol: unit.symbol,
      });
    }
  }
  return records;
}

async function componentUnitSuites() {
  const suites = [];
  for await (const path of glob('projects/kern/**/*.spec.ts', { cwd: workspaceRoot })) {
    if (path.includes('/testing/') || /\.(?:hydration|ssr)\.spec\.ts$/.test(path)) continue;
    suites.push({ path, source: await readFile(resolve(workspaceRoot, path), 'utf8') });
  }
  return suites.sort((left, right) => left.path.localeCompare(right.path));
}

function componentUnitSuite(component, suites) {
  const symbolPattern = new RegExp(`\\b${component.symbol}\\b`);
  const directPath = component.source.replace(/\.ts$/, '.spec.ts');
  const catalogPath = component.source.replace(/[^/]+\.ts$/, `${component.id}.spec.ts`);
  const sourceDirectory = component.source.slice(0, component.source.lastIndexOf('/') + 1);
  const candidates = suites
    .filter((suite) => symbolPattern.test(suite.source))
    .sort((left, right) => {
      const score = (path) => {
        if (path === catalogPath) return 0;
        if (path === directPath) return 1;
        if (path.startsWith(sourceDirectory)) return 2;
        return 3;
      };
      return score(left.path) - score(right.path) || left.path.localeCompare(right.path);
    });
  const suite = candidates[0];
  if (!suite) {
    throw new Error(
      `No component-specific unit evidence references ${component.symbol} for ${component.id}.`,
    );
  }
  return [suite.path, component.symbol];
}

async function generate() {
  const [lifecycle, inventory, manualEvidence, unitSuites] = await Promise.all([
    readJson(lifecyclePath),
    readJson(inventoryPath),
    readJson(manualEvidencePath),
    componentUnitSuites(),
  ]);
  const lifecycleRecords = lifecycleById(lifecycle);
  const inventoryRecords = catalogInventory(inventory);
  const artifacts = new Map();

  async function artifact(id, path, anchor = '') {
    const existing = artifacts.get(id);
    if (existing) return id;
    const content = await readFile(resolve(workspaceRoot, path), 'utf8');
    if (anchor && !content.includes(anchor)) {
      throw new Error(`Lifecycle artifact ${path} no longer contains anchor "${anchor}".`);
    }
    artifacts.set(id, { path, anchor, sha256: digest(content) });
    return id;
  }

  for (const [id, [path, anchor]] of Object.entries(commonArtifacts)) {
    await artifact(id, path, anchor);
  }

  const riskEvidence = new Map();
  for (const [profileName, profile] of Object.entries(lifecycle.riskEvidenceProfiles ?? {})) {
    if (typeof profile.requiredEvidence !== 'string' || !profile.requiredEvidence.trim()) {
      throw new Error(`Risk evidence profile "${profileName}" requires requiredEvidence.`);
    }
    if (
      !Array.isArray(profile.appliesToEvidenceProfiles) ||
      profile.appliesToEvidenceProfiles.length === 0
    ) {
      throw new Error(`Risk evidence profile "${profileName}" requires appliesToEvidenceProfiles.`);
    }
    for (const evidenceProfile of profile.appliesToEvidenceProfiles) {
      if (!lifecycle.evidenceProfiles?.[evidenceProfile]) {
        throw new Error(
          `Risk evidence profile "${profileName}" references unknown evidence profile "${evidenceProfile}".`,
        );
      }
    }
    if (!profile.families || Object.keys(profile.families).length === 0) {
      throw new Error(`Risk evidence profile "${profileName}" requires component families.`);
    }
    for (const [family, componentId] of Object.entries(profile.families ?? {})) {
      const component = lifecycleRecords.get(componentId);
      if (!component) {
        throw new Error(
          `Risk evidence profile "${profileName}" references unknown component "${componentId}".`,
        );
      }
      if (!profile.appliesToEvidenceProfiles.includes(component.evidenceProfile)) {
        throw new Error(
          `Risk evidence profile "${profileName}" does not apply to ${componentId}'s ` +
            `"${component.evidenceProfile}" profile.`,
        );
      }
      const artifactId = `mobile-${family}`;
      if (!artifacts.has(artifactId)) {
        throw new Error(
          `Risk evidence profile "${profileName}" has no materialized artifact for family "${family}".`,
        );
      }
      const records = riskEvidence.get(componentId) ?? [];
      if (records.some((record) => record.kind === profile.requiredEvidence)) {
        throw new Error(
          `Risk evidence "${componentId}:${profile.requiredEvidence}" is registered twice.`,
        );
      }
      records.push({
        kind: profile.requiredEvidence,
        artifactId,
      });
      riskEvidence.set(componentId, records);
    }
  }

  const components = [];
  for (const id of [...lifecycleRecords.keys()].sort()) {
    const lifecycleRecord = lifecycleRecords.get(id);
    const inventoryRecord = inventoryRecords.get(id);
    if (!inventoryRecord) throw new Error(`Lifecycle component "${id}" is absent from inventory.`);
    const source = await readFile(resolve(workspaceRoot, inventoryRecord.source), 'utf8');
    const familyKey = `${inventoryRecord.entrypoint}:${inventoryRecord.family}`;
    const [unitPath, unitAnchor] = componentUnitSuite({ id, ...inventoryRecord }, unitSuites);
    const unitArtifact = await artifact(`unit-${id}`, unitPath, unitAnchor);
    const apiArtifact = await artifact(
      `api-${inventoryRecord.entrypoint}`,
      `projects/kern/api/${inventoryRecord.entrypoint}.api.d.ts`,
    );
    const requiredKinds = new Set([
      ...(lifecycle.evidenceProfiles[lifecycleRecord.evidenceProfile]?.requiredEvidence ?? []),
      ...(riskEvidence.get(id) ?? []).map((risk) => risk.kind),
    ]);
    const risks = new Map((riskEvidence.get(id) ?? []).map((risk) => [risk.kind, risk]));
    const evidence = [];

    for (const kind of requiredKinds) {
      let artifactIds = [];
      let recordIds;
      let status = 'linked';
      let reason;
      switch (kind) {
        case 'api-baseline':
          artifactIds = [apiArtifact];
          break;
        case 'unit':
          artifactIds = [unitArtifact];
          break;
        case 'ssr':
          artifactIds = ['catalog-ssr', 'ssr-server'];
          break;
        case 'hydration':
          artifactIds = ['catalog-hydration', 'ssr-server'];
          break;
        case 'keyboard':
          artifactIds = ['catalog-keyboard', unitArtifact];
          break;
        case 'automated-a11y':
          artifactIds = ['catalog-a11y'];
          break;
        case 'visual-smoke':
        case 'visual-regression':
          artifactIds = ['catalog-visual'];
          break;
        case 'runtime-performance': {
          if (id === 'tree' || id === 'tree-navigation') {
            artifactIds = ['perf-tree'];
          } else if (['select', 'combobox', 'autocomplete', 'multi-select'].includes(id)) {
            artifactIds = ['perf-select'];
          } else {
            const performance = performanceSuites[familyKey];
            if (performance) artifactIds = [performance[0]];
          }
          if (artifactIds.length === 0) {
            status = 'pending';
            reason = 'No component-family runtime budget is linked yet.';
          }
          break;
        }
        case 'consumer-harness': {
          const exampleArtifact = await artifact(
            `agent-example-${id}`,
            `projects/kern/agent/examples/${id}.ts`,
          );
          artifactIds = [exampleArtifact, 'agent-aot-verifier'];
          break;
        }
        case 'manual-at': {
          recordIds = manualEvidence.records
            .filter((record) => record.required && record.componentIds.includes(id))
            .map((record) => record.id)
            .sort();
          if (!manualEvidence.targetComponentIds.includes(id) || recordIds.length === 0) {
            status = 'pending';
            reason = 'The component is not yet materialized in the required manual AT matrix.';
          }
          break;
        }
        case 'responsive':
          artifactIds = ['responsive-suite'];
          break;
        case 'adaptation-guidance': {
          const guidance = await artifact(
            `guidance-${id}`,
            `projects/kern/agent/components/${id}.md`,
            '## Use',
          );
          artifactIds = [guidance];
          break;
        }
        case 'owner':
        case 'limitations':
        case 'exit-criteria':
          artifactIds = ['lifecycle-policy'];
          break;
        case 'mobile-touch':
          artifactIds = [risks.get(kind).artifactId];
          break;
        default:
          throw new Error(`No lifecycle evidence materializer exists for "${kind}".`);
      }
      evidence.push({
        kind,
        status,
        ...(artifactIds.length ? { artifactIds } : {}),
        ...(recordIds ? { recordIds } : {}),
        ...(reason ? { reason } : {}),
      });
    }

    components.push({
      id,
      status: lifecycleRecord.status,
      evidenceProfile: lifecycleRecord.evidenceProfile,
      owner: lifecycleRecord.owner,
      source: inventoryRecord.source,
      sourceSha256: digest(source),
      symbol: inventoryRecord.symbol,
      evidence,
    });
  }

  return {
    $schema: './lifecycle-evidence.schema.json',
    schemaVersion: 1,
    libraryVersion: inventory.library.version,
    generatedBy: 'scripts/generate-lifecycle-evidence.mjs',
    artifacts: Object.fromEntries(
      [...artifacts].sort(([left], [right]) => left.localeCompare(right)),
    ),
    components,
  };
}

const prettierConfig = (await resolveConfig(outputPath)) ?? {};
const expected = await format(JSON.stringify(await generate()), {
  ...prettierConfig,
  filepath: outputPath,
});
if (process.argv.includes('--write')) {
  await writeFile(outputPath, expected, 'utf8');
  console.log('Kern per-component lifecycle evidence written.');
} else {
  let actual = '';
  try {
    actual = await readFile(outputPath, 'utf8');
  } catch {
    // The drift error below gives the same recovery command for missing and stale output.
  }
  if (actual !== expected) {
    console.error(
      'Kern per-component lifecycle evidence is stale. Run ' +
        '`node scripts/generate-lifecycle-evidence.mjs --write` after reviewing the evidence links.',
    );
    process.exitCode = 1;
  } else {
    console.log('Kern per-component lifecycle evidence is current.');
  }
}
