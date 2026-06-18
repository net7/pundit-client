## OnPush Migration Audit

Generated while applying `migrate-onpush-change-detection`.

### 1.2 Component Migration Order

Leaf and low-risk first:
- `src/app/login-module/lib/components/error/error.component.ts`
- `src/app/components/svg-icon/svg-icon.ts`
- `src/app/login-module/lib/components/svg-icon/svg-icon.ts`
- `src/app/components/tooltip/tooltip.ts`
- `src/app/components/delete-modal/delete-modal.ts`
- `src/app/components/pdf-error-modal/pdf-error-modal.ts`
- `src/app/login-module/lib/components/signin/signin.component.ts`
- `src/app/login-module/lib/components/signup/signup.component.ts`
- `src/app/components/annotation/sections/highlight/highlight-annotation-section.ts`
- `src/app/components/annotation/sections/comment/comment-annotation-section.ts`
- `src/app/components/annotation/sections/semantic/semantic-annotation-section.ts`
- `src/app/components/annotation/sections/tag/tag-annotation-section.ts`
- `src/app/components/notebook-share-user-item/notebook-share-user-item.ts`
- `src/app/components/notebook-share-user-selected/notebook-share-user-selected.ts`
- `src/app/components/text-editor/sections/text-editor-menu/text-editor-menu.ts`

Mid-tier:
- `src/app/login-module/lib/components/modal/modal.component.ts`
- `src/app/login-module/lib/pundit-login-module/pundit-login.component.ts`
- `src/app/components/toast/toast.ts`
- `src/app/components/notebook-share-modal/notebook-share-modal.ts`
- `src/app/components/annotation/sections/social/social-action-bar/social-action-bar.ts`
- `src/app/components/annotation/sections/social/reply/reply.ts`
- `src/app/components/annotation/sections/social/social-annotation-section.ts`
- `src/app/components/annotation/sections/menu-header/menu-header-section.ts`
- `src/app/components/annotation/sections/header/header-annotation-section.ts`
- `src/app/components/annotation/annotation.ts`
- `src/app/components/notebook-panel/notebook-panel.ts`
- `src/app/app.component.ts`

Hotspots and parent-coordinated units:
- `src/app/components/edit-modal/sections/tags-section/tags-section.ts`
- `src/app/components/edit-modal/sections/comment-section/comment-section.ts`
- `src/app/components/text-editor/text-editor.ts`
- `src/app/components/text-editor/editor/editor.ts`
- `src/app/components/edit-modal/sections/notebook-section/notebook-section.ts`
- `src/app/components/notebook-selector/notebook-selector.ts`
- `src/app/components/edit-modal/sections/semantic-section/semantic-section.ts`
- `src/app/components/edit-modal/edit-modal.ts`
- `src/app/layouts/sidebar-layout/sidebar-layout.ts` plus `src/app/layouts/sidebar-layout/sidebar-layout.eh.ts`
- `src/app/layouts/main-layout/main-layout.ts` plus `src/app/layouts/main-layout/main-layout.eh.ts`

All 33 app/login components currently declare `ChangeDetectionStrategy.Eager`, which is this repo's pre-OnPush value.

### 1.3 ChangeDetectorRef / detectChanges Catalog

Must stay synchronous until the owning event-handler flow is refactored:
- `src/app/layouts/main-layout/main-layout.eh.ts` wraps all `detectChanges()` usage behind `layoutEH.detectChanges()` for NEFF handler state propagation.
- `src/app/layouts/sidebar-layout/sidebar-layout.eh.ts` wraps all `detectChanges()` usage behind `layoutEH.detectChanges()` for NEFF handler state propagation.
- Handler calls into those wrappers:
  - `src/app/layouts/main-layout/handlers/main-layout-app-events.handler.ts`
  - `src/app/layouts/main-layout/handlers/main-layout-identity.handler.ts`
  - `src/app/layouts/main-layout/handlers/main-layout-login.handler.ts`
  - `src/app/layouts/sidebar-layout/handlers/sidebar-layout-app-events.handler.ts`

