# KERN agent DX consumer fixture

This fixture is copied into a temporary workspace by `tools/verify-kern-agent-dx.mjs`.
The verifier installs only the packed `dist/kern` npm artifact, copies the packaged agent examples,
and AOT-compiles every standalone source with strict Angular template checking.

The fixture intentionally has no source-path mappings back to the repository.
