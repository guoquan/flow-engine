/**
 * FlowMcpServer
 * A Model Context Protocol server that exposes Flow Engine capabilities as tools.
 *
 * Note: This server acts as a bridge. It connects to the FlowEngine instance via WebSocket.
 */
export declare class FlowMcpServer {
    private server;
    private wss;
    private clients;
    constructor();
    private setupTools;
    private broadcast;
    /**
     * Implementation for the "say" tool.
     */
    private handleSay;
    /**
     * Implementation for the "think" tool.
     */
    private handleThink;
    /**
     * Implementation for the "play_action" tool.
     */
    private handlePlayAction;
    run(): Promise<void>;
    /**
     * Gracefully shuts down the MCP and WebSocket servers.
     */
    close(): Promise<void>;
}
/**
 * Programmatic entry point for running the Flow MCP server via CLI-style usage.
 */
export declare function runFlowMcpServerCli(): Promise<void>;
