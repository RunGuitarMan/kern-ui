# Settings Panel

- ID: `settings-panel`
- Selector: `krn-settings-panel`
- Import: `import { KrnSettingsPanel } from '@kern-ui/angular/patterns';`
- Canonical symbol: `KrnSettingsPanel`
- Lifecycle: **recipe**
- Category: Patterns

Settings Panel. A product pattern composed from Kern primitives, intended as a starting point rather than a sealed widget.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Controlled settings panel
 *
 * Own panel visibility and compose persistent action controls.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnSettingsPanel } from '@kern-ui/angular/patterns';

@Component({
  selector: 'app-kern-settings-panel-agent-example',
  standalone: true,
  imports: [KrnSettingsPanel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" (click)="open = true">Open settings</button>
    <krn-settings-panel heading="Report settings" [(open)]="open">
      <p>Choose visible metrics and reporting period.</p>
      <button krnSettingsActions type="button" (click)="open = false">Apply</button>
    </krn-settings-panel>
  `,
})
export class KernSettingsPanelAgentExample {
  open = false;
}

void bootstrapApplication(KernSettingsPanelAgentExample);
```

## API

| Name         | Kind  | Type      | Required | Default                                    | Description                                                    |
| ------------ | ----- | --------- | -------- | ------------------------------------------ | -------------------------------------------------------------- |
| `heading`    | input | `string`  | no       | `this.translations.patterns.settings`      | Human-readable copy for the heading state or control.          |
| `closeLabel` | input | `string`  | no       | `this.translations.patterns.closeSettings` | Human-readable copy for the close state or control.            |
| `open`       | model | `boolean` | no       | `false`                                    | Controls whether the disclosure or overlay surface is visible. |

## Content slots

- `*` — Projects default component content.
- `[krnSettingsActions]` — Projects content matching [krnSettingsActions].

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
- loading
- empty
- error
- success

## Related

- `user-menu`
- `notification-center`
- `global-search`
- `filter-bar`

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
