const rootContractFiles = new Set([
  'checklist.md',
  'common-mistakes.md',
  'component-manifest.json',
  'component-manifest.schema.json',
  'import-map.json',
  'llms-full.txt',
  'llms.txt',
  'root-export-map.json',
]);

/**
 * Identifies mutable agent-contract files relative to the documentation browser output.
 * Versioned deployments are immutable; this classification is only used by the unversioned mount.
 */
export function isMutableAgentContractAsset(relativeFilePath: string): boolean {
  const normalized = relativeFilePath.replaceAll('\\', '/').replace(/^\.?\//, '');
  if (!normalized || normalized.split('/').includes('..')) {
    return false;
  }
  return (
    normalized.startsWith('agent/') ||
    rootContractFiles.has(normalized) ||
    /^components\/[a-z0-9]+(?:-[a-z0-9]+)*\.(?:json|md)$/.test(normalized) ||
    /^examples\/(?:index\.json|README\.md|[a-z0-9]+(?:-[a-z0-9]+)*\.ts)$/.test(normalized) ||
    /^recipes\/[a-z0-9]+(?:-[a-z0-9]+)*\.ts$/.test(normalized)
  );
}

export function documentationAssetCacheControl(
  deploymentBasePath: string,
  relativeFilePath: string,
): string {
  if (deploymentBasePath === '/' && isMutableAgentContractAsset(relativeFilePath)) {
    return 'public, max-age=300, must-revalidate';
  }
  return deploymentBasePath === '/'
    ? 'public, max-age=31536000'
    : 'public, max-age=31536000, immutable';
}
