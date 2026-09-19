/**
 * Runnable public-tool example. All records and prices below are demo fixtures.
 * Copyright (c) 2026 Vortex IQ. Vortex IQ Sustainable Use License 1.0.
 */
import { z } from "zod";

export interface ToolResult {
  content: { type: "text"; text: string }[];
  isError?: boolean;
  [key: string]: unknown;
}
const json = (data: unknown): ToolResult => ({ content: [{ type: "text", text: JSON.stringify({ sample: true, data }, null, 2) }] });
const failure = (message: string): ToolResult => ({ ...json({ error: message }), isError: true });
const connectors = [
  { name: "Shopify", category: "Commerce", description: "Storefront, orders and products" },
  { name: "BigCommerce", category: "Commerce", description: "Catalogue, carts and checkout" },
  { name: "Adobe Commerce", category: "Commerce", description: "Magento catalogue and orders" },
  { name: "Stripe", category: "Payments", description: "Payments and settlement" },
  { name: "Klaviyo", category: "Marketing", description: "Email and SMS flows" },
  { name: "GA4", category: "Analytics", description: "Traffic and conversion" },
];
const plans = [
  { name: "Foundation", monthly: 100, annual: 1000, features: ["Example reporting"] },
  { name: "Growth", monthly: 200, annual: 2000, features: ["Example reporting", "Example content preparation"] },
  { name: "Enterprise", monthly: 300, annual: 3000, features: ["Example portfolio reporting"] },
  { name: "OmniChannel", monthly: 400, annual: 4000, features: ["Example cross-channel reporting"] },
] as const;
const posts = [{ slug: "webmcp-example", title: "A structured tool example", category: "engineering", text: "This demo shows shared schemas, validated arguments and verified navigation." }];
const stories = [{ slug: "example-brand", title: "Illustrative customer story", text: "A fictional example, not evidence of a customer outcome." }];
const comparisons = [{ slug: "example-comparison", title: "Illustrative comparison", text: "Replace this fixture with a maintained, sourced comparison." }];
const policies = [
  { slug: "demo-data", title: "Demo data policy", text: "This demo has no merchant data, authentication or email service." },
  { slug: "demo-control", title: "Demo control policy", text: "Links do not connect stores. Form preparation does not send email." },
];
const workflows = [
  { id: "payment-failures", title: "Payment failure monitoring", platform: "bigcommerce", role: "agency", outcome: "stop-revenue-leaks", workType: "read-and-report", text: "Illustrative workflow: read supported signals and prepare an investigation. No payment or order is changed." },
  { id: "content-review", title: "Product content review", platform: "shopify", role: "ecommerce", outcome: "accelerate-growth", workType: "prepare-for-approval", text: "Illustrative workflow: prepare product content for human review. No store is changed." },
];
export const DESTINATIONS = [
  { id: "site.pricing.plans", label: "Demo plans", path: "/", section: "plans", text: "Illustrative prices only. These are not Vortex IQ list prices." },
  { id: "site.integrations", label: "Demo connector directory", path: "/", section: "connectors", text: "Six sample catalogue records; none indicates a connected merchant account." },
  { id: "site.usecases", label: "Demo workflows", path: "/", section: "workflows", text: "Two illustrative workflows with no merchant execution." },
  { id: "site.trust", label: "Demo boundaries", path: "/", section: "trust", text: "No merchant access, live pricing, model API key, email delivery or store changes." },
  { id: "site.brochure.request", label: "Demo brochure form", path: "/", section: "request", text: "Prepare the sample form. Submitting the demo form sends nothing." },
  ...workflows.map(item => ({ id: `use-case.${item.id}`, label: item.title, path: "/", section: item.id, text: item.text })),
];

const empty = z.strictObject({});
const query = z.string().max(160).regex(/^[^\u0000-\u001f\u007f]*$/);
const slug = z.string().min(1).max(160).regex(/^[a-z0-9-]+$/);
const currency = z.enum(["USD", "GBP"]);
const period = z.enum(["monthly", "annual"]);
const planName = z.enum(["Foundation", "Growth", "Enterprise", "OmniChannel"]);
const positive = z.number().finite().min(0);
const pricingInputs = { cur: currency.optional(), billing: period.optional() };
const workflowFilters = z.strictObject({
  q: query.optional(), platform: z.enum(["shopify", "bigcommerce"]).optional(),
  role: z.enum(["agency", "ecommerce"]).optional(),
  outcome: z.enum(["stop-revenue-leaks", "accelerate-growth"]).optional(),
  workType: z.enum(["read-and-report", "prepare-for-approval"]).optional(),
  task: z.enum(["payment-failures", "content-review"]).optional(),
});
const connectorFilters = z.strictObject({ q: query.optional(), category: z.enum(["Commerce", "Payments", "Marketing", "Analytics"]).optional() });
const id = z.string().min(1).max(100).describe("An ID returned by search_site_content or search_use_cases; verified against the registry.");

