import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createMcpServer } from "../src/register.example";
import { callTool, DESTINATIONS, resolveDestination, TOOL_SPECS } from "../src/tools.example";

const data = (result: any) => JSON.parse(result.content[0].text).data;

test("MCP discovery matches native contracts and calls preserve real arguments", async () => {
  const server = createMcpServer();
  const client = new Client({ name: "example-tests", version: "1.0" });
  const [a, b] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(b), client.connect(a)]);
  try {
    const listed = (await client.listTools()).tools;
    assert.equal(listed.length, 19);
    for (const spec of TOOL_SPECS) {
      const bridge = listed.find(item => item.name === spec.name)!;
      assert.deepEqual(bridge.inputSchema.properties, spec.inputSchema.properties, spec.name);
      assert.deepEqual(bridge.inputSchema.required ?? [], spec.inputSchema.required ?? []);
      assert.equal(bridge.inputSchema.additionalProperties, false);
      assert.equal(bridge.annotations?.readOnlyHint, spec.readOnlyHint);
    }
    const search = await client.callTool({ name: "search_connectors", arguments: { query: "Klaviyo" } });
    assert.equal(data(search).matched, 1);
    assert.equal(data(search).results[0].name, "Klaviyo");
    const roi = await client.callTool({ name: "calculate_roi", arguments: { cur: "GBP", plan: "Growth", products: 100, reportHours: 5, tickets: 8, hourlyRate: 50 } });
    assert.equal(data(roi).annualHours, 452);
    assert.equal(data(roi).annualLabourCost, 22600);
    assert.equal(data(roi).annualPlanCost, 2000);
    assert.equal((await client.callTool({ name: "search_connectors", arguments: { query: "Klaviyo", unexpected: true } })).isError, true);
  } finally { await client.close(); await server.close(); }
});

test("invalid inputs and unknown tools fail closed", async () => {
  for (const [name, args] of [
    ["calculate_roi", { revenue: 10000 }],
    ["search_connectors", { query: "x".repeat(161) }],
    ["search_connectors", { query: "hello\nheader" }],
    ["get_blog_post", { slug: "../../secret" }],
    ["get_pricing_plans", { cur: "EUR" }],
    ["__proto__", {}],
  ] as const) assert.equal((await callTool(name, args)).isError, true, name);
});

test("navigation only resolves existing sections and permitted filters", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  assert.equal(new Set(DESTINATIONS.map(item => item.id)).size, DESTINATIONS.length);
  for (const destination of DESTINATIONS) {
    const result = resolveDestination(destination.id);
    assert.equal(new URL(result.url, "https://example.com").origin, "https://example.com");
    assert.equal(result.completesMerchantAction, false);
    assert.ok(html.includes(`id="${destination.section}"`));
  }
  assert.equal(resolveDestination("site.integrations", { q: "Klaviyo" }).url, "/?q=Klaviyo#connectors");
  for (const id of ["https://evil.example", "//evil.example", "app.connections", "__proto__"]) assert.throws(() => resolveDestination(id));
  assert.throws(() => resolveDestination("site.trust", { next: "https://evil.example" }));
  assert.throws(() => resolveDestination("site.usecases", { platform: "unknown" }));
});

test("brochure preparation cannot claim delivery or expose contact details in links", async () => {
  const result = data(await callTool("submit_brochure_request", { name: "Test Visitor", email: "test@example.com", company: "Test" }));
  assert.equal(result.submitted, false);
  assert.equal(result.status, "requires_user_action");
  assert.equal(result.destination.url, "/#request");
  assert.ok(!JSON.stringify(result).includes("test@example.com"));
  assert.equal((await callTool("set_billing_period", { period: "monthly" })).isError, true);
});

test("pricing and discovered content are explicitly sample data", async () => {
  const result = await callTool("get_pricing_plans", { cur: "GBP", billing: "monthly" });
  assert.equal(JSON.parse(result.content[0].text).sample, true);
  assert.equal(data(result)[0].chargedAmount, 100);
  const content = data(await callTool("get_site_section", { destinationId: "site.trust" }));
  assert.equal(content.source, "demo_fixture");
  assert.equal(content.untrustedContent, true);
  const workflows = data(await callTool("search_use_cases", { platform: "bigcommerce" }));
  assert.equal(workflows.length, 1);
  assert.equal(workflows[0].destination.url, "/#payment-failures");
});
