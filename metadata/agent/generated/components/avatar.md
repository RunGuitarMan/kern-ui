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
| `size`        | input | `"sm" \| "md" \| "lg"`                      | no       | `'md'`               | Named semantic size resolved through KERN density and sizing tokens.           |
| `status`      | input | `"online" \| "away" \| "busy" \| undefined` | no       | `undefined`          | Current domain status rendered as visible text and a non-color-only treatment. |
| `imageFailed` | model | `boolean`                                   | no       | `false`              | Controlled image failed state with a matching Angular model-change output.     |

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
