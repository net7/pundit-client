## 1. Exclusive tabs

- [x] 1.1 `SidebarLayoutTabs.setPageAnnotations(show)`: no-op on same state, update `showPageAnnotations$`, emit `ShowPageAnnotations`/`HidePageAnnotations`
- [x] 1.2 `SidebarLayoutTabs.toggle(tab)`: open the tab and close the other two, or close it when already open
- [x] 1.3 `SidebarLayoutEH`: the three tab handlers delegate to `toggle`
- [x] 1.4 Specs: every pair of tabs, closing the active tab, no duplicate events

## 2. Add Page Annotation bar

- [x] 2.1 `sidebar-layout.html`: `pnd-sidebar__fullpage-add` bar, one button per type, instead of the dropdown
- [x] 2.2 `_sidebar.scss`: bar styles, fixed 50px height
- [x] 2.3 `sidebar-layout.ds.ts`: `labels.fullpage.options` as list of buttons; remove dropdown state; `en_US.ts` short labels
- [x] 2.4 `annotation-position.service.ts`: `TOP_MARGIN_FULLPAGE` 132
- [x] 2.5 `eslint.config.js`: i18n dictionaries out of `max-lines`
- [x] 2.6 Specs: button click emits `AnnotationNewFullPage` with its type

## 3. Header

- [x] 3.1 `svg-icon.html`: custom `full-page` icon (page with speech bubble)
- [x] 3.2 `sidebar-layout.html`: page annotations tab after notebooks and ontologies

## 4. Verification

- [x] 4.1 `npm test` and `npm run lint` green
- [ ] 4.2 Manual: tabs exclusive; header order and icon; bar buttons fit and create each type; first page annotation right below the bar
