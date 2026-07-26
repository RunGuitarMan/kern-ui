# Kern architecture

## Boundaries

- `kern` is the only publishable runtime package. It has no dependency on documentation code.
- `showcase` is private metadata. Documentation pages and Lab scenarios can evolve without
  expanding the public package.
- `docs` consumes the built public package, uses SSR plus hydration, and lazy-loads its page
  families.
- `lab` consumes the same public package and exposes stable query-driven specimens for browser
  automation.

The package is organized by user-facing capability: foundations, layout, actions, forms,
navigation, feedback, data display, charts, and product patterns. Each folder has a barrel;
`public-api.ts` is the single package entry.

## State and rendering

Components use `OnPush`, signal inputs/outputs/models, computed state, and effects only for
external synchronization. Form controls use ControlValueAccessor or typed reactive forms.
Angular 22 applications run zoneless; no `zone.js` dependency is present.

Platform APIs are reached through the injected Angular `DOCUMENT`, the owning document's
`defaultView`, or CDK services. Theme DOM mutations use attributes that also work in Angular's
server DOM. Transient overlay listeners and media-query listeners are cleaned up on destroy.

## Styling and theming

`src/styles/kern.css` layers reset, tokens, themes, density, base rules, and utilities. Public
CSS custom properties are semantic: consumers override intent rather than internal component
selectors. Source palettes are expressed with safe fallbacks and OKLCH enhancements. Runtime
brand palettes are generated from a validated hexadecimal color.

Logical properties, container queries, forced-colors rules, reduced-motion rules, minimum touch
targets, and visible focus rings are shared foundations. Component styles are scoped by Angular;
the global sheet contains only reset, tokens, theme selectors, and opt-in utilities.

## Accessibility contract

The target is WCAG 2.2 AA. Native semantics are preferred. Composite widgets implement roving
focus and conventional keyboard behavior. Dialog-like overlays lock scrolling, trap and restore
focus, close on Escape, and support nested stacking. Status changes use visible text and live
regions where announcement is useful. Every catalog entry documents keyboard and state
expectations, including RTL, forced colors, 200% text zoom, long content, and mobile width.

## Extending Kern

1. Add the smallest semantic primitive to the matching `projects/kern/src/lib/<family>` folder.
2. Use shared semantic tokens; do not hard-code a parallel palette or spacing scale.
3. Use a typed union for mutually exclusive variants instead of boolean combinations.
4. Add behavioral unit tests, including keyboard/forms/overlay behavior where applicable.
5. Export through the family barrel and `public-api.ts`.
6. Add one catalog record and a deterministic Lab specimen.
7. Run static checks, production package build, browser accessibility, responsive, and visual
   projects.

## Current trade-offs

- The library intentionally ships one primary Angular entry point plus a CSS entry. Fine-grained
  secondary entry points can be added if consumer bundle analysis demonstrates a need.
- Shared action and form styles are embedded in multiple standalone component definitions. The
  package is tree-shakeable and compresses well, but splitting those sheets by family would
  reduce the unminified FESM.
- Charts are accessible, dependency-free SVG primitives rather than a full analytical charting
  grammar.
- Data-grid virtualization is optional and aimed at fixed-height row sets; variable-height,
  server-driven grids require an application adapter.
