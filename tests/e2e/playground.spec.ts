import { test, expect } from '@playwright/test';

test.describe('Flow Playground UI', () => {
  test('should verify playground controls and coverage', async ({ page }) => {
    test.setTimeout(90000); // Extended timeout, but kept below 120s to avoid overly long tests
    
    // 1. Initial State
    await page.goto('/');
    const loadingStatus = page.locator('#loading-status');
    await expect(loadingStatus).toHaveText('Ready', { timeout: 30000 });
    await expect(page.locator('#canvas-container canvas')).toBeVisible();
    
    // 2. Sidebar & UI Controls Verification
    console.log('[E2E] Testing Sidebar & UI Controls');
    const sidebar = page.locator('#sidebar');
    const toggleBtn = page.locator('#btn-toggle-sidebar');
    
    // Initial: Expanded
    await expect(sidebar).not.toHaveClass(/collapsed/);
    const initialBox = await sidebar.boundingBox();
    expect(initialBox?.width).toBeGreaterThan(200); // Expect > 200px (e.g. 320px)
    
    // Action: Collapse
    await toggleBtn.click();
    await page.waitForTimeout(500); // Wait for CSS transition (0.3s)
    
    // Verify: Collapsed
    await expect(sidebar).toHaveClass(/collapsed/);
    const collapsedBox = await sidebar.boundingBox();
    expect(collapsedBox?.width).toBeLessThan(100); // Expect ~40px
    await page.screenshot({ path: 'test-results/screenshots/sidebar-collapsed.png' });
    
    // Verify Content Hidden
    await expect(page.locator('h3', { hasText: 'Dashboard' })).toBeHidden();
    
    // Action: Expand
    await toggleBtn.click();
    await page.waitForTimeout(500); // Wait for transition
    
    // Verify: Expanded
    await expect(sidebar).not.toHaveClass(/collapsed/);
    await expect(page.locator('h3', { hasText: 'Dashboard' })).toBeVisible();

    // Verify Checkboxes
    const rotateCheckbox = page.locator('#check-rotate');
    await rotateCheckbox.check();
    await expect(rotateCheckbox).toBeChecked();
    await rotateCheckbox.uncheck();

    // 3. Debug Mode
    console.log('[E2E] Testing Debug Mode');
    const debugCheckbox = page.locator('#check-debug');
    await debugCheckbox.check();
    await page.waitForTimeout(500); // Wait for debug visualizers
    await page.screenshot({ path: 'test-results/screenshots/debug-mode.png' });
    await debugCheckbox.uncheck();
    await page.waitForTimeout(1000); // Extra wait to ensure debug visualizers fully disappear

    // 4. UI Actions (Wave, Bow, Dance, Walk, Death)
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

    // Protocol-simulated UI Actions (via Protocol Panel simulating UI input for actions without buttons)
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
    await expect(page.locator('.msg.agent', { hasText: 'Processing complex logic...' })).toBeVisible(); // Expected text from Think button handler (must match src/main.ts line 95)
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
    await page.mouse.up();
    await page.waitForTimeout(500); // Wait for damping
    await page.screenshot({ path: 'test-results/screenshots/camera-rotate.png' });

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
    await page.mouse.up({ button: 'right' });
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-results/screenshots/camera-pan.png' });

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
