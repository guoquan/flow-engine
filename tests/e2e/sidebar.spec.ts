import { test, expect } from '@playwright/test';

test.describe('Sidebar Toggle', () => {
  test('should toggle sidebar collapse state', async ({ page }) => {
    await page.goto('/');
    
    const sidebar = page.locator('#sidebar');
    const toggleBtn = page.locator('#btn-toggle-sidebar');
    
    // Initially not collapsed
    await expect(sidebar).not.toHaveClass(/collapsed/);
    
    // Click toggle
    await toggleBtn.click();
    
    // Should be collapsed
    await expect(sidebar).toHaveClass(/collapsed/);
    
    // Check width or visibility of content (optional, class check is usually enough logic-wise)
    // But let's check if a panel is hidden
    const panel = page.locator('.panel').first();
    await expect(panel).toBeHidden();
    
    // Click toggle again
    await toggleBtn.click();
    
    // Should be expanded
    await expect(sidebar).not.toHaveClass(/collapsed/);
    await expect(panel).toBeVisible();
  });
});