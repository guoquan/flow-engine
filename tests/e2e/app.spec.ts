import { test, expect } from '@playwright/test';

test.describe('Flow Engine Visual E2E', () => {
  test('should render UI and capture visual states', async ({ page }) => {
    // Log browser console
    page.on('console', msg => console.log(`BROWSER: ${msg.text()}`));
    page.on('pageerror', err => console.log(`BROWSER ERROR: ${err.message}`));

    // 1. Go to page
    await page.goto('/');
    
    // 2. Check UI elements
    await expect(page.locator('h1')).toHaveText('Flow (服喽)');
    const status = page.locator('#status');
    await expect(status).toBeVisible();

    // 3. WebGPU availability check
    const webgpuAvailable = await page.evaluate(async () => {
      return !!(navigator as any).gpu;
    });
    console.log(`WebGPU Available: ${webgpuAvailable}`);

    // 4. Wait for Engine init (Status text change from "Initializing..." to "Ready (Idle)")
    await expect(status).toHaveText('Ready (Idle)', { timeout: 30000 });

    // 5. Capture Initial State
    await page.screenshot({ path: 'test-results/screenshots/initial-state.png' });

    // 6. Interact (Click controls)
    const debugCheckbox = page.locator('#debug-mode');
    if (await debugCheckbox.isVisible()) {
        await debugCheckbox.click();
        
        // Wait for debug mode to be enabled (checkbox is checked)
        await expect(debugCheckbox).toBeChecked();

        // Capture Debug State
        await page.screenshot({ path: 'test-results/screenshots/debug-mode.png' });
    }
  });
});