import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { fileURLToPath } from "url";

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

      // Validate required arguments for specific tools
      const tool = tools.find(t => t.name === name);
      if (!tool) {
        throw new Error(`Unknown tool: ${name}`);
      }

      // Check for required fields in inputSchema
      const requiredFields = (tool.inputSchema as any)?.required || [];
      for (const field of requiredFields) {
        if (!args || !(field in args)) {
          throw new Error(`Missing required argument: ${field}`);
        }
      }

      switch (name) {
        case "say":
          return this.handleSay(args as { text: string; duration?: number });
        case "think":
          return this.handleThink(args as { text?: string; duration?: number });
        case "play_action":
          return this.handlePlayAction(args as { action: string });
        default:
          // Should be unreachable due to earlier validation
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  /**
   * Placeholder implementation for the "say" tool.
   *
   * NOTE: This method does not currently talk to a real FlowEngine instance.
   * In a production setup, this should delegate to FlowEngine.say() via
   * an IPC or WebSocket connection to the running FlowEngine process.
   */
  private async handleSay(args: { text: string; duration?: number }) {
    const durationInfo = args.duration !== undefined ? ` for ${args.duration} ms` : "";
    console.error(`[MCP] Executing say: "${args.text}"${durationInfo}`);
    return {
      content: [
        { 
          type: "text", 
          text: `Avatar is now saying: "${args.text}"${durationInfo} (stub: no connected FlowEngine)` 
        }
      ],
    };
  }

  /**
   * Placeholder implementation for the "think" tool.
   */
  private async handleThink(args: { text?: string; duration?: number }) {
    const thought = args.text || "...";
    const durationInfo = args.duration !== undefined ? ` for ${args.duration} ms` : "";
    console.error(`[MCP] Executing think: "${thought}"${durationInfo}`);
    return {
      content: [
        { 
          type: "text", 
          text: `Avatar is now thinking: "${thought}"${durationInfo} (stub: no connected FlowEngine)` 
        }
      ],
    };
  }

  /**
   * Placeholder implementation for the "play_action" tool.
   */
  private async handlePlayAction(args: { action: string }) {
    console.error(`[MCP] Executing play_action: ${args.action}`);
    return {
      content: [
        { 
          type: "text", 
          text: `Avatar is now playing action: ${args.action} (stub: no connected FlowEngine)` 
        }
      ],
    };
  }

  public async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Flow MCP Server running on stdio");
  }
}

/**
 * Programmatic entry point for running the Flow MCP server via CLI-style usage.
 */
export async function runFlowMcpServerCli(): Promise<never> {
  const server = new FlowMcpServer();
  try {
    await server.run();
  } catch (error) {
    console.error("Fatal error in MCP server:", error);
    process.exit(1);
  }
  // The server should keep the process alive
  return new Promise(() => {}); 
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