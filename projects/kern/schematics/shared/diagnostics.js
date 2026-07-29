'use strict';

const DIAGNOSTIC_CODES = Object.freeze({
  stylesMissing: 'KRN-DX-001',
  stylesDuplicate: 'KRN-DX-002',
  stylesOrder: 'KRN-DX-003',
  stylesPartial: 'KRN-DX-004',
  peerMissing: 'KRN-DX-010',
  peerIncompatible: 'KRN-DX-011',
  peerUnverifiable: 'KRN-DX-012',
  rootImport: 'KRN-DX-020',
  deepImport: 'KRN-DX-021',
  deprecatedApi: 'KRN-DX-030',
  runtimeDefault: 'KRN-DX-040',
  ssrRuntimeDefault: 'KRN-DX-041',
  prepaintMissing: 'KRN-DX-042',
  prepaintOrder: 'KRN-DX-043',
  overlayHostMissing: 'KRN-DX-044',
  localeMismatch: 'KRN-DX-045',
  localeDataMissing: 'KRN-DX-046',
  ssrPrepaintLocation: 'KRN-DX-047',
  providerDuplicate: 'KRN-DX-048',
  runtimeUnverifiable: 'KRN-DX-049',
});

function diagnostic(code, severity, project, message, details = {}) {
  return {
    code,
    severity,
    project,
    message,
    ...details,
  };
}

function diagnosticSort(left, right) {
  return (
    left.project.localeCompare(right.project) ||
    left.code.localeCompare(right.code) ||
    String(left.file ?? '').localeCompare(String(right.file ?? '')) ||
    Number(left.line ?? 0) - Number(right.line ?? 0)
  );
}

function createReport(projects, diagnostics, fixed = []) {
  const sorted = [...diagnostics].sort(diagnosticSort);
  return {
    schemaVersion: 1,
    tool: '@kern-ui/angular:doctor',
    ok: sorted.every((item) => item.severity === 'info'),
    projects: [...projects].sort(),
    diagnostics: sorted,
    fixed: [...fixed].sort(diagnosticSort),
  };
}

module.exports = {
  DIAGNOSTIC_CODES,
  createReport,
  diagnostic,
  diagnosticSort,
};
