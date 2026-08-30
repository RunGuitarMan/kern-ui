# Avatar Group

- ID: `avatar-group`
- Selector: `krn-avatar-group`
- Import: `import { KrnAvatarGroup } from '@kern-ui/angular/data-display';`
- Canonical symbol: `KrnAvatarGroup`
- Lifecycle: **stable**
- Category: Data display

Avatar Group. Overlaps several avatars and summarizes identities that do not fit the visible limit.

## Use

Use Avatar Group for this specific contract: Overlaps several avatars and summarizes identities that do not fit the visible limit.

Avoid: Do not choose Avatar Group for visual similarity alone; its semantics and interaction model must match the product task.

## Compile-verified standalone Angular example

```ts
/**
 * Account team avatar group
 *
 * Compose named avatars under one accessible group label.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnAvatar, KrnAvatarGroup } from '@kern-ui/angular/data-display';

@Component({
  selector: 'app-kern-avatar-group-agent-example',
  standalone: true,
  imports: [KrnAvatarGroup, KrnAvatar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-avatar-group ariaLabel="Account team">
      <krn-avatar name="Ada Lovelace" alt="Ada Lovelace" />
      <krn-avatar name="Grace Hopper" alt="Grace Hopper" />
      <krn-avatar name="Margaret Hamilton" alt="Margaret Hamilton" />
    </krn-avatar-group>
  `,
})
export class KernAvatarGroupAgentExample {}

void bootstrapApplication(KernAvatarGroupAgentExample);
```

## API

| Name        | Kind  | Type                  | Required | Default      | Description                                                  |
| ----------- | ----- | --------------------- | -------- | ------------ | ------------------------------------------------------------ |
| `ariaLabel` | input | `string \| undefined` | no       | `undefined`  | Accessible name used when visible content is not sufficient. |
| `overlap`   | input | `string`              | no       | `'0.625rem'` | Defines the component's overlap behavior or presentation.    |

## Deprecated selectors

_No deprecated selectors._

## Content slots

- `*` — Projects default component content.

## Angular Forms

Not an Angular Forms value accessor.

## Accessibility

- The component adds no keyboard interaction or tab stop of its own
- Visible labels and semantic structure preserve the meaning and relationships in the data.
- Interactive descendants retain native names and a predictable focus order.

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

## Interactive playground

Route: `preview/avatar-group`

Scenarios: `default`.
Public API coverage: 1/2
directly controlled; 1 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument  | Control | Default      | Test value | Binding                    | Description                               |
| --------- | ------- | ------------ | ---------- | -------------------------- | ----------------------------------------- |
| `overlap` | text    | `"0.625rem"` | `"20rem"`  | input `overlap` (property) | Changes how far adjacent avatars overlap. |

Exact API exclusions:

| Public API  | Category           | Evidence                                                  | Reason                                                                                                                  |
| ----------- | ------------------ | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `ariaLabel` | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#avatar-group` | Low-value duplicate accessibility copy is validated by the a11y fixture and kept stable while visual parameters change. |

Presets:

- `default` — Default; scenario `default`.
- `overflow` — overflow; scenario `default`; fixture effect `layout/overflow` — overflow: The fixture deliberately exceeds its normal inline size to expose overflow behavior..
- `long-text` — long text; scenario `default`; fixture effect `content/long-text` — long text: Northstar enterprise workspace policy configuration with deliberately extended content for wrapping and truncation verification..
- `dark` — Dark; scenario `default`; theme `dark`.
- `high-contrast` — High contrast; scenario `default`; theme `high-contrast`.
- `compact` — Compact; scenario `default`; density `compact`.
- `rtl` — RTL; scenario `default`; direction `rtl`.
- `mobile` — Mobile; scenario `default`; viewport `phone`.

## Related

- `badge`
- `status-badge`
- `chip`
- `tag`

## Common mistakes

- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.

## Ship checklist

- [ ] Import the symbol from its documented owner entrypoint; do not use a deep source import.
- [ ] Load @kern-ui/angular/styles/kern.css exactly once in the application's global styles.
- [ ] Provide every required input and keep collection identities stable across updates.
- [ ] Verify keyboard, focus, visible labels, invalid state, long text, RTL and 200% zoom.
- [ ] Test the consuming SSR/hydration route when server rendering is enabled.
- [ ] Use @kern-ui/angular/testing harnesses when a component-specific harness is available.
