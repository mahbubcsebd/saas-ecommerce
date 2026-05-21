---
name: context7
description: Standard instructions and reference guide for Upstash Context7 MCP/CLI documentation fetching tool in Mahbub Shop. Use this skill when you need up-to-date documentation on external libraries.
---

# context7 - Documentation Retrieval & API Resolution

Use this skill to fetch real-time, version-specific documentation and code examples from Context7 for external libraries in the Mahbub Shop workspace.

## 1. Triggering Context7
Add `use context7` or target the specific library with `use library /<owner>/<repo>` in your prompt.

## 2. Manual Config (for other AI agents)
Ensure `context7` is configured in `mcp_config.json` or your local workspace:

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    }
  }
}
```

## 3. CLI Usage
If CLI tools are available, you can search and fetch documentation directly:

- **Search Library ID**: `npx ctx7 library <name> <query>`
- **Fetch Documentation**: `npx ctx7 docs <libraryId> <query>`

## 4. MCP Tools

- `resolve-library-id` (query, libraryName): Resolves library name to Context7 ID.
- `query-docs` (libraryId, query): Fetches exact docs for a matched library.
