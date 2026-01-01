import { test, expect } from '@playwright/test';

test.describe('Flow Engine E2E', () => {
  test('should load the 3D scene and UI', async ({ page }) => {
    // Log browser console
    page.on('console', msg => console.log(`BROWSER: ${msg.text()}`));
    page.on('pageerror', err => console.log(`BROWSER ERROR: ${err.message}`));

    // 1. Go to page
    await page.goto('/');
    
    // 2. Check UI elements
    await expect(page.locator('h1')).toHaveText('Flow (服喽)');
    await expect(page.locator('#status')).toBeVisible();

    // 3. Wait for Engine init (Status text change)
    // Log WebGPU availability for debugging
    const webgpuAvailable = await page.evaluate(async () => {
      return !!(navigator as any).gpu;
    });
    console.log(`WebGPU Available: ${webgpuAvailable}`);

    await page.waitForTimeout(2000);

    // 4. Capture Initial State
    await page.screenshot({ path: 'test-results/screenshots/initial-state.png' });

    // 5. Interact (Click controls)
    const debugCheckbox = page.locator('#debug-mode');
    if (await debugCheckbox.isVisible()) {
        await debugCheckbox.click();
        await page.waitForTimeout(500); // Wait for debug grid
        await page.screenshot({ path: 'test-results/screenshots/debug-mode.png' });
    }
  });
});
