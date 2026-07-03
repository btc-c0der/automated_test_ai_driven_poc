import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.BASE_URL ?? 'https://automationexercise.com/api';
const UI_BASE_URL = process.env.UI_BASE_URL ?? 'https://www.saucedemo.com';

// Browser-like UA required to pass Cloudflare on automationexercise.com
const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

export default defineConfig({
  // Run all tests in parallel — each test is fully isolated
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only
  forbidOnly: !!process.env.CI,

  // Retry once on CI to reduce flakiness from network variance
  retries: process.env.CI ? 1 : 0,

  // Limit parallelism on CI to avoid overwhelming the target
  workers: process.env.CI ? 4 : undefined,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],

  projects: [
    // ─── API project ───────────────────────────────────────────────────────────
    {
      name: 'api',
      testDir: './tests/api',
      use: {
        baseURL: BASE_URL,
        // All API responses are HTTP 200 regardless of outcome;
        // tests must assert responseCode in the body, not HTTP status.
        // `userAgent` must be set here — Playwright ignores UA in extraHTTPHeaders
        userAgent: BROWSER_UA,
        extraHTTPHeaders: {
          Accept: 'application/json',
        },
      },
    },

    // ─── UI project — saucedemo.com ───────────────────────────────────────────
    {
      name: 'ui',
      testDir: './tests/ui',
      use: {
        baseURL: UI_BASE_URL,
        viewport: { width: 1280, height: 720 },
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        trace: 'retain-on-failure',
        // Keep tests isolated — fresh context per test (default), no shared storage
        storageState: undefined,
      },
    },
  ],
});
