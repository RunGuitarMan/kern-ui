# Cluster

- ID: `cluster`
- Selector: `krn-cluster`
- Import: `import { KrnCluster } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnCluster`
- Lifecycle: **stable**
- Category: Layout

Cluster. A composable spatial primitive that keeps product layouts predictable across containers.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Wrapping metadata cluster
 *
 * Wrap independent metadata items without manual margins.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnCluster } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-cluster-agent-example',
  standalone: true,
  imports: [KrnCluster],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-cluster gap="2">
      <span>Owner: Platform</span>
      <span>Region: EU</span>
      <span>Status: Healthy</span>
    </krn-cluster>
  `,
})
export class KernClusterAgentExample {}

void bootstrapApplication(KernClusterAgentExample);
```

## API

| Name        | Kind  | Type                     | Required | Default    | Description                                                     |
| ----------- | ----- | ------------------------ | -------- | ---------- | --------------------------------------------------------------- |
| `gap`       | input | `KrnLayoutSpace`         | no       | `'2'`      | Logical spacing inserted between adjacent layout children.      |
| `rowGap`    | input | `KrnLayoutSpace \| null` | no       | `null`     | Logical spacing inserted between grid rows.                     |
| `columnGap` | input | `KrnLayoutSpace \| null` | no       | `null`     | Logical spacing inserted between grid columns.                  |
| `align`     | input | `KrnLayoutAlignment`     | no       | `'center'` | Logical cross-axis alignment applied to children by the layout. |
| `justify`   | input | `KrnLayoutJustification` | no       | `'start'`  | Logical main-axis distribution applied to layout children.      |

## Content slots

- `*` — Projects default component content.

## Angular Forms

Not an Angular Forms value accessor.

## Accessibility

- No custom keyboard behavior unless the composition is interactive
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

- `app-shell`
- `header`
- `sidebar`
- `navigation-rail`

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
