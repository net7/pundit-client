## Context

The client was upgraded Angular 17 → 22 with TypeScript 6, which defaults `strict: true`. To keep the upgrade focused, `strict: false` was set explicitly in both `tsconfig.json` and `tsconfig.chrome-ext.json`, preserving the project's historically non-strict stance. A trial flip to `strict: true` surfaced 600+ errors spanning implicit any, strict-null, and uninitialized-property categories.

The project has two compile pipelines that must agree on strictness:
- the default Angular `application` (esbuild) build driven by `tsconfig.json`,
- the chrome-extension `ts-loader` webpack build driven by `tsconfig.chrome-ext.json`.

`tsconfig.json` already enables `angularCompilerOptions.strictInjectionParameters` and `fullTemplateTypeCheck`, but the TS `strict` family is off.

## Goals / Non-Goals

**Goals:**
- Move the codebase to full TypeScript `strict` incrementally, one flag at a time.
- Keep the build green and shippable after each flag, so the work spans sessions safely.
- Keep the two tsconfigs in sync so both builds enforce identical strictness.
- Limit fixes to type-level changes that preserve runtime behavior.

**Non-Goals:**
- No runtime behavior, public API, or application-logic changes.
- No template-strictness tightening beyond what is already enabled (`fullTemplateTypeCheck`); Angular template strict-mode flags are out of scope for this change.
- No refactor of code beyond what is required to satisfy the enabled flags.

## Decisions

**Decision: Enable flags incrementally instead of flipping `strict: true` once.**
Order: `noImplicitAny` → `strictNullChecks` → `strictPropertyInitialization` → consolidate to `strict: true`. Rationale: the 600+ errors are dominated by a few categories; isolating one category at a time makes each batch of fixes reviewable and keeps every intermediate state shippable. Alternative considered — flip `strict: true` and fix everything in one branch — rejected because a 600-error single PR is unreviewable and cannot be paused cleanly.

**Decision: `strict: true` enables more than the three sub-flags; consolidate at the end.**
`strict` also turns on `strictBindCallApply`, `strictFunctionTypes`, `alwaysStrict`, `noImplicitThis`, and `useUnknownInCatchVariables`. After the three high-volume flags are clean, flip `strict: true` and fix whatever residual (typically small) the remaining sub-flags surface, then delete the now-redundant explicit `strict: false`. Alternative — enable all sub-flags individually — rejected as needless ceremony for the low-volume ones.

**Decision: Keep both tsconfigs in lockstep per increment.**
Apply each flag to `tsconfig.json` and `tsconfig.chrome-ext.json` together and verify both builds. Rationale: divergent strictness would let errors hide in whichever pipeline lags.

**Decision: Prefer guards/narrowing over `!` and `any` escape hatches.**
Use non-null assertions and `any` only where the safer fix is disproportionate, and flag those for follow-up. Rationale: the point of the change is type safety; silencing it defeats the purpose.

## Risks / Trade-offs

- [A property "fix" silently changes runtime behavior — e.g. initializing a field that was meant to stay undefined] → Prefer optional (`?`) or definite-assignment (`!`) over assigning a default value; review each initialization against actual usage.
- [`strictNullChecks` fixes balloon in volume] → It is the largest category; budget it as its own increment(s) and allow splitting across sessions.
- [The two builds drift in strictness] → Change both tsconfigs in the same commit and run both builds before considering an increment done.
- [Overuse of `!`/`any` erodes the benefit] → Treat them as exceptions, note them, and keep them rare.

## Migration Plan

1. Enable `noImplicitAny` in both tsconfigs; fix errors; verify both builds.
2. Enable `strictNullChecks`; fix errors (largest batch, may span commits/sessions); verify both builds.
3. Enable `strictPropertyInitialization`; fix errors; verify both builds.
4. Replace the per-flag settings with `strict: true`; remove explicit `strict: false`; fix residual sub-flag errors; verify both builds.
5. Rollback strategy: each increment is an isolated commit; revert the offending increment without affecting earlier ones.

## Open Questions

- Should `strictNullChecks` be split into multiple commits/sessions given its volume, or landed as one large increment? (Lean: split by area if it exceeds reviewable size.)
- Are there generated or vendored files under `src/**/*.ts` that should be excluded rather than fixed?
