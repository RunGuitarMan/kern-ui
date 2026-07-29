# Disclosure

- ID: `disclosure`
- Selector: `krn-disclosure`
- Import: `import { KrnDisclosure } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnDisclosure`
- Lifecycle: **stable**
- Category: Data display

Disclosure. A dense, readable data primitive with semantic structure and resilient overflow.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Controlled policy disclosure
 *
 * Keep an expandable policy section synchronized with application state.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnDisclosure } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-disclosure-agent-example',
  standalone: true,
  imports: [KrnDisclosure],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-disclosure heading="Data residency" [(open)]="open">
      Customer data is stored in the EU Central region.
    </krn-disclosure>
  `,
})
export class KernDisclosureAgentExample {
  open = true;
}

void bootstrapApplication(KernDisclosureAgentExample);
```

## API

| Name      | Kind  | Type      | Required | Default    | Description                                                    |
| --------- | ----- | --------- | -------- | ---------- | -------------------------------------------------------------- |
| `heading` | input | `string`  | yes      | `required` | Human-readable copy for the heading state or control.          |
| `open`    | model | `boolean` | no       | `false`    | Controls whether the disclosure or overlay surface is visible. |

## Content slots

- `*` — Projects default component content.

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
- hover
- focus-visible
- active
- disabled

## Related

- `badge`
- `status-badge`
- `chip`
- `tag`

## Common mistakes

- Do not omit required inputs: `heading`.
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
