import { test, expect } from '@playwright/test';

test.describe('Flow Engine E2E', () => {
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
      return !!(navigator as Navigator & { gpu?: unknown }).gpu;
    });
    console.log(`WebGPU Available: ${webgpuAvailable}`);

    // 4. Wait for Engine init (Status text change from "Initializing..." to "Ready (Idle)")
    // This is more robust than waitForTimeout
    await expect(status).toHaveText('Ready (Idle)', { timeout: 30000 });

    // 5. Capture Initial State
    await page.screenshot({ path: 'test-results/screenshots/initial-state.png' });

    // 6. Interact (Click controls)
    const debugCheckbox = page.locator('#debug-mode');
    if (await debugCheckbox.isVisible()) {
        await debugCheckbox.click();
        
        // Wait for potential UI updates (if any specific elements appear)
        // Since the grid is inside Canvas, we can't easily wait for it without custom events.
        // We'll use a small wait as a fallback for visual settling.
        await page.waitForTimeout(500); 
        await page.screenshot({ path: 'test-results/screenshots/debug-mode.png' });
    }
  });
});