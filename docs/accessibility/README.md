# Manual accessibility evidence

Kern's automated axe, semantics, keyboard, reflow, forced-color, and reduced-motion checks remain
release evidence. They do not emulate a person using a branded browser and assistive technology.

`manual-evidence.json` is the machine-readable execution matrix. All initial records are
intentionally `pending`, `releaseBlocking` is `false`, and the top-level certification state is
`not-certified`. Therefore this directory does **not** claim AT certification, WCAG conformance,
or a VPAT/ACR.

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

Making manual evidence release-blocking is a separate governance decision. Set
`releaseBlocking: true` only after the required environments, owners, cadence, exception process,
and CI-accessible evidence store exist; any non-passing blocking record then fails verification.
