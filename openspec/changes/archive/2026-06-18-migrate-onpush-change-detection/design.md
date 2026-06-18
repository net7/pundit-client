## Context

The client is an Angular 22 Chrome-extension/embed app built on a NEFF architecture (`@net7/core`: `DataSource`/`EventHandler`/`LayoutBuilder`/`LayoutDataSource`), where component logic is split into a component class and a sibling event-handler (`.eh.ts`). Today **all ~23 components run `Default` change detection**. Notably, the app already drives CD manually in places — ~10 components inject `ChangeDetectorRef` and call `detectChanges()` (heaviest: `notebook-selector`, the layout `.eh.ts` handlers, `toast.service`). That habit means the team already reasons about *when* the view updates; the gap is that state is frequently mutated in place and pushed in from outside Angular's zone, which `Default` forgives and `OnPush` will not.

Known risk surface (from codebase survey):
- **In-place mutation** of template-bound / `@Input` state: `semantic-section` (`rows.push/splice`, nested property writes), `notebook-selector` (mutates `@Input data._meta`, `selectedNotebook`), `edit-modal` sections.
- **Out-of-zone state**: ProseMirror `dispatchTransaction` → `onChange()` in `text-editor/editor`; chrome-extension messaging (`chrome.runtime.onMessage`, `chrome.storage`); ~20 `setTimeout` calls in handlers; `postMessage`/DOM events.
- **Subscriptions**: ~117 `.subscribe()` across ~49 files; mixed async-pipe and manual subscribe-and-assign.

This change assumes the `migrate-standalone-inject` change has landed (standalone + `inject()` base).

## Goals / Non-Goals

**Goals:**
- All components run `ChangeDetectionStrategy.OnPush` with views that update correctly in both runtime modes.
- Template-bound and `@Input` state updated immutably.
- Explicit, intentional view refresh (`async` pipe / `markForCheck()` / signals); `detectChanges()` retained only where justified.
- Out-of-zone changes deliberately re-enter CD.

**Non-Goals:**
- No rewrite of the NEFF architecture or the `EventHandler` pattern itself.
- No wholesale signals migration (allowed where it simplifies a hotspot, but not mandated).
- No `provideExperimentalZonelessChangeDetection()` / zoneless migration — out of scope.
- No feature/behavior changes; view output must be identical to today.

## Decisions

**Migrate leaf-up, one component (or one NEFF unit) per commit.** Start with low-risk leaves (`tooltip`, `error`, `modal`), end with the hotspots (`semantic-section`, `notebook-selector`, ProseMirror editor, layout handlers). Rationale: OnPush bugs manifest as "view didn't update," which is far easier to localize when a single component flips at a time than in a big-bang switch. Alternative — flip all components at once — rejected: debugging a tree-wide view-update regression is exactly the failure mode we want to avoid.

**Convert in-place mutation to immutable reassignment, not to a `detectChanges()` band-aid.** Where a component mutates a bound array/object, replace with new-reference updates (spread/`map`/`filter`). Rationale: papering over mutation with `detectChanges()` reintroduces full-subtree checks and defeats the purpose. `detectChanges()` is kept only where synchronous, scoped detection is genuinely needed.

**Prefer `markForCheck()` + `async` pipe over manual subscribe-and-assign.** For template-bound observables, move toward the `async` pipe (auto-`markForCheck` + auto-unsubscribe). Where a manual subscription must stay, assign then `markForCheck()`. Rationale: fewer hand-managed CD calls and subscription leaks.

**Centralize out-of-zone re-entry at the boundary.** Wrap ProseMirror/chrome/`setTimeout` callbacks at their entry point (`NgZone.run()` or push onto a Subject consumed by `async`) rather than scattering `markForCheck()` through downstream handlers. Rationale: one correct boundary beats N fragile call sites.

**Keep `detectChanges()` where the NEFF `.eh.ts` flow requires synchronous detection** — audit each existing call, downgrade to `markForCheck()` when async checking suffices, document the ones that must stay.

## Risks / Trade-offs

- **Silent "view didn't update" regressions** → Leaf-up per-component commits + manual smoke tests after each; lean on the existing manual-CD knowledge to spot which views are CD-sensitive.
- **ProseMirror editor desync** (transactions outside Angular) → Treat the editor boundary as the riskiest unit; migrate it last with focused interaction testing (type, format, save round-trip).
- **`@Input` mutation by parents** (`notebook-selector`, `semantic-section`) → Requires coordinated parent+child changes in the same commit; grep for every parent passing the mutated object.
- **Chrome-extension messaging not refreshing UI** → Verify each `chrome.*` callback path updates the view under OnPush in the actual extension build, not just dev.
- **Hidden reliance on sibling components' `Default` checks** → Some views may currently refresh only because an unrelated component triggered tree-wide CD; these break under OnPush and must be given their own explicit trigger.
- **Effort underestimation** → This is HIGH effort (no existing OnPush patterns, heavy mutable state); scope by component and allow the hotspots to take disproportionate time.

## Migration Plan

1. Confirm baseline on top of the landed standalone migration: `ng build` + tests green.
2. Flip leaf/low-risk components to OnPush first (`tooltip`, `error`, `modal`, `signin`, `signup`); smoke-test each.
3. Migrate mid-tier components and their `.eh.ts` handlers; convert mutations to immutable updates; downgrade `detectChanges()` → `markForCheck()` where possible.
4. Harden out-of-zone boundaries (chrome messaging, `setTimeout`, `postMessage`) with `NgZone.run()`/Subject + `async`.
5. Migrate hotspots last: `semantic-section`, `notebook-selector` (+ its parents for `@Input` immutability), `edit-modal` sections, then the ProseMirror `text-editor/editor`.
6. Full verification: `ng build` both targets, run tests, smoke-test both runtime modes and the ShadowDom UI, exercise editor + notebook flows end-to-end.
7. Rollback: per-component commits mean any single component can be reverted to `Default` independently if a regression is found late.

## Open Questions

- Which existing `detectChanges()` calls are load-bearing (must stay synchronous) vs. safely downgradable to `markForCheck()`? — resolved per call site during steps 3 and 5.
- Are there views that currently refresh only as a side effect of tree-wide `Default` CD (no explicit trigger of their own)? — discovered during per-component smoke tests.
- Should the riskiest hotspots (`semantic-section`, editor) adopt signals to simplify their state flow, or stay observable/`markForCheck`-based? — decided per component when migrating it.
