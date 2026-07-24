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

- [x] 3.1 Enable `strictNullChecks` in `tsconfig.json` and `tsconfig.chrome-ext.json`
- [x] 3.2 Fix all `strictNullChecks` errors (257). Patterns: widened genuinely-nullable class fields / state-shape types / interfaces (`MainLayoutState`, `SemanticProvider`, `NotebookSelectorData`, `ChromeExtStateData`, etc.) to `| null`/`| undefined`; non-null assertions (`!`) on lookups guaranteed by surrounding logic (`getSelected()`, `getUserById()`, `getNotebookById()`, `shadowRoot`, `chrome` tab ids); optional chaining where a missing value is a valid no-op; `null`→`undefined` for optional object-literal fields; defaults (`|| []`/`|| ''`) where a downstream API needs a non-null value. Behavior preserved throughout.
- [x] 3.3 Verified all 4 tsconfig projects report 0 errors; `npm run build`, `npm run build:chrome-ext-prod`, `npm test` (8/8), and `npm run lint` all pass. Fixed `selection-handler.spec.ts` (inherits the flag).

## 4. strictPropertyInitialization

- [x] 4.1 Enable `strictPropertyInitialization` in `tsconfig.json` and `tsconfig.chrome-ext.json`
- [x] 4.2 Fix all uninitialized-property errors (139, all TS2564) with definite-assignment assertions (`!`) — these are Angular DI-injected services, `@Input` fields, and lifecycle-set properties that are assigned outside the constructor; `!` is the idiomatic Angular fix. Applied mechanically via the compiler's reported file/line/column + property name.
- [x] 4.3 Verified all 4 tsconfig projects report 0 errors; `npm run build`, `npm run build:chrome-ext-prod`, `npm test` (8/8), and `npm run lint` all pass.

## 5. Consolidate to strict

- [x] 5.1 Replaced the individual sub-flags with `strict: true` in both `tsconfig.json` and `tsconfig.chrome-ext.json`; the explicit `strict: false` is gone.
- [x] 5.2 Fixed all 50 residual errors from the remaining sub-flags: `noImplicitThis` (`this: any` on tagify-custom functions), `useUnknownInCatchVariables` (`catch (err: any)`), `strictFunctionTypes` (RxJS/`addEventListener`/`Promise.then` callback variance — broadened callback param types, `as EventListener`/`as Promise<T>` casts, `fromEvent<MessageEvent>` generic, `as const` tuple), and typed empty-`BehaviorSubject` initializers.
- [x] 5.3 Verified all 4 tsconfig projects report 0 errors; default and chrome-ext builds compile cleanly.

## 6. Verification

- [x] 6.1 Ran `npm test` (jest 8/8) and `npm run lint` (clean); `npm run build` and `npm run build:chrome-ext-prod` both pass. No regressions.
- [x] 6.2 Confirmed `tsconfig.json` and `tsconfig.chrome-ext.json` both declare `strict: true` and nothing else strictness-related; no `strict: false` or individual sub-flags remain.
- [x] 6.3 Updated `ANGULAR_22_FOLLOWUPS.md` to mark item 5 as done.
