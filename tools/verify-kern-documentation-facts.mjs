import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const workspaceRoot = resolve(import.meta.dirname, '..');

async function readJson(path) {
  return JSON.parse(await readFile(join(workspaceRoot, path), 'utf8'));
}

async function readText(path) {
  return readFile(join(workspaceRoot, path), 'utf8');
}

function countLifecycleSymbols(lifecycle) {
  return (lifecycle.symbolGroups ?? []).reduce(
    (count, group) => count + (group.symbols?.length ?? 0),
    0,
  );
}

function requireText(issues, path, content, expected) {
  const normalizedContent = content.replaceAll(/\s+/g, ' ');
  const normalizedExpected = expected.replaceAll(/\s+/g, ' ');
  if (!normalizedContent.includes(normalizedExpected)) {
    issues.push(`${path} must contain: ${expected}`);
  }
}

function forbidText(issues, path, content, forbidden) {
  if (content.includes(forbidden)) issues.push(`${path} contains stale text: ${forbidden}`);
}

function measuredRow(measurements, cases, name) {
  const measurement = measurements.cases.find((item) => item.name === name);
  const budget = cases.cases.find((item) => item.name === name);
  if (!measurement || !budget) throw new Error(`Missing consumer fact for ${name}.`);
  return {
    raw: measurement.bytes.toLocaleString('en-US'),
    gzip: measurement.gzipBytes.toLocaleString('en-US'),
    maximumRaw: budget.maximumJsBytes.toLocaleString('en-US'),
    maximumGzip: budget.maximumGzipBytes.toLocaleString('en-US'),
  };
}

