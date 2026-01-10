import { test, expect } from '@playwright/test';
import { WebSocketServer } from 'ws';
import fs from 'fs';

test.describe('MCP Bridge Integration', () => {
  let wss: WebSocketServer;
  let port: number;
  
  test.beforeAll(async () => {
    // Ensure screenshot directory exists
    if (!fs.existsSync('test-results/screenshots')) {
      fs.mkdirSync('test-results/screenshots', { recursive: true });
    }

    // Start a mock WS server on random port
    return new Promise<void>((resolve, reject) => {
      const server = new WebSocketServer({ port: 0 });

      server.once('listening', () => {
        wss = server;
        port = (server.address() as any).port;
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
    await expect(statusBadge).toHaveText('Disconnected'); // Initial state may be brief

    // Wait for connection to happen
    await connectionPromise;

    // Verify UI update (allow some time for DOM update)
    await expect(statusBadge).toHaveText('Connected', { timeout: 5000 });
    // Check color (green)
    await expect(statusBadge).toHaveCSS('background-color', 'rgb(46, 125, 50)');

    // 4. Verify Initial 'Say' Action
    await expect(page.locator('.msg.agent', { hasText: 'Hello from E2E' })).toBeVisible();
    await page.screenshot({ path: 'test-results/screenshots/mcp-action-say.png' });

    // 5. Verify Complex Actions & Capture Screenshots
    const actions = ['wave', 'bow', 'dance', 'walk', 'death'];
    
    for (const action of actions) {
      console.log(`[E2E] Triggering MCP action: ${action}`);
      
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
      await expect(logEntry).toBeVisible();
      
      // Wait a tiny bit more for animation state to progress
      await page.waitForTimeout(500);
      
      // Capture screenshot
      await page.screenshot({ path: `test-results/screenshots/mcp-action-${action}.png` });
    }

    // 6. Verify LookAt Interaction
    console.log('[E2E] Triggering MCP LookAt');
    wss.clients.forEach(client => {
      if (client.readyState === 1) {
        client.send(JSON.stringify({
          type: 'interaction',
          name: 'lookAt',
          value: { x: 1, y: 1, z: 1 } // Send raw object, engine/schema should handle parsing/Vector3 conversion
        }));
      }
    });
    
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `test-results/screenshots/mcp-interaction-lookat.png` });
  });
});
