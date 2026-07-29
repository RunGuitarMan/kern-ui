import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const defaults = {
  manifest: resolve(workspaceRoot, 'projects/kern/package.json'),
  docsIdentity: resolve(workspaceRoot, 'projects/docs/src/app/release-identity.ts'),
  changelog: resolve(workspaceRoot, 'CHANGELOG.md'),
};
const optionNames = new Set(['version', 'tag', 'manifest', 'docs-identity', 'changelog']);
const semver =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-(?:(?:0|[1-9]\d*|[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|[A-Za-z-][0-9A-Za-z-]*))*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseArguments(arguments_) {
  const parsed = {};

  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index];
    if (!argument.startsWith('--')) {
      throw new Error(`Unexpected positional argument "${argument}".`);
    }

    const separator = argument.indexOf('=');
    const name = argument.slice(2, separator === -1 ? undefined : separator);
    if (!optionNames.has(name)) throw new Error(`Unknown option "--${name}".`);
    if (name in parsed) throw new Error(`Option "--${name}" was provided more than once.`);

    const value = separator === -1 ? arguments_[index + 1] : argument.slice(separator + 1);
    if (separator === -1) index += 1;
    if (!value || value.startsWith('--')) {
      throw new Error(`Option "--${name}" requires a value.`);
    }
    parsed[name] = value;
  }

  if (!parsed.version || !parsed.tag) {
    throw new Error(
      'Usage: node tools/verify-kern-release-identity.mjs --version=<semver> --tag=v<semver> ' +
        '[--manifest=<path>] [--docs-identity=<path>] [--changelog=<path>]',
    );
  }

  return {
    version: parsed.version,
    tag: parsed.tag,
    manifest: resolve(workspaceRoot, parsed.manifest ?? defaults.manifest),
    docsIdentity: resolve(workspaceRoot, parsed['docs-identity'] ?? defaults.docsIdentity),
    changelog: resolve(workspaceRoot, parsed.changelog ?? defaults.changelog),
  };
}

async function readText(path, label, issues) {
  try {
    return await readFile(path, 'utf8');
  } catch (error) {
    issues.push(`${label} could not be read at ${path}: ${error.message}`);
    return '';
  }
}

function parseLiteral(source, name) {
  const match = source.match(
    new RegExp(
      `export\\s+const\\s+${name}(?:\\s*:[^=]+)?\\s*=\\s*['"]([^'"]+)['"](?:\\s+as\\s+const)?\\s*;`,
    ),
  );
  return match?.[1];
}

function validCalendarDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return date.toISOString().slice(0, 10) === value;
}

function verifyChangelog(source, version, issues) {
  const escapedVersion = escapeRegExp(version);
  const headingPattern = new RegExp(
    `^## \\[${escapedVersion}\\] - (\\d{4}-\\d{2}-\\d{2})[ \\t]*$`,
    'm',
  );
  const heading = headingPattern.exec(source);

  if (!heading) {
    issues.push(`CHANGELOG.md must contain the exact heading "## [${version}] - YYYY-MM-DD".`);
  } else {
    if (!validCalendarDate(heading[1])) {
      issues.push(`CHANGELOG.md release date "${heading[1]}" is not a valid calendar date.`);
    }

    const sectionStart = heading.index + heading[0].length;
    const nextHeading = /^##\s/m.exec(source.slice(sectionStart));
    const sectionEnd = nextHeading === null ? source.length : sectionStart + nextHeading.index;
    const releaseSection = source.slice(sectionStart, sectionEnd);
    if (!/^- .+\S[ \t]*$/m.test(releaseSection)) {
      issues.push(`CHANGELOG.md release section [${version}] must contain a non-empty bullet.`);
    }
  }

  const linkPattern = new RegExp(`^\\[${escapedVersion}\\]:[ \\t]+(https:\\/\\/\\S+)[ \\t]*$`, 'm');
  const link = linkPattern.exec(source);
  if (!link) {
    issues.push(`CHANGELOG.md must define an HTTPS [${version}] release link.`);
    return;
  }

  try {
    const url = new URL(link[1]);
    const tagPattern = new RegExp(`(?:^|[/#?&=])v${escapedVersion}(?:$|[/#?&=])`);
    if (url.protocol !== 'https:' || !tagPattern.test(url.href)) {
      issues.push(`CHANGELOG.md [${version}] link must target tag v${version} over HTTPS.`);
    }
  } catch {
    issues.push(`CHANGELOG.md [${version}] link is not a valid HTTPS URL.`);
  }
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const issues = [];

  if (!semver.test(options.version)) {
    issues.push(`Release version "${options.version}" is not exact Semantic Versioning.`);
  }
  if (options.tag !== `v${options.version}`) {
    issues.push(`Release tag must be exactly v${options.version}; received "${options.tag}".`);
  }

  const [manifestSource, docsIdentity, changelog] = await Promise.all([
    readText(options.manifest, 'Package manifest', issues),
    readText(options.docsIdentity, 'Documentation release identity', issues),
    readText(options.changelog, 'Changelog', issues),
  ]);

  let manifest;
  if (manifestSource) {
    try {
      manifest = JSON.parse(manifestSource);
    } catch (error) {
      issues.push(`Package manifest is not valid JSON: ${error.message}`);
    }
  }

  if (manifest && manifest.version !== options.version) {
    issues.push(
      `Package manifest version must be ${options.version}; received "${String(manifest.version)}".`,
    );
  }

  if (docsIdentity) {
    const docsVersion = parseLiteral(docsIdentity, 'KERN_DOCS_VERSION');
    const docsState = parseLiteral(docsIdentity, 'KERN_DOCS_RELEASE_STATE');
    if (docsVersion !== options.version) {
      issues.push(
        `Documentation version must be ${options.version}; received "${String(docsVersion)}".`,
      );
    }
    if (docsState !== 'released') {
      issues.push(
        `Documentation release state must be "released"; received "${String(docsState)}".`,
      );
    }
  }

  if (changelog) verifyChangelog(changelog, options.version, issues);

  if (issues.length > 0) {
    console.error(`Kern release identity verification failed:\n- ${issues.join('\n- ')}`);
    process.exitCode = 1;
    return;
  }

  console.log(
    `Kern release identity verified for ${manifest?.name ?? 'package'} ${options.version} ` +
      `(${options.tag}).`,
  );
}

main().catch((error) => {
  console.error(`Kern release identity verification failed: ${error.message}`);
  process.exitCode = 1;
});
