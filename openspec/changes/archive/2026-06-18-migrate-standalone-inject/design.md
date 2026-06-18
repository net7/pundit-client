## Context

The client is an Angular 22 Chrome-extension/embed app. Today it uses the legacy NgModule architecture: a single root `AppModule` declaring ~23 components/pipes plus `BrowserModule`, a feature module `PunditLoginModule` exposing config via `forRoot()`, traditional `platformBrowserDynamic().bootstrapModule(AppModule)` bootstrap, and constructor-based DI (~9 injection sites, 0 `inject()` calls). There is no router and no lazy-loaded modules, which keeps the migration surface small. The build uses the modern `@angular/build:application` (esbuild) builder and TypeScript strict mode is already on. The root component uses `ViewEncapsulation.ShadowDom`, and startup branches between chrome-ext and embed modes via multiple `APP_INITIALIZER` providers.

Angular 22 ships an official automated migration (`ng generate @angular/core:standalone`) plus an `inject()` migration (`ng generate @angular/core:inject`), which we will lean on rather than hand-converting every file.

## Goals / Non-Goals

**Goals:**
- All components, directives, and pipes become `standalone: true` with explicit `imports`.
- Bootstrap through `bootstrapApplication` + `ApplicationConfig`; delete `AppModule`.
- Convert constructor DI to `inject()` and adopt it as the going-forward convention.
- Replace `PunditLoginModule.forRoot()` with a `providePunditLogin(config)` provider function.
- Preserve dual-mode (chrome-ext vs embed) startup and ShadowDom behavior byte-for-byte at runtime.

**Non-Goals:**
- No introduction of the Angular Router or lazy loading.
- No signals/standalone-testing-harness migration of specs beyond what's required to keep them compiling.
- No behavioral/feature changes; this is a structural refactor only.
- No upgrade of the external `@pundit/*` / `@net7/*` packages.

## Decisions

**Use the official Angular schematics, in order.** Run the standalone migration in its three documented modes — (1) convert declarations to standalone, (2) remove unnecessary NgModules, (3) switch to `bootstrapApplication` — then run the `inject()` migration. Rationale: the schematics handle `imports` wiring and edge cases more reliably than manual edits, and produce a reviewable diff. Alternative considered: full manual conversion — rejected as slower and error-prone for 23 declarables. We still hand-review every diff and fix what the schematic can't (see below).

**Hand-convert `PunditLoginModule.forRoot()` to `providePunditLogin()`.** The standalone schematic does not refactor custom `ModuleWithProviders` config APIs. We introduce a provider function that returns the same providers `forRoot()` did and wire it into `ApplicationConfig`. Keep the function signature mirroring the old config object to minimize call-site churn. Alternative: keep the module and import it standalone — rejected because it leaves an NgModule in place, defeating the goal.

**Fold `APP_INITIALIZER` logic into `ApplicationConfig` providers unchanged.** The conditional chrome-ext/embed wiring moves verbatim into the `providers` array (Angular 22 supports `provideAppInitializer()` / `APP_INITIALIZER`). We do not redesign startup logic here. Rationale: isolate structural risk from behavioral risk.

**Keep `BrowserModule` concerns via `provideBrowser*` equivalents.** Replace `BrowserModule` import with the standalone-friendly providers it implied; animations (if any) move to their `provide*` form.

**Migrate `inject()` after standalone is green.** Sequencing the `inject()` schematic last means it runs against an already-compiling standalone tree, reducing interacting failures.

## Risks / Trade-offs

- **ShadowDom encapsulation regressions** → Manually smoke-test the rendered extension UI after bootstrap refactor; ShadowDom is set on the root component and must survive the `bootstrapApplication` switch.
- **Dual-mode startup breakage (chrome-ext vs embed)** → Build and load both targets; verify each `APP_INITIALIZER` path fires. This is the highest-risk area since it is bespoke.
- **`forRoot()` consumers outside AppModule** → Grep all references to `PunditLoginModule` and its config before deleting; ensure every call site moves to `providePunditLogin`.
- **External packages assuming NgModule context** (`@pundit/*`, `@net7/*`) → If a third-party module must be imported, import it directly into the consuming standalone component's `imports`; verify no `forRoot()` requirements there.
- **Schematic leaves redundant `imports` or misses dynamic usages** → Review diff; rely on strict typecheck + template type-checking (already enabled) and a clean `ng build` to catch gaps.
- **Spec/test files referencing `AppModule` or `TestBed.configureTestingModule({ declarations })`** → Update tests to import standalone declarables; expect churn in `*.spec.ts`.

## Migration Plan

1. Establish a clean baseline: `ng build` and tests green on the branch.
2. Run `ng g @angular/core:standalone` mode "Convert all components, directives and pipes to standalone".
3. Run mode "Remove unnecessary NgModules"; hand-convert `PunditLoginModule` to `providePunditLogin()` where the schematic leaves it.
4. Run mode "Bootstrap the application using standalone APIs"; move `APP_INITIALIZER`/dual-mode providers and `BrowserModule` equivalents into `ApplicationConfig`; delete `AppModule`.
5. Run `ng g @angular/core:inject` to convert constructor DI; add `providedIn: 'root'` to services as appropriate.
6. Fix tests, run full `ng build` for both chrome-ext and embed targets, smoke-test both runtime modes (incl. ShadowDom UI).
7. Rollback strategy: the work lives on a feature branch; each schematic step is a separate commit so any step can be reverted independently.

## Open Questions

- Are there `PunditLoginModule.forRoot()` consumers beyond `AppModule` (e.g. in tests or secondary entry points)? — to confirm during step 3.
- ~~Do any imported third-party modules (`@net7/*`) still require NgModule wiring?~~ **Resolved:** `@net7/core` (v4.1.0, `~/git/net7/neff/neff-core`) is framework-agnostic — no `@NgModule`/`forRoot()`/Angular dependency; it exports plain TS classes (`DataSource`, `EventHandler`, `LayoutBuilder`, `LayoutDataSource`, `Translate`, `Analytics`) used via direct import. Zero standalone blockers from `@net7/core`.
