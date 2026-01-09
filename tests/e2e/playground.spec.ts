import { test, expect } from '@playwright/test';
import fs from 'fs';

test.describe('Flow Playground UI', () => {
  test('should verify playground controls', async ({ page }) => {
    // Ensure screenshot directory exists
    if (!fs.existsSync('test-results/screenshots')) {
      fs.mkdirSync('test-results/screenshots', { recursive: true });
    }

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
    
    const btnDance = page.locator('button[data-action="dance"]');
    await expect(btnDance).toBeVisible();
    
    const btnSay = page.locator('#btn-say-hello');
    await expect(btnSay).toBeVisible();
    
    // Test Interaction & Screenshots
    const actions = ['wave', 'bow', 'dance'];
    for (const action of actions) {
      console.log(`[E2E] Triggering UI action: ${action}`);
      const btn = page.locator(`button[data-action="${action}"]`);
      await btn.click();
      
      // Wait deterministically for any network activity or state change
      // Since animation is client-side, networkidle might be too fast if no requests happen.
      // But we can wait for a small stable delay or check for a visual change if possible.
      // For now, we stick to a small delay but rely on networkidle as a synchronization point if assets load.
      await page.waitForTimeout(1000); // Still need a small visual delay for animation to progress
      
      // Capture
      await page.screenshot({ path: `test-results/screenshots/ui-action-${action}.png` });
      
      // Cooldown
      await page.waitForTimeout(2000);
    }
    
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
