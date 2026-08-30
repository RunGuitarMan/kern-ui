# Avatar

- ID: `avatar`
- Selector: `krn-avatar`
- Import: `import { KrnAvatar } from '@kern-ui/angular/data-display';`
- Canonical symbol: `KrnAvatar`
- Lifecycle: **stable**
- Category: Data display

Avatar. Represents a person or entity with an image, fallback initials, and optional presence status.

## Use

Use Avatar for this specific contract: Represents a person or entity with an image, fallback initials, and optional presence status.

Avoid: Do not choose Avatar for visual similarity alone; its semantics and interaction model must match the product task.

## Compile-verified standalone Angular example

```ts
/**
 * Named account-owner avatar
 *
 * Provide initials fallback and meaningful alternative text.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnAvatar } from '@kern-ui/angular/data-display';

@Component({
  selector: 'app-kern-avatar-agent-example',
  standalone: true,
  imports: [KrnAvatar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-avatar name="Ada Lovelace" alt="Ada Lovelace, account owner" status="online" />
  `,
})
export class KernAvatarAgentExample {}

void bootstrapApplication(KernAvatarAgentExample);
```

## API

| Name          | Kind  | Type                                        | Required | Default     | Description                                                                 |
| ------------- | ----- | ------------------------------------------- | -------- | ----------- | --------------------------------------------------------------------------- |
| `locale`      | input | `string \| undefined`                       | no       | `undefined` | Locale identifier used for collation, formatting, and component-owned copy. |
| `src`         | input | `string \| undefined`                       | no       | `undefined` | Defines the component's src behavior or presentation.                       |
| `alt`         | input | `string`                                    | no       | `''`        | Defines the component's alt behavior or presentation.                       |
| `name`        | input | `string`                                    | no       | `''`        | Native form-control name forwarded to the owned interactive element.        |
| `size`        | input | `"lg" \| "md" \| "sm"`                      | no       | `'md'`      | Named semantic size resolved through Kern density and sizing tokens.        |
| `status`      | input | `"away" \| "busy" \| "online" \| undefined` | no       | `undefined` | Defines the component's status behavior or presentation.                    |
| `imageFailed` | model | `boolean`                                   | no       | `false`     | Controlled image failed state with a matching Angular model-change output.  |

## Deprecated selectors

_No deprecated selectors._

## Content slots

_No projected content slots._

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

Route: `preview/avatar`

Scenarios: `default`.
Public API coverage: 6/7
directly controlled; 1 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument      | Control | Default        | Test value                 | Binding                   | Description                                                          |
| ------------- | ------- | -------------- | -------------------------- | ------------------------- | -------------------------------------------------------------------- |
| `imageFailed` | boolean | `false`        | `true`                     | model `imageFailed`       | Shows the deterministic initials fallback.                           |
| `alt`         | text    | `""`           | `"Alternate value"`        | input `alt` (property)    | Defines the component's alt behavior or presentation.                |
| `name`        | text    | `"Avery Cole"` | `"Avery Cole · alternate"` | input `name` (property)   | Native form-control name forwarded to the owned interactive element. |
| `size`        | select  | `"lg"`         | `"md"`                     | input `size` (property)   | Named semantic size resolved through Kern density and sizing tokens. |
| `src`         | text    | `""`           | `"/favicon.ico"`           | input `src` (property)    | Defines the component's src behavior or presentation.                |
| `status`      | select  | `"online"`     | `"away"`                   | input `status` (property) | Defines the component's status behavior or presentation.             |

Exact API exclusions:

| Public API | Category           | Evidence                                     | Reason                                                                                                           |
| ---------- | ------------------ | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `locale`   | locale-environment | `locale-preview:preview/avatar?locale=ru-RU` | Locale is owned by the playground environment selector so every locale-sensitive component changes consistently. |

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
