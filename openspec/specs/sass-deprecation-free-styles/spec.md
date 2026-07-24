## Requirements

### Requirement: Styles compile without silenced Sass deprecations
The project SHALL compile its SCSS without relying on Sass deprecation silencing for `@import`, global built-ins, or global color functions.

#### Scenario: Sass deprecation silencing removed
- **WHEN** the Angular build configuration is inspected after the migration
- **THEN** `stylePreprocessorOptions.sass.silenceDeprecations` MUST NOT include `import`, `global-builtin`, or `color-functions`

#### Scenario: Default build emits no project-owned Sass deprecation warnings
- **WHEN** a developer runs `npm run build`
- **THEN** the build MUST complete without Sass deprecation warnings caused by project-owned SCSS

### Requirement: SCSS entrypoints use Sass modules
Project-owned SCSS entrypoints and dependent partials SHALL use Sass module syntax instead of deprecated Sass `@import` syntax.

#### Scenario: Main styles entrypoint migrated
- **WHEN** `src/styles/styles.scss` and its project-owned dependencies are inspected
- **THEN** they MUST use `@use` or `@forward` for project-owned Sass dependencies instead of Sass `@import`

#### Scenario: Login styles entrypoint migrated
- **WHEN** `src/app/login-module/styles/_import.scss` and its project-owned dependencies are inspected
- **THEN** they MUST use `@use` or `@forward` for project-owned Sass dependencies instead of Sass `@import`

#### Scenario: Component styles avoid deprecated project Sass imports
- **WHEN** component SCSS files that include project styles are inspected
- **THEN** they MUST NOT use deprecated Sass `@import` for project-owned SCSS dependencies

### Requirement: Third-party and CSS imports remain valid
The migration SHALL preserve valid inclusion of remote and third-party CSS resources.

#### Scenario: Remote font imports remain top-level
- **WHEN** component stylesheets include Google Fonts CSS imports
- **THEN** those imports MUST remain valid top-level CSS imports and MUST NOT be nested under selectors such as `:host`

#### Scenario: Package CSS remains available
- **WHEN** the application styles compile after the migration
- **THEN** third-party styles for Tagify and Tippy MUST remain included in the generated CSS where they were included before

### Requirement: Deprecated global color functions removed
Project-owned SCSS SHALL use module-scoped Sass color APIs instead of deprecated global color functions.

#### Scenario: Color helpers use sass:color
- **WHEN** project-owned SCSS is inspected after the migration
- **THEN** active stylesheet code MUST NOT call global `lighten()`, `darken()`, or `desaturate()`

#### Scenario: Color output remains visually equivalent
- **WHEN** deprecated color helpers are replaced
- **THEN** replacement expressions MUST preserve the intended rendered colors or document any deliberate visual difference

### Requirement: Style behavior remains equivalent
The Sass migration SHALL preserve the existing application and login module styling behavior.

#### Scenario: Main application styles still compile
- **WHEN** the default Angular application build runs
- **THEN** the migrated main style tree MUST compile successfully

#### Scenario: Embed and extension styles still compile
- **WHEN** embed or Chrome extension production builds run
- **THEN** the migrated style tree MUST compile successfully for those configurations

#### Scenario: Login module styles still compile
- **WHEN** the login module component stylesheet is compiled by Angular
- **THEN** its migrated style dependencies MUST resolve without missing variable, mixin, or namespace errors
