## ADDED Requirements

### Requirement: Incremental strict flag adoption

The project SHALL adopt TypeScript strict type-checking by enabling individual strictness flags one at a time, in the order `noImplicitAny`, `strictNullChecks`, `strictPropertyInitialization`, then full `strict`. Each flag SHALL be enabled only after the build compiles cleanly with the previously enabled flags.

#### Scenario: Enabling a single strict flag

- **WHEN** a strictness flag is added to the TypeScript configuration
- **THEN** the type errors it surfaces are fixed before any further flag is enabled
- **AND** the codebase is left compiling cleanly with that flag on

#### Scenario: Each increment is independently shippable

- **WHEN** an individual strict flag has been enabled and its errors fixed
- **THEN** the default Angular build and the chrome-extension build both compile without TypeScript errors
- **AND** the change can be paused at that point without leaving the build broken

### Requirement: Behavior-preserving fixes

Fixes applied to satisfy strict type-checking SHALL be type-level changes only — type annotations, null/undefined guards, and class-property initialization or definite-assignment — and SHALL NOT alter runtime behavior, public APIs, or application logic.

#### Scenario: Fixing a strict-null error

- **WHEN** `strictNullChecks` reports a possibly-null or possibly-undefined access
- **THEN** the fix adds a guard, narrowing, or non-null assertion that preserves the original runtime behavior
- **AND** no business logic or public API signature is changed for runtime purposes

#### Scenario: Fixing an uninitialized property

- **WHEN** `strictPropertyInitialization` reports an uninitialized class property
- **THEN** the property is initialized, marked optional, or given a definite-assignment assertion consistent with how it is actually used at runtime

### Requirement: Synchronized strict configuration

The default Angular `tsconfig.json` and the chrome-extension `tsconfig.chrome-ext.json` SHALL apply the same strictness settings at every increment, so both build pipelines enforce identical type-checking.

#### Scenario: Strict flags kept in sync

- **WHEN** a strictness flag is enabled or changed in one tsconfig
- **THEN** the equivalent setting is applied in the other tsconfig
- **AND** both the default build and the chrome-extension build enforce the same strictness

### Requirement: Consolidation to strict true

Once all individual strict sub-flags compile cleanly, the configuration SHALL be consolidated to `strict: true`, and the redundant explicit `strict: false` SHALL be removed from both tsconfig files.

#### Scenario: Final consolidation

- **WHEN** the codebase compiles cleanly under all individual strict sub-flags
- **THEN** the per-flag settings are replaced by `strict: true`
- **AND** the explicit `strict: false` is removed from `tsconfig.json` and `tsconfig.chrome-ext.json`
- **AND** the build still compiles without TypeScript errors
