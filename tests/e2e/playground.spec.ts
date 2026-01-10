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
      // Cooldown
      await page.waitForTimeout(2000);
    }

    // Test Extra Actions via Protocol Tester (Walk, Death)
    const extraActions = ['walk', 'death'];
    const jsonInput = page.locator('#json-input');
    const jsonSend = page.locator('#json-send');
    
    // Expand Protocol Tester if needed (it starts collapsed)
    const protoHeader = page.locator('h3', { hasText: 'Protocol Tester' });
    await protoHeader.click();

    for (const action of extraActions) {
      console.log(`[E2E] Triggering Protocol Tester action: ${action}`);
      const payload = JSON.stringify({ 
        text: `Testing ${action}`, 
        actions: [{ type: 'animation', name: action }] 
      });
      
      await jsonInput.fill(payload);
      await jsonSend.click();
      
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `test-results/screenshots/ui-action-${action}.png` });
      await page.waitForTimeout(2000);
    }

    // Test LookAt (Listening State via Chat)
    console.log('[E2E] Triggering LookAt via Chat');
    await page.locator('#chat-input').fill('look at me');
    await page.locator('#chat-send').click();
    
    // Wait for response "tracking your cursor"
    await expect(page.locator('.msg.agent', { hasText: 'tracking your cursor' })).toBeVisible();
    
    // Move mouse to trigger lookAt
    await page.mouse.move(100, 100);
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-results/screenshots/ui-state-listening.png' });
    
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
