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

  afterAll(() => {
    client.close();
    // Close server - currently FlowMcpServer doesn't expose close(), 
    // so we might leave handles open. Ideally, refactor server to have .close().
    // For now, we accept this limitation in test environment or force exit.
    // Accessing private wss to close it
    (server as any).wss.close();
  });

  it('should broadcast "say" command to connected client', async () => {
    receivedMessages = []; // Clear buffer
    
    const payload = { text: "Hello WebSocket", duration: 1000 };
    await server.testSay(payload);

    // Wait briefly for async msg
    await new Promise(r => setTimeout(r, 100));

    expect(receivedMessages.length).toBe(1);
    expect(receivedMessages[0]).toMatchObject({
      type: 'say',
      text: "Hello WebSocket",
      duration: 1000
    });
  });

  it('should broadcast "think" command', async () => {
    receivedMessages = [];
    
    const payload = { text: "Thinking deep...", duration: 2000 };
    // We need to access private method, but we made a wrapper above,
    // actually we need to expose other handlers too or just use 'any' cast
    await (server as any).handleThink(payload);

    await new Promise(r => setTimeout(r, 100));

    expect(receivedMessages.length).toBe(1);
    expect(receivedMessages[0]).toMatchObject({
      type: 'think',
      text: "Thinking deep..."
    });
  });

  it('should broadcast "play_action" command', async () => {
    receivedMessages = [];
    
    const payload = { action: "dance" };
    await (server as any).handlePlayAction(payload);

    await new Promise(r => setTimeout(r, 100));

    expect(receivedMessages.length).toBe(1);
    expect(receivedMessages[0]).toMatchObject({
      type: 'play_action',
      action: "dance"
    });
  });
});
