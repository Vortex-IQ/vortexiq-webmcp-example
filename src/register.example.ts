/** Copyright (c) 2026 Vortex IQ. Vortex IQ Sustainable Use License 1.0. */
import { initializeWebMCPPolyfill } from "@mcp-b/webmcp-polyfill";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TOOLS, TOOL_SPECS, callTool, type ToolName } from "./tools.example";

export function registerWebMcpTools(): () => void {
  initializeWebMCPPolyfill({ installTestingShim: true });
  const context = (document as Document & { modelContext?: {
    registerTool(tool: unknown, options: { signal: AbortSignal }): void;
  } }).modelContext;
  if (!context) return () => {};
  const lifecycle = new AbortController();
  try {
    for (const spec of TOOL_SPECS) context.registerTool({
      name: spec.name, description: spec.description, inputSchema: spec.inputSchema,
      annotations: { readOnlyHint: spec.readOnlyHint },
      execute: (args: unknown) => callTool(spec.name, args),
    }, { signal: lifecycle.signal });
  } catch (error) { lifecycle.abort(); throw error; }
  return () => lifecycle.abort();
}

export function createMcpServer() {
  const server = new McpServer({ name: "vortexiq-webmcp-example", version: "2.0.0" }, {
    instructions: "All data and prices are illustrative fixtures. No merchant accounts or email service. A prepared form or returned link is not a completed action.",
  });
  for (const name of Object.keys(TOOLS) as ToolName[]) {
    const tool = TOOLS[name];
    server.registerTool(name, {
      description: tool.description, inputSchema: tool.schema,
      annotations: { readOnlyHint: tool.readOnlyHint, destructiveHint: false, openWorldHint: false },
    }, (args: Record<string, unknown>) => callTool(name, args));
  }
  return server;
}

export async function registerMcpBridge(): Promise<() => Promise<void>> {
  const { TabServerTransport } = await import("@mcp-b/transports");
  const server = createMcpServer();
  try { await server.connect(new TabServerTransport({ allowedOrigins: [window.location.origin] })); }
  catch (error) { await server.close(); throw error; }
  return () => server.close();
}
