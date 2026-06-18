## ADDED Requirements

### Requirement: Standalone declarables

Every Angular component, directive, and pipe in the client app SHALL be standalone. A declarable MUST declare its own template dependencies via the `imports` array and MUST NOT rely on an `NgModule` declaration to compile.

#### Scenario: Component declares its own dependencies
- **WHEN** a component template uses another component, directive, or pipe
- **THEN** that dependency appears in the component's `imports` array
- **AND** the component compiles without being declared in any `NgModule`

#### Scenario: No NgModule declarations remain
- **WHEN** the migration is complete
- **THEN** no `@NgModule` with a `declarations` array exists in the app source
- **AND** `src/app/app.module.ts` has been removed

### Requirement: Application bootstrap via bootstrapApplication

The app SHALL bootstrap a root standalone component through `bootstrapApplication` with an `ApplicationConfig`, instead of `platformBrowserDynamic().bootstrapModule()`.

#### Scenario: Bootstrap uses standalone API
- **WHEN** the app starts in `src/main.ts`
- **THEN** it calls `bootstrapApplication(AppComponent, appConfig)`
- **AND** all application-wide providers are supplied through the `providers` array of the `ApplicationConfig`

#### Scenario: Dual-mode startup preserved
- **WHEN** the app boots in chrome-extension mode or in embed mode
- **THEN** the corresponding initialization logic (previously wired via `APP_INITIALIZER`) runs through the bootstrap providers
- **AND** behavior is unchanged from the NgModule-based bootstrap

### Requirement: Dependency injection via inject()

Components, directives, pipes, and services SHALL obtain their dependencies using the `inject()` function rather than constructor parameter injection.

#### Scenario: Class resolves dependencies with inject()
- **WHEN** a class needs an injectable dependency
- **THEN** it assigns the dependency from a call to `inject(Token)` in a field initializer
- **AND** no new constructor-parameter injection is introduced

#### Scenario: Services are tree-shakable
- **WHEN** a service is intended to be application-wide
- **THEN** it is registered with `@Injectable({ providedIn: 'root' })`
- **AND** it does not depend on `NgModule` provider registration

### Requirement: Feature configuration via provider functions

Feature configuration that was previously exposed through `NgModule.forRoot()` SHALL be exposed through a standalone provider function returning providers (an `EnvironmentProviders`/`Provider[]`).

#### Scenario: Login feature configured without a module
- **WHEN** the app configures the login feature with environment-specific settings
- **THEN** it adds a provider function (e.g. `providePunditLogin(config)`) to the bootstrap providers
- **AND** `PunditLoginModule.forRoot()` is no longer used
