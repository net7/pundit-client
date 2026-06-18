## 1. Baseline & Audit

- [ ] 1.1 Confirm the `migrate-standalone-inject` change has landed and the branch is green (`ng build` + tests)
- [ ] 1.2 Enumerate all components and rank them leaf → hotspot for migration order
- [ ] 1.3 Catalog every existing `ChangeDetectorRef`/`detectChanges()` call and mark each as "must stay synchronous" or "downgradable to markForCheck()"
- [ ] 1.4 Catalog in-place mutation sites of template-bound/`@Input` state (start with `semantic-section`, `notebook-selector`, `edit-modal`)
- [ ] 1.5 Catalog out-of-zone entry points: ProseMirror `dispatchTransaction`, chrome-extension messaging, `setTimeout`/`setInterval`, `postMessage`/DOM events

## 2. Harden Cross-Zone Boundaries

- [ ] 2.1 Wrap chrome-extension messaging callbacks so state updates re-enter CD (`NgZone.run()` or Subject + `async`)
- [ ] 2.2 Audit `setTimeout`/`setInterval` callbacks that update state and ensure they trigger CD
- [ ] 2.3 Route ProseMirror `dispatchTransaction`/`onChange` output back into Angular state with an explicit refresh path

## 3. Migrate Leaf & Low-Risk Components

- [ ] 3.1 Add `ChangeDetectionStrategy.OnPush` to leaf components (`tooltip`, `error`, `modal`, `signin`, `signup`)
- [ ] 3.2 Smoke-test each leaf component's view updates after the flip
- [ ] 3.3 Replace any manual subscribe-and-assign in these components with the `async` pipe where practical

## 4. Migrate Mid-Tier Components & Handlers

- [ ] 4.1 Add OnPush to mid-tier components and adjust their `.eh.ts` handlers
- [ ] 4.2 Convert in-place mutations in these components to immutable reassignment
- [ ] 4.3 Downgrade `detectChanges()` to `markForCheck()` where synchronous detection is not required (per 1.3)
- [ ] 4.4 Smoke-test each migrated unit in both runtime modes

## 5. Migrate Hotspots

- [ ] 5.1 Migrate `semantic-section`: make `rows` and nested updates immutable, then add OnPush
- [ ] 5.2 Migrate `notebook-selector` AND its parent(s) together so `@Input` data is passed by new reference, then add OnPush
- [ ] 5.3 Migrate `edit-modal` and child sections (resolve `setTimeout`-driven resets), then add OnPush
- [ ] 5.4 Migrate the ProseMirror `text-editor/editor`: verify transaction → view refresh, then add OnPush
- [ ] 5.5 Migrate `main-layout` and `sidebar-layout` (+ `.eh.ts`) to OnPush, reconciling their manual `detectChanges()` usage

## 6. Verification

- [ ] 6.1 Confirm every component declares `ChangeDetectionStrategy.OnPush`
- [ ] 6.2 Update/extend tests for OnPush behavior; run the full suite
- [ ] 6.3 Build both targets (chrome-extension and embed) and confirm success
- [ ] 6.4 Smoke-test chrome-extension runtime: editor, notebook selection, annotation create/edit, toasts, ShadowDom UI
- [ ] 6.5 Smoke-test embed runtime for the same flows
- [ ] 6.6 Final review: no remaining `Default` reliance; `detectChanges()` retained only where documented
