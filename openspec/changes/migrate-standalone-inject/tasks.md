## 1. Baseline & Discovery

- [ ] 1.1 Confirm clean baseline on the branch: `ng build` succeeds and existing tests pass
- [ ] 1.2 Inventory all declarables in `AppModule.declarations` and confirm count (~23) for later cross-check
- [ ] 1.3 Grep all references to `PunditLoginModule` and its `forRoot()` config (including tests/secondary entry points) and list every call site
- [ ] 1.4 Document the dual-mode `APP_INITIALIZER` providers (chrome-ext vs embed) and the `BrowserModule` usage so they can be reproduced in `ApplicationConfig`

## 2. Convert Declarables to Standalone

- [ ] 2.1 Run `ng g @angular/core:standalone` in "Convert all components, directives and pipes to standalone" mode
- [ ] 2.2 Review the diff: confirm every component/directive/pipe has `standalone: true` and a populated `imports` array
- [ ] 2.3 Fix any declarables the schematic could not fully convert (dynamic usages, missing imports)
- [ ] 2.4 Verify `ng build` compiles with all declarables standalone

## 3. Remove NgModules & Convert Feature Config

- [ ] 3.1 Run `ng g @angular/core:standalone` in "Remove unnecessary NgModules" mode
- [ ] 3.2 Create a `providePunditLogin(config)` provider function returning the same providers as `PunditLoginModule.forRoot()`
- [ ] 3.3 Update all `forRoot()`/`ModuleWithProviders` call sites (from task 1.3) to use `providePunditLogin`
- [ ] 3.4 Confirm `pundit-login.module.ts` NgModule is removed or reduced to non-module providers only

## 4. Migrate Bootstrap

- [ ] 4.1 Run `ng g @angular/core:standalone` in "Bootstrap the application using standalone APIs" mode
- [ ] 4.2 Build the `ApplicationConfig` providers: move dual-mode `APP_INITIALIZER` logic verbatim and replace `BrowserModule` with its standalone-friendly providers
- [ ] 4.3 Replace `platformBrowserDynamic().bootstrapModule(AppModule)` with `bootstrapApplication(AppComponent, appConfig)` in `src/main.ts`
- [ ] 4.4 Delete `src/app/app.module.ts` and remove any remaining references to it
- [ ] 4.5 Verify `ng build` succeeds with the standalone bootstrap

## 5. Migrate Dependency Injection to inject()

- [ ] 5.1 Run `ng g @angular/core:inject` to convert constructor injection to `inject()`
- [ ] 5.2 Review the diff and fix sites the schematic left or mis-converted
- [ ] 5.3 Add `@Injectable({ providedIn: 'root' })` to application-wide services that relied on module registration
- [ ] 5.4 Verify no new constructor-parameter injection remains where `inject()` applies

## 6. Tests & Verification

- [ ] 6.1 Update `*.spec.ts` files: replace `TestBed.configureTestingModule({ declarations })` with standalone `imports`; remove `AppModule` references
- [ ] 6.2 Run the full test suite and fix failures
- [ ] 6.3 Build both targets (chrome-extension and embed) and confirm each succeeds
- [ ] 6.4 Smoke-test the chrome-extension runtime: confirm startup logic fires and the ShadowDom UI renders correctly
- [ ] 6.5 Smoke-test the embed runtime: confirm its initialization path fires and behavior is unchanged
- [ ] 6.6 Final review: confirm no `@NgModule` with `declarations` remains and `inject()` is the DI convention
