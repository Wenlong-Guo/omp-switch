import { defineConfig, devices } from '@playwright/test';

/**
 * Tauri-driver E2E configuration.
 *
 * NOTE: tauri-driver only works on Linux and Windows.
 * On macOS, use `npm run test:pipeline` (Rust backend tests) instead.
 * For CI (GitHub Actions Ubuntu runners), this config tests the real
 * Tauri binary via WebDriver BiDi.
 */
export default defineConfig({
  testDir: './e2e-tauri',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  timeout: 120000,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4444',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'tauri',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'tauri-driver',
    url: 'http://localhost:4444',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
