# Deprecations

This page is the human-readable companion to
`projects/kern/api/deprecations.json`. The registry is authoritative and CI compares it with every
`@deprecated` declaration in the committed public API baselines. A deprecation without a
replacement, migration, documentation link, and removal version fails the lifecycle gate.

The `0.1.0` line is not yet published. Maintainers should prefer removing accidental compatibility
APIs before the first release. If the entries below ship, their registered `0.2.0` removal window
becomes part of the consumer contract and must be reflected in release notes.

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
