# KERN read-only MCP server

The server exposes the generated KERN component contract without executing consumer code or
changing files. It uses the TypeScript parser already required by the KERN workspace.

```bash
node tools/kern-mcp/server.mjs
```

The published Angular package also exposes the same server as the `kern-mcp` executable. Run it
from an Angular workspace with `npx --no-install kern-mcp`; its default manifest is the immutable
contract packed beside the executable. `@angular/compiler` and `typescript` are optional peers
because they are already present in normal Angular development workspaces.

The repository executable reads `metadata/agent/generated/component-manifest.json`. A packed or
external manifest can be selected explicitly:

```bash
node tools/kern-mcp/server.mjs --manifest /absolute/path/component-manifest.json
```

Available tools:

- `get_overview`
- `search_components`
- `get_component_contract`
- `get_example`
- `get_recipe`
- `get_migration`
- `validate_usage`

`validate_usage` performs deterministic contract checks only. It parses named and type-only
imports with the TypeScript AST, preserving both exported and local alias names; it never runs or
evaluates supplied Angular code. Pass `stylesConfigured: true` only after confirming the required
global stylesheet, pass `false` when it is absent, or omit the field to receive a non-blocking
`KRN_USAGE_STYLES_UNVERIFIED` result with explicit follow-up verification.

`search_components` accepts task-oriented natural language. It ignores conversational stop words,
expands a bounded synonym vocabulary, applies curated component intent aliases, and ranks partial
OR matches by concept coverage so one unknown term does not hide a relevant component.
