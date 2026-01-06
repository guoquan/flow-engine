import { test, expect } from '@playwright/test';
import { WebSocketServer } from 'ws';

const MCP_BRIDGE_PORT = 3001;

test.describe('MCP Bridge Integration', () => {
  let wss: WebSocketServer;
  
  test.beforeAll(async () => {
    // Start a mock WS server on port 3001
    // Note: We use 3001 because the frontend currently expects this port.
    // We add error handling for EADDRINUSE to provide better feedback if the real server is running.
    return new Promise<void>((resolve, reject) => {
      const server = new WebSocketServer({ port: MCP_BRIDGE_PORT });

      server.once('listening', () => {
        wss = server;
        resolve();
      });

      server.once('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          reject(new Error(`Port ${MCP_BRIDGE_PORT} already in use. Ensure 'npm run mcp' is not running.`));
        } else {
          reject(err);
        }
      });
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
        // Send a command immediately upon connection
        ws.send(JSON.stringify({
          type: 'say',
          text: 'Hello from E2E',
          duration: 1000
        }));
        resolve();
      });
    });

    // 2. Load Page
    await page.goto('/');

    // 3. Verify Connection UI
    const statusBadge = page.locator('#mcp-status');
    await expect(statusBadge).toHaveText('Disconnected'); // Initial state

    // Wait for connection to happen
    await connectionPromise;

    // Verify UI update (allow some time for DOM update)
    await expect(statusBadge).toHaveText('Connected', { timeout: 5000 });
    // Check color (green)
    await expect(statusBadge).toHaveCSS('background-color', 'rgb(46, 125, 50)');

    // 4. Verify Action Execution
    // The "say" command should trigger a log entry
    await expect(page.locator('.msg.agent', { hasText: 'Hello from E2E' })).toBeVisible();
  });
});
