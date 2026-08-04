import { createRequire } from 'node:module';
import { basename, relative, resolve, sep } from 'node:path';

const cacheRoot = process.env['KERN_VITE_SMOKE_CACHE_ROOT'];
if (!cacheRoot) {
  throw new Error('KERN_VITE_SMOKE_CACHE_ROOT is required by the Vite smoke preload.');
}

const angularBuildRequire = createRequire(
  resolve(import.meta.dirname, '../../node_modules/@angular/build/package.json'),
);
const lmdb = angularBuildRequire('lmdb');
const openPersistentDatabase = lmdb.open;

// Angular 22 gates Vite optimizeDeps on its CLI cache switch. Keep Vite's cache real,
// but replace only Angular's nested compiler/i18n LMDB stores with process-local Maps.
// Node, Vite, esbuild, workers, Atomics, and every unrelated lmdb.open call stay intact.
lmdb.open = (options, ...arguments_) => {
  const requestedPath = typeof options === 'string' ? options : options?.path;
  const absolutePath = typeof requestedPath === 'string' ? resolve(requestedPath) : '';
  const cacheRelativePath = relative(resolve(cacheRoot), absolutePath);
  const isNestedSmokeCache =
    cacheRelativePath !== '' &&
    cacheRelativePath !== '..' &&
    !cacheRelativePath.startsWith(`..${sep}`);
  const isAngularCompilerDatabase = /^angular-(?:compiler|i18n)\.db$/.test(basename(absolutePath));

  if (!isNestedSmokeCache || !isAngularCompilerDatabase) {
    return openPersistentDatabase(options, ...arguments_);
  }

  const values = new Map();
  return {
    close: async () => values.clear(),
    doesExist: (key) => values.has(key),
    get: (key) => values.get(key),
    put: async (key, value) => {
      values.set(key, value);
      return true;
    },
  };
};
