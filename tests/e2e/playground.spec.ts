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
      
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500); 
      
      await page.screenshot({ path: `test-results/screenshots/ui-action-${action}.png` });
      
      // Force Idle to clear state
      const btnIdle = page.locator('button[data-action="idle"]');
      await btnIdle.click();
      await page.waitForTimeout(1000); 
    }

    // Test Think Button
    console.log('[E2E] Triggering UI action: think');
    await page.locator('#btn-think').click();
    await page.waitForTimeout(500); // Wait for bubble
    await page.screenshot({ path: `test-results/screenshots/ui-action-think.png` });
    // Clear bubble
    await page.locator('button[data-action="idle"]').click();
    await page.waitForTimeout(1000);

    // Test Extra Actions via Protocol Tester (Walk, Death)
    // ...
    // Expand Protocol Tester if needed (it starts collapsed)
    const protoTesterHeader = page.locator('h3', { hasText: 'Protocol Tester' });
    await protoTesterHeader.click();

    const jsonInput = page.locator('#json-input');
    const jsonSend = page.locator('#json-send');

    const extraActions = ['walk', 'death'];
    for (const action of extraActions) {
      console.log(`[E2E] Triggering Protocol Tester action: ${action}`);
      const payload = JSON.stringify({ 
        text: `Testing ${action}`, 
        actions: [{ type: 'animation', name: action }] 
      });
      
      await jsonInput.fill(payload);
      await jsonSend.click();
      
      // Wait for log confirmation
      await expect(page.locator('.msg.agent', { hasText: `Testing ${action}` })).toBeVisible();
      await page.waitForTimeout(1000); // Allow animation to play
      
      await page.screenshot({ path: `test-results/screenshots/ui-action-${action}.png` });
      
      // Explicitly reset to Idle to avoid "Death" pose sticking if next test runs fast
      // But "Death" usually loops once?
      await page.waitForTimeout(2000);
      await page.locator('button[data-action="idle"]').click();
      await page.waitForTimeout(1000);
    }

    // Test LookAt (Listening State via Chat)
    console.log('[E2E] Triggering LookAt via Chat');
    const chatInput = page.locator('#chat-input');
    await chatInput.fill('look at me');
    await page.locator('#chat-send').click();
    
    // Wait for response "tracking your cursor"
    const response = page.locator('.msg.agent', { hasText: 'tracking your cursor' });
    await expect(response).toBeVisible({ timeout: 5000 });
    
    // Move mouse to trigger lookAt visually
    await page.mouse.move(300, 300); // Move to center-ish
    await page.waitForTimeout(1000); // Wait for head to turn
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
