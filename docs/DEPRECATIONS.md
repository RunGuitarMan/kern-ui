# Deprecations

This page is the human-readable companion to
`projects/kern/api/deprecations.json`. The registry is authoritative: CI compares member entries
with every `@deprecated` declaration in the committed public API baselines and resolves active
selector entries to their compiler-derived public component or directive. A deprecation without a
replacement, migration, documentation link, and removal version fails the lifecycle gate.

The `0.1.0` line is not yet published. Maintainers should prefer removing accidental compatibility
APIs before the first release. If the entries below ship, their registered `0.2.0` removal window
becomes part of the consumer contract and must be reflected in release notes.

<a id="krn-button-group-element-selector"></a>

## `KrnButtonGroup` element selector

- Introduced: `0.1.0`
- Planned removal: `0.2.0`
- Deprecated selector: `<krn-button-group>`
- Replacement: `<div krnButtonGroup>`

Replace the opening and closing custom-element tags with the canonical directive host. Keep every
child action, its native attributes, and its event handlers on the child itself:

```html
<!-- Before -->
<krn-button-group aria-label="Review actions">
  <button krnButton type="button">Approve</button>
</krn-button-group>

<!-- After -->
<div krnButtonGroup aria-label="Review actions">
  <button krnButton type="button">Approve</button>
</div>
```

<a id="krn-button-group-aria-label"></a>

## `KrnButtonGroup.ariaLabel`

- Introduced: `0.1.0`
- Planned removal: `0.2.0`
- Replacement: native `aria-label` or `aria-labelledby` on `<div krnButtonGroup>`

Replace the legacy custom element and compatibility input:

```html
<krn-button-group [ariaLabel]="reviewActionsLabel">
  <button krnButton>Request changes</button>
  <button krnButton>Approve</button>
</krn-button-group>
```

with the canonical directive host and native action semantics:

```html
<div krnButtonGroup [attr.aria-label]="reviewActionsLabel">
  <button krnButton type="button">Request changes</button>
  <button krnButton type="button">Approve</button>
</div>
```

`orientation` and `connected` affect layout only. Every child action retains its own accessible
name, disabled/loading state, form behavior, activation, and native Tab stop. Use Toggle Group or
Segmented Control when the composition must own selection or Arrow-key navigation.

<a id="krn-toggle-group-element-selector"></a>

## `KrnToggleGroup` element selector

- Introduced: `0.1.0`
- Planned removal: `0.2.0`
- Deprecated selector: `<krn-toggle-group>`
- Replacement: `<div krnToggleGroup>`

Replace the custom-element tags with the canonical labelled toolbar host. Keep direct native
Toggle Button children and their stable values:

```html
<!-- Before -->
<krn-toggle-group ariaLabel="Formatting">
  <button krnToggleButton value="bold">Bold</button>
</krn-toggle-group>

<!-- After -->
<div krnToggleGroup aria-label="Formatting">
  <button krnToggleButton value="bold">Bold</button>
</div>
```

<a id="krn-toggle-group-aria-label"></a>

## `KrnToggleGroup.ariaLabel`

- Introduced: `0.1.0`
- Planned removal: `0.2.0`
- Replacement: native `aria-label` or `aria-labelledby` on `<div krnToggleGroup>`

Replace static `ariaLabel` with `aria-label`, or bind a dynamic accessible name through
`[attr.aria-label]`. The canonical host exposes `role="toolbar"` and `aria-orientation`; Arrow,
Home, and End move its one roving focus target without changing pressed values.

During an incremental migration, keep `ariaLabel` stable for the complete server render. If both
legacy and native naming are temporarily present, switch or clear the deprecated input only after
client hydration; the compatibility bridge then restores the latest consumer-owned native name.

```html
<div krnToggleGroup [attr.aria-label]="formattingLabel" [(values)]="formats">
  <button krnToggleButton value="bold">Bold</button>
  <button krnToggleButton value="italic">Italic</button>
</div>
```

<a id="krn-data-grid-pagination"></a>

## `KrnDataGrid.pagination`

- Introduced: `0.1.0`
- Planned removal: `0.2.0`
- Replacement: `mode="{ kind: 'client', pagination: true }"`

Replace:

```html
<krn-data-grid [pagination]="true" />
```

with:

```html
<krn-data-grid [mode]="{ kind: 'client', pagination: true }" />
```

<a id="krn-data-grid-virtualize"></a>

## `KrnDataGrid.virtualize`

- Introduced: `0.1.0`
- Planned removal: `0.2.0`
- Replacement: `mode="{ kind: 'virtual' }"`

Replace:

```html
<krn-data-grid [virtualize]="true" />
```

with:

```html
<krn-data-grid [mode]="{ kind: 'virtual' }" />
```

<a id="krn-menu-has-projected-trigger"></a>

## `KrnMenu.hasProjectedTrigger`

- Introduced: `0.1.0`
- Planned removal: `0.2.0`
- Replacement: the `KrnMenuTrigger` directive on the projected trigger

Replace the boolean compatibility input with an explicit trigger directive:

```html
<span krnMenuTrigger>Actions</span>
```

`KrnMenu` owns the actual button semantics; the directive marks non-interactive projected label
content. Consumers should not also set `hasProjectedTrigger` or project another button or link
inside the menu trigger.