Downgradable to `markForCheck()` after OnPush assignment and state immutability are in place:
- `src/app/components/tooltip/tooltip.ts` waits for Popper render completion; no immediate synchronous DOM read follows.
- `src/app/components/notebook-selector/notebook-selector.ts` refreshes local input/dropdown state; no synchronous DOM read follows.
- `src/app/components/annotation/annotation.ts` refreshes expanded/section state after local assignments.
- `src/app/components/annotation/sections/menu-header/menu-header-section.ts` refreshes local menu/notebook state after local assignments.
- `src/app/components/annotation/sections/header/header-annotation-section.ts` refreshes local header state after local assignments.
- `src/app/services/toast.service.ts` uses a static `ChangeDetectorRef` from `ToastComponent`; should become `markForCheck()` or an observable boundary.

### 1.4 Bound/Input Mutation Catalog

High-risk component-bound mutation:
- `src/app/components/edit-modal/sections/semantic-section/semantic-section.ts`
  - `rows.splice(...)`, `rows.push(...)`
  - nested row value assignment while building form values
  - timeout-driven reset path
- `src/app/components/notebook-selector/notebook-selector.ts`
  - mutates `data.selectedNotebook`
  - mutates `data._meta.isExpanded`
  - mutates `data._meta.inputValue`
- `src/app/components/edit-modal/edit-modal.ts`
  - mutates `formState[key]`
  - mutates `formState[id]`
  - mutates `sectionErrors[index]`
  - mutates `requiredErrors[index]`
  - timeout-driven reset paths
- `src/app/components/annotation/sections/menu-header/menu-header-section.ts`
  - mutates `notebookSelectorData.selectedNotebook`

Parent/service state that can feed template-bound inputs:
- `src/app/data-sources/notebook-panel.ds.ts` mutates `output._meta.notebookSelectorData.isLoading`.
- `src/app/layouts/sidebar-layout/sidebar-layout.eh.ts` mutates `dataSource.userPopover.items[2]`.
- `src/app/services/toast.service.ts` mutates `toasts`, `mouseoverState`, and removes entries with `splice`.
- `src/app/services/reply.service.ts`, `src/app/services/social.service.ts`, `src/app/services/annotation.service.ts`, `src/app/services/notebook.service.ts`, `src/app/services/tag.service.ts`, and `src/app/services/anchor.service.ts` mutate cached arrays that may be emitted to views.
- `src/app/pipes/sortby.pipe.ts` sorts input arrays in place; this is unsafe for OnPush inputs.

### 1.5 Out-of-Zone Entry Point Catalog

Chrome-extension and host DOM boundary:
- `src/app/services/chrome-ext.service.ts`
  - `window.addEventListener(CommonEventType.PunditLoaded, ...)`
  - `window.addEventListener(CommonEventType.PunditDestroy, ...)`
  - `setTimeout(...)` before `isExtensionLoaded()`
- `src/app/layouts/main-layout/handlers/main-layout-window-events.handler.ts`
  - `window.addEventListener(CommonEventType.RootElementExists, ...)`
- `src/app/services/image-data.service.ts`
  - `document.addEventListener('securitypolicyviolation', ...)`
  - `window.addEventListener(CommonEventType.ImageDataResponse, ...)`
- `src/app/services/pdf.service.ts`
  - `document.addEventListener('webviewerloaded', ...)`
- `src/app/services/anchor.service.ts`
  - DOM `mouseover`, `mouseleave`, and `click` listeners attached to anchored highlight elements
- `src/app/layouts/sidebar-layout/sidebar-layout.ts`
  - `document.addEventListener('click', ...)`
- `src/app/layouts/main-layout/handlers/main-layout-pdf-error-modal.handler.ts`
  - `chrome.extension.isAllowedFileSchemeAccess(...)`
  - `chrome.tabs.update(...)`

