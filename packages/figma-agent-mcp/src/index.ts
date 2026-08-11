#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Election } from "./election.js";
import { registerTools } from "./tools.js";
import { VERSION } from "./version.js";

const DEFAULT_PORT = 1994;
const port = Number(process.env.FIGMA_AGENT_MCP_PORT ?? DEFAULT_PORT);

let election: Election | null = null;
let mcpServer: McpServer | null = null;

async function shutdown(): Promise<void> {
  console.error("[figma-agent-mcp] shutting down...");
  if (mcpServer) {
    await mcpServer.close();
    mcpServer = null;
  }
  if (election) {
    await election.stop();
    election = null;
  }
}

async function main(): Promise<void> {
  console.error(`[figma-agent-mcp] starting v${VERSION} on port ${port}`);

  election = new Election(port);
  await election.start();

  mcpServer = new McpServer({
    name: "figma-agent-mcp",
    version: VERSION,
  });

  registerTools(mcpServer, election.getNode(), port);

  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);

  console.error("[figma-agent-mcp] MCP server ready (stdio)");
}

process.on("SIGINT", () => {
  shutdown().finally(() => process.exit(0));
});

process.on("SIGTERM", () => {
  shutdown().finally(() => process.exit(0));
});

main().catch((err) => {
  console.error("[figma-agent-mcp] fatal error:", err);
  process.exit(1);
});
