import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const defaultEvidencePath = resolve(workspaceRoot, 'docs/accessibility/manual-evidence.json');
const defaultLifecyclePath = resolve(workspaceRoot, 'projects/kern/api/lifecycle.json');
const packageManifestPath = resolve(workspaceRoot, 'projects/kern/package.json');
const requiredRecordIds = new Set([
  'jaws-edge-windows',
  'keyboard-only-windows',
  'nvda-firefox-windows',
  'voiceover-safari-macos',
  'windows-high-contrast',
  'zoom-reflow-desktop',
]);
const screenReaderRecords = new Set([
  'jaws-edge-windows',
  'nvda-firefox-windows',
  'voiceover-safari-macos',
]);
const validStatuses = new Set(['pending', 'pass', 'fail', 'blocked']);
const issues = [];

function option(name, fallback) {
  const prefix = `--${name}=`;
  const argument = process.argv.find((value) => value.startsWith(prefix));
  return argument ? resolve(workspaceRoot, argument.slice(prefix.length)) : fallback;
}

async function readJson(path, label) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    throw new Error(
      `${label} could not be read at ${path}: ${error instanceof Error ? error.message : error}`,
    );
  }
}

function report(message) {
  issues.push(message);
}

function lifecycleIds(lifecycle) {
  const ids = new Set();
  for (const group of lifecycle.catalogGroups ?? []) {
    for (const id of group.ids ?? []) ids.add(id);
  }
  return ids;
}

function isIsoTimestamp(value) {
  return (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value) &&
    !Number.isNaN(Date.parse(value))
  );
}

function validateNamedVersion(value, label, completed) {
  if (!value || typeof value !== 'object') {
    report(`${label} must be an object.`);
    return;
  }
  if (typeof value.name !== 'string' || !value.name.trim()) {
    report(`${label}.name is required.`);
  }
  if (completed && (typeof value.version !== 'string' || !value.version.trim())) {
    report(`${label}.version is required for completed evidence.`);
  }
  if (!completed && value.version !== null) {
    report(`${label}.version must remain null while evidence is pending or blocked.`);
  }
}

function validateRecord(record, index, knownIds) {
  const label = `records[${index}]`;
  if (!record || typeof record !== 'object') {
    report(`${label} must be an object.`);
    return;
  }
  if (typeof record.id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.id)) {
    report(`${label}.id must be a kebab-case identifier.`);
  }
  if (typeof record.purpose !== 'string' || record.purpose.length < 20) {
    report(`${label}.purpose must explain the scope.`);
  }
  if (!Array.isArray(record.componentIds) || record.componentIds.length === 0) {
    report(`${label}.componentIds must be non-empty.`);
  } else {
    if (new Set(record.componentIds).size !== record.componentIds.length) {
      report(`${label}.componentIds contains duplicates.`);
    }
    for (const id of record.componentIds) {
      if (!knownIds.has(id)) report(`${label} references unknown component "${id}".`);
    }
  }
  if (!Array.isArray(record.checks) || record.checks.length === 0) {
    report(`${label}.checks must be non-empty.`);
  }
  if (!validStatuses.has(record.status)) report(`${label} has invalid status "${record.status}".`);
  if (typeof record.required !== 'boolean') report(`${label}.required must be boolean.`);
  if (typeof record.releaseBlocking !== 'boolean') {
    report(`${label}.releaseBlocking must be boolean.`);
  }
  if (record.releaseBlocking && record.status !== 'pass') {
    report(`${label} is release-blocking but does not have passing evidence.`);
  }

  const completed = record.status === 'pass' || record.status === 'fail';
  const environment = record.environment;
  if (!environment || typeof environment !== 'object') {
    report(`${label}.environment must be an object.`);
  } else {
    validateNamedVersion(
      environment.operatingSystem,
      `${label}.environment.operatingSystem`,
      completed,
    );
    validateNamedVersion(environment.browser, `${label}.environment.browser`, completed);
    validateNamedVersion(
      environment.assistiveTechnology,
      `${label}.environment.assistiveTechnology`,
      completed,
    );
    validateNamedVersion(environment.input, `${label}.environment.input`, completed);
  }

  if (completed) {
    if (!isIsoTimestamp(record.testedAt))
      report(`${label}.testedAt requires an ISO UTC timestamp.`);
    if (typeof record.tester !== 'string' || record.tester.trim().length < 2) {
      report(`${label}.tester is required for completed evidence.`);
    }
    if (typeof record.verifiedBy !== 'string' || record.verifiedBy.trim().length < 2) {
      report(`${label}.verifiedBy is required for completed evidence.`);
    }
    if (record.tester === record.verifiedBy) {
      report(`${label} must be independently reviewed by someone other than the tester.`);
    }
    if (!Array.isArray(record.evidence) || record.evidence.length === 0) {
      report(`${label}.evidence is required for completed evidence.`);
    }
  } else {
    if (record.testedAt !== null || record.tester !== null || record.verifiedBy !== null) {
      report(`${label} must not imply execution while status is ${record.status}.`);
    }
    if (!Array.isArray(record.evidence) || record.evidence.length !== 0) {
      report(`${label}.evidence must be empty while status is ${record.status}.`);
    }
  }
  if (typeof record.notes !== 'string' || record.notes.length < 10) {
    report(`${label}.notes must describe the current evidence state.`);
  }
}