export function resolveDestination(destinationId: string, rawQuery: unknown = {}) {
  const target = DESTINATIONS.find(item => item.id === destinationId);
  if (!target) throw new Error("Unknown public destination");
  const schema = destinationId === "site.integrations" ? connectorFilters : destinationId === "site.usecases" ? workflowFilters : empty;
  const filters: Record<string, unknown> = schema.parse(rawQuery);
  const params = new URLSearchParams(Object.entries(filters).filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].length > 0));
  return { id: target.id, label: target.label, url: `${target.path}${params.size ? `?${params}` : ""}#${target.section}`, auth: "public", action: "open_link", completesMerchantAction: false };
}

const find = <T extends { slug: string }>(items: readonly T[], key: string) => items.find(item => item.slug === key) ?? (() => { throw new Error("Public record not found"); })();
const matches = (item: unknown, text = "") => JSON.stringify(item).toLowerCase().includes(text.trim().toLowerCase());
function price(name: z.infer<typeof planName>, args: { cur?: "USD" | "GBP"; billing?: "monthly" | "annual" }) {
  const plan = plans.find(item => item.name === name)!;
  const billing = args.billing ?? "annual";
  return { ...plan, currency: args.cur ?? "USD", billing, chargedAmount: billing === "annual" ? plan.annual : plan.monthly, note: "Illustrative demo price, not a Vortex IQ offer." };
}

function defineTool<S extends z.ZodObject>(schema: S, description: string, handler: (args: z.infer<S>) => ToolResult | Promise<ToolResult>, readOnlyHint = true) {
  return {
    schema, description, readOnlyHint,
    async execute(raw: unknown): Promise<ToolResult> {
      const parsed = schema.safeParse(raw ?? {});
      if (!parsed.success) return failure("Invalid arguments: " + parsed.error.issues.map(issue => `${issue.path.join(".")}: ${issue.message}`).join("; "));
      try { return await handler(parsed.data); }
      catch (error) { return failure(error instanceof Error ? error.message : "Tool failed"); }
    },
  };
}

