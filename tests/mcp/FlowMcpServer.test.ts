import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FlowMcpServer } from '../../src/mcp/server';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

// Mock the MCP SDK Server
vi.mock('@modelcontextprotocol/sdk/server/index.js', () => {
  return {
    Server: class {
      public handlers = new Map();
      constructor() {}
      setRequestHandler(schema: any, handler: any) {
        this.handlers.set(schema, handler);
      }
      async callHandler(schema: any, params: any) {
        const handler = this.handlers.get(schema);
        if (handler) return handler(params);
        return null;
      }
      connect = vi.fn();
    }
  };
});

vi.mock('@modelcontextprotocol/sdk/server/stdio.js', () => {
  return {
    StdioServerTransport: class {}
  };
});

describe('FlowMcpServer', () => {
  let server: FlowMcpServer;

  beforeEach(() => {
    server = new FlowMcpServer();
  });

  it('should register tools correctly', async () => {
    // @ts-ignore - access private server to verify registration
    const mcpServer = server.server;
    
    // Check if handler is registered for ListToolsRequestSchema
    expect(mcpServer.handlers.has(ListToolsRequestSchema)).toBe(true);

    // Manual trigger
    const result = await mcpServer.callHandler(ListToolsRequestSchema, {});
    
    expect(result).toBeDefined();
    expect(result.tools).toBeDefined();
    expect(result.tools).toHaveLength(3);
    expect(result.tools[0].name).toBe('say');
  });

  it('should handle tool calls correctly', async () => {
    // @ts-ignore
    const mcpServer = server.server;
    
    expect(mcpServer.handlers.has(CallToolRequestSchema)).toBe(true);

    // Simulate a 'say' call
    const sayResult = await mcpServer.callHandler(CallToolRequestSchema, {
      params: {
        name: 'say',
        arguments: { text: 'Test message' }
      }
    });
    
    expect(sayResult).toBeDefined();
    expect(sayResult.content).toBeDefined();
    expect(sayResult.content[0].text).toContain('Test message');

    // Simulate a 'play_action' call
    const actionResult = await mcpServer.callHandler(CallToolRequestSchema, {
      params: {
        name: 'play_action',
        arguments: { action: 'wave' }
      }
    });

    expect(actionResult).toBeDefined();
    expect(actionResult.content).toBeDefined();
    expect(actionResult.content[0].text).toContain('wave');
  });
});