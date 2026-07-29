# KERN agent DX acceptance gate

The agent DX layer publishes one explicit, self-contained standalone Angular source for every
catalog entry. Recipes are closed-world: a catalog addition, removal, stale recipe or generic
fallback fails generation.

## Generate

```sh
node tools/agent-dx/generate-examples.mjs --write
```

Outputs are mirrored to:

- `metadata/agent/examples/`
- `projects/kern/agent/examples/`

## Verify the publishable artifact

```sh
npm run build:kern
node tools/verify-kern-agent-dx.mjs
```

The verifier:

1. checks 1:1 catalog, recipe, index and source coverage;
2. rejects package-root, deep and non-owner imports;
3. runs every source through the KERN MCP `validate_usage` contract;
4. packs `dist/kern` and installs it in an isolated offline consumer;
5. copies examples back out of the installed package;
6. AOT-compiles all sources with strict Angular template checking;
7. reruns high-risk discovery and validation against the packed manifest.

Set `KRN_KEEP_AGENT_DX_FIXTURE=1` to retain the temporary consumer after a run.
