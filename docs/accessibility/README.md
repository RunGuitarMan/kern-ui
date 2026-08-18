# Manual accessibility evidence

Kern's automated axe, semantics, keyboard, reflow, forced-color, and reduced-motion checks remain
release evidence. They do not emulate a person using a branded browser and assistive technology.

`manual-evidence.json` is the machine-readable execution matrix. All initial records are
intentionally `pending`, the six required desktop records are release-blocking under the strict
certification policy, and the top-level certification state is `not-certified`. Therefore this
directory does **not** claim AT certification, WCAG conformance, or a VPAT/ACR. Structural
verification remains usable during local development. Pre-1.0 release candidates may carry
honest pending evidence, but reject failed, blocked, malformed, or stale completed records. Strict
release and stable-promotion modes reject pending, failed, blocked, or stale required evidence.

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

Pre-1.0 release candidates use the explicitly non-certified mode:

```bash
node tools/verify-kern-accessibility-evidence.mjs --mode=pre-1-release
```

Certified releases use the strict mode:

```bash
node tools/verify-kern-accessibility-evidence.mjs --mode=release
```

Before promoting beta components, run the scoped gate (comma-separated IDs are supported):

```bash
node tools/verify-kern-accessibility-evidence.mjs --mode=promotion --components=select,dialog
```

Strict modes use the declared maximum ages and never infer manual results from Playwright. They
also require a separately recorded certification attestation. Pre-1 release mode never promotes
pending records to passing evidence and remains visibly `not-certified`. Local mode validates the
honest ledger structure without treating expected pre-execution `pending` states as a development
error.