Timer callbacks that update or trigger view state:
- `src/app/services/anchor.service.ts`
- `src/app/services/toast.service.ts`
- `src/app/layouts/main-layout/handlers/main-layout-identity.handler.ts`
- `src/app/layouts/main-layout/handlers/main-layout-notebook-share-modal.handler.ts`
- `src/app/layouts/sidebar-layout/sidebar-layout.eh.ts`
- `src/app/layouts/sidebar-layout/sidebar-layout.ds.ts`
- `src/app/layouts/sidebar-layout/handlers/sidebar-layout-annotation.handler.ts`
- `src/app/layouts/sidebar-layout/handlers/sidebar-layout-app-events.handler.ts`
- `src/app/components/edit-modal/edit-modal.ts`
- `src/app/components/edit-modal/sections/comment-section/comment-section.ts`
- `src/app/components/edit-modal/sections/tags-section/tags-section.ts`
- `src/app/components/edit-modal/sections/semantic-section/semantic-section.ts`
- `src/app/components/annotation/sections/social/social-action-bar/social-action-bar.ts`
- `src/app/components/annotation/sections/social/reply/reply.ts`

Task 2.2 resolution:
- `edit-modal` reset/draggable timers now call `markForCheck()` after they emit reset or assign the draggable instance.
- `comment-section` editor setup/reset timers now call `markForCheck()` after assigning `editorData` or resetting ProseMirror content.
- Layout identity/sidebar/app-event timer paths already call `layoutEH.detectChanges()` or emit through layout events; they remain synchronous until the layout handler migration.
- Toast timer paths already flow through `updateDataStream()` and the toast `ChangeDetectorRef`; they remain documented for the later `detectChanges()` downgrade task.
- Remaining focus-only timers (`tags-section`, `semantic-section`, social reply/action forms, Tagify custom dropdown) do not mutate Angular template state and are safe as DOM focus helpers.

ProseMirror boundary:
- `src/app/components/text-editor/editor/editor.ts`
  - `dispatchTransaction` calls `onChange(this.getContent())` from the editor view callback and needs an explicit Angular refresh path under OnPush.

Task 2.3 resolution:
- `editor.init()` now accepts `onRefresh`.
- `dispatchTransaction` calls `onRefresh()` after `onChange(...)`.
- menu event handling calls `onRefresh()` after mutating menu state.
- `CommentSectionComponent` wires `onRefresh` to `ChangeDetectorRef.markForCheck()`.

### 3.3 Leaf Subscribe-and-Assign Review

Reviewed leaf components after adding OnPush:
- `tooltip`: the model-change subscription has no template observable and now calls `markForCheck()`.
- `login modal`: `show/status` are coupled to imperative modal actions (`signin`, `signup`, `onClose`), so replacing this with an async pipe would split local state across stream and command paths.
- `signin` and `signup`: `isLoading` is also used by click handlers as a synchronous guard, and form `valueChanges` imperatively clear `serviceErrorMessage`; these stay as local state with explicit `markForCheck()`.
- `error`: no subscription.

No leaf subscription was a practical async-pipe conversion without reshaping the login component APIs.

### 4.2 Mid-Tier Immutable Update Resolution

- `SortByPipe` no longer sorts input arrays in place.
- `ToastService` now adds/removes/replaces toast entries by assigning new array references and replaces updated toast data objects instead of mutating the existing object.
- `NotebookShareModalComponent.dropdownToggle()` now replaces `data.body.listSection.items` and the toggled item/dropdown with new references.

### 4.3 detectChanges Downgrade Resolution

Downgraded to `markForCheck()`:
- `TooltipComponent`
- `NotebookSelectorComponent`
- `AnnotationComponent`
- `MenuHeaderSectionComponent`
- `HeaderAnnotationSectionComponent`
- `ToastService`

Retained as synchronous `detectChanges()` for the layout hotspot task:
- `MainLayoutEH.detectChanges()` and callers
- `SidebarLayoutEH.detectChanges()` and callers

Task 5.5 update:
- `MainLayoutEH.detectChanges()` and `SidebarLayoutEH.detectChanges()` keep their method names for existing handler compatibility, but now call `ChangeDetectorRef.markForCheck()`.
- No production code calls `ChangeDetectorRef.detectChanges()` after the migration.

### 6.6 Final Static Review

- All production `@Component` decorators declare `ChangeDetectionStrategy.OnPush`.
- No `ChangeDetectionStrategy.Eager` or `ChangeDetectionStrategy.Default` declarations remain.
- No production `ChangeDetectorRef.detectChanges()` calls remain.
- Remaining `.push()`/`.splice()`/`.sort()` occurrences are service/model-local caches, local array construction, or non-template-bound helper state; the high-risk template/input mutation hotspots were converted.
