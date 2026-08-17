# KERN agent metadata

This directory owns the source and generated machine-readable contract used by documentation,
AI agents, code generators, and the read-only KERN MCP server.

- `schema/` contains the versioned JSON Schema.
- `curated/` contains reviewed guidance that cannot be derived safely from TypeScript.
- `recipes/` contains complete standalone enterprise sources; no recipe logic lives only in prose.
- `generated/` is produced by `node scripts/generate-agent-contract.mjs --write`.

The generator uses the TypeScript compiler for public exports, aliases, inherited signal APIs,
generic value types, and source documentation. It keeps the existing Showcase contract untouched
for backward compatibility. All 132 component examples and 13 recipe sources are packed and
strict-AOT compiled in an isolated consumer. Generated files are also mirrored into
`projects/kern/agent` so the npm package and repository expose the same versioned information.

Run without `--write` to detect drift:

```bash
node scripts/generate-agent-contract.mjs
```