export const TOOLS = {
  search_connectors: defineTool(z.strictObject({ query: query.optional(), category: connectorFilters.shape.category }), "Search sample connectors. Catalogue presence is not a connection.", args => {
    const results = connectors.filter(item => (!args.category || item.category === args.category) && matches(item, args.query));
    return json({ matched: results.length, results });
  }),
  list_connector_categories: defineTool(empty, "List sample connector categories and counts.", () => json([...new Set(connectors.map(item => item.category))].map(category => ({ category, count: connectors.filter(item => item.category === category).length })))),
  search_blog_posts: defineTool(z.strictObject({ query: query.optional(), category: slug.optional() }), "Search sample blog content.", args => json(posts.filter(item => (!args.category || item.category === args.category) && matches(item, args.query)))),
  get_blog_post: defineTool(z.strictObject({ slug }), "Get a sample blog post by slug.", args => json(find(posts, args.slug))),
  calculate_roi: defineTool(z.strictObject({
    cur: currency, plan: planName, billing: period.optional(),
    platform: z.enum(["BigCommerce", "Shopify", "Adobe Commerce", "WooCommerce"]).optional(),
    products: positive, reportHours: positive, tickets: positive, hourlyRate: positive,
    images: positive.optional(), categories: positive.optional(), articles: positive.optional(),
    connectors: positive.optional(), deploys: positive.optional(), otherHours: positive.optional(),
    monthlyRetainer: positive.optional(), deployCost: positive.optional(), failureRate: positive.max(1).optional(), monthlyRevenue: positive.optional(),
  }), "Illustrative workload/cost calculation. Not the production ROI model; no revenue uplift is claimed.", args => {
    const annualHours = args.reportHours * 52 + args.tickets * 12 * 2 + (args.otherHours ?? 0);
    const annualLabourCost = annualHours * args.hourlyRate;
    const selected = price(args.plan, args);
    const annualPlanCost = selected.billing === "annual" ? selected.annual : selected.monthly * 12;
    return json({ currency: args.cur, annualHours, annualLabourCost, annualPlanCost, estimatedNetSaving: annualLabourCost - annualPlanCost, note: "Demo assumes two hours per ticket and 52 reporting weeks. Other inputs are accepted to illustrate the full production contract but are excluded from this simplified formula. No guaranteed saving or revenue uplift." });
  }),
  submit_brochure_request: defineTool(z.strictObject({ name: z.string().trim().min(1).max(160), email: z.email().max(254), company: z.string().trim().min(1).max(160) }), "Prepare a sample form for user review. Never sends email.", args => {
    if (typeof document !== "undefined") {
      for (const [name, value] of Object.entries(args)) {
        const field = document.querySelector<HTMLInputElement>(`#request [name="${name}"]`);
        if (field) field.value = value;
      }
    }
    return json({ status: "requires_user_action", submitted: false, destination: resolveDestination("site.brochure.request"), message: "Review the sample form. No email has been sent; this demo has no delivery service." });
  }, false),
  list_comparisons: defineTool(empty, "List sample comparisons.", () => json(comparisons)),
  get_comparison: defineTool(z.strictObject({ slug }), "Get a sample comparison.", args => json(find(comparisons, args.slug))),
  list_trust_policies: defineTool(empty, "List sample trust policies.", () => json(policies)),
  get_trust_policy: defineTool(z.strictObject({ slug }), "Get a sample trust policy.", args => json(find(policies, args.slug))),
  get_pricing_plans: defineTool(z.strictObject(pricingInputs), "Get illustrative prices from any page. These are not live Vortex IQ prices.", args => json(plans.map(item => price(item.name, args)))),
  compare_plans: defineTool(z.strictObject({ planA: planName, planB: planName, ...pricingInputs }), "Compare two illustrative plans.", args => json({ planA: price(args.planA, args), planB: price(args.planB, args) })),
  set_billing_period: defineTool(z.strictObject({ period }), "Change this demo's pricing display; no subscription is changed.", args => {
    if (typeof document === "undefined" || !document.getElementById("plans")) throw new Error("Open the demo pricing section first");
    document.dispatchEvent(new CustomEvent("webmcp:billing", { detail: args.period }));
    return json({ period: args.period, subscriptionChanged: false });
  }, false),
  search_case_studies: defineTool(z.strictObject({ query: query.optional() }), "Search fictional sample stories.", args => json(stories.filter(item => matches(item, args.query)))),
  get_case_study: defineTool(z.strictObject({ slug }), "Get a fictional sample story.", args => json(find(stories, args.slug))),
  search_site_content: defineTool(z.strictObject({ query: query.min(1), limit: z.number().int().min(1).max(20).optional() }), "Find demo pages and sections, returning verified destination IDs.", args => json(DESTINATIONS.filter(item => matches(item, args.query)).slice(0, args.limit ?? 8).map(item => ({ ...resolveDestination(item.id), summary: item.text, evidence: "discovery_metadata" })))),
  get_site_section: defineTool(z.strictObject({ destinationId: id }), "Get a sample content section with source attribution.", args => {
    const destination = resolveDestination(args.destinationId);
    const content = DESTINATIONS.find(item => item.id === args.destinationId)!;
    return json({ destination, text: content.text, source: "demo_fixture", untrustedContent: true, truncated: false });
  }),
  search_use_cases: defineTool(workflowFilters, "Search sample workflows and their exact links. Does not run them.", args => json(workflows.filter(item =>
    (!args.task || item.id === args.task) && (!args.q || matches(item, args.q)) &&
    (!args.platform || item.platform === args.platform) && (!args.role || item.role === args.role) &&
    (!args.outcome || item.outcome === args.outcome) && (!args.workType || item.workType === args.workType),
  ).map(item => ({ ...item, destination: resolveDestination(`use-case.${item.id}`) })))),
  resolve_navigation_target: defineTool(z.strictObject({ destinationId: id, query: z.record(z.string().max(40), z.string().max(160)).optional() }), "Return a verified demo link and allowed filters. Does not navigate or execute a merchant action.", args => json(resolveDestination(args.destinationId, args.query))),
} as const;

export type ToolName = keyof typeof TOOLS;
export const TOOL_SPECS = (Object.keys(TOOLS) as ToolName[]).map(name => ({
  name, description: TOOLS[name].description, readOnlyHint: TOOLS[name].readOnlyHint,
  inputSchema: z.toJSONSchema(TOOLS[name].schema, { target: "draft-7" }),
}));
export function callTool(name: string, args: unknown = {}): Promise<ToolResult> {
  if (!Object.prototype.hasOwnProperty.call(TOOLS, name)) return Promise.resolve(failure("Unknown tool"));
  return TOOLS[name as ToolName].execute(args);
}
