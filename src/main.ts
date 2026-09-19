import "./style.css";
import { callTool, TOOL_SPECS, type ToolName, type ToolResult } from "./tools.example";
import { registerMcpBridge, registerWebMcpTools } from "./register.example";

const element = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const data = (result: ToolResult) => JSON.parse(result.content[0].text).data;
const examples: Partial<Record<ToolName, unknown>> = {
  search_connectors: { query: "Klaviyo" },
  get_blog_post: { slug: "webmcp-example" },
  get_case_study: { slug: "example-brand" },
  get_comparison: { slug: "example-comparison" },
  get_trust_policy: { slug: "demo-data" },
  calculate_roi: { cur: "USD", plan: "Growth", products: 100, reportHours: 5, tickets: 8, hourlyRate: 50 },
  submit_brochure_request: { name: "Demo Visitor", email: "demo@example.com", company: "Example" },
  get_pricing_plans: { cur: "USD", billing: "annual" },
  compare_plans: { planA: "Foundation", planB: "Growth" },
  set_billing_period: { period: "monthly" },
  search_site_content: { query: "pricing" },
  get_site_section: { destinationId: "site.trust" },
  search_use_cases: { platform: "bigcommerce" },
  resolve_navigation_target: { destinationId: "site.integrations", query: { q: "Klaviyo" } },
};
const toolSelect = element<HTMLSelectElement>("tool");
for (const spec of TOOL_SPECS) toolSelect.add(new Option(spec.name, spec.name));
function selectTool() {
  const name = toolSelect.value as ToolName;
  element("tool-description").textContent = TOOL_SPECS.find(spec => spec.name === name)!.description;
  element<HTMLTextAreaElement>("arguments").value = JSON.stringify(examples[name] ?? {}, null, 2);
}
toolSelect.addEventListener("change", selectTool);
selectTool();
element("run").addEventListener("click", async () => {
  const link = element<HTMLAnchorElement>("result-link");
  link.hidden = true;
  try {
    const result = await callTool(toolSelect.value, JSON.parse(element<HTMLTextAreaElement>("arguments").value));
    element("result").textContent = result.content[0].text;
    const destination = data(result);
    // Only resolver output becomes a clickable link, never arbitrary input or content.
    if (toolSelect.value === "resolve_navigation_target" && !result.isError) {
      link.href = destination.url;
      link.textContent = `Open ${destination.label}`;
      link.hidden = false;
    }
  } catch (error) { element("result").textContent = error instanceof Error ? error.message : "Invalid request"; }
});

async function renderPlans(period: "annual" | "monthly") {
  const list = element("plan-list");
  list.replaceChildren();
  for (const plan of data(await callTool("get_pricing_plans", { cur: "USD", billing: period }))) {
    const row = document.createElement("li");
    row.textContent = `${plan.name} · $${plan.chargedAmount.toLocaleString("en-US")} / ${period === "annual" ? "year" : "month"}`;
    list.append(row);
  }
  element<HTMLSelectElement>("billing").value = period;
}
element("billing").addEventListener("change", event => void renderPlans((event.target as HTMLSelectElement).value as "annual" | "monthly"));
document.addEventListener("webmcp:billing", event => void renderPlans((event as CustomEvent<"annual" | "monthly">).detail));
void renderPlans("annual");

async function renderFilters() {
  const params = new URLSearchParams(location.search);
  const connectorArgs = Object.fromEntries([...(params.has("q") ? [["query", params.get("q")!]] : []), ...(params.has("category") ? [["category", params.get("category")!]] : [])]);
  const connectorResult = await callTool("search_connectors", connectorArgs);
  const connectorData = data(connectorResult);
  element("connector-status").textContent = connectorResult.isError ? connectorData.error : `${connectorData.matched} sample connectors`;
  element("connector-list").replaceChildren();
  for (const connector of connectorData.results ?? []) {
    const row = document.createElement("li");
    row.textContent = `${connector.name} · ${connector.category}`;
    element("connector-list").append(row);
  }
  const workflowArgs = Object.fromEntries(["q", "platform", "role", "outcome", "workType", "task"].filter(key => params.has(key)).map(key => [key, params.get(key)!]));
  const workflowResult = await callTool("search_use_cases", workflowArgs);
  const workflowData = data(workflowResult);
  element("workflow-status").textContent = workflowResult.isError ? workflowData.error : `${workflowData.length} sample workflows`;
  for (const id of ["payment-failures", "content-review"]) element(id).hidden = workflowResult.isError || !workflowData.some((item: { id: string }) => item.id === id);
}
void renderFilters();
element("request-form").addEventListener("submit", event => {
  event.preventDefault();
  element("form-status").textContent = "Demo only. No request was sent and no email will be delivered.";
});

let disposeNative = () => {};
let disposeBridge: (() => Promise<void>) | undefined;
let disposed = false;
try {
  disposeNative = registerWebMcpTools();
  element("registration-status").textContent = `${TOOL_SPECS.length} browser tools registered.`;
  void registerMcpBridge().then(async dispose => {
    if (disposed) await dispose();
    else disposeBridge = dispose;
  }).catch(() => { element("registration-status").textContent = "Browser tools ready; optional MCP bridge unavailable."; });
} catch { element("registration-status").textContent = "Browser registration unavailable. The playground still works."; }
function dispose() { disposed = true; disposeNative(); void disposeBridge?.(); }
window.addEventListener("pagehide", dispose, { once: true });
if (import.meta.hot) import.meta.hot.dispose(dispose);
