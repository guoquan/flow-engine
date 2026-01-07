import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { fileURLToPath } from "url";
import { WebSocketServer, WebSocket } from 'ws';
import { SaySchema, ThinkSchema, PlayActionSchema } from "../schemas/actions.js";
import type { SayData, ThinkData, PlayActionData } from "../schemas/actions.js";

/**
 * FlowMcpServer
 * A Model Context Protocol server that exposes Flow Engine capabilities as tools.
 * 
 * Note: This server acts as a bridge. It connects to the FlowEngine instance via WebSocket.
 */
export class FlowMcpServer {
  private server: Server;
  private wss: WebSocketServer;
  private clients: Set<WebSocket> = new Set();

  constructor() {
    this.server = new Server(
      {
        name: "flow-engine-server",
        version: "0.1.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize WebSocket Server for bridging to Browser
    try {
      this.wss = new WebSocketServer({ port: 3001 });
      
      this.wss.on('connection', (ws) => {
        console.error('[MCP-Bridge] Client connected');
        this.clients.add(ws);

        ws.on('close', () => {
          console.error('[MCP-Bridge] Client disconnected');
          this.clients.delete(ws);
        });
        
        ws.on('error', (err) => {
          console.error('[MCP-Bridge] Client error:', err);
          // Ensure errored connections are properly cleaned up
          if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
            ws.close();
          }
          this.clients.delete(ws);
        });
      });

      console.error('[MCP-Bridge] WebSocket server listening on port 3001');
    } catch (err: any) {
      if (err.code === 'EADDRINUSE') {
        console.error('[MCP-Bridge] Error: Port 3001 is already in use. The WebSocket bridge will not be available.');
      } else {
        console.error('[MCP-Bridge] Failed to start WebSocket server:', err);
      }
      // Create a dummy wss to avoid crashes, though bridge won't work
      this.wss = { on: () => {}, close: (cb: any) => cb(), clients: new Set() } as any;
    }

    this.setupTools();
  }

  private setupTools() {
    // Generate JSON Schemas from Zod definitions using Zod 4 native toJSONSchema
    const sayToolSchema = (SaySchema as any).toJSONSchema() as Tool["inputSchema"];
    const thinkToolSchema = (ThinkSchema as any).toJSONSchema() as Tool["inputSchema"];
    const playActionToolSchema = (PlayActionSchema as any).toJSONSchema() as Tool["inputSchema"];

    const tools: Tool[] = [
      {
        name: "say",
        description: "Make the avatar speak a specific text bubble.",
        inputSchema: sayToolSchema,
      },
      {
        name: "think",
        description: "Make the avatar enter a thinking state with a thought bubble.",
        inputSchema: thinkToolSchema,
      },
      {
        name: "play_action",
        description: "Play a specific animation action (e.g., 'wave', 'bow', 'dance').",
        inputSchema: playActionToolSchema,
      },
    ];

    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools,
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name } = request.params;
      const args = request.params.arguments;

      switch (name) {
        case "say": {
          // Use Zod to validate and parse
          const parsed = SaySchema.parse(args);
          return this.handleSay(parsed);
        }
        case "think": {
          const parsed = ThinkSchema.parse(args);
          return this.handleThink(parsed);
        }
        case "play_action": {
          const parsed = PlayActionSchema.parse(args);
          return this.handlePlayAction(parsed);
        }
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  private broadcast(message: any) {
    const payload = JSON.stringify(message);
    let count = 0;
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
        count++;
      }
    });
    return count;
  }

  /**
   * Implementation for the "say" tool.
   */
  private async handleSay(args: SayData) {
    const durationInfo = ` for ${args.duration} ms`;
    console.error(`[MCP] Executing say: "${args.text}"${durationInfo}`);
    
    const sent = this.broadcast({ type: 'say', ...args });

    return {
      content: [
        { 
          type: "text", 
          text: sent > 0 
            ? `Command sent to ${sent} client(s): Say "${args.text}"` 
            : `Command acknowledged but no frontend clients connected. (Say "${args.text}")`
        }
      ],
    };
  }

  /**
   * Implementation for the "think" tool.
   */
  private async handleThink(args: ThinkData) {
    const thought = args.text;
    const durationInfo = ` for ${args.duration} ms`;
    console.error(`[MCP] Executing think: "${thought}"${durationInfo}`);

    const sent = this.broadcast({ type: 'think', ...args });

    return {
      content: [
        { 
          type: "text", 
          text: sent > 0
            ? `Command sent to ${sent} client(s): Think "${thought}"`
            : `Command acknowledged but no frontend clients connected. (Think "${thought}")`
        }
      ],
    };
  }

  /**
   * Implementation for the "play_action" tool.
   */
  private async handlePlayAction(args: PlayActionData) {
    console.error(`[MCP] Executing play_action: ${args.action}`);
    
    const sent = this.broadcast({ type: 'play_action', ...args });

    return {
      content: [
        { 
          type: "text", 
          text: sent > 0
            ? `Command sent to ${sent} client(s): Play action "${args.action}"`
            : `Command acknowledged but no frontend clients connected. (Play "${args.action}")`
        }
      ],
    };
  }

  public async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Flow MCP Server running on stdio");
  }

  /**
   * Gracefully shuts down the MCP and WebSocket servers.
   */
  public async close(): Promise<void> {
    console.error("[MCP] Shutting down...");
    
    // Close all connected WebSocket clients
    for (const client of this.clients) {
      try {
        if (client.readyState === WebSocket.OPEN || client.readyState === WebSocket.CLOSING) {
          client.close();
        }
      } catch (err) {
        console.error("[MCP] Error closing client:", err);
      }
    }
    this.clients.clear();

    // Close the WebSocket server
    await new Promise<void>((resolve, reject) => {
      this.wss.close((err?: Error) => {
        if (err) {
          reject(err);
        } else {
          console.error("[MCP] WebSocket server closed.");
          resolve();
        }
      });
    });
  }
}

/**
 * Programmatic entry point for running the Flow MCP server via CLI-style usage.
 */
export async function runFlowMcpServerCli(): Promise<void> {
  const server = new FlowMcpServer();
  
  // Handle graceful shutdown
  const shutdown = async () => {
    await server.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  try {
    await server.run();
  } catch (error) {
    console.error("Fatal error in MCP server:", error);
    process.exit(1);
  }
}

// Entry point for CLI usage
const currentPath = fileURLToPath(import.meta.url);
if (
  process.argv[1] === currentPath || 
  process.argv[1]?.endsWith("server.ts") || 
  process.argv[1]?.endsWith("server.js")
) {
  runFlowMcpServerCli().catch((error) => {
    console.error("Fatal error in MCP server:", error);
    process.exit(1);
  });
}