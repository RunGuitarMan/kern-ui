import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { schema as angularSchema } from '@angular-devkit/core';

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const defaultEvidencePath = resolve(workspaceRoot, 'docs/accessibility/manual-evidence.json');
const defaultSchemaPath = resolve(workspaceRoot, 'docs/accessibility/manual-evidence.schema.json');
const defaultLifecyclePath = resolve(workspaceRoot, 'projects/kern/api/lifecycle.json');
const defaultPackageManifestPath = resolve(workspaceRoot, 'projects/kern/package.json');
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
const validModes = new Set(['local', 'pre-1-release', 'release', 'promotion']);
const issues = [];

function option(name, fallback) {
  const prefix = `--${name}=`;
  const argument = process.argv.find((value) => value.startsWith(prefix));
  return argument ? resolve(workspaceRoot, argument.slice(prefix.length)) : fallback;
}

function valueOption(name, fallback) {
  const prefix = `--${name}=`;
  const argument = process.argv.find((value) => value.startsWith(prefix));
  return argument ? argument.slice(prefix.length) : fallback;
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

function lifecycleComponents(lifecycle) {
  const components = new Map();
  for (const group of lifecycle.catalogGroups ?? []) {
    const requiredEvidence =
      lifecycle.evidenceProfiles?.[group.evidenceProfile]?.requiredEvidence ?? [];
    for (const id of group.ids ?? []) {
      components.set(id, {
        evidenceProfile: group.evidenceProfile,
        requiredEvidence,
        status: group.status,
      });
    }
  }
  return components;
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

function validateEvidencePointer(pointer, label) {
  if (typeof pointer !== 'string' || !pointer.trim()) {
    report(`${label} must be a non-empty URL or repository-relative path.`);
    return;
  }
  if (/^https?:\/\//.test(pointer)) return;
  const [path] = pointer.split('#', 1);
  if (
    !path ||
    path.startsWith('/') ||
    path.includes('..') ||
    !existsSync(resolve(workspaceRoot, path))
  ) {
    report(`${label} must resolve to an existing repository file or an HTTP(S) URL.`);
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
    } else {
      for (const [evidenceIndex, pointer] of record.evidence.entries()) {
        validateEvidencePointer(pointer, `${label}.evidence[${evidenceIndex}]`);
      }
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

function isFresh(record, maxAgeDays, now) {
  if (!isIsoTimestamp(record.testedAt)) return false;
  const testedAt = Date.parse(record.testedAt);
  const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
  return testedAt <= now && now - testedAt <= maxAgeMs;
}

function enforcePassingRecords(records, label, maxAgeDays, now) {
  const ageUnit = maxAgeDays === 1 ? 'day' : 'days';
  for (const record of records) {
    if (record.status !== 'pass') {
      report(`${label} requires "${record.id}" to pass; current status is ${record.status}.`);
      continue;
    }
    if (!isFresh(record, maxAgeDays, now)) {
      report(
        `${label} requires fresh "${record.id}" evidence no older than ${maxAgeDays} ${ageUnit}.`,
      );
    }
  }
}

function enforceCertificationTiming(certification, records, label, maxAgeDays, now) {
  if (certification?.status !== 'certified' || !isIsoTimestamp(certification.attestedAt)) return;

  const attestedAt = Date.parse(certification.attestedAt);
  const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
  if (now - attestedAt > maxAgeMs) {
    report(
      `${label} requires certification no older than ${maxAgeDays} ${
        maxAgeDays === 1 ? 'day' : 'days'
      }.`,
    );
  }

  const newerRecords = records.filter(
    (record) =>
      record.status === 'pass' &&
      isIsoTimestamp(record.testedAt) &&
      Date.parse(record.testedAt) > attestedAt,
  );
  if (newerRecords.length > 0) {
    report(
      `${label} certification must be at or after required passing record${
        newerRecords.length === 1 ? '' : 's'
      } ${newerRecords.map((record) => `"${record.id}"`).join(', ')}.`,
    );
  }
}

async function main() {
  const evidencePath = option('evidence', defaultEvidencePath);
  const schemaPath = option('schema', defaultSchemaPath);
  const lifecyclePath = option('lifecycle', defaultLifecyclePath);
  const packageManifestPath = option('package-manifest', defaultPackageManifestPath);
  const [evidence, evidenceSchema, lifecycle, packageManifest] = await Promise.all([
    readJson(evidencePath, 'Manual accessibility evidence'),
    readJson(schemaPath, 'Manual accessibility evidence schema'),
    readJson(lifecyclePath, 'Lifecycle registry'),
    readJson(packageManifestPath, 'Kern package manifest'),
  ]);
  const knownIds = lifecycleIds(lifecycle);
  const lifecycleById = lifecycleComponents(lifecycle);
  const mode = valueOption('mode', 'local');
  const componentIds = valueOption('components', '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const now = Date.now();

  const schemaRegistry = new angularSchema.CoreSchemaRegistry();
  const validateSchema = await schemaRegistry.compile(evidenceSchema);
  const schemaResult = await validateSchema(evidence);
  if (!schemaResult.success) {
    const details = (schemaResult.errors ?? [])
      .map((error) => `${error.instancePath || '/'} ${error.message ?? 'is invalid'}`)
      .join('; ');
    report(`Manual evidence does not satisfy its JSON Schema: ${details}`);
  }

  if (!validModes.has(mode)) report(`Unsupported verification mode "${mode}".`);
  if (mode === 'promotion' && componentIds.length === 0) {
    report('Promotion mode requires --components=<catalog-id>[,<catalog-id>...].');
  }

  if (evidence.$schema !== './manual-evidence.schema.json') {
    report('Manual evidence must reference ./manual-evidence.schema.json.');
  }
  if (evidence.schemaVersion !== 3) report('Manual evidence schemaVersion must be 3.');
  if (evidence.libraryVersion !== packageManifest.version) {
    report(
      `Manual evidence version ${evidence.libraryVersion} does not match package ${packageManifest.version}.`,
    );
  }
  if (
    !['not-certified', 'certified'].includes(evidence.certification?.status) ||
    typeof evidence.certification?.statement !== 'string' ||
    evidence.certification.statement.length < 20
  ) {
    report('Manual evidence requires an explicit certification status and statement.');
  }
  if (evidence.certification?.status === 'certified') {
    if (!isIsoTimestamp(evidence.certification.attestedAt)) {
      report('Certified evidence requires certification.attestedAt as an ISO UTC timestamp.');
    } else if (Date.parse(evidence.certification.attestedAt) > now) {
      report('Certified evidence requires certification.attestedAt not to be in the future.');
    }
    if (
      typeof evidence.certification.attestedBy !== 'string' ||
      evidence.certification.attestedBy.trim().length < 2
    ) {
      report('Certified evidence requires certification.attestedBy.');
    }
    if (
      !Array.isArray(evidence.certification.evidence) ||
      evidence.certification.evidence.length === 0
    ) {
      report('Certified evidence requires certification.evidence.');
    } else {
      for (const [index, pointer] of evidence.certification.evidence.entries()) {
        validateEvidencePointer(pointer, `certification.evidence[${index}]`);
      }
    }
  } else if (
    evidence.certification?.attestedAt !== null ||
    evidence.certification?.attestedBy !== null ||
    !Array.isArray(evidence.certification?.evidence) ||
    evidence.certification.evidence.length !== 0
  ) {
    report('Not-certified evidence must not contain attestation metadata.');
  }
  if (
    !Number.isInteger(evidence.policy?.releaseMaxAgeDays) ||
    evidence.policy.releaseMaxAgeDays < 1
  ) {
    report('Manual evidence policy.releaseMaxAgeDays must be a positive integer.');
  }
  if (
    !Number.isInteger(evidence.policy?.promotionMaxAgeDays) ||
    evidence.policy.promotionMaxAgeDays < 1
  ) {
    report('Manual evidence policy.promotionMaxAgeDays must be a positive integer.');
  }
  if (evidence.policy?.pre1ReleaseAllowsPending !== true) {
    report('Manual evidence policy.pre1ReleaseAllowsPending must be true.');
  }
  if (mode === 'pre-1-release' && !/^0\./.test(packageManifest.version)) {
    report(
      `Pre-1 release mode requires a 0.x package version; received ${packageManifest.version}.`,
    );
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
      const record = evidence.records.find((candidate) => candidate.id === id);
      if (!record) {
        report(`Required manual evidence record "${id}" is missing.`);
        continue;
      }
      if (record.required !== true) {
        report(`Required manual evidence record "${id}" must set required=true.`);
      }
      if (record.releaseBlocking !== true) {
        report(`Required manual evidence record "${id}" must set releaseBlocking=true.`);
      }
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

    if (
      (mode === 'release' || mode === 'promotion') &&
      evidence.certification?.status !== 'certified'
    ) {
      report(`${mode === 'release' ? 'Release' : 'Promotion'} gate requires certified evidence.`);
    }

    if (mode === 'release' && Number.isInteger(evidence.policy?.releaseMaxAgeDays)) {
      const releaseRecords = evidence.records.filter((record) => record.releaseBlocking);
      enforcePassingRecords(releaseRecords, 'Release gate', evidence.policy.releaseMaxAgeDays, now);
      enforceCertificationTiming(
        evidence.certification,
        releaseRecords,
        'Release gate',
        evidence.policy.releaseMaxAgeDays,
        now,
      );
    }

    if (mode === 'pre-1-release' && Number.isInteger(evidence.policy?.releaseMaxAgeDays)) {
      const releaseRecords = evidence.records.filter((record) => record.releaseBlocking);
      for (const record of releaseRecords) {
        if (record.status === 'fail' || record.status === 'blocked') {
          report(
            `Pre-1 release gate rejects "${record.id}" with status ${record.status}; ` +
              'only pending or passing evidence is allowed.',
          );
        }
        if (record.status === 'pass' && !isFresh(record, evidence.policy.releaseMaxAgeDays, now)) {
          report(
            `Pre-1 release gate requires fresh "${record.id}" passing evidence no older than ` +
              `${evidence.policy.releaseMaxAgeDays} days.`,
          );
        }
      }
      if (evidence.certification?.status === 'certified') {
        enforcePassingRecords(
          releaseRecords,
          'Certified pre-1 release gate',
          evidence.policy.releaseMaxAgeDays,
          now,
        );
        enforceCertificationTiming(
          evidence.certification,
          releaseRecords,
          'Certified pre-1 release gate',
          evidence.policy.releaseMaxAgeDays,
          now,
        );
      }
    }

    if (mode === 'promotion' && Number.isInteger(evidence.policy?.promotionMaxAgeDays)) {
      for (const id of componentIds) {
        const component = lifecycleById.get(id);
        if (!component) {
          report(`Promotion gate references unknown component "${id}".`);
          continue;
        }
        if (!component.requiredEvidence.includes('manual-at')) continue;
        if (!evidence.targetComponentIds?.includes(id)) {
          report(`Promotion gate requires "${id}" in targetComponentIds.`);
          continue;
        }
        const records = evidence.records.filter(
          (record) => record.required && record.componentIds?.includes(id),
        );
        if (records.length === 0) {
          report(`Promotion gate found no required manual evidence for "${id}".`);
          continue;
        }
        enforcePassingRecords(
          records,
          `Promotion gate for "${id}"`,
          evidence.policy.promotionMaxAgeDays,
          now,
        );
        enforceCertificationTiming(
          evidence.certification,
          records,
          `Promotion gate for "${id}"`,
          evidence.policy.promotionMaxAgeDays,
          now,
        );
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
      `certification status is ${evidence.certification.status}; mode=${mode}.`,
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
