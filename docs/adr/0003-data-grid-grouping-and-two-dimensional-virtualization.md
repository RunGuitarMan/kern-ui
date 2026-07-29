# ADR 0003: Grid grouping and two-dimensional virtualization

- Status: Proposed; intentionally not part of the current beta contract
- Owner: `kern/data-display`
- Scope: grouping, variable-height rows, and column virtualization

## Context

KERN Grid already has stable row/column identity, controlled and client queries, fixed-height row
virtualization, logical column pinning, resize/visibility state, selection, expansion, and one
roving-focus matrix. Adding isolated flags for grouping or a second virtual axis would make those
contracts ambiguous:

- a group row is not a domain row and needs its own key, selection, expansion, aggregation, and
  server semantics;
- variable row height changes scroll anchoring, keyboard page size, restoration, hydration, and
  measurement cost;
- column virtualization changes `aria-colindex`, focus targets, pinned regions, resize handles,
  projected cells, and horizontal scroll restoration.

## Required decision

The feature must be designed as one typed row/column model rather than three unrelated booleans.
An accepted proposal must define:

1. distinct domain-row and group-row identities;
2. client and controlled aggregation ownership;
3. selection rules for groups, descendants, unloaded pages, and disabled rows;
4. expanded-state ownership and immutable updates;
5. exact ARIA row/column counts and indexes when either axis is windowed;
6. focus behavior when the active row or column leaves the viewport;
7. pinned start/end regions that are never virtualized away;
8. variable-height measurement, cache invalidation, and scroll anchoring;
9. SSR/hydration fallback before viewport measurement;
10. public harness methods that do not expose the internal DOM strategy.

## Acceptance gates

Implementation is incomplete until it has:

- strict public API and lifecycle registration;
- client and controlled/server fixtures;
- keyboard, RTL, selection, resize, visibility, and nested-control tests;
- screen-reader review for grouped and virtualized semantics;
- runtime budgets at 10k rows and a representative wide-column set;
- SSR/hydration and 200/400% text reflow evidence;
- migration guidance if the existing fixed-height mode changes.

Until this ADR is accepted, KERN keeps these capabilities outside the advertised Grid contract.
Logical pinning and `KrnDataGridDataSource` are additive today and do not pre-commit the library to
an unsafe two-dimensional implementation.
