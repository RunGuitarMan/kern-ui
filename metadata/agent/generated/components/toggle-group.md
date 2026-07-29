# Toggle Group

- ID: `toggle-group`
- Selector: `krn-toggle-group`
- Import: `import { KrnToggleGroup } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnToggleGroup`
- Lifecycle: **stable**
- Category: Actions

Toggle Group. A deliberate action primitive with a consistent hierarchy, loading behavior, and keyboard contract.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Multi-select view controls
 *
 * Control a set of pressed view options by stable string values.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnToggleButton, KrnToggleGroup } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-toggle-group-agent-example',
  standalone: true,
  imports: [KrnToggleGroup, KrnToggleButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-toggle-group
      ariaLabel="Visible dashboard layers"
      [multiple]="true"
      [(values)]="visibleLayers"
    >
      <krn-toggle-button value="targets">Targets</krn-toggle-button>
      <krn-toggle-button value="forecast">Forecast</krn-toggle-button>
    </krn-toggle-group>
  `,
})
export class KernToggleGroupAgentExample {
  visibleLayers: readonly string[] = ['targets'];
}

void bootstrapApplication(KernToggleGroupAgentExample);
```

## API

| Name          | Kind  | Type                    | Required | Default        | Description                                                                |
| ------------- | ----- | ----------------------- | -------- | -------------- | -------------------------------------------------------------------------- |
| `ariaLabel`   | input | `string`                | yes      | `required`     | Accessible name used when visible content is not sufficient.               |
| `orientation` | input | `KrnOrientation`        | no       | `'horizontal'` | Defines the logical axis used by layout and keyboard navigation.           |
| `multiple`    | input | `boolean`               | no       | `false`        | Allows more than one value or file to be selected in one interaction.      |
| `disabled`    | input | `boolean`               | no       | `false`        | Prevents user interaction and participates in the disabled-state contract. |
| `values`      | model | `ReadonlyArray<string>` | no       | `[]`           | Controlled values state with a matching Angular model-change output.       |

## Content slots

- `*` — Projects default component content.

## Angular Forms

Not an Angular Forms value accessor.

## Accessibility

- Enter / Space activates
- Tab follows document order
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
- selected
- unselected

## Related

- `button`
- `icon-button`
- `button-group`
- `split-button`

## Common mistakes

- Do not omit required inputs: `ariaLabel`.
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
