import { cp, mkdir, readFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const workspaceRoot = resolve(import.meta.dirname, '..');
const sourceRoot = resolve(workspaceRoot, 'projects/kern-mcp');
const angularRoot = resolve(workspaceRoot, 'projects/kern');
const outputRoot = resolve(workspaceRoot, 'dist/kern-mcp');

const [packageManifest, angularManifest] = await Promise.all([
  readFile(resolve(sourceRoot, 'package.json'), 'utf8').then(JSON.parse),
  readFile(resolve(angularRoot, 'package.json'), 'utf8').then(JSON.parse),
]);

if (packageManifest.version !== angularManifest.version) {
  throw new Error(
    `@kern-ui/mcp (${packageManifest.version}) and @kern-ui/angular (${angularManifest.version}) must be released together.`,
  );
}
if (packageManifest.peerDependencies?.['@kern-ui/angular'] !== angularManifest.version) {
  throw new Error(
    `@kern-ui/mcp must declare @kern-ui/angular@${angularManifest.version} as its aligned optional peer.`,
  );
}

await rm(outputRoot, { recursive: true, force: true });
await mkdir(outputRoot, { recursive: true });
await Promise.all([
  cp(resolve(sourceRoot, 'package.json'), resolve(outputRoot, 'package.json')),
  cp(resolve(sourceRoot, 'README.md'), resolve(outputRoot, 'README.md')),
  cp(resolve(sourceRoot, 'lib.d.mts'), resolve(outputRoot, 'lib.d.mts')),
  cp(resolve(angularRoot, 'LICENSE'), resolve(outputRoot, 'LICENSE')),
  cp(resolve(angularRoot, 'mcp/lib.mjs'), resolve(outputRoot, 'lib.mjs')),
  cp(resolve(angularRoot, 'mcp/server.mjs'), resolve(outputRoot, 'server.mjs')),
  cp(resolve(angularRoot, 'agent'), resolve(outputRoot, 'agent'), {
    recursive: true,
    filter: (path) => !path.endsWith('tsconfig.json'),
  }),
]);

console.log(`Built ${packageManifest.name}@${packageManifest.version} in dist/kern-mcp.`);
