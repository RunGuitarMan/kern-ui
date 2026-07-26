import { existsSync } from 'node:fs';

import { defineConfig, devices } from '@playwright/test';

const docsUrl = 'http://localhost:4200';
const labUrl = 'http://localhost:4201';
const installedChrome =
  process.env['PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH'] ??
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

export default defineConfig({
  testDir: './tests',
  outputDir: './tests/.artifacts/results',
  snapshotPathTemplate: '{testDir}/visual-baselines/{projectName}/{testFilePath}/{arg}{ext}',
  fullyParallel: true,
  forbidOnly: Boolean(process.env['CI']),
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 2 : undefined,
  timeout: 30_000,
  expect: {
    timeout: 7_500,
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixelRatio: 0.005,
      scale: 'css',
      threshold: 0.18,
    },
  },
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: './tests/.artifacts/html-report' }],
  ],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: docsUrl,
    colorScheme: 'light',
    locale: 'en-US',
    serviceWorkers: 'block',
    timezoneId: 'UTC',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    launchOptions: existsSync(installedChrome)
      ? {
          executablePath: installedChrome,
        }
      : undefined,
  },
  webServer: {
    command: 'node tests/support/serve-workspace.mjs',
    url: 'http://127.0.0.1:4199/ready',
    timeout: 180_000,
    reuseExistingServer: !process.env['CI'],
    stdout: 'pipe',
    stderr: 'pipe',
  },
  projects: [
    {
      name: 'e2e',
      testMatch: /e2e\/.*\.spec\.ts/,
      use: { baseURL: docsUrl },
    },
    {
      name: 'a11y',
      testMatch: /a11y\/.*\.spec\.ts/,
      use: { baseURL: docsUrl },
    },
    {
      name: 'responsive',
      testMatch: /responsive\/.*\.spec\.ts/,
      use: { baseURL: docsUrl },
    },
    {
      name: 'visual',
      testMatch: /visual\/.*\.spec\.ts/,
      use: {
        baseURL: labUrl,
        viewport: { width: 1440, height: 1000 },
      },
    },
  ],
});
