## Why

Every component in the client app runs Angular's `Default` change detection, which checks the entire component tree on every event, timer, and async callback. The app is large enough — and the NEFF event-handler architecture central enough — that this is wasteful: handlers already call `ChangeDetectorRef.detectChanges()` manually (~10 components today), so the team is effectively fighting `Default` CD instead of leaning on it. Moving to `ChangeDetectionStrategy.OnPush` makes change detection explicit and cheap, surfaces the latent mutable-state bugs that `Default` masks, and aligns the app with current Angular guidance — best done right after the standalone/`inject()` migration lands so it runs on a clean, modern base.

## What Changes

- Set `changeDetection: ChangeDetectionStrategy.OnPush` on all components (~23 declarables). **BREAKING** at the view-update level: any view relying on `Default`'s implicit re-checks will stop updating until its state flow is corrected.
- Replace in-place array/object mutation of template-bound and `@Input` state with immutable reassignment (notably `semantic-section`, `notebook-selector`, `edit-modal` sections).
- Convert manual `detectChanges()` calls to `markForCheck()` where eager synchronous detection is not actually required; keep `detectChanges()` only where intentional.
- Ensure state arriving from outside Angular (ProseMirror `dispatchTransaction`, chrome-extension messaging, `setTimeout`/`setInterval`, `postMessage`/DOM events) re-enters change detection via `NgZone.run()`, an Observable + `async` pipe, or an explicit `markForCheck()`.
- Prefer the `async` pipe over manual subscribe-and-assign for template-bound observables where practical.
- Establish OnPush + immutable-update + explicit-CD as the project convention for new components.

## Capabilities

### New Capabilities
- `angular-onpush-change-detection`: Establishes that all components use `ChangeDetectionStrategy.OnPush`, that template-bound and `@Input` state is updated immutably, that view refreshes are triggered explicitly (`markForCheck()`, `async` pipe, or signals), and that change originating outside Angular's zone is brought back into change detection deliberately.

### Modified Capabilities
<!-- None. Depends on the angular-standalone-architecture change but does not alter its requirements; existing toolchain specs are unaffected. -->

## Impact

- **Depends on** the `migrate-standalone-inject` change landing first (clean standalone/`inject()` base).
- **All components** (`*.component.ts` and NEFF-named `*.ts` declarables) gain `OnPush`.
- **High-risk components** requiring state-flow refactor: `semantic-section`, `notebook-selector`, `edit-modal` (+ child sections), the ProseMirror `text-editor/editor`, and the `main-layout`/`sidebar-layout` event handlers (`.eh.ts`).
- **Cross-zone entry points**: ProseMirror, chrome-extension messaging, `setTimeout`/`setInterval` callbacks — audited for re-entry into CD.
- **Subscriptions**: ~117 `.subscribe()` sites across ~49 files reviewed; template-bound ones migrated toward `async` where sensible.
- **Runtime modes**: both chrome-extension and embed builds, and ShadowDom rendering, must be re-verified for correct view updates.
- **Dependencies**: no new packages; uses existing `@angular/*` v22.
