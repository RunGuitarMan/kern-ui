import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join, relative } from 'node:path';

import { documentationAssetCacheControl } from './agent-contract-cache';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

function normalizeBasePath(value: string | undefined): string {
  if (!value || value === '/') {
    return '/';
  }
  if (!value.startsWith('/') || value.includes('\\') || value.split('/').includes('..')) {
    throw new Error(`KERN_DOCS_BASE_PATH must be an absolute URL path, received "${value}".`);
  }
  return value.replace(/\/+$/, '');
}

const basePath = normalizeBasePath(process.env['KERN_DOCS_BASE_PATH']);
const documentation = express.Router();

/**
 * Serve static files from /browser
 */
documentation.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    immutable: basePath !== '/',
    index: false,
    redirect: false,
    setHeaders(response, filePath) {
      response.setHeader(
        'Cache-Control',
        documentationAssetCacheControl(basePath, relative(browserDistFolder, filePath)),
      );
    },
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
documentation.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next);
});

app.use(basePath, documentation);

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
