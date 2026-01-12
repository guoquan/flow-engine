import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { WebSocket } from 'ws';
import { FlowMcpServer } from '../../src/mcp/server';

// Helper to mock the "server" part without running stdio transport blocking the test
class TestableMcpServer extends FlowMcpServer {
  // Expose the internal handle methods for testing
  public async testSay(args: any) {
    return (this as any).handleSay(args);
  }
}

describe('FlowMcpServer WebSocket Bridge', () => {
  let server: TestableMcpServer;
  let client: WebSocket;

  beforeAll(async () => {
    // Use port 0 to let the OS assign a random available port
    server = new TestableMcpServer({ port: 0 });
    
    // Get the assigned port from the server
    const port = await new Promise<number>((resolve, reject) => {
      const start = Date.now();
      const timeoutMs = 2000;

      const checkPort = () => {
        try {
          const p = server.getPort();
          if (p && p !== 0) {
            resolve(p);
            return;
          }
        } catch (err) {
          // Ignore transient errors while server is starting
        }
        if (Date.now() - start >= timeoutMs) {
          reject(new Error('Server did not start listening in time'));
        } else {
          setTimeout(checkPort, 10);
        }
      };

      checkPort();
    });

    // Create a client with timeout
    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Connection timeout")), 2000);
      client = new WebSocket(`ws://localhost:${port}`);
      client.on('open', () => {
        clearTimeout(timeout);
        resolve();
      });
      client.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  });

  afterAll(async () => {
    if (client) client.close();
    if (server) await server.close();
  });

  const waitForMessage = (type: string, timeoutMs = 2000) => {
    return new Promise<any>((resolve, reject) => {
      const timeout = setTimeout(() => {
        client.off('message', listener);
        reject(new Error(`Timeout waiting for message: ${type}`));
      }, timeoutMs);

      const listener = (data: any) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === type) {
          clearTimeout(timeout);
          client.off('message', listener);
          resolve(msg);
        }
      };
      client.on('message', listener);
    });
  };

  it('should broadcast "say" command to connected client', async () => {
    const payload = { text: "Hello WebSocket", duration: 1000 };
    
    const msgPromise = waitForMessage('say');
    await server.testSay(payload);
    const msg = await msgPromise;

    expect(msg).toMatchObject({
      type: 'say',
      text: "Hello WebSocket",
      duration: 1000
    });
  });

  it('should broadcast "think" command', async () => {
    const payload = { text: "Thinking deep...", duration: 2000 };
    
    const msgPromise = waitForMessage('think');
    // We need to access private method, but we made a wrapper above
    await (server as any).handleThink(payload);
    const msg = await msgPromise;

    expect(msg).toMatchObject({
      type: 'think',
      text: "Thinking deep..."
    });
  });

  it('should broadcast "play_action" command', async () => {
    const payload = { action: "dance" };
    
    const msgPromise = waitForMessage('play_action');
    await (server as any).handlePlayAction(payload);
    const msg = await msgPromise;

    expect(msg).toMatchObject({
      type: 'play_action',
      action: "dance"
    });
  });
});