async function main() {
  const evidencePath = option('evidence', defaultEvidencePath);
  const lifecyclePath = option('lifecycle', defaultLifecyclePath);
  const [evidence, lifecycle, packageManifest] = await Promise.all([
    readJson(evidencePath, 'Manual accessibility evidence'),
    readJson(lifecyclePath, 'Lifecycle registry'),
    readJson(packageManifestPath, 'Kern package manifest'),
  ]);
  const knownIds = lifecycleIds(lifecycle);

  if (evidence.$schema !== './manual-evidence.schema.json') {
    report('Manual evidence must reference ./manual-evidence.schema.json.');
  }
  if (evidence.schemaVersion !== 1) report('Manual evidence schemaVersion must be 1.');
  if (evidence.libraryVersion !== packageManifest.version) {
    report(
      `Manual evidence version ${evidence.libraryVersion} does not match package ${packageManifest.version}.`,
    );
  }
  if (
    evidence.certification?.status !== 'not-certified' ||
    typeof evidence.certification?.statement !== 'string' ||
    evidence.certification.statement.length < 20
  ) {
    report('Manual evidence must retain an explicit not-certified statement.');
  }

  if (!Array.isArray(evidence.targetComponentIds) || evidence.targetComponentIds.length === 0) {
    report('Manual evidence requires targetComponentIds.');
  } else {
    if (new Set(evidence.targetComponentIds).size !== evidence.targetComponentIds.length) {
      report('targetComponentIds contains duplicates.');
    }
    for (const id of evidence.targetComponentIds) {
      if (!knownIds.has(id)) report(`targetComponentIds contains unknown component "${id}".`);
    }
  }

  if (!Array.isArray(evidence.records) || evidence.records.length === 0) {
    report('Manual evidence requires records.');
  } else {
    const recordIds = new Set();
    for (const [index, record] of evidence.records.entries()) {
      if (recordIds.has(record?.id)) report(`Manual evidence record "${record.id}" is duplicated.`);
      recordIds.add(record?.id);
      validateRecord(record, index, knownIds);
    }
    for (const id of requiredRecordIds) {
      if (!recordIds.has(id)) report(`Required manual evidence record "${id}" is missing.`);
    }

    const keyboardRecord = evidence.records.find((record) => record.id === 'keyboard-only-windows');
    const screenReaderCoverage = new Set(
      evidence.records
        .filter((record) => screenReaderRecords.has(record.id))
        .flatMap((record) => record.componentIds ?? []),
    );
    for (const id of evidence.targetComponentIds ?? []) {
      if (!screenReaderCoverage.has(id)) {
        report(`Target component "${id}" has no required desktop screen-reader record.`);
      }
      if (
        !keyboardRecord?.componentIds?.includes(id) &&
        !['donut-chart', 'line-chart'].includes(id)
      ) {
        report(`Target component "${id}" has no keyboard-only record.`);
      }
    }
  }

  if (issues.length) {
    console.error(`Kern accessibility evidence verification failed:\n- ${issues.join('\n- ')}`);
    process.exitCode = 1;
    return;
  }

  const counts = Object.fromEntries(
    [...validStatuses].map((status) => [
      status,
      evidence.records.filter((record) => record.status === status).length,
    ]),
  );
  console.log(
    `Kern manual accessibility evidence verified: ${evidence.records.length} records ` +
      `(${counts.pass} pass, ${counts.fail} fail, ${counts.pending} pending, ${counts.blocked} blocked); ` +
      'certification status remains not-certified.',
  );
}

try {
  await main();
} catch (error) {
  console.error(
    `Kern accessibility evidence verification failed: ${
      error instanceof Error ? error.message : String(error)
    }`,
  );
  process.exitCode = 1;
}
