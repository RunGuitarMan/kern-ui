# Link

- ID: `link`
- Selector: `a[krnLink]`
- Import: `import { KrnLink } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnLink`
- Lifecycle: **stable**
- Category: Actions

Link. Enhances one native navigation anchor with KERN inline presentation while the browser or Angular Router owns its destination, relationships, focus, and activation.

## Use

Use <a krnLink> for navigation and keep href or RouterLink plus all native anchor semantics on that host.

Avoid: Do not simulate disabled navigation or use Link for an action in the current context; omit unavailable navigation or use a native Button.

## Compile-verified standalone Angular example

```ts
/**
 * External audit documentation link
 *
 * Render a semantic link with safe external navigation metadata.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnLink } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-link-agent-example',
  standalone: true,
  imports: [KrnLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a krnLink href="https://example.com/audit-policy" target="_blank" rel="noopener noreferrer">
      Audit policy
    </a>
  `,
})
export class KernLinkAgentExample {}

void bootstrapApplication(KernLinkAgentExample);
```

## API

_No signal inputs, models, or outputs._

## Deprecated selectors

_No deprecated selectors._

## Content slots

_No projected content slots._

## Angular Forms

Not an Angular Forms value accessor.

## Accessibility

- Tab follows native document order when the anchor has href or RouterLink
- Enter follows the native anchor destination
- An anchor without a destination remains a non-navigation placeholder and is not made artificially disabled
- href or RouterLink, target, rel, referrerpolicy, download, accessible naming, descriptions, focus, and click stay on the native anchor.
- Visible anchor text normally supplies the accessible name; native aria-label or aria-labelledby remains available when context requires it.
- KrnLink does not rewrite relationship tokens or referrer policy; external privacy requirements stay explicit at the call site.

Manual assistive-technology validation remains required in the consuming application.

## SSR and hydration

- KERN avoids ambient browser globals in reusable runtime infrastructure.
- Validate the consuming SSR/hydration route, locale, ids and overlay host.

Hydration evidence scope: `library-docs-route-smoke`; status:
`consumer-validation-required`.

## Acceptance states

- default
- overflow
- long text
- dark
- high contrast
- compact
- RTL
- mobile
- hover
- focus-visible
- active

## Interactive playground

Route: `preview/link`

Scenarios: `default`.
Public API coverage: 0/0
directly controlled; 0 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument              | Control | Default | Test value | Binding      | Description                                                                                  |
| --------------------- | ------- | ------- | ---------- | ------------ | -------------------------------------------------------------------------------------------- |
| `externalDestination` | boolean | `false` | `true`     | fixture data | Switches the fixture from internal navigation to an explicit privacy-hardened external link. |

Exact API exclusions:

_No excluded public API members._

Presets:

- `default` — Default; scenario `default`.
- `overflow` — overflow; scenario `default`; fixture effect `layout/overflow` — overflow: The fixture deliberately exceeds its normal inline size to expose overflow behavior..
- `long-text` — long text; scenario `default`; fixture effect `content/long-text` — long text: Northstar enterprise workspace policy configuration with deliberately extended content for wrapping and truncation verification..
- `dark` — Dark; scenario `default`; theme `dark`.
- `high-contrast` — High contrast; scenario `default`; theme `high-contrast`.
- `compact` — Compact; scenario `default`; density `compact`.
- `rtl` — RTL; scenario `default`; direction `rtl`.
- `mobile` — Mobile; scenario `default`; viewport `phone`.
- `hover` — Hover; scenario `default`; visual state `hover`.
- `focus-visible` — Focus visible; scenario `default`; visual state `focus-visible`.
- `active` — Active; scenario `default`; visual state `active`.

## Related

- `button`
- `breadcrumbs`
- `back-button`
- `skip-link`
- `icon-button`
- `button-group`
- `split-button`

## Common mistakes

- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- Use a[krnLink] for navigation and keep href or RouterLink, target, rel, download, referrerpolicy, ARIA relationships, and click on that native anchor.
- Do not simulate a disabled link. Omit the unavailable navigation control or render non-interactive text; use a native button component for an action in the current context.
- For a privacy-hardened new browsing context, set target="_blank" and explicit rel="noopener noreferrer"; KrnLink never rewrites consumer-owned relationship or referrer policy.
- Named browsing contexts are valid native targets; do not narrow target to the former KrnLinkTarget alias.

## Ship checklist

- [ ] Import the symbol from its documented owner entrypoint; do not use a deep source import.
- [ ] Load @kern-ui/angular/styles/kern.css exactly once in the application's global styles.
- [ ] Provide every required input and keep collection identities stable across updates.
- [ ] Verify keyboard, focus, visible labels, invalid state, long text, RTL and 200% zoom.
- [ ] Test the consuming SSR/hydration route when server rendering is enabled.
- [ ] Use @kern-ui/angular/testing harnesses when a component-specific harness is available.
