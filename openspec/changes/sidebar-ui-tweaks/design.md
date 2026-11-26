## Context

The sidebar header has three tabs, all handled in `SidebarLayoutEH.innerEventHandlers`:

- page annotations: `annotationService.showPageAnnotations$` + `AppEvent.ShowPageAnnotations` / `HidePageAnnotations`;
- notebooks: `dataSource.notebookEditor`;
- ontologies: `dataSource.ontologiesPanel`.

Notebooks and ontologies already close each other; page annotations is independent of both. The header is `position: fixed`; notebooks and ontologies are shown only to logged users, page annotations to everyone.

The sidebar content (`.pnd-sidebar__content`) is absolute and as tall as the document: the annotation cards are placed in document coordinates by `AnnotationPositionService.update()`, next to their highlights. Page annotations have no highlight and stack at the top, from `TOP_MARGIN_FULLPAGE`. The "Add Page Annotation" dropdown is absolute at the top of the content; its list is an overlay that covers the first page annotations.

Icons are inline SVG in `svg-icon.html`. The old `@pundit/icon-font` repo has 14 icons, none fitting; later icons (`bell`, `ontologies`, `plus`, `reply`, `full-page`) were added straight to the template.

## Goals / Non-Goals

**Goals:**
- At most one tab open at a time.
- Creating a page annotation never covers the page annotations.
- A page annotations tab icon that says "annotations on this page".

**Non-Goals:**
- Icons for the annotation types (the icon set has none; the selection tooltip uses text too).
- Keeping the "Add Page Annotation" bar visible while scrolling (see Decisions).

## Decisions

- **Exclusive tabs in `SidebarLayoutTabs`.** A small class owned by `SidebarLayoutEH` (the EH is at its `max-lines` limit); the three tab handlers call `toggle(tab)`, which opens the tab and closes the other two, or closes it when already open. The page annotations go through `setPageAnnotations(show)`, a no-op when the state does not change (no duplicate `Show`/`HidePageAnnotations` events).
- **A bar of buttons instead of the dropdown.** Alternatives considered: keep the overlay (covers the cards), push the cards down while the list is open (cards jump on every toggle, DOM measuring, outside click / Escape handling). Four always visible buttons need none of that and save a click. The sidebar is 400px wide: four equal buttons fit with short labels (Tag, Comment, Semantic, AI); the full type name is their `title`. More annotation types would need shorter labels or a different control: accepted for now.
- **Fixed bar height.** The bar is 50px (label + buttons), so the first page annotation starts at a constant `TOP_MARGIN_FULLPAGE` (70 + 50 + 12 = 132px).
- **Bar not fixed/sticky.** The page annotations it creates are at the top: scrolled down, a fixed bar would create cards out of sight and cover the cards anchored below the header.
- **Custom tab icon.** A page with a speech bubble, drawn on the 20×20 grid with 1.1 stroke to match the thin `ontologies` and `angle-right` icons; the page is smaller and the bubble larger than in a classic "file comment" icon so the bubble reads at 20px.
- **Tab order.** Settings (notebooks, ontologies) next to each other, then the page annotations tab, next to the close button.

## Risks / Trade-offs

- [Opening notebooks/ontologies now hides the page annotations] → expected for exclusive tabs; the page annotations come back with their tab.
- [The page annotations start 22px lower than before] → the bar is taller than the dropdown button.
