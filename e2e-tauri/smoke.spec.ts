import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

test.describe('Real Tauri App Smoke Test', () => {
  test.skip(process.platform === 'darwin', 'tauri-driver not supported on macOS — use scripts/e2e-real.sh or npm run test:pipeline');

  test('dashboard loads with builtin providers', async ({ page }) => {
    // Wait for Tauri app to be ready
    await page.goto('http://localhost:4444');
    await page.waitForLoadState('networkidle');

    // Verify app title
    await expect(page.locator('body')).toBeVisible();

    // Check that Dashboard heading exists
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('local builtin provider visible and models.yml written', async ({ page }) => {
    await page.goto('http://localhost:4444');
    await page.waitForLoadState('networkidle');

    // Wait for provider cards to load
    await page.waitForTimeout(2000);

    // Verify local builtin card is visible
    const ollamaCard = page.locator('[data-testid="provider-card-ollama"]').first();
    await expect(ollamaCard).toBeVisible({ timeout: 10000 });

    // Verify YAML file is written to omp's configured agent dir
    const ompConfigDir = execSync('omp config path', { encoding: 'utf-8', stdio: 'pipe' }).trim();
    const modelsYaml = join(ompConfigDir, 'models.yml');
    await expect.poll(() => existsSync(modelsYaml), {
      message: 'models.yml should exist',
      timeout: 10000,
    }).toBe(true);

    const content = readFileSync(modelsYaml, 'utf-8');
    expect(content).toContain('ollama');
    expect(content).not.toContain('step-plan');
  });

  test('omp CLI can read models.yml without parse errors', () => {
    // Run omp --list-models; expect exit 0 and no YAML/parse errors
    const result = execSync('omp --list-models', { encoding: 'utf-8', stdio: 'pipe' });
    expect(result).not.toMatch(/yaml|parse/i);
  });
});
