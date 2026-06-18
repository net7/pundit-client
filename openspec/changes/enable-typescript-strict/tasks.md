## 1. Baseline

- [x] 1.1 Confirm clean baseline: `npm run build` and the chrome-extension build both compile with current (`strict: false`) config
- [x] 1.2 Capture the current error count by trial-flipping `strict: true` locally (do not commit), to size the work and confirm category breakdown
- [x] 1.3 Establish a clean `tsc --noEmit` slate for all configs (so only strict-induced errors surface later): removed dangling re-exports of deleted services in `src/app/login-module/lib/pundit-login-module/index.ts`; added the ambient-globals union `types: ["chrome","jest","node"]` to base `tsconfig.json`; added `skipLibCheck: true` to `tsconfig.chrome-ext.json`. Verified `tsc -p` is 0 errors for `tsconfig.json`, `tsconfig.app.json`, `tsconfig.chrome-ext.json`, `tsconfig.spec.json`, and that `npm run build`, `build:chrome-ext-prod`, and `npm test` all pass.

  Sizing on the clean base (`tsc -p tsconfig.json --noEmit`, cumulative):
  - `--noImplicitAny`: 246 errors
  - `+ --strictNullChecks`: 481
  - `+ --strictPropertyInitialization`: 622
  - full `--strict`: 670

## 2. noImplicitAny

- [x] 2.1 Enable `noImplicitAny` in `tsconfig.json` and `tsconfig.chrome-ext.json`
- [x] 2.2 Fix all `noImplicitAny` errors (246) with explicit type annotations. Proper types used where obvious (ids, booleans, event `{type,payload}` → `AppEventData`, ProseMirror `Schema`/`NodeType`/`Command`, `Reply`/`Social`/`Tag` models, `keyof typeof`/index casts). Explicit `any` retained where data is genuinely external/dynamic (Hypothesis API conversions, event-bus payloads, third-party untyped libs). Added `src/typings.d.ts` ambient stubs for `draggable`/`seedrandom`/`@yaireo/tagify`. Fixed one spec file (`selection-handler.spec.ts`) that inherits the flag.
- [x] 2.3 Verified all 4 tsconfig projects (`json`/`app`/`chrome-ext`/`spec`) report 0 tsc errors; `npm run build`, `npm run build:chrome-ext-prod`, `npm test` (8/8), and `npm run lint` all pass.

## 3. strictNullChecks

- [ ] 3.1 Enable `strictNullChecks` in both tsconfigs
- [ ] 3.2 Fix possibly-null/undefined errors with guards, narrowing, or `?`/`!` as appropriate, preserving runtime behavior (split across commits/sessions if volume is large)
- [ ] 3.3 Verify both builds compile cleanly; commit this increment

## 4. strictPropertyInitialization

- [ ] 4.1 Enable `strictPropertyInitialization` in both tsconfigs
- [ ] 4.2 Fix uninitialized-property errors by initializing, marking optional, or definite-assignment (`!`) consistent with actual runtime usage
- [ ] 4.3 Verify both builds compile cleanly; commit this increment

## 5. Consolidate to strict

- [ ] 5.1 Replace the individual sub-flags with `strict: true` and remove the explicit `strict: false` in both tsconfigs
- [ ] 5.2 Fix residual errors from the remaining `strict` sub-flags (e.g. `strictFunctionTypes`, `noImplicitThis`, `useUnknownInCatchVariables`)
- [ ] 5.3 Verify both builds compile cleanly

## 6. Verification

- [ ] 6.1 Run `npm test` (jest) and `npm run lint`; confirm no regressions introduced by the type fixes
- [ ] 6.2 Confirm both tsconfigs are in sync and `strict: true` is the only strictness declaration
- [ ] 6.3 Update `ANGULAR_22_FOLLOWUPS.md` to mark item 5 as done
