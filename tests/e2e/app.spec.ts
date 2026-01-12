import { test, expect } from '@playwright/test';
import fs from 'fs';

test.describe('Flow Engine Visual E2E', () => {
  test('should render UI and capture visual states', async ({ page }) => {
    // Ensure screenshot directory exists
    if (!fs.existsSync('test-results/screenshots')) {
      fs.mkdirSync('test-results/screenshots', { recursive: true });
    }

    // Log browser console
    page.on('console', msg => console.log(`BROWSER: ${msg.text()}`));
    page.on('pageerror', err => console.log(`BROWSER ERROR: ${err.message}`));

    // 1. Go to page
    await page.goto('/');
    
    // 2. Check UI elements
    await expect(page.locator('h1')).toHaveText('Flow Engine v0.2.0');
    const loadingStatus = page.locator('#loading-status');
    await expect(loadingStatus).toBeVisible();

    // 3. Wait for Engine init
    await expect(loadingStatus).toHaveText('Ready', { timeout: 30000 });

    // 4. Capture Initial State
    await page.screenshot({ path: 'test-results/screenshots/initial-state.png' });

    // 5. Interact (Click debug mode)
    const debugCheckbox = page.locator('#check-debug');
    await expect(debugCheckbox).toBeVisible();
    await debugCheckbox.click();
    await expect(debugCheckbox).toBeChecked();

    // 6. Verify Brain State visibility
    const brainState = page.locator('#brain-state');
    await expect(brainState).toBeVisible();
    await expect(brainState).toHaveText('IDLE');

    // 7. Capture Debug State
    await page.screenshot({ path: 'test-results/screenshots/debug-mode.png' });

    // 8. Test Chat Interaction
    const chatInput = page.locator('#chat-input');
    const chatSend = page.locator('#chat-send');
    await expect(chatInput).toBeVisible();
    
    await chatInput.fill('hello');
    await chatSend.click();
    
    // Check if user message appears
    await expect(page.locator('.msg.user', { hasText: 'hello' })).toBeVisible();
    // Wait for agent response (simulated delay)
    await expect(page.locator('.msg.agent', { hasText: 'Hello there!' })).toBeVisible({ timeout: 5000 });

    // 9. Test Protocol Tester
    const jsonInput = page.locator('#json-input');
    const jsonSend = page.locator('#json-send');
    const jsonError = page.locator('#json-error');

    // Expand the panel first
    await page.locator('h3', { hasText: 'Protocol Tester' }).click();
    await expect(jsonInput).toBeVisible();

    // Test valid JSON
    const testJson = JSON.stringify({ text: "E2E Test", state: "TALKING" });
    await jsonInput.fill(testJson);
    await jsonSend.click();
    await expect(page.locator('.msg.agent', { hasText: 'E2E Test' })).toBeVisible();

    // Test invalid JSON
    await jsonInput.fill('{ invalid json }');
    await jsonSend.click();
    await expect(jsonError).toBeVisible();
    await expect(jsonError).toContainText('JSON');
  });
});
