# Manual accessibility evidence

Kern's automated axe, semantics, keyboard, reflow, forced-color, and reduced-motion checks remain
release evidence. They do not emulate a person using a branded browser and assistive technology.

`manual-evidence.json` is the machine-readable execution matrix. All initial records are
intentionally `pending`, the six required desktop records are release-blocking, and the top-level certification state is
`not-certified`. Therefore this directory does **not** claim AT certification, WCAG conformance,
or a VPAT/ACR. Structural verification remains usable during local development, while release and
stable-promotion modes reject pending, failed, blocked, or stale required evidence.

## Recording a run

Change a record to `pass` or `fail` only after a real run. Record:

- exact operating-system, browser, assistive-technology, and input versions;
- an ISO timestamp;
- the tester and a separate reviewer;
- durable evidence links such as an issue, test protocol, screenshots, or recording;
- notes covering deviations and linked defects.

The verifier rejects a completed record with missing versions, identities, or evidence. It also
rejects a `pending` record that contains fields which could imply execution.

Run:

```bash
node tools/verify-kern-accessibility-evidence.mjs
```

Release candidates use the strict mode:

```bash
node tools/verify-kern-accessibility-evidence.mjs --mode=release
```

Before promoting beta components, run the scoped gate (comma-separated IDs are supported):

```bash
node tools/verify-kern-accessibility-evidence.mjs --mode=promotion --components=select,dialog
```

Strict modes use the declared maximum ages and never infer manual results from Playwright. They
also require a separately recorded certification attestation. Local mode validates the honest
ledger structure without treating expected pre-execution `pending` states as a development error.
