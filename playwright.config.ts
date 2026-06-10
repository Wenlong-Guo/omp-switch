import { defineConfig, devices } from '@playwright/test';

/**
 * UI-only mock E2E tests (no Tauri backend).
 *
 * These tests run against localhost:5173 (Vite dev server) with a
 * localStorage-based mock that intercepts Tauri IPC calls.
 * They verify frontend behavior but do NOT exercise:
 *   - SQLite DB writes
 *   - config_writer / models.yml generation
 *   - omp CLI compatibility
 *
 * For real-backend coverage, use:
 *   - `npm run test:pipeline`  (Rust integration tests)
 *   - `npm run test:e2e:real` (macOS smoke test script)
 *   - `playwright.tauri.config.ts` (Linux CI with tauri-driver)
 */
export default defineConfig({
  testDir: './e2e-playwright-test',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 2,
  timeout: 60000,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
