# Component and state coverage

The typed catalog in `projects/showcase/src/lib/catalog.ts` is the source of truth. It contains
131 documented entries; every entry has a page, API metadata, keyboard contract, accessibility
notes, do/don't guidance, and a visual-state matrix.

| Category | Entries | Representative capabilities |
| --- | ---: | --- |
| Layout | 17 | App shell, responsive primitives, scrolling, resizable panels |
| Actions | 10 | Buttons, groups, split/dropdown actions, toggles, copy |
| Forms | 30 | Typed text/choice controls, selection, dates, uploads, OTP, tags |
| Navigation | 14 | Tabs, menus, pagination, stepper, tree, command palette |
| Feedback | 19 | Alerts, toast, overlays, progress, skeleton, state patterns |
| Data display | 26 | Dense data, grid/table, calendar, charts, media |
| Patterns | 15 | Search, settings, CRUD, master-detail, forms, app shells |
| **Total** | **131** | |

## Visual matrix

Interactive catalog entries cover default, hover, focus-visible, active, disabled, loading,
selected, invalid, readonly, overflow, long text, dark, high contrast, compact density, RTL,
and mobile states. Non-interactive entries omit meaningless interaction states and retain the
shared environment/content matrix.

The deterministic Lab adds cross-product scenarios for light/dark/high-contrast themes,
three densities, LTR/RTL, and responsive widths. Playwright projects validate smoke flows,
keyboard behavior, axe scans, responsive geometry, and screenshot baselines.
