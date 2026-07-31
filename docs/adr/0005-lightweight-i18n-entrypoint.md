# ADR 0005: Lightweight i18n entrypoint

- Status: accepted
- Scope: leaf UI copy, translation-provider bridging, and bundle isolation

## Context

`KrnButton` needs localized loading copy and `KrnCopyButton` needs localized copy-state labels
without retaining Kern's complete translation registry. Putting a small token in the physical
`core` entrypoint did not create a bundle boundary: ng-packagr emits Core as one FESM, and the
Button-only consumer retained roughly 42 KB of additional raw JavaScript. Moving UI copy into CDK
would invert CDK's infrastructure responsibility.

Taiga UI independently packages i18n and uses narrow semantic tokens. Kern adopts that physical
boundary while retaining localized loading announcements and valid boolean ARIA state.

## Decision

Kern publishes `@kern-ui/angular/i18n` as a dependency-light runtime entrypoint. Its stable
contracts include:

- `KRN_DEFAULT_LOADING_LABEL`;
- `KRN_LOADING_LABEL`;
- `KRN_DEFAULT_COPY_LABELS`;
- `KRN_COPY_LABELS`;
- `KrnCopyLabels`.

The entrypoint depends only on Angular Core. Core owns the complete `KRN_TRANSLATIONS` registry and
exports `provideKrnTranslationBridge()`, an aggregate provider set whose lazy factories derive
leaf tokens from the final registry in the same injector. New mappings can join that set without
changing its public shape. `provideKrn()` installs this bridge automatically.

A low-level injector boundary that provides `KRN_TRANSLATIONS` directly must also install
`provideKrnTranslationBridge()`. A direct leaf-token provider is valid for a narrow override.
Component-scoped options and component inputs remain closer overrides.

## Consequences

- Leaf components do not import Core merely to obtain common UI copy.
- The full dictionary retains one owner and one immutable merging contract.
- A new leaf-copy token requires an English fallback, bridge mapping, locale evidence, API and
  lifecycle registration, and a packed bundle regression.
- Root/direct identity and dependency direction remain enforced by the runtime-entrypoint matrix.
- Isolated Button and Copy Button consumers must remain within their budgets; CI also builds
  direct `i18n` overrides and rejects full-registry markers.
