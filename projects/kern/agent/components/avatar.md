# Avatar

- ID: `avatar`
- Selector: `krn-avatar`
- Import: `import { KrnAvatar } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnAvatar`
- Lifecycle: **stable**
- Category: Data display

Avatar. A dense, readable data primitive with semantic structure and resilient overflow.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

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
import { KrnAvatar } from '@kern-ui/angular/kit';

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

| Name          | Kind  | Type                                        | Required | Default              | Description                                                                    |
| ------------- | ----- | ------------------------------------------- | -------- | -------------------- | ------------------------------------------------------------------------------ |
| `locale`      | input | `string`                                    | no       | `inject(KRN_LOCALE)` | Locale identifier used for collation, formatting, and component-owned copy.    |
| `src`         | input | `string \| undefined`                       | no       | `undefined`          | Required media source URL loaded by the component.                             |
| `alt`         | input | `string`                                    | no       | `''`                 | Text alternative that communicates the meaning of visual media.                |
| `name`        | input | `string`                                    | no       | `''`                 | Required human-readable name for the represented person, item, or action.      |
| `size`        | input | `"lg" \| "md" \| "sm"`                      | no       | `'md'`               | Named semantic size resolved through KERN density and sizing tokens.           |
| `status`      | input | `"away" \| "busy" \| "online" \| undefined` | no       | `undefined`          | Current domain status rendered as visible text and a non-color-only treatment. |
| `imageFailed` | model | `boolean`                                   | no       | `false`              | Controlled image failed state with a matching Angular model-change output.     |

## Deprecated selectors

_No deprecated selectors._

## Content slots

_No projected content slots._

## Angular Forms

Not an Angular Forms value accessor.

## Accessibility

- Arrow keys navigate interactive data
- Enter expands or selects
- Visible focus indicator with forced-colors support.
- Works at 200% text zoom and in narrow containers.
- State is communicated by text, shape, or icon in addition to color.

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

| Argument      | Control | Default        | Test value                 | Binding                   | Description                                |
| ------------- | ------- | -------------- | -------------------------- | ------------------------- | ------------------------------------------ |
| `imageFailed` | boolean | `false`        | `true`                     | model `imageFailed`       | Shows the deterministic initials fallback. |
| `alt`         | text    | `""`           | `"Alternate value"`        | input `alt` (property)    | Configures the component alt contract.     |
| `name`        | text    | `"Avery Cole"` | `"Avery Cole · alternate"` | input `name` (property)   | Configures the component name contract.    |
| `size`        | select  | `"lg"`         | `"md"`                     | input `size` (property)   | Semantic component size.                   |
| `src`         | text    | `""`           | `"/favicon.ico"`           | input `src` (property)    | Configures the component src contract.     |
| `status`      | select  | `"online"`     | `"away"`                   | input `status` (property) | Configures the component status contract.  |

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
