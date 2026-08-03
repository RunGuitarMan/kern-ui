# @kern-ui/mcp

Optional AI tooling for `@kern-ui/angular`. The package contains Kern's generated component
contracts, typed examples, recipes, and a read-only Model Context Protocol server without adding
those assets or the MCP-only Angular compiler dependency to every Angular application.

```bash
npm install --save-dev @kern-ui/mcp
npx --no-install kern-mcp
```

The server uses its bundled immutable manifest by default. Pass
`--manifest /absolute/path/component-manifest.json` to validate against an external contract.
