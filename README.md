# Vortex IQ WebMCP: agent-ready storefront example

This repository shows how [Vortex IQ](https://www.vortexiq.ai) makes its own website usable by AI agents with **WebMCP**, the browser standard from Google and Microsoft that lets a website expose structured tools an in-browser agent can call directly, instead of scraping the page.

We do not just recommend agent-readiness. It is live on our own site. This repo is the reference pattern behind it.

## What is WebMCP?

WebMCP lets a website register tools through the `document.modelContext` interface, each with a name, a plain-language description, and a JSON Schema for its inputs. A browser-based AI agent can discover those tools and call them directly. It is the in-browser companion to the Model Context Protocol (MCP), the standard AI clients use to reach external tools.

## What is deployed on vortexiq.ai

Fifteen tools are registered on the live site, grouped read-first, with only a couple of safe, clearly scoped actions:

| Group | Tools |
|---|---|
| Discover | `search_connectors`, `list_connector_categories` |
| Content | `search_blog_posts`, `get_blog_post`, `search_case_studies`, `get_case_study` |
| Evaluate | `list_comparisons`, `get_comparison`, `get_pricing_plans`, `compare_plans`, `calculate_roi` |
| Trust | `list_trust_policies`, `get_trust_policy` |
| Act (safe, scoped) | `set_billing_period`, `submit_brochure_request` |

Each tool is backed by real site data. Nothing destructive is exposed, and nothing acts behind the visitor's back. This is the read-first, safe-writes pattern applied to a real store.

## How it is built

Two registration paths, both from this repo's `src/`:

1. **Native spec path** (`register.example.ts`): `document.modelContext.registerTool(...)` via the [`@mcp-b/webmcp-polyfill`](https://github.com/MiguelsPizza/WebMCP) shim, so it works ahead of full native browser support.
2. **MCP bridge path**: the same tools exposed as a standard MCP server over a tab transport, so agents using the [MCP-B browser extension](https://chromewebstore.google.com/) can connect.

`tools.example.ts` shows the tool specs and handlers with representative sample data. On the live site these handlers read from the site's real connector directory, blog, pricing, case studies, and trust policies.

## Try it on the live site

1. Install the **MCP-B extension** for Chrome.
2. Add a **Gemini API key** from Google AI Studio.
3. Open [vortexiq.ai](https://www.vortexiq.ai) and ask the agent things like:
   - "Which payment connectors does Vortex IQ support?"
   - "Compare the two pricing plans and calculate ROI for a store doing 2,000,000 in revenue."
   - "What does the data protection policy say?"

## The other half: authenticated remote MCP

WebMCP handles anonymous, in-browser agents. For authenticated, account-level access, Vortex IQ also ships a **remote MCP server** that connects to Claude with OAuth 2.1. It is live and listed in [Claude's connector directory](https://claude.ai/directory/connectors/vortex-iq). See the [connect guide](https://docs.vortexiq.ai/integrations/claude-mcp/connect-claude).

## Learn more

- Live site: https://www.vortexiq.ai
- Vortex IQ, the AI Operating System for ecommerce: https://www.vortexiq.ai/ai-os-platform
- WebMCP for ecommerce (guide): LINK NEEDED: WebMCP pillar post

## License

Copyright (c) 2026 Vortex IQ. Licensed under the **Vortex IQ Sustainable Use License 1.0** (see [LICENSE.md](LICENSE.md)). This is a fair-code licence, not an open-source one: free to use, self-host, and modify for your own internal or personal use, but you may not resell it or offer it as a hosted service to third parties.
