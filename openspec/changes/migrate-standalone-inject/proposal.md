## Why

The client app is built entirely on NgModules with constructor-based dependency injection, the legacy pattern that Angular has been steering away from since v14. On Angular 22 the standalone APIs are the default and recommended path: NgModules add boilerplate, obscure a component's real dependencies, and block the ergonomics that `inject()` enables (cleaner inheritance, mixins, functional guards/resolvers, and DI in field initializers). Migrating now — while the surface is small (~23 declarables, 2 modules) and there is no routing or lazy-loading to untangle — keeps the codebase aligned with current Angular idioms and the existing strict-typechecking conventions.

## What Changes

- Convert all components, directives, and pipes (~23 declarables) to `standalone: true`, each declaring its own `imports`.
- Migrate `main.ts` from `platformBrowserDynamic().bootstrapModule(AppModule)` to `bootstrapApplication(AppComponent, { providers: [...] })`.
- Remove `AppModule` and fold its providers (including the dual-mode `APP_INITIALIZER` chrome-ext/embed logic and `BrowserModule`) into `ApplicationConfig` providers.
- Replace `PunditLoginModule.forRoot()` usage with a standalone provider function (e.g. `providePunditLogin(config)`) wired into the bootstrap providers. **BREAKING** for the module's public API surface.
- Migrate constructor injection to the `inject()` function across components and services (~9 sites today), establishing `inject()` as the project convention.
- Add `providedIn: 'root'` to services where appropriate so they no longer rely on module-level registration.
- Verify ShadowDom encapsulation and dual-build (chrome-ext vs embed) initialization still work after the bootstrap refactor.

## Capabilities

### New Capabilities
- `angular-standalone-architecture`: Establishes the project convention that all Angular building blocks are standalone, the app bootstraps via `bootstrapApplication` with `ApplicationConfig`, dependencies are resolved with `inject()`, and feature configuration is exposed through provider functions rather than `NgModule.forRoot()`.

### Modified Capabilities
<!-- None — existing specs (linting-toolchain, sass-deprecation-free-styles, typescript-strict-typechecking) cover orthogonal toolchain concerns and their requirements are unchanged. -->

## Impact

- **Bootstrap**: `src/main.ts`, removal of `src/app/app.module.ts`.
- **Feature module**: `src/app/login-module/lib/pundit-login-module/pundit-login.module.ts` and its `forRoot()`/`ModuleWithProviders` consumers — converted to a provider function (breaking for that module's API).
- **Declarables**: all `*.component.ts`, `*.directive.ts`, `*.pipe.ts` gain `standalone: true` + explicit `imports`.
- **Services**: ~17 services reviewed for `providedIn: 'root'`; constructor DI replaced with `inject()`.
- **Build/runtime**: dual-mode `APP_INITIALIZER` startup logic and ShadowDom encapsulation must be re-validated; no routing or lazy modules are affected.
- **Dependencies**: relies on existing `@angular/*` v22 and `@angular/build:application` builder; no new packages. External git-based packages (`@pundit/*`, `@net7/*`) consumed as-is.
