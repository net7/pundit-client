## Why

The Angular 22 upgrade currently silences Dart Sass deprecation warnings for legacy `@import` usage and global color functions such as `lighten()`. Those constructs are scheduled to become hard errors in Dart Sass 3.0, so the stylesheets need to migrate while the build is still otherwise stable.

## What Changes

- Migrate SCSS entrypoints and dependent partials from `@import` to Sass modules with `@use` and `@forward`.
- Replace deprecated global color functions with module-scoped Sass color APIs, preserving the rendered color intent.
- Remove the Sass `silenceDeprecations` entries from `angular.json` once the project no longer emits those warnings.
- Verify the default Angular build and relevant style entrypoints still compile without Sass deprecation warnings.
- Keep runtime CSS output visually equivalent unless an explicit small correction is needed during migration.

## Capabilities

### New Capabilities
- `sass-deprecation-free-styles`: Covers the project's ability to compile SCSS with Dart Sass without relying on silenced deprecated language features.

### Modified Capabilities

## Impact

- Affected files include `angular.json`, SCSS entrypoints under `src/styles/`, their dependent partials, and any login-module style entrypoint referenced by the Angular build.
- The change affects build-time stylesheet compilation and generated CSS only; it should not alter TypeScript runtime behavior, public APIs, bundle wiring, or application logic.
- Verification requires rebuilding after removing the Sass deprecation silencing and checking that the migrated styles compile cleanly.
