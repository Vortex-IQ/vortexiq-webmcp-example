/**
 * Vortex IQ WebMCP example: registration.
 *
 * Two paths, mirroring the live vortexiq.ai implementation:
 *   1. Native spec path: document.modelContext.registerTool(...), via the
 *      @mcp-b/webmcp-polyfill shim so it works ahead of native browser support.
 *   2. MCP bridge path: the same tools exposed as a standard MCP server over a
 *      tab transport, so agents using the MCP-B browser extension can connect.
 *
 * Copyright (c) 2026 Vortex IQ. Licensed under the Vortex IQ Sustainable Use
 * License 1.0 (see LICENSE.md). Fair-code, not open source.
 */

import { initializeWebMCPPolyfill } from "@mcp-b/webmcp-polyfill";
import { TabServerTransport } from "@mcp-b/transports";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TOOL_SPECS, callTool, type ToolName } from "./tools.example";

// 1) Native/spec path: document.modelContext.registerTool(...)
export function registerWebMcpTools(): void {
  initializeWebMCPPolyfill({ installTestingShim: true });

  const modelContext = (document as unknown as { modelContext?: any }).modelContext;
  if (!modelContext) return;

  for (const spec of TOOL_SPECS) {
    modelContext.registerTool({
      name: spec.name,
      description: spec.description,
      // On the live site each tool ships a JSON Schema for its inputs.
      inputSchema: { type: "object", additionalProperties: true },
      annotations: { readOnlyHint: spec.readOnlyHint },
      async execute(args: Record<string, unknown>) {
        return callTool(spec.name as ToolName, args ?? {});
      },
    });
  }
}

// 2) Bridge path: expose the same tools as an MCP server over TabServerTransport.
export async function registerMcpBridge(): Promise<void> {
  const server = new McpServer(
    { name: "vortexiq-webmcp-example", version: "1.0.0" },
    { instructions: "Vortex IQ WebMCP example, exposing the same tool shapes as the live site." }
  );

  for (const spec of TOOL_SPECS) {
    server.tool(
      spec.name,
      spec.description,
      {},
      async (args: Record<string, unknown>) => callTool(spec.name as ToolName, args ?? {})
    );
  }

  const transport = new TabServerTransport({ allowedOrigins: ["*"] });
  await server.connect(transport);
}
