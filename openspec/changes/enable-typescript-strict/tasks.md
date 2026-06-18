## 1. Baseline

- [ ] 1.1 Confirm clean baseline: `npm run build` and the chrome-extension build both compile with current (`strict: false`) config
- [ ] 1.2 Capture the current error count by trial-flipping `strict: true` locally (do not commit), to size the work and confirm category breakdown

## 2. noImplicitAny

- [ ] 2.1 Enable `noImplicitAny` in `tsconfig.json` and `tsconfig.chrome-ext.json`
- [ ] 2.2 Fix all `noImplicitAny` errors with explicit type annotations (no `any` escape hatches except where unavoidable; note any exceptions)
- [ ] 2.3 Verify `npm run build` and the chrome-extension build both compile cleanly; commit this increment

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
