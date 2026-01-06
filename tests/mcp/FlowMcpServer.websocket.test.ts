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
  let receivedMessages: any[] = [];

  beforeAll(async () => {
    server = new TestableMcpServer();
    // Wait for server to be ready (it starts listening in constructor)
    
    // Create a client
    return new Promise<void>((resolve) => {
      client = new WebSocket('ws://localhost:3001');
      client.on('open', () => resolve());
      client.on('message', (data) => {
        receivedMessages.push(JSON.parse(data.toString()));
      });
    });
  });

  afterAll(async () => {
    client.close();
    await server.close();
  });

  it('should broadcast "say" command to connected client', async () => {
    receivedMessages = []; // Clear buffer
    
    const payload = { text: "Hello WebSocket", duration: 1000 };
    
    // Create a promise that resolves when a message arrives
    const msgPromise = new Promise<any>(resolve => {
      const listener = (data: any) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'say') {
          client.off('message', listener); // Clean up
          resolve(msg);
        }
      };
      client.on('message', listener);
    });

    await server.testSay(payload);

    const msg = await msgPromise;

    expect(msg).toMatchObject({
      type: 'say',
      text: "Hello WebSocket",
      duration: 1000
    });
  });

  it('should broadcast "think" command', async () => {
    receivedMessages = [];
    
    const payload = { text: "Thinking deep...", duration: 2000 };
    
    const msgPromise = new Promise<any>(resolve => {
      const listener = (data: any) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'think') {
          client.off('message', listener);
          resolve(msg);
        }
      };
      client.on('message', listener);
    });

    // We need to access private method, but we made a wrapper above
    await (server as any).handleThink(payload);

    const msg = await msgPromise;

    expect(msg).toMatchObject({
      type: 'think',
      text: "Thinking deep..."
    });
  });

  it('should broadcast "play_action" command', async () => {
    receivedMessages = [];
    
    const payload = { action: "dance" };
    
    const msgPromise = new Promise<any>(resolve => {
      const listener = (data: any) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'play_action') {
          client.off('message', listener);
          resolve(msg);
        }
      };
      client.on('message', listener);
    });

    await (server as any).handlePlayAction(payload);

    const msg = await msgPromise;

    expect(msg).toMatchObject({
      type: 'play_action',
      action: "dance"
    });
  });
});
