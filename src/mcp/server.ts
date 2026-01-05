import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";

/**
 * FlowMcpServer
 * A Model Context Protocol server that exposes Flow Engine capabilities as tools.
 * 
 * Note: This server acts as a bridge. In a real production scenario, 
 * it would connect to a running FlowEngine instance via WebSockets or another IPC mechanism.
 */
export class FlowMcpServer {
  private server: Server;

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

    this.setupTools();
  }

  private setupTools() {
    const tools: Tool[] = [
      {
        name: "say",
        description: "Make the avatar speak a specific text bubble.",
        inputSchema: {
          type: "object",
          properties: {
            text: { type: "string", description: "The text to speak" },
            duration: { type: "number", description: "Duration in milliseconds (optional)" },
          },
          required: ["text"],
        },
      },
      {
        name: "think",
        description: "Make the avatar enter a thinking state with a thought bubble.",
        inputSchema: {
          type: "object",
          properties: {
            text: { type: "string", description: "The thought text (optional, defaults to '...')" },
            duration: { type: "number", description: "Duration in milliseconds (optional)" },
          },
        },
      },
      {
        name: "play_action",
        description: "Play a specific animation action (e.g., 'wave', 'bow', 'dance').",
        inputSchema: {
          type: "object",
          properties: {
            action: { type: "string", description: "The name of the animation to play" },
          },
          required: ["action"],
        },
      },
    ];

    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools,
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name } = request.params;
      const args = request.params.arguments;

      switch (name) {
        case "say":
          return this.handleSay(args as { text: string; duration?: number });
        case "think":
          return this.handleThink(args as { text?: string; duration?: number });
        case "play_action":
          return this.handlePlayAction(args as { action: string });
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  private async handleSay(args: { text: string; duration?: number }) {
    // In a real implementation, this would send a message to the browser
    console.error(`[MCP] Executing say: "${args.text}"`);
    return {
      content: [{ type: "text", text: `Avatar is now saying: "${args.text}"` }],
    };
  }

  private async handleThink(args: { text?: string; duration?: number }) {
    console.error(`[MCP] Executing think: "${args.text || "..."}"`);
    return {
      content: [{ type: "text", text: `Avatar is now thinking: "${args.text || "..."}"` }],
    };
  }

  private async handlePlayAction(args: { action: string }) {
    console.error(`[MCP] Executing play_action: ${args.action}`);
    return {
      content: [{ type: "text", text: `Avatar is now playing action: ${args.action}` }],
    };
  }

  public async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Flow MCP Server running on stdio");
  }
}

// Entry point for CLI usage
if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.endsWith('server.js')) {
  const server = new FlowMcpServer();
  server.run().catch((error) => {
    console.error("Fatal error in MCP server:", error);
    process.exit(1);
  });
}
