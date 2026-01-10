import { test, expect } from '@playwright/test';

test.describe('Flow Playground UI', () => {
  test('should verify playground controls', async ({ page }) => {
    test.setTimeout(60000); // Increase timeout for multiple animations
    
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
    
    // Test Interaction & Screenshots
    const actions = ['wave', 'bow', 'dance'];
    for (const action of actions) {
      console.log(`[E2E] Triggering UI action: ${action}`);
      const btn = page.locator(`button[data-action="${action}"]`);
      await btn.click();
      
      // Wait for animation
      await page.waitForTimeout(1000);
      
      // Capture
      await page.screenshot({ path: `test-results/screenshots/ui-action-${action}.png` });
      
      // Cooldown
      await page.waitForTimeout(2000);
    }

    // Test Extra Actions via Protocol Tester (Walk, Death)
    const extraActions = ['walk', 'death'];
    const jsonInput = page.locator('#json-input');
    const jsonSend = page.locator('#json-send');
    
    // Expand Protocol Tester if needed (it starts collapsed)
    const protoTesterHeader = page.locator('h3', { hasText: 'Protocol Tester' });
    await protoTesterHeader.click();

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
    const protoCollapseHeader = page.locator('h3', { hasText: 'Protocol Tester' });
    const protoContent = page.locator('#panel-protocol .panel-content');
    const protocolPanel = page.locator('#panel-protocol');
    
    // It was expanded in the previous step to run actions, so verify it is visible/expanded
    await expect(protocolPanel).not.toHaveClass(/collapsed/);
    await expect(protoContent).toBeVisible();
    
    // Click to collapse
    await protoCollapseHeader.click();
    await expect(protocolPanel).toHaveClass(/collapsed/);
    await expect(protoContent).toBeHidden();
  });
});
