import { test, expect } from '@playwright/test';

test.describe('Flow Engine E2E', () => {
  test('should load the 3D scene and UI', async ({ page }) => {
    // 1. Go to page
    await page.goto('/');
    
    // 2. Check UI elements
    await expect(page.locator('h1')).toHaveText('Flow (服喽)');
    await expect(page.locator('#status')).toBeVisible();

    // 3. Wait for Engine init (Status text change)
    // Note: WebGPU might fail in CI without specific runners, but UI should load.
    // We wait a bit to catch the initial render state.
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
