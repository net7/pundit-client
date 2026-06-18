## Why

The Angular 22 / TypeScript 6 upgrade left the client on `strict: false`, explicitly pinned in `tsconfig.json` and `tsconfig.chrome-ext.json` to preserve the historically non-strict codebase. TypeScript 6 defaults `strict` on, and turning it on surfaces 600+ existing latent errors (implicit any, strict-null, uninitialized properties). Re-enabling strictness incrementally hardens type safety and aligns the project with the toolchain default before a future TypeScript 7 bump.

## What Changes

- Adopt TypeScript strict type-checking incrementally, enabling one flag at a time rather than flipping `strict: true` in a single step: `noImplicitAny` → `strictNullChecks` → `strictPropertyInitialization` → full `strict`.
- Fix the type errors surfaced by each flag (implicit any annotations, null/undefined guards, definite-assignment or initialization of class properties) without changing runtime behavior.
- Keep `tsconfig.json` and `tsconfig.chrome-ext.json` in sync so the default app build and the chrome-extension webpack build apply the same strictness.
- Once all individual flags pass, replace them with `strict: true` and remove the redundant explicit `strict: false`.
- Treat each flag as an independently shippable increment so the work can land across sessions without leaving the build broken.

## Capabilities

### New Capabilities
- `typescript-strict-typechecking`: Covers the project's ability to compile its TypeScript under strict type-checking flags, enabled incrementally and verified by a clean build at each step.

### Modified Capabilities

## Impact

- Affected configuration: `tsconfig.json` and `tsconfig.chrome-ext.json` (the `strict` flag and the individual strictness sub-flags).
- Affected code: TypeScript sources under `src/**/*.ts` that currently rely on implicit any, unchecked null/undefined, or uninitialized class properties — fixes are type-level annotations and guards, not behavioral changes.
- Affected builds: the default Angular `application` build and the chrome-extension `ts-loader` webpack build must both stay green after each increment.
- This is a large, code-quality-focused effort (600+ initial errors); it does not alter public APIs, bundle wiring, or application logic.
