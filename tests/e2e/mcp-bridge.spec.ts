import { test, expect } from '@playwright/test';
import { WebSocketServer, AddressInfo } from 'ws';
import fs from 'fs';

test.describe('MCP Bridge Integration', () => {
  let wss: WebSocketServer;
  let port: number;
  
  test.beforeAll(async () => {
    // Start a mock WS server on random port
    return new Promise<void>((resolve, reject) => {
      const server = new WebSocketServer({ port: 0 });

      server.once('listening', () => {
        wss = server;
        port = (server.address() as AddressInfo).port;
        console.log(`[E2E] Mock MCP Server listening on port ${port}`);
        resolve();
      });

      server.once('error', reject);
    });
  });

  test.afterAll(async () => {
    if (wss) {
      // Ensure all client connections are terminated
      for (const client of wss.clients) {
        client.terminate();
      }
      
      await new Promise<void>((resolve) => {
        wss.close(() => resolve());
      });
    }
  });

  test('should connect to MCP server and react to messages', async ({ page }) => {
    // 1. Setup Promise to detect connection on server side
    const connectionPromise = new Promise<void>((resolve) => {
      wss.once('connection', (ws) => {
        // Wait a bit for the frontend to be ready to receive
        setTimeout(() => {
          ws.send(JSON.stringify({
            type: 'say',
            text: 'Hello from E2E',
            duration: 1000
          }));
          resolve();
        }, 1000);
      });
    });

    // 2. Load Page with custom port
    await page.goto(`/?wsPort=${port}`);

    // 3. Verify Connection UI
    const statusBadge = page.locator('#mcp-status');
    // Initial state may be brief, but we expect it to eventually connect
    await expect(statusBadge).toHaveText('Connected', { timeout: 10000 });

    // Wait for connection to happen
    await connectionPromise;

    // 4. Verify Initial 'Say' Action
    const sayLog = page.locator('.msg.agent', { hasText: 'Hello from E2E' });
    await expect(sayLog).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: 'test-results/screenshots/mcp-action-say.png' });

    // 5. Verify 'Think' Action
    wss.clients.forEach(client => {
      if (client.readyState === 1) {
        client.send(JSON.stringify({
          type: 'think',
          text: 'Thinking via MCP...',
          duration: 2000
        }));
      }
    });
    const thinkLog = page.locator('.msg.agent', { hasText: 'Thinking via MCP...' });
    await expect(thinkLog).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(500); // Wait for bubble
    await page.screenshot({ path: 'test-results/screenshots/mcp-action-think.png' });
    await page.waitForTimeout(2000); // Wait for think to finish

    // 6. Verify Complex Actions & Capture Screenshots
    const actions = ['wave', 'bow', 'dance', 'walk', 'death'];
    
    for (const action of actions) {
      console.log(`[E2E] Triggering MCP action: ${action}`);
      
      expect(wss.clients.size).toBeGreaterThan(0);

      // Send action command
      wss.clients.forEach(client => {
        if (client.readyState === 1) {
          client.send(JSON.stringify({
            type: 'play_action',
            action: action
          }));
        }
      });

      // Wait for animation to start by waiting for the log entry
      const logEntry = page.locator('.msg.agent', { hasText: `Action: ${action}` });
      await expect(logEntry).toBeVisible({ timeout: 5000 });
      
      // Wait a tiny bit more for animation state to progress
      await page.waitForTimeout(1000);
      
      // Capture screenshot
      await page.screenshot({ path: `test-results/screenshots/mcp-action-${action}.png` });

      // Reset to idle to prevent state bleeding (especially for death)
      wss.clients.forEach(client => {
        if (client.readyState === 1) {
          client.send(JSON.stringify({
            type: 'play_action',
            action: 'idle'
          }));
        }
      });
      await page.waitForTimeout(1000);
    }

    await page.waitForTimeout(500);

    // 7. Verify LookAt Interaction
    console.log('[E2E] Triggering MCP LookAt');
    expect(wss.clients.size).toBeGreaterThan(0);

    wss.clients.forEach(client => {
      if (client.readyState === 1) {
        client.send(JSON.stringify({
          type: 'interaction',
          name: 'lookAt',
          value: { x: 1, y: 1, z: 1 }
        }));
      }
    });
    
    // Wait for UI log indicating the interaction was processed
    const lookAtLog = page.locator('.msg.agent', { hasText: 'Interaction: lookAt' });
    await expect(lookAtLog).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(1000); // Wait for head to turn
    
    await page.screenshot({ path: `test-results/screenshots/mcp-interaction-lookat.png` });
  });
});
