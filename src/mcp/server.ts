import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { fileURLToPath } from "url";
import { zodToJsonSchema } from "zod-to-json-schema";
import { SaySchema, ThinkSchema, PlayActionSchema } from "../schemas/actions.js";
import type { SayData, ThinkData, PlayActionData } from "../schemas/actions.js";

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
    // Generate JSON Schemas from Zod definitions
    // We cast to any because zod-to-json-schema returns a type that might be slightly
    // more specific or different than what MCP Tool types strictly expect, but structure is compatible.
    const sayToolSchema = zodToJsonSchema(SaySchema) as any;
    const thinkToolSchema = zodToJsonSchema(ThinkSchema) as any;
    const playActionToolSchema = zodToJsonSchema(PlayActionSchema) as any;

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

  /**
   * Placeholder implementation for the "say" tool.
   */
  private async handleSay(args: SayData) {
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
  private async handleThink(args: ThinkData) {
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
  private async handlePlayAction(args: PlayActionData) {
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
