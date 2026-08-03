import { spawnSync } from 'node:child_process';

function option(name) {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length);
}

function readTag(packageName, tag) {
  const result = spawnSync(
    process.platform === 'win32' ? 'npm.cmd' : 'npm',
    ['view', packageName, `dist-tags.${tag}`, '--json'],
    { encoding: 'utf8' },
  );
  if (result.status !== 0) return { error: `${result.stdout}\n${result.stderr}`.trim() };
  const value = JSON.parse(result.stdout || 'null');
  return { version: typeof value === 'string' ? value : null };
}

const version = option('version');
const tag = option('tag');
if (!version || !tag) {
  throw new Error('Usage: verify-kern-release-dist-tags.mjs --version=X --tag=latest|next');
}

const packages = ['@kern-ui/angular', '@kern-ui/mcp'];
let lastState = '';
for (let attempt = 0; attempt < 10; attempt += 1) {
  const states = packages.map((packageName) => ({ packageName, ...readTag(packageName, tag) }));
  lastState = states
    .map(
      ({ packageName, version: actual, error }) => `${packageName}: ${actual ?? error ?? 'unset'}`,
    )
    .join('; ');
  if (states.every((state) => state.version === version)) {
    console.log(`Both Kern packages expose ${tag} at ${version}.`);
    process.exit(0);
  }
  await new Promise((resolveDelay) => setTimeout(resolveDelay, 2_000));
}

throw new Error(`Kern npm dist-tags did not converge to ${version}: ${lastState}`);
