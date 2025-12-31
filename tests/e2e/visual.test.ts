import { test, expect } from '@playwright/test';

test('visual check: avatar initialization and lookat', async ({ page }) => {
  await page.goto('/');
  
  // 1. Wait for engine to be ready
  await expect(page.locator('#status')).toHaveText('Ready (Idle)', { timeout: 10000 });
  
  // 2. Take initial screenshot
  await page.screenshot({ path: 'test-results/initial-view.png' });
  
  // 3. Click somewhere to trigger LookAt
  await page.mouse.click(100, 100);
  
  // 4. Wait for lerp to finish
  await page.waitForTimeout(2000);
  
  // 5. Take screenshot of head looking at target
  await page.screenshot({ path: 'test-results/lookat-view.png' });
  
  // 6. Wait for return to idle
  await page.waitForTimeout(4000); // 3s hold + transition
  await page.screenshot({ path: 'test-results/returned-view.png' });
});
