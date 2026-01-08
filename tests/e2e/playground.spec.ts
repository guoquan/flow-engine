import { test, expect } from '@playwright/test';

test.describe('Flow Playground UI', () => {
  test('should verify playground controls', async ({ page }) => {
    // 1. Go to page
    await page.goto('/');
    
    // Wait for Engine init
    const loadingStatus = page.locator('#loading-status');
    await expect(loadingStatus).toHaveText('Ready', { timeout: 30000 });

    // 2. Quick Actions Panel
    await expect(page.locator('h3', { hasText: 'Quick Actions' })).toBeVisible();
    
    // Verify Buttons
    const btnWave = page.locator('button[data-action="wave"]');
    await expect(btnWave).toBeVisible();
    await expect(btnWave).toHaveText('👋 Wave');

    const btnBow = page.locator('button[data-action="bow"]');
    await expect(btnBow).toBeVisible();
    
    const btnSay = page.locator('#btn-say-hello');
    await expect(btnSay).toBeVisible();
    
    // Test Interaction (Click Wave)
    await btnWave.click();
    // No explicit assertion for 3D state, but ensuring it doesn't crash is good.
    // We could check if console has no errors, which is handled by app.spec.ts global listeners if we add them here.
    
    // 3. Asset Loader Panel
    await expect(page.locator('h3', { hasText: 'Asset Loader' })).toBeVisible();
    
    const inputAvatar = page.locator('#input-avatar-url');
    await expect(inputAvatar).toBeVisible();
    // Check default value
    await expect(inputAvatar).toHaveValue(/config\.json/);

    const inputStage = page.locator('#input-stage-url');
    await expect(inputStage).toBeVisible();
    
    // 4. Protocol Tester Panel Collapsing
    const protoHeader = page.locator('h3', { hasText: 'Protocol Tester' });
    const protoContent = page.locator('#panel-protocol .panel-content');
    
    // Initially hidden (collapsed class logic)
    // Wait, in my HTML I added 'collapsed' class initially?
    // <div class="panel collapsed" id="panel-protocol">
    // So content should be hidden if CSS matches.
    // Let's check CSS: .panel.collapsed .panel-content { display: none; }
    await expect(protoContent).toBeHidden();
    
    // Click to expand
    await protoHeader.click();
    await expect(protoContent).toBeVisible();
  });
});
