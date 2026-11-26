## Why

Small UI problems in the sidebar header and in the page annotations:

- The header tabs (notebooks, ontologies, page annotations) do not behave as tabs: opening the page annotations tab leaves the notebook or ontologies panel open, and opening one of those panels leaves the page annotations open.
- With the page annotations tab open, the "Add Page Annotation" dropdown list covers the page annotations right under it. A dropdown is also one click more than needed for four options.
- The page annotations tab icon is a plain file icon: it reads as "open/export a file" rather than "annotations on this page".
- The page annotations tab sits between the notifications bell and the two settings tabs (notebooks, ontologies).

## What Changes

- Opening any sidebar tab closes the other open one. Clicking the active tab still closes it.
- The "Add Page Annotation" dropdown is replaced by a bar with four always visible buttons (Tag, Comment, Semantic, AI): one click starts the annotation, nothing covers the page annotations. The bar stays at the top of the sidebar content, like the dropdown (it scrolls with the page).
- New custom icon for the page annotations tab: a page with a speech bubble.
- Header order: bell, notebooks, ontologies, page annotations, close.
- No backend changes.

## Capabilities

### New Capabilities

- `sidebar-ui`: exclusive header tabs, their order and the page annotations tab icon, the "Add Page Annotation" buttons.

### Modified Capabilities

None.

## Impact

- `sidebar-layout-tabs.ts` (new): `SidebarLayoutTabs` with exclusive `toggle(tab)`.
- `sidebar-layout.eh.ts`: the three tab handlers delegate to `SidebarLayoutTabs` (keeps the file under the `max-lines` limit); no dropdown toggle on a new page annotation.
- `sidebar-layout.html`: header order; `pnd-sidebar__fullpage-add` bar instead of the dropdown.
- `_sidebar.scss`: bar styles.
- `sidebar-layout.ds.ts`: `labels.fullpage.options` becomes the list of buttons (type, short label, full title); dropdown state removed.
- `en_US.ts`: `fullpage#semantic`, `fullpage#ai` short labels (Tag and Comment reuse the tooltip labels).
- `annotation-position.service.ts`: `TOP_MARGIN_FULLPAGE` 110 → 132, below the taller bar.
- `svg-icon.html`: new `full-page` icon.
- `eslint.config.js`: no `max-lines` on the i18n dictionaries (data files, like mocks).
- Specs: `sidebar-layout.eh.spec.ts`.
