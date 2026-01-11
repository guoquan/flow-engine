import { test, expect } from '@playwright/test';

test.describe('Flow Playground UI', () => {
  test('should verify playground controls and coverage', async ({ page }) => {
    test.setTimeout(120000); // Extended timeout for full coverage
    
    // 1. Initial State
    await page.goto('/');
    const loadingStatus = page.locator('#loading-status');
    await expect(loadingStatus).toHaveText('Ready', { timeout: 30000 });
    await expect(page.locator('#canvas-container canvas')).toBeVisible();
    
    // Verify Key Panels
    await expect(page.locator('h3', { hasText: 'Quick Actions' })).toBeVisible();
    await expect(page.locator('h3', { hasText: 'Asset Loader' })).toBeVisible();
    
    // Capture Initial
    await page.screenshot({ path: 'test-results/screenshots/initial-state.png' });

    // 2. Debug Mode
    console.log('[E2E] Testing Debug Mode');
    const debugCheckbox = page.locator('#check-debug');
    await debugCheckbox.check();
    await page.waitForTimeout(500); // Wait for debug visualizers
    await page.screenshot({ path: 'test-results/screenshots/debug-mode.png' });
    await debugCheckbox.uncheck();
    await page.waitForTimeout(500);

    // 3. UI Actions (Wave, Bow, Dance, Walk, Death)
    // Note: Walk/Death are not in Quick Actions, accessed via Protocol Tester for UI simulation
    const simpleActions = ['wave', 'bow', 'dance'];
    
    for (const action of simpleActions) {
      console.log(`[E2E] Triggering UI action: ${action}`);
      const btn = page.locator(`button[data-action="${action}"]`);
      await expect(btn).toBeVisible();
      await btn.click();
      
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500); // Visual delay
      await page.screenshot({ path: `test-results/screenshots/ui-action-${action}.png` });
      
      // Reset
      await page.locator('button[data-action="idle"]').click();
      await page.waitForTimeout(500);
    }

    // Advanced UI Actions (via Protocol Panel simulating UI input)
    const advancedActions = ['walk', 'death'];
    const protoHeader = page.locator('h3', { hasText: 'Protocol Tester' });
    await protoHeader.click(); // Expand
    
    const jsonInput = page.locator('#json-input');
    const jsonSend = page.locator('#json-send');

    for (const action of advancedActions) {
      console.log(`[E2E] Triggering UI advanced action: ${action}`);
      const payload = JSON.stringify({ 
        text: `UI Testing ${action}`, 
        actions: [{ type: 'animation', name: action }] 
      });
      await jsonInput.fill(payload);
      await jsonSend.click();
      
      await expect(page.locator('.msg.agent', { hasText: `UI Testing ${action}` })).toBeVisible();
      await page.waitForTimeout(1000); 
      
      await page.screenshot({ path: `test-results/screenshots/ui-action-${action}.png` });
      
      // Reset (Critical for death)
      await page.waitForTimeout(1000);
      await page.locator('button[data-action="idle"]').click();
      await page.waitForTimeout(500);
    }
    await protoHeader.click(); // Collapse

    // 4. UI Interactions (Say, Think)
    // Say
    console.log('[E2E] Triggering UI Interaction: Say');
    await page.locator('#btn-say-hello').click();
    await expect(page.locator('.msg.agent', { hasText: 'Hello! I am Flow Engine.' })).toBeVisible(); // Expected text from Say button handler
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-results/screenshots/ui-action-say.png' });
    
    // Think
    console.log('[E2E] Triggering UI Interaction: Think');
    await page.locator('#btn-think').click();
    await expect(page.locator('.msg.agent', { hasText: 'Processing complex logic...' })).toBeVisible();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-results/screenshots/ui-action-think.png' });
    // Clear bubble
    await page.locator('button[data-action="idle"]').click();
    await page.waitForTimeout(500);

    // 5. Interaction & Camera Controls
    console.log('[E2E] Testing Interaction & Camera');
    
    // LookAt (Click/Hold to look)
    await page.mouse.move(300, 300);
    await page.mouse.down(); // Trigger LookAt
    await page.waitForTimeout(1000); // Wait for head to turn
    await page.screenshot({ path: 'test-results/screenshots/ui-interaction-lookat.png' });
    await page.mouse.up();
    await page.waitForTimeout(500);

    // Camera Rotate (Drag)
    // Move to a new position to start drag
    await page.mouse.move(400, 300);
    await page.mouse.down();
    await page.mouse.move(200, 300, { steps: 5 }); // Drag left
    await page.waitForTimeout(500); // Wait for damping
    await page.screenshot({ path: 'test-results/screenshots/camera-rotate.png' });
    await page.mouse.up();

    // Camera Zoom (Wheel)
    await page.mouse.move(300, 300);
    await page.mouse.wheel(0, -500); // Zoom in
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-results/screenshots/camera-zoom.png' });
    await page.mouse.wheel(0, 500); // Zoom out reset
    await page.waitForTimeout(500);

    // Camera Pan (Right Click Drag)
    await page.mouse.move(300, 300);
    await page.mouse.down({ button: 'right' });
    await page.mouse.move(300, 100, { steps: 5 }); // Pan up
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-results/screenshots/camera-pan.png' });
    await page.mouse.up({ button: 'right' });

    // 6. Debug LookAt
    console.log('[E2E] Testing Debug LookAt');
    await page.locator('#check-debug').check();
    await page.waitForTimeout(500);
    
    await page.mouse.move(300, 300);
    await page.mouse.down(); // Trigger LookAt with Debug info visible
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/screenshots/debug-lookat.png' });
    await page.mouse.up();
    
    await page.locator('#check-debug').uncheck();
  });
});