export async function documentationFactIssues() {
  const [
    inventory,
    lifecycle,
    packageManifest,
    releasePolicy,
    runtimeEntrypoints,
    bundleBudgets,
    cases,
    measurements,
  ] = await Promise.all([
    readJson('projects/kern/api/component-inventory.json'),
    readJson('projects/kern/api/lifecycle.json'),
    readJson('projects/kern/package.json'),
    readJson('projects/kern/api/release-policy.json'),
    readJson('projects/kern/api/runtime-entrypoints.json'),
    readJson('projects/kern/api/bundle-budgets.json'),
    readJson('tests/consumer-fixtures/cases.json'),
    readJson('tests/consumer-fixtures/measurements.json'),
  ]);
  const paths = [
    'README.md',
    'docs/ARCHITECTURE.md',
    'docs/COMPONENTS.md',
    'docs/CONSUMER_QUALITY_GATES.md',
    'docs/COOKBOOK.md',
    'docs/DEPRECATIONS.md',
    'docs/LIFECYCLE.md',
    'docs/RELEASING.md',
    'docs/VERSIONING.md',
  ];
  const documents = new Map(
    await Promise.all(paths.map(async (path) => [path, await readText(path)])),
  );
  const issues = [];
  const summary = inventory.summary;
  const statuses = Object.fromEntries(
    (lifecycle.catalogGroups ?? []).map((group) => [group.status, 0]),
  );
  for (const group of lifecycle.catalogGroups ?? []) {
    statuses[group.status] = (statuses[group.status] ?? 0) + group.ids.length;
  }

  requireText(
    issues,
    'README.md',
    documents.get('README.md'),
    `Kern contains ${summary.catalogEntryCount} catalog entries`,
  );
  requireText(
    issues,
    'README.md',
    documents.get('README.md'),
    `${summary.catalogEntryCount} standalone examples`,
  );
  for (const path of ['docs/ARCHITECTURE.md', 'docs/COOKBOOK.md']) {
    requireText(issues, path, documents.get(path), `${summary.catalogEntryCount}`);
  }
  const components = documents.get('docs/COMPONENTS.md');
  for (const value of [
    summary.catalogEntryCount,
    summary.catalogReviewUnitCount,
    summary.publicReviewUnitCount,
    summary.supportingReviewUnitCount,
    summary.internalImplementationCount,
    statuses.stable,
    statuses.beta,
    statuses.experimental,
    statuses.recipe,
  ]) {
    requireText(issues, 'docs/COMPONENTS.md', components, String(value));
  }
  const lifecycleDocument = documents.get('docs/LIFECYCLE.md');
  requireText(
    issues,
    'docs/LIFECYCLE.md',
    lifecycleDocument,
    `all ${summary.catalogEntryCount} catalog entries and all ${countLifecycleSymbols(lifecycle)} named exports`,
  );
  requireText(
    issues,
    'docs/LIFECYCLE.md',
    lifecycleDocument,
    `The ${statuses.beta} beta catalog entries`,
  );

  const versioning = documents.get('docs/VERSIONING.md');
  requireText(
    issues,
    'docs/VERSIONING.md',
    versioning,
    `Current public ${packageManifest.version} line`,
  );
  forbidText(issues, 'docs/VERSIONING.md', versioning, 'Unreleased candidate');
  requireText(
    issues,
    'docs/DEPRECATIONS.md',
    documents.get('docs/DEPRECATIONS.md'),
    `first public \`${packageManifest.version}\` release`,
  );
  requireText(
    issues,
    'docs/RELEASING.md',
    documents.get('docs/RELEASING.md'),
    `\`${releasePolicy.bootstrapVersion}\``,
  );

  const qualityGates = documents.get('docs/CONSUMER_QUALITY_GATES.md');
  const canonicalEntrypoints = runtimeEntrypoints.entrypoints.map((entrypoint) => entrypoint.name);
  const compatibilityEntrypoints = (runtimeEntrypoints.compatibilityEntrypoints ?? []).map(
    (entrypoint) => entrypoint.name,
  );
  const budgetEntrypoints = Object.keys(bundleBudgets.entrypoints).sort();
  const expectedBudgetEntrypoints = [...canonicalEntrypoints, ...compatibilityEntrypoints].sort();
  if (JSON.stringify(budgetEntrypoints) !== JSON.stringify(expectedBudgetEntrypoints)) {
    issues.push('bundle-budgets.json must cover every documented runtime entrypoint exactly');
  }
  requireText(
    issues,
    'docs/CONSUMER_QUALITY_GATES.md',
    qualityGates,
    `all ${canonicalEntrypoints.length} canonical runtime subpaths`,
  );
  for (const name of [...canonicalEntrypoints, ...compatibilityEntrypoints]) {
    requireText(
      issues,
      'docs/ARCHITECTURE.md',
      documents.get('docs/ARCHITECTURE.md'),
      `\`${name}\``,
    );
    requireText(issues, 'docs/VERSIONING.md', versioning, `/${name}`);
  }
  for (const styleExport of [
    './styles/kern.css',
    './styles/foundation.css',
    './styles/reset.css',
    './styles/components/actions.css',
    './styles/components/forms.css',
  ]) {
    if (!packageManifest.exports?.[styleExport]) {
      issues.push(`projects/kern/package.json is missing documented style export ${styleExport}`);
    }
  }
  for (const name of ['button', 'button-i18n', 'select', 'grid', 'charts']) {
    const fact = measuredRow(measurements, cases, name);
    requireText(
      issues,
      'docs/CONSUMER_QUALITY_GATES.md',
      qualityGates,
      `${fact.raw} / ${fact.gzip} B`,
    );
    requireText(
      issues,
      'docs/CONSUMER_QUALITY_GATES.md',
      qualityGates,
      `${fact.maximumRaw} / ${fact.maximumGzip} B`,
    );
  }
  requireText(
    issues,
    'docs/CONSUMER_QUALITY_GATES.md',
    qualityGates,
    `${summary.catalogEntryCount} explicit Docs preview renderers`,
  );

  return issues;
}

const issues = await documentationFactIssues();
if (issues.length) {
  console.error(`Kern documentation facts failed:\n- ${issues.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log('Kern documentation facts match machine-readable architecture and bundle evidence.');
}
