/**
 * Vortex IQ WebMCP example: tool specifications and handlers.
 *
 * This is a self-contained reference version of the 15 tools Vortex IQ
 * registers on its live site (https://www.vortexiq.ai). The handlers here use
 * small representative sample data. On the live site the same handlers read
 * from the real connector directory, blog, pricing, case studies, and trust
 * policies. The tool names, shapes, and the read-first design are identical.
 *
 * Copyright (c) 2026 Vortex IQ. Licensed under the Vortex IQ Sustainable Use
 * License 1.0 (see LICENSE.md). Fair-code, not open source.
 */

export interface ToolResult {
  content: { type: "text"; text: string }[];
}

function json(value: unknown): ToolResult {
  return { content: [{ type: "text", text: JSON.stringify(value, null, 2) }] };
}

// --- Representative sample data (the live site uses real site data) ---

const SAMPLE_CONNECTORS = [
  { name: "Shopify", category: "Commerce", desc: "Storefront, orders, products" },
  { name: "BigCommerce", category: "Commerce", desc: "Catalog, carts, checkout" },
  { name: "Adobe Commerce", category: "Commerce", desc: "Magento catalog and orders" },
  { name: "Stripe", category: "Payments", desc: "Payments and settlement" },
  { name: "Klaviyo", category: "Marketing", desc: "Email and SMS flows" },
  { name: "GA4", category: "Analytics", desc: "Traffic and conversion" },
];

const SAMPLE_CATEGORIES = ["Commerce", "Payments", "Marketing", "Analytics", "Fulfilment", "Support"];

const SAMPLE_PLANS = [
  { id: "growth", name: "Growth", monthly: 199, annual: 1990, stores: 1 },
  { id: "scale", name: "Scale", monthly: 499, annual: 4990, stores: 5 },
];

const SAMPLE_POSTS = [
  { slug: "webmcp-ecommerce-agent-ready", title: "WebMCP for Ecommerce", excerpt: "Make your store agent-ready." },
];

const SAMPLE_CASE_STUDIES = [
  { slug: "example-brand", title: "How Example Brand cut incident time", excerpt: "Detection to fix in minutes." },
];

const SAMPLE_COMPARISONS = [
  { slug: "vortexiq-vs-generic-monitoring", title: "Vortex IQ vs generic monitoring" },
];

const SAMPLE_POLICIES = [
  { slug: "data-protection", title: "Data Protection Policy" },
  { slug: "ai-model-governance", title: "AI Model Governance Policy" },
];

// --- Tool specs (name, description, input schema, read-only hint) ---

export const TOOL_SPECS = [
  { name: "search_connectors", readOnlyHint: true, description: "Search the Vortex IQ integration directory by keyword or category." },
  { name: "list_connector_categories", readOnlyHint: true, description: "List the integration categories and totals." },
  { name: "search_blog_posts", readOnlyHint: true, description: "Search Vortex IQ blog posts by keyword or category." },
  { name: "get_blog_post", readOnlyHint: true, description: "Get a single blog post by slug." },
  { name: "calculate_roi", readOnlyHint: true, description: "Estimate ROI from store inputs (revenue, products, connectors, deploys)." },
  { name: "submit_brochure_request", readOnlyHint: false, description: "Request the Vortex IQ brochure by name, email, and company." },
  { name: "list_comparisons", readOnlyHint: true, description: "List available competitor comparisons." },
  { name: "get_comparison", readOnlyHint: true, description: "Get a single comparison by slug." },
  { name: "list_trust_policies", readOnlyHint: true, description: "List Vortex IQ security and trust policies." },
  { name: "get_trust_policy", readOnlyHint: true, description: "Get a single trust policy by slug." },
  { name: "get_pricing_plans", readOnlyHint: true, description: "Get the Vortex IQ pricing plans." },
  { name: "compare_plans", readOnlyHint: true, description: "Compare two pricing plans by id." },
  { name: "set_billing_period", readOnlyHint: false, description: "Set the pricing display period to monthly or annual." },
  { name: "search_case_studies", readOnlyHint: true, description: "Search Vortex IQ customer stories." },
  { name: "get_case_study", readOnlyHint: true, description: "Get a single case study by slug." },
] as const;

export type ToolName = (typeof TOOL_SPECS)[number]["name"];

// --- Handlers ---

export function callTool(name: ToolName, args: Record<string, unknown>): ToolResult {
  switch (name) {
    case "search_connectors": {
      const q = String(args.query ?? "").toLowerCase();
      const cat = String(args.category ?? "").toLowerCase();
      let r = SAMPLE_CONNECTORS;
      if (cat) r = r.filter((c) => c.category.toLowerCase() === cat);
      if (q) r = r.filter((c) => c.name.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q));
      return json({ matched: r.length, results: r });
    }
    case "list_connector_categories":
      return json({ categories: SAMPLE_CATEGORIES });
    case "search_blog_posts": {
      const q = String(args.query ?? "").toLowerCase();
      return json(SAMPLE_POSTS.filter((p) => !q || p.title.toLowerCase().includes(q)));
    }
    case "get_blog_post":
      return json(SAMPLE_POSTS.find((p) => p.slug === args.slug) ?? { error: "not found" });
    case "calculate_roi": {
      const revenue = Number(args.revenue ?? 0);
      const estimate = Math.round(revenue * 0.08);
      return json({ currency: args.cur ?? "GBP", estimatedAnnualUplift: estimate, note: "Illustrative sample formula." });
    }
    case "submit_brochure_request":
      return json({ ok: true, message: `Brochure queued for ${args.email ?? "unknown"}.` });
    case "list_comparisons":
      return json(SAMPLE_COMPARISONS);
    case "get_comparison":
      return json(SAMPLE_COMPARISONS.find((c) => c.slug === args.slug) ?? { error: "not found" });
    case "list_trust_policies":
      return json(SAMPLE_POLICIES);
    case "get_trust_policy":
      return json(SAMPLE_POLICIES.find((p) => p.slug === args.slug) ?? { error: "not found" });
    case "get_pricing_plans":
      return json(SAMPLE_PLANS);
    case "compare_plans": {
      const a = SAMPLE_PLANS.find((p) => p.id === args.planA);
      const b = SAMPLE_PLANS.find((p) => p.id === args.planB);
      return json({ planA: a, planB: b });
    }
    case "set_billing_period":
      return json({ ok: true, period: args.period ?? "monthly" });
    case "search_case_studies": {
      const q = String(args.query ?? "").toLowerCase();
      return json(SAMPLE_CASE_STUDIES.filter((c) => !q || c.title.toLowerCase().includes(q)));
    }
    case "get_case_study":
      return json(SAMPLE_CASE_STUDIES.find((c) => c.slug === args.slug) ?? { error: "not found" });
    default:
      return json({ error: `Unknown tool: ${name}` });
  }
}
