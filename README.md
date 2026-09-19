# Vortex IQ WebMCP example

A runnable reference for the public website tools used by [Vortex IQ](https://www.vortexiq.ai): shared input contracts, validated tool calls, discoverable content and links to exact sections.

**This repository uses illustrative fixtures.** Prices, customer stories, comparisons, workflows and the simplified ROI calculation are not production data or offers. Every result includes `sample: true`. There is no merchant authentication, store operation or email delivery service.

## Run locally

Use Node.js 22.12 or newer.

```sh
npm ci
npm run dev
```

Open the URL printed by Vite (usually `http://127.0.0.1:5173`). Choose a tool, edit its JSON arguments and run it. No model API key or browser extension is required for the playground.

```sh
npm test
npm run build
npm run preview
```

Tests use a real MCP SDK client and in-memory transport to verify discovery, schema parity, argument preservation, invalid inputs, navigation restrictions and form behavior. GitHub Actions runs tests and a production build on pushes and pull requests.

## 19 public tools

| Group | Tools |
| --- | --- |
| Connectors | `search_connectors`, `list_connector_categories` |
| Content | `search_blog_posts`, `get_blog_post`, `search_case_studies`, `get_case_study` |
| Evaluation | `list_comparisons`, `get_comparison`, `get_pricing_plans`, `compare_plans`, `calculate_roi` |
| Trust | `list_trust_policies`, `get_trust_policy` |
| Navigation | `search_site_content`, `get_site_section`, `search_use_cases`, `resolve_navigation_target` |
| Local UI | `set_billing_period`, `submit_brochure_request` |

`submit_brochure_request` retains the public tool name, but prepares a form for review and returns `requires_user_action` with `submitted: false`. It never sends an email. `set_billing_period` changes the display only, not a subscription.

## How it works

- [src/tools.example.ts](src/tools.example.ts) defines handlers and strict Zod schemas. These schemas generate native JSON Schema, register the MCP bridge and validate direct calls. Arguments are not replaced by empty schemas or silently discarded.
- [src/register.example.ts](src/register.example.ts) registers tools through the [MCP-B polyfill](https://github.com/MiguelsPizza/WebMCP) and optionally exposes the same handlers through an MCP tab transport. The bridge accepts only the current page origin. Native registrations use an AbortSignal; bridge connections close on cleanup.
- [src/main.ts](src/main.ts) provides the playground, pricing display and filtered directory/workflows independently of an LLM provider.

WebMCP is an evolving browser API. Native support and extension interoperability depend on the client version and require separate testing. The tab bridge is not an HTTP MCP endpoint or a replacement for server authorization.

### Navigation example

Discover IDs with `search_site_content`, then call `resolve_navigation_target`:

```json
{
  "destinationId": "site.integrations",
  "query": { "q": "Klaviyo" }
}
```

The result points to `/?q=Klaviyo#connectors`; the demo honours this filter. Only registered destinations and permitted filters are accepted. Returned links have `completesMerchantAction: false`. Opening a link does not connect an account.

## Adapting the pattern

Replace fixtures with maintained public content and real pricing. Keep handlers, schemas and page filters aligned. Give destinations stable IDs and existing anchors. Treat retrieved content as untrusted evidence and keep discovery metadata separate from detailed claims.

Keep authenticated merchant tools behind server authorization. Do not embed credentials in public tools or URLs, or treat annotations as access control. A future Ask Viq/Jev integration can use these contracts; this example does not call Jev or provide a chat widget.

The live website uses its own content, pricing model and destination registry. Sample filter values and destination IDs are not a drop-in production catalogue. For the separate authenticated Vortex IQ MCP connector, see the [connector documentation](https://docs.vortexiq.ai/integrations/claude-mcp/overview).

## License

[Vortex IQ Sustainable Use License 1.0](LICENSE.md). A fair-code license, not an OSI open-source license. See the license for permitted uses and restrictions.
